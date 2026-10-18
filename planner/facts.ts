// Verified facts, gathered once per place before anything is planned, and the audit that keeps the
// guidebook to them. A fact only survives if its quote is really on the page it cites (checked by
// code, not by a model), and any number in the finished prose must come from a fact, a real travel
// leg or the plan itself. This is what stops each run from inventing new hours, prices and minutes.
import { z } from 'zod';
import { cached, http, key } from './lib.ts';

// ── Sources: the venue's own site plus the best search results, as plain text ──
type Hit = { url: string; title: string; snippet: string };
export function searchRaw(query: string): Promise<Hit[]> {
  if (!key('PERPLEXITY_API_KEY')) return Promise.resolve([]);
  return cached('perplexity-raw', query, async () => {
    const r = await http<{ results?: { title: string; url: string; snippet?: string }[] }>('https://api.perplexity.ai/search', {
      method: 'POST', headers: { Authorization: `Bearer ${key('PERPLEXITY_API_KEY')}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, max_results: 8 }),
    });
    return (r.results ?? []).map((x) => ({ url: x.url, title: x.title, snippet: x.snippet ?? '' }));
  }, 14).catch(() => []);
}

/** A page as plain text (Shift_JIS and EUC-JP pages decoded), or '' when it can't be read. */
export function pageText(url: string): Promise<string> {
  return cached('pagetext', url, async () => {
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36', 'Accept-Language': 'ja,en;q=0.8' }, signal: AbortSignal.timeout(20000) });
    if (!res.ok || !/html|text/.test(res.headers.get('content-type') ?? '')) return '';
    const buf = new Uint8Array(await res.arrayBuffer());
    const head = new TextDecoder('latin1').decode(buf.slice(0, 4000));
    const cs = (res.headers.get('content-type')?.match(/charset=([\w-]+)/i)?.[1] ?? head.match(/charset=["']?([\w-]+)/i)?.[1] ?? 'utf-8').toLowerCase();
    let html: string;
    try { html = new TextDecoder(/sjis|shift/.test(cs) ? 'shift_jis' : /euc/.test(cs) ? 'euc-jp' : 'utf-8').decode(buf); } catch { html = new TextDecoder().decode(buf); }
    return htmlText(html).slice(0, 200000);
  }, 14).catch(() => '');
}
export const htmlText = (html: string) => html
  .replace(/<(script|style|noscript|svg)[\s\S]*?<\/\1>/gi, ' ').replace(/<br\s*\/?>|<\/(p|div|li|tr|h\d|dt|dd|th|td)>/gi, '\n').replace(/<[^>]+>/g, ' ')
  .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&yen;/g, '¥')
  .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n)).replace(/[ \t]+/g, ' ').replace(/ ?\n[ \t]*/g, '\n').replace(/\n\s*\n+/g, '\n').trim();

// Words around which the facts live: hours, prices, closures, last entry, booking.
const NEAR = /営業時間|開館|閉館|料金|入場|入館|大人|円|¥|定休|休業|休館|運休|運行|最終|受付|ラストオーダー|L\.?O|予約|現金|時間|所要|始発|hours?|open|close|admission|price|fee|yen|last (entry|order|admission)|reserv|book|closed|holiday|cash|timetable|departure/i;
/** Only the parts of a page near hours, prices and closures (a few KB instead of a whole site). */
export function relevant(text: string, max = 7000) {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  const keep = new Set<number>();
  lines.forEach((l, i) => { if (NEAR.test(l) && l.length < 600) for (let j = i - 1; j <= i + 2; j++) if (j >= 0 && j < lines.length) keep.add(j); });
  let out = '';
  for (const i of [...keep].sort((a, b) => a - b)) { if (out.length + lines[i].length > max) break; out += `${lines[i]}\n`; }
  return out;
}

const SOCIAL = /tiktok|instagram|youtube|youtu\.be|x\.com|twitter|reddit|facebook|threads|xiaohongshu|lemon8|pinterest/i;
export interface Source { url: string; text: string }
/** The pages to read for one place: its own site first, then search results that look like primary sources. */
export async function sourcesFor(name: string, nameJa: string | null, area: string, website: string | undefined, month: string): Promise<Source[]> {
  const hits = (await searchRaw(`${nameJa ?? name} ${area} 営業時間 料金 ${month}`)).filter((h) => !SOCIAL.test(h.url));
  const urls = [...new Set([website, ...hits.map((h) => h.url)].filter((u): u is string => !!u && /^https?:/.test(u)))].slice(0, 4);
  const pages = await Promise.all(urls.map(async (url) => ({ url, text: relevant(await pageText(url)) })));
  // A search snippet is text from that page too, so a quote may come from it when the page itself won't load.
  for (const h of hits) {
    const p = pages.find((x) => x.url === h.url);
    if (p) p.text = `${p.text}\n${h.snippet}`; else if (h.snippet) pages.push({ url: h.url, text: h.snippet });
  }
  return pages.filter((p) => p.text.trim().length > 40);
}

// ── The fact sheet a model fills in, every value with its quote and source ──
const Cited = { quote: z.string().describe('The exact words from the source, copied character for character (Japanese as written), one short line'), url: z.string() };
export const FactSheet = z.object({
  open: z.array(z.object({ dates: z.array(z.string()).describe('Which of the trip dates (YYYY-MM-DD) these hours apply to'), open: z.string().describe('HH:MM'), close: z.string().describe('HH:MM (after midnight: 25:00 style)'), ...Cited })).describe('Opening hours that apply on the trip dates'),
  closed: z.array(z.object({ dates: z.array(z.string()).describe('Trip dates (YYYY-MM-DD) it is closed or not running'), why: z.string(), what: z.string().describe('Exactly what is closed, e.g. "the whole museum" or "only the Owakudani–Sōunzan section (replacement bus)"'), whole_place: z.boolean().describe('True only if the place itself cannot be visited at all; false when only one section, route, facility or service is affected'), ...Cited })).describe('Regular closing days, holidays, suspensions or maintenance that fall on the trip dates'),
  last_entry: z.object({ time: z.string().describe('HH:MM'), ...Cited }).nullable().describe('Last entry, last order or last departure'),
  prices: z.array(z.object({ what: z.string().describe('e.g. "Adult admission, weekends", "Private bath, 120 min, per room"'), yen: z.number(), ...Cited })),
  fixed_minutes: z.object({ minutes: z.number(), what: z.string(), ...Cited }).nullable().describe('Only for something that cannot be done faster: a crossing, a ride, a show or performance (not a meal or a bath)'),
  booking: z.object({ text: z.string().describe('How and when to book'), ...Cited }).nullable(),
  notes: z.array(z.object({ text: z.string().describe('Another hard fact a visitor must know: cash only, group size limits, age rules, event dates'), ...Cited })),
});
export type FactSheet = z.infer<typeof FactSheet>;
export const EMPTY: FactSheet = { open: [], closed: [], last_entry: null, prices: [], fixed_minutes: null, booking: null, notes: [] };

export const FACTS_SYSTEM = `You extract hard facts about one place from the source texts given, for visitors on specific dates. Use ONLY the texts: never your own knowledge. Every value needs "quote" (the exact words from the source, copied character for character, one short line) and the "url" of the source it came from. Map weekday rules onto the trip dates using the weekdays given (e.g. "火曜定休" means closed on the Tuesday among the trip dates). Prefer the official site over others, and the newest season's information over old pages. Leave a field empty or null when the texts do not say. Prices are per adult in yen. For a closure, say exactly what is closed: a suspended section of a ropeway or a closed annex does not close the whole place.`;

// ── Validation: a fact survives only if its quote is on its page and holds its value ──
/** Text as compared: NFKC (full-width → half-width), no spaces or commas, lower case. */
export const flat = (s: string) => s.normalize('NFKC').replace(/[\s,、]/g, '').toLowerCase();
const onPage = (sources: Source[], url: string, quote: string) => {
  const q = flat(quote);
  const own = sources.find((s) => s.url === url);
  return q.length >= 4 && !!own && flat(own.text).includes(q);
};
/** The hour of HH:MM shows up in the quote (10:00 ↔ 10時 / 10:00 / 午後10時 / 25:00). */
const timeIn = (t: string, quote: string) => { const h = +t.slice(0, 2), q = flat(quote); return [h, h - 12, h + 24, h - 24].some((x) => x >= 0 && q.includes(String(x))); };
export function validate(sheet: FactSheet, sources: Source[]): { sheet: FactSheet; dropped: string[] } {
  const dropped: string[] = [];
  const ok = (label: string, x: { quote: string; url: string }, also = true) => {
    const good = onPage(sources, x.url, x.quote) && also;
    if (!good) dropped.push(`${label}: "${x.quote.slice(0, 80)}"`);
    return good;
  };
  const fm = sheet.fixed_minutes;
  return {
    sheet: {
      open: sheet.open.filter((o) => ok(`hours ${o.open}-${o.close}`, o, timeIn(o.open, o.quote) && timeIn(o.close, o.quote))),
      closed: sheet.closed.filter((c) => ok(`closed ${c.dates.join(',')}`, c)),
      last_entry: sheet.last_entry && ok(`last entry ${sheet.last_entry.time}`, sheet.last_entry, timeIn(sheet.last_entry.time, sheet.last_entry.quote)) ? sheet.last_entry : null,
      prices: sheet.prices.filter((p) => ok(`price ¥${p.yen}`, p, flat(p.quote).includes(String(p.yen)) || flat(p.quote).includes(`${p.yen / 10000}万`))),
      fixed_minutes: fm && ok(`${fm.minutes} min`, fm, flat(fm.quote).includes(String(fm.minutes)) || flat(fm.quote).includes(String(fm.minutes / 60))) ? fm : null,
      booking: sheet.booking && ok('booking', sheet.booking) ? sheet.booking : null,
      notes: sheet.notes.filter((n) => ok('note', n)),
    },
    dropped,
  };
}

/** One line per fact, for the planner, the writer and the page. */
export function factLines(f: FactSheet): { text: string; url: string }[] {
  return [
    ...f.open.map((o) => ({ text: `Open ${o.open}–${o.close} on ${o.dates.join(', ')}`, url: o.url })),
    ...f.closed.map((c) => ({ text: c.whole_place ? `Closed ${c.dates.join(', ')} (${c.why})` : `Partly closed ${c.dates.join(', ')}: ${c.what} (${c.why})`, url: c.url })),
    ...(f.last_entry ? [{ text: `Last entry ${f.last_entry.time}`, url: f.last_entry.url }] : []),
    ...f.prices.map((p) => ({ text: `${p.what}: ¥${p.yen.toLocaleString('en-US')}`, url: p.url })),
    ...(f.fixed_minutes ? [{ text: `${f.fixed_minutes.what}: ${f.fixed_minutes.minutes} min`, url: f.fixed_minutes.url }] : []),
    ...(f.booking ? [{ text: `Booking: ${f.booking.text}`, url: f.booking.url }] : []),
    ...f.notes.map((n) => ({ text: n.text, url: n.url })),
  ];
}

// ── The prose audit: every hard number in the guidebook must be backed ──
export type Claim = { kind: 'yen' | 'time' | 'minutes' | 'km'; value: number; raw: string };
/** The hard numbers in a piece of prose: yen amounts, clock times, durations, distances. */
export function claims(text: string): Claim[] {
  const out: Claim[] = [];
  const t = text.normalize('NFKC');
  for (const m of t.matchAll(/(?:¥|JPY\s?)\s?([\d,]+(?:\.\d+)?)(\s?(?:k\b|万))?|([\d,]+)\s?(?:yen\b|円)/gi)) {
    const n = Number((m[1] ?? m[3]).replace(/,/g, '')) * (/k/i.test(m[2] ?? '') ? 1000 : /万/.test(m[2] ?? '') ? 10000 : 1);
    if (n >= 100) out.push({ kind: 'yen', value: n, raw: m[0] });
  }
  for (const m of t.matchAll(/(?<![\d:])([01]?\d|2\d):([0-5]\d)(?![\d:])/g)) out.push({ kind: 'time', value: +m[1] * 60 + +m[2], raw: m[0] });
  for (const m of t.matchAll(/(?<![\d:.])(\d+(?:\.\d+)?)(?:\s?[–-]\s?(\d+(?:\.\d+)?))?[\s-]?(minutes?|mins?\b|分|hours?\b|hrs?\b|時間)/gi)) {
    const unit = /h|時間/i.test(m[3]) ? 60 : 1;
    for (const v of [m[1], m[2]]) if (v) out.push({ kind: 'minutes', value: Math.round(+v * unit), raw: m[0] });
  }
  for (const m of t.matchAll(/(\d+(?:\.\d+)?)\s?(?:km\b|kilomet)/gi)) out.push({ kind: 'km', value: +m[1], raw: m[0] });
  return out;
}
/** Every number a stop's prose may use: from its facts, research, plan, travel legs and the day's times. */
export function allowedFrom(texts: (string | null | undefined)[], people: number) {
  const yen = new Set<number>(), times = new Set<number>(), minutes = new Set<number>(), km = new Set<number>();
  for (const s of texts) {
    if (!s) continue;
    for (const c of claims(s)) (c.kind === 'yen' ? yen : c.kind === 'time' ? times : c.kind === 'minutes' ? minutes : km).add(c.value);
    // Bare numbers in a source (e.g. "2,200" beside 大人) count as prices too.
    for (const m of s.normalize('NFKC').matchAll(/\d[\d,]{2,}/g)) yen.add(Number(m[0].replace(/,/g, '')));
  }
  // Spans between known times are allowed durations (a 10:00–12:00 slot is "2 hours").
  const ts = [...times];
  for (const a of ts) for (const b of ts) if (b > a && b - a <= 600) minutes.add(b - a);
  return { yen, times, minutes, km, people };
}
export type Allowed = ReturnType<typeof allowedFrom>;
/** The claims in `text` that nothing backs. Group totals and per-person splits of a backed price count as backed. */
export function unsupported(text: string, a: Allowed): Claim[] {
  return claims(text).filter((c) => {
    if (c.kind === 'yen') return ![...a.yen].some((y) => { for (let k = 1; k <= Math.max(8, a.people); k++) if (Math.abs(y * k - c.value) <= y * k * 0.03 || Math.abs(y / k - c.value) <= y / k * 0.06 + 50) return true; return false; });
    if (c.kind === 'time') return ![...a.times].some((t) => Math.abs(t - c.value) <= 5);
    if (c.kind === 'minutes') return c.value > 5 && ![...a.minutes].some((m) => Math.abs(m - c.value) <= Math.max(3, m * 0.15));
    return ![...a.km].some((k) => Math.abs(k - c.value) <= 0.3);
  });
}
/** Drop the sentences that still make an unbacked claim. */
export function stripUnsupported(text: string, a: Allowed) {
  return text.split(/(?<=[.!?。])\s+/).filter((s) => !unsupported(s, a).length).join(' ').trim();
}

/** Open for the visit on `date` per the verified facts: a reason when it isn't, null when fine or unknown. */
export function factProblem(f: FactSheet | undefined, date: string, startMin: number, endMin: number): string | null {
  if (!f) return null;
  const closed = f.closed.find((c) => c.whole_place && c.dates.includes(date));
  if (closed) return `closed on ${date} (${closed.why}; ${closed.url})`;
  const toMin = (t: string) => +t.slice(0, 2) * 60 + +t.slice(3, 5);
  const ranges = f.open.filter((o) => o.dates.includes(date));
  if (ranges.length && !ranges.some((o) => { let c = toMin(o.close); if (c <= toMin(o.open)) c += 1440; return startMin >= toMin(o.open) - 5 && Math.min(endMin, startMin + 30) <= c; })) return `open only ${ranges.map((o) => `${o.open}–${o.close}`).join(', ')} on ${date} (${ranges[0].url})`;
  if (f.last_entry && startMin > toMin(f.last_entry.time) + 2 && toMin(f.last_entry.time) > 300) return `last entry ${f.last_entry.time} (${f.last_entry.url})`;
  if (f.fixed_minutes && endMin - startMin + 5 < f.fixed_minutes.minutes) return `${f.fixed_minutes.what} takes ${f.fixed_minutes.minutes} min, but the slot is ${endMin - startMin} min (${f.fixed_minutes.url})`;
  return null;
}
