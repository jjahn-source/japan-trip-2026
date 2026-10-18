// Reading a search query into what it asks for, where, and with which conditions:
//   "ramen near stop 5 open now"        → ramen · near stop 5 (of the day on screen) · open now
//   "late night izakaya near Shinjuku"  → izakaya · near "shinjuku" · open late
//   "toilets between stop 3 and 4"      → toilets · on the way from stop 3 to stop 4
//   "coffee along day 6 route"          → cafés · along Day 6's route
//   "7-eleven near me"                  → konbini named 7-Eleven · near you
// Pure (no DOM, no map): the search box resolves `where` against the map; the tests read it directly.
import { CATS } from './categories.ts';

export const MODS = {
  open: /\b(open now|now open|open|opened)\b|営業中/,
  late: /\b(late[- ]night|late|after midnight|24 ?h(ou)?rs?|24\/7|all[- ]night|midnight|tonight)\b|深夜/,
  vegetarian: /\b(vegetarian|vegan|plant[- ]based|veggie)\b|ベジタリアン/,
  halal: /\bhalal\b|ハラル/,
  card: /\b(credit cards?|cards? ok|takes cards?|cashless|visa|mastercard|amex)\b/,
  wheelchair: /\b(wheelchair|accessible|step[- ]free)\b/,
  nosmoking: /\b(non[- ]?smoking|no smoking|smoke[- ]free)\b|禁煙/,
  group: /\b(groups?|party|seats? ?8|for 8|for eight|eight of us|big table)\b|団体/,
} as const;
export type Mod = keyof typeof MODS;
export const MOD_LABEL: Record<Mod, string> = { open: 'open now', late: 'open late', vegetarian: 'vegetarian', halal: 'halal', card: 'takes cards', wheelchair: 'step-free', nosmoking: 'non-smoking', group: 'seats 8' };

export type Where =
  | { kind: 'stop'; day: number | null; i: number }
  | { kind: 'between'; day: number | null; a: number; b: number }
  | { kind: 'route'; day: number | null }
  | { kind: 'me' }
  | { kind: 'place'; name: string };

export interface Parsed { cats: string[]; mods: Mod[]; text: string; where: Where | null; /** A chain's name (7-Eleven, Round1): find its branches, however far. */ brand: boolean }

// Names that are a category and a specific place at once: keep the name, so 7-Eleven isn't Lawson.
const BRANDS = /\b(7-?eleven|seven ?eleven|lawson|family ?mart|ministop|daiso|seria|matsukiyo|big echo|manekineko|jankara|round ?1|round one|taito|gigo|ichiran|ippudo)\b|ドン・?キホーテ/;
const FILLER = /\b(cheap|budget|good|best|great|nice|cool|fun|some|a|an|the|find|search|show|me|i|we|want|wanna|need|looking|where|wheres|is|are|any|place|places|spot|spots|for|to|get|go|grab|of|with|that|which|what|please|pls|us)\b/g;

export function parseQuery(q: string): Parsed {
  let text = ` ${q.normalize('NFKC').toLowerCase().replace(/[?!.,]+/g, ' ')} `;
  const cut = (re: RegExp | string) => { text = text.replace(re, ' '); };

  // 1. Conditions ("open now", "vegan"), so they never end up inside a place name.
  let mods = (Object.keys(MODS) as Mod[]).filter((m) => MODS[m].test(text));
  for (const m of mods) cut(new RegExp(MODS[m].source, 'g'));
  if (mods.includes('late')) mods = mods.filter((m) => m !== 'open'); // open late implies open

  // 2. Where: a stop, a stretch between stops, the route, you, or a named place.
  let where: Where | null = null;
  const dayM = text.match(/\bday ?(\d{1,2})\b/);
  const day = dayM ? +dayM[1] : null;
  if (dayM) cut(dayM[0]);
  const between = text.match(/\b(?:between|from) (?:stops? )?#?(\d{1,2}) (?:and|&|to|-) (?:stop )?#?(\d{1,2})\b/);
  const stop = text.match(/\b(?:(?:near|around|by|at|after|before|close to) )?stop #?(\d{1,2})\b/);
  const route = /\b(along( the)?( way| route)?|on the way|en route|on (my|our|the) route|route)\b/;
  const me = /\b(near me|nearby|around me|around here|near here|here|close to me|close by|closest|nearest|near us)\b|近く/;
  if (between) { where = { kind: 'between', day, a: +between[1], b: +between[2] }; cut(between[0]); }
  else if (stop) { where = { kind: 'stop', day, i: +stop[1] }; cut(stop[0]); }
  else if (route.test(text)) { where = { kind: 'route', day }; cut(new RegExp(route.source, 'g')); cut(/\b(today'?s?|tomorrow'?s?)\b/g); }
  else if (me.test(text)) { where = { kind: 'me' }; cut(new RegExp(me.source, 'g')); }
  else {
    const m = text.match(/\b(?:near|around|in|by|at|close to|next to|outside)\s+(.+?)\s*$/);
    if (m && m[1].trim().length >= 2) { where = { kind: 'place', name: m[1].trim() }; cut(m[0]); }
  }
  if (!where && day) where = { kind: 'route', day };

  // 3. What: categories, keeping brand names as text.
  const cats: string[] = [];
  let brand = false;
  for (const c of CATS) {
    if (!c.words.test(text)) continue;
    cats.push(c.key);
    text = text.replace(new RegExp(c.words.source, 'g'), (w) => (BRANDS.test(w) ? ((brand = true), w) : ' '));
  }
  // "Bars" and "izakaya" in one ask is izakaya; "food" with "ramen" is ramen.
  const narrow = cats.filter((k) => !(k === 'food' && cats.length > 1) && !(k === 'bar' && cats.includes('izakaya')));
  cut(FILLER);
  return { cats: narrow, mods, text: text.replace(/\s+/g, ' ').trim(), where, brand };
}
