// The agent's shared core: schemas, prompts, resolving places, the plan checks, the number audit,
// correction patching and assembling the site's itinerary. Used by the API pipeline (index.ts) and by
// the session tools (tools.ts / mcp.ts), so both make exactly the same checks.
import { z } from 'zod';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { km, log, pool, ROOT } from './lib.ts';
import * as S from './sources.ts';
import * as F from './facts.ts';
import { parsePlan, type Stay } from '../src/lib/plan.ts';
import { dayLabel, stopTimes, type Guide, type GuideMedia, type Itinerary, type ItinDay } from '../src/lib/itinerary.ts';
import { hoursAt, parseHours } from '../src/lib/hours.ts';

export const today = new Date().toISOString().slice(0, 10);

// ── Schemas (nullable rather than optional: structured outputs want every field present) ──
export const Brief = z.object({
  title: z.string().describe('Short trip title, e.g. "Japan, Dec 2026 · 8 friends"'),
  people: z.number().describe('How many travellers'),
  who: z.string().describe('Who is going, in a sentence: ages, vibe, what they love'),
  legs: z.array(z.object({ city: z.string(), from: z.string().describe('YYYY-MM-DD'), to: z.string().describe('YYYY-MM-DD'), base: z.string().nullable().describe('Where they sleep, if known') })),
  arrival: z.string().nullable().describe('When/where they land, e.g. "2026-12-15 15:00 Haneda T3"'),
  departure: z.string().nullable(),
  wishes: z.array(z.object({ id: z.string().describe('w1, w2, …'), text: z.string().describe('One explicit wish, preference or constraint, in the brief\'s own words') })).describe('EVERY concrete thing the brief asks for, likes, avoids or mentions. Do not merge or drop any.'),
  pace: z.string().describe('How full the days should be, inferred from the brief'),
});
export type Brief = z.infer<typeof Brief>;

export const KINDS = ['food', 'bar', 'nightlife', 'cafe', 'sight', 'experience', 'shopping', 'onsen', 'event', 'other'] as const;
export const Candidate = z.object({
  name: z.string().describe('Proper name as locals know it (romanised)'),
  name_ja: z.string().nullable().describe('Japanese name, if it has one'),
  city: z.string(), area: z.string().describe('Neighbourhood, e.g. Shibuya, Namba'),
  kind: z.enum(KINDS),
  why: z.string().describe('Why it earns a place: what it is, what is special, the verdict from the evidence (2–4 sentences)'),
  best_time: z.string().nullable().describe('When to go (time of day / day of week), and why'),
  dates: z.string().nullable().describe('For events and seasonal things: the exact dates in the trip window'),
  price: z.string().nullable().describe('Typical spend, e.g. "¥1,200 pp" or "¥3,500 pp with drinks"'),
  booking: z.string().nullable().describe('If it needs booking: how, where, when it opens, how far ahead'),
  group_of_8: z.string().nullable().describe('Whether it works for the whole group, and how'),
  hours: z.string().nullable().describe('Opening hours if found'),
  visit_minutes: z.number().nullable().describe('How long it really takes (a bath slot, a show, a ride, a meal), from the source'),
  first_last: z.string().nullable().describe('For rides, shows and attractions: first and last departure / entry, and any date-specific closure'),
  lat: z.number().nullable(), lng: z.number().nullable(),
  wish_ids: z.array(z.string()).describe('Which brief wishes (w1…) this serves'),
  evidence: z.array(z.object({ source: z.string().describe('e.g. TikTok @user, Reddit r/JapanTravel, Tabelog, Google Maps (ja), X, blog'), url: z.string(), note: z.string().describe('What this source says, concretely, incl. date if known') })),
  confidence: z.number().describe('0–1: how sure you are it is excellent AND right for this group'),
});
export type Candidate = z.infer<typeof Candidate> & { id?: string; verified?: S.PlaceFacts | null; media?: GuideMedia[]; facts?: F.FactSheet };

export const CATEGORIES = ['transport', 'stay', 'restaurant', 'attraction', 'shopping', 'activity', 'bar', 'nature', 'other'] as const;
export const Plan = z.object({
  days: z.array(z.object({
    date: z.string(), city: z.string(),
    title: z.string().describe('The day in a line, e.g. "Lucky-cat temple · Harajuku crawl · Shibuya Sky sunset · karaoke"'),
    stamp: z.object({ kanji: z.string().describe('One kanji for the day (place or theme)'), reading: z.string().describe('Its reading · meaning'), place: z.string().describe('Short caps place line, e.g. "SHIBUYA · HARAJUKU"') }),
    stops: z.array(z.object({
      start: z.string().describe('HH:MM, 24h; after midnight keep counting forward (00:30 after 23:00 is the same night)'),
      end: z.string(),
      candidate_id: z.string().nullable().describe('The research candidate id (c12…) or null for anchors/transport/meals not from research'),
      name: z.string(), category: z.enum(CATEGORIES), category_label: z.string().describe('e.g. Restaurant, Bar, Attraction, Transport, Stay'),
      plan: z.string().describe('One line: what to do here'),
      price: z.string().nullable().describe('"¥2,900 pp" or "¥24,000 group total" or null when free'),
      lat: z.number().nullable(), lng: z.number().nullable(),
      end_lat: z.number().nullable().describe('Only for a ride, cruise or transfer that finishes somewhere else (e.g. the pirate ship docking at Motohakone): where it ends. Otherwise null'),
      end_lng: z.number().nullable(),
      transport: z.string().nullable().describe('How to get to the NEXT stop, naming the line/mode and minutes, e.g. "Yamanote line Harajuku → Shibuya, 3 min"'),
    })),
  })),
  todos: z.array(z.object({ due: z.string().nullable().describe('YYYY-MM-DD to do it by'), text: z.string().describe('Start with Book / Buy / Reserve / Check'), detail: z.string().nullable(), stop_names: z.array(z.string()) })),
  budget: z.array(z.object({ category: z.string(), item: z.string(), group: z.string().describe('Group total, e.g. "¥48,000" or "—"'), per_person: z.string(), note: z.string() })),
  coverage: z.array(z.object({ wish_id: z.string(), how: z.string().describe('Where and how this wish is honoured (day, stop), or why it could not be') })),
  logistics: z.array(z.string()).describe('Trip-wide arrangements every day must agree with, one per line: where the luggage is each day (forwarded when, from where to where), passes held and what they cover, money and tax-free rules, transfers between cities'),
});
export type Plan = z.infer<typeof Plan>;

export const DayGuide = z.object({
  notes: z.array(z.object({ kind: z.string().describe('NOTE, BRING, MONEY, CHECK, WEATHER, …'), text: z.string() })).describe('The day\'s briefing: at most 3 short lines, only what changes what they do'),
  stops: z.array(z.object({
    index: z.number().describe('0-based stop index'),
    summary: z.string().describe('The one-line hook shown on the timeline: at most 120 characters, what to do here and why'),
    story: z.string().describe('The story, shown when tapped: what it is and why it is special, 2–3 vivid, specific sentences'),
    how: z.array(z.string()).describe('How to do it, 2–4 short steps: entrance, what to order or see, queue strategy'),
    tips: z.array(z.string()).describe('At most 3 insider tips from the evidence: cash only, best seat, what to skip'),
    cost: z.string().nullable(), booking: z.string().nullable(), hours: z.string().nullable(),
    source_urls: z.array(z.string()).describe('URLs from the evidence that back this spread (most useful first)'),
    wishes: z.array(z.string()).describe('Wish texts this stop honours'),
  })),
});

export const RESEARCH_SYSTEM = `You are the most competent friend a group could have planning Japan: you research like a local fixer and a travel journalist combined. Today is ${today}.
Research method, for every theme:
1. Go where people actually talk: Japanese-language searches first (locals find places on Instagram, Google Maps, Tabelog and TikTok), then English (Reddit, TikTok, YouTube), then Chinese on Xiaohongshu for detailed traveller guides. Use every tool you have.
2. Cross-check: a place earns a slot only with at least two independent signals (e.g. a viral reel AND strong recent Japanese reviews). Watch the most relevant videos when you can.
3. Verify it is real, open in the trip window, and suits THIS group (size, ages, budget, vibe). Note booking needs and when bookings open. Prefer places with recent (2025–2026) evidence.
4. Tabelog: you may read it to judge a place, and cite its page URL, but never copy its scores, reviews or photos into your notes.
5. Avoid tourist traps unless the brief asks for the classic; say plainly when a famous place is not worth it and what to do instead.
Be economical, like a pro with a deadline: about 12–18 tool calls in all; one precise search beats three vague ones; never fetch the same page twice; stop when you have enough.
Save candidates with save_candidates as you go (aim for 10–16 strong ones per task, each with concrete evidence and coordinates from find_place). Finish with a 5–10 line summary of the area logic (which neighbourhoods to pair, transport passes, timing traps).`;

export const THEMES: { key: string; brief: string }[] = [
  { key: 'food', brief: 'Food: the meals worth planning a day around: local specialties, ramen/sushi/yakiniku/izakaya, breakfast and late-night spots, places that seat the whole group, food markets and streets.' },
  { key: 'night', brief: 'Nightlife: bars, izakaya alleys, standing bars, clubs, karaoke, arcades and Round1-style spots, late-night food; what is good for a group that loves to drink, and where to end the night.' },
  { key: 'sights', brief: 'Sights and experiences: what is genuinely worth it (and when to go to beat crowds), seasonal December events, illuminations and markets on these exact dates, day trips that fit, onsen.' },
  { key: 'shop', brief: 'Shopping: streetwear, vintage, sneakers, Don Quijote, anime/games, depachika, souvenirs; tax-free rules; which streets to walk in which order.' },
];

// ── Resolve: one entry per place, found, verified, with media ──
export const CITY: Record<string, S.LatLng> = { tokyo: { lat: 35.681, lng: 139.767 }, hakone: { lat: 35.233, lng: 139.105 }, osaka: { lat: 34.694, lng: 135.502 }, kyoto: { lat: 35.012, lng: 135.768 }, nara: { lat: 34.685, lng: 135.805 } };
export const centre = (city: string, stays: AnchorStay[]) => stays.find((s) => s.city.toLowerCase() === city.toLowerCase())?.at ?? CITY[city.toLowerCase()] ?? CITY.tokyo;
export const norm = (s: string) => s.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9぀-ヿ一-鿿]/g, '');

export async function resolveAll(cands: Candidate[], stays: AnchorStay[]): Promise<Candidate[]> {
  const byName = new Map<string, Candidate>();
  for (const c of cands) {
    const k = `${norm(c.city)}:${norm(c.name)}`;
    const prev = byName.get(k);
    if (!prev) { byName.set(k, { ...c, evidence: [...c.evidence], wish_ids: [...c.wish_ids] }); continue; }
    prev.evidence.push(...c.evidence.filter((e) => !prev.evidence.some((x) => x.url === e.url)));
    prev.wish_ids = [...new Set([...prev.wish_ids, ...c.wish_ids])];
    prev.confidence = Math.max(prev.confidence, c.confidence) + 0.05; // found by two researchers
  }
  const list = [...byName.values()].sort((a, b) => b.confidence - a.confidence);
  const out = await pool(list, 8, async (c, i) => {
    const near = c.lat != null && c.lng != null ? { lat: c.lat, lng: c.lng } : centre(c.city, stays);
    const v = await S.findPlace(c.name, near, c.area) ?? (c.name_ja ? await S.findPlace(c.name_ja, near, c.area) : null);
    // A found place more than 3 km from where research put it is probably a namesake: keep research's.
    const trusted = v && (c.lat == null || km(v, { lat: c.lat, lng: c.lng! }) < 3) ? v : null;
    const at = trusted ?? (c.lat != null ? { lat: c.lat, lng: c.lng! } : null);
    const media: GuideMedia[] = [];
    for (const e of c.evidence) {
      if (media.length >= 2) break;
      const m = await S.embedFor(e.url);
      if (m) media.push(m);
    }
    if (at) {
      // A photo: Wikipedia's (famous places), else the venue's own preview image from its website.
      const p = await S.photoFor(c.name_ja ?? c.name, at) ?? (trusted?.website ? await S.siteImage(trusted.website) : null);
      if (p) media.unshift(p);
    }
    return { ...c, id: `c${i + 1}`, lat: at?.lat ?? null, lng: at?.lng ?? null, verified: trusted, hours: c.hours ?? trusted?.hours?.join('; ') ?? null, media };
  });
  return out.filter((c) => c.verified?.status !== 'CLOSED_PERMANENTLY' && c.lat != null);
}

// ── Facts: hours, prices, closures and booking, quoted from the venue's own pages ──
export const weekday = (d: string) => new Date(`${d}T12:00:00+09:00`).toLocaleDateString('en-US', { weekday: 'short', timeZone: 'Asia/Tokyo' });
export function tripDates(brief: Brief, city: string) {
  const out: string[] = [];
  for (const l of brief.legs.filter((x) => x.city.toLowerCase() === city.toLowerCase())) for (let d = new Date(`${l.from}T00:00:00Z`); d <= new Date(`${l.to}T00:00:00Z`); d.setUTCDate(d.getUTCDate() + 1)) out.push(d.toISOString().slice(0, 10));
  return out;
}

// ── Anchors: what's already booked (stays from the TREK export) ──
export interface AnchorStay { stay: Stay; city: string; at: S.LatLng }
export function anchors(): AnchorStay[] {
  const f = resolve(ROOT, 'data/japan-plan-c.md');
  if (!existsSync(f)) return [];
  const t = parsePlan(readFileSync(f, 'utf8'));
  const stopsAll = t.days.flatMap((d) => d.stops);
  return t.stays.flatMap((s) => {
    const st = stopsAll.find((x) => x.name.startsWith(s.short) && x.lat != null);
    if (!st) return [];
    const city = st.lng! < 136.5 ? 'Osaka' : st.lng! < 139.3 ? 'Hakone' : 'Tokyo';
    return [{ stay: s, city, at: { lat: st.lat!, lng: st.lng! } }];
  });
}

// ── Checks: what a plan must satisfy before it is written up ──
/** Open at minute-of-day `m` (Japan time) on `date`, per Google's weekly periods; null when unknown. */
export function openAt(periods: S.PlaceFacts['periods'], date: string, m: number): boolean | null {
  if (!periods?.length) return null;
  const dow = new Date(`${date}T12:00:00+09:00`).getUTCDay();
  const t = dow * 1440 + m, W = 7 * 1440;
  return periods.some((p) => {
    if (!p.close) return true; // open 24 hours
    const o = p.open.day * 1440 + p.open.hour * 60 + p.open.minute;
    let c = p.close.day * 1440 + p.close.hour * 60 + p.close.minute;
    if (c <= o) c += W;
    return (t >= o && t < c) || (t + W >= o && t + W < c);
  });
}
export const hm = (iso: string) => iso.slice(11, 16);
export type Leg = S.Travel & { key: string };
/** Everything a plan must satisfy, checked by code against real data. Returns problems and the real legs. */
/** A taxi's fare in yen for a ride of so many minutes (flag fall plus about ¥200 a minute in traffic). */
export const taxiFare = (minutes: number) => 500 + 200 * minutes;
export async function checkPlan(plan: Plan, brief: Brief, cands: Map<string, Candidate>): Promise<{ issues: string[]; legs: Map<string, Leg> }> {
  const issues: string[] = [];
  const legs = new Map<string, Leg>();
  const want = new Set<string>();
  for (const l of brief.legs) for (let d = new Date(`${l.from}T00:00:00Z`); d <= new Date(`${l.to}T00:00:00Z`); d.setUTCDate(d.getUTCDate() + 1)) want.add(d.toISOString().slice(0, 10));
  for (const d of want) if (!plan.days.some((x) => x.date === d)) issues.push(`Missing day ${d}.`);
  for (const day of plan.days) {
    const times = stopTimes(day.date, day.stops);
    let lastMeal: number | null = null, taxiYen = 0;
    for (const [i, s] of day.stops.entries()) {
      if (!/^\d{2}:\d{2}$/.test(s.start) || !/^\d{2}:\d{2}$/.test(s.end)) issues.push(`${day.date} "${s.name}": times must be HH:MM.`);
      if (s.candidate_id && !cands.has(s.candidate_id)) issues.push(`${day.date} "${s.name}": unknown candidate_id ${s.candidate_id}.`);
      const c = s.candidate_id ? cands.get(s.candidate_id) : undefined;
      const startMs = Date.parse(times[i].startISO), endMs = Date.parse(times[i].endISO);
      // Open for the whole visit, per Google's weekly hours (else the OSM hours we can read).
      const sDate = times[i].startISO.slice(0, 10), sMin = +hm(times[i].startISO).slice(0, 2) * 60 + +hm(times[i].startISO).slice(3);
      // The verified facts for this date win (holidays, seasonal hours, last entry, fixed ride lengths).
      const fp = F.factProblem(c?.facts, sDate, sMin, sMin + (endMs - startMs) / 60000);
      const g = openAt(c?.verified?.periods, sDate, sMin + 5), gEnd = openAt(c?.verified?.periods, sDate, Math.max(sMin + 5, sMin + (endMs - startMs) / 60000 - 10));
      if (fp) issues.push(`${day.date} "${s.name}" ${s.start}–${s.end}: ${fp}.`);
      else if (c?.facts?.open.some((o) => o.dates.includes(sDate))) { /* verified hours for this date already passed */ }
      else if (g === false) issues.push(`${day.date} "${s.name}" at ${s.start}: closed then (${c?.verified?.hours?.join('; ')}).`);
      else if (g && gEnd === false) issues.push(`${day.date} "${s.name}": closes before ${s.end} (${c?.verified?.hours?.join('; ')}).`);
      else if (g === null) {
        const h = parseHours(c?.hours && /\d{2}:\d{2}-\d{2}:\d{2}/.test(c.hours) && /^(Mo|Tu|We|Th|Fr|Sa|Su|\d)/.test(c.hours) ? c.hours : null);
        const at = hoursAt(h, startMs + 10 * 60000);
        if (at && !at.open) issues.push(`${day.date} "${s.name}" at ${s.start}: closed then (${c?.hours}).`);
      }
      // Meals: no second sit-down meal within 2½ hours of the last.
      if (s.category === 'restaurant') {
        if (lastMeal != null && startMs - lastMeal < 150 * 60000) issues.push(`${day.date} "${s.name}" at ${s.start}: a sit-down meal only ${Math.round((startMs - lastMeal) / 60000)} min after the previous one ended.`);
        lastMeal = endMs;
      }
      const next = day.stops[i + 1];
      if (!next) continue;
      const gap = (Date.parse(times[i + 1].startISO) - endMs) / 60000;
      if (gap < 0) issues.push(`${day.date}: "${next.name}" starts before "${s.name}" ends.`);
      // A ride or cruise ends somewhere other than where it starts; without its end point there is nothing honest to check.
      const from = s.end_lat != null && s.end_lng != null ? { lat: s.end_lat, lng: s.end_lng } : s.category === 'transport' ? null : s.lat != null && s.lng != null ? { lat: s.lat, lng: s.lng } : null;
      if (!from || next.lat == null || next.lng == null) continue;
      // A group needs time to get moving: longer off a train or plane (gates, bags, finding each other).
      const buffer = (brief.people >= 6 ? 3 : 0) + (s.category === 'transport' ? 10 : 0);
      const leave = new Date(endMs + buffer * 60000 + 9 * 3600e3).toISOString().slice(0, 16);
      const t = await S.travel(from, { lat: next.lat, lng: next.lng }, leave);
      if (!t) continue;
      legs.set(`${day.date}#${i}`, { ...t, key: `${day.date}#${i}` });
      const taxi = /taxi|cab/i.test(s.transport ?? '');
      if (taxi && t.carMinutes != null) taxiYen += Math.ceil(brief.people / 4) * taxiFare(t.carMinutes);
      const need = buffer + (taxi && t.carMinutes != null ? t.carMinutes + 5 : t.minutes);
      if (gap + 3 < need) issues.push(`${day.date}: ${Math.round(gap)} min from "${s.name}" (${s.end}) to "${next.name}" (${next.start}), but it really takes ${need} min${t.mode === 'transit' ? ` (${t.rides?.join(', ')})` : t.mode === 'car' && !taxi ? ' by car (no train route found; a bus takes longer)' : ` by ${taxi ? 'car' : t.mode}`}.`);
      if (taxi && t.carMinutes != null && t.carMinutes > 20 && t.mode === 'transit' && t.minutes <= t.carMinutes + 15) issues.push(`${day.date}: taxi "${s.name}" → "${next.name}" (~${t.carMinutes} min, roughly ¥${taxiFare(t.carMinutes).toLocaleString('en-US')} per car) where the train takes ${t.minutes} min (${t.rides?.join(', ')}).`);
    }
    // Taxis add up fast for a group: about ¥4,000 a head in a day means the day is routed badly.
    if (taxiYen / brief.people > 4000) issues.push(`${day.date}: about ¥${Math.round(taxiYen / 1000) * 1000} of taxis (~¥${Math.round(taxiYen / brief.people / 100) * 100} pp). Reorder the day to stop going back and forth, or use the trains/buses their passes cover.`);
  }
  for (const w of brief.wishes) if (!plan.coverage.some((c) => c.wish_id === w.id)) issues.push(`Wish ${w.id} ("${w.text}") is not accounted for in coverage.`);
  return { issues, legs };
}

export const PLAN_SYSTEM = `You are planning a trip the way the best fixer in Japan would: decisive, realistic, and fun. Today is ${today}.
Rules:
- Every date of every leg gets a full day; use the stays given (check in/out times are fixed) and the arrival/departure.
- Use research candidates by id wherever possible; anything else (transfers, check-ins, a konbini breakfast) is allowed but keep invented stops minimal and never invent a venue.
- verified_facts (quoted from official pages) override everything else about a place: hours on each date, closures, last entry, prices, ride lengths.
- Respect opening hours, event dates, and real travel times between stops (name the line or mode in "transport" with minutes). Inter-city moves get a proper transport stop.
- Group neighbourhoods so days flow geographically; put sights at their best hour (crowds, light), meals at real meal times, nightlife late, and end each night near a station or the stay.
- Honour EVERY wish in the brief and report where in coverage. If one cannot be honoured, say why.
- Prices in yen, "pp" or "group total". Booking-critical items get a todo with a due date (when bookings open or the latest safe day).
- Budget: one row per meaningful item or category with group and per-person yen.
- A ride or cruise that ends somewhere else (pirate ship, ropeway, a transfer) gives end_lat/end_lng for where it ends.
- A group of 8 needs about 10 minutes to get off a train or plane and onto the next thing; never plan a tighter connection.
- Route each day as one sweep through an area: no going back and forth by taxi. Use what their passes cover first.
- logistics: decide once where the luggage is each day and what each pass covers; every day must agree with it.`;

/** The minutes in "transport" come from routing data, not the planner's guess: walk and taxi times are swapped for Google's. */
export function measuredTransport(p: Plan, legs: Legs) {
  for (const d of p.days) d.stops.forEach((s, i) => {
    const l = legs.get(`${d.date}#${i}`);
    if (!s.transport || !l) return;
    const real = /taxi|cab|\bcar\b|drive/i.test(s.transport) && l.carMinutes != null ? l.carMinutes : l.mode === 'walk' && /walk/i.test(s.transport) && !/train|bus|line|ropeway|ship|boat/i.test(s.transport) ? l.minutes : null;
    if (real != null) s.transport = s.transport.replace(/(?:about |~)?\d+(?:\s?[–-]\s?\d+)?\s?(?:min(?:ute)?s?)\b/i, `${real} min`);
  });
}

export const WRITE_SYSTEM = `You write the guidebook for a trip that has already been planned and verified: each stop gets a spread worth reading on the train. Voice: a well-travelled friend, specific and vivid, never generic, never padded. Never copy Tabelog scores, reviews or photos: you may say "highly rated on Tabelog" and link the page. Tips should be the things only someone who has been would know.
HARD NUMBERS RULE: every price, clock time, duration and distance you write must appear in that stop's verified_facts, research, plan times, price, or travel_next (the real route to the next stop). Never estimate or recall one yourself: no "about 15 minutes' walk" unless travel_next says so. If you do not have the number, describe it without one. Code checks every number and deletes sentences that break this rule.
Stay consistent with TRIP LOGISTICS (where the luggage is, which passes they hold and what those cover, tax-free rules): never contradict it.
Describe what they will really see on that date: the season, the weather, when it gets dark. No green fields or blossoms in December.`;

export type Legs = Map<string, Leg>;
export const legText = (l: Leg | undefined) => (l ? `${l.mode === 'transit' ? `train/bus ${l.minutes} min door to door${l.rides?.length ? ` (${l.rides.join(', ')})` : ''}${l.fare ? `, ¥${l.fare}` : ''}` : `${l.mode} ${l.minutes} min`}${l.carMinutes != null && l.mode !== 'car' ? `; by taxi ${l.carMinutes} min` : ''}` : null);
export function dossierFor(day: Plan['days'][number], byId: Map<string, Candidate>, legs: Legs) {
  return day.stops.map((s, i) => {
    const c = s.candidate_id ? byId.get(s.candidate_id) : undefined;
    return { index: i, time: `${s.start}–${s.end}`, name: s.name, plan: s.plan, price: s.price, transport_next: s.transport, travel_next: legText(legs.get(`${day.date}#${i}`)), verified_facts: c?.facts ? F.factLines(c.facts).map((f) => f.text) : [], research: c ? { why: c.why, best_time: c.best_time, dates: c.dates, price: c.price, booking: c.booking, group: c.group_of_8, hours: c.facts?.open.length ? null : c.hours, visit_minutes: c.visit_minutes, first_last: c.first_last, rating: c.verified ? { status: c.verified.status, rating: c.verified.rating, ratings: c.verified.ratings, source: c.verified.source } : null, evidence: c.evidence } : null };
  });
}

// ── The number audit: every price, time, duration and distance in the prose must be backed ──
export type DayGuide = z.infer<typeof DayGuide>;
export function allowedForDay(day: Plan['days'][number], byId: Map<string, Candidate>, legs: Legs, people: number) {
  const dayTexts = day.stops.flatMap((s, i) => [`${s.start} ${s.end}`, s.price, s.transport, s.plan, legText(legs.get(`${day.date}#${i}`)), legs.get(`${day.date}#${i}`)?.dep, legs.get(`${day.date}#${i}`)?.arr].map((x) => x?.replace(/T(\d\d:\d\d)/, ' $1')));
  return day.stops.map((s) => {
    const c = s.candidate_id ? byId.get(s.candidate_id) : undefined;
    const f = c?.facts;
    const factTexts = f ? [...F.factLines(f).map((x) => x.text), ...f.open.map((o) => o.quote), ...f.prices.map((p) => p.quote), ...f.notes.map((n) => n.quote), f.last_entry?.quote, f.fixed_minutes?.quote, f.booking?.quote] : [];
    const research = c ? [c.price, c.hours, c.booking, c.best_time, c.dates, c.first_last, c.group_of_8, c.visit_minutes != null ? `${c.visit_minutes} min` : null, ...c.evidence.map((e) => e.note), ...(c.verified?.hours ?? [])] : [];
    return F.allowedFrom([...dayTexts, ...factTexts, ...research], people);
  });
}
export function auditDay(g: DayGuide, allowed: F.Allowed[]): string[] {
  const out: string[] = [];
  const union = F.allowedFrom([], 0);
  for (const a of allowed) { for (const k of ['yen', 'times', 'minutes', 'km'] as const) for (const v of a[k]) union[k].add(v); union.people = a.people; }
  for (const n of g.notes) for (const c of F.unsupported(n.text, union)) out.push(`day note "${n.text.slice(0, 60)}…": ${c.raw}`);
  for (const st of g.stops) {
    const a = allowed[st.index];
    if (!a) continue;
    for (const t of [st.summary, st.story, ...st.how, ...st.tips, st.cost, st.booking, st.hours]) for (const c of F.unsupported(t ?? '', a)) out.push(`stop ${st.index}: "${c.raw}" in "${(t ?? '').slice(0, 80)}…"`);
  }
  return out;
}
export function stripDay(g: DayGuide, allowed: F.Allowed[]): DayGuide {
  const union = F.allowedFrom([], 0);
  for (const a of allowed) { for (const k of ['yen', 'times', 'minutes', 'km'] as const) for (const v of a[k]) union[k].add(v); union.people = a.people; }
  const keep = (t: string, a: F.Allowed) => F.stripUnsupported(t, a);
  return {
    notes: g.notes.map((n) => ({ ...n, text: keep(n.text, union) })).filter((n) => n.text),
    stops: g.stops.map((st) => {
      const a = allowed[st.index] ?? union;
      const opt = (t: string | null) => (t && !F.unsupported(t, a).length ? t : t ? keep(t, a) || null : null);
      return { ...st, summary: keep(st.summary, a), story: keep(st.story, a), how: st.how.map((x) => keep(x, a)).filter(Boolean), tips: st.tips.map((x) => keep(x, a)).filter(Boolean), cost: opt(st.cost), booking: opt(st.booking), hours: opt(st.hours) };
    }),
  };
}

export const FACT_SYSTEM = `You are a meticulous fact-checker for a Japan itinerary. Today is ${today}. Lines marked VERIFIED were already quoted from official pages: do not re-check them. Check the remaining HARD claims against official or primary sources (operator timetables, official sites, recent notices): routes and which line goes where, opening times, first/last departures, durations, prices, event dates, closures, rules. Use web_search and web_fetch; prefer official Japanese pages. Do NOT re-litigate taste or choices. Report only claims you have verified are wrong, plus anything impossible or self-contradictory within the day (e.g. luggage forwarded ahead but told to pack it). For each: "claim" is the exact wrong sentence copied from the text, "fix" a corrected sentence to put in its place, and "schedule" true only if the timetable of the day itself must change. If everything checks out, report nothing. Be economical: about 4–8 tool calls.`;
export const dayText = (d: ItinDay, logistics: string[] = []) => `TRIP LOGISTICS: ${logistics.join(' / ')}\n${d.date} · ${d.title}\n${d.notes.map((n) => `[${n.kind}] ${n.text}`).join('\n')}\n${d.stops.map((s, i) => `#${i} ${s.start}–${s.end} ${s.name}${s.price ? ` (${s.price})` : ''}${s.transport ? ` → next: ${s.transport}` : ''}${s.guide?.measured ? `\n   MEASURED (routing data, do not dispute): ${s.guide.measured}` : ''}${s.guide ? `\n   ${s.guide.story}\n   How: ${s.guide.how.join(' / ')}\n   Tips: ${s.guide.tips.join(' / ')}${s.guide.hours ? `\n   Hours: ${s.guide.hours}` : ''}${s.guide.booking ? `\n   Booking: ${s.guide.booking}` : ''}${s.guide.facts?.length ? `\n   VERIFIED: ${s.guide.facts.map((f) => f.text).join(' / ')}` : ''}` : ''}`).join('\n')}`;
export type FactError = { stop: number; claim: string; fix: string; source_url: string; schedule: boolean };

/** Put each correction in place of the wrong sentence (no rewrite, so nothing new and unchecked creeps in). */
export function patchDay(d: ItinDay, errors: FactError[], measured: F.Allowed[]): string[] {
  const left: string[] = [];
  // A correction may not overrule a number measured by routing data or quoted from an official page.
  errors = errors.filter((e) => {
    const m = measured[e.stop];
    const backed = m && F.claims(e.claim).length > 0 && F.unsupported(e.claim, m).length === 0;
    const changes = backed && F.claims(e.fix).some((c) => F.unsupported(c.raw, m!).length > 0);
    if (changes) log(`  kept "${e.claim.slice(0, 70)}": it matches measured or verified data`);
    return !changes;
  });
  const swap = (t: string, e: FactError) => (t.includes(e.claim) ? t.replace(e.claim, e.fix) : null);
  for (const e of errors) {
    const src = (() => { try { return new URL(e.source_url).hostname.replace(/^www\./, ''); } catch { return 'source'; } })();
    let done = false;
    if (e.stop < 0) {
      d.notes = d.notes.map((n) => { const r = done ? null : swap(n.text, e); if (r) done = true; return r ? { ...n, text: r } : n; });
      if (!done) { log(`  skipped a note correction whose sentence isn't in the text: "${e.claim.slice(0, 60)}"`); done = true; }
    }
    const g = d.stops[e.stop]?.guide;
    if (g && !done) {
      for (const k of ['story', 'cost', 'booking', 'hours'] as const) { const r = !done && g[k] ? swap(g[k]!, e) : null; if (r) { g[k] = r; done = true; } }
      for (const k of ['how', 'tips'] as const) g[k] = g[k].map((t) => { const r = done ? null : swap(t, e); if (r) done = true; return r ?? t; });
      if (!done) { g.tips.push(`Correction: ${e.fix}`); done = true; }
      g.facts = [...(g.facts ?? []), { text: e.fix, url: e.source_url }];
      g.sources.push({ url: e.source_url, label: src });
    }
    if (e.schedule || !done) left.push(`${d.date} ${d.stops[e.stop]?.name ?? 'day notes'}: ${e.fix} (${e.source_url})`);
  }
  return left;
}

// ── Assemble the site's itinerary ──
export function assemble(brief: Brief, plan: Plan & { warnings?: string[]; legs?: Map<string, Leg> }, guides: z.infer<typeof DayGuide>[], byId: Map<string, Candidate>, stays: AnchorStay[], briefText: string): Itinerary {
  const days: ItinDay[] = plan.days.slice().sort((a, b) => a.date.localeCompare(b.date)).map((d, di) => {
    const g = guides[plan.days.indexOf(d)];
    return {
      n: di + 1, date: d.date, city: d.city, title: d.title, stamp: d.stamp, notes: g?.notes ?? [],
      stops: d.stops.map((s, si) => {
        const c = s.candidate_id ? byId.get(s.candidate_id) : undefined;
        const w = g?.stops.find((x) => x.index === si);
        const urls = w?.source_urls ?? [];
        const sources = urls.map((u) => ({ url: u, label: c?.evidence.find((e) => e.url === u)?.source ?? new URL(u).hostname.replace(/^www\./, '') })).filter((x) => /^https?:/.test(x.url));
        const media = (c?.media ?? []).filter((m) => m.kind === 'image' || urls.includes(m.url) || (c?.media ?? []).length <= 2);
        const guide: Guide | null = w ? { story: w.story, how: w.how, tips: w.tips, cost: w.cost, booking: w.booking, hours: w.hours ?? (c?.facts?.open.length ? null : c?.hours) ?? null, sources, media, wishes: w.wishes, verified: c?.verified ? { source: c.verified.source, status: c.verified.status ?? null } : null, facts: c?.facts ? F.factLines(c.facts) : [], measured: legText(plan.legs?.get(`${d.date}#${si}`)) } : null;
        return {
          id: `d${String(di + 1).padStart(2, '0')}-s${String(si + 1).padStart(2, '0')}`, start: s.start, end: s.end, name: s.name, nameJa: c?.name_ja ?? null,
          category: s.category, categoryLabel: s.category_label, price: s.price, summary: w?.summary ?? null, plan: s.plan,
          address: c?.verified?.address ?? null, lat: s.lat, lng: s.lng, website: c?.verified?.website ?? null, phone: c?.verified?.phone ?? null, map: c?.verified?.maps ?? null,
          transport: (() => {
            const l = plan.legs?.get(`${d.date}#${si}`);
            // A timetable only where they actually ride: never under a taxi, shuttle or walk.
            return l?.mode === 'transit' && l.rides?.length && !/taxi|cab|shuttle|walk|car\b|drive/i.test(s.transport ?? '') ? `${s.transport ?? ''} · timetable: ${l.rides.join(', ')}${l.fare ? ` · ¥${l.fare.toLocaleString('en-US')}` : ''}`.replace(/^ · /, '') : s.transport;
          })(), guide,
        };
      }),
    };
  });
  const allStops = days.flatMap((d) => d.stops);
  const yen = (s: string) => Number((s.match(/[\d,]+/)?.[0] ?? '0').replace(/,/g, ''));
  const totals = new Map<string, number>();
  for (const b of plan.budget) totals.set(b.category, (totals.get(b.category) ?? 0) + yen(b.per_person));
  const dates = days.length ? `${dayLabel(days[0].date).label} – ${dayLabel(days.at(-1)!.date).label} ${days[0].date.slice(0, 4)}` : '';
  return {
    version: 1, generated: new Date().toISOString(), title: brief.title, dates, people: brief.people, brief: briefText,
    stays: stays.map((s) => s.stay), days,
    todos: plan.todos.map((t) => ({ due: t.due, text: t.text, detail: t.detail, stops: allStops.filter((s) => t.stop_names.some((n) => norm(s.name).includes(norm(n)) || norm(n).includes(norm(s.name)))).map((s) => s.id) })),
    budget: plan.budget.map((b) => ({ category: b.category, item: b.item, group: b.group, perPerson: b.per_person, note: b.note })),
    budgetTotals: [...totals].map(([category, v]) => ({ category, perPerson: `¥${v.toLocaleString('en-US')}` })),
    coverage: plan.coverage.map((c) => ({ wish: brief.wishes.find((w) => w.id === c.wish_id)?.text ?? c.wish_id, how: c.how })),
    sources: Object.entries(S.has).filter(([, f]) => f()).map(([k]) => k).concat(['claude web search', 'TREK Places', 'Wikipedia']),
    warnings: plan.warnings ?? [],
  };
}
