// Build time only: shapes the itinerary, the measured routes, the weather normals and the nearby picks
// into the one file the app reads (/app-data.json). Runs in Node during `astro build`.
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { trip } from '../lib/trip';
import { trending } from '../lib/client';
import type { AppData, AppDay, AppLeg, AppMedia, AppStop } from './types';
import { splitJa } from './types';

const read = <T>(p: string, fallback: T): T => { const f = resolve(process.cwd(), p); return existsSync(f) ? (JSON.parse(readFileSync(f, 'utf8')) as T) : fallback; };

let cached: AppData | null = null;
export function appData(): AppData {
  if (cached) return cached;
  const t = trip();
  const it = read<{ days?: { date: string; city: string }[]; coverage?: { wish: string; how: string }[]; logistics?: string[]; generated?: string }>(process.env.TRIP_FILE ?? 'data/itinerary.json', {});
  const legsFile = read<{ days: Record<string, AppLeg[]> }>('public/legs.json', { days: {} });
  const climate = read<{ days?: Record<string, { hi: number; lo: number; wet: number }> }>('data/climate.json', {});
  const trends = trending().days;
  const days: AppDay[] = t.days.map((d) => {
    const stops: AppStop[] = d.stops.map((s, i) => {
      const { name, ja } = splitJa(s.name);
      const g = s.guide;
      const stay = s.category === 'stay' ? t.stays.find((x) => s.name.startsWith(x.short)) : undefined;
      return {
        id: s.id, i: i + 1, start: s.start, end: s.end, startISO: s.startISO, endISO: s.endISO, name, ja, cat: s.category, catLabel: s.categoryLabel, price: s.price,
        hook: s.summary ?? null, plan: s.plan, lat: s.lat, lng: s.lng, address: s.address, website: s.website, phone: s.phone, map: s.map,
        mark: s.mark, todoId: s.todoId, transport: s.transport ?? null,
        guide: g ? { story: g.story, how: g.how, tips: g.tips, cost: g.cost, booking: g.booking, hours: g.hours, facts: g.facts ?? [], sources: g.sources, media: g.media as AppMedia[], wishes: g.wishes } : null,
        details: s.details, extra: s.extra, confirmation: stay?.confirmation ?? null,
      };
    });
    // Only legs that still join this day's stops in order (route files can lag a re-plan).
    const legs: Record<string, AppLeg> = {};
    for (const l of legsFile.days[String(d.n)] ?? []) {
      const a = stops.findIndex((s) => s.id === l.from);
      if (a >= 0 && stops[a + 1]?.id === l.to) legs[l.from] = { from: l.from, to: l.to, mode: l.mode, minutes: l.minutes, km: l.km, text: l.text, segs: l.segs };
    }
    const picks = (trends[String(d.n)] ?? []).map((x) => ({ id: x.id, name: x.name, ja: x.ja, kind: x.kind, lat: x.lat, lng: x.lng, near: x.near.stop, km: x.near.km, why: x.why ?? null, when: x.when ?? null, photo: x.photo, tag: x.tag }));
    return {
      n: d.n, date: d.date, label: d.label, weekday: d.weekday, title: d.title, city: it.days?.find((x) => x.date === d.date)?.city ?? '',
      kanji: d.stamp.kanji, reading: d.stamp.reading, place: d.stamp.place,
      notes: d.notes.map((n) => ({ kind: n.kind, text: n.text, check: n.check })),
      base: d.base ? { short: d.base.short, address: d.base.address, confirmation: d.base.confirmation, checkIn: d.base.checkIn, checkOut: d.base.checkOut } : null,
      sun: d.sun ? { sunrise: d.sun.sunrise, sunset: d.sun.sunset, lat: d.sun.lat, lng: d.sun.lng } : null,
      climate: climate.days?.[String(d.n)] ?? null,
      stops, legs, picks,
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
