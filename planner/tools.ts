// The trip tools: everything the planning session (and its helper agents) needs to research, verify,
// schedule, check, write and publish a trip, with no Anthropic API calls. Each tool is a plain
// function with a zod input schema; mcp.ts serves the same registry over MCP, and this file is also
// a command line for when the MCP server isn't loaded:
//
//   node planner/tools.ts list                    the tools and what they do
//   node planner/tools.ts <tool> '<json>'         run one (or pass the JSON on stdin, or @file.json)
//
// Session state lives in data/research/session/ (one file per thing, so parallel agents never write
// the same file).
import { z } from 'zod';
import { existsSync, mkdirSync, readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { CACHE_DIR, km, pool, readJson, ROOT, writeJson } from './lib.ts';
import * as S from './sources.ts';
import * as F from './facts.ts';
import {
  anchors, assemble, auditDay, allowedForDay, Brief, Candidate, checkPlan, DayGuide, dayText, dossierFor, legText, measuredTransport, patchDay, Plan,
  PLAN_SYSTEM, RESEARCH_SYSTEM, resolveAll, stripDay, taxiFare, THEMES, today, tripDates, WRITE_SYSTEM, FACT_SYSTEM,
  type AnchorStay, type FactError, type Leg,
} from './core.ts';
import { estimateHop, hhmm, solveDay, describeHop, type Hop, type SolveStop } from './solver.ts';

export const DIR = resolve(ROOT, 'data/research/session');
const path = (...p: string[]) => resolve(DIR, ...p);
const read = <T>(p: string, fb: T): T => readJson<T>(path(p), fb);
const save = (p: string, v: unknown) => writeJson(path(p), v);
const list = (dir: string) => (existsSync(path(dir)) ? readdirSync(path(dir)).filter((f) => f.endsWith('.json')).sort() : []);
const slug = (s: string) => s.toLowerCase().normalize('NFKD').replace(/[^a-z0-9぀-ヿ一-鿿]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);

type Cand = z.infer<typeof Candidate> & { id?: string; verified?: S.PlaceFacts | null; facts?: F.FactSheet; media?: unknown[] };
type PlanDay = z.infer<typeof Plan>['days'][number];
type Extras = { todos: z.infer<typeof Plan>['todos']; budget: z.infer<typeof Plan>['budget']; coverage: z.infer<typeof Plan>['coverage']; logistics: string[] };

// ── Loading the session ──
const brief = () => { const b = read<z.infer<typeof Brief> | null>('brief.json', null); if (!b) throw new Error('No brief yet: run save_brief first.'); return b; };
/** Candidates with their verified facts merged in (facts live one file per place). */
function candidates(): Cand[] {
  const cs = read<Cand[]>('candidates.json', []);
  for (const c of cs) { const f = read<F.FactSheet | null>(`facts/${c.id}.json`, null); if (f) c.facts = f; }
  return cs;
}
const byId = () => new Map(candidates().map((c) => [c.id!, c]));
const legsOf = (date: string) => new Map<string, Leg>(read<[string, Leg][]>(`legs/${date}.json`, []));
const allLegs = () => new Map<string, Leg>(list('legs').flatMap((f) => read<[string, Leg][]>(`legs/${f}`, [])));
const days = () => list('days').map((f) => read<PlanDay>(`days/${f}`, null as never));
const extras = (): Extras => read<Extras>('extras.json', { todos: [], budget: [], coverage: [], logistics: [] });
const stays = (b: z.infer<typeof Brief>): AnchorStay[] => { const cities = new Set(b.legs.map((l) => l.city.toLowerCase())); return anchors().filter((s) => cities.has(s.city.toLowerCase())); };
/** "HH:MM" → minutes; with `after`, a time more than 6 hours before it counts as after midnight. */
const toMin = (t: string, after?: number) => { const v = +t.slice(0, 2) * 60 + +t.slice(3, 5); return after != null && v < after - 360 ? v + 1440 : v; };
const weekday = (d: string, style: 'short' | 'long' = 'short') => new Date(`${d}T12:00:00+09:00`).toLocaleDateString('en-US', { weekday: style, timeZone: 'Asia/Tokyo' });

// ── Tool registry ──
export interface Tool { name: string; description: string; input: z.ZodObject<z.ZodRawShape>; run: (x: never) => Promise<unknown> }
const tools: Tool[] = [];
function tool<T extends z.ZodRawShape>(name: string, description: string, shape: T, run: (x: z.infer<z.ZodObject<T>>) => Promise<unknown>) {
  tools.push({ name, description, input: z.object(shape) as unknown as z.ZodObject<z.ZodRawShape>, run: run as (x: never) => Promise<unknown> });
}
const ll = { lat: z.number(), lng: z.number() };

// ── Research (free or cents): social platforms, X in Japan, Japanese Google, Maps reviews, videos, places ──
tool('social_search', 'Search one social platform via TikHub (~$0.001 a call). Japanese queries for locals (e.g. "渋谷 居酒屋 大人数"), English for visitors, Chinese on xiaohongshu.',
  { platform: z.enum(['tiktok', 'instagram', 'lemon8', 'xiaohongshu', 'reddit', 'threads', 'youtube']), query: z.string() }, async ({ platform, query }) => S.socialSearch(platform, query));
tool('posts_at_place', 'Recent Instagram posts tagged at a place: is it real, current, still loved?', { name: z.string(), ...ll }, async ({ name, lat, lng }) => S.postsAtPlace({ lat, lng }, name));
tool('x_japan', 'What people in Japan are posting on X right now (Yahoo! Japan realtime search, free): queues, sold out, closures, crowds. Search in Japanese.', { query: z.string() }, async ({ query }) => S.xJapan(query));
tool('google_japan', 'Google as people in Japan see it (gl=jp, hl=ja). Free tier of ~250 a month: use sparingly, in Japanese, for local blogs, rankings and official pages.', { query: z.string() }, async ({ query }) => S.googleJapan(query));
tool('maps_reviews', 'Newest Japanese Google Maps reviews of a place, optionally only those on a topic ("団体" groups, "待ち" queues). Same free tier: finalists only.', { name: z.string(), ...ll, topic: z.string().nullable().optional() }, async ({ name, lat, lng, topic }) => S.mapsReviews(name, { lat, lng }, topic ?? undefined));
tool('watch_video', 'Watch a TikTok / reel / YouTube video (speech, on-screen Japanese text) with Gemini (free tier) and report places, prices, verdicts.', { url: z.string(), question: z.string() }, async ({ url, question }) => S.watchVideo(url, question));
tool('find_place', 'A place\'s coordinates, address, Google hours and status. Use before saving a candidate.', { name: z.string(), area: z.string(), ...ll }, async ({ name, area, lat, lng }) => (await S.findPlace(name, { lat, lng }, area)) ?? 'not found (try the Japanese name)');

// ── Brief and research results ──
tool('prompt', 'The house instructions for a role: research, plan, write, check, or the research themes. Read it before doing that job.', { role: z.enum(['research', 'plan', 'write', 'check', 'themes']) }, async ({ role }) =>
  role === 'research' ? RESEARCH_SYSTEM : role === 'plan' ? PLAN_SYSTEM : role === 'write' ? WRITE_SYSTEM : role === 'check' ? FACT_SYSTEM : THEMES);
tool('save_brief', 'Save the parsed trip brief (validated).', { brief: Brief }, async ({ brief: b }) => { save('brief.json', b); return `Saved: ${b.legs.map((l) => `${l.city} ${l.from}→${l.to}`).join(' · ')}, ${b.wishes.length} wishes.`; });
tool('save_candidates', 'Save researched candidates for one city and theme (call as often as you like; each call adds). Only places with evidence and coordinates from find_place.',
  { city: z.string(), theme: z.string(), candidates: z.array(Candidate), notes: z.string().nullable().optional() }, async ({ city, theme, candidates: cs, notes }) => {
    const f = `raw/${slug(city)}-${slug(theme)}.json`;
    const prev = read<{ candidates: unknown[]; notes: string }>(f, { candidates: [], notes: '' });
    save(f, { candidates: [...prev.candidates, ...cs], notes: notes ? `${city} · ${theme}: ${notes}` : prev.notes });
    return `Saved ${cs.length}; ${prev.candidates.length + cs.length} for ${city} · ${theme}.`;
  });
tool('resolve', 'Merge all saved research (plus earlier cached research for these cities), find and verify each place, attach photos and videos, and number them c1, c2…',
  {}, async () => {
    const b = brief();
    const cities = new Set(b.legs.map((l) => l.city.toLowerCase()));
    const raw = list('raw').map((f) => read<{ candidates: Cand[]; notes: string }>(`raw/${f}`, { candidates: [], notes: '' }));
    // Research the API pipeline already paid for is reused, never redone.
    const dir = resolve(CACHE_DIR, 'research');
    const cachedResearch = existsSync(dir) ? readdirSync(dir).map((f) => JSON.parse(readFileSync(resolve(dir, f), 'utf8')) as { key: unknown[]; value: { candidates: Cand[]; notes: string } })
      .filter((e) => e.key[0] === 'claude-opus-5-5' && cities.has(String((e.key[2] as { city: string }).city).toLowerCase())) : [];
    const sets = [...raw, ...cachedResearch.map((e) => ({ ...e.value, notes: `${(e.key[2] as { city: string }).city} · ${e.key[3]}: ${e.value.notes}` }))];
    const all = sets.flatMap((r) => r.candidates).filter((c) => cities.has(c.city.toLowerCase()));
    const out = await resolveAll(all as never, stays(b));
    save('candidates.json', out); save('notes.json', sets.map((r) => r.notes).filter((n) => n && n.length > 30));
    return `${out.length} places (from ${all.length} found; ${cachedResearch.length} cached research tasks reused). By city: ${[...cities].map((c) => `${c} ${out.filter((x) => x.city.toLowerCase() === c).length}`).join(', ')}.`;
  });
tool('list_candidates', 'The resolved places, short form: id, name, city, area, kind, website, and how many verified facts.', { city: z.string().nullable().optional(), missing_facts: z.boolean().optional() }, async ({ city, missing_facts }) =>
  candidates().filter((c) => (!city || c.city.toLowerCase() === city.toLowerCase()) && (!missing_facts || !c.facts)).map((c) => `${c.id} · ${c.name}${c.name_ja ? ` (${c.name_ja})` : ''} · ${c.city}/${c.area} · ${c.kind}${c.verified?.website ? ` · ${c.verified.website}` : ''}${c.facts ? ` · ${F.factLines(c.facts).length} facts` : ''}`).join('\n') || 'none');

// ── Facts: the agent finds the official pages, reads them, fills the sheet; code checks every quote ──
tool('fact_sources', 'The text of a place\'s pages near hours, prices, closures, year-end and group rules: its own website plus any URLs you found with WebSearch (official site, operator timetable, Tabelog/TableCheck page). Read it, then save_facts.',
  { id: z.string(), urls: z.array(z.string()).optional() }, async ({ id, urls }) => {
    const c = byId().get(id); if (!c) throw new Error(`No candidate ${id}`);
    const dates = tripDates(brief(), c.city);
    const month = `${dates[0]?.slice(0, 4)}年${+(dates[0]?.slice(5, 7) ?? 12)}月`;
    // Perplexity only when switched on (PLAN_PERPLEXITY=1); otherwise the session's own WebSearch finds the pages.
    const auto = process.env.PLAN_PERPLEXITY === '1' ? await F.sourcesFor(c.name, c.name_ja, c.area, c.verified?.website, month) : [];
    const own = await Promise.all([...new Set([c.verified?.website, ...(urls ?? [])].filter((u): u is string => !!u && /^https?:/.test(u)))].slice(0, 5).map(async (url) => ({ url, text: F.relevant(await F.pageText(url)) })));
    const sources = [...own, ...auto.filter((a) => !own.some((o) => o.url === a.url))].filter((s) => s.text.trim().length > 40);
    save(`sources/${id}.json`, sources);
    if (!sources.length) return `No readable text for ${c.name}. Find its official page (or Tabelog/TableCheck/operator page) with WebSearch and call again with urls.`;
    return `PLACE: ${c.name}${c.name_ja ? ` (${c.name_ja})` : ''}, ${c.area}, ${c.city}\nTRIP DATES HERE: ${dates.map((d) => `${d} (${weekday(d)})`).join(', ')}\nRULES: ${F.FACTS_SYSTEM}\nSHEET SCHEMA: ${JSON.stringify(z.toJSONSchema(F.FactSheet))}\n\n${sources.map((s) => `SOURCE ${s.url}\n${s.text}`).join('\n\n')}`;
  });
tool('save_facts', 'Save a place\'s fact sheet. Every value needs its exact quote and the url it came from; code checks each quote is on that page and drops the ones that aren\'t.',
  { id: z.string(), sheet: F.FactSheet }, async ({ id, sheet }) => {
    const v = F.validate(sheet, read<F.Source[]>(`sources/${id}.json`, []));
    save(`facts/${id}.json`, v.sheet);
    return `Kept ${F.factLines(v.sheet).length} fact(s)${v.dropped.length ? `; dropped ${v.dropped.length} (quote not found on its page): ${v.dropped.join(' | ')}` : ''}.`;
  });

// ── Planning: context, skeleton, the solver, and checking a day against real travel times ──
tool('context', 'Everything a planner needs for a city (or the whole trip): brief, booked stays, area notes, skeleton, and the catalogue of places with verified facts.',
  { city: z.string().nullable().optional() }, async ({ city }) => {
    const b = brief();
    const cs = candidates().filter((c) => !city || c.city.toLowerCase() === city.toLowerCase());
    const places = cs.map((c) => ({ id: c.id, name: c.name, ja: c.name_ja, area: c.area, kind: c.kind, why: c.why, best_time: c.best_time, dates: c.dates, price: c.price, booking: c.booking, group: c.group_of_8, visit_minutes: c.visit_minutes, first_last: c.first_last, google_hours: c.verified?.hours ?? null, verified_facts: c.facts ? F.factLines(c.facts).map((f) => f.text) : [], lat: c.lat, lng: c.lng, wishes: c.wish_ids, confidence: c.confidence }));
    const notes = read<string[]>('notes.json', []).filter((n) => !city || n.toLowerCase().startsWith(city.toLowerCase()));
    return { today, brief: b, stays: stays(b).map((s) => ({ name: s.stay.short, city: s.city, in: s.stay.checkInISO, out: s.stay.checkOutISO, lat: s.at.lat, lng: s.at.lng })), notes: notes.join('\n\n').slice(0, 20000), skeleton: read('skeleton.json', null), places };
  });
tool('save_skeleton', 'Save the trip skeleton: each day\'s city, area, start and end, anchors, plus trip-wide logistics (where the luggage is each day, passes and what they cover, tax-free rules).',
  { logistics: z.array(z.string()), days: z.array(z.object({ date: z.string(), city: z.string(), area: z.string(), theme: z.string(), start: z.string().describe('Where and when the day starts'), end: z.string().describe('Where the day ends'), anchors: z.array(z.string()), notes: z.string().nullable() })) },
  async (sk) => { save('skeleton.json', sk); save('extras.json', { ...extras(), logistics: sk.logistics }); return `Saved ${sk.days.length} days and ${sk.logistics.length} logistics lines.`; });

const SolveIn = {
  date: z.string(), city: z.string(),
  start: z.object({ name: z.string(), ...ll, time: z.string().describe('HH:MM') }),
  end: z.object({ name: z.string(), ...ll, by: z.string().nullable().optional().describe('HH:MM (after midnight: 01:30)') }).nullable().optional(),
  stops: z.array(z.object({
    id: z.string().describe('A candidate id (c12) or your own id for a non-candidate stop (e.g. "romancecar")'), name: z.string().optional(),
    lat: z.number().optional(), lng: z.number().optional(), minutes: z.number(), priority: z.number().describe('1–10'),
    meal: z.enum(['breakfast', 'lunch', 'dinner', 'late']).nullable().optional(), fixed: z.string().nullable().optional().describe('HH:MM it must start'),
    must: z.boolean().optional(), ride: z.boolean().optional().describe('An arrival by train, boat or plane: the group needs 10 minutes after it'),
    end_lat: z.number().nullable().optional(), end_lng: z.number().nullable().optional(),
  })),
  taxi_cap_pp: z.number().optional().describe('Yen per person per day for taxis (default 4000)'),
};
tool('solve_day', 'Order and time a day. Give the options with priority (1–10), minutes and meal type; it applies verified hours for that date, last entry, time limits, fixed times, meal spacing, travel (measured where known, else estimated) with group buffers, and the taxi budget. Returns the best feasible timetable and what didn\'t fit, and why.',
  SolveIn, async (q) => {
    const b = brief();
    const cs = byId();
    const date = q.date;
    const dow = new Date(`${date}T12:00:00+09:00`).getUTCDay();
    const startT = toMin(q.start.time);
    const excluded: string[] = [];
    const stops: SolveStop[] = [];
    for (const s of q.stops) {
      const c = cs.get(s.id);
      const lat = s.lat ?? c?.lat, lng = s.lng ?? c?.lng;
      if (lat == null || lng == null) { excluded.push(`${s.id}: no coordinates`); continue; }
      const f = c?.facts;
      const shut = f?.closed.find((x) => x.whole_place && x.dates.includes(date));
      if (shut) { excluded.push(`${c!.name}: closed on ${date} (${shut.why})`); continue; }
      // Opening windows: verified facts for this date, else Google's weekly hours.
      let windows: { open: number; close: number }[] | null = null;
      const fo = f?.open.filter((o) => o.dates.includes(date)) ?? [];
      if (fo.length) windows = fo.map((o) => { const a = toMin(o.open), z2 = toMin(o.close); return { open: a, close: z2 <= a ? z2 + 1440 : z2 }; });
      else if (c?.verified?.periods?.length) {
        windows = c.verified.periods.filter((p) => p.open.day === dow).map((p) => { const a = p.open.hour * 60 + p.open.minute; const z2 = p.close ? p.close.hour * 60 + p.close.minute + (p.close.day !== p.open.day ? 1440 : 0) : a + 1440; return { open: a, close: z2 <= a ? z2 + 1440 : z2 }; });
        if (!windows.length) { excluded.push(`${c.name}: closed on ${weekday(date, 'long')}s (Google hours)`); continue; }
      }
      let minutes = s.minutes;
      if (f?.time_limit) minutes = Math.min(minutes, f.time_limit.minutes);
      if (f?.fixed_minutes) minutes = Math.max(minutes, f.fixed_minutes.minutes);
      stops.push({
        id: s.id, name: s.name ?? c?.name ?? s.id, lat, lng, minutes, priority: s.priority, meal: s.meal ?? null, windows,
        lastEntry: f?.last_entry ? toMin(f.last_entry.time, startT) : null, fixedStart: s.fixed ? toMin(s.fixed, startT) : null, must: s.must, ride: s.ride,
        endAt: s.end_lat != null && s.end_lng != null ? { id: `${s.id}:end`, name: `${s.name ?? c?.name} (end)`, lat: s.end_lat, lng: s.end_lng } : null,
      });
    }
    // Travel: legs measured by earlier checks of this trip, then Google walking times for short hops, then estimates.
    const measured = read<Record<string, Hop>>('hops.json', {});
    const rural = /hakone|nikko|kawaguchi|izu/i.test(q.city);
    type Pt = { id: string; lat: number; lng: number };
    const pts: Pt[] = [{ id: 'start', lat: q.start.lat, lng: q.start.lng }, ...stops, ...stops.flatMap((s) => (s.endAt ? [s.endAt] : [])), ...(q.end ? [{ id: 'end', lat: q.end.lat, lng: q.end.lng }] : [])];
    const walk = new Map<string, number>();
    await pool(pts.flatMap((a) => pts.filter((c) => a !== c && km(a, c) < 1.5).map((c) => [a, c] as const)), 8, async ([a, c]) => { const m = await S.googleMinutes(a, c, 'WALK'); if (m != null) walk.set(`${a.id}>${c.id}`, m); });
    const at = (p: { lat: number; lng: number }) => `${p.lat.toFixed(4)},${p.lng.toFixed(4)}`;
    const hop = (a: Pt, c: Pt, t: number): Hop => {
      const m = measured[`${at(a)}>${at(c)}`];
      if (m) return m;
      const w = walk.get(`${a.id}>${c.id}`);
      if (w != null && w <= 18) return { minutes: w, mode: 'walk', yen: 0 };
      return estimateHop(a, c, t, { people: b.people, rural });
    };
    const sol = solveDay({
      start: { id: 'start', name: q.start.name, lat: q.start.lat, lng: q.start.lng, time: startT },
      end: q.end ? { id: 'end', name: q.end.name, lat: q.end.lat, lng: q.end.lng, by: q.end.by ? toMin(q.end.by, startT) : null } : null,
      stops, people: b.people, taxiCapPerPerson: q.taxi_cap_pp ?? 4000,
    }, hop);
    return {
      complete: sol.complete,
      leave_start: sol.order[0]?.hop ? describeHop(sol.order[0].hop, b.people) : null,
      timetable: sol.order.map((o, i) => {
        const nh = sol.order[i + 1]?.hop ?? (i === sol.order.length - 1 ? sol.finish : null);
        return { id: o.id, name: o.name, start: hhmm(o.start), end: hhmm(o.end), transport_to_next: nh ? describeHop(nh, b.people) : null, ...(o.wait ? { waits_min: o.wait } : {}) };
      }),
      arrive_end: sol.arriveEnd != null ? hhmm(sol.arriveEnd) : null,
      taxi_yen_pp: Math.round(sol.taxiYen / b.people), travel_minutes: sol.travel,
      left_out: [...excluded, ...sol.dropped.map((d) => `${d.name}: ${d.why}`)],
      note: 'Travel is measured where earlier checks measured it, otherwise estimated; save_day measures every leg with real timetables.',
    };
  });

tool('save_day', 'Save one planned day (title, stamp, stops in order with candidate_id, times, category, plan line, price, transport to next). It checks the day against verified facts and real travel (NAVITIME trains, Google walking/driving), stores the measured legs, and returns any problems. Fix and save again until it returns none.',
  { day: Plan.shape.days.element }, async ({ day }) => {
    const b = brief();
    const cs = byId();
    // Coordinates come from verified research, not from memory.
    for (const s of day.stops) { const c = s.candidate_id ? cs.get(s.candidate_id) : undefined; if (c?.lat != null) { s.lat = c.lat; s.lng = c.lng; } }
    const plan = { days: [day], todos: [], budget: [], coverage: b.wishes.map((w) => ({ wish_id: w.id, how: '' })), logistics: extras().logistics };
    const { issues, legs } = await checkPlan(plan, b, cs as never);
    measuredTransport(plan, legs);
    save(`days/${day.date}.json`, day);
    save(`legs/${day.date}.json`, [...legs]);
    // Remember what was measured, so the solver uses real times from now on.
    const hops = read<Record<string, Hop>>('hops.json', {});
    const at = (p: { lat: number | null; lng: number | null }) => `${p.lat?.toFixed(4)},${p.lng?.toFixed(4)}`;
    for (const [k, l] of legs) {
      const i = +k.split('#')[1]; const a = day.stops[i], c = day.stops[i + 1];
      if (!a || !c || a.lat == null || c.lat == null) continue;
      const from = a.end_lat != null ? { lat: a.end_lat, lng: a.end_lng } : a;
      const taxi = /taxi|cab/i.test(a.transport ?? '');
      const cars = Math.ceil(b.people / 4);
      hops[`${at(from)}>${at(c)}`] = taxi && l.carMinutes != null ? { minutes: l.carMinutes + 5, mode: 'taxi', yen: cars * taxiFare(l.carMinutes) }
        : l.mode === 'car' ? { minutes: l.minutes, mode: 'taxi', yen: cars * taxiFare(l.minutes) } : { minutes: l.minutes, mode: l.mode, yen: 0 };
    }
    save('hops.json', hops);
    return { saved: true, problems: issues.filter((x) => x.startsWith(day.date)), measured: [...legs.values()].map((l) => `${l.key}: ${legText(l)}`) };
  });
tool('save_extras', 'Save the trip-wide to-dos (bookings with due dates), budget rows and wish coverage.',
  { todos: Plan.shape.todos, budget: Plan.shape.budget, coverage: Plan.shape.coverage }, async (x) => { save('extras.json', { ...extras(), ...x }); return `Saved ${x.todos.length} to-dos, ${x.budget.length} budget rows, coverage for ${x.coverage.length} wishes.`; });

// ── Writing and checking ──
tool('writer_context', 'What the writer needs for one day: logistics, the stops with research, verified facts and the measured route to the next stop, and the output schema.',
  { date: z.string() }, async ({ date }) => {
    const b = brief(); const d = read<PlanDay | null>(`days/${date}.json`, null); if (!d) throw new Error(`No saved day ${date}`);
    const n = days().findIndex((x) => x.date === date) + 1;
    return `Group: ${b.people} people. ${b.who}\nTRIP LOGISTICS\n${extras().logistics.map((l) => `- ${l}`).join('\n')}\nDay ${n}: ${d.date} (${weekday(d.date, 'long')}), ${d.city}: ${d.title}\nWishes: ${b.wishes.map((w) => `${w.id}: ${w.text}`).join(' · ')}\n\nSTOPS\n${JSON.stringify(dossierFor(d, byId() as never, legsOf(date)))}\n\nOUTPUT: one JSON object matching this schema (stops indexed from 0, one entry per stop that is not a stay or transfer):\n${JSON.stringify(z.toJSONSchema(DayGuide))}`;
  });
tool('save_guide', 'Save one day\'s guidebook (the DayGuide JSON). Code audits every price, time, duration and distance against the stop\'s facts, research, plan and measured route, and returns any unbacked numbers to fix.',
  { date: z.string(), guide: DayGuide }, async ({ date, guide }) => {
    const d = read<PlanDay | null>(`days/${date}.json`, null); if (!d) throw new Error(`No saved day ${date}`);
    save(`guides/${date}.json`, guide);
    const bad = auditDay(guide, allowedForDay(d, byId() as never, legsOf(date), brief().people));
    return bad.length ? { saved: true, unbacked: bad, next: 'Rewrite those sentences without the number (or with the backed value) and save again. Anything still unbacked at publish is cut.' } : { saved: true, unbacked: [] };
  });
tool('day_text', 'One day as the fact-checker reads it (verified facts and measured routes marked).', { date: z.string() }, async ({ date }) => {
  const it = await assembled(); const d = it.days.find((x) => x.date === date); if (!d) throw new Error(`No day ${date}`);
  return dayText(d, extras().logistics);
});
tool('verify_citation', 'Fetch a page and confirm a quote is really on it (spaces, character width and commas ignored).', { url: z.string(), quote: z.string() }, async ({ url, quote }) => {
  const text = await F.pageText(url);
  if (!text) return { found: false, why: 'page could not be read' };
  return { found: F.flat(text).includes(F.flat(quote)), chars: text.length };
});
tool('save_corrections', 'Save the fact-checker\'s corrections for a day. Each must quote its source word for word; code fetches the source and keeps only corrections whose quote is really there.',
  { date: z.string(), errors: z.array(z.object({ stop: z.number().describe('Stop # (-1 for the day notes)'), claim: z.string().describe('The wrong sentence, copied exactly'), fix: z.string().describe('The corrected sentence'), source_url: z.string(), source_quote: z.string().describe('Words copied exactly from the source that prove the fix'), schedule: z.boolean() })) },
  async ({ date, errors }) => {
    const kept: FactError[] = [], dropped: string[] = [];
    for (const e of errors) {
      const t = await F.pageText(e.source_url);
      if (t && F.flat(e.source_quote).length >= 6 && F.flat(t).includes(F.flat(e.source_quote))) kept.push(e); else dropped.push(`"${e.claim.slice(0, 60)}": quote not found at ${e.source_url}`);
    }
    save(`corrections/${date}.json`, kept);
    return { kept: kept.length, dropped };
  });

// ── Publishing ──
async function assembled() {
  const b = brief();
  const cs = byId();
  const ds = days().sort((a, c) => a.date.localeCompare(c.date));
  const legs = allLegs();
  const e = extras();
  const plan = { days: ds, todos: e.todos, budget: e.budget, coverage: e.coverage, logistics: e.logistics };
  // The audit's last word: anything still unbacked is cut.
  const guides = ds.map((d) => {
    const g = read<z.infer<typeof DayGuide> | null>(`guides/${d.date}.json`, null) ?? { notes: [], stops: [] };
    const allowed = allowedForDay(d, cs as never, legs, b.people);
    return auditDay(g, allowed).length ? stripDay(g, allowed) : g;
  });
  const briefText = existsSync(resolve(ROOT, 'planner/brief.md')) ? readFileSync(resolve(ROOT, 'planner/brief.md'), 'utf8') : '';
  return assemble(b, Object.assign(plan, { legs, warnings: [] as string[] }), guides, cs as never, stays(b), briefText);
}
tool('publish', 'Assemble the itinerary from the saved days, guides, extras and corrections; write data/itinerary.json (or a preview file); report anything left as a warning.',
  { preview: z.string().nullable().optional().describe('Write data/research/preview-<name>.json instead of the live itinerary') }, async ({ preview }) => {
    const b = brief();
    const it = await assembled();
    const cs = byId();
    const legs = allLegs();
    const warnings: string[] = [];
    let applied = 0;
    for (const d of it.days) {
      const pd = days().find((x) => x.date === d.date)!;
      const measured = pd.stops.map((s, i) => { const c = s.candidate_id ? cs.get(s.candidate_id) : undefined; return F.allowedFrom([legText(legs.get(`${d.date}#${i}`)), ...(c?.facts ? F.factLines(c.facts).map((f) => f.text) : [])], b.people); });
      const errs = read<FactError[]>(`corrections/${d.date}.json`, []);
      applied += errs.length;
      warnings.push(...patchDay(d, errs, measured));
    }
    it.warnings = warnings;
    it.sources = [...new Set([...it.sources.filter((x) => !/claude web search|grok|perplexity/.test(x)), 'web search', 'Yahoo! Japan realtime (X)', ...(applied ? [`fact-checked: ${applied} correction(s) applied`] : [])])];
    const out = preview ? resolve(ROOT, `data/research/preview-${slug(preview)}.json`) : resolve(ROOT, 'data/itinerary.json');
    writeJson(out, it);
    return `Wrote ${out.replace(`${ROOT}/`, '')}: ${it.days.length} days, ${it.days.reduce((n, d) => n + d.stops.length, 0)} stops, ${it.todos.length} to-dos, ${warnings.length} warning(s)${warnings.length ? `:\n- ${warnings.join('\n- ')}` : ''}.`;
  });
tool('status', 'What the session has so far.', {}, async () => {
  const b = read<z.infer<typeof Brief> | null>('brief.json', null);
  return [
    `brief: ${b ? `${b.legs.map((l) => `${l.city} ${l.from}→${l.to}`).join(' · ')} (${b.wishes.length} wishes)` : 'none'}`,
    `research files: ${list('raw').length}`, `places: ${read<Cand[]>('candidates.json', []).length} (facts read for ${list('facts').length})`,
    `skeleton: ${existsSync(path('skeleton.json')) ? 'yes' : 'no'}`, `days planned: ${list('days').length}`, `guides written: ${list('guides').length}`, `days fact-checked: ${list('corrections').length}`,
  ].join('\n');
});

export const TOOLS = tools;
export async function runTool(name: string, input: unknown) {
  const t = tools.find((x) => x.name === name);
  if (!t) throw new Error(`Unknown tool ${name}. Tools: ${tools.map((x) => x.name).join(', ')}`);
  const parsed = t.input.safeParse(input ?? {});
  if (!parsed.success) throw new Error(`Bad input for ${name}: ${parsed.error.message.slice(0, 800)}`);
  return t.run(parsed.data as never);
}
mkdirSync(DIR, { recursive: true });

// ── Command line ──
if (import.meta.url === `file://${process.argv[1]}`) {
  const [name, arg] = process.argv.slice(2);
  if (!name || name === 'list') {
    for (const t of tools) console.log(`${t.name}: ${t.description}`);
  } else {
    const raw = arg ? (arg.startsWith('@') ? readFileSync(arg.slice(1), 'utf8') : arg) : readFileSync(0, 'utf8');
    try {
      const out = await runTool(name, raw.trim() ? JSON.parse(raw) : {});
      console.log(typeof out === 'string' ? out : JSON.stringify(out, null, 1));
    } catch (e) {
      console.error(`ERROR: ${(e as Error).message}`);
      process.exit(1);
    }
  }
}
