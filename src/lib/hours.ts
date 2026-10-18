// A compact reader for OpenStreetMap `opening_hours` (what both OSM and the TREK index return), enough
// for the common forms: "24/7", "Mo-Fr 11:00-22:00; Sa,Su 10:00-23:00", "11:00-14:00,17:00-02:00",
// "Mo off", "18:00-26:00". Later rules override earlier ones for their days, as the spec says. Rules
// it can't read (months, holidays, sunrise) are skipped; if nothing is readable the hours are unknown.
const DAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
type Span = [number, number]; // minutes from that day's midnight; the end may run past 1440

export interface Hours { always: boolean; week: Span[][] }

export function parseHours(src: string | null | undefined): Hours | null {
  if (!src) return null;
  const s = src.trim();
  if (/^24\/7$/.test(s)) return { always: true, week: [] };
  const week: Span[][] = Array.from({ length: 7 }, () => []);
  let any = false;
  const D = '(?:Mo|Tu|We|Th|Fr|Sa|Su)';
  const dayRe = new RegExp(`^((?:${D}(?:-${D})?)(?:,${D}(?:-${D})?)*)?\\s*(.*)$`);
  for (const raw of s.split(';')) {
    const rule = raw.trim();
    if (!rule) continue;
    const m = rule.match(dayRe);
    if (!m) continue;
    const [, dayPart, rest] = m;
    if (!dayPart && /^(PH|SH|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|week|easter)/.test(rest)) continue;
    const days = new Set<number>();
    if (dayPart) for (const piece of dayPart.split(',')) {
      const [a, b] = piece.split('-').map((d) => DAYS.indexOf(d));
      if (b === undefined) days.add(a);
      else for (let k = a; ; k = (k + 1) % 7) { days.add(k); if (k === b) break; }
    } else for (let k = 0; k < 7; k++) days.add(k);
    const body = rest.replace(/^,?\s*PH\s*/, '').trim();
    if (/^(off|closed)$/i.test(body)) { for (const d of days) week[d] = []; any = true; continue; }
    const spans: Span[] = [];
    for (const t of body.split(',')) {
      const tm = t.trim().match(/^(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})\+?$/);
      if (!tm) continue;
      const a = +tm[1] * 60 + +tm[2];
      let b = +tm[3] * 60 + +tm[4];
      if (b <= a) b += 1440; // runs past midnight
      spans.push([a, b]);
    }
    if (!spans.length) continue;
    for (const d of days) week[d] = spans;
    any = true;
  }
  return any ? { always: false, week } : null;
}

const hhmm = (m: number) => `${String(Math.floor((m % 1440) / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;

/** Open or not at a moment (ms), in Japan time, and when that changes. */
export function hoursAt(h: Hours | null, ms: number): { open: boolean; label: string } | null {
  if (!h) return null;
  if (h.always) return { open: true, label: 'Open 24 hours' };
  const jst = new Date(ms + 9 * 3600e3);
  const day = (jst.getUTCDay() + 6) % 7; // Mo = 0
  const min = jst.getUTCHours() * 60 + jst.getUTCMinutes();
  const prev = (day + 6) % 7;
  for (const [a, b] of h.week[day]) if (min >= a && min < b) return { open: true, label: `Open · until ${hhmm(b)}` };
  for (const [, b] of h.week[prev]) if (b > 1440 && min < b - 1440) return { open: true, label: `Open · until ${hhmm(b)}` };
  const later = h.week[day].map(([a]) => a).filter((a) => a > min).sort((x, y) => x - y)[0];
  if (later != null) return { open: false, label: `Closed · opens ${hhmm(later)}` };
  for (let k = 1; k <= 7; k++) {
    const d = (day + k) % 7;
    if (h.week[d].length) return { open: false, label: `Closed · opens ${k === 1 ? 'tomorrow' : DAYS[d]} ${hhmm(h.week[d][0][0])}` };
  }
  return { open: false, label: 'Closed' };
}
