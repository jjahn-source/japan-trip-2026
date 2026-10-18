// Benchmark one city's preview itineraries (planner previews made with different models) against a
// baseline: objective metrics, plus blind side-by-side judgements by Claude Opus 5.5 and Gemini 4 Argon
// on an anchored rubric. The primary number is how many concrete errors the judges can name.
//   npm run plan:bench -- hakone            baseline = preview-hakone.json (Opus), variants = preview-hakone-*.json
import Anthropic from '@anthropic-ai/sdk';
import { betaZodOutputFormat } from '@anthropic-ai/sdk/helpers/beta/zod';
import { z } from 'zod';
import { readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { http, key, log, readJson, ROOT, writeJson } from './lib.ts';
import type { Itinerary } from '../src/lib/itinerary.ts';

const city = (process.argv[2] ?? 'hakone').toLowerCase();
const dir = resolve(ROOT, 'data/research');
const baseline = readJson<Itinerary | null>(resolve(dir, `preview-${city}.json`), null);
if (!baseline) throw new Error(`No baseline preview-${city}.json; run: npm run plan -- plan --only ${city}`);
const variants = readdirSync(dir).filter((f) => f.startsWith(`preview-${city}-`) && f.endsWith('.json')).map((f) => ({ tag: f.slice(`preview-${city}-`.length, -5), it: readJson<Itinerary>(resolve(dir, f), baseline) }));

function metrics(it: Itinerary) {
  const stops = it.days.flatMap((d) => d.stops);
  const guided = stops.filter((s) => s.guide && s.category !== 'stay' && s.category !== 'transport');
  const tips = guided.flatMap((s) => s.guide!.tips.concat(s.guide!.how));
  return {
    days: it.days.length, stops: stops.length, spreads: guided.length,
    sourcedSpreads: guided.filter((s) => s.guide!.sources.length > 0).length,
    sourcesPerSpread: +(guided.reduce((n, s) => n + s.guide!.sources.length, 0) / Math.max(1, guided.length)).toFixed(2),
    verifiedSpreads: guided.filter((s) => s.guide!.verified).length,
    photos: guided.filter((s) => s.guide!.media.some((m) => m.kind === 'image')).length,
    videos: guided.filter((s) => s.guide!.media.some((m) => m.kind !== 'image')).length,
    concreteTips: tips.filter((t) => /¥|\d{1,2}:\d{2}|\d+\s?(min|minutes|m|km)\b|cash|book|reserve|queue|exit|platform/i.test(t)).length,
    tips: tips.length,
    storyWords: Math.round(guided.reduce((n, s) => n + s.guide!.story.split(/\s+/).length, 0) / Math.max(1, guided.length)),
    todos: it.todos.length, warnings: it.warnings.length, wishesCovered: it.coverage.length,
  };
}
/** The plan as compact text, the way a reader meets it (no ids, no metadata). */
const asText = (it: Itinerary) => it.days.map((d) => `DAY ${d.date} · ${d.title}\n${d.notes.map((n) => `  [${n.kind}] ${n.text}`).join('\n')}\n${d.stops.map((s) => {
  const g = s.guide;
  return `  ${s.start}–${s.end} ${s.name} (${s.categoryLabel}${s.price ? `, ${s.price}` : ''})${s.transport ? ` → next: ${s.transport}` : ''}${g ? `\n    ${g.story}\n    How: ${g.how.join(' / ')}\n    Tips: ${g.tips.join(' / ')}${g.booking ? `\n    Booking: ${g.booking}` : ''}\n    Sources: ${g.sources.map((x) => x.label).join(', ') || 'none'}${g.verified ? ` · verified on ${g.verified.source}` : ''}` : ''}`;
}).join('\n')}`).join('\n\n') + `\n\nTO-DOS: ${it.todos.map((t) => `${t.due}: ${t.text}`).join(' | ')}`;

const Criterion = z.object({ a: z.number().describe('1–10'), b: z.number().describe('1–10'), why: z.string() });
const Verdict = z.object({
  specificity: Criterion.describe('Concrete, insider, non-generic: named dishes, exits, queue tactics, exact prices and times'),
  accuracy: Criterion.describe('Plausibly correct and current; no invented places, impossible hours, or wrong facts you can spot'),
  feasibility: Criterion.describe('Timings, transfers, opening hours and pacing actually work for 8 people'),
  fit: Criterion.describe('Fits the group (8 people around 20, love drinking, Round1, shopping, do it all, no go-karts, save money)'),
  sourcing: Criterion.describe('Recommendations backed by credible, varied, recent sources'),
  usefulness: Criterion.describe('As a guidebook to use on the trip: would you trust and follow it?'),
  errors_a: z.array(z.string()).describe('Factual or logistical errors you can identify in A'),
  errors_b: z.array(z.string()).describe('Factual or logistical errors you can identify in B'),
  overall: z.enum(['A', 'B', 'tie']), summary: z.string().describe('Two or three sentences'),
});

const client = new Anthropic({ maxRetries: 5 });
const SYSTEM = 'You are a meticulous travel editor who knows Japan intimately. Compare two itineraries for the same trip leg, written for a group of 8 friends around 20 years old. Score each criterion 1–10 for A and for B independently. Anchors: 10 = no errors you can find, every hard fact (times, durations, prices, hours) correct and sourced, routing optimal, deeply specific; 8 = excellent with one or two minor slips; 6 = useful but several errors or weak spots; 4 = unreliable. List concrete errors you can identify, then pick the better guide overall. Judge substance, not length.';
/** A second judge from another company (Gemini 4 Argon), so one model family's taste can't decide alone. */
// Argon needs a paid Gemini plan; Flash works on the free tier.
async function geminiJudge(A: Itinerary, B: Itinerary, model = 'gemini-4-argon'): Promise<(z.infer<typeof Verdict> & { model: string }) | null> {
  if (!key('GEMINI_API_KEY')) return null;
  const r = await http<{ candidates?: { content?: { parts?: { text?: string }[] } }[] }>(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
    method: 'POST', timeoutMs: 300000, headers: { 'x-goog-api-key': key('GEMINI_API_KEY')!, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: SYSTEM }] },
      contents: [{ parts: [{ text: `ITINERARY A\n${asText(A)}\n\n=====\n\nITINERARY B\n${asText(B)}\n\nReply with JSON only: {"specificity":{"a":n,"b":n,"why":""},"accuracy":{...},"feasibility":{...},"fit":{...},"sourcing":{...},"usefulness":{...},"errors_a":[""],"errors_b":[""],"overall":"A"|"B"|"tie","summary":""}` }] }],
      generationConfig: { responseMimeType: 'application/json' },
    }),
  }, 1).catch((e) => { if (model !== 'gemini-3.8-flash') return null; throw e; });
  if (!r) { log(`  ${model} unavailable; judging with gemini-3.8-flash`); return geminiJudge(A, B, 'gemini-3.8-flash'); }
  const t = r.candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join('') ?? '';
  const v = Verdict.safeParse(JSON.parse(t.replace(/^```json|```$/g, '')));
  if (!v.success) { log(`  ${model} reply did not fit the rubric: ${v.error.message.slice(0, 200)}`); return null; }
  return { ...v.data, model };
}
async function judge(base: Itinerary, other: Itinerary) {
  const flip = Math.random() < 0.5; // blind and order-randomised: the judge never knows which is the baseline
  const [A, B] = flip ? [other, base] : [base, other];
  const stream = client.beta.messages.stream({
    model: 'claude-opus-5-5', max_tokens: 32000, betas: ['server-side-fallback-2026-07-01'], fallbacks: 'default',
    output_config: { effort: 'high', format: betaZodOutputFormat(Verdict) },
    system: SYSTEM,
    messages: [{ role: 'user', content: `ITINERARY A\n${asText(A)}\n\n=====\n\nITINERARY B\n${asText(B)}` }],
  });
  const msg = await stream.finalMessage();
  const v = Verdict.parse(JSON.parse(msg.content.flatMap((b) => (b.type === 'text' ? [b.text] : [])).join('')));
  const gv = await geminiJudge(A, B).catch((e) => { log(`  Gemini judge failed: ${String(e).slice(0, 200)}`); return null; });
  // Map A/B back to baseline/variant.
  const side = (c: { a: number; b: number; why: string }) => (flip ? { baseline: c.b, variant: c.a, why: c.why } : { baseline: c.a, variant: c.b, why: c.why });
  const crits = ['specificity', 'accuracy', 'feasibility', 'fit', 'sourcing', 'usefulness'] as const;
  const mean = (k: (typeof crits)[number], who: 'baseline' | 'variant') => { const xs = [side(v[k])[who], ...(gv ? [side(gv[k])[who]] : [])]; return +(xs.reduce((a, b) => a + b, 0) / xs.length).toFixed(1); };
  return {
    // Primary metric: errors either judge could name (a 10 means zero).
    errorCount: { baseline: (flip ? v.errors_b : v.errors_a).length + (gv ? (flip ? gv.errors_b : gv.errors_a).length : 0), variant: (flip ? v.errors_a : v.errors_b).length + (gv ? (flip ? gv.errors_a : gv.errors_b).length : 0) },
    average: { baseline: +(crits.reduce((n, k) => n + mean(k, 'baseline'), 0) / crits.length).toFixed(2), variant: +(crits.reduce((n, k) => n + mean(k, 'variant'), 0) / crits.length).toFixed(2), judges: gv ? `opus + ${gv.model}` : 'opus' },
    gemini: gv ? { winner: gv.overall === 'tie' ? 'tie' : (gv.overall === 'A') !== flip ? 'baseline' : 'variant', errors: { baseline: flip ? gv.errors_b : gv.errors_a, variant: flip ? gv.errors_a : gv.errors_b }, summary: gv.summary } : null,
    scores: Object.fromEntries(crits.map((k) => [k, side(v[k])])),
    errors: { baseline: flip ? v.errors_b : v.errors_a, variant: flip ? v.errors_a : v.errors_b },
    winner: v.overall === 'tie' ? 'tie' : (v.overall === 'A') !== flip ? 'baseline' : 'variant',
    summary: v.summary,
    judgeCost: +((msg.usage.input_tokens * 4 + msg.usage.output_tokens * 20) / 1e6).toFixed(3),
  };
}

const report = { generated: new Date().toISOString(), city, baseline: metrics(baseline), variants: [] as unknown[] };
for (const v of variants) {
  log(`Judging ${v.tag} against the baseline…`);
  report.variants.push({ tag: v.tag, metrics: metrics(v.it), judge: await judge(baseline, v.it) });
}
writeJson(resolve(dir, `bench-${city}.json`), report);
console.log(JSON.stringify(report, null, 2));
