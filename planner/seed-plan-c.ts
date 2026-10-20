// Seeds Plan C (data/japan-plan-c.md, the group's own plan) into the session's research pool as
// candidates, one file per city, so `resolve` finds and verifies them and fact-readers check them
// on the trip dates like any other research. Nothing from Plan C is trusted unverified.
//   node planner/seed-plan-c.ts
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parsePlan, type Day, type Stop } from '../src/lib/plan.ts';
import { Candidate } from './core.ts';

const ROOT = resolve(import.meta.dirname, '..');
const RAW = resolve(ROOT, 'data/research/session/raw');

type Kind = Candidate['kind'];
const KIND: Record<string, Kind> = { restaurant: 'food', bar: 'bar', attraction: 'sight', shopping: 'shopping', activity: 'experience', nature: 'sight', other: 'other' };

/** The trip leg a stop belongs to, from where it is (Kansai, Hakone) else from the date. */
function cityOf(s: Stop, day: Day): string {
  if (s.lat != null && s.lng != null) {
    if (s.lng < 137) return 'Osaka';
    if (s.lng > 138.95 && s.lng < 139.25 && s.lat > 35.15 && s.lat < 35.35) return 'Hakone';
    return 'Tokyo';
  }
  return day.date < '2026-12-19' ? 'Tokyo' : day.date < '2026-12-21' ? 'Hakone' : day.date < '2026-12-26' ? 'Osaka' : 'Tokyo';
}

/** Which brief wishes (planner/brief.md) a Plan C stop is one of the set pieces for. */
const WISHES: [RegExp, string][] = [
  [/santa parade/i, 'w13'], [/santa/i, 'w12'], [/noah|korakuen|wrestling/i, 'w14'], [/b\.?league|toyota arena|sunrockers/i, 'w15'],
  [/yakatabune|harumiya/i, 'w16'], [/hiroshima|miyajima|itsukushima|hassho|peace memorial|dome/i, 'w17'], [/yunessun|wagyu cook|villa/i, 'w18'],
  [/kfc/i, 'w19'], [/fugu|genpin/i, 'w20'], [/sumo|arashio|omakase|kunimitsu/i, 'w21'], [/thermae|spa world|onsen/i, 'w22'],
  [/round1/i, 'w6'], [/sneaker|bape|atmos|kicks|vintage|human made|donki|quijote|uniqlo|dover/i, 'w23'], [/karaoke|manekineko|echo|izakaya|yokoch|standing/i, 'w24'],
];

const kindOf = (s: Stop): Kind =>
  /yunessun|thermae|spa world|onsen|bath/i.test(s.name) ? 'onsen'
  : /noah|korakuen|b\.?league|toyota arena|santa parade|yakatabune|fireworks|illumination|hagoita|flea|christmas market|year-end/i.test(s.name) ? 'event'
  : KIND[s.category] ?? 'other';

const minutes = (a: string, b: string) => { const [h, m] = a.split(':').map(Number); const [h2, m2] = b.split(':').map(Number); const d = (h2 * 60 + m2) - (h * 60 + m); return d > 0 ? d : d + 1440; };
const detail = (s: Stop, re: RegExp) => s.details.filter((d) => d.label && re.test(d.label)).map((d) => d.text).join(' ') || null;

const trip = parsePlan(readFileSync(resolve(ROOT, 'data/japan-plan-c.md'), 'utf8'));
const byCity = new Map<string, Candidate[]>();
const notes = new Map<string, string[]>();

for (const day of trip.days) {
  for (const s of day.stops) {
    if (s.category === 'transport' || s.category === 'stay' || /supermarket|maruetsu/i.test(s.name)) continue;
    const city = cityOf(s, day);
    const ja = s.name.match(/[぀-ヿ一-鿿][^)）]*/)?.[0] ?? null;
    const [head, ...rest] = s.name.replace(/\s*[(（][^)）]*[぀-ヿ一-鿿][^)）]*[)）]/g, '').split(/\s+[—–]\s+/);
    const name = head.trim(); // "Torien — Omoide Yokochō yakitori, 2F booked for 8" looks up as "Torien"
    const gloss = rest.join(' — ');
    const url = s.website ?? s.map ?? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name)}`;
    const cand = Candidate.parse({
      name, name_ja: ja, city, area: s.address?.match(/[\p{L}ō]+-ku\b|[぀-ヿ一-鿿]+区/u)?.[0] ?? city,
      kind: kindOf(s),
      why: `${gloss ? `${gloss}. ` : ''}${s.summary ?? s.plan ?? name} (From Plan C, the group's own plan for ${day.label}: "${day.title}".)`,
      best_time: `${s.start}–${s.end} in Plan C`, dates: day.date,
      price: s.price, booking: detail(s, /book|ticket|reserv/i), group_of_8: detail(s, /group|party|seat/i),
      hours: detail(s, /hours|open/i), visit_minutes: minutes(s.start, s.end), first_last: detail(s, /shows|departures|last/i),
      lat: s.lat, lng: s.lng,
      wish_ids: [...new Set(WISHES.filter(([re]) => re.test(s.name)).map(([, w]) => w))],
      evidence: [{ source: "Plan C (the group's own plan)", url, note: `Chosen by the group for ${day.label}${s.plan ? `: ${s.plan}` : ''}`.slice(0, 400) }],
      confidence: 0.8,
    });
    byCity.set(city, [...(byCity.get(city) ?? []), cand]);
  }
  const c = cityOf(day.stops.find((s) => s.lat != null) ?? day.stops[0] ?? ({} as Stop), day);
  notes.set(c, [...(notes.get(c) ?? []), `Plan C ${day.label}: ${day.title}`]);
}

mkdirSync(RAW, { recursive: true });
for (const [city, candidates] of byCity) {
  const f = resolve(RAW, `${city.toLowerCase()}-planc.json`);
  writeFileSync(f, JSON.stringify({ candidates, notes: `${city} · planc: the group's own Plan C, to verify and keep where it survives. ${(notes.get(city) ?? []).join(' | ')}` }, null, 2));
  console.log(`${city}: ${candidates.length} Plan C places -> ${f}`);
}
