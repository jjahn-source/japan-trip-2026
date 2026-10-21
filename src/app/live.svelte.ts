// The group's changes on top of the built plan. The phone keeps the last state it saw (so it works
// offline), applies its own edits straight away, queues them while there's no signal, and checks for
// everyone else's every half minute while the app is open. A host without the live layer (plain static
// files) just leaves the plan as built: no edit buttons, local ticks only.
import { app, BASE, hooks, ticks } from './state.svelte';
import { EMPTY, isoNear, type Kind, type Live, type LiveItem, type StopPatch } from '../lib/live';
import type { AppData, AppLastTrain } from './types';

interface Pending { kind: Kind; target: string; patch: Record<string, unknown>; at: number }
const API = `${BASE}/api`;
const store = {
  get: <T>(k: string, d: T): T => { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch { return d; } },
  set: (k: string, v: unknown) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* private mode: this session only */ } },
};
/** A random id for this phone, so its own changes don't notify it. */
export const device = (() => {
  let id = store.get<string | null>('jt:device', null);
  if (!id) { id = crypto.randomUUID?.() ?? String(Math.random()).slice(2); store.set('jt:device', id); }
  return id;
})();

export const live = $state({
  /** The live layer answered at least once (on this phone, ever): edits are possible. */
  on: store.get('jt:live-on', false),
  state: store.get<Live>('jt:live', EMPTY),
  outbox: store.get<Pending[]>('jt:outbox', []),
  name: store.get('jt:name', ''),
  /** The last change the server turned down, and which stop, to-do or day it was for. */
  error: '',
  errorFor: '',
  syncedAt: 0,
});

export function setName(n: string) { live.name = n.trim().slice(0, 40); store.set('jt:name', live.name); }

/** The server's state with this phone's unsent edits on top. */
function items(): Record<string, LiveItem> {
  const out: Record<string, LiveItem> = { ...live.state.items };
  for (const p of live.outbox) {
    const key = `${p.kind}:${p.target}`;
    const patch = { ...(out[key]?.patch ?? {}) };
    for (const [k, v] of Object.entries(p.patch)) { if (v === null) delete patch[k]; else patch[k] = v; }
    if (Object.keys(patch).length) out[key] = { patch, by: live.name || 'you', at: p.at }; else delete out[key];
  }
  return out;
}
export const itemOf = (key: string): LiveItem | null => items()[key] ?? null;

/** The built plan with the changes applied: new times, cancelled stops, notes, last trains. */
export function applyLive(base: AppData, it: Record<string, LiveItem>): AppData {
  return {
    ...base,
    days: base.days.map((d) => {
      const dp = it[`day:${d.n}`]?.patch as { lastTrain?: AppLastTrain } | undefined;
      const stops = d.stops.map((s) => {
        const x = it[`stop:${s.id}`];
        if (!x) return s;
        const p = x.patch as StopPatch;
        return {
          ...s, start: p.start ?? s.start, end: p.end ?? s.end,
          startISO: p.start ? isoNear(p.start, s.startISO, d.date) : s.startISO, endISO: p.end ? isoNear(p.end, s.endISO, d.date) : s.endISO,
          live: { note: p.note ?? null, cancelled: !!p.cancelled, moved: !!(p.start || p.end), planned: `${s.start}–${s.end}`, by: x.by, at: x.at },
        };
      });
      return { ...d, stops, lastTrain: dp?.lastTrain ?? d.lastTrain };
    }),
  };
}

let base: AppData | null = null;
let applied = '{}'; // the built plan as loaded has no changes on it
/** Puts the current changes on screen (only when they changed, so the map doesn't redraw for nothing). */
function render() {
  if (!base) return;
  const it = items();
  const sig = JSON.stringify(it);
  if (sig !== applied) { applied = sig; app.data = applyLive(base, it); }
  for (const t of base.todos) {
    const done = it[`todo:${t.id}`]?.patch.done;
    if (typeof done === 'boolean' && ticks[t.id] !== done) ticks[t.id] = done;
  }
}

async function call(path: string, init?: RequestInit) {
  // A connection that hangs (a train tunnel, a captive Wi-Fi page) gives up after 10 s instead of
  // holding up every later check.
  const r = await fetch(`${API}${path}`, { cache: 'no-store', signal: AbortSignal.timeout(10e3), ...init, headers: { 'content-type': 'application/json', ...init?.headers } });
  const isJson = r.headers.get('content-type')?.includes('json');
  return { r, j: isJson ? await r.json() : null };
}

let pulling: Promise<void> | null = null;
export function pull(): Promise<void> {
  pulling ??= (async () => {
    try {
      // The version we have: when nothing changed, the answer is a few bytes.
      const { r, j } = await call(`/state?v=${live.state.v}`);
      if (!r.ok || !j) { if (r.status === 404 && !j) { live.on = false; store.set('jt:live-on', false); } return; }
      live.on = true; store.set('jt:live-on', true);
      if (!j.same) { live.state = j; store.set('jt:live', j); }
      live.syncedAt = Date.now();
      await flush();
    } catch { /* offline: keep the last state */ }
    finally { pulling = null; render(); }
  })();
  return pulling;
}

let flushing = false;
async function flush() {
  if (flushing || !live.outbox.length) return;
  flushing = true;
  try {
    while (live.outbox.length) {
      const p = live.outbox[0];
      let res;
      try { res = await call('/changes', { method: 'POST', body: JSON.stringify({ ...p, author: live.name || 'Someone', device }) }); }
      catch { break; } // no signal: try again later
      if (res.r.ok && res.j) { live.state = res.j; store.set('jt:live', res.j); }
      else if (res.r.status === 429) break; // asked to slow down: keep it and send it later
      else if (res.r.status >= 400 && res.r.status < 500) { live.error = res.j?.error ?? "That change couldn't be saved."; live.errorFor = `${p.kind}:${p.target}`; }
      else break; // server trouble: keep it for later
      live.outbox = live.outbox.slice(1);
      store.set('jt:outbox', live.outbox);
    }
  } finally { flushing = false; render(); }
}

/** Saves a change: on screen at once, on the server when there's signal. */
export function change(kind: Kind, target: string, patch: Record<string, unknown>) {
  live.error = ''; live.errorFor = '';
  // Another unsent change to the same thing (a tick toggled on and off in a tunnel) merges into it,
  // unless that one is on its way to the server right now.
  const i = live.outbox.findLastIndex((p) => p.kind === kind && p.target === target);
  if (i > 0 || (i === 0 && !flushing)) live.outbox = live.outbox.map((p, k) => (k === i ? { ...p, patch: { ...p.patch, ...patch }, at: Date.now() } : p));
  else live.outbox = [...live.outbox, { kind, target, patch, at: Date.now() }];
  store.set('jt:outbox', live.outbox);
  render();
  flush();
}

/** Starts the live layer once the built plan is in. */
export function startLive(d: AppData) {
  base = d;
  render();
  hooks.tick = (id, on) => { if (live.on) change('todo', id, { done: on }); };
  pull();
  const tick = () => { if (document.visibilityState === 'visible') pull(); };
  const timer = setInterval(tick, 30e3);
  addEventListener('online', tick);
  addEventListener('focus', tick);
  document.addEventListener('visibilitychange', tick);
  return () => { clearInterval(timer); removeEventListener('online', tick); removeEventListener('focus', tick); document.removeEventListener('visibilitychange', tick); };
}

/** "5 min ago", "Mon 21:40". */
export function ago(at: number, now = Date.now()) {
  const m = Math.round((now - at) / 60e3);
  if (m < 1) return 'just now';
  if (m < 60) return `${m} min ago`;
  if (m < 24 * 60) return `${Math.round(m / 60)} h ago`;
  return new Date(at).toLocaleString('en-GB', { weekday: 'short', hour: '2-digit', minute: '2-digit' });
}
