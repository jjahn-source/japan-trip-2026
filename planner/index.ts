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
import {
  type AnchorStay, Brief, CATEGORIES, CITY, Candidate, DayGuide, FACT_SYSTEM, type FactError, KINDS, type Leg, type Legs, PLAN_SYSTEM, Plan, RESEARCH_SYSTEM, THEMES, WRITE_SYSTEM, allowedForDay, anchors, assemble, auditDay, centre, checkPlan, dayText, dossierFor, hm, legText, measuredTransport, norm, openAt, patchDay, resolveAll, stripDay, today, tripDates, weekday,
} from './core.ts';
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


// ── Claude helpers ──
type Effort = 'low' | 'medium' | 'high' | 'xhigh' | 'max';
/** One structured answer, streamed (long outputs), validated, cached by its exact inputs. */
async function structured<T extends z.ZodType>(stage: string, schema: T, system: string, user: string, effort: Effort = 'high'): Promise<z.infer<T>> {
  const model = stageModel(stage);
  return cached(`claude-${stage}`, [model, system, user, effort], async () => {
    for (let attempt = 0; ; attempt++) {
      const params = { model, max_tokens: 64000, system: sys(system), messages: [{ role: 'user' as const, content: user }], output_config: { effort, format: betaZodOutputFormat(schema) } };
      // Haiku's fact reading costs cents either way, so it never waits in the batch queue.
      const msg = NOW || stage === 'facts'
        ? await client.beta.messages.stream({ ...params, betas: BETAS, ...fallbackFor(model) }).finalMessage()
        : await viaBatch(params);
      meter(msg.usage, model, stage, !(NOW || stage === 'facts'));
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


let LOGISTICS: string[] = [];
async function writeDay(brief: Brief, day: Plan['days'][number], n: number, byId: Map<string, Candidate>, legs: Legs) {
  const user = `Group: ${brief.people} people. ${brief.who}\nTRIP LOGISTICS\n${LOGISTICS.map((l) => `- ${l}`).join('\n')}\nDay ${n}: ${day.date} (${weekday(day.date)}), ${day.city}: ${day.title}\nWishes: ${brief.wishes.map((w) => `${w.id}: ${w.text}`).join(' · ')}\n\nSTOPS\n${JSON.stringify(dossierFor(day, byId, legs))}`;
  return structured('write', DayGuide, WRITE_SYSTEM, user, 'medium');
}

/** Write a day, audit its numbers, give the writer one chance to fix them, then cut what is still unbacked. */
async function writeChecked(brief: Brief, day: Plan['days'][number], n: number, byId: Map<string, Candidate>, legs: Legs): Promise<{ guide: DayGuide; fixed: number; cut: number }> {
  const allowed = allowedForDay(day, byId, legs, brief.people);
  let g = await writeDay(brief, day, n, byId, legs);
  let bad = auditDay(g, allowed);
  const first = bad.length;
  if (bad.length) {
    const user = `Group: ${brief.people} people. ${brief.who}\nTRIP LOGISTICS\n${LOGISTICS.map((l) => `- ${l}`).join('\n')}\nDay ${n}: ${day.date} (${weekday(day.date)}), ${day.city}: ${day.title}\n\nSTOPS\n${JSON.stringify(dossierFor(day, byId, legs))}\n\nYOUR DRAFT\n${JSON.stringify(g)}\n\nTHESE NUMBERS ARE NOT BACKED BY THE STOP'S DATA: rewrite those sentences without them (or with the backed value). Change nothing else.\n${bad.map((x) => `- ${x}`).join('\n')}`;
    g = await structured('write-fix', DayGuide, WRITE_SYSTEM, user, 'low');
    bad = auditDay(g, allowed);
  }
  return { guide: bad.length ? stripDay(g, allowed) : g, fixed: first - bad.length, cut: bad.length };
}

// ── Fact-check: an editor who opens the official pages and checks every hard claim ──
async function factCheckDay(d: ItinDay): Promise<FactError[]> {
  const model = MODELS.check;
  return cached('factcheck3', [model, FACT_SYSTEM, dayText(d, LOGISTICS)], async () => {
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
      messages: [{ role: 'user', content: dayText(d, LOGISTICS) }],
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
  LOGISTICS = p.logistics ?? [];
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
