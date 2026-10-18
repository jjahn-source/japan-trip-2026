// The compact trip snapshot embedded in every page for the live scripts
// (now/next, stamping, booking ticks, maps). Build time only.
import { existsSync, readFileSync } from 'node:fs';
import { trip } from './trip';

export interface ClientStop {
  id: string; d: number; i: number; name: string; cat: string;
  s: string; e: string; start: string; end: string; plan: string | null;
  lat: number | null; lng: number | null; mark: string | null; todo: string | null; map: string | null;
}
export interface ClientDay {
  n: number; date: string; label: string; title: string; kanji: string; place: string;
  first: string | null; last: string | null;
  sun: { rise: number; set: number; lat: number; lng: number } | null;
}
export interface ClientTodo { id: string; due: string | null; text: string; kind: string; stops: string[]; done: boolean }
export interface ClientStay { name: string; in: string; out: string; lat: number | null; lng: number | null }
/** A trending place near a day's plan (scripts/trending.mjs). */
export interface ClientTrend {
  id: string; name: string; ja: string | null; kind: string; lat: number; lng: number;
  near: { stop: string; i: number; km: number }; views30: number; rise: number; december: number;
  tag: 'rising' | 'december' | 'popular' | 'pick'; wiki: string; photo: string | null; photoPage: string | null;
  /** Researched picks only (scripts/picks.mjs). */
  why?: string; when?: string; check?: boolean; source?: string; sourceName?: string;
}
export interface ClientTrip { days: ClientDay[]; stops: ClientStop[]; todos: ClientTodo[]; stays: ClientStay[]; trending: Record<string, ClientTrend[]>; trendingAt: string | null; routes: boolean }

/** Trending data, if `npm run trending` has been run; the site works without it. */
export function trending(): { generated: string | null; days: Record<string, ClientTrend[]> } {
  const f = new URL('../../data/trending.json', import.meta.url);
  const path = existsSync(f) ? f : new URL(`${process.cwd()}/data/trending.json`, 'file://');
  const j = existsSync(path) ? JSON.parse(readFileSync(path, 'utf8')) : { generated: null, days: {} };
  // Researched picks (data/picks.json) lead each day's list.
  const pf = new URL(`${process.cwd()}/data/picks.json`, 'file://');
  const picks: Record<string, ClientTrend[]> = existsSync(pf) ? JSON.parse(readFileSync(pf, 'utf8')).days ?? {} : {};
  const days: Record<string, ClientTrend[]> = {};
  // Picks and trends were researched for a plan's days; after a re-plan, keep only those still within a
  // walk of that day's stops (and point them at the nearest one), so nothing lands on the wrong day.
  const t = trip();
  const km = (a: { lat: number; lng: number }, b: { lat: number; lng: number }) => {
    const r = Math.PI / 180, x = Math.sin(((b.lat - a.lat) * r) / 2) ** 2 + Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(((b.lng - a.lng) * r) / 2) ** 2;
    return 12742 * Math.asin(Math.sqrt(x));
  };
  for (const d of new Set([...Object.keys(j.days ?? {}), ...Object.keys(picks)])) {
    const stops = (t.days.find((x) => String(x.n) === d)?.stops ?? []).filter((s) => s.lat != null);
    days[d] = [...(picks[d] ?? []), ...(j.days?.[d] ?? [])].flatMap((x: ClientTrend) => {
      const near = stops.map((s) => ({ s, k: km(x, { lat: s.lat!, lng: s.lng! }) })).sort((a, b) => a.k - b.k)[0];
      if (!near || near.k > 1.5) return [];
      return [{ ...x, near: { stop: near.s.id, i: near.s.index + 1, km: +near.k.toFixed(2) } }];
    });
  }
  return { generated: j.generated ?? null, days };
}

export function clientTrip(): ClientTrip {
  const t = trip();
  const stops = t.days.flatMap((d) => d.stops);
  const tr = trending();
  return {
    days: t.days.map((d) => ({
      n: d.n, date: d.date, label: d.label, title: d.title, kanji: d.stamp.kanji, place: d.stamp.place,
      first: d.firstStart, last: d.lastEnd,
      sun: d.sun ? { rise: d.sun.sunriseMs, set: d.sun.sunsetMs, lat: d.sun.lat, lng: d.sun.lng } : null,
    })),
    stops: stops.map((s) => ({
      id: s.id, d: s.day, i: s.index + 1, name: s.name, cat: s.category,
      s: s.startISO, e: s.endISO, start: s.start, end: s.end, plan: s.plan,
      lat: s.lat, lng: s.lng, mark: s.mark, todo: s.todoId, map: s.map,
    })),
    todos: t.todos.map((x) => ({ id: x.id, due: x.due, text: x.text, kind: x.kind, stops: x.stops, done: /\bDONE\b/.test(x.text) })),
    stays: t.stays.map((s) => {
      const stop = stops.find((x) => x.category === 'stay' && x.name.startsWith(s.short));
      return { name: s.short, in: s.checkInISO, out: s.checkOutISO, lat: stop?.lat ?? null, lng: stop?.lng ?? null };
    }),
    trending: tr.days,
    // Route files (legs, transit, timetable) belong to the live itinerary, not to a TRIP_FILE preview.
    routes: !process.env.TRIP_FILE,
    trendingAt: tr.generated,
  };
}
