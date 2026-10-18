// Enriches the parsed TREK export with what the site needs: a stamp per day,
// corrections for known export quirks, booking-state marks, and sunset times.
import { getTrip, type Day, type Stay, type Stop, type Todo, type Trip } from './plan';
import { jstClock, sunTimes } from './sun';

/** Stamp per day: one kanji in the JR East crest tradition + the place on its rim. */
const STAMPS: Record<number, { kanji: string; reading: string; place: string }> = {
  1: { kanji: '発', reading: 'hatsu · depart', place: 'DEPARTURE DAY' },
  2: { kanji: '着', reading: 'chaku · arrive', place: 'HANEDA · SHINJUKU' },
  3: { kanji: '渋', reading: 'Shibuya', place: 'SHIBUYA · HARAJUKU' },
  4: { kanji: '浅', reading: 'Asakusa', place: 'TSUKIJI · ASAKUSA' },
  5: { kanji: '豊', reading: 'Toyosu', place: 'TOYOSU · ODAIBA' },
  6: { kanji: '箱', reading: 'Hakone', place: 'HAKONE' },
  7: { kanji: '芦', reading: 'Ashi · Lake Ashi', place: 'LAKE ASHI · ŌWAKUDANI' },
  8: { kanji: '阪', reading: 'Osaka', place: 'TŌ-JI · OSAKA' },
  9: { kanji: '京', reading: 'Kyoto', place: 'KYOTO · UMEDA · GION' },
  10: { kanji: '広', reading: 'Hiroshima', place: 'HIROSHIMA · MIYAJIMA' },
  11: { kanji: '聖', reading: 'sei · holy night', place: 'UNIVERSAL STUDIOS' },
  12: { kanji: '鹿', reading: 'shika · deer', place: 'NARA · OSAKA' },
  13: { kanji: '船', reading: 'fune · boat', place: 'KIZU · YAKATABUNE' },
  14: { kanji: '籠', reading: 'kago · basket(ball)', place: 'SHIMOKITA · KŌENJI' },
  15: { kanji: '塔', reading: 'tō · tower', place: 'GINZA · TOKYO TOWER' },
  16: { kanji: '帰', reading: 'kaeru · go home', place: 'HANEDA · HOME' },
};

/** Which booking/check to-do belongs to which stop (matched on stop names). */
const TODO_LINKS: [RegExp, RegExp][] = [
  [/Matsusakagyu/, /Matsusakagyu/],
  [/Kunimitsu/, /Kunimitsu/],
  [/Gonpachi/, /Gonpachi/],
  [/teamLab/, /teamLab/],
  [/Genpin/, /Genpin/],
  [/Robin/, /Robin/],
  [/Chanko Kirishima/, /Chanko Kirishima/],
  [/Harumiya/, /Harumiya/],
  [/USJ/, /Universal Studios Japan/],
  [/Santa Parade/, /Santa Parade/],
  [/KFC/, /^KFC/],
  [/Torien/, /Torien/],
  [/B\.LEAGUE/, /B\.LEAGUE/],
  [/NOAH/, /Korakuen/],
  [/Uoshin/, /Uoshin/],
  [/Heian Shrine NAKED/, /Shirakawa/],
  [/Romancecar/, /^Romancecar/],
  [/JIROKICHI/, /jazz kissa/],
  [/Odaiba Rainbow Fireworks/, /Harumiya/],
  [/Hikari Odawara/, /Hikari Odawara/],
  [/Kansai-Hiroshima/, /Nozomi Shin-Osaka → Hiroshima/],
  [/Blue Cave/, /Blue Cave/],
  [/smartEX/, /Nozomi Shin-Osaka → Tokyo/],
  [/pirate-ship/, /Sightseeing Cruise/],
  [/Shibuya Sky/, /SHIBUYA SKY/],
  [/Manekineko Shibuya/, /Karaoke Manekineko \(Shibuya\)/],
  [/Arashio/, /Arashio/],
  [/Freepass/, /Odakyu Sightseeing/],
];

/** Plan text that marks a fact as not yet confirmed. */
const UNCONFIRMED = /\bTBA\b|not announced|isn't published|not yet announced|— confirm\b|lineup posts/i;

export type Mark = 'confirmed' | 'tobook' | 'tocheck' | 'unconfirmed' | null;

export interface TodoX extends Todo { id: string; kind: 'book' | 'check' | 'task'; stops: string[] }
export interface StopX extends Stop { mark: Mark; todoId: string | null; dayDate: string }
export interface DayX extends Omit<Day, 'stops'> {
  stamp: { kanji: string; reading: string; place: string };
  stops: StopX[];
  base: Stay | null;
  sun: { sunrise: string; sunset: string; sunriseMs: number; sunsetMs: number; where: string; lat: number; lng: number } | null;
  firstStart: string | null;
  lastEnd: string | null;
}
export interface TripX extends Omit<Trip, 'days' | 'todos'> { days: DayX[]; todos: TodoX[] }

function corrections(trip: Trip) {
  for (const day of trip.days) {
    for (const stop of day.stops) {
      // TREK repeats the arrival notes on the Dec 29 Haneda stop; split arrival/departure.
      if (/^Haneda Airport Terminal 3/.test(stop.name)) {
        const departure = stop.details.filter((d) => /^Departure/.test(d.label ?? ''));
        if (day.n === 16) {
          stop.name = 'Haneda Airport Terminal 3 (Departure)';
          stop.summary = 'Fly 17:20 from Terminal 3.';
          stop.details = departure.map((d) => ({ label: null, text: d.text }));
        } else {
          stop.details = stop.details.filter((d) => !/^Departure/.test(d.label ?? ''));
        }
      }
      // Category typos in the export.
      if (/^Gyoza Center/.test(stop.name)) { stop.category = 'restaurant'; stop.categoryLabel = 'Restaurant'; }
      if (/^Isetan Shinjuku Men's/.test(stop.name)) { stop.category = 'shopping'; stop.categoryLabel = 'Shopping'; }
      // Reverse-geocoded address points at Chiyoda; the venue (and its pin) is in Toyosu.
      if (/^teamLab Planets/.test(stop.name)) stop.address = '6-1-16 Toyosu, Kōtō City, Tokyo 135-0061';
    }
  }
}

function todoKind(text: string): TodoX['kind'] {
  if (/^(Book|BUY|Buy|Reserve|Register)\b/.test(text)) return 'book';
  if (/^(Check|Confirm|Night before)/i.test(text)) return 'check';
  return 'task';
}

const AREA: [RegExp, string][] = [
  [/Hakone|Sengokuhara|Ōwakudani|Ashi|Yunessun|Amazake|Gōra|Gyoza Center|Odawara/i, 'Hakone'],
  [/Kyoto|Gion|Pontochō|Kiyomizu|Inari|Nishiki|Yasaka|Kiyamachi|Tō-ji|Shirakawa|Sannenzaka/i, 'Kyoto'],
  [/Hiroshima|Miyajima|Itsukushima|Hassho|Dreamination|Dome/i, 'Hiroshima'],
  [/Nara|Tōdai-ji|Kasuga|Nakatanidō/i, 'Nara'],
];
function areaOf(stop: Stop) {
  if (stop.lng != null && stop.lng < 136.2 && stop.lng > 135.3) {
    if (stop.lat! > 34.9) return 'Kyoto';
    if (stop.lng > 135.75) return 'Nara';
    return 'Osaka';
  }
  if (stop.lng != null && stop.lng < 133) return 'Hiroshima';
  for (const [re, name] of AREA) if (re.test(stop.name)) return name;
  if (stop.lng != null && stop.lng < 139.3) return 'Hakone';
  return 'Tokyo';
}

let cached: TripX | null = null;

export function trip(): TripX {
  if (cached) return cached;
  const raw = structuredClone(getTrip());
  corrections(raw);

  const todos: TodoX[] = raw.todos.map((t, i) => ({ ...t, id: `todo-${String(i + 1).padStart(2, '0')}`, kind: todoKind(t.text), stops: [] }));
  const allStops = raw.days.flatMap((d) => d.stops);
  const stopTodo = new Map<string, TodoX>();
  for (const [ti, todo] of todos.entries()) {
    // The itinerary agent links its to-dos to stops itself; the TREK export is matched by name.
    const linked = raw.todos[ti].stops;
    const link = linked ? null : TODO_LINKS.find(([re]) => re.test(todo.text));
    if (!linked && !link) continue;
    for (const s of allStops.filter((s) => (linked ? linked.includes(s.id) : link![1].test(s.name)))) {
      todo.stops.push(s.id);
      // A booking outranks a check when both point at one stop (e.g. Harumiya).
      const prev = stopTodo.get(s.id);
      if (!prev || (prev.kind !== 'book' && todo.kind === 'book')) stopTodo.set(s.id, todo);
    }
  }

  const days: DayX[] = raw.days.map((day) => {
    const noonISO = `${day.date}T12:00:00+09:00`;
    const base = raw.stays.find((s) => s.checkInISO <= `${day.date}T23:59:00+09:00` && s.checkOutISO > noonISO)
      ?? raw.stays.find((s) => s.checkOutISO.slice(0, 10) === day.date) ?? null;
    const stops: StopX[] = day.stops.map((s) => {
      const todo = stopTodo.get(s.id) ?? null;
      const text = [s.summary, s.plan, ...s.details.map((d) => d.text)].join(' ');
      let mark: Mark = null;
      if (s.category === 'stay') mark = 'confirmed';
      else if (todo?.kind === 'book') mark = 'tobook';
      else if (UNCONFIRMED.test(text)) mark = 'unconfirmed';
      else if (todo?.kind === 'check') mark = 'tocheck';
      return { ...s, mark, todoId: todo?.id ?? null, dayDate: day.date };
    });
    // Sunset where the group is around 16:30.
    const located = stops.filter((s) => s.lat != null);
    const dusk = located.filter((s) => s.start <= '16:30' && s.startISO.startsWith(day.date)).at(-1) ?? located[0];
    return {
      ...day,
      stamp: day.stamp ?? STAMPS[day.n] ?? { kanji: '旅', reading: 'tabi · journey', place: day.title.toUpperCase().slice(0, 24) },
      stops,
      base,
      sun: dusk ? (() => {
        const t = sunTimes(day.date, dusk.lat!, dusk.lng!);
        return { sunrise: jstClock(t.sunrise), sunset: jstClock(t.sunset), sunriseMs: t.sunrise, sunsetMs: t.sunset,
          where: areaOf(dusk), lat: dusk.lat!, lng: dusk.lng! };
      })() : null,
      firstStart: stops[0]?.startISO ?? null,
      lastEnd: stops.at(-1)?.endISO ?? null,
    };
  });

  cached = { ...raw, days, todos };
  return cached;
}

export const stampFor = (n: number) => STAMPS[n];
