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
// → facts (hours, prices, closures quoted from official pages, quotes checked by code) → plan →
// check against facts and real travel times + one repair → write → audit every number in the prose
// → fact-check, patching corrections into the text → assemble.
// Single-shot calls go through the Batch API (half price, a few minutes each); --now skips it.
import Anthropic from '@anthropic-ai/sdk';
import { betaZodOutputFormat, betaZodTool } from '@anthropic-ai/sdk/helpers/beta/zod';
import type { BetaRunnableTool } from '@anthropic-ai/sdk/lib/tools/BetaRunnableTool';
import { z } from 'zod';
import { spawnSync } from 'node:child_process';
import { appendFileSync, existsSync, readFileSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';
import { cached, key, km, log, pool, readJson, ROOT, sleep, writeJson } from './lib.ts';
import * as S from './sources.ts';
import * as F from './facts.ts';
import { parsePlan, type Stay } from '../src/lib/plan.ts';
import { dayLabel, stopTimes, type Guide, type GuideMedia, type Itinerary, type ItinDay } from '../src/lib/itinerary.ts';
import { hoursAt, parseHours } from '../src/lib/hours.ts';

// The model for each stage. Opus 5.5 by default; PLAN_MODEL (all stages) or PLAN_MODEL_RESEARCH /
// _PLAN / _WRITE override it, e.g. to benchmark Sonnet 5.5 or Haiku 5.5 against Opus.
const OPUS = 'claude-opus-5-5';
const pick = (stage: string) => key(`PLAN_MODEL_${stage}`) ?? key('PLAN_MODEL') ?? OPUS;
// Reading facts off a page is easy work: Haiku does it for a fraction of a cent. Checking prose against
// the web is Sonnet's: half Opus's price, and every claim it flags comes with a source.
const MODELS = { brief: OPUS, research: pick('RESEARCH'), plan: pick('PLAN'), write: pick('WRITE'), facts: key('PLAN_MODEL_FACTS') ?? 'claude-haiku-5-5', check: key('PLAN_MODEL_CHECK') ?? 'claude-sonnet-5-5' };
const stageModel = (stage: string) => (stage === 'brief' ? MODELS.brief : stage.startsWith('plan') ? MODELS.plan : stage.startsWith('write') ? MODELS.write : stage === 'facts' ? MODELS.facts : MODELS.research);
const NOW = process.argv.includes('--now') || key('PLAN_NOW') === '1';
const isHaiku = (m: string) => /haiku/.test(m);
/** Haiku has no server-side refusal fallback and only the basic web tools. */
const fallbackFor = (m: string) => (isHaiku(m) ? {} : { fallbacks: 'default' as const });
const webTools = (m: string) => (isHaiku(m)
  ? [{ type: 'web_search_20250305' as const, name: 'web_search' as const, max_uses: 12 }, { type: 'web_fetch_20250910' as const, name: 'web_fetch' as const, max_uses: 10, max_content_tokens: 6000 }]
  : [{ type: 'web_search_20260209' as const, name: 'web_search' as const, max_uses: 12 }, { type: 'web_fetch_20260209' as const, name: 'web_fetch' as const, max_uses: 10, max_content_tokens: 6000 }]);
const BETAS = ['server-side-fallback-2026-07-01', 'context-management-2025-06-27'];
const STATE = resolve(ROOT, 'data/research/state.json');
const OUT = resolve(ROOT, 'data/itinerary.json');
const client = new Anthropic({ maxRetries: 5 });
const sys = (text: string) => [{ type: 'text' as const, text, cache_control: { type: 'ephemeral' as const } }];
const today = new Date().toISOString().slice(0, 10);

// What this run costs, from the API's own usage reports (Opus 5.5: $4/$20 per M tokens; cache reads
// $0.20, cache writes $5; web search $10 per 1,000).
// $ per million tokens: input, output, cache read, cache write.
const PRICE: Record<string, [number, number, number, number]> = {
  'claude-opus-5-5': [4, 20, 0.2, 5], 'claude-sonnet-5-5': [2, 10, 0.2, 2.5], 'claude-haiku-5-5': [0.1, 0.5, 0.01, 0.125], 'claude-fable-5-1': [10, 50, 0.25, 12.5],
};
let spentTokens = 0;
const byStage = new Map<string, number>();
const spend = { in: 0, out: 0, cacheRead: 0, cacheWrite: 0, searches: 0 };
type Usage = { input_tokens: number; output_tokens: number; cache_read_input_tokens?: number | null; cache_creation_input_tokens?: number | null; server_tool_use?: { web_search_requests?: number | null } | null };
/** A hard ceiling on what one run may spend (PLAN_BUDGET in .env, default $60). */
const BUDGET = Number(key('PLAN_BUDGET') ?? 60);
class OverBudget extends Error {}
function meter(u: Usage | undefined, model: string, stage = 'other', batch = false) {
  if (!u) return;
  const [pi, po, pr, pw] = PRICE[model] ?? PRICE[OPUS];
  // The Batch API halves every token, cache reads and writes included.
  const cost = (u.input_tokens * pi + u.output_tokens * po + (u.cache_read_input_tokens ?? 0) * pr + (u.cache_creation_input_tokens ?? 0) * pw) / 1e6 * (batch ? 0.5 : 1) + (u.server_tool_use?.web_search_requests ?? 0) * 0.01;
  spentTokens += cost - (u.server_tool_use?.web_search_requests ?? 0) * 0.01;
  const st = stage.replace(/-.*/, '');
  byStage.set(st, (byStage.get(st) ?? 0) + cost);
  spend.in += u.input_tokens; spend.out += u.output_tokens; spend.cacheRead += u.cache_read_input_tokens ?? 0;
  spend.cacheWrite += u.cache_creation_input_tokens ?? 0; spend.searches += u.server_tool_use?.web_search_requests ?? 0;
  if (dollars() > BUDGET) throw new OverBudget(`Stopped at ~$${dollars().toFixed(2)}: over the $${BUDGET} budget (PLAN_BUDGET). Finished steps are saved; raise it and re-run to continue.`);
}
export const dollars = () => spentTokens + spend.searches * 0.01;
const stageReport = () => [...byStage].map(([k, v]) => `${k} $${v.toFixed(2)}`).join(' · ');
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
  visit_minutes: z.number().nullable().describe('How long it really takes (a bath slot, a show, a ride, a meal), from the source'),
  first_last: z.string().nullable().describe('For rides, shows and attractions: first and last departure / entry, and any date-specific closure'),
  lat: z.number().nullable(), lng: z.number().nullable(),
  wish_ids: z.array(z.string()).describe('Which brief wishes (w1…) this serves'),
  evidence: z.array(z.object({ source: z.string().describe('e.g. TikTok @user, Reddit r/JapanTravel, Tabelog, Google Maps (ja), X, blog'), url: z.string(), note: z.string().describe('What this source says, concretely, incl. date if known') })),
  confidence: z.number().describe('0–1: how sure you are it is excellent AND right for this group'),
});
type Candidate = z.infer<typeof Candidate> & { id?: string; verified?: S.PlaceFacts | null; media?: GuideMedia[]; facts?: F.FactSheet };

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
      end_lat: z.number().nullable().describe('Only for a ride, cruise or transfer that finishes somewhere else (e.g. the pirate ship docking at Motohakone): where it ends. Otherwise null'),
      end_lng: z.number().nullable(),
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
  const model = stageModel(stage);
  return cached(`claude-${stage}`, [model, system, user, effort], async () => {
    for (let attempt = 0; ; attempt++) {
      const params = { model, max_tokens: 64000, system: sys(system), messages: [{ role: 'user' as const, content: user }], output_config: { effort, format: betaZodOutputFormat(schema) } };
      const msg = NOW
        ? await client.beta.messages.stream({ ...params, betas: BETAS, ...fallbackFor(model) }).finalMessage()
        : await viaBatch(params);
      meter(msg.usage, model, stage, !NOW);
      if (msg.stop_reason === 'refusal') throw new Error(`${stage}: the model declined (${msg.stop_details?.category ?? 'no category'})`);
      if (msg.stop_reason === 'max_tokens') throw new Error(`${stage}: output hit max_tokens`);
      const text = msg.content.flatMap((b) => (b.type === 'text' ? [b.text] : [])).join('');
      const parsed = schema.safeParse(JSON.parse(text));
      if (parsed.success) return parsed.data;
      if (attempt >= 1) throw new Error(`${stage}: output did not match the schema: ${parsed.error.message.slice(0, 300)}`);
    }
  }, 30);
}

// ── The Batch API: every single-shot call made within a few seconds of another goes out together ──
type BatchParams = Anthropic.Beta.Messages.BatchCreateParams['requests'][number]['params'];
let queue: { params: BatchParams; resolve: (m: Anthropic.Beta.BetaMessage) => void; reject: (e: unknown) => void }[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;
function viaBatch(params: BatchParams): Promise<Anthropic.Beta.BetaMessage> {
  return new Promise((resolve, reject) => {
    queue.push({ params, resolve, reject });
    if (flushTimer) clearTimeout(flushTimer);
    flushTimer = setTimeout(() => void flush(), 6000); // wait for the rest of a parallel stage to queue up
  });
}
async function flush() {
  const jobs = queue; queue = []; flushTimer = null;
  try {
    const b = await client.beta.messages.batches.create({ requests: jobs.map((j, i) => ({ custom_id: `r${i}`, params: j.params })) });
    log(`  batch of ${jobs.length} sent (half price; usually a few minutes)…`);
    for (;;) { const st = await client.beta.messages.batches.retrieve(b.id); if (st.processing_status === 'ended') break; await sleep(15000); }
    const got = new Map<string, Anthropic.Beta.Messages.BetaMessageBatchResult>();
    for await (const r of await client.beta.messages.batches.results(b.id)) got.set(r.custom_id, r.result);
    jobs.forEach((j, i) => { const r = got.get(`r${i}`); if (r?.type === 'succeeded') j.resolve(r.message); else j.reject(new Error(`batch request ${r?.type ?? 'missing'}: ${JSON.stringify(r && 'error' in r ? r.error : '').slice(0, 300)}`)); });
  } catch (e) { for (const j of jobs) j.reject(e); }
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
  const model = MODELS.research;
  return cached('research', [model, group, leg, theme.key, extra, RESEARCH_SYSTEM, on], async () => {
    const found: Candidate[] = [];
    const task = `Trip: ${brief.title}. Group: ${brief.people} people. ${brief.who}
Pace: ${brief.pace}
Everything the brief asks for (honour each; tag candidates with the ids they serve):
${brief.wishes.map((w) => `- ${w.id}: ${w.text}`).join('\n')}

This task: ${leg.city}, ${leg.from} to ${leg.to}${leg.base ? `, staying at ${leg.base}` : ''}.
Theme: ${theme.brief}${extra ? `\n\nAlso: ${extra}` : ''}`;
    const runner = client.beta.messages.toolRunner({
      model, max_tokens: 16000, betas: [...BETAS, 'task-budgets-2026-03-13'], ...fallbackFor(model), max_iterations: 40,
      // Cache the whole conversation, not just the system prompt: every step re-sends everything
      // before it, and cached tokens are read back at 5% of the price.
      cache_control: { type: 'ephemeral' },
      // A token budget the model can see, so it spends its searches where they count.
      system: sys(RESEARCH_SYSTEM), output_config: { effort: 'medium', task_budget: { type: 'tokens', total: 100000 } },
      // Old tool results are cleared early (the candidates are already saved in code): each turn
      // re-reads the whole conversation, so this is most of the cost.
      // Clearing rewrites the cached conversation, so it runs rarely and in big bites.
      context_management: { edits: [{ type: 'clear_tool_uses_20250919', trigger: { type: 'input_tokens', value: 70000 }, clear_at_least: { type: 'input_tokens', value: 25000 }, keep: { type: 'tool_uses', value: 3 }, exclude_tools: ['save_candidates'] }] },
      tools: [...researchTools(brief, found), ...webTools(model)],
      messages: [{ role: 'user', content: task }],
    });
    let notes = '';
    for await (const m of runner) {
      meter(m.usage, model, 'research');
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

// ── Facts: hours, prices, closures and booking, quoted from the venue's own pages ──
const weekday = (d: string) => new Date(`${d}T12:00:00+09:00`).toLocaleDateString('en-US', { weekday: 'short', timeZone: 'Asia/Tokyo' });
function tripDates(brief: Brief, city: string) {
  const out: string[] = [];
  for (const l of brief.legs.filter((x) => x.city.toLowerCase() === city.toLowerCase())) for (let d = new Date(`${l.from}T00:00:00Z`); d <= new Date(`${l.to}T00:00:00Z`); d.setUTCDate(d.getUTCDate() + 1)) out.push(d.toISOString().slice(0, 10));
  return out;
}
async function gatherFacts(cands: Candidate[], brief: Brief): Promise<void> {
  let kept = 0, dropped = 0;
  await pool(cands, 24, async (c) => {
    const dates = tripDates(brief, c.city);
    if (!dates.length) return;
    const month = `${dates[0].slice(0, 4)}年${+dates[0].slice(5, 7)}月`;
    const sources = await F.sourcesFor(c.name, c.name_ja, c.area, c.verified?.website, month);
    if (!sources.length) { c.facts = F.EMPTY; return; }
    const user = `PLACE: ${c.name}${c.name_ja ? ` (${c.name_ja})` : ''}, ${c.area}, ${c.city}\nTRIP DATES HERE: ${dates.map((d) => `${d} (${weekday(d)})`).join(', ')}\n\n${sources.map((x) => `SOURCE ${x.url}\n${x.text}`).join('\n\n')}`;
    const raw = await structured('facts', F.FactSheet, F.FACTS_SYSTEM, user, 'low').catch((e) => { if (fatal(e)) throw e; return F.EMPTY; });
    const v = F.validate(raw, sources);
    c.facts = v.sheet;
    kept += F.factLines(v.sheet).length; dropped += v.dropped.length;
  });
  log(`  ${kept} facts verified against their pages; ${dropped} dropped (quote not on the page)`);
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
/** Open at minute-of-day `m` (Japan time) on `date`, per Google's weekly periods; null when unknown. */
function openAt(periods: S.PlaceFacts['periods'], date: string, m: number): boolean | null {
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
const hm = (iso: string) => iso.slice(11, 16);
type Leg = S.Travel & { key: string };
/** Everything a plan must satisfy, checked by code against real data. Returns problems and the real legs. */
async function checkPlan(plan: Plan, brief: Brief, cands: Map<string, Candidate>): Promise<{ issues: string[]; legs: Map<string, Leg> }> {
  const issues: string[] = [];
  const legs = new Map<string, Leg>();
  const want = new Set<string>();
  for (const l of brief.legs) for (let d = new Date(`${l.from}T00:00:00Z`); d <= new Date(`${l.to}T00:00:00Z`); d.setUTCDate(d.getUTCDate() + 1)) want.add(d.toISOString().slice(0, 10));
  for (const d of want) if (!plan.days.some((x) => x.date === d)) issues.push(`Missing day ${d}.`);
  for (const day of plan.days) {
    const times = stopTimes(day.date, day.stops);
    let lastMeal: number | null = null;
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
      const t = await S.travel(from, { lat: next.lat, lng: next.lng }, times[i].endISO.slice(0, 16));
      if (!t) continue;
      legs.set(`${day.date}#${i}`, { ...t, key: `${day.date}#${i}` });
      const taxi = /taxi|cab/i.test(s.transport ?? '');
      const need = taxi && t.carMinutes != null ? t.carMinutes + 5 : t.minutes;
      if (gap + 3 < need) issues.push(`${day.date}: ${Math.round(gap)} min from "${s.name}" (${s.end}) to "${next.name}" (${next.start}), but it really takes ${need} min${t.mode === 'transit' ? ` (${t.rides?.join(', ')})` : t.mode === 'car' && !taxi ? ' by car (no train route found; a bus takes longer)' : ` by ${taxi ? 'car' : t.mode}`}.`);
      if (taxi && t.carMinutes != null && t.carMinutes > 20 && t.mode === 'transit' && t.minutes <= t.carMinutes + 15) issues.push(`${day.date}: taxi "${s.name}" → "${next.name}" (~${t.carMinutes} min, roughly ¥${(t.carMinutes * 450).toLocaleString('en-US')} per car) where the train takes ${t.minutes} min (${t.rides?.join(', ')}).`);
    }
  }
  for (const w of brief.wishes) if (!plan.coverage.some((c) => c.wish_id === w.id)) issues.push(`Wish ${w.id} ("${w.text}") is not accounted for in coverage.`);
  return { issues, legs };
}

const PLAN_SYSTEM = `You are planning a trip the way the best fixer in Japan would: decisive, realistic, and fun. Today is ${today}.
Rules:
- Every date of every leg gets a full day; use the stays given (check in/out times are fixed) and the arrival/departure.
- Use research candidates by id wherever possible; anything else (transfers, check-ins, a konbini breakfast) is allowed but keep invented stops minimal and never invent a venue.
- verified_facts (quoted from official pages) override everything else about a place: hours on each date, closures, last entry, prices, ride lengths.
- Respect opening hours, event dates, and real travel times between stops (name the line or mode in "transport" with minutes). Inter-city moves get a proper transport stop.
- Group neighbourhoods so days flow geographically; put sights at their best hour (crowds, light), meals at real meal times, nightlife late, and end each night near a station or the stay.
- Honour EVERY wish in the brief and report where in coverage. If one cannot be honoured, say why.
- Prices in yen, "pp" or "group total". Booking-critical items get a todo with a due date (when bookings open or the latest safe day).
- Budget: one row per meaningful item or category with group and per-person yen.
- A ride or cruise that ends somewhere else (pirate ship, ropeway, a transfer) gives end_lat/end_lng for where it ends.`;

async function makePlan(brief: Brief, cands: Candidate[], stays: AnchorStay[], notes: string[], extra: string, previous?: Plan): Promise<Plan & { warnings?: string[]; legs: Map<string, Leg> }> {
  const catalogue = cands.map((c) => ({ id: c.id, name: c.name, ja: c.name_ja, city: c.city, area: c.area, kind: c.kind, why: c.why, best_time: c.best_time, dates: c.dates, price: c.price, booking: c.booking, group: c.group_of_8, hours: c.verified?.hours?.join('; ') ?? c.hours, visit_minutes: c.visit_minutes ?? null, first_last: c.first_last ?? null, verified_facts: c.facts ? F.factLines(c.facts).map((f) => f.text) : [], lat: c.lat, lng: c.lng, wishes: c.wish_ids, confidence: +c.confidence.toFixed(2), status: c.verified?.status ?? null }));
  const user = `BRIEF\n${JSON.stringify(brief, null, 1)}\n\nSTAYS (fixed)\n${stays.map((s) => `- ${s.stay.short} (${s.city}): in ${s.stay.checkInISO}, out ${s.stay.checkOutISO}, at ${s.at.lat},${s.at.lng}`).join('\n')}\n\nAREA NOTES FROM RESEARCH\n${notes.join('\n\n').slice(0, 30000)}\n\nCANDIDATES\n${JSON.stringify(catalogue)}${previous ? `\n\nCURRENT PLAN (keep everything the change does not affect)\n${JSON.stringify(previous)}` : ''}${extra ? `\n\nINSTRUCTIONS\n${extra}` : ''}`;
  let plan = await structured('plan', Plan, PLAN_SYSTEM, user, 'high');
  const byId = new Map(cands.map((c) => [c.id!, c]));
  // Coordinates come from verified research, not from the model's memory.
  const pin = (p: Plan) => { for (const d of p.days) for (const s of d.stops) { const c = s.candidate_id ? byId.get(s.candidate_id) : undefined; if (c?.lat != null) { s.lat = c.lat; s.lng = c.lng; } } return p; };
  plan = pin(plan);
  const first = await checkPlan(plan, brief, byId);
  const issues = first.issues;
  if (!issues.length) return Object.assign(plan, { legs: first.legs });
  log(`  ${issues.length} problem(s) found; repairing:\n    ${issues.slice(0, 12).join('\n    ')}`);
  const repaired = pin(await structured('plan-repair', Plan, PLAN_SYSTEM, `${user}\n\nYOUR PREVIOUS PLAN\n${JSON.stringify(plan)}\n\nFIX THESE PROBLEMS (change only what is needed)\n${issues.map((x) => `- ${x}`).join('\n')}`, 'medium'));
  const after = await checkPlan(repaired, brief, byId);
  if (after.issues.length) log(`  ${after.issues.length} problem(s) remain after repair:\n    ${after.issues.slice(0, 8).join('\n    ')}`);
  return Object.assign(repaired, { warnings: after.issues, legs: after.legs });
}

/** The minutes in "transport" come from routing data, not the planner's guess: walk and taxi times are swapped for Google's. */
function measuredTransport(p: Plan, legs: Legs) {
  for (const d of p.days) d.stops.forEach((s, i) => {
    const l = legs.get(`${d.date}#${i}`);
    if (!s.transport || !l) return;
    const real = /taxi|cab|\bcar\b|drive/i.test(s.transport) && l.carMinutes != null ? l.carMinutes : l.mode === 'walk' && /walk/i.test(s.transport) && !/train|bus|line|ropeway|ship|boat/i.test(s.transport) ? l.minutes : null;
    if (real != null) s.transport = s.transport.replace(/(?:about |~)?\s?\d+(?:\s?[–-]\s?\d+)?\s?(?:min(?:ute)?s?)\b/i, `${real} min`);
  });
}

const WRITE_SYSTEM = `You write the guidebook for a trip that has already been planned and verified: each stop gets a spread worth reading on the train. Voice: a well-travelled friend, specific and vivid, never generic, never padded. Never copy Tabelog scores, reviews or photos: you may say "highly rated on Tabelog" and link the page. Tips should be the things only someone who has been would know.
HARD NUMBERS RULE: every price, clock time, duration and distance you write must appear in that stop's verified_facts, research, plan times, price, or travel_next (the real route to the next stop). Never estimate or recall one yourself: no "about 15 minutes' walk" unless travel_next says so. If you do not have the number, describe it without one. Code checks every number and deletes sentences that break this rule.
Stay consistent with the whole day and the trip notes (e.g. if luggage is forwarded, do not tell them to pack it).`;

type Legs = Map<string, Leg>;
const legText = (l: Leg | undefined) => (l ? `${l.mode === 'transit' ? `train/bus ${l.minutes} min door to door${l.rides?.length ? ` (${l.rides.join(', ')})` : ''}${l.fare ? `, ¥${l.fare}` : ''}` : `${l.mode} ${l.minutes} min`}${l.carMinutes != null && l.mode !== 'car' ? `; by taxi ${l.carMinutes} min` : ''}` : null);
function dossierFor(day: Plan['days'][number], byId: Map<string, Candidate>, legs: Legs) {
  return day.stops.map((s, i) => {
    const c = s.candidate_id ? byId.get(s.candidate_id) : undefined;
    return { index: i, time: `${s.start}–${s.end}`, name: s.name, plan: s.plan, price: s.price, transport_next: s.transport, travel_next: legText(legs.get(`${day.date}#${i}`)), verified_facts: c?.facts ? F.factLines(c.facts).map((f) => f.text) : [], research: c ? { why: c.why, best_time: c.best_time, dates: c.dates, price: c.price, booking: c.booking, group: c.group_of_8, hours: c.facts?.open.length ? null : c.hours, visit_minutes: c.visit_minutes, first_last: c.first_last, rating: c.verified ? { status: c.verified.status, rating: c.verified.rating, ratings: c.verified.ratings, source: c.verified.source } : null, evidence: c.evidence } : null };
  });
}
async function writeDay(brief: Brief, day: Plan['days'][number], n: number, byId: Map<string, Candidate>, legs: Legs) {
  const user = `Group: ${brief.people} people. ${brief.who}\nDay ${n}: ${day.date}, ${day.city}: ${day.title}\nWishes: ${brief.wishes.map((w) => `${w.id}: ${w.text}`).join(' · ')}\n\nSTOPS\n${JSON.stringify(dossierFor(day, byId, legs))}`;
  return structured('write', DayGuide, WRITE_SYSTEM, user, 'medium');
}

// ── The number audit: every price, time, duration and distance in the prose must be backed ──
type DayGuide = z.infer<typeof DayGuide>;
function allowedForDay(day: Plan['days'][number], byId: Map<string, Candidate>, legs: Legs, people: number) {
  const dayTexts = day.stops.flatMap((s, i) => [`${s.start} ${s.end}`, s.price, s.transport, s.plan, legText(legs.get(`${day.date}#${i}`)), legs.get(`${day.date}#${i}`)?.dep, legs.get(`${day.date}#${i}`)?.arr].map((x) => x?.replace(/T(\d\d:\d\d)/, ' $1')));
  return day.stops.map((s) => {
    const c = s.candidate_id ? byId.get(s.candidate_id) : undefined;
    const f = c?.facts;
    const factTexts = f ? [...F.factLines(f).map((x) => x.text), ...f.open.map((o) => o.quote), ...f.prices.map((p) => p.quote), ...f.notes.map((n) => n.quote), f.last_entry?.quote, f.fixed_minutes?.quote, f.booking?.quote] : [];
    const research = c ? [c.price, c.hours, c.booking, c.best_time, c.dates, c.first_last, c.group_of_8, c.visit_minutes != null ? `${c.visit_minutes} min` : null, ...c.evidence.map((e) => e.note), ...(c.verified?.hours ?? [])] : [];
    return F.allowedFrom([...dayTexts, ...factTexts, ...research], people);
  });
}
function auditDay(g: DayGuide, allowed: F.Allowed[]): string[] {
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
function stripDay(g: DayGuide, allowed: F.Allowed[]): DayGuide {
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
/** Write a day, audit its numbers, give the writer one chance to fix them, then cut what is still unbacked. */
async function writeChecked(brief: Brief, day: Plan['days'][number], n: number, byId: Map<string, Candidate>, legs: Legs): Promise<{ guide: DayGuide; fixed: number; cut: number }> {
  const allowed = allowedForDay(day, byId, legs, brief.people);
  let g = await writeDay(brief, day, n, byId, legs);
  let bad = auditDay(g, allowed);
  const first = bad.length;
  if (bad.length) {
    const user = `Group: ${brief.people} people. ${brief.who}\nDay ${n}: ${day.date}, ${day.city}: ${day.title}\n\nSTOPS\n${JSON.stringify(dossierFor(day, byId, legs))}\n\nYOUR DRAFT\n${JSON.stringify(g)}\n\nTHESE NUMBERS ARE NOT BACKED BY THE STOP'S DATA: rewrite those sentences without them (or with the backed value). Change nothing else.\n${bad.map((x) => `- ${x}`).join('\n')}`;
    g = await structured('write-fix', DayGuide, WRITE_SYSTEM, user, 'low');
    bad = auditDay(g, allowed);
  }
  return { guide: bad.length ? stripDay(g, allowed) : g, fixed: first - bad.length, cut: bad.length };
}

// ── Fact-check: an editor who opens the official pages and checks every hard claim ──
const FACT_SYSTEM = `You are a meticulous fact-checker for a Japan itinerary. Today is ${today}. Lines marked VERIFIED were already quoted from official pages: do not re-check them. Check the remaining HARD claims against official or primary sources (operator timetables, official sites, recent notices): routes and which line goes where, opening times, first/last departures, durations, prices, event dates, closures, rules. Use web_search and web_fetch; prefer official Japanese pages. Do NOT re-litigate taste or choices. Report only claims you have verified are wrong, plus anything impossible or self-contradictory within the day (e.g. luggage forwarded ahead but told to pack it). For each: "claim" is the exact wrong sentence copied from the text, "fix" a corrected sentence to put in its place, and "schedule" true only if the timetable of the day itself must change. If everything checks out, report nothing. Be economical: about 4–8 tool calls.`;
const dayText = (d: ItinDay) => `${d.date} · ${d.title}\n${d.notes.map((n) => `[${n.kind}] ${n.text}`).join('\n')}\n${d.stops.map((s, i) => `#${i} ${s.start}–${s.end} ${s.name}${s.price ? ` (${s.price})` : ''}${s.transport ? ` → next: ${s.transport}` : ''}${s.guide?.measured ? `\n   MEASURED (routing data, do not dispute): ${s.guide.measured}` : ''}${s.guide ? `\n   ${s.guide.story}\n   How: ${s.guide.how.join(' / ')}\n   Tips: ${s.guide.tips.join(' / ')}${s.guide.hours ? `\n   Hours: ${s.guide.hours}` : ''}${s.guide.booking ? `\n   Booking: ${s.guide.booking}` : ''}${s.guide.facts?.length ? `\n   VERIFIED: ${s.guide.facts.map((f) => f.text).join(' / ')}` : ''}` : ''}`).join('\n')}`;
type FactError = { stop: number; claim: string; fix: string; source_url: string; schedule: boolean };
async function factCheckDay(d: ItinDay): Promise<FactError[]> {
  const model = MODELS.check;
  return cached('factcheck3', [model, FACT_SYSTEM, dayText(d)], async () => {
    const errors: FactError[] = [];
    const report = betaZodTool({
      name: 'report_errors', description: 'Report the verified errors for this day (call once at the end; an empty list if all checks out).',
      inputSchema: z.object({ errors: z.array(z.object({ stop: z.number().describe('Stop # as given (-1 for the day notes)'), claim: z.string().describe('The wrong sentence, copied exactly from the text'), fix: z.string().describe('The corrected sentence to put in its place'), source_url: z.string(), schedule: z.boolean().describe('True only if the day\'s timetable itself must change') })) }),
      run: async ({ errors: e }) => { errors.push(...e); return 'Recorded.'; },
    });
    const runner = client.beta.messages.toolRunner({
      model, max_tokens: 16000, betas: [...BETAS, 'task-budgets-2026-03-13'], ...fallbackFor(model), max_iterations: 20, cache_control: { type: 'ephemeral' },
      system: sys(FACT_SYSTEM), output_config: { effort: 'medium', task_budget: { type: 'tokens', total: 60000 } },
      context_management: { edits: [{ type: 'clear_tool_uses_20250919', trigger: { type: 'input_tokens', value: 30000 }, keep: { type: 'tool_uses', value: 3 }, exclude_tools: ['report_errors'] }] },
      tools: [report, ...webTools(model).map((t) => ({ ...t, max_uses: 6 }))],
      messages: [{ role: 'user', content: dayText(d) }],
    });
    // Every URL the checker actually saw (search results and fetched pages): a correction must cite one of them.
    const seen = new Set<string>();
    for await (const m of runner) {
      meter(m.usage, model, 'check');
      for (const b of m.content) if (/tool_result/.test(b.type)) for (const u of JSON.stringify(b).match(/https?:\/\/[^"\\\s]+/g) ?? []) seen.add(u.replace(/[#?].*$/, '').replace(/\/$/, ''));
      if (m.stop_reason === 'pause_turn') runner.pushMessages({ role: 'assistant', content: m.content });
    }
    const cited = errors.filter((e) => seen.has(e.source_url.replace(/[#?].*$/, '').replace(/\/$/, '')));
    if (cited.length < errors.length) log(`  ${d.date}: ${errors.length - cited.length} correction(s) dropped: they cite a page the checker never opened`);
    return cited;
  }, 30);
}

/** Put each correction in place of the wrong sentence (no rewrite, so nothing new and unchecked creeps in). */
function patchDay(d: ItinDay, errors: FactError[], measured: F.Allowed[]): string[] {
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
    if (e.stop < 0) d.notes = d.notes.map((n) => { const r = done ? null : swap(n.text, e); if (r) done = true; return r ? { ...n, text: r } : n; });
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
function assemble(brief: Brief, plan: Plan & { warnings?: string[]; legs?: Map<string, Leg> }, guides: z.infer<typeof DayGuide>[], byId: Map<string, Candidate>, stays: AnchorStay[], briefText: string): Itinerary {
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

// ── Commands ──
interface State { briefText: string; brief: Brief; candidates: Candidate[]; notes: string[]; plan: Plan }
const BRIEF_SYSTEM = `Read a traveller's trip brief and extract it faithfully. Every concrete preference, wish, constraint, place or activity mentioned becomes its own wish (keep their words). Dates are in ${today.slice(0, 4)} unless stated.`;

let ONLY: string | null = null; // --only <city>: research, plan and write one city as a preview
async function plan(briefFile: string, extra = '', previous?: State) {
  const briefText = readFileSync(briefFile, 'utf8');
  const stays = anchors();
  log(`Models: research ${MODELS.research} · plan ${MODELS.plan} · write ${MODELS.write}`);
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
  if (candidates.some((c) => !c.facts)) {
    log('Reading each place\'s official pages for hours, prices and closures…');
    await gatherFacts(candidates.filter((c) => !c.facts), brief);
  }
  log('Planning the days…');
  const p = await makePlan(brief, candidates, ONLY ? stays.filter((s) => s.city.toLowerCase() === ONLY!.toLowerCase()) : stays, notes, extra, previous?.plan);
  measuredTransport(p, p.legs);
  if (!ONLY) writeJson(STATE, { briefText, brief, candidates, notes, plan: p } satisfies State);
  log('Writing the guidebook…');
  const byId = new Map(candidates.map((c) => [c.id!, c]));
  const written = await pool(p.days, 30, (d, i) => writeChecked(brief, d, i + 1, byId, p.legs).catch((e) => {
    if (fatal(e)) throw e;
    log(`  writing ${d.date} failed: ${(e as Error).message}`); return { guide: { notes: [], stops: [] }, fixed: 0, cut: 0 };
  }));
  log(`  number audit: ${written.reduce((n, w) => n + w.fixed, 0)} unbacked number(s) rewritten, ${written.reduce((n, w) => n + w.cut, 0)} cut`);
  const it = assemble(brief, p, written.map((w) => w.guide), byId, stays, briefText);
  // An independent fact-check of everything not already quoted from an official page; corrections are
  // patched into the text in place of the wrong sentence.
  log('Fact-checking every day against official sources…');
  const errs = await pool(it.days, 8, (d) => factCheckDay(d).catch((e) => { if (fatal(e)) throw e; log(`  fact-check ${d.date} failed: ${(e as Error).message}`); return [] as FactError[]; }));
  const total = errs.reduce((n, e) => n + e.length, 0);
  const measured = p.days.map((d) => d.stops.map((s, i) => { const c = s.candidate_id ? byId.get(s.candidate_id) : undefined; return F.allowedFrom([legText(p.legs.get(`${d.date}#${i}`)), ...(c?.facts ? F.factLines(c.facts).map((f) => f.text) : [])], brief.people); }));
  const left = it.days.flatMap((d, i) => patchDay(d, errs[i], measured[i]));
  if (total) {
    log(`  ${total} correction(s) patched in${left.length ? `; ${left.length} need a schedule change (kept as warnings):\n    ${left.join('\n    ')}` : ''}`);
    it.sources.push(`fact-checked: ${total} correction(s) applied`);
    it.warnings.push(...left);
  } else log('  no errors found.');
  const tag = key('PLAN_TAG');
  const out = ONLY ? resolve(ROOT, `data/research/preview-${ONLY.toLowerCase()}${tag ? `-${tag}` : ''}.json`) : OUT;
  writeJson(out, it);
  if (ONLY) log(`Preview only: wrote ${out.replace(`${ROOT}/`, '')}; the site's itinerary is unchanged.`);
  log(`Claude cost this run: ~$${dollars().toFixed(2)} (${stageReport() || 'all cached'}; cached steps are free on re-runs).`);
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
