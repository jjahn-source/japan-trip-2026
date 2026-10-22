// The app's data, as the build writes it to /app-data.json and as every component reads it.
export interface AppFact { text: string; url: string }
export interface AppMedia { kind: 'image' | 'tiktok' | 'instagram' | 'youtube'; url: string; embed?: string; thumb?: string; credit?: string; /** Local copies (scripts/thumbs.mjs): 160 px square, 960 px wide. */ small?: string; large?: string }
export interface AppGuide {
  story: string; how: string[]; tips: string[]; cost: string | null; booking: string | null; hours: string | null;
  facts: AppFact[]; sources: { label: string; url: string }[]; media: AppMedia[]; wishes: string[];
}
/** Google Maps on a stop: rating, Google's review summary (Gemini; shown with its disclosure and the
 *  reviews link Google requires), cards or cash, bookings, groups, and a clash between the visit and
 *  Google's hours (dated hours for the coming week when it has them). `checked` is the fetch date. */
export interface AppGoogle {
  id: string; maps: string | null; rating: number | null; ratings: number | null;
  summary: { text: string; uri: string | null } | null;
  pay: 'cash' | 'cards' | null; groups: boolean | null; book: boolean | null;
  closed: 'for good' | 'for now' | null;
  /** Whether Google's hours are this visit's (not a walk past it at night): the build and the live check use them. */
  hours: boolean;
  clash: { kind: 'closed' | 'opens' | 'closes'; text: string } | null;
  checked: string;
}
export interface AppStop {
  id: string; i: number; start: string; end: string; startISO: string; endISO: string;
  name: string; ja: string | null; cat: string; catLabel: string; price: string | null;
  hook: string | null; plan: string | null; lat: number | null; lng: number | null;
  address: string | null; website: string | null; phone: string | null; map: string | null;
  mark: 'confirmed' | 'tobook' | 'tocheck' | 'unconfirmed' | null; todoId: string | null;
  transport: string | null; guide: AppGuide | null;
  details: { label: string | null; text: string }[]; extra: string[];
  confirmation: string | null;
  /** The street-level view of the stop's pin (scripts/streetview.mjs): local photo, capture month, a
   *  Google Maps link to look around from there. */
  street?: { src: string; date: string | null; url: string } | null;
  /** What Google Maps knows about the place (scripts/google-places.mjs), checked against this visit. */
  google?: AppGoogle | null;
  /** The group's change to this stop, if anyone made one (src/app/live.svelte.ts). */
  live?: { note: string | null; cancelled: boolean; moved: boolean; planned: string; by: string; at: number };
}
/** The last train home for a night (data/last-trains.json from Yahoo!乗換案内's last-train search, or
 *  the group's correction): leave the stop by, the train, in bed by; `url` is the search to check it. */
export interface AppLastTrain { leave: string; dep: string; arr: string; from: string; line: string; url?: string }
export type SegMode = 'walk' | 'rail' | 'bus' | 'car' | 'ropeway' | 'funicular' | 'boat';
export interface AppSeg { m: SegMode; line?: string; colour?: string; on?: string; off?: string; coords: [number, number][] }
export interface AppLeg { from: string; to: string; mode: string; minutes: number; km: number; text: string; segs: AppSeg[] }
export interface AppPick { id: string; name: string; ja: string | null; kind: string; lat: number; lng: number; near: string; km: number; why: string | null; when: string | null; photo: string | null; photoSmall?: string; tag: string }
export interface AppDay {
  n: number; date: string; label: string; weekday: string; title: string; city: string;
  notes: { kind: string; text: string; check: boolean }[];
  base: { short: string; address: string; confirmation: string; checkIn: string; checkOut: string } | null;
  sun: { sunrise: string; sunset: string; lat: number; lng: number } | null;
  climate: { hi: number; lo: number; wet: number } | null;
  stops: AppStop[]; legs: Record<string, AppLeg>; picks: AppPick[];
  lastTrain: AppLastTrain | null;
  /** Why a night has no last train (a walk home, a taxi night), when the search found none. */
  lastTrainWhy: string | null;
  /** The night's ride home (last stop out → the bed), when it's more than a walk. */
  home: { from: { name: string; lat: number; lng: number }; to: { name: string; lat: number; lng: number } } | null;
}
export interface AppTodo { id: string; due: string | null; dueLabel: string | null; text: string; detail: string | null; kind: string; stops: string[] }
export interface AppData {
  title: string; dates: string; people: number; generated: string;
  days: AppDay[]; todos: AppTodo[];
  budget: { category: string; item: string; group: string; perPerson: string; note: string }[];
  budgetTotals: { category: string; perPerson: string }[];
  coverage: { wish: string; how: string }[];
  logistics: string[];
  stays: { name: string; short: string; address: string; checkIn: string; checkOut: string; confirmation: string }[];
}

/** "Uoshin (魚真)" → name and Japanese. */
export function splitJa(name: string): { name: string; ja: string | null } {
  const m = name.match(/^(.*?)\s*\(([^()]*[぀-ヿ㐀-鿿][^()]*)\)$/);
  return m ? { name: m[1], ja: m[2] } : { name, ja: null };
}
/** Minutes since midnight of the trip day (after midnight keeps counting). */
export const minutesOf = (iso: string, date: string) => Math.round((Date.parse(iso) - Date.parse(`${date}T00:00:00+09:00`)) / 60000);
export const yen = (s: string | null) => { const m = s?.match(/¥\s?([\d,]+)/); return m ? Number(m[1].replace(/,/g, '')) : null; };

/** The budget's categories (empty ones left out) and the per-person total: the sheet's own Total row
 *  when it has one, else the sum. */
export function budgetOf(rows: { category: string; perPerson: string }[]) {
  const totalRow = rows.find((r) => /^total$/i.test(r.category.trim()));
  const cats = rows.filter((r) => r !== totalRow).map((r) => ({ category: r.category, v: yen(r.perPerson) ?? 0 })).filter((r) => r.v > 0).sort((a, b) => b.v - a.v);
  return { cats, total: (totalRow && yen(totalRow.perPerson)) || cats.reduce((n, r) => n + r.v, 0) };
}

/** "HH:MM" for minutes since the trip day's midnight (after midnight keeps counting, shown as clock time). */
export const hhmm = (m: number) => `${String(Math.floor(m / 60) % 24).padStart(2, '0')}:${String(((Math.round(m) % 60) + 60) % 60).padStart(2, '0')}`;
/** When a ride actually leaves and arrives: it arrives for the next stop's start, and leaves the
 *  ride's length before that (never before the previous stop ends). */
export function legTimes(from: AppStop, to: AppStop, leg: AppLeg, date: string) {
  const arrive = minutesOf(to.startISO, date);
  const depart = Math.min(arrive, Math.max(minutesOf(from.endISO, date), arrive - leg.minutes));
  return { depart, arrive };
}
