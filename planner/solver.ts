// The day solver: given the places a day could include (each with how much it matters, how long it
// takes, when it's open) and how long it takes to get between them, it finds the order and times that
// fit the most value into the day without breaking a rule. Correct by construction: opening hours on
// that date, last entry, fixed show times, meal windows and spacing, real travel plus a group's
// buffer, and a taxi budget are hard rules, not things to repair afterwards.
//
// Branch and bound over orders (a day has at most a dozen options, so this is exact in practice),
// with a node cap as a safety net. Times are minutes from midnight of the day; after midnight keeps
// counting (25:30 is 01:30 the same night).

export interface Place { id: string; name: string; lat: number; lng: number }
export type Meal = 'breakfast' | 'lunch' | 'dinner' | 'late';
export interface SolveStop extends Place {
  minutes: number;                                   // how long they stay
  priority: number;                                  // 1–10: how much it matters to this group
  meal?: Meal | null;
  windows?: { open: number; close: number }[] | null; // open hours that day (none = always open)
  lastEntry?: number | null;
  fixedStart?: number | null;                        // a show, a booking, a departure
  must?: boolean;                                    // anchors and bookings: never drop
  endAt?: Place | null;                              // a ride that finishes elsewhere (ropeway, cruise)
  ride?: boolean;                                    // getting off a train/boat/plane: the group needs a buffer
}
export interface DayProblem {
  start: Place & { time: number };                   // where they set off, and when
  end?: (Place & { by?: number | null }) | null;     // where the day finishes (the stay), and by when
  stops: SolveStop[];
  people: number;
  taxiCapPerPerson?: number;                         // yen a day (default ¥4,000)
  dayEnd?: number;                                   // nothing ends later than this (default 27:00)
  maxWait?: number;                                  // minutes they may wait for a door to open (default 40)
  maxNodes?: number;
}
export type Mode = 'walk' | 'transit' | 'taxi';
export interface Hop { minutes: number; mode: Mode; yen: number } // yen: the whole group's taxi fare
export type HopFn = (a: Place, b: Place, at: number) => Hop;
export interface Timed { id: string; name: string; start: number; end: number; hop: Hop | null; wait: number }
export interface Solution { order: Timed[]; finish: Hop | null; arriveEnd: number | null; dropped: { id: string; name: string; why: string }[]; score: number; taxiYen: number; travel: number; complete: boolean }

// Meal start windows, and no second sit-down meal within 2½ hours of the last (90 min for a late snack).
export const MEALS: Record<Meal, [number, number]> = { breakfast: [6 * 60 + 30, 10 * 60 + 30], lunch: [11 * 60, 14 * 60 + 30], dinner: [17 * 60, 21 * 60 + 30], late: [21 * 60 + 30, 26 * 60] };
const GAP = { full: 150, late: 90 };
const ceil5 = (m: number) => Math.ceil(m / 5) * 5;
export const hhmm = (m: number) => `${String(Math.floor(m / 60) % 24).padStart(2, '0')}:${String(Math.round(m % 60)).padStart(2, '0')}`;

// ── Travel estimates, used until a leg is measured (check_plan then measures the chosen legs) ──
export const km = (a: { lat: number; lng: number }, b: { lat: number; lng: number }) => {
  const r = Math.PI / 180, dLat = (b.lat - a.lat) * r, dLng = (b.lng - a.lng) * r;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(dLng / 2) ** 2;
  return 12742 * Math.asin(Math.sqrt(h));
};
export interface EstimateOpts { people: number; rural?: boolean }
/** Rough door-to-door times: walking for short hops, trains in town, taxis when trains have stopped. */
export function estimateHop(a: { lat: number; lng: number }, b: { lat: number; lng: number }, at: number, o: EstimateOpts): Hop {
  const d = km(a, b);
  const walk = Math.max(1, Math.round((d * 1.3) / 4.5 * 60));
  if (walk <= 15) return { minutes: walk, mode: 'walk', yen: 0 };
  const cars = Math.ceil(o.people / 4);
  const taxi: Hop = { minutes: Math.round(5 + d * (o.rural ? 1.6 : 2.2)), mode: 'taxi', yen: cars * Math.round(500 + 420 * d) };
  // Trains stop around 00:30 and start around 05:00.
  const tod = ((at % 1440) + 1440) % 1440;
  if (tod >= 30 && tod < 300) return walk <= 30 ? { minutes: walk, mode: 'walk', yen: 0 } : taxi;
  const transit = Math.round((o.rural ? 18 : 12) + d * (o.rural ? 3 : 2.2));
  if (walk <= transit) return { minutes: walk, mode: 'walk', yen: 0 };
  return transit <= taxi.minutes + 15 ? { minutes: transit, mode: 'transit', yen: 0 } : taxi;
}

// ── Placing one stop after the current state ──
interface State { at: Place; t: number; meals: Set<Meal>; lastMealEnd: number | null; lastMealLate: boolean; yen: number; travel: number; wait: number; afterRide: boolean }
type Placed = { start: number; end: number; hop: Hop; wait: number };
function place(p: DayProblem, st: State, s: SolveStop, hop: HopFn): Placed | string {
  const h = hop(st.at, s, st.t);
  const buffer = (p.people >= 6 ? 3 : 0) + (st.afterRide ? 10 : 0);
  const arrive = st.t + h.minutes + buffer;
  let start = ceil5(arrive);
  if (s.fixedStart != null) {
    if (arrive > s.fixedStart) return 'cannot get there by its fixed time';
    start = s.fixedStart;
  }
  if (s.meal) {
    const [from, to] = MEALS[s.meal];
    if (s.meal !== 'late' && st.meals.has(s.meal)) return `already had ${s.meal}`;
    if (start < from && s.fixedStart == null) start = from;
    if (start > to) return `too late for ${s.meal}`;
    const gap = s.meal === 'late' || st.lastMealLate ? GAP.late : GAP.full;
    if (st.lastMealEnd != null && start - st.lastMealEnd < gap) {
      if (s.fixedStart != null) return 'too soon after the last meal';
      start = ceil5(st.lastMealEnd + gap);
      if (start > to) return 'too soon after the last meal';
    }
  }
  if (s.windows?.length) {
    // The first opening window the whole visit fits in, starting no earlier than they can be there.
    const w = s.windows.slice().sort((a, b) => a.open - b.open).find((x) => Math.max(start, x.open) + s.minutes <= x.close);
    if (!w) return s.windows.some((x) => x.close > start) ? 'closes before the visit would end' : 'closed by the time they can get there';
    if (w.open > start) {
      if (s.fixedStart != null) return 'not open at its fixed time';
      start = w.open;
    }
  }
  if (s.lastEntry != null && start > s.lastEntry) return `past last entry (${hhmm(s.lastEntry)})`;
  const wait = start - arrive;
  if (wait > (p.maxWait ?? 40) && s.fixedStart == null && !s.meal) return 'too long a wait for it to open';
  const end = start + s.minutes;
  if (end > (p.dayEnd ?? 27 * 60)) return 'runs past the end of the night';
  if (st.yen + h.yen > (p.taxiCapPerPerson ?? 4000) * p.people) return 'over the taxi budget';
  return { start, end, hop: h, wait: Math.max(0, wait) };
}
const startState = (p: DayProblem): State => ({ at: p.start, t: p.start.time, meals: new Set(), lastMealEnd: null, lastMealLate: false, yen: 0, travel: 0, wait: 0, afterRide: false });

/** Find the best feasible day. */
export function solveDay(p: DayProblem, hop: HopFn): Solution {
  const stops = [...p.stops].sort((a, b) => (a.fixedStart ?? 9999) - (b.fixedStart ?? 9999) || b.priority - a.priority);
  const value = (s: SolveStop) => s.priority * 10 + (s.must ? 1000 : 0);
  const maxNodes = p.maxNodes ?? 400000;
  let nodes = 0;
  type Best = { seq: { s: SolveStop; pl: Placed }[]; finish: Hop | null; arriveEnd: number | null; score: number; yen: number; travel: number };
  let best: Best | null = null;
  const seq: { s: SolveStop; pl: Placed }[] = [];
  const used = new Set<string>();
  const cap = (p.taxiCapPerPerson ?? 4000) * p.people;

  const finishFrom = (st: State) => {
    if (!p.end) return { hop: null as Hop | null, arrive: null as number | null };
    const h = hop(st.at, p.end, st.t);
    const arrive = st.t + h.minutes + (st.afterRide ? 10 : 0);
    if (p.end.by != null && arrive > p.end.by) return null;
    if (st.yen + h.yen > cap) return null;
    return { hop: h as Hop | null, arrive: arrive as number | null };
  };
  const gained = () => seq.reduce((n, x) => n + value(x.s), 0);

  const dfs = (st: State) => {
    if (++nodes > maxNodes) return;
    const f = finishFrom(st);
    if (f) {
      const sc = gained() - (st.travel + (f.hop?.minutes ?? 0)) * 0.5 - (st.yen + (f.hop?.yen ?? 0)) / p.people / 100 - st.wait * 0.2;
      if (!best || sc > best.score) best = { seq: [...seq], finish: f.hop, arriveEnd: f.arrive, score: sc, yen: st.yen + (f.hop?.yen ?? 0), travel: st.travel + (f.hop?.minutes ?? 0) };
    }
    // Bound: even adding every stop left can't beat the best.
    const rest = stops.reduce((n, s) => n + (used.has(s.id) ? 0 : value(s)), 0);
    if (best && gained() + rest <= best.score) return;
    for (const s of stops) {
      if (used.has(s.id)) continue;
      const pl = place(p, st, s, hop);
      if (typeof pl === 'string') continue;
      used.add(s.id); seq.push({ s, pl });
      const meal = s.meal ?? null;
      dfs({
        at: s.endAt ?? s, t: pl.end, yen: st.yen + pl.hop.yen, travel: st.travel + pl.hop.minutes, wait: st.wait + pl.wait, afterRide: !!s.ride || !!s.endAt,
        meals: meal ? new Set([...st.meals, meal]) : st.meals,
        lastMealEnd: meal ? pl.end : st.lastMealEnd, lastMealLate: meal ? meal === 'late' : st.lastMealLate,
      });
      seq.pop(); used.delete(s.id);
    }
  };
  dfs(startState(p));

  const b = best as Best | null; // assigned inside dfs, which TypeScript cannot see
  const order: Timed[] = (b?.seq ?? []).map(({ s, pl }) => ({ id: s.id, name: s.name, start: pl.start, end: pl.end, hop: pl.hop, wait: pl.wait }));
  const chosen = new Set(order.map((o) => o.id));
  // Why each left-out stop is out: try it straight after each chosen stop.
  const dropped = stops.filter((s) => !chosen.has(s.id)).map((s) => {
    const why = new Set<string>();
    const anchors = [{ at: p.start as Place, t: p.start.time }, ...order.map((o) => ({ at: (p.stops.find((x) => x.id === o.id)!.endAt ?? p.stops.find((x) => x.id === o.id)!) as Place, t: o.end }))];
    let fits = false;
    for (const a of anchors) { const r = place(p, { ...startState(p), at: a.at, t: a.t }, s, hop); if (typeof r === 'string') why.add(r); else fits = true; }
    return { id: s.id, name: s.name, why: fits ? 'fits on its own, but not alongside the higher-priority stops' : [...why].slice(0, 2).join('; ') };
  });
  const musts = p.stops.filter((s) => s.must).every((s) => chosen.has(s.id));
  return { order, finish: b?.finish ?? null, arriveEnd: b?.arriveEnd ?? null, dropped, score: b?.score ?? -Infinity, taxiYen: b?.yen ?? 0, travel: b?.travel ?? 0, complete: !!b && musts };
}

/** A hop function from measured legs where we have them (keyed "fromId>toId"), else the estimate. */
export function hopsWith(measured: Map<string, Hop>, o: EstimateOpts): HopFn {
  return (a, b, at) => measured.get(`${a.id}>${b.id}`) ?? estimateHop(a, b, at, o);
}
export const describeHop = (h: Hop, people: number) => {
  const cars = Math.ceil(people / 4);
  return h.mode === 'walk' ? `Walk ${h.minutes} min` : h.mode === 'taxi' ? `Taxi ${h.minutes} min (${cars} cars, about ¥${(Math.round(h.yen / cars / 100) * 100).toLocaleString('en-US')} each)` : `Train or bus, about ${h.minutes} min`;
};
