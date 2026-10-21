// The live layer: one Cloudflare Worker in front of the built site (dist/, served as static assets).
// A small API on D1 keeps the group's changes to the plan, the shared booking ticks and each phone's
// alert subscription. It pushes a notification when someone changes the plan, and a cron run every
// minute sends what's due: leave now, the last train home, booking deadlines.
//
// Sized for Cloudflare's free plan: a phone's check and the cron run read one row (the snapshot) rather
// than the history; a check that has the latest state gets a few bytes back; pushes per run, phones,
// and request bodies are capped so no run can go past 10 ms of CPU or 50 outgoing requests.
import { alertsFor, applyChange, applyPlan, clean, describe, EMPTY, exists, type Alert, type AlertKind, type Change, type Kind, type Live, type LivePlan } from '../src/lib/live';
import { send, type Message, type Vapid } from './push';

interface Meta { last_row_id: number; changes: number; rows_read?: number }
interface Stmt { bind(...v: unknown[]): Stmt; all<T = Record<string, unknown>>(): Promise<{ results: T[]; meta: Meta }>; run(): Promise<{ meta: Meta }>; first<T = Record<string, unknown>>(): Promise<T | null> }
interface DB { prepare(q: string): Stmt; batch(s: Stmt[]): Promise<{ meta: Meta }[]> }
interface Env {
  ASSETS: { fetch(req: Request): Promise<Response> };
  DB: DB;
  VAPID_PUBLIC_KEY?: string; VAPID_PRIVATE_KEY?: string; VAPID_SUBJECT?: string;
  /** "1" in .dev.vars: allows local push endpoints, the /api/debug routes and the rows-read header. */
  DEV?: string;
}
interface Ctx { waitUntil(p: Promise<unknown>): void }
interface SubRow { id: number; endpoint: string; p256dh: string; auth: string; device: string | null; name: string | null; tz: string | null; prefs: string }

const KINDS: Kind[] = ['stop', 'todo', 'day'];
const ALERTS: AlertKind[] = ['leave', 'last', 'due', 'changes'];
/** Where a phone's push subscription can point: the browsers' own push services, nothing else. */
const PUSH_HOSTS = /(^|\.)(push\.apple\.com|fcm\.googleapis\.com|push\.services\.mozilla\.com|notify\.windows\.com)$/;
/** A cron run sends what fell due since the last few runs (a missed run still sends). */
const WINDOW = 15 * 60e3;
/** Pushes one run may send (~0.4 ms of CPU each); the rest go a minute later, still in the window. */
const MAX_PUSH = 20;
const MAX_SUBS = 40;
const MAX_BODY = 8192;

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
const prefsOf = (s: SubRow): Record<AlertKind, boolean> => { try { return { leave: true, last: true, due: true, changes: true, ...JSON.parse(s.prefs) }; } catch { return { leave: true, last: true, due: true, changes: true }; } };

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
    if (!byTz.has(tz)) byTz.set(tz, alertsFor(live, tz).filter((a) => a.at <= now && a.at > now - WINDOW));
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
  const todo = due.filter((_, i) => !sent.has(keys[i])).slice(0, MAX_PUSH);
  if (!todo.length) return [];
  // Marked sent first, so an overlapping run can't send it twice.
  await env.DB.batch(todo.map((d) => env.DB.prepare('INSERT OR IGNORE INTO sent (key, at) VALUES (?, ?)').bind(`${d.alert.key}|${d.sub.id}`, now)));
  await deliver(env, todo.map(({ sub, alert }) => ({ sub, msg: { title: alert.title, body: alert.body, url: alert.url, tag: alert.key }, ttl: alert.kind === 'due' ? 12 * 3600 : 15 * 60 })));
  await env.DB.prepare('DELETE FROM sent WHERE at < ?').bind(now - 7 * 864e5).run();
  return todo.map((d) => ({ sub: d.sub.id, key: d.alert.key }));
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
    const r = await env.DB.prepare('INSERT INTO changes (kind, target, patch, author, device, at) VALUES (?, ?, ?, ?, ?, ?)').bind(kind, target, JSON.stringify(patch), author, device, at).run();
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
      ON CONFLICT(endpoint) DO UPDATE SET p256dh = excluded.p256dh, auth = excluded.auth, device = excluded.device, name = excluded.name, tz = excluded.tz, prefs = excluded.prefs`)
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
  },
};
