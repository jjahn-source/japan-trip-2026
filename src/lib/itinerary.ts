// The itinerary agent's output (planner/ → data/itinerary.json) and how it becomes the site's Trip.
// When the file exists, the site is built from it instead of the TREK export, so the map, routes,
// search, bookings and budget all follow the agent's plan.
import type { BudgetRow, Category, Day, Stay, Stop, Todo, Trip } from './plan';

export interface GuideMedia { kind: 'tiktok' | 'instagram' | 'youtube' | 'image'; url: string; embed?: string; thumb?: string; credit?: string; title?: string }
/** The guidebook spread for one stop. */
export interface Guide {
  story: string;                       // what it is and why it's in the plan
  how: string[];                       // how to do it properly, in order
  tips: string[];
  cost: string | null;
  booking: string | null;              // what to book, how, and by when
  hours: string | null;
  sources: { label: string; url: string }[];
  media: GuideMedia[];
  wishes: string[];                    // which wishes from the brief this stop serves
  verified: { source: string; status: string | null } | null;
}
export interface ItinStop {
  id: string; start: string; end: string; name: string; nameJa: string | null;
  category: Category; categoryLabel: string; price: string | null; summary: string | null; plan: string | null;
  address: string | null; lat: number | null; lng: number | null; website: string | null; phone: string | null; map: string | null;
  transport: string | null;            // how to get to the next stop
  guide: Guide | null;
}
export interface ItinDay {
  n: number; date: string; city: string; title: string;
  stamp: { kanji: string; reading: string; place: string };
  notes: { kind: string; text: string }[];
  stops: ItinStop[];
}
export interface Itinerary {
  version: 1; generated: string; title: string; dates: string; people: number; brief: string;
  stays: Stay[]; days: ItinDay[];
  todos: { due: string | null; text: string; detail: string | null; stops: string[] }[];
  budget: BudgetRow[]; budgetTotals: { category: string; perPerson: string }[];
  coverage: { wish: string; how: string }[];
  sources: string[]; warnings: string[];
}

const WD = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const addDays = (date: string, n: number) => { const d = new Date(`${date}T00:00:00Z`); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
const toMin = (t: string) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
export const dayLabel = (date: string) => { const d = new Date(`${date}T00:00:00Z`); return { weekday: WD[d.getUTCDay()], label: `${WD[d.getUTCDay()]} ${MON[d.getUTCMonth()]} ${d.getUTCDate()}` }; };

/** Stop times as ISO, rolling past midnight the way a night out does (22:00 → 01:00 is tomorrow). */
export function stopTimes(date: string, stops: { start: string; end: string }[]) {
  let offset = 0, prev = -1;
  return stops.map((s) => {
    let a = toMin(s.start);
    if (prev >= 0 && a + offset * 1440 < prev) offset++;
    a += offset * 1440;
    let b = toMin(s.end) + offset * 1440;
    if (b < a) b += 1440;
    prev = a;
    const iso = (m: number) => `${addDays(date, Math.floor(m / 1440))}T${String(Math.floor((m % 1440) / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}:00+09:00`;
    return { startISO: iso(a), endISO: iso(b) };
  });
}

export function itineraryToTrip(it: Itinerary): Trip {
  const days: Day[] = it.days.map((d) => {
    const times = stopTimes(d.date, d.stops);
    const { weekday, label } = dayLabel(d.date);
    const stops: Stop[] = d.stops.map((s, i) => ({
      id: s.id, day: d.n, index: i, start: s.start, end: s.end, ...times[i],
      name: s.nameJa && !s.name.includes(s.nameJa) ? `${s.name} (${s.nameJa})` : s.name,
      category: s.category, categoryLabel: s.categoryLabel, price: s.price, free: !s.price,
      summary: s.summary, plan: s.plan, details: [], extra: [], website: s.website,
      map: s.map ?? (s.lat != null ? `https://www.google.com/maps/search/?api=1&query=${s.lat},${s.lng}` : null),
      phone: s.phone, address: s.address, lat: s.lat, lng: s.lng, guide: s.guide, transport: s.transport,
    }));
    return { n: d.n, date: d.date, weekday, label, title: d.title, notes: d.notes.map((x) => ({ kind: x.kind, qualifier: null, text: x.text, check: /check/i.test(x.kind) })), stops, stamp: d.stamp };
  });
  const todos: Todo[] = it.todos.map((t) => {
    const due = t.due ? dayLabel(t.due) : null;
    return { due: t.due, dueLabel: due ? due.label : null, text: t.text, detail: t.detail, stops: t.stops };
  });
  return { title: it.title, dates: it.dates, people: it.people, exported: it.generated, stays: it.stays, days, todos, budget: it.budget, budgetTotals: it.budgetTotals };
}
