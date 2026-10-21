// The live layer's shared rules: what a change may say, how the group's changes fold into one state,
// and when a phone alert is due. The Worker (worker/index.ts) and the app in the browser both use it,
// so the server and every phone agree on what the plan is right now.

export type Kind = 'stop' | 'todo' | 'day';
/** A train home: the time to leave the last stop, the train's departure and arrival (HH:MM, Japan
 *  time), the station it leaves from and the line. */
export interface LastTrain { leave: string; dep: string; arr: string; from: string; line: string }
export interface StopPatch { start?: string; end?: string; note?: string; cancelled?: boolean }
export interface TodoPatch { done?: boolean }
export interface DayPatch { lastTrain?: LastTrain }
/** A change as stored: a patch where null clears a field back to the plan. */
export interface Change { id: number; kind: Kind; target: string; patch: Record<string, unknown>; author: string; device: string | null; at: number }
export interface LiveItem { patch: Record<string, unknown>; by: string; at: number }
export interface Live { v: number; items: Record<string, LiveItem>; log: Change[] }

export const EMPTY: Live = { v: 0, items: {}, log: [] };
const HM = /^([01]\d|2[0-3]):[0-5]\d$/;

/** Checks a patch from a phone and returns it trimmed, or the reason it can't be saved. */
export function clean(kind: Kind, patch: unknown): Record<string, unknown> | string {
  if (!patch || typeof patch !== 'object' || Array.isArray(patch)) return 'patch must be an object';
  const p = patch as Record<string, unknown>, out: Record<string, unknown> = {};
  const allowed = { stop: ['start', 'end', 'note', 'cancelled'], todo: ['done'], day: ['lastTrain'] }[kind];
  if (!allowed) return 'unknown kind';
  for (const [k, v] of Object.entries(p)) {
    if (!allowed.includes(k)) return `${k} can't be changed`;
    if (v === null) { out[k] = null; continue; }
    if (k === 'start' || k === 'end') { if (typeof v !== 'string' || !HM.test(v)) return `${k} must be HH:MM`; out[k] = v; }
    else if (k === 'note') { if (typeof v !== 'string') return 'note must be text'; const t = v.trim().slice(0, 280); out[k] = t || null; }
    else if (k === 'cancelled' || k === 'done') { if (typeof v !== 'boolean') return `${k} must be true or false`; out[k] = v; }
    else if (k === 'lastTrain') {
      const t = v as Record<string, unknown>;
      if (typeof t !== 'object' || ![t.leave, t.dep, t.arr].every((x) => typeof x === 'string' && HM.test(x))) return 'lastTrain needs leave, dep and arr as HH:MM';
      out[k] = { leave: t.leave, dep: t.dep, arr: t.arr, from: String(t.from ?? '').trim().slice(0, 60), line: String(t.line ?? '').trim().slice(0, 80) };
    }
  }
  return Object.keys(out).length ? out : 'nothing to change';
}

export const LOG = 40; // changes kept in the state for the "Changed by the group" list

/** One more change on top of a state (the state isn't modified). The server keeps the state this way,
 *  one change at a time, so a save or a phone's check never has to read the whole history. */
export function applyChange(s: Live, r: Change): Live {
  const key = `${r.kind}:${r.target}`;
  const items = { ...s.items };
  const patch = { ...(items[key]?.patch ?? {}) };
  for (const [k, v] of Object.entries(r.patch)) { if (v === null) delete patch[k]; else patch[k] = v; }
  if (Object.keys(patch).length) items[key] = { patch, by: r.author, at: r.at };
  else delete items[key];
  return { v: Math.max(s.v, r.id), items, log: [r, ...s.log].slice(0, LOG) };
}

/** Every change in order → the current state of each stop, to-do and day that anyone has touched. */
export function fold(rows: Change[]): Live {
  return [...rows].sort((a, b) => a.id - b.id).reduce(applyChange, EMPTY);
}

/** The ISO time (Japan) of HH:MM nearest to a reference time, so 00:30 after a 23:00 stop is the next
 *  calendar day and 05:00 on an all-nighter stays the morning after. */
export function isoNear(hm: string, refISO: string): string {
  const ref = Date.parse(refISO);
  const day = Date.parse(`${new Date(ref + 9 * 3600e3).toISOString().slice(0, 10)}T${hm}:00+09:00`);
  const t = [day - 864e5, day, day + 864e5].sort((a, b) => Math.abs(a - ref) - Math.abs(b - ref))[0];
  return `${new Date(t + 9 * 3600e3).toISOString().slice(0, 19)}+09:00`;
}
/** HH:MM of a night-time train on a trip day (before noon is the morning after). */
export const nightISO = (date: string, hm: string) => isoNear(hm, `${date}T${+hm.slice(0, 2) < 12 ? '23:59' : '18:00'}:00+09:00`);
export const hmOf = (iso: string) => new Date(Date.parse(iso) + 9 * 3600e3).toISOString().slice(11, 16);

// ── The compact plan the Worker reads (/live-plan.json, written at build time) ──
export interface PlanStop { id: string; d: number; name: string; cat: string; s: string; e: string; cancelled?: boolean; note?: string | null }
export interface PlanLeg { from: string; to: string; minutes: number; mode: string; text: string }
export interface PlanDay { n: number; date: string; lastTrain: LastTrain | null }
export interface PlanTodo { id: string; due: string | null; text: string; done?: boolean }
export interface LivePlan { generated: string; days: PlanDay[]; stops: PlanStop[]; legs: PlanLeg[]; todos: PlanTodo[] }

/** Whether a change points at something in the plan. */
export function exists(plan: LivePlan, kind: Kind, target: string): boolean {
  if (kind === 'stop') return plan.stops.some((s) => s.id === target);
  if (kind === 'todo') return plan.todos.some((t) => t.id === target);
  return plan.days.some((d) => String(d.n) === target);
}

/** The plan with the group's changes on it. */
export function applyPlan(plan: LivePlan, live: Live): LivePlan {
  const item = (k: string) => live.items[k]?.patch ?? {};
  return {
    ...plan,
    stops: plan.stops.map((s) => {
      const p = item(`stop:${s.id}`) as StopPatch;
      return { ...s, s: p.start ? isoNear(p.start, s.s) : s.s, e: p.end ? isoNear(p.end, s.e) : s.e, cancelled: !!p.cancelled, note: p.note ?? null };
    }),
    todos: plan.todos.map((t) => ({ ...t, done: (item(`todo:${t.id}`) as TodoPatch).done ?? t.done ?? false })),
    days: plan.days.map((d) => ({ ...d, lastTrain: (item(`day:${d.n}`) as DayPatch).lastTrain ?? d.lastTrain })),
  };
}

// ── Alerts ──
export type AlertKind = 'leave' | 'last' | 'due' | 'changes';
export interface Alert { key: string; kind: AlertKind; at: number; title: string; body: string; url: string }
export const LEAD = { leave: 10, last: 20 } as const; // minutes of warning

/** When a ride leaves: it arrives for the next stop's start and takes its length (never leaving
 *  before the previous stop ends). The same rule as the app's playback (src/app/types.ts legTimes). */
export function departs(from: PlanStop, to: PlanStop, minutes: number): number {
  const arrive = Date.parse(to.s);
  return Math.min(arrive, Math.max(Date.parse(from.e), arrive - minutes * 60e3));
}

// One formatter per time zone: building one costs far more than using it (and a cron run has 10 ms).
const formats = new Map<string, Intl.DateTimeFormat>();
const formatIn = (tz: string) => {
  let f = formats.get(tz);
  if (!f) { f = new Intl.DateTimeFormat('en-US', { timeZone: tz, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }); formats.set(tz, f); }
  return f;
};
/** 09:00 on a date in a time zone, as a moment. */
export function nineAm(date: string, tz: string): number {
  const guess = Date.parse(`${date}T09:00:00Z`);
  try {
    const parts = Object.fromEntries(formatIn(tz).formatToParts(guess).map((x) => [x.type, x.value]));
    const shown = Date.parse(`${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:00Z`);
    return guess - (shown - guess);
  } catch { return Date.parse(`${date}T09:00:00+09:00`); }
}

/** Every alert the (already changed) plan will ever send, for a phone in time zone `tz`. */
export function alertsFor(plan: LivePlan, tz: string): Alert[] {
  const out: Alert[] = [];
  const stop = new Map(plan.stops.map((s) => [s.id, s]));
  const hm = (t: number) => hmOf(new Date(t).toISOString());
  // Leave now: rides, and walks long enough to need a head start.
  for (const l of plan.legs) {
    const a = stop.get(l.from), b = stop.get(l.to);
    if (!a || !b || a.cancelled || b.cancelled || (l.mode === 'walk' && l.minutes < 15)) continue;
    const dep = departs(a, b, l.minutes);
    out.push({
      key: `leave:${a.id}:${dep}`, kind: 'leave', at: dep - LEAD.leave * 60e3,
      title: `Leave at ${hm(dep)} for ${b.name}`,
      body: `${l.text || (l.mode === 'walk' ? 'Walk' : 'Ride')} · ${l.minutes} min, there at ${hm(Date.parse(b.s))}`,
      url: `/day/${b.d}/#${b.id}`,
    });
  }
  // The last train home, unless the plan has everyone home well before it.
  for (const d of plan.days) {
    const t = d.lastTrain;
    if (!t) continue;
    const leave = Date.parse(nightISO(d.date, t.leave));
    const outStops = plan.stops.filter((s) => s.d === d.n && !s.cancelled && s.cat !== 'stay');
    const lastOut = Math.max(0, ...outStops.map((s) => Date.parse(s.e)));
    if (lastOut && lastOut < leave - 60 * 60e3) continue;
    out.push({
      key: `last:${d.n}:${t.dep}`, kind: 'last', at: leave - LEAD.last * 60e3,
      title: `Last train home ${t.dep}${t.from ? ` from ${t.from}` : ''}`,
      body: `Leave by ${t.leave}${t.line ? ` · ${t.line}` : ''}, in bed ${t.arr}. After that it's a taxi or the first train.`,
      url: `/day/${d.n}/`,
    });
  }
  // Booking deadlines: three days ahead and on the day, at 9 in the morning wherever the phone is.
  for (const x of plan.todos) {
    if (!x.due || x.done) continue;
    const ahead = new Date(Date.parse(`${x.due}T00:00:00Z`) - 3 * 864e5).toISOString().slice(0, 10);
    for (const [when, date] of [['3 days', ahead], ['today', x.due]] as const) {
      out.push({ key: `due:${x.id}:${when}`, kind: 'due', at: nineAm(date, tz), title: when === 'today' ? 'Due today' : 'Due in 3 days', body: x.text, url: '/bookings/' });
    }
  }
  return out.sort((a, b) => a.at - b.at);
}

/** How one change reads in a notification and in the app's list of changes. */
export function describe(c: Pick<Change, 'kind' | 'target' | 'patch' | 'author'>, plan: LivePlan): { title: string; body: string; url: string } {
  const p = c.patch;
  if (c.kind === 'stop') {
    const s = plan.stops.find((x) => x.id === c.target);
    const bits: string[] = [];
    if (p.cancelled === true) bits.push('cancelled');
    else if (Object.values(p).every((v) => v === null)) bits.push('back to the plan');
    else if (p.cancelled === false) bits.push('back on');
    if (typeof p.start === 'string') bits.push(`now ${p.start}${typeof p.end === 'string' ? `–${p.end}` : ''}`);
    else if (typeof p.end === 'string') bits.push(`now ends ${p.end}`);
    if (typeof p.note === 'string') bits.push(`“${p.note}”`);
    if (!bits.length) bits.push('updated');
    return { title: `${s?.name ?? 'A stop'}: ${bits[0]}`, body: [...bits.slice(1), `by ${c.author}`].join(' · '), url: s ? `/day/${s.d}/#${s.id}` : '/' };
  }
  if (c.kind === 'todo') {
    const t = plan.todos.find((x) => x.id === c.target);
    return { title: `${p.done ? 'Done' : 'Not done yet'}: ${t?.text ?? 'a booking'}`, body: `by ${c.author}`, url: '/bookings/' };
  }
  const t = p.lastTrain as LastTrain | null | undefined;
  return { title: t ? `Day ${c.target} last train: ${t.dep}${t.from ? ` from ${t.from}` : ''}` : `Day ${c.target} last train back to the plan`, body: `by ${c.author}`, url: `/day/${c.target}/` };
}
