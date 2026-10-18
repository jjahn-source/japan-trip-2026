// Benchmark one city's preview itineraries (planner previews made with different models) against a
// baseline: objective metrics, plus a blind side-by-side judgement by Claude Opus 5.5 on a fixed rubric.
//   npm run plan:bench -- hakone            baseline = preview-hakone.json (Opus), variants = preview-hakone-*.json
import Anthropic from '@anthropic-ai/sdk';
import { betaZodOutputFormat } from '@anthropic-ai/sdk/helpers/beta/zod';
import { z } from 'zod';
import { readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { log, readJson, ROOT, writeJson } from './lib.ts';
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
async function judge(base: Itinerary, other: Itinerary) {
  const flip = Math.random() < 0.5; // blind and order-randomised: the judge never knows which is the baseline
  const [A, B] = flip ? [other, base] : [base, other];
  const stream = client.beta.messages.stream({
    model: 'claude-opus-5-5', max_tokens: 32000, betas: ['server-side-fallback-2026-07-01'], fallbacks: 'default',
    output_config: { effort: 'high', format: betaZodOutputFormat(Verdict) },
    system: 'You are a meticulous travel editor who knows Japan intimately. Compare two itineraries for the same trip leg, written for a group of 8 friends around 20 years old. Score each criterion 1–10 for A and for B independently, list concrete errors you can identify, then pick the better guide overall. Judge substance, not length.',
    messages: [{ role: 'user', content: `ITINERARY A\n${asText(A)}\n\n=====\n\nITINERARY B\n${asText(B)}` }],
  });
  const msg = await stream.finalMessage();
  const v = Verdict.parse(JSON.parse(msg.content.flatMap((b) => (b.type === 'text' ? [b.text] : [])).join('')));
  // Map A/B back to baseline/variant.
  const side = (c: { a: number; b: number; why: string }) => (flip ? { baseline: c.b, variant: c.a, why: c.why } : { baseline: c.a, variant: c.b, why: c.why });
  const crits = ['specificity', 'accuracy', 'feasibility', 'fit', 'sourcing', 'usefulness'] as const;
  return {
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
