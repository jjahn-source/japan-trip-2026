// Shared plumbing for the itinerary agent: settings from .env, an on-disk cache every external call
// goes through (so a re-run is cheap and an interrupted run resumes), HTTP with retries, and a
// compactor that turns any API's JSON into the short digest a model can read.
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const CACHE_DIR = resolve(ROOT, 'planner/.cache');

// .env first, then the Cloudflare-style .dev.vars; real environment variables win over both.
for (const f of ['.env', '.dev.vars']) {
  const p = resolve(ROOT, f);
  if (!existsSync(p)) continue;
  for (const line of readFileSync(p, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m && m[2] && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}
export const key = (name: string) => process.env[name]?.trim() || undefined;

export const log = (...a: unknown[]) => console.log(`[${new Date().toISOString().slice(11, 19)}]`, ...a);
export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Run `fn` over `items` with at most `n` in flight; results keep their order. */
export async function pool<T, R>(items: T[], n: number, fn: (x: T, i: number) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let next = 0;
  await Promise.all(Array.from({ length: Math.min(n, items.length) }, async () => {
    while (next < items.length) { const i = next++; out[i] = await fn(items[i], i); }
  }));
  return out;
}

/** Cached for `ttlDays` (default 7): the same question is never paid for twice in a week. */
export async function cached<T>(ns: string, keyParts: unknown, fn: () => Promise<T>, ttlDays = 7): Promise<T> {
  const h = createHash('sha256').update(JSON.stringify(keyParts)).digest('hex').slice(0, 24);
  const file = resolve(CACHE_DIR, ns, `${h}.json`);
  if (existsSync(file)) {
    const hit = JSON.parse(readFileSync(file, 'utf8')) as { at: number; value: T };
    if (Date.now() - hit.at < ttlDays * 864e5) return hit.value;
  }
  const value = await fn();
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, JSON.stringify({ key: keyParts, at: Date.now(), value }));
  return value;
}

export class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) { super(message); this.status = status; }
}
/** fetch → JSON, with a timeout and retries on 429/5xx/network errors. */
export async function http<T = unknown>(url: string, init: RequestInit & { timeoutMs?: number } = {}, tries = 3): Promise<T> {
  let last: unknown;
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url, { ...init, signal: AbortSignal.timeout(init.timeoutMs ?? 60000) });
      const text = await res.text();
      if (res.ok) return (text ? JSON.parse(text) : null) as T;
      last = new HttpError(res.status, `${res.status} ${text.slice(0, 300)}`);
      if (res.status !== 429 && res.status < 500) throw last;
    } catch (e) {
      if (e instanceof HttpError && e.status !== 429 && e.status < 500) throw e;
      last = e;
    }
    await sleep(1500 * 2 ** i);
  }
  throw last;
}

// Field names worth keeping from any social/web API reply, whatever its shape.
const KEEP = /^(id|aweme_id|note_id|code|shortcode|pk|title|desc|description|caption|text|content|snippet|body|name|display_name|nickname|username|author|unique_id|location|location_name|poi_name|poi|address|city|lat|lng|latitude|longitude|play_count|view_count|digg_count|like_count|likes|comment_count|collect_count|share_count|score|num_comments|ups|rating|create_time|created_at|taken_at|date|published|time|url|link|share_url|permalink|web_url|video_url|play_addr|subreddit|hashtags|tags)$/i;
/**
 * A short digest of an arbitrary JSON reply: keeps the fields above (recursively), drops the rest,
 * clips long strings and lists, so 200 KB of TikTok JSON becomes a few KB a model can read.
 */
export function compact(v: unknown, depth = 0, maxItems = 20): unknown {
  if (v == null || typeof v === 'number' || typeof v === 'boolean') return v;
  if (typeof v === 'string') return v.length > 600 ? `${v.slice(0, 600)}…` : v;
  if (depth > 7) return undefined;
  if (Array.isArray(v)) {
    const out = v.slice(0, maxItems).map((x) => compact(x, depth + 1, maxItems)).filter((x) => x !== undefined && !(typeof x === 'object' && x && !Array.isArray(x) && !Object.keys(x).length));
    return out.length ? out : undefined;
  }
  if (typeof v === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, x] of Object.entries(v as Record<string, unknown>)) {
      if (KEEP.test(k) && (typeof x !== 'object' || x === null)) { const c = compact(x, depth + 1, maxItems); if (c !== undefined && c !== '') out[k] = c; continue; }
      // Plain lists (bitrates, sizes, ids) only matter under a useful key, e.g. hashtags.
      if (Array.isArray(x) && x.every((y) => typeof y !== 'object' || y === null) && !KEEP.test(k)) continue;
      if (typeof x === 'object' && x !== null) { const c = compact(x, depth + 1, maxItems); if (c !== undefined && (Array.isArray(c) ? c.length : Object.keys(c as object).length)) out[k] = c; }
    }
    return Object.keys(out).length ? out : undefined;
  }
  return undefined;
}
/** Compact JSON as text, clipped to `max` characters. */
export const digest = (v: unknown, max = 12000) => { const s = JSON.stringify(compact(v) ?? null); return s.length > max ? `${s.slice(0, max)}…(clipped)` : s; };

export const readJson = <T>(p: string, fallback: T): T => (existsSync(p) ? JSON.parse(readFileSync(p, 'utf8')) as T : fallback);
export function writeJson(p: string, v: unknown) { mkdirSync(dirname(p), { recursive: true }); writeFileSync(p, `${JSON.stringify(v, null, 2)}\n`); }

export const km = (a: { lat: number; lng: number }, b: { lat: number; lng: number }) => {
  const r = Math.PI / 180, dLat = (b.lat - a.lat) * r, dLng = (b.lng - a.lng) * r;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(dLng / 2) ** 2;
  return 12742 * Math.asin(Math.sqrt(h));
};
