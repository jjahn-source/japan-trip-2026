// Is the place open while the group is there, by Google Maps' hours (data/google-places.json)? The exact
// hours Google gives for the coming week win (holidays, year-end closures); otherwise its weekly hours.
// Times are Japan time; a window is minutes from that day's midnight, and a close after midnight runs
// past 1440. Visits that start after midnight also look at the night before's window.
type Window = { open: number; close: number };
type Period = { open: { day: number; hour: number; minute: number }; close?: { day: number; hour: number; minute: number } };
export interface GoogleHours { weekly: Period[] | null; dated: { days: Record<string, Window[]>; special: string[] } | null }
export interface HoursClash { kind: 'closed' | 'opens' | 'closes'; text: string }

const WEEKDAY = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
/** Minutes past this day's midnight as "23:00" or "01:30". */
const clock = (m: number) => `${String(Math.floor(m / 60) % 24).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
const minutes = (iso: string) => +iso.slice(11, 13) * 60 + +iso.slice(14, 16);
const dowOf = (date: string) => new Date(`${date}T12:00:00+09:00`).getUTCDay();
const dayBefore = (date: string) => new Date(Date.parse(`${date}T00:00:00Z`) - 864e5).toISOString().slice(0, 10);
const nice = (date: string) => `${MON[+date.slice(5, 7) - 1]} ${+date.slice(8, 10)}`;
/** A visit's leeway either side: queueing ten minutes before the door opens is normal. */
const SLACK = 10;

type GDate = { year: number; month: number; day: number };
type DatedPoint = { date?: GDate; hour: number; minute: number };
/** Google's `currentOpeningHours`: the real hours for the next seven days, holidays included. */
export interface CurrentHours { periods?: { open?: DatedPoint; close?: DatedPoint }[]; specialDays?: { date: GDate }[] }
const ymd = (d: GDate) => `${d.year}-${String(d.month).padStart(2, '0')}-${String(d.day).padStart(2, '0')}`;
const addDays = (date: string, n: number) => new Date(Date.parse(`${date}T00:00:00Z`) + n * 864e5).toISOString().slice(0, 10);

/** Google's dated hours for the next week as opening windows by date, plus the dates they cover: a
 *  covered date with no window is closed all day. Null when Google gave none. */
export function datedHours(current: CurrentHours | null | undefined, today: string): GoogleHours['dated'] {
  if (!current?.periods) return null;
  const days: Record<string, Window[]> = {};
  for (let i = 0; i < 7; i++) days[addDays(today, i)] = [];
  for (const p of current.periods) {
    if (!p.open?.date) continue;
    const date = ymd(p.open.date), open = p.open.hour * 60 + p.open.minute;
    if (!p.close) { days[date] = [{ open: 0, close: 2880 }]; continue; }
    const close = p.close.hour * 60 + p.close.minute + (p.close.date && ymd(p.close.date) !== date ? 1440 : 0);
    (days[date] ??= []).push({ open, close: close <= open ? close + 1440 : close });
  }
  return { days, special: (current.specialDays ?? []).map((s) => ymd(s.date)) };
}

/** What the live check asks Google for each stop (one Place Details call, Enterprise fields). */
export const LIVE_FIELDS = 'businessStatus,regularOpeningHours.periods,currentOpeningHours.periods,currentOpeningHours.specialDays';
export interface LiveDetails { businessStatus?: string; regularOpeningHours?: { periods?: Period[] }; currentOpeningHours?: CurrentHours }

/** The morning check during the trip: news worth a push about a visit, from a fresh Place Details answer.
 *  Only what the site doesn't already show: the place has closed, or Google's hours for that date (a
 *  holiday, the year end) close it or close it early when its usual week wouldn't. Null otherwise. */
export function closedNews(stop: { name: string; s: string; e: string }, d: LiveDetails, today: string): { kind: 'gone' | HoursClash['kind']; title: string; body: string } | null {
  if (d.businessStatus === 'CLOSED_PERMANENTLY' || d.businessStatus === 'CLOSED_TEMPORARILY') {
    const how = d.businessStatus === 'CLOSED_PERMANENTLY' ? 'for good' : 'for now';
    return { kind: 'gone', title: `${stop.name} has closed ${how}`, body: `Google Maps says it's closed ${how}. Pick a swap before ${stop.s.slice(11, 16)}.` };
  }
  const dated = datedHours(d.currentOpeningHours, today);
  const now = hoursClash({ weekly: null, dated }, stop.s, stop.e);
  if (!now || now.kind === 'opens') return null;
  const usual = hoursClash({ weekly: d.regularOpeningHours?.periods ?? null, dated: null }, stop.s, stop.e);
  if (usual?.kind === now.kind) return null;
  const date = nice(stop.s.slice(0, 10));
  return { kind: now.kind, title: now.kind === 'closed' ? `${stop.name} looks closed on ${date}` : `${stop.name} closes early on ${date}`, body: `${now.text} You're there ${stop.s.slice(11, 16)}–${stop.e.slice(11, 16)}.` };
}

/** Google's weekly hours on `date`; null when unknown, [] when closed all day. */
export function weeklyOn(periods: Period[] | null, date: string): Window[] | null {
  if (!periods?.length) return null;
  if (periods.some((p) => !p.close)) return [{ open: 0, close: 2880 }];
  const dow = dowOf(date);
  return periods.filter((p) => p.open.day === dow).map((p) => {
    const open = p.open.hour * 60 + p.open.minute;
    const close = p.close!.hour * 60 + p.close!.minute + (p.close!.day !== p.open.day ? 1440 : 0);
    return { open, close: close <= open ? close + 1440 : close };
  });
}

/** The windows on `date` and whether they're Google's dated hours (true) or its usual week (false). */
function windowsOn(h: GoogleHours, date: string): { w: Window[]; dated: boolean } | null {
  const d = h.dated?.days[date];
  if (d) return { w: d, dated: true };
  const w = weeklyOn(h.weekly, date);
  return w ? { w, dated: false } : null;
}

/** What's wrong with visiting from `startISO` to `endISO`, or null when it's open (or Google doesn't say). */
export function hoursClash(h: GoogleHours | null | undefined, startISO: string, endISO: string): HoursClash | null {
  if (!h) return null;
  const date = startISO.slice(0, 10);
  const on = windowsOn(h, date);
  if (!on) return null;
  const s = minutes(startISO);
  let e = minutes(endISO) + (endISO.slice(0, 10) > date ? 1440 : 0);
  if (e <= s) e += 1440;
  // Last night's late window still counts for a visit after midnight.
  const before = windowsOn(h, dayBefore(date));
  const all = [...on.w, ...(before?.w ?? []).filter((x) => x.close > 1440).map((x) => ({ open: x.open - 1440, close: x.close - 1440 }))];
  const when = on.dated ? `on ${nice(date)}${h.dated?.special.includes(date) ? ' (holiday hours)' : ''}` : `on ${WEEKDAY[dowOf(date)]}s`;
  if (!all.length) return { kind: 'closed', text: `Google Maps lists it closed ${when}.` };
  const overlap = (x: Window) => Math.min(e, x.close) - Math.max(s, x.open);
  const best = all.reduce((a, b) => (overlap(b) > overlap(a) ? b : a));
  if (overlap(best) <= 0) {
    const hours = on.w.map((x) => `${clock(x.open)}–${clock(x.close)}`).join(', ') || 'closed';
    return { kind: 'closed', text: `Google Maps lists it closed then: hours ${when} are ${hours}.` };
  }
  if (best.open > s + SLACK) return { kind: 'opens', text: `Opens at ${clock(best.open)} ${when} (Google Maps).` };
  if (best.close < e - SLACK) return { kind: 'closes', text: `Closes at ${clock(best.close)} ${when} (Google Maps).` };
  return null;
}
