// The itinerary agent. From a plain-language brief it researches everything (social video, Japanese
// locals, the web), verifies every place, plans each day hour by hour, writes a guidebook spread per
// stop, checks the plan, repairs what fails, and writes data/itinerary.json for the site.
//
//   npm run plan                      plan from planner/brief.md
//   npm run plan -- edit "swap the day-3 izakaya for somewhere louder"
//   npm run plan -- add <url> [note]  work a TikTok / reel / post / page into the plan
//   npm run plan -- status            which sources are switched on
//
// Stages: brief → research (one agent per city × theme, in parallel) → resolve (find, verify, photos)
// → plan (structured output) → check + one repair pass → write (one spread per stop) → assemble.
import Anthropic from '@anthropic-ai/sdk';
import { betaZodOutputFormat, betaZodTool } from '@anthropic-ai/sdk/helpers/beta/zod';
import type { BetaRunnableTool } from '@anthropic-ai/sdk/lib/tools/BetaRunnableTool';
import { z } from 'zod';
import { spawnSync } from 'node:child_process';
import { appendFileSync, existsSync, readFileSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';
import { cached, key, km, log, pool, readJson, ROOT, writeJson } from './lib.ts';
import * as S from './sources.ts';
import { parsePlan, type Stay } from '../src/lib/plan.ts';
import { dayLabel, stopTimes, type Guide, type GuideMedia, type Itinerary, type ItinDay } from '../src/lib/itinerary.ts';
import { hoursAt, parseHours } from '../src/lib/hours.ts';

const MODEL = 'claude-opus-5-5';
const BETAS = ['server-side-fallback-2026-07-01', 'context-management-2025-06-27'];
const STATE = resolve(ROOT, 'data/research/state.json');
const OUT = resolve(ROOT, 'data/itinerary.json');
const client = new Anthropic({ maxRetries: 5 });
const sys = (text: string) => [{ type: 'text' as const, text, cache_control: { type: 'ephemeral' as const } }];
const today = new Date().toISOString().slice(0, 10);

// What this run costs, from the API's own usage reports (Opus 5.5: $4/$20 per M tokens; cache reads
// $0.20, cache writes $5; web search $10 per 1,000).
const spend = { in: 0, out: 0, cacheRead: 0, cacheWrite: 0, searches: 0 };
type Usage = { input_tokens: number; output_tokens: number; cache_read_input_tokens?: number | null; cache_creation_input_tokens?: number | null; server_tool_use?: { web_search_requests?: number | null } | null };
/** A hard ceiling on what one run may spend (PLAN_BUDGET in .env, default $60). */
const BUDGET = Number(key('PLAN_BUDGET') ?? 60);
class OverBudget extends Error {}
function meter(u: Usage | undefined) {
  if (!u) return;
  spend.in += u.input_tokens; spend.out += u.output_tokens; spend.cacheRead += u.cache_read_input_tokens ?? 0;
  spend.cacheWrite += u.cache_creation_input_tokens ?? 0; spend.searches += u.server_tool_use?.web_search_requests ?? 0;
  if (dollars() > BUDGET) throw new OverBudget(`Stopped at ~$${dollars().toFixed(2)}: over the $${BUDGET} budget (PLAN_BUDGET). Finished steps are saved; raise it and re-run to continue.`);
}
export const dollars = () => (spend.in * 4 + spend.out * 20 + spend.cacheRead * 0.2 + spend.cacheWrite * 5) / 1e6 + spend.searches * 0.01;
/** Errors that will fail every other request too (bad request, auth, no credit): stop the run. */
const fatal = (e: unknown) => e instanceof OverBudget || e instanceof Anthropic.BadRequestError || e instanceof Anthropic.AuthenticationError || e instanceof Anthropic.PermissionDeniedError;

// ── Schemas (nullable rather than optional: structured outputs want every field present) ──
const Brief = z.object({
  title: z.string().describe('Short trip title, e.g. "Japan, Dec 2026 · 8 friends"'),
  people: z.number().describe('How many travellers'),
  who: z.string().describe('Who is going, in a sentence: ages, vibe, what they love'),
  legs: z.array(z.object({ city: z.string(), from: z.string().describe('YYYY-MM-DD'), to: z.string().describe('YYYY-MM-DD'), base: z.string().nullable().describe('Where they sleep, if known') })),
  arrival: z.string().nullable().describe('When/where they land, e.g. "2026-12-15 15:00 Haneda T3"'),
  departure: z.string().nullable(),
  wishes: z.array(z.object({ id: z.string().describe('w1, w2, …'), text: z.string().describe('One explicit wish, preference or constraint, in the brief\'s own words') })).describe('EVERY concrete thing the brief asks for, likes, avoids or mentions. Do not merge or drop any.'),
  pace: z.string().describe('How full the days should be, inferred from the brief'),
});
type Brief = z.infer<typeof Brief>;

const KINDS = ['food', 'bar', 'nightlife', 'cafe', 'sight', 'experience', 'shopping', 'onsen', 'event', 'other'] as const;
const Candidate = z.object({
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
  lat: z.number().nullable(), lng: z.number().nullable(),
  wish_ids: z.array(z.string()).describe('Which brief wishes (w1…) this serves'),
  evidence: z.array(z.object({ source: z.string().describe('e.g. TikTok @user, Reddit r/JapanTravel, Tabelog, Google Maps (ja), X, blog'), url: z.string(), note: z.string().describe('What this source says, concretely, incl. date if known') })),
  confidence: z.number().describe('0–1: how sure you are it is excellent AND right for this group'),
});
type Candidate = z.infer<typeof Candidate> & { id?: string; verified?: S.PlaceFacts | null; media?: GuideMedia[] };

const CATEGORIES = ['transport', 'stay', 'restaurant', 'attraction', 'shopping', 'activity', 'bar', 'nature', 'other'] as const;
const Plan = z.object({
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
      transport: z.string().nullable().describe('How to get to the NEXT stop, naming the line/mode and minutes, e.g. "Yamanote line Harajuku → Shibuya, 3 min"'),
    })),
  })),
  todos: z.array(z.object({ due: z.string().nullable().describe('YYYY-MM-DD to do it by'), text: z.string().describe('Start with Book / Buy / Reserve / Check'), detail: z.string().nullable(), stop_names: z.array(z.string()) })),
  budget: z.array(z.object({ category: z.string(), item: z.string(), group: z.string().describe('Group total, e.g. "¥48,000" or "—"'), per_person: z.string(), note: z.string() })),
  coverage: z.array(z.object({ wish_id: z.string(), how: z.string().describe('Where and how this wish is honoured (day, stop), or why it could not be') })),
});
type Plan = z.infer<typeof Plan>;

const DayGuide = z.object({
  notes: z.array(z.object({ kind: z.string().describe('NOTE, BRING, MONEY, CHECK, WEATHER, …'), text: z.string() })).describe('The day\'s briefing: 2–5 short, high-value lines'),
  stops: z.array(z.object({
    index: z.number().describe('0-based stop index'),
    summary: z.string().describe('One sentence, the hook'),
    story: z.string().describe('The guidebook story: what it is, why it is special, what it feels like (3–6 sentences, vivid, specific, no fluff)'),
    how: z.array(z.string()).describe('How to do it properly, step by step (2–5 lines): entrance, what to order/see, where to stand, queue strategy'),
    tips: z.array(z.string()).describe('Insider tips from the evidence (1–4 lines): cash only, best seat, skip X, Japanese phrase to use'),
    cost: z.string().nullable(), booking: z.string().nullable(), hours: z.string().nullable(),
    source_urls: z.array(z.string()).describe('URLs from the evidence that back this spread (most useful first)'),
    wishes: z.array(z.string()).describe('Wish texts this stop honours'),
  })),
});

// ── Claude helpers ──
type Effort = 'low' | 'medium' | 'high' | 'xhigh' | 'max';
/** One structured answer, streamed (long outputs), validated, cached by its exact inputs. */
async function structured<T extends z.ZodType>(stage: string, schema: T, system: string, user: string, effort: Effort = 'high'): Promise<z.infer<T>> {
  return cached(`claude-${stage}`, [MODEL, system, user, effort], async () => {
    for (let attempt = 0; ; attempt++) {
      const stream = client.beta.messages.stream({
        model: MODEL, max_tokens: 64000, betas: BETAS, fallbacks: 'default',
        system: sys(system), messages: [{ role: 'user', content: user }],
        output_config: { effort, format: betaZodOutputFormat(schema) },
      });
      const msg = await stream.finalMessage();
      meter(msg.usage);
      if (msg.stop_reason === 'refusal') throw new Error(`${stage}: the model declined (${msg.stop_details?.category ?? 'no category'})`);
      if (msg.stop_reason === 'max_tokens') throw new Error(`${stage}: output hit max_tokens`);
      const text = msg.content.flatMap((b) => (b.type === 'text' ? [b.text] : [])).join('');
      const parsed = schema.safeParse(JSON.parse(text));
      if (parsed.success) return parsed.data;
      if (attempt >= 1) throw new Error(`${stage}: output did not match the schema: ${parsed.error.message.slice(0, 300)}`);
    }
  }, 30);
}

// ── The research agent's tools: offered only when their source is switched on ──
function researchTools(brief: Brief, found: Candidate[]) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- each tool has its own input type
  const T: BetaRunnableTool<any>[] = [];
  const ll = { lat: z.number(), lng: z.number() };
  if (S.has.tikhub()) {
    const platforms = ['tiktok', 'instagram', 'lemon8', 'xiaohongshu', 'reddit', 'threads', 'youtube'] as const;
    T.push(betaZodTool({
      name: 'social_search', description: 'Search one social platform. Search in Japanese for what locals post (e.g. "渋谷 居酒屋 大人数"), in English for visitors, in Chinese on xiaohongshu for very detailed traveller guides. Returns compact posts with captions, places, counts, dates and links.',
      inputSchema: z.object({ platform: z.enum(platforms), query: z.string() }),
      run: async ({ platform, query }) => S.socialSearch(platform, query),
    }));
    T.push(betaZodTool({
      name: 'posts_at_place', description: 'Recent Instagram posts tagged AT a place (by coordinates). Use it to check a spot is real, current and still loved.',
      inputSchema: z.object({ name: z.string(), ...ll }),
      run: async ({ name, lat, lng }) => S.postsAtPlace({ lat, lng }, name),
    }));
  }
  if (S.has.grok()) T.push(betaZodTool({
    name: 'x_search', description: 'Search X (Twitter) via Grok: real-time Japanese and English posts. Best for queues, sold-out notices, closures, event updates, what is hot right now.',
    inputSchema: z.object({ query: z.string() }), run: async ({ query }) => S.xSearch(query, '2026-06-01'),
  }));
  if (S.has.perplexity()) T.push(betaZodTool({
    name: 'perplexity_search', description: 'High-quality web search (Perplexity). Returns titles, URLs, dates, snippets.',
    inputSchema: z.object({ query: z.string() }), run: async ({ query }) => S.webSearch(query),
  }));
  if (S.has.serpapi()) {
    T.push(betaZodTool({
      name: 'google_japan', description: 'Google as people in Japan see it (gl=jp, hl=ja). Search in Japanese to find local blogs, ranking sites, official pages and news.',
      inputSchema: z.object({ query: z.string() }), run: async ({ query }) => S.googleJapan(query),
    }));
    T.push(betaZodTool({
      name: 'maps_reviews', description: 'The newest Japanese Google Maps reviews of a place (optionally only those mentioning a topic, e.g. "団体" for groups, "待ち" for queues).',
      inputSchema: z.object({ name: z.string(), ...ll, topic: z.string().nullable() }),
      run: async ({ name, lat, lng, topic }) => S.mapsReviews(name, { lat, lng }, topic ?? undefined),
    }));
  }
  if (S.has.hotpepper()) T.push(betaZodTool({
    name: 'group_dining', description: `Restaurants near a point with seats for the whole group (${brief.people}), from Hot Pepper. Optional keyword (e.g. 居酒屋, 焼肉).`,
    inputSchema: z.object({ ...ll, keyword: z.string().nullable() }), run: async ({ lat, lng, keyword }) => S.groupDining({ lat, lng }, keyword ?? '', brief.people),
  }));
  if (S.has.gemini()) T.push(betaZodTool({
    name: 'watch_video', description: 'Watch a TikTok / Instagram reel / YouTube video (speech, on-screen Japanese text, what is shown) and report every place, price and verdict in it.',
    inputSchema: z.object({ url: z.string(), question: z.string() }), run: async ({ url, question }) => S.watchVideo(url, question),
  }));
  T.push(betaZodTool({
    name: 'find_place', description: 'Find a place\'s coordinates, address and (when known) opening hours and status. Use before saving a candidate.',
    inputSchema: z.object({ name: z.string().describe('The place\'s own name, e.g. "Uoshin"'), area: z.string().describe('Neighbourhood, e.g. "Shibuya"'), ...ll }),
    run: async ({ name, area, lat, lng }) => JSON.stringify(await S.findPlace(name, { lat, lng }, area)) ?? 'not found (try the Japanese name)',
  }));
  T.push(betaZodTool({
    name: 'save_candidates', description: 'Save researched candidates (call as often as you like; each call appends). Only save places you have evidence for.',
    inputSchema: z.object({ candidates: z.array(Candidate) }),
    run: async ({ candidates }) => { found.push(...candidates); return `Saved ${candidates.length}; ${found.length} so far in this task.`; },
  }));
  return T;
}

const RESEARCH_SYSTEM = `You are the most competent friend a group could have planning Japan: you research like a local fixer and a travel journalist combined. Today is ${today}.
Research method, for every theme:
1. Go where people actually talk: Japanese-language searches first (locals find places on Instagram, Google Maps, Tabelog and TikTok), then English (Reddit, TikTok, YouTube), then Chinese on Xiaohongshu for detailed traveller guides. Use every tool you have.
2. Cross-check: a place earns a slot only with at least two independent signals (e.g. a viral reel AND strong recent Japanese reviews). Watch the most relevant videos when you can.
3. Verify it is real, open in the trip window, and suits THIS group (size, ages, budget, vibe). Note booking needs and when bookings open. Prefer places with recent (2025–2026) evidence.
4. Tabelog: you may read it to judge a place, and cite its page URL, but never copy its scores, reviews or photos into your notes.
5. Avoid tourist traps unless the brief asks for the classic; say plainly when a famous place is not worth it and what to do instead.
Be economical, like a pro with a deadline: about 12–18 tool calls in all; one precise search beats three vague ones; never fetch the same page twice; stop when you have enough.
Save candidates with save_candidates as you go (aim for 10–16 strong ones per task, each with concrete evidence and coordinates from find_place). Finish with a 5–10 line summary of the area logic (which neighbourhoods to pair, transport passes, timing traps).`;

const THEMES: { key: string; brief: string }[] = [
  { key: 'food', brief: 'Food: the meals worth planning a day around: local specialties, ramen/sushi/yakiniku/izakaya, breakfast and late-night spots, places that seat the whole group, food markets and streets.' },
  { key: 'night', brief: 'Nightlife: bars, izakaya alleys, standing bars, clubs, karaoke, arcades and Round1-style spots, late-night food; what is good for a group that loves to drink, and where to end the night.' },
  { key: 'sights', brief: 'Sights and experiences: what is genuinely worth it (and when to go to beat crowds), seasonal December events, illuminations and markets on these exact dates, day trips that fit, onsen.' },
  { key: 'shop', brief: 'Shopping: streetwear, vintage, sneakers, Don Quijote, anime/games, depachika, souvenirs; tax-free rules; which streets to walk in which order.' },
];

async function researchLeg(brief: Brief, leg: Brief['legs'][number], theme: (typeof THEMES)[number], extra: string): Promise<{ candidates: Candidate[]; notes: string }> {
  // Which sources were on is part of the key: adding a key later re-runs the research with it.
  const on = Object.entries(S.has).filter(([, f]) => f()).map(([k]) => k);
  // Keyed on the group and the leg, not the whole brief, so a one-city preview's research is reused
  // by the full run (and vice versa).
  const group = { people: brief.people, who: brief.who, pace: brief.pace, wishes: brief.wishes };
  return cached('research', [MODEL, group, leg, theme.key, extra, RESEARCH_SYSTEM, on], async () => {
    const found: Candidate[] = [];
    const task = `Trip: ${brief.title}. Group: ${brief.people} people. ${brief.who}
Pace: ${brief.pace}
Everything the brief asks for (honour each; tag candidates with the ids they serve):
${brief.wishes.map((w) => `- ${w.id}: ${w.text}`).join('\n')}

This task: ${leg.city}, ${leg.from} to ${leg.to}${leg.base ? `, staying at ${leg.base}` : ''}.
Theme: ${theme.brief}${extra ? `\n\nAlso: ${extra}` : ''}`;
    const runner = client.beta.messages.toolRunner({
      model: MODEL, max_tokens: 16000, betas: [...BETAS, 'task-budgets-2026-03-13'], fallbacks: 'default', max_iterations: 40,
      // Cache the whole conversation, not just the system prompt: every step re-sends everything
      // before it, and cached tokens are read back at 5% of the price.
      cache_control: { type: 'ephemeral' },
      // A token budget the model can see, so it spends its searches where they count.
      system: sys(RESEARCH_SYSTEM), output_config: { effort: 'medium', task_budget: { type: 'tokens', total: 100000 } },
      // Old tool results are cleared early (the candidates are already saved in code): each turn
      // re-reads the whole conversation, so this is most of the cost.
      context_management: { edits: [{ type: 'clear_tool_uses_20250919', trigger: { type: 'input_tokens', value: 30000 }, keep: { type: 'tool_uses', value: 3 }, exclude_tools: ['save_candidates'] }] },
      tools: [...researchTools(brief, found), { type: 'web_search_20260209', name: 'web_search', max_uses: 12 }, { type: 'web_fetch_20260209', name: 'web_fetch', max_uses: 10, max_content_tokens: 6000 }],
      messages: [{ role: 'user', content: task }],
    });
    let notes = '';
    for await (const m of runner) {
      meter(m.usage);
      if (m.stop_reason === 'pause_turn') runner.pushMessages({ role: 'assistant', content: m.content });
      const t = m.content.flatMap((b) => (b.type === 'text' ? [b.text] : [])).join('\n');
      if (t.trim()) notes = t;
    }
    log(`  ${leg.city} · ${theme.key}: ${found.length} candidates`);
    return { candidates: found, notes };
  }, 30);
}

// ── Resolve: one entry per place, found, verified, with media ──
const CITY: Record<string, S.LatLng> = { tokyo: { lat: 35.681, lng: 139.767 }, hakone: { lat: 35.233, lng: 139.105 }, osaka: { lat: 34.694, lng: 135.502 }, kyoto: { lat: 35.012, lng: 135.768 }, nara: { lat: 34.685, lng: 135.805 } };
const centre = (city: string, stays: AnchorStay[]) => stays.find((s) => s.city.toLowerCase() === city.toLowerCase())?.at ?? CITY[city.toLowerCase()] ?? CITY.tokyo;
const norm = (s: string) => s.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9぀-ヿ一-鿿]/g, '');

async function resolveAll(cands: Candidate[], stays: AnchorStay[]): Promise<Candidate[]> {
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

// ── Anchors: what's already booked (stays from the TREK export) ──
interface AnchorStay { stay: Stay; city: string; at: S.LatLng }
function anchors(): AnchorStay[] {
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
function checkPlan(plan: Plan, brief: Brief, cands: Map<string, Candidate>): string[] {
  const issues: string[] = [];
  const want = new Set<string>();
  for (const l of brief.legs) for (let d = new Date(`${l.from}T00:00:00Z`); d <= new Date(`${l.to}T00:00:00Z`); d.setUTCDate(d.getUTCDate() + 1)) want.add(d.toISOString().slice(0, 10));
  for (const d of want) if (!plan.days.some((x) => x.date === d)) issues.push(`Missing day ${d}.`);
  for (const day of plan.days) {
    const times = stopTimes(day.date, day.stops);
    day.stops.forEach((s, i) => {
      if (!/^\d{2}:\d{2}$/.test(s.start) || !/^\d{2}:\d{2}$/.test(s.end)) issues.push(`${day.date} "${s.name}": times must be HH:MM.`);
      if (s.candidate_id && !cands.has(s.candidate_id)) issues.push(`${day.date} "${s.name}": unknown candidate_id ${s.candidate_id}.`);
      const c = s.candidate_id ? cands.get(s.candidate_id) : undefined;
      // Open when they arrive (only for hours in OSM syntax, the form we can read exactly).
      const h = parseHours(c?.hours && /\d{2}:\d{2}-\d{2}:\d{2}/.test(c.hours) && /^(Mo|Tu|We|Th|Fr|Sa|Su|\d)/.test(c.hours) ? c.hours : null);
      const at = hoursAt(h, Date.parse(times[i].startISO) + 10 * 60000);
      if (at && !at.open) issues.push(`${day.date} "${s.name}" at ${s.start}: closed then (${c?.hours}).`);
      const next = day.stops[i + 1];
      if (!next) return;
      const gap = (Date.parse(times[i + 1].startISO) - Date.parse(times[i].endISO)) / 60000;
      if (gap < 0) issues.push(`${day.date}: "${next.name}" starts before "${s.name}" ends.`);
      if (s.lat != null && next.lat != null && s.lng != null && next.lng != null) {
        const d = km({ lat: s.lat, lng: s.lng }, { lat: next.lat, lng: next.lng });
        const need = d < 1.2 ? (d * 1.3 / 4.5) * 60 : d > 60 ? 45 + d / 3 : 12 + d * 2.2;
        if (gap < need * 0.6 - 3) issues.push(`${day.date}: only ${Math.round(gap)} min from "${s.name}" to "${next.name}" (${d.toFixed(1)} km, needs ~${Math.round(need)} min).`);
      }
    });
  }
  for (const w of brief.wishes) if (!plan.coverage.some((c) => c.wish_id === w.id)) issues.push(`Wish ${w.id} ("${w.text}") is not accounted for in coverage.`);
  return issues;
}

const PLAN_SYSTEM = `You are planning a trip the way the best fixer in Japan would: decisive, realistic, and fun. Today is ${today}.
Rules:
- Every date of every leg gets a full day; use the stays given (check in/out times are fixed) and the arrival/departure.
- Use research candidates by id wherever possible; anything else (transfers, check-ins, a konbini breakfast) is allowed but keep invented stops minimal and never invent a venue.
- Respect opening hours, event dates, and real travel times between stops (name the line or mode in "transport" with minutes). Inter-city moves get a proper transport stop.
- Group neighbourhoods so days flow geographically; put sights at their best hour (crowds, light), meals at real meal times, nightlife late, and end each night near a station or the stay.
- Honour EVERY wish in the brief and report where in coverage. If one cannot be honoured, say why.
- Prices in yen, "pp" or "group total". Booking-critical items get a todo with a due date (when bookings open or the latest safe day).
- Budget: one row per meaningful item or category with group and per-person yen.`;

async function makePlan(brief: Brief, cands: Candidate[], stays: AnchorStay[], notes: string[], extra: string, previous?: Plan): Promise<Plan> {
  const catalogue = cands.map((c) => ({ id: c.id, name: c.name, ja: c.name_ja, city: c.city, area: c.area, kind: c.kind, why: c.why, best_time: c.best_time, dates: c.dates, price: c.price, booking: c.booking, group: c.group_of_8, hours: c.hours, lat: c.lat, lng: c.lng, wishes: c.wish_ids, confidence: +c.confidence.toFixed(2), status: c.verified?.status ?? null }));
  const user = `BRIEF\n${JSON.stringify(brief, null, 1)}\n\nSTAYS (fixed)\n${stays.map((s) => `- ${s.stay.short} (${s.city}): in ${s.stay.checkInISO}, out ${s.stay.checkOutISO}, at ${s.at.lat},${s.at.lng}`).join('\n')}\n\nAREA NOTES FROM RESEARCH\n${notes.join('\n\n').slice(0, 30000)}\n\nCANDIDATES\n${JSON.stringify(catalogue)}${previous ? `\n\nCURRENT PLAN (keep everything the change does not affect)\n${JSON.stringify(previous)}` : ''}${extra ? `\n\nINSTRUCTIONS\n${extra}` : ''}`;
  let plan = await structured('plan', Plan, PLAN_SYSTEM, user, 'high');
  const byId = new Map(cands.map((c) => [c.id!, c]));
  // Coordinates come from verified research, not from the model's memory.
  const pin = (p: Plan) => { for (const d of p.days) for (const s of d.stops) { const c = s.candidate_id ? byId.get(s.candidate_id) : undefined; if (c?.lat != null) { s.lat = c.lat; s.lng = c.lng; } } return p; };
  plan = pin(plan);
  const issues = checkPlan(plan, brief, byId);
  if (!issues.length) return plan;
  log(`  ${issues.length} problem(s) found; repairing:\n    ${issues.slice(0, 12).join('\n    ')}`);
  const repaired = pin(await structured('plan-repair', Plan, PLAN_SYSTEM, `${user}\n\nYOUR PREVIOUS PLAN\n${JSON.stringify(plan)}\n\nFIX THESE PROBLEMS (change only what is needed)\n${issues.map((x) => `- ${x}`).join('\n')}`, 'high'));
  const left = checkPlan(repaired, brief, byId);
  if (left.length) log(`  ${left.length} problem(s) remain after repair; they are listed in the itinerary's warnings.`);
  return Object.assign(repaired, { warnings: left });
}

const WRITE_SYSTEM = `You write the guidebook for a trip that has already been planned and verified: each stop gets a spread worth reading on the train. Voice: a well-travelled friend, specific and vivid, never generic, never padded. Every claim comes from the evidence given (quote prices, hours and tips from it); if the evidence does not say, leave it out. Never copy Tabelog scores, reviews or photos: you may say "highly rated on Tabelog" and link the page. Tips should be the things only someone who has been would know.`;

async function writeDay(brief: Brief, day: Plan['days'][number], n: number, byId: Map<string, Candidate>) {
  const dossier = day.stops.map((s, i) => {
    const c = s.candidate_id ? byId.get(s.candidate_id) : undefined;
    return { index: i, time: `${s.start}–${s.end}`, name: s.name, plan: s.plan, transport_next: s.transport, research: c ? { why: c.why, best_time: c.best_time, dates: c.dates, price: c.price, booking: c.booking, group: c.group_of_8, hours: c.hours, verified: c.verified ? { status: c.verified.status, rating: c.verified.rating, ratings: c.verified.ratings, hours: c.verified.hours, source: c.verified.source } : null, evidence: c.evidence } : null };
  });
  const user = `Group: ${brief.people} people. ${brief.who}\nDay ${n}: ${day.date}, ${day.city}: ${day.title}\nWishes: ${brief.wishes.map((w) => `${w.id}: ${w.text}`).join(' · ')}\n\nSTOPS\n${JSON.stringify(dossier)}`;
  return structured('write', DayGuide, WRITE_SYSTEM, user, 'medium');
}

// ── Assemble the site's itinerary ──
function assemble(brief: Brief, plan: Plan & { warnings?: string[] }, guides: z.infer<typeof DayGuide>[], byId: Map<string, Candidate>, stays: AnchorStay[], briefText: string): Itinerary {
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
        const guide: Guide | null = w ? { story: w.story, how: w.how, tips: w.tips, cost: w.cost, booking: w.booking, hours: w.hours ?? c?.hours ?? null, sources, media, wishes: w.wishes, verified: c?.verified ? { source: c.verified.source, status: c.verified.status ?? null } : null } : null;
        return {
          id: `d${String(di + 1).padStart(2, '0')}-s${String(si + 1).padStart(2, '0')}`, start: s.start, end: s.end, name: s.name, nameJa: c?.name_ja ?? null,
          category: s.category, categoryLabel: s.category_label, price: s.price, summary: w?.summary ?? null, plan: s.plan,
          address: c?.verified?.address ?? null, lat: s.lat, lng: s.lng, website: c?.verified?.website ?? null, phone: c?.verified?.phone ?? null, map: c?.verified?.maps ?? null,
          transport: s.transport, guide,
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

// ── Commands ──
interface State { briefText: string; brief: Brief; candidates: Candidate[]; notes: string[]; plan: Plan }
const BRIEF_SYSTEM = `Read a traveller's trip brief and extract it faithfully. Every concrete preference, wish, constraint, place or activity mentioned becomes its own wish (keep their words). Dates are in ${today.slice(0, 4)} unless stated.`;

let ONLY: string | null = null; // --only <city>: research, plan and write one city as a preview
async function plan(briefFile: string, extra = '', previous?: State) {
  const briefText = readFileSync(briefFile, 'utf8');
  const stays = anchors();
  log(`Sources on: ${Object.entries(S.has).filter(([, f]) => f()).map(([k]) => k).join(', ') || 'none'} (+ Claude web search, TREK Places, Wikipedia)`);
  const fullBrief = previous?.briefText === briefText ? previous.brief : await structured('brief', Brief, BRIEF_SYSTEM, briefText, 'medium');
  const brief = ONLY ? { ...fullBrief, legs: fullBrief.legs.filter((l) => l.city.toLowerCase() === ONLY!.toLowerCase()) } : fullBrief;
  if (!brief.legs.length) throw new Error(`No leg in the brief for "${ONLY}".`);
  log(`Brief: ${brief.legs.map((l) => `${l.city} ${l.from}→${l.to}`).join(' · ')} · ${brief.wishes.length} wishes`);
  let candidates = previous?.candidates ?? [];
  let notes = previous?.notes ?? [];
  if (!previous || extra) {
    // One research pass per city, however many times the trip comes back to it (Tokyo twice).
    const cities = [...new Map(brief.legs.map((l) => [l.city.toLowerCase(), l])).values()].map((l) => {
      const all = brief.legs.filter((x) => x.city.toLowerCase() === l.city.toLowerCase());
      return { ...l, from: all.map((x) => x.from).join(' and '), to: all.map((x) => x.to).join(' and '), base: all.map((x) => x.base).filter(Boolean).join(' / ') || null };
    });
    // Short stays (two nights or fewer) get two broader researchers instead of four.
    const nights = (l: { from: string; to: string }) => l.from.split(' and ').reduce((n, f, i) => n + (Date.parse(l.to.split(' and ')[i]) - Date.parse(f)) / 864e5, 0);
    const MERGED = [
      { key: 'food-night', brief: `${THEMES[0].brief}\n${THEMES[1].brief}` },
      { key: 'sights-shop', brief: `${THEMES[2].brief}\n${THEMES[3].brief}` },
    ];
    const jobs = previous
      ? cities.map((leg) => ({ leg, theme: { key: 'edit', brief: `Only what this change needs: ${extra}. Find the best options for it.` } }))
      : cities.flatMap((leg) => (nights(leg) <= 2 ? MERGED : THEMES).map((theme, _, all) => ({
        leg, theme: { ...theme, brief: `${theme.brief}\n(Other researchers cover: ${all.filter((x) => x !== theme).map((x) => x.key).join(', ') || 'nothing else'}; stay on your theme.)` },
      })));
    log(`Researching ${jobs.length} task(s) in parallel…`);
    const res = await pool(jobs, 6, ({ leg, theme }) => researchLeg(brief, leg, theme, previous ? '' : extra).catch((e) => {
      if (fatal(e)) throw e;
      log(`  ${leg.city} · ${theme.key} failed: ${(e as Error).message}`); return { candidates: [], notes: '' };
    }));
    log(`  research so far: ~$${dollars().toFixed(2)}`);
    candidates = await resolveAll([...(previous?.candidates ?? []), ...res.flatMap((r) => r.candidates)], stays);
    notes = [...notes, ...res.map((r, i) => `${jobs[i].leg.city} · ${jobs[i].theme.key}: ${r.notes}`).filter((x) => x.length > 30)];
    log(`${candidates.length} verified candidates`);
    if (!previous && candidates.length < (ONLY ? 8 : 20)) throw new Error(`Only ${candidates.length} places survived research; not planning a trip on that. See the log above.`);
  }
  log('Planning the days…');
  const p = await makePlan(brief, candidates, ONLY ? stays.filter((s) => s.city.toLowerCase() === ONLY!.toLowerCase()) : stays, notes, extra, previous?.plan);
  if (!ONLY) writeJson(STATE, { briefText, brief, candidates, notes, plan: p } satisfies State);
  log('Writing the guidebook…');
  const byId = new Map(candidates.map((c) => [c.id!, c]));
  const guides = await pool(p.days, 5, (d, i) => writeDay(brief, d, i + 1, byId).catch((e) => {
    if (fatal(e)) throw e;
    log(`  writing ${d.date} failed: ${(e as Error).message}`); return { notes: [], stops: [] };
  }));
  const it = assemble(brief, p, guides, byId, stays, briefText);
  const out = ONLY ? resolve(ROOT, `data/research/preview-${ONLY.toLowerCase()}.json`) : OUT;
  writeJson(out, it);
  if (ONLY) log(`Preview only: wrote ${out.replace(`${ROOT}/`, '')}; the site's itinerary is unchanged.`);
  log(`Claude cost this run: ~$${dollars().toFixed(2)} (cached steps are free on re-runs).`);
  log(`Wrote ${ONLY ? 'the preview' : 'data/itinerary.json'}: ${it.days.length} days, ${it.days.reduce((n, d) => n + d.stops.length, 0)} stops, ${it.todos.length} to-dos${it.warnings.length ? `, ${it.warnings.length} warning(s)` : ''}.`);
  return it;
}

/** Rebuild what the site derives from the plan: rail lines, routes, the search place pack. */
function rebuildSite() {
  rmSync(resolve(ROOT, 'public/timetable.json'), { force: true }); // keyed by the old stops; `npm run timetable` re-fetches
  for (const script of ['transit', 'legs', 'places']) {
    log(`npm run ${script}…`);
    const r = spawnSync('npm', ['run', script], { cwd: ROOT, stdio: 'inherit' });
    if (r.status !== 0) log(`  npm run ${script} failed; the site still builds, re-run it later.`);
  }
}

const [cmd = 'plan', ...args] = process.argv.slice(2);
const onlyAt = args.indexOf('--only');
if (onlyAt >= 0) { ONLY = args[onlyAt + 1] ?? null; args.splice(onlyAt, 2); }
const flags = new Set(args.filter((a) => a.startsWith('--')));
const rest = args.filter((a) => !a.startsWith('--'));
if (cmd === 'status') {
  for (const [k, f] of Object.entries(S.has)) console.log(`${f() ? '✓' : '·'} ${k}`);
  console.log(`${key('ANTHROPIC_API_KEY') ? '✓' : '·'} anthropic (required)`);
} else {
  if (!key('ANTHROPIC_API_KEY')) { console.error('Set ANTHROPIC_API_KEY in .env first.'); process.exit(1); }
  const prev = existsSync(STATE) ? readJson<State | null>(STATE, null) : null;
  const briefFile = resolve(ROOT, 'planner/brief.md');
  if (cmd === 'plan') await plan(rest[0] ? resolve(rest[0]) : briefFile);
  else if (cmd === 'edit') {
    if (!prev) throw new Error('Plan first: npm run plan');
    await plan(briefFile, rest.join(' '), prev);
  } else if (cmd === 'add') {
    if (!rest[0]) throw new Error('Usage: npm run plan -- add <url> [note]');
    appendFileSync(briefFile, `\n- Saved link: ${rest[0]}${rest[1] ? ` (${rest.slice(1).join(' ')})` : ''}\n`);
    const instr = `Work this in if it is worth it (watch/read it first): ${rest.join(' ')}`;
    if (prev) await plan(briefFile, instr, { ...prev, briefText: readFileSync(briefFile, 'utf8') }); else await plan(briefFile);
  } else throw new Error(`Unknown command ${cmd}`);
  if (!flags.has('--no-site') && !ONLY) rebuildSite();
}
