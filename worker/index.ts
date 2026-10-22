// The live layer: one Cloudflare Worker in front of the built site (dist/, served as static assets).
// A small API on D1 keeps the group's changes to the plan, the shared booking ticks and each phone's
// alert subscription. It pushes a notification when someone changes the plan, and a cron run every
// minute sends what's due: leave now, the last train home, booking deadlines. On the trip's mornings it
// also asks Google Maps about the next two days' stops and warns when one will be closed (runGoogle).
// And the search box's "open now near us" asks Google Places through it (/api/nearby), so the key stays here.
//
// Sized for Cloudflare's free plan: a phone's check and the cron run read one row (the snapshot) rather
// than the history; a check that has the latest state gets a few bytes back; pushes per run, phones,
// and request bodies are capped so no run can go past 10 ms of CPU or 50 outgoing requests.
import { alertsFor, applyChange, applyPlan, clean, describe, EMPTY, exists, type Alert, type AlertKind, type Change, type Kind, type Live, type LivePlan } from '../src/lib/live';
import { closedNews, LIVE_FIELDS, type LiveDetails } from '../src/lib/google-hours';
import { calendar } from '../src/lib/ics';
import { weatherNews, type JmaAlert } from '../src/lib/jma';
import { NEARBY_FIELDS, NEARBY_M, nearbyQuery, nearbyRows, type GPlace } from '../src/lib/nearby';
import { send, type Message, type Vapid } from './push';

interface Meta { last_row_id: number; changes: number; rows_read?: number }
interface Stmt { bind(...v: unknown[]): Stmt; all<T = Record<string, unknown>>(): Promise<{ results: T[]; meta: Meta }>; run(): Promise<{ meta: Meta }>; first<T = Record<string, unknown>>(): Promise<T | null> }
interface DB { prepare(q: string): Stmt; batch(s: Stmt[]): Promise<{ meta: Meta }[]> }
interface Env {
  ASSETS: { fetch(req: Request): Promise<Response> };
  DB: DB;
  VAPID_PUBLIC_KEY?: string; VAPID_PRIVATE_KEY?: string; VAPID_SUBJECT?: string;
  /** The morning hours check (runGoogle); without it the check is off. A secret: `wrangler secret put`. */
  GOOGLE_MAPS_API_KEY?: string;
  /** "1" in .dev.vars: allows local push endpoints, the /api/debug routes and the rows-read header. */
  DEV?: string;
}
interface Ctx { waitUntil(p: Promise<unknown>): void }
interface SubRow { id: number; endpoint: string; p256dh: string; auth: string; device: string | null; name: string | null; tz: string | null; prefs: string }

const KINDS: Kind[] = ['stop', 'todo', 'day'];
const ALERTS: AlertKind[] = ['leave', 'last', 'due', 'changes', 'closed', 'weather'];
/** Where a phone's push subscription can point: the browsers' own push services, nothing else. */
const PUSH_HOSTS = /(^|\.)(push\.apple\.com|fcm\.googleapis\.com|push\.services\.mozilla\.com|notify\.windows\.com)$/;
/** A cron run sends what fell due since the last few runs (a missed run still sends): a quarter of an
 *  hour for the time-critical alerts, six hours for a deadline reminder (late beats never). */
const WINDOW = 15 * 60e3;
const windowFor = (k: AlertKind) => (k === 'due' ? 6 * 3600e3 : WINDOW);
/** When a run can't send everything, the ones that can't wait go first. */
const URGENCY: Record<AlertKind, number> = { leave: 0, last: 0, changes: 1, closed: 1, weather: 1, due: 2 };
/** Pushes one run may send (~0.4 ms of CPU each); the rest go a minute later, still in the window. */
const MAX_PUSH = 20;
const MAX_SUBS = 40;
const MAX_BODY = 8192;

/** Saves one address may make a minute: generous for eight phones (an offline queue sends in a burst),
 *  tight enough that a script can't spend the day's free D1 writes. Counted in D1 against a hash of the
 *  address, so it holds across every Cloudflare instance (an in-memory count doesn't: requests spread). */
const SAVES_PER_MINUTE = 60;
const hashIp = async (ip: string) => [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`jt:${ip}`)))].slice(0, 8).map((b) => b.toString(16).padStart(2, '0')).join('');
/** Alert sign-ups and test pushes: a looser count in this instance (an unchanged sign-up writes nothing). */
const buckets = new Map<string, { n: number; reset: number }>();
function allow(key: string, max: number): boolean {
  const now = Date.now(), b = buckets.get(key);
  if (!b || now > b.reset) { if (buckets.size > 5000) buckets.clear(); buckets.set(key, { n: 1, reset: now + 60e3 }); return true; }
  return ++b.n <= max;
}
const slowDown = () => json({ error: 'too many changes at once: try again in a minute' }, 429, { 'retry-after': '60' });

/** Counts D1's rows read for this request (shown as x-rows-read when DEV). */
function metered(db: DB, count: { rows: number }): DB {
  const raw = new WeakMap<Stmt, Stmt>(); // batch() only takes D1's own statements
  const wrap = (s: Stmt): Stmt => {
    const w: Stmt = {
      bind: (...v) => wrap(s.bind(...v)),
      all: async <T>() => { const r = await s.all<T>(); count.rows += r.meta?.rows_read ?? 0; return r; },
      run: async () => { const r = await s.run(); count.rows += r.meta?.rows_read ?? 0; return r; },
      first: async <T>() => { const r = await s.all<T>(); count.rows += r.meta?.rows_read ?? 0; return r.results[0] ?? null; },
    };
    raw.set(w, s);
    return w;
  };
  return { prepare: (q) => wrap(db.prepare(q)), batch: async (st) => { const r = await db.batch(st.map((x) => raw.get(x) ?? x)); for (const x of r) count.rows += x.meta?.rows_read ?? 0; return r; } };
}
const json = (v: unknown, status = 200, extra: Record<string, string> = {}) => new Response(JSON.stringify(v), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...extra } });

let planCache: { at: number; plan: LivePlan } | null = null;
async function plan(env: Env): Promise<LivePlan> {
  if (planCache && Date.now() - planCache.at < 60e3) return planCache.plan;
  const r = await env.ASSETS.fetch(new Request('https://assets.local/live-plan.json'));
  if (!r.ok) throw new Error(`live-plan.json: ${r.status}`);
  planCache = { at: Date.now(), plan: await r.json() };
  return planCache.plan;
}

/** The current state: the snapshot, brought up to date with any changes saved after it (normally
 *  none). Only a save, or a cron run after an interrupted save, reads history rows, and only new ones. */
async function current(env: Env): Promise<Live> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const snap = await env.DB.prepare('SELECT v, state FROM snapshot WHERE id = 1').first<{ v: number; state: string }>();
    let s: Live = snap ? JSON.parse(snap.state) : EMPTY;
    const { results } = await env.DB.prepare('SELECT id, kind, target, patch, author, at FROM changes WHERE id > ? ORDER BY id').bind(s.v).all<Omit<Change, 'patch' | 'device'> & { patch: string }>();
    if (!results.length) return s;
    for (const r of results) s = applyChange(s, { ...r, patch: JSON.parse(r.patch), device: null });
    // Written only if nobody else moved the snapshot meanwhile; otherwise start again from theirs.
    const w = await env.DB.prepare('UPDATE snapshot SET v = ?, state = ? WHERE id = 1 AND v = ?').bind(s.v, JSON.stringify(s), snap?.v ?? 0).run();
    if (w.meta.changes) return s;
  }
  throw new Error('snapshot kept moving');
}

const vapid = (env: Env): Vapid | null => env.VAPID_PUBLIC_KEY && env.VAPID_PRIVATE_KEY ? { publicKey: env.VAPID_PUBLIC_KEY, privateKey: env.VAPID_PRIVATE_KEY, subject: env.VAPID_SUBJECT || 'https://github.com/' } : null;
const ALL_ON: Record<AlertKind, boolean> = { leave: true, last: true, due: true, changes: true, closed: true, weather: true };
const prefsOf = (s: SubRow): Record<AlertKind, boolean> => { try { return { ...ALL_ON, ...JSON.parse(s.prefs) }; } catch { return { ...ALL_ON }; } };

/** Sends to each phone; forgets the ones that have gone. */
async function deliver(env: Env, jobs: { sub: SubRow; msg: Message; ttl?: number }[]): Promise<number> {
  const v = vapid(env);
  if (!v) return 0;
  let ok = 0;
  await Promise.all(jobs.slice(0, MAX_PUSH).map(async ({ sub, msg, ttl }) => {
    const r = await send(sub, msg, v, { ttl });
    if (r.ok) ok++;
    if (r.gone) await env.DB.prepare('DELETE FROM subs WHERE id = ?').bind(sub.id).run();
  }));
  return ok;
}

/** Everything due in the window ending `now`, sent once to each phone that wants it. */
async function runAlerts(env: Env, now: number): Promise<{ sub: number; key: string }[]> {
  const subs = (await env.DB.prepare('SELECT * FROM subs').all<SubRow>()).results;
  if (!subs.length) return [];
  const live = applyPlan(await plan(env), await current(env));
  const byTz = new Map<string, Alert[]>();
  const due: { sub: SubRow; alert: Alert }[] = [];
  for (const sub of subs) {
    const tz = sub.tz || 'Asia/Tokyo';
    if (!byTz.has(tz)) byTz.set(tz, alertsFor(live, tz).filter((a) => a.at <= now && a.at > now - windowFor(a.kind)));
    const prefs = prefsOf(sub);
    for (const alert of byTz.get(tz)!) if (prefs[alert.kind]) due.push({ sub, alert });
  }
  if (!due.length) return [];
  // Which of these already went out: looked up by key (an index hit each), only when something is due.
  const keys = due.map((d) => `${d.alert.key}|${d.sub.id}`);
  const sent = new Set<string>();
  for (let i = 0; i < keys.length; i += 90) {
    const chunk = keys.slice(i, i + 90);
    const { results } = await env.DB.prepare(`SELECT key FROM sent WHERE key IN (${chunk.map(() => '?').join(',')})`).bind(...chunk).all<{ key: string }>();
    for (const r of results) sent.add(r.key);
  }
  const todo = due.filter((_, i) => !sent.has(keys[i]))
    .sort((a, b) => URGENCY[a.alert.kind] - URGENCY[b.alert.kind] || a.alert.at - b.alert.at).slice(0, MAX_PUSH);
  if (!todo.length) return [];
  // Marked sent first, so an overlapping run can't send it twice.
  await env.DB.batch(todo.map((d) => env.DB.prepare('INSERT OR IGNORE INTO sent (key, at) VALUES (?, ?)').bind(`${d.alert.key}|${d.sub.id}`, now)));
  await deliver(env, todo.map(({ sub, alert }) => ({ sub, msg: { title: alert.title, body: alert.body, url: alert.url, tag: alert.key }, ttl: alert.kind === 'due' ? 12 * 3600 : 15 * 60 })));
  await env.DB.prepare('DELETE FROM sent WHERE at < ?').bind(now - 7 * 864e5).run();
  return todo.map((d) => ({ sub: d.sub.id, key: d.alert.key }));
}

// ── The morning hours check: Google Maps' real hours for the next two days ──
// Google gives a place's dated hours (holidays, the year end) only for the coming week, so the build can't
// see them in October. Each morning of the trip, between 07:00 and 08:00 Japan time, the cron asks Google
// about every stop starting in the next 48 hours (moved and cancelled stops as the group left them), a
// few a run, each stop once a day, and pushes only news: closed, closing early, or gone.
const CHECK_HOUR = 7;
const AHEAD = 48 * 3600e3;
/** Google calls a run may make: with MAX_PUSH, well under the 50 outgoing requests a run may use. */
const CHECKS_PER_RUN = 10;
export type Lookup = (placeId: string) => Promise<LiveDetails | null>;
const googleLookup = (key: string): Lookup => async (id) => {
  const r = await fetch(`https://places.googleapis.com/v1/places/${encodeURIComponent(id)}`, { headers: { 'X-Goog-Api-Key': key, 'X-Goog-FieldMask': LIVE_FIELDS } });
  return r.ok ? (r.json() as Promise<LiveDetails>) : null;
};

async function runGoogle(env: Env, now: number, lookup?: Lookup): Promise<{ stop: string; news: string | null }[]> {
  const ask = lookup ?? (env.GOOGLE_MAPS_API_KEY ? googleLookup(env.GOOGLE_MAPS_API_KEY) : null);
  const jst = new Date(now + 9 * 3600e3);
  if (!ask || jst.getUTCHours() !== CHECK_HOUR) return [];
  const p = await plan(env);
  const soon = p.stops.filter((s) => s.g && Date.parse(s.s) > now && Date.parse(s.s) < now + AHEAD);
  if (!soon.length) return [];
  const today = jst.toISOString().slice(0, 10);
  const done = new Set((await env.DB.prepare('SELECT stop FROM gchecks WHERE day = ?').bind(today).all<{ stop: string }>()).results.map((r) => r.stop));
  if (soon.every((s) => done.has(s.id))) return [];
  const live = applyPlan(p, await current(env));
  const todo = live.stops.filter((s) => s.g && !s.cancelled && !done.has(s.id) && Date.parse(s.s) > now && Date.parse(s.s) < now + AHEAD).slice(0, CHECKS_PER_RUN);
  const found = await Promise.all(todo.map(async (s) => {
    const d = await ask(s.g!).catch(() => null);
    return { s, d, news: d ? closedNews(s, d, today) : null };
  }));
  // A failed lookup isn't recorded, so the next run tries it again.
  const asked = found.filter((x) => x.d);
  if (asked.length) await env.DB.batch(asked.map((x) => env.DB.prepare('INSERT OR IGNORE INTO gchecks (day, stop, news, at) VALUES (?, ?, ?, ?)').bind(today, x.s.id, x.news?.kind ?? null, now)));
  await pushOnce(env, now, found.filter((x) => x.news).map(({ s, news }) => ({ key: `closed:${s.id}:${s.s.slice(0, 10)}:${news!.kind}`, kind: 'closed', at: now, title: news!.title, body: news!.body, url: `/day/${s.d}/#${s.id}` })));
  await env.DB.prepare('DELETE FROM gchecks WHERE at < ?').bind(now - 7 * 864e5).run();
  return found.map((x) => ({ stop: x.s.id, news: x.news?.kind ?? (x.d ? null : 'lookup failed') }));
}

// ── Open now near us: Google Places for the search box ──
/** Google searches a day for everyone together (the link is public), and per phone address a minute. */
const NEARBY_PER_DAY = 250;
const NEARBY_PER_MINUTE = 8;
/** The same search from the same block (~100 m) within five minutes is answered from the cache. */
const NEARBY_TTL = 300;

async function nearby(req: Request, env: Env, ctx: Ctx, ip: string, limited: boolean): Promise<Response> {
  if (!env.GOOGLE_MAPS_API_KEY) return json({ error: 'live Google search is off on this server' }, 503);
  const u = new URL(req.url);
  const want = nearbyQuery(u.searchParams.get('q'), Number(u.searchParams.get('lat')), Number(u.searchParams.get('lng')));
  if (!want) return json({ error: 'send q, and a lat and lng in Japan' }, 400);
  const group = u.searchParams.get('group') !== '0';
  const cacheKey = new Request(`https://nearby.local/?q=${encodeURIComponent(want.q.toLowerCase())}&lat=${want.lat}&lng=${want.lng}&g=${group ? 1 : 0}`);
  const cache = (globalThis as unknown as { caches?: { default: { match(r: Request): Promise<Response | undefined>; put(r: Request, res: Response): Promise<void> } } }).caches?.default;
  const hit = await cache?.match(cacheKey);
  if (hit) return hit;
  if (limited && !allow(`n:${ip}`, NEARBY_PER_MINUTE)) return slowDown();
  const day = new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10);
  const used = await env.DB.prepare('INSERT INTO gquota (day, n) VALUES (?, 1) ON CONFLICT(day) DO UPDATE SET n = n + 1 RETURNING n').bind(day).first<{ n: number }>();
  if ((used?.n ?? 0) > NEARBY_PER_DAY) return json({ error: `the group has used today's ${NEARBY_PER_DAY} Google searches: the offline search still works` }, 429);
  const at = { lat: want.lat, lng: want.lng };
  const r = await fetch('https://places.googleapis.com/v1/places:searchText', {
    method: 'POST',
    headers: { 'X-Goog-Api-Key': env.GOOGLE_MAPS_API_KEY, 'Content-Type': 'application/json', 'X-Goog-FieldMask': NEARBY_FIELDS },
    body: JSON.stringify({ textQuery: want.q, openNow: true, pageSize: 15, languageCode: 'en', regionCode: 'JP', locationBias: { circle: { center: { latitude: at.lat, longitude: at.lng }, radius: NEARBY_M / 2 } } }),
  });
  if (!r.ok) return json({ error: 'Google Maps did not answer: try again' }, 502);
  const rows = nearbyRows(((await r.json()) as { places?: GPlace[] }).places, at, group);
  const res = json({ q: want.q, rows }, 200, { 'cache-control': `public, max-age=${NEARBY_TTL}` });
  if (cache) ctx.waitUntil(cache.put(cacheKey, res.clone()));
  return res;
}

/** Sends each alert once to every phone that wants its kind (the morning checks' news), up to MAX_PUSH. */
async function pushOnce(env: Env, now: number, alerts: Alert[]) {
  // The same alert from two checks in one run goes out once.
  alerts = [...new Map<string, Alert>(alerts.map((a): [string, Alert] => [a.key, a]).reverse()).values()];
  if (!alerts.length) return;
  const subs = (await env.DB.prepare('SELECT * FROM subs').all<SubRow>()).results;
  const jobs = subs.flatMap((sub) => alerts.filter((a) => prefsOf(sub)[a.kind]).map((alert) => ({ sub, alert, key: `${alert.key}|${sub.id}` })));
  const sent = new Set<string>();
  for (let i = 0; i < jobs.length; i += 90) {
    const chunk = jobs.slice(i, i + 90).map((j) => j.key);
    for (const r of (await env.DB.prepare(`SELECT key FROM sent WHERE key IN (${chunk.map(() => '?').join(',')})`).bind(...chunk).all<{ key: string }>()).results) sent.add(r.key);
  }
  const out = jobs.filter((j) => !sent.has(j.key)).slice(0, MAX_PUSH);
  if (!out.length) return;
  await env.DB.batch(out.map((j) => env.DB.prepare('INSERT OR IGNORE INTO sent (key, at) VALUES (?, ?)').bind(j.key, now)));
  await deliver(env, out.map(({ sub, alert }) => ({ sub, msg: { title: alert.title, body: alert.body, url: alert.url, tag: alert.key }, ttl: 12 * 3600 })));
}

// ── Weather warnings: Japan Meteorological Agency warnings, through Google's Weather API ──
// At 07:00 Japan time, once a day: where the group is today and tomorrow (each day's place), warnings only.
export type AlertsAt = (lat: number, lng: number) => Promise<JmaAlert[] | null>;
const googleAlerts = (key: string): AlertsAt => async (lat, lng) => {
  const r = await fetch(`https://weather.googleapis.com/v1/publicAlerts:lookup?key=${encodeURIComponent(key)}&location.latitude=${lat}&location.longitude=${lng}&languageCode=en`);
  return r.ok ? (((await r.json()) as { weatherAlerts?: JmaAlert[] }).weatherAlerts ?? []) : null;
};
async function runWeather(env: Env, now: number, lookup?: AlertsAt): Promise<{ place: string; warnings: number }[]> {
  const ask = lookup ?? (env.GOOGLE_MAPS_API_KEY ? googleAlerts(env.GOOGLE_MAPS_API_KEY) : null);
  const jst = new Date(now + 9 * 3600e3);
  if (!ask || jst.getUTCHours() !== CHECK_HOUR) return [];
  const today = jst.toISOString().slice(0, 10), tomorrow = new Date(now + 33 * 3600e3).toISOString().slice(0, 10);
  const days = (await plan(env)).days.filter((d) => d.at && (d.date === today || d.date === tomorrow));
  // One check per city a day (today's wins over tomorrow's in the same city); recorded like the stop checks.
  const places = [...new Map(days.map((d): [string, (typeof days)[number]] => [`wx:${d.city ?? `${d.at![0].toFixed(2)},${d.at![1].toFixed(2)}`}`, d]).reverse()).entries()];
  if (!places.length) return [];
  const done = new Set((await env.DB.prepare('SELECT stop FROM gchecks WHERE day = ?').bind(today).all<{ stop: string }>()).results.map((r) => r.stop));
  const todo = places.filter(([k]) => !done.has(k));
  if (!todo.length) return [];
  const found = await Promise.all(todo.map(async ([k, d]) => ({ k, d, alerts: await ask(d.at![0], d.at![1]).catch(() => null) })));
  const asked = found.filter((x) => x.alerts);
  if (asked.length) await env.DB.batch(asked.map((x) => env.DB.prepare('INSERT OR IGNORE INTO gchecks (day, stop, news, at) VALUES (?, ?, ?, ?)').bind(today, x.k, String(weatherNews(x.alerts!, '', '').length), now)));
  const label = (d: (typeof days)[number]) => `${d.city ?? 'your area'}${d.date === today ? ' today' : ' tomorrow'}`;
  await pushOnce(env, now, asked.flatMap((x) => weatherNews(x.alerts!, label(x.d), `/day/${x.d.n}/`).map((w) => ({ ...w, kind: 'weather' as const, at: now }))));
  return asked.map((x) => ({ place: label(x.d), warnings: weatherNews(x.alerts!, '', '').length }));
}

/** A JSON body of at most 8 KB (a body without a declared length is refused, not read). */
async function body(req: Request): Promise<Record<string, unknown> | null> {
  const len = Number(req.headers.get('content-length') ?? NaN);
  if (!(len > 0 && len <= MAX_BODY)) return null;
  try { const b = JSON.parse(await req.text()); return b && typeof b === 'object' && !Array.isArray(b) ? b as Record<string, unknown> : null; } catch { return null; }
}
const str = (v: unknown, max: number) => (typeof v === 'string' && v.trim() && v.length <= max ? v.trim() : null);

async function api(req: Request, env: Env, ctx: Ctx, path: string): Promise<Response> {
  const method = req.method;
  // Locally the limits apply only when a test asks for them (the stress test saves 1,000 at once).
  const limited = env.DEV !== '1' || req.headers.get('x-test-limits') === '1';
  const ip = (env.DEV === '1' && req.headers.get('x-test-ip')) || req.headers.get('cf-connecting-ip') || 'local';
  if (limited && method === 'POST' && /^\/api\/(subscribe|unsubscribe|push-test)$/.test(path) && !allow(`s:${ip}`, 10)) return slowDown();
  if (path === '/api/state' && method === 'GET') {
    const s = await current(env);
    // A phone that already has this version gets a few bytes back.
    return Number(new URL(req.url).searchParams.get('v')) === s.v && s.v > 0 ? json({ v: s.v, same: true }) : json(s);
  }

  if (path === '/api/changes' && method === 'POST') {
    const b = await body(req);
    if (!b) return json({ error: 'send one change as JSON, under 8 KB' }, 400);
    const kind = b.kind as Kind, target = str(b.target, 40), author = str(b.author, 40);
    if (!KINDS.includes(kind) || !target) return json({ error: 'kind and target are required' }, 400);
    if (!author) return json({ error: 'add your name so the group knows who changed it' }, 400);
    const p = await plan(env);
    if (!exists(p, kind, target)) return json({ error: `no ${kind} ${target} in the plan` }, 404);
    const patch = clean(kind, b.patch);
    if (typeof patch === 'string') return json({ error: patch }, 400);
    const device = str(b.device, 64);
    const at = Date.now();
    const who = await hashIp(ip);
    if (limited) {
      const recent = await env.DB.prepare('SELECT COUNT(*) AS n FROM changes WHERE ip = ? AND at > ?').bind(who, at - 60e3).first<{ n: number }>();
      if ((recent?.n ?? 0) >= SAVES_PER_MINUTE) return slowDown();
    }
    const r = await env.DB.prepare('INSERT INTO changes (kind, target, patch, author, device, at, ip) VALUES (?, ?, ?, ?, ?, ?, ?)').bind(kind, target, JSON.stringify(patch), author, device, at, who).run();
    const change: Change = { id: r.meta.last_row_id, kind, target, patch, author, device, at };
    const state = await current(env);
    ctx.waitUntil((async () => {
      const subs = (await env.DB.prepare('SELECT * FROM subs').all<SubRow>()).results.filter((s) => prefsOf(s).changes && (!device || s.device !== device));
      const m = describe(change, p);
      await deliver(env, subs.map((sub) => ({ sub, msg: { ...m, tag: `change:${kind}:${target}` } })));
    })());
    return json(state);
  }

  if (path === '/api/push-key' && method === 'GET') return json({ key: env.VAPID_PUBLIC_KEY ?? null });

  if (path === '/api/nearby' && method === 'GET') return nearby(req, env, ctx, ip, limited);

  // The trip as a calendar to subscribe to (Google Calendar: "From URL"), with the group's changes on it.
  if (path === '/api/calendar.ics' && method === 'GET') {
    const live = applyPlan(await plan(env), await current(env));
    return new Response(calendar(live.stops, new URL(req.url).origin, Date.now()), { headers: { 'content-type': 'text/calendar; charset=utf-8', 'cache-control': 'public, max-age=600' } });
  }

  if (path === '/api/subscribe' && method === 'POST') {
    const b = await body(req);
    const sub = b?.subscription as { endpoint?: string; keys?: { p256dh?: string; auth?: string } } | undefined;
    let host = '';
    try { const u = new URL(sub?.endpoint ?? ''); host = u.protocol === 'https:' || env.DEV === '1' ? u.hostname : ''; } catch { /* not a URL */ }
    if (!sub?.endpoint || sub.endpoint.length > 1000 || !(PUSH_HOSTS.test(host) || (env.DEV === '1' && /^(localhost|127\.0\.0\.1)$/.test(host)))) return json({ error: 'not a browser push subscription' }, 400);
    const p256dh = str(sub.keys?.p256dh, 200), auth = str(sub.keys?.auth, 100);
    if (!p256dh || !auth) return json({ error: 'subscription keys missing' }, 400);
    const known = await env.DB.prepare('SELECT id FROM subs WHERE endpoint = ?').bind(sub.endpoint).first();
    if (!known) {
      const n = await env.DB.prepare('SELECT COUNT(*) AS n FROM subs').first<{ n: number }>();
      if ((n?.n ?? 0) >= MAX_SUBS) return json({ error: `alerts are already on for ${MAX_SUBS} phones` }, 429);
    }
    const raw = (b?.prefs ?? {}) as Record<string, unknown>;
    const prefs = Object.fromEntries(ALERTS.map((k) => [k, raw[k] !== false]));
    await env.DB.prepare(`INSERT INTO subs (endpoint, p256dh, auth, device, name, tz, prefs, at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(endpoint) DO UPDATE SET p256dh = excluded.p256dh, auth = excluded.auth, device = excluded.device, name = excluded.name, tz = excluded.tz, prefs = excluded.prefs
      WHERE subs.p256dh IS NOT excluded.p256dh OR subs.auth IS NOT excluded.auth OR subs.device IS NOT excluded.device OR subs.name IS NOT excluded.name OR subs.tz IS NOT excluded.tz OR subs.prefs IS NOT excluded.prefs`)
      .bind(sub.endpoint, p256dh, auth, str(b?.device, 64), str(b?.name, 40), str(b?.tz, 64), JSON.stringify(prefs), Date.now()).run();
    return json({ ok: true, prefs });
  }

  if (path === '/api/unsubscribe' && method === 'POST') {
    const endpoint = str((await body(req))?.endpoint, 1000);
    if (endpoint) await env.DB.prepare('DELETE FROM subs WHERE endpoint = ?').bind(endpoint).run();
    return json({ ok: true });
  }

  if (path === '/api/push-test' && method === 'POST') {
    const endpoint = str((await body(req))?.endpoint, 1000);
    const sub = endpoint ? await env.DB.prepare('SELECT * FROM subs WHERE endpoint = ?').bind(endpoint).first<SubRow>() : null;
    if (!sub) return json({ error: 'this phone has no alerts turned on' }, 404);
    if (!vapid(env)) return json({ error: 'push keys are not set on the server (npm run live:setup)' }, 503);
    const ok = await deliver(env, [{ sub, msg: { title: 'Alerts are on', body: 'This is how leave-now, last-train and booking alerts will look.', url: '/', tag: 'test' } }]);
    return ok ? json({ ok: true }) : json({ error: 'the push service refused the message' }, 502);
  }

  // Local testing only: run the alerts as if it were `now`.
  if (path === '/api/debug/alerts' && method === 'POST' && env.DEV === '1') {
    const now = Number((await body(req))?.now ?? Date.now());
    return json({ sent: await runAlerts(env, now) });
  }

  // Local testing only: the morning hours check as if it were `now`, with Google's answers given per place ID.
  if (path === '/api/debug/google' && method === 'POST' && env.DEV === '1') {
    const b = await body(req);
    const fake = (b?.google ?? {}) as Record<string, LiveDetails>;
    return json({ checked: await runGoogle(env, Number(b?.now ?? Date.now()), async (id) => fake[id] ?? null) });
  }
  // Local testing only: the morning weather check as if it were `now`, with the agency's alerts given.
  if (path === '/api/debug/weather' && method === 'POST' && env.DEV === '1') {
    const b = await body(req);
    return json({ checked: await runWeather(env, Number(b?.now ?? Date.now()), async () => (b?.alerts ?? []) as JmaAlert[]) });
  }

  return json({ error: 'not found' }, 404);
}

export default {
  async fetch(req: Request, env: Env, ctx: Ctx): Promise<Response> {
    const path = new URL(req.url).pathname;
    if (!path.startsWith('/api/')) return env.ASSETS.fetch(req);
    const count = { rows: 0 };
    const e = env.DEV === '1' ? { ...env, DB: metered(env.DB, count) } : env;
    try {
      const res = await api(req, e, ctx, path);
      if (env.DEV === '1') res.headers.set('x-rows-read', String(count.rows));
      return res;
    } catch (err) { console.error(err); return json({ error: 'something went wrong on the server' }, 500); }
  },
  async scheduled(event: { scheduledTime: number }, env: Env, ctx: Ctx) {
    ctx.waitUntil(runAlerts(env, event.scheduledTime).then((s) => { if (s.length) console.log(`sent ${s.length} alerts`); }));
    ctx.waitUntil(runGoogle(env, event.scheduledTime).then((c) => { if (c.length) console.log(`checked ${c.length} stops on Google`, c.filter((x) => x.news)); }));
    ctx.waitUntil(runWeather(env, event.scheduledTime).then((c) => { if (c.length) console.log('weather warnings', c); }));
  },
};
