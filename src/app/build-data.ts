// Build time only: shapes the itinerary, the measured routes, the weather normals and the nearby picks
// into the one file the app reads (/app-data.json). Runs in Node during `astro build`.
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { trip } from '../lib/trip';
import { trending } from '../lib/client';
import type { AppData, AppDay, AppLastTrain, AppLeg, AppMedia, AppStop } from './types';
import { splitJa } from './types';

const read = <T>(p: string, fallback: T): T => { const f = resolve(process.cwd(), p); return existsSync(f) ? (JSON.parse(readFileSync(f, 'utf8')) as T) : fallback; };
const THUMBS = read<Record<string, { s: string; l: string }>>('data/thumbs.json', {});
// Keyed by the pin to 5 places (scripts/streetview.mjs), so a re-planned stop at the same place keeps its photo.
const STREET = read<Record<string, { src?: string; date?: string | null; url?: string }>>('data/streetview.json', {});
const streetOf = (lat: number | null, lng: number | null): AppStop['street'] => {
  const v = lat != null && lng != null ? STREET[`${lat.toFixed(5)},${lng.toFixed(5)}`] : undefined;
  return v?.src && v.url ? { src: v.src, date: v.date ?? null, url: v.url } : null;
};
const withCopies =(m: AppMedia): AppMedia => (m.kind === 'image' && THUMBS[m.url] ? { ...m, small: THUMBS[m.url].s, large: THUMBS[m.url].l } : m);
/** Pictures of the place only: not a map or diagram (SVG), and not a Facebook link (it expires). */
const isPhoto = (url: string) => !/\.svg(\?|$)|\/Map_|fbcdn\.net/i.test(url);

let cached: AppData | null = null;
export function appData(): AppData {
  if (cached) return cached;
  const t = trip();
  const it = read<{ days?: { date: string; city: string }[]; coverage?: { wish: string; how: string }[]; logistics?: string[]; generated?: string }>(process.env.TRIP_FILE ?? 'data/itinerary.json', {});
  const legsFile = read<{ days: Record<string, AppLeg[]> }>('public/legs.json', { days: {} });
  const climate = read<{ days?: Record<string, { hi: number; lo: number; wet: number }> }>('data/climate.json', {});
  const trends = trending().days;
  // Last trains home (npm run last-trains: Yahoo!乗換案内's last-train search), only for a night whose
  // evening still starts at the same stop. The group can correct them on the site.
  const lastTrains = read<{ days?: Record<string, AppLastTrain & { origin: string }>; skipped?: Record<string, string> }>('data/last-trains.json', {});
  const allStops = t.days.flatMap((d) => d.stops);
  const bedAt = (iso: string) => {
    const s = t.stays.find((x) => Date.parse(x.checkInISO) <= Date.parse(iso) && Date.parse(iso) < Date.parse(x.checkOutISO));
    const at = s && allStops.find((x) => x.category === 'stay' && x.name.startsWith(s.short) && x.lat != null);
    return s && at ? { name: s.short, lat: at.lat!, lng: at.lng! } : null;
  };
  const days: AppDay[] = t.days.map((d) => {
    const stops: AppStop[] = d.stops.map((s, i) => {
      const { name, ja } = splitJa(s.name);
      const g = s.guide;
      const stay = s.category === 'stay' ? t.stays.find((x) => s.name.startsWith(x.short)) : undefined;
      return {
        id: s.id, i: i + 1, start: s.start, end: s.end, startISO: s.startISO, endISO: s.endISO, name, ja, cat: s.category, catLabel: s.categoryLabel, price: s.price,
        hook: s.summary ?? null, plan: s.plan, lat: s.lat, lng: s.lng, address: s.address, website: s.website, phone: s.phone, map: s.map,
        mark: s.mark, todoId: s.todoId, transport: s.transport ?? null,
        guide: g ? { story: g.story, how: g.how, tips: g.tips, cost: g.cost, booking: g.booking, hours: g.hours, facts: g.facts ?? [], sources: g.sources, media: (g.media as AppMedia[]).filter((m) => m.kind !== 'image' || isPhoto(m.url)).map(withCopies), wishes: g.wishes } : null,
        details: s.details, extra: s.extra, confirmation: stay?.confirmation ?? null, street: streetOf(s.lat, s.lng),
      };
    });
    // Only legs that still join this day's stops in order (route files can lag a re-plan).
    const legs: Record<string, AppLeg> = {};
    for (const l of legsFile.days[String(d.n)] ?? []) {
      const a = stops.findIndex((s) => s.id === l.from);
      if (a >= 0 && stops[a + 1]?.id === l.to) legs[l.from] = { from: l.from, to: l.to, mode: l.mode, minutes: l.minutes, km: l.km, text: l.text, segs: l.segs };
    }
    const picks = (trends[String(d.n)] ?? []).map((x) => ({ id: x.id, name: x.name, ja: x.ja, kind: x.kind, lat: x.lat, lng: x.lng, near: x.near.stop, km: x.near.km, why: x.why ?? null, when: x.when ?? null, photo: x.photo && isPhoto(x.photo) ? x.photo : null, photoSmall: x.photo && isPhoto(x.photo) ? THUMBS[x.photo]?.s : undefined, tag: x.tag }));
    return {
      n: d.n, date: d.date, label: d.label, weekday: d.weekday, title: d.title, city: it.days?.find((x) => x.date === d.date)?.city ?? '',
      notes: d.notes.map((n) => ({ kind: n.kind, text: n.text, check: n.check })),
      base: d.base ? { short: d.base.short, address: d.base.address, confirmation: d.base.confirmation, checkIn: d.base.checkIn, checkOut: d.base.checkOut } : null,
      sun: d.sun ? { sunrise: d.sun.sunrise, sunset: d.sun.sunset, lat: d.sun.lat, lng: d.sun.lng } : null,
      climate: climate.days?.[String(d.n)] ?? null,
      stops, legs, picks,
      lastTrain: (() => {
        const x = lastTrains.days?.[String(d.n)];
        return x && stops.some((s) => s.id === x.origin) ? { leave: x.leave, dep: x.dep, arr: x.arr, from: x.from, line: x.line, url: x.url } : null;
      })(),
      lastTrainWhy: lastTrains.skipped?.[String(d.n)] ?? null,
      home: (() => {
        // The night's ride home: from where the plan has the group at 23:30 (as scripts/last-trains.mjs
        // picks it) to the bed; none when the bed is a walk away.
        const outs = stops.filter((s) => s.cat !== 'stay' && s.cat !== 'transport' && s.lat != null);
        const late = Date.parse(`${d.date}T23:30:00+09:00`);
        const out = outs.find((s) => Date.parse(s.startISO) <= late && late < Date.parse(s.endISO)) ?? outs.filter((s) => Date.parse(s.startISO) <= late).at(-1) ?? outs.at(-1);
        const bed = bedAt(`${d.date}T20:00:00+09:00`);
        if (!out || !bed) return null;
        const r = Math.PI / 180, h = Math.sin(((bed.lat - out.lat!) * r) / 2) ** 2 + Math.cos(out.lat! * r) * Math.cos(bed.lat * r) * Math.sin(((bed.lng - out.lng!) * r) / 2) ** 2;
        return 12742 * Math.asin(Math.sqrt(h)) < 1.2 ? null : { from: { name: out.name, lat: out.lat!, lng: out.lng! }, to: bed };
      })(),
    };
  });
  cached = {
    title: t.title, dates: t.dates, people: t.people, generated: it.generated ?? new Date().toISOString(),
    days,
    todos: t.todos.map((x) => ({ id: x.id, due: x.due, dueLabel: x.dueLabel, text: x.text, detail: x.detail, kind: x.kind, stops: x.stops })),
    budget: t.budget, budgetTotals: t.budgetTotals, coverage: it.coverage ?? [], logistics: it.logistics ?? [],
    stays: t.stays.map((s) => ({ name: s.name, short: s.short, address: s.address, checkIn: s.checkIn, checkOut: s.checkOut, confirmation: s.confirmation })),
  };
  return cached;
}
