// Matching what someone typed against place names written in English, Japanese, or Japanese spelt in
// Latin letters, the way it's actually typed on a phone in Japan:
//   · full-width ＡＢＣ and half-width ｶﾀｶﾅ are the same letters (NFKC);
//   · katakana and hiragana are the same sounds (カフェ = かふぇ);
//   · macrons and their spellings out are the same: Tōkyō = Tokyo = Toukyou = Tookyoo;
//   · Shimbashi = Shinbashi, Sensō-ji = Sensoji = Senso ji;
//   · one slip per word is forgiven once a word is long enough to mean something (ichrian → Ichiran).
// Shared by the search box and its tests; no DOM.

const KATA = /[ァ-ヶ]/g;
/** Folded for comparison: no case, accents, spaces or punctuation; kana as hiragana; romaji vowels collapsed. */
export function fold(s: string): string {
  return words(s).join('');
}
/** The same folding, kept as separate words (for prefix and per-word typo matching). */
export function words(s: string): string[] {
  const t = s.normalize('NFKC').toLowerCase()
    .replace(KATA, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60))
    .normalize('NFKD').replace(/[̀-ͯ]/g, '');
  return t.split(/[\s\-‐–—_/・·.,'’"“”()（）［］\[\]「」『』&+!?！？:：|]+/).filter(Boolean).map(romaji).filter(Boolean);
}
function romaji(w: string): string {
  if (!/[a-z]/.test(w)) return w.replace(/ー/g, '');
  return w.replace(/ou|oo|oh(?![aeiou])/g, 'o').replace(/uu/g, 'u').replace(/m(?=[bmp])/g, 'n').replace(/n'/g, 'n');
}

/** Edit distance with swapped neighbours as one slip, giving up once it passes `max`. */
export function within(a: string, b: string, max: number): boolean {
  if (Math.abs(a.length - b.length) > max) return false;
  let before: number[] = [];
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    let best = i;
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) cur[j] = Math.min(cur[j], before[j - 2] + 1);
      best = Math.min(best, cur[j]);
    }
    if (best > max) return false;
    before = prev;
    prev = cur;
  }
  return prev[b.length] <= max;
}

/** A name's searchable forms, folded once (places are folded when they're loaded, not per keystroke). */
export interface Keys { whole: string[]; words: string[] }
export function keys(...names: (string | null | undefined)[]): Keys {
  const ns = names.filter(Boolean) as string[];
  return { whole: ns.map(fold), words: [...new Set(ns.flatMap(words))] };
}

/**
 * How well a query names a place, 0 (not at all) to 1 (exactly). Whole-name matches beat word
 * matches beat substrings beat typos, so "tokyo tower" puts Tokyo Tower above Tokyo Ramen Tower.
 */
export const score = (query: string, k: Keys) => scorer(query)(k);
/** The same, with the query folded once, for scoring thousands of places per keystroke. */
export function scorer(query: string, typos = true): (k: Keys) => number {
  const q = fold(query);
  const qw = words(query);
  return q ? (k) => rate(q, qw, k, typos) : () => 0;
}
function rate(q: string, qw: string[], k: Keys, typos: boolean): number {
  let best = 0;
  for (const w of k.whole) {
    if (w === q) return 1;
    if (w.startsWith(q)) best = Math.max(best, 0.9 - Math.min(0.15, (w.length - q.length) / 80));
    else if (q.length >= 2 && w.includes(q)) best = Math.max(best, 0.7);
  }
  if (best >= 0.85) return best;
  // Every typed word starts some word of the name ("shibu sky" → SHIBUYA SKY).
  const pre = qw.every((x) => k.words.some((w) => w.startsWith(x)));
  if (pre) best = Math.max(best, qw.length > 1 ? 0.86 : 0.8);
  if (best) return best;
  // Japanese has no spaces: a run of kana/kanji inside any name.
  if (/[^\x00-\x7f]/.test(q) && k.whole.some((w) => w.includes(q))) return 0.7;
  if (!typos) return 0;
  // Typos: each word of four or more letters within one edit (two from eight letters) of a name word.
  // The first letter is taken as typed: slips there are rare, and checking it first skips almost every word.
  const slip = (x: string) => (x.length >= 8 ? 2 : 1);
  if (q.length >= 4 && qw.every((x) => (x.length < 4
    ? k.words.some((w) => w.startsWith(x))
    : k.words.some((w) => w[0] === x[0] && (within(x, w, slip(x)) || (w.length > x.length && within(x, w.slice(0, x.length), slip(x)))))))) return 0.55;
  return 0;
}

/** The name with the typed words marked (ASCII words only; for kana the row is already short). */
export function highlight(name: string, query: string, esc: (s: string) => string): string {
  const qs = query.toLowerCase().split(/\s+/).filter((x) => x.length >= 2 && /^[\x20-\x7e]+$/.test(x));
  if (!qs.length) return esc(name);
  const lower = name.toLowerCase();
  const marks: [number, number][] = [];
  for (const x of qs) {
    const m = new RegExp(`(^|[^a-z0-9])(${x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`).exec(lower);
    if (!m) continue;
    const at = m.index + m[1].length;
    marks.push([at, at + x.length]);
  }
  if (!marks.length) return esc(name);
  marks.sort((a, b) => a[0] - b[0]);
  let out = '', pos = 0;
  for (const [a, b] of marks) {
    if (a < pos) continue;
    out += `${esc(name.slice(pos, a))}<mark>${esc(name.slice(a, b))}</mark>`;
    pos = b;
  }
  return out + esc(name.slice(pos));
}
