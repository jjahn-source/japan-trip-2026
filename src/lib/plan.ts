// Parses the TREK markdown export (data/japan-plan-c.md) into typed trip data.
// Runs at build time only; nothing here ships to the browser.
import { existsSync, readFileSync } from 'node:fs';
import { itineraryToTrip, type Guide, type Itinerary } from './itinerary.ts';
import { resolve } from 'node:path';

export type Category =
  | 'transport' | 'stay' | 'restaurant' | 'attraction' | 'shopping'
  | 'activity' | 'bar' | 'nature' | 'other';

export interface Detail { label: string | null; text: string }

export interface Stop {
  id: string;            // "d07-s05"
  day: number;
  index: number;
  start: string;         // "15:20"
  end: string;           // "17:20"
  startISO: string;      // "2026-12-20T15:20:00+09:00" (rolls past midnight)
  endISO: string;
  name: string;
  category: Category;
  categoryLabel: string; // as written in the export, e.g. "Bar/Cafe"
  price: string | null;  // "¥2,900 pp" | "$898.70 USD (group total)" | null when free
  free: boolean;
  summary: string | null;
  plan: string | null;
  details: Detail[];
  extra: string[];       // further paragraphs (e.g. Haneda departure note)
  website: string | null;
  map: string | null;
  phone: string | null;
  address: string | null;
  lat: number | null;
  lng: number | null;
  /** The itinerary agent's guidebook spread (data/itinerary.json only). */
  guide?: Guide | null;
  /** How to get to the next stop, in the agent's words. */
  transport?: string | null;
}

export interface Note { kind: string; qualifier: string | null; text: string; check: boolean }

export interface Day {
  n: number;
  date: string;          // "2026-12-20"
  weekday: string;       // "Sun"
  label: string;         // "Sun Dec 20"
  title: string;
  notes: Note[];
  stops: Stop[];
  /** The day's stamp, when the itinerary agent chose it. */
  stamp?: { kanji: string; reading: string; place: string };
}

export interface Stay {
  name: string;
  short: string;
  address: string;
  checkIn: string;       // display "Tue Dec 15 16:00"
  checkOut: string;
  checkInISO: string;
  checkOutISO: string;
  confirmation: string;
  notes: string;
}

export interface Todo { due: string | null; dueLabel: string | null; text: string; detail: string | null; /** Stop ids, when the source links them. */ stops?: string[] }
export interface BudgetRow { category: string; item: string; group: string; perPerson: string; note: string }
export interface Trip {
  title: string;
  dates: string;
  people: number;
  exported: string;
  stays: Stay[];
  days: Day[];
  todos: Todo[];
  budget: BudgetRow[];
  budgetTotals: { category: string; perPerson: string }[];
}

const MONTHS: Record<string, string> = {
  Jan: '01', Feb: '02', Mar: '03', Apr: '04', May: '05', Jun: '06',
  Jul: '07', Aug: '08', Sep: '09', Oct: '10', Nov: '11', Dec: '12',
};

const CATEGORY: Record<string, Category> = {
  transport: 'transport', stay: 'stay', restaurant: 'restaurant', attraction: 'attraction',
  shopping: 'shopping', activity: 'activity', 'bar/cafe': 'bar', nature: 'nature', hotel: 'stay',
};

/** Year is fixed by the export header (Dec 2026); to-dos all fall in 2026 too. */
function isoDate(mon: string, day: string, year = '2026') {
  return `${year}-${MONTHS[mon]}-${day.padStart(2, '0')}`;
}

function addDays(date: string, n: number) {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

const toMin = (t: string) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
const iso = (date: string, t: string) => `${date}T${t}:00+09:00`;

/** Remove emoji pictographs (the design draws its own icons). */
export function noEmoji(s: string) {
  return s.replace(/\p{Extended_Pictographic}\uFE0F?/gu, '').replace(/\s{2,}/g, ' ').trim();
}

/** Strip markdown emphasis and inline links to plain text with link labels. */
export function plain(s: string) {
  return s.replace(/\*\*(.+?)\*\*/g, '$1').replace(/\*(.+?)\*/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').replace(/<br\s*\/?>/g, ' · ').trim();
}

/** Pins in the export that sit away from the place they name, checked against OpenStreetMap
 *  (Oct 2026). Keyed by stop id; the map link is rewritten to match. */
const PIN_FIXES: Record<string, { lat: number; lng: number; why: string }> = {
  'd07-s01': { lat: 35.2379, lng: 138.9946, why: 'Tōgendai station; the export pin was 2 km east, on the ropeway line' },
  'd07-s03': { lat: 35.2376, lng: 138.9948, why: 'the boat leaves from Tōgendai port; the export pin was inland' },
  'd07-s07': { lat: 35.2394, lng: 139.0452, why: 'Hakone Kowakien Yunessun; the export pin was 1 km north-east' },
};

function fixPin<T extends { id: string; lat: number | null; lng: number | null; map: string | null }>(stop: T): T {
  const fix = PIN_FIXES[stop.id];
  if (!fix) return stop;
  return { ...stop, lat: fix.lat, lng: fix.lng, map: `https://www.google.com/maps/search/?api=1&query=${fix.lat},${fix.lng}` };
}

function parseLinks(line: string) {
  const out: Pick<Stop, 'website' | 'map' | 'phone' | 'address' | 'lat' | 'lng'> =
    { website: null, map: null, phone: null, address: null, lat: null, lng: null };
  for (const part of line.split(' · ')) {
    const link = part.match(/^\[(Website|Map)\]\((.+)\)$/);
    if (link) {
      if (link[1] === 'Website') out.website = link[2];
      else {
        out.map = link[2];
        const q = link[2].match(/query=(-?\d+\.\d+),(-?\d+\.\d+)/);
        if (q) { out.lat = +(+q[1]).toFixed(6); out.lng = +(+q[2]).toFixed(6); }
      }
    } else if (part.startsWith('☎')) out.phone = part.replace('☎', '').trim();
    else if (part.trim()) out.address = out.address ? `${out.address} · ${part.trim()}` : part.trim();
  }
  return out;
}

function parseTable(lines: string[]) {
  return lines
    .filter((l) => l.startsWith('|') && !/^\|[-| ]+\|$/.test(l))
    .slice(1)
    .map((l) => l.slice(1, -1).split(' | ').map((c) => c.trim()));
}

/** Split the file into `## ` sections keyed by heading. */
function sections(md: string) {
  const out: { heading: string; body: string[] }[] = [];
  for (const line of md.split('\n')) {
    if (line.startsWith('## ')) out.push({ heading: line.slice(3).trim(), body: [] });
    else if (/^---\s*$/.test(line) || /^<a id="[^"]*"><\/a>$/.test(line)) continue;
    else if (out.length) out[out.length - 1].body.push(line);
  }
  return out;
}

function parseNotes(body: string[]): Note[] {
  const quote = body.filter((l) => l.startsWith('>')).map((l) => l.replace(/^>\s?/, ''));
  return quote.join('\n').split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean).map((p) => {
    const m = p.match(/^(\p{Extended_Pictographic}️?|\p{Emoji_Presentation})\s*/u);
    const text = m ? p.slice(m[0].length) : p;
    const head = text.match(/^([A-Z][A-Z0-9 &'-]*[A-Z0-9])(?:\s*\(([^)]*)\))?:\s*/);
    return {
      kind: head ? head[1] : 'NOTE',
      qualifier: head?.[2] ?? null,
      text: head ? text.slice(head[0].length) : text,
      check: head ? /CHECK/.test(head[1]) : false,
    };
  });
}

function parseStops(day: Day, body: string[]) {
  const blocks: string[][] = [];
  for (const line of body) {
    if (line.startsWith('### ')) blocks.push([line]);
    else if (blocks.length) blocks[blocks.length - 1].push(line);
  }
  let prevStart = -1;
  let offset = 0; // days past this day's date, for after-midnight stops
  blocks.forEach((block, index) => {
    const head = block[0].match(/^### (\d{2}:\d{2})–(\d{2}:\d{2}) · (.+)$/);
    if (!head) throw new Error(`Unparsed stop heading: ${block[0]}`);
    const [, start, end, name] = head;
    if (prevStart >= 0 && toMin(start) < prevStart) offset += 1;
    prevStart = toMin(start);
    const startDate = addDays(day.date, offset);
    const endDate = toMin(end) <= toMin(start) ? addDays(startDate, 1) : startDate;

    const rest = block.slice(1).join('\n').replace(/\n---\s*$/, '').trim();
    const paras = rest.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
    const meta = paras.shift() ?? '';
    const metaM = meta.match(/^\*(.+)\*$/);
    const metaText = metaM ? metaM[1] : meta;
    const [catPart, pricePart] = metaText.split(' · ');
    const categoryLabel = catPart.replace(/^\P{L}+/u, '').trim();
    const price = pricePart?.trim() ?? null;

    let linksLine: string | null = null;
    if (paras.length && /^\[(Website|Map)\]/.test(paras[paras.length - 1])) linksLine = paras.pop()!;

    let summary: string | null = null;
    let plan: string | null = null;
    const details: Detail[] = [];
    const extra: string[] = [];
    for (const p of paras) {
      if (p.startsWith('**Plan:**')) { plan = p.replace('**Plan:**', '').trim(); continue; }
      const lines = p.split('\n');
      if (lines.every((l) => /^\*\*[^*]+\*\*/.test(l))) {
        for (const l of lines) {
          const m = l.match(/^\*\*([^*]+):\*\*\s*(.*)$/);
          details.push(m ? { label: m[1], text: m[2] } : { label: null, text: l });
        }
      } else if (!summary && !details.length && !plan) summary = p;
      else extra.push(p);
    }

    day.stops.push(fixPin({
      id: `d${String(day.n).padStart(2, '0')}-s${String(index + 1).padStart(2, '0')}`,
      day: day.n,
      index,
      start, end,
      startISO: iso(startDate, start),
      endISO: iso(endDate, end),
      name: noEmoji(name),
      category: CATEGORY[categoryLabel.toLowerCase()] ?? 'other',
      categoryLabel,
      price: price && price.toLowerCase() !== 'free' ? price : null,
      free: !price || price.toLowerCase() === 'free',
      summary, plan, details, extra,
      ...(linksLine ? parseLinks(linksLine) : parseLinks('')),
    }));
  });
}

export function parsePlan(md: string): Trip {
  const titleLine = md.match(/^# (.+)$/m)?.[1] ?? 'Japan';
  const header = md.match(/^\*\*(.+?)\*\* · (\d+) people · (\d+) days/m);
  const exported = md.match(/Exported from TREK on (\d{4}-\d{2}-\d{2})/)?.[1] ?? '';
  const trip: Trip = {
    title: titleLine, dates: header?.[1] ?? '', people: header ? +header[2] : 8, exported,
    stays: [], days: [], todos: [], budget: [], budgetTotals: [],
  };

  for (const sec of sections(md)) {
    const h = sec.heading;
    if (h === 'Where we stay') {
      for (const [nameCell, inCell, outCell, conf, notes] of parseTable(sec.body)) {
        const [nameRaw, address] = nameCell.split('<br>');
        const name = plain(nameRaw);
        const stamp = (cell: string) => {
          const m = cell.match(/^(\w{3}) (\w{3}) (\d{1,2}) (\d{2}:\d{2})$/)!;
          return iso(isoDate(m[2], m[3]), m[4]);
        };
        trip.stays.push({
          name, short: name.replace(/\s*\(Airbnb\).*$/, ''), address: address.trim(),
          checkIn: inCell, checkOut: outCell, checkInISO: stamp(inCell), checkOutISO: stamp(outCell),
          confirmation: conf, notes,
        });
      }
    } else if (/^Day \d+ — /.test(h)) {
      const m = h.match(/^Day (\d+) — (\w{3}) (\w{3}) (\d{1,2}): (.+)$/)!;
      const day: Day = {
        n: +m[1], date: isoDate(m[3], m[4]), weekday: m[2], label: `${m[2]} ${m[3]} ${m[4]}`,
        title: noEmoji(m[5]), notes: parseNotes(sec.body), stops: [],
      };
      parseStops(day, sec.body);
      trip.days.push(day);
    } else if (h === 'Booking & to-do schedule') {
      for (const line of sec.body) {
        const top = line.match(/^- \[[ x]\] (.+)$/);
        if (top) {
          const due = top[1].match(/^\*\*(\w{3}) (\w{3}) (\d{1,2})\*\* — (.+)$/);
          trip.todos.push(due
            ? { due: isoDate(due[2], due[3]), dueLabel: `${due[1]} ${due[2]} ${due[3]}`, text: noEmoji(due[4]), detail: null }
            : { due: null, dueLabel: null, text: noEmoji(top[1]), detail: null });
          continue;
        }
        const sub = line.match(/^\s+- (.+)$/);
        if (sub && trip.todos.length) {
          const t = trip.todos[trip.todos.length - 1];
          t.detail = t.detail ? `${t.detail}\n${sub[1]}` : sub[1];
        }
      }
    } else if (h.startsWith('Budget')) {
      const tables: string[][] = [[]];
      for (const l of sec.body) {
        if (l.startsWith('|')) tables[tables.length - 1].push(l);
        else if (tables[tables.length - 1].length) tables.push([]);
      }
      const [rows, totals] = tables.filter((t) => t.length);
      trip.budget = parseTable(rows).map(([category, item, group, perPerson, note]) =>
        ({ category, item, group, perPerson, note }));
      trip.budgetTotals = parseTable(totals ?? []).map(([category, perPerson]) =>
        ({ category: plain(category), perPerson: plain(perPerson) }));
    }
  }
  return trip;
}

let cached: Trip | null = null;
/** The itinerary agent's plan when there is one (unless TRIP_SOURCE=trek), else the TREK export. */
export function getTrip(): Trip {
  if (!cached) {
    const itin = resolve(process.cwd(), 'data/itinerary.json');
    if (existsSync(itin) && process.env.TRIP_SOURCE !== 'trek') {
      cached = itineraryToTrip(JSON.parse(readFileSync(itin, 'utf8')) as Itinerary);
    } else {
      cached = parsePlan(readFileSync(resolve(process.cwd(), 'data/japan-plan-c.md'), 'utf8'));
    }
  }
  return cached;
}
