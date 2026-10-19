// One store for what's on screen, and one router. Every interaction goes through here, so the URL,
// the back button, the map and the panels can never disagree.
import type { AppData, AppDay, AppStop } from './types';

export type View = { kind: 'trip' } | { kind: 'day'; n: number } | { kind: 'bookings' } | { kind: 'budget' };
export const BASE = (import.meta.env.BASE_URL ?? '/').replace(/\/$/, '');

export const app = $state({
  data: null as AppData | null,
  view: { kind: 'trip' } as View,
  /** The stop whose sheet is open, and how much of the screen it takes: a peek (name and time, the
   *  map gets the rest), half (the default) or full. */
  sheet: null as string | null,
  sheetSize: 'half' as 'peek' | 'half' | 'full',
  /** The stop highlighted on the map and in the list. */
  selected: null as string | null,
  /** The leg playing on the map (its starting stop's id), with progress 0–1 and the clock. */
  playing: null as string | null,
  progress: 0,
  clock: '',
  search: false,
  /** A place dropped on the map from search or a nearby pick. */
  pin: null as null | { lat: number; lng: number; name: string; sub?: string; web?: string; hours?: string },
});

export function parse(path: string): View {
  const p = path.replace(BASE, '').replace(/\/+$/, '/');
  const d = p.match(/^\/day\/(\d+)\/?$/);
  if (d) return { kind: 'day', n: Number(d[1]) };
  if (/^\/bookings\/?$/.test(p)) return { kind: 'bookings' };
  if (/^\/budget\/?$/.test(p)) return { kind: 'budget' };
  return { kind: 'trip' };
}
export const href = (v: View) => `${BASE}${v.kind === 'trip' ? '/' : v.kind === 'day' ? `/day/${v.n}/` : `/${v.kind}/`}${preview() ? `?now=${preview()}` : ''}`;
export const sameView = (a: View, b: View) => a.kind === b.kind && (a.kind !== 'day' || a.n === (b as { n: number }).n);

export function go(v: View, e?: Event) {
  e?.preventDefault();
  if (sameView(v, app.view) && !app.sheet) return;
  history.pushState({ v: $state.snapshot(v) }, '', href(v));
  app.view = v; app.sheet = null; app.selected = null; app.playing = null;
  window.scrollTo({ top: 0 });
  document.querySelector('[data-scroll]')?.scrollTo({ top: 0 });
}

export function openSheet(id: string) {
  if (app.sheet === id) return;
  const url = `${location.pathname}${location.search}#${id}`;
  // History entries must be plain data: the store's objects are reactive proxies.
  const v = $state.snapshot(app.view);
  if (app.sheet) history.replaceState({ v, sheet: id }, '', url);
  else history.pushState({ v, sheet: id }, '', url);
  if (!app.sheet) app.sheetSize = 'half'; // a fresh sheet opens at half; moving between stops keeps the size
  app.sheet = id; app.selected = id;
}
export function closeSheet() {
  if (!app.sheet) return;
  if ((history.state as { sheet?: string } | null)?.sheet) history.back();
  else { history.replaceState({ v: $state.snapshot(app.view) }, '', `${location.pathname}${location.search}`); app.sheet = null; }
}

export function bindHistory() {
  const sync = () => {
    app.view = parse(location.pathname);
    app.sheet = location.hash.length > 1 ? decodeURIComponent(location.hash.slice(1)) : null;
    if (app.sheet) app.selected = app.sheet;
    app.playing = null;
  };
  sync();
  addEventListener('popstate', sync);
  return () => removeEventListener('popstate', sync);
}

let loading: Promise<AppData> | null = null;
export function load(): Promise<AppData> {
  loading ??= fetch(`${BASE}/app-data.json`).then((r) => { if (!r.ok) throw new Error(`app-data ${r.status}`); return r.json() as Promise<AppData>; })
    .then((d) => { app.data = d; return d; })
    .catch((e) => { loading = null; throw e; });
  return loading;
}

export const dayOf = (n: number): AppDay | undefined => app.data?.days.find((d) => d.n === n);
export function stopOf(id: string): { day: AppDay; stop: AppStop } | null {
  for (const day of app.data?.days ?? []) { const stop = day.stops.find((s) => s.id === id); if (stop) return { day, stop }; }
  return null;
}

/** ?now=2026-12-20T14:00 previews the app at a moment of the trip (Japan time). */
export function preview(): string | null { try { return new URLSearchParams(location.search).get('now'); } catch { return null; } }
export function now(): number {
  const p = preview();
  const t = p ? Date.parse(/[+Z]/.test(p.slice(10)) ? p : `${p}${p.length <= 16 ? ':00' : ''}+09:00`) : NaN;
  return Number.isFinite(t) ? t : Date.now();
}
/** The day of the trip it is in Japan right now (the night counts until 5am), or null outside it. */
export function todayN(): number | null {
  const t = now() - 5 * 3600e3;
  const date = new Date(t + 9 * 3600e3).toISOString().slice(0, 10);
  return app.data?.days.find((d) => d.date === date)?.n ?? null;
}

/** Ticks of things done, saved on this phone only. */
export const ticks = $state<Record<string, boolean>>((() => { try { return JSON.parse(localStorage.getItem('jt:ticks') ?? '{}'); } catch { return {}; } })());
export function tick(id: string, on: boolean) {
  ticks[id] = on;
  try { localStorage.setItem('jt:ticks', JSON.stringify(ticks)); } catch { /* private mode: the tick still shows this session */ }
}
