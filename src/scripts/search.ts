// Search. Ported from TREK (trip places → TREK Places index) and then taken further:
//   · it answers from the phone first: your plan, the stations, and the place pack (every ramen
//     shop, konbini, toilet and coin locker within a walk of every stop, with opening hours) are
//     searched in memory on every keystroke, so results appear as you type, with no signal too;
//   · the network then adds to them as each source answers, never waiting for the slowest: the
//     TREK Places index (Overture + its OpenStreetMap layer) and Photon for names; TREK nearby,
//     then Overpass as a last resort, for categories outside the pack;
//   · it reads the query: "ramen near stop 5 open now", "late night izakaya near Shinjuku",
//     "toilets between stop 3 and 4", "coffee along route", "7-eleven near me" (EN or JA);
//   · names match the way they're typed: Tōkyō = tokyo = toukyou, カフェ = かふぇ, one typo forgiven;
//   · each result says whether it's open, and on a day page where it fits your free time;
//   · recent searches, voice input, "/" or ⌘K to search, "Search this area" after panning,
//     and quick add to the right day.
import { addTrend, isAdded, walkMin } from './adds';
import { openCentre, routeCoords, stageApi } from './map/stage';
import { hoursAt, parseHours } from '../lib/hours';
import { CAT, CATS, covers, overpassQL, catsOfTrek, type Cat } from '../lib/categories';
import { parseQuery, MOD_LABEL, type Mod, type Parsed } from '../lib/query';
import { fold, keys, scorer, highlight, type Keys } from '../lib/textmatch';
import { FLAG, covered, packQuery, prefetch, type PackPlace } from './places';
import type { ClientTrend, ClientTrip } from '../lib/client';

const TREK = 'https://places.liketrek.com';
const PHOTON = 'https://photon.komoot.io/api/';
// One mirror at a time, as the Overpass operators ask; the next only when one fails.
const OVERPASS = ['https://overpass-api.de/api/interpreter', 'https://overpass.private.coffee/api/interpreter'];
const HOTPEPPER = import.meta.env.PUBLIC_HOTPEPPER_KEY as string | undefined;
const base = import.meta.env.BASE_URL.replace(/\/$/, '');
const trip: ClientTrip = JSON.parse(document.getElementById('trip-data')!.textContent!);
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));
type At = { lat: number; lng: number };
const km = (a: At, b: At) => {
  const r = Math.PI / 180, dLat = (b.lat - a.lat) * r, dLng = (b.lng - a.lng) * r;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(dLng / 2) ** 2;
  return 12742 * Math.asin(Math.sqrt(h));
};
const nowMs = () => {
  const o = new URLSearchParams(location.search).get('now');
  const t = o ? Date.parse(/[+Z]/.test(o.slice(10)) ? o : `${o}${o.length <= 16 ? ':00' : ''}+09:00`) : NaN;
  return Number.isFinite(t) ? t : Date.now();
};
const timeout = <T>(p: Promise<T>, ms: number) => Promise.race([p, new Promise<T>((_, rej) => setTimeout(() => rej(new Error('timeout')), ms))]);

// ── Network, with a memory: the same question near the same spot is answered from cache ──
const memo = new Map<string, Promise<unknown>>();
function getJSON<T>(url: string, signal: AbortSignal, ms: number): Promise<T> {
  let p = memo.get(url) as Promise<T> | undefined;
  if (!p) {
    // Not tied to this search's signal: a fetch that's mid-flight when you type on is kept for the next keystroke.
    p = timeout(fetch(url, { headers: { Accept: 'application/json' } }).then((r) => { if (!r.ok) throw new Error(String(r.status)); return r.json() as Promise<T>; }), ms);
    p.catch(() => memo.delete(url));
    memo.set(url, p);
    if (memo.size > 150) memo.delete(memo.keys().next().value!);
  }
  return new Promise<T>((res, rej) => {
    if (signal.aborted) return rej(new DOMException('aborted', 'AbortError'));
    signal.addEventListener('abort', () => rej(new DOMException('aborted', 'AbortError')), { once: true });
    p!.then(res, rej);
  });
}
// Stop asking a source that isn't answering (TREK does the same): a few failures, then a minute off.
const breaker: Record<string, { fails: number; until: number }> = {};
const up = (k: string) => (breaker[k]?.until ?? 0) < Date.now();
function track<T>(k: string, p: Promise<T>): Promise<T> {
  return p.then((v) => { breaker[k] = { fails: 0, until: 0 }; return v; }, (e) => {
    if ((e as Error).name !== 'AbortError') {
      const b = (breaker[k] ??= { fails: 0, until: 0 });
      if (++b.fails >= 3) { b.until = Date.now() + 60000; b.fails = 2; }
    }
    throw e;
  });
}
const r4 = (x: number) => x.toFixed(3); // ~100 m: nearby searches share a cache entry

// ── Places from every source, in one shape ──
export interface Place {
  id: string; name: string; ja?: string | null; lat: number; lng: number; kind: string; detail: string; cats: string[];
  source: 'plan' | 'pack' | 'trek' | 'osm' | 'hotpepper'; sources: Set<string>; keys: Keys;
  website?: string | null; phone?: string | null; photo?: string | null; hours?: string | null; cuisine?: string | null;
  flags: number; wikidata?: string | null; notable: number; stopId?: string; day?: number; note?: string; score?: number; dist?: number; match?: number;
}
const label = (k: string) => CAT[k]?.label ?? k.replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase());
const SRC = { o: ['OpenStreetMap'], t: ['TREK Places'], ot: ['OpenStreetMap', 'TREK Places'] } as const;
const JA = /[\u3040-\u30ff\u4e00-\u9fff]/;
// Some OSM names carry other languages too ("Храм Сенсодзи 金龍山 浅草寺"): keep the Japanese and Latin.
const clean = (s: string) => s.replace(/\s*[\u0400-\u04ff][\u0400-\u04ff\s]*/g, ' ').trim() || s;
function fromPack(p: PackPlace): Place {
  const found = p.alt.find((a) => JA.test(a) && a !== p.name);
  const ja = found ? clean(found) : null;
  return {
    id: p.id, name: p.name, ja, lat: p.lat, lng: p.lng, kind: p.cats[0] ?? p.kind, detail: '', cats: p.cats, source: 'pack', sources: new Set(SRC[p.src]),
    keys: p.keys, website: p.website, hours: p.hours, cuisine: p.cuisine, flags: p.flags, wikidata: p.wikidata,
    notable: (p.wikidata ? 0.5 : 0) + (p.website ? 0.08 : 0) + (p.hours ? 0.08 : 0) + (p.src === 'ot' ? 0.12 : 0),
  };
}
type TrekHit = {
  gers?: string; id?: string; source?: string; name: string; local_name?: string | null; lat: number; lng: number; category?: string | null; confidence?: number | null;
  brand?: { name?: string | null; wikidata?: string | null } | null; address?: { freeform?: string | null; locality?: string | null } | null; locality?: string | null;
  contact?: { website?: string | null; phone?: string | null } | null; hours?: { osm?: string } | null;
};
function fromTrek(h: TrekHit): Place {
  const osmLayer = h.source === 'openstreetmap';
  const id = osmLayer ? `osm:${(h.id ?? '').replace(/^osm:/, '').replace('/', ':')}` : `trek:${h.gers}`;
  const cats = osmLayer ? [] : catsOfTrek(h.category, h.name);
  const ja = h.local_name && h.local_name !== h.name && JA.test(h.local_name) && !/[\u0400-\u04ff]/.test(h.local_name) ? h.local_name : null;
  return {
    id, name: h.name, ja, lat: h.lat, lng: h.lng, kind: cats[0] ?? (osmLayer ? 'place' : h.category ?? 'place'), cats,
    detail: [h.address?.freeform, h.address?.locality ?? h.locality].filter(Boolean).join(', '), source: osmLayer ? 'osm' : 'trek',
    sources: new Set([osmLayer ? 'OpenStreetMap' : 'TREK Places']), keys: keys(h.name, ja, h.brand?.name),
    website: h.contact?.website ?? null, phone: h.contact?.phone ?? null, hours: h.hours?.osm ?? null, flags: 0, wikidata: h.brand?.wikidata ?? null,
    notable: osmLayer ? 0.3 : (h.brand?.name ? 0.15 : 0) + (h.confidence ?? 0.5) * 0.25,
  };
}
const trekSearch = (q: string, at: At, signal: AbortSignal, limit = 12) => track('trek', getJSON<{ results?: TrekHit[] }>(
  `${TREK}/v1/search?q=${encodeURIComponent(q)}&lat=${r4(at.lat)}&lng=${r4(at.lng)}&limit=${limit}&lang=en&sources=index,osm`, signal, 4000,
)).then((j) => (j.results ?? []).filter((h) => Number.isFinite(h.lat) && h.name).map(fromTrek));
const trekNearby = (category: string, at: At, radius: number, signal: AbortSignal) => track('trek', getJSON<{ results?: TrekHit[] }>(
  `${TREK}/v1/nearby?lat=${r4(at.lat)}&lng=${r4(at.lng)}&radius=${radius}&limit=40&category=${category}&lang=en`, signal, 4000,
)).then((j) => (j.results ?? []).map(fromTrek));
type PhotonF = { geometry: { coordinates: [number, number] }; properties: { osm_type: string; osm_id: number; name?: string; osm_key?: string; osm_value?: string; city?: string; district?: string; locality?: string; street?: string } };
const PHOTON_SKIP = /^(bus_stop|traffic_signals|bicycle_rental|emergency|assembly_point|kindergarten|parking|entrance|vending_machine)$/;
const photon = (q: string, at: At, signal: AbortSignal) => track('photon', getJSON<{ features: PhotonF[] }>(
  `${PHOTON}?q=${encodeURIComponent(q)}&lat=${r4(at.lat)}&lon=${r4(at.lng)}&limit=8&lang=en`, signal, 4000,
)).then((j) => j.features.filter((f) => f.properties.name && !PHOTON_SKIP.test(f.properties.osm_value ?? '')).map((f): Place => {
  const pr = f.properties;
  const t = { N: 'node', W: 'way', R: 'relation' }[pr.osm_type] ?? pr.osm_type;
  return {
    id: `osm:${t}:${pr.osm_id}`, name: clean(pr.name!), lat: f.geometry.coordinates[1], lng: f.geometry.coordinates[0], kind: pr.osm_value ?? 'place', cats: [],
    detail: [pr.district ?? pr.locality, pr.city].filter(Boolean).join(', '), source: 'osm', sources: new Set(['OpenStreetMap']), keys: keys(pr.name),
    flags: 0, notable: /^(attraction|tower|viewpoint|museum|castle|temple|shrine|place_of_worship|theme_park|station)$/.test(pr.osm_value ?? '') ? 0.6 : 0.25,
  };
}));
type OsmEl = { type: string; id: number; lat?: number; lon?: number; center?: { lat: number; lon: number }; tags?: Record<string, string> };
async function overpass(sels: string[], where: string, signal: AbortSignal): Promise<Place[]> {
  const q = overpassQL(sels, where, 60, 10);
  let last: unknown;
  for (const [i, u] of OVERPASS.entries()) {
    if (!up(u)) continue;
    try {
      const r = await track(u, timeout(fetch(u, { method: 'POST', body: new URLSearchParams({ data: q }), signal }), i ? 4000 : 6000));
      if (!r.ok) throw new Error(String(r.status));
      return ((await r.json()).elements as OsmEl[]).filter((e) => e.lat ?? e.center).map((e) => {
        const t = e.tags ?? {};
        const name = t['name:en'] || t.name || '';
        return {
          id: `osm:${e.type}:${e.id}`, name: name || label(CATS.find((c) => c.osm?.some((s) => sels.includes(s)))?.key ?? 'place').replace(/s$/, ''),
          ja: t.name && t.name !== name ? t.name : null, lat: e.lat ?? e.center!.lat, lng: e.lon ?? e.center!.lon, kind: t.cuisine?.split(';')[0] ?? t.amenity ?? t.shop ?? 'place',
          cats: [], detail: '', source: 'osm' as const, sources: new Set(['OpenStreetMap']), keys: keys(name, t.name), hours: t.opening_hours ?? null, cuisine: t.cuisine ?? null,
          flags: (t['payment:credit_cards'] === 'yes' ? FLAG.card : 0) | (t.wheelchair === 'yes' ? FLAG.wheelchair : 0) | (t.fee === 'no' ? FLAG.free : 0),
          wikidata: t.wikidata ?? null, notable: t.wikidata ? 0.5 : 0, website: t.website ?? null,
        };
      });
    } catch (e) { if ((e as Error).name === 'AbortError') throw e; last = e; }
  }
  throw last ?? new Error('Overpass unavailable');
}
type HpShop = { id: string; name: string; lat: number; lng: number; genre?: { name: string }; budget?: { average?: string }; urls?: { pc?: string }; photo?: { pc?: { m?: string } }; party_capacity?: number | string; catch?: string; card?: string; non_smoking?: string };
function hotpepper(at: At): Promise<Place[]> {
  return new Promise((resolve, reject) => {
    const cb = `hp${Date.now()}`;
    const s = document.createElement('script');
    const w = window as unknown as Record<string, unknown>;
    w[cb] = (j: { results: { shop?: HpShop[] } }) => {
      delete w[cb]; s.remove();
      resolve((j.results.shop ?? []).map((sh) => ({
        id: `hp:${sh.id}`, name: sh.name, lat: +sh.lat, lng: +sh.lng, kind: 'izakaya', cats: ['food', 'izakaya'], source: 'hotpepper' as const, sources: new Set(['Hot Pepper']), keys: keys(sh.name),
        detail: [sh.genre?.name, sh.party_capacity ? `seats ${sh.party_capacity}` : null, sh.budget?.average].filter(Boolean).join(' · '),
        website: sh.urls?.pc ?? null, photo: sh.photo?.pc?.m ?? null, note: sh.catch, flags: (sh.card === '利用可' ? FLAG.card : 0) | (/禁煙/.test(sh.non_smoking ?? '') ? FLAG.nosmoking : 0), notable: 0.4,
      })));
    };
    s.src = `https://webservice.recruit.co.jp/hotpepper/gourmet/v1/?key=${HOTPEPPER}&lat=${at.lat}&lng=${at.lng}&range=3&party_capacity=8&count=30&format=jsonp&callback=${cb}`;
    s.onerror = () => { delete w[cb]; s.remove(); reject(new Error('Hot Pepper unavailable')); };
    document.head.append(s);
  });
}

// ── Your own trip: stops, picks and trends, stations ──
let planCache: Place[] | null = null;
function plan(): Place[] {
  if (planCache) return planCache;
  const out: Place[] = [];
  for (const st of trip.stops) {
    if (st.lat == null || st.lng == null) continue;
    const short = st.name.split(' — ')[0];
    out.push({ id: st.id, name: st.name, lat: st.lat, lng: st.lng, kind: 'stop', cats: [], detail: `Day ${st.d} · ${st.start} · stop ${st.i}`, source: 'plan', sources: new Set(['Your plan']), keys: keys(st.name, short, short.replace(/\s*\(.*\)$/, '')), stopId: st.id, day: st.d, flags: 0, notable: 1.6 });
  }
  for (const [d, items] of Object.entries(trip.trending ?? {})) for (const t of items) {
    out.push({ id: t.id, name: t.name, ja: t.ja, lat: t.lat, lng: t.lng, kind: t.tag === 'pick' ? 'pick' : 'trend', cats: [], detail: `Day ${d} · ${t.tag === 'pick' ? 'researched pick' : 'trending nearby'}`, source: 'plan', sources: new Set(['Your plan']), keys: keys(t.name, t.ja), day: +d, photo: t.photo, flags: 0, notable: 1 });
  }
  return (planCache = out);
}
let stationCache: Place[] | null = null;
const stations = () => (stationCache?.length ? stationCache : (stationCache = stageApi().stations.map((st) => ({
  id: `stn:${st.name}`, name: `${st.name} Station`, ja: `${st.ja}駅`, lat: st.lat, lng: st.lng, kind: 'station', cats: [], detail: st.ja, source: 'osm' as const,
  sources: new Set(['OpenStreetMap']), keys: keys(st.name, `${st.name} station`, st.ja, `${st.ja}駅`), flags: 0, notable: 0.7,
}))));

// ── Where: the query's place, resolved against the map ──
type Scope = { kind: 'point'; at: At; label: string } | { kind: 'route'; line: [number, number][]; label: string };
type ScopeMode = 'map' | 'route' | 'me';
// The day page you're on: from the map once it has flown there, from the address before that.
const viewDay = () => {
  const v = stageApi().view;
  if (v.kind === 'day') return v.day;
  const m = location.pathname.match(/\/day\/(\d+)\/?$/);
  return m ? +m[1] : 0;
};
/** The day on screen; else, during the trip, today. */
function currentDay(): number {
  const d = viewDay();
  if (d) return d;
  const today = new Date(nowMs() + 9 * 3600e3).toISOString().slice(0, 10);
  return trip.days.find((x) => x.date === today)?.n ?? 0;
}
let userAt: At | null = null;
function locate(): Promise<At | null> {
  if (userAt) return Promise.resolve(userAt);
  if (!navigator.geolocation) return Promise.resolve(null);
  return new Promise((res) => navigator.geolocation.getCurrentPosition(
    (p) => res((userAt = { lat: p.coords.latitude, lng: p.coords.longitude })), () => res(null), { enableHighAccuracy: true, timeout: 8000, maximumAge: 120000 },
  ));
}
const mapCentre = () => openCentre() ?? { lat: 35.68, lng: 139.76 };
const zoomedOut = () => (stageApi().map?.getZoom() ?? 14) < 11;
/** Where to lean a name search: the map when it shows a town, else the day's stops, else Tokyo. */
function bias(): At {
  if (!zoomedOut()) return mapCentre();
  const st = trip.stops.filter((s) => s.d === currentDay() && s.lat != null);
  if (st.length) return { lat: st.reduce((a, s) => a + s.lat!, 0) / st.length, lng: st.reduce((a, s) => a + s.lng!, 0) / st.length };
  return { lat: 35.68, lng: 139.76 };
}
async function defaultScope(mode: ScopeMode): Promise<Scope> {
  const day = currentDay();
  if (mode === 'me') { const me = await locate(); if (me) return { kind: 'point', at: me, label: 'near you' }; }
  // "Around the map" means nothing at country zoom; on a day, that day's stops are what's meant.
  if (day && (mode === 'route' || zoomedOut())) return { kind: 'route', line: routeCoords(day), label: `along Day ${day}'s route` };
  return { kind: 'point', at: mapCentre(), label: 'around the map' };
}
/** A named place: your plan and the stations first (instant), then the pack, then the index. */
async function resolvePlace(name: string, signal: AbortSignal, net: boolean): Promise<{ at: At; label: string } | null> {
  const s = scorer(name);
  let best: { p: Place; m: number } | null = null;
  for (const p of [...plan(), ...stations()]) { const m = s(p.keys) + (p.kind === 'station' ? 0.05 : 0); if (m >= 0.8 && (!best || m > best.m)) best = { p, m }; }
  if (best) return { at: best.p, label: best.p.name.split(' — ')[0] };
  const strict = scorer(name, false);
  const pack = await packQuery([bias()], Infinity, (p) => strict(p.keys) >= 0.9, 40).catch(() => []);
  for (const p of pack) { const m = strict(p.keys); if (!best || m > best.m) best = { p: fromPack(p), m }; }
  if (best) return { at: best.p, label: best.p.name };
  if (!net) return null;
  const hit = await Promise.any([trekSearch(name, bias(), signal, 6), photon(name, bias(), signal)].map((p) => p.then((l) => {
    const hit = l.map((x) => ({ x, m: s(x.keys) })).filter((h) => h.m >= 0.7).sort((a, b) => b.m - a.m)[0];
    if (!hit) throw new Error('no match');
    return hit.x;
  }))).catch(() => null);
  return hit ? { at: hit, label: hit.name } : null;
}
interface Intent extends Parsed { scope: Scope; explicitScope: boolean; problem?: string }
async function resolve(q: string, mode: ScopeMode, signal: AbortSignal, net: boolean): Promise<Intent> {
  const p = parseQuery(q);
  const w = p.where;
  const day = (w && 'day' in w && w.day) || currentDay();
  const stopOf = (i: number) => trip.stops.find((s) => s.d === day && s.i === i && s.lat != null);
  let scope: Scope | null = null;
  let problem: string | undefined;
  if (w?.kind === 'stop') {
    const st = day ? stopOf(w.i) : undefined;
    if (st) scope = { kind: 'point', at: { lat: st.lat!, lng: st.lng! }, label: `near stop ${st.i} · ${st.name.split(' — ')[0]}` };
    else problem = day ? `Day ${day} has no stop ${w.i}` : `Open a day first, or say which: “stop ${w.i} day 3”`;
  } else if (w?.kind === 'between') {
    const a = day ? stopOf(w.a) : undefined, b = day ? stopOf(w.b) : undefined;
    if (a && b) scope = { kind: 'route', line: routeCoords(day, a.id, b.id), label: `between stop ${a.i} and ${b.i}` };
    else problem = day ? `Day ${day} has no stop ${!a ? w.a : w.b}` : 'Open a day first, so I know which stops';
  } else if (w?.kind === 'route') {
    if (day) scope = { kind: 'route', line: routeCoords(day), label: `along Day ${day}'s route` };
    else problem = 'Open a day to search along its route';
  } else if (w?.kind === 'me') {
    const me = await locate();
    if (me) scope = { kind: 'point', at: me, label: 'near you' };
    else problem = 'Location is off, so this searches around the map instead';
  } else if (w?.kind === 'place') {
    const hit = await resolvePlace(w.name, signal, net);
    if (hit) scope = { kind: 'point', at: hit.at, label: `near ${hit.label}` };
    else { p.text = [p.text, w.name].filter(Boolean).join(' '); } // "Ichiran in…" with nothing after it: just a name
  }
  return { ...p, scope: scope ?? (await defaultScope(mode)), explicitScope: !!scope, problem };
}

// ── Fuse, filter, rank ──
/** Every ~stepKm along a line. */
function thin(line: [number, number][], stepKm: number): [number, number][] {
  if (line.length < 2) return line;
  const out: [number, number][] = [line[0]];
  let acc = 0;
  for (let i = 1; i < line.length; i++) {
    acc += km({ lat: line[i - 1][1], lng: line[i - 1][0] }, { lat: line[i][1], lng: line[i][0] });
    if (acc >= stepKm) { out.push(line[i]); acc = 0; }
  }
  if (out.at(-1) !== line.at(-1)) out.push(line.at(-1)!);
  return out.slice(0, 160);
}
const pointsOf = (s: Scope, step = 0.12): At[] => (s.kind === 'point' ? [s.at] : thin(s.line, step).map(([x, y]) => ({ lat: y, lng: x })));
function distTo(p: At, pts: At[]): number {
  let best = Infinity;
  for (const q of pts) { const d = km(p, q); if (d < best) best = d; }
  return best;
}
// Twins share a name, never just an address: a Tokyo building stacks a dozen shops within metres.
const sameName = (a: Place, b: Place) => {
  const x = fold(a.name), y = fold(b.name);
  if (x === y) return true;
  const short = Math.min(x.length, y.length);
  return (short >= 4 && (x.includes(y) || y.includes(x))) || (!!a.ja && fold(a.ja) === y) || (!!b.ja && fold(b.ja) === x) || (!!a.ja && !!b.ja && fold(a.ja) === fold(b.ja));
};
// Twins are looked for only in the ~100 m grid cells around a place, so merging a day's pack is linear.
const grids = new WeakMap<Map<string, Place>, Map<string, Place[]>>();
const cell = (lat: number, lng: number) => `${Math.floor(lat * 1000)},${Math.floor(lng * 800)}`;
function mergeInto(pool: Map<string, Place>, list: Place[]) {
  let grid = grids.get(pool);
  if (!grid) grids.set(pool, (grid = new Map()));
  const g = grid;
  const around = (p: Place) => {
    const a = Math.floor(p.lat * 1000), b = Math.floor(p.lng * 800), out: Place[] = [];
    for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) { const c = g.get(`${a + i},${b + j}`); if (c) out.push(...c); }
    return out;
  };
  for (const p of list) {
    const twin = pool.get(p.id) ?? around(p).find((o) => km(o, p) < 0.08 && sameName(o, p));
    if (!twin) {
      const c = { ...p, sources: new Set(p.sources) };
      pool.set(p.id, c);
      const k = cell(c.lat, c.lng);
      const arr = g.get(k);
      if (arr) arr.push(c); else g.set(k, [c]);
      continue;
    }
    for (const k of ['website', 'phone', 'photo', 'hours', 'cuisine', 'wikidata', 'ja', 'note'] as const) if (!twin[k] && p[k]) (twin as unknown as Record<string, unknown>)[k] = p[k];
    if (!twin.detail && p.detail) twin.detail = p.detail;
    twin.flags |= p.flags;
    for (const c of p.cats) if (!twin.cats.includes(c)) twin.cats.push(c);
    const before = twin.sources.size;
    p.sources.forEach((s) => twin.sources.add(s));
    if (twin.sources.size > before) twin.notable = Math.max(twin.notable, p.notable) + 0.12; // confirmed by another source
    twin.keys = { whole: [...new Set([...twin.keys.whole, ...p.keys.whole])], words: [...new Set([...twin.keys.words, ...p.keys.words])] };
    if (p.source === 'plan') Object.assign(twin, { id: p.id, name: p.name, kind: p.kind, stopId: p.stopId, day: p.day, source: 'plan', detail: p.detail, notable: p.notable });
  }
}
const hoursMemo = new Map<string, ReturnType<typeof parseHours>>();
const hoursOf = (s: string | null | undefined) => {
  if (!s) return null;
  let h = hoursMemo.get(s);
  if (h === undefined) { h = parseHours(s); hoursMemo.set(s, h); }
  return h;
};
const lateAt = (ms: number) => { const d = new Date(ms + 9 * 3600e3); d.setUTCHours(23, 0, 0, 0); return d.getTime() - 9 * 3600e3; };
const MOD_FLAG: Partial<Record<Mod, number>> = { vegetarian: FLAG.vegetarian, halal: FLAG.halal, wheelchair: FLAG.wheelchair, card: FLAG.card, nosmoking: FLAG.nosmoking };
interface Ctx { intent: Intent; pts: At[]; radiusKm: number; nameSearch: boolean; at: number }
function rank(pool: Iterable<Place>, c: Ctx): Place[] {
  const { intent } = c;
  const match = intent.text ? scorer(intent.text) : null;
  const when = intent.mods.includes('late') ? lateAt(c.at) : c.at;
  const wantsOpen = intent.mods.includes('open') || intent.mods.includes('late');
  const need = intent.cats.some((k) => CAT[k]?.need);
  const scale = Math.max(0.25, c.radiusKm * 0.45);
  // A cheap box around the scope first: most of a day's pack is outside it.
  const reach = (c.nameSearch ? 1e4 : c.radiusKm * 1.5) / 111;
  const lat0 = Math.min(...c.pts.map((x) => x.lat)) - reach, lat1 = Math.max(...c.pts.map((x) => x.lat)) + reach;
  const lngR = reach / Math.cos((c.pts[0].lat * Math.PI) / 180);
  const lng0 = Math.min(...c.pts.map((x) => x.lng)) - lngR, lng1 = Math.max(...c.pts.map((x) => x.lng)) + lngR;
  const out: Place[] = [];
  for (const p of pool) {
    if ((p.lat < lat0 || p.lat > lat1 || p.lng < lng0 || p.lng > lng1) && !(p.source === 'plan' && match)) continue;
    const m0 = match && p.source !== 'plan' ? match(p.keys) : -1; // names first: cheaper than distance for a name search
    if (m0 === 0) continue;
    const d = distTo(p, c.pts);
    const far = !c.nameSearch && d > c.radiusKm * (intent.scope.kind === 'route' ? 1 : 1.5);
    if (far && !(p.source === 'plan' && match)) continue;
    const m = m0 >= 0 ? m0 : match ? match(p.keys) : 0;
    if (match && m === 0) continue;
    const inCat = intent.cats.length ? p.cats.some((k) => intent.cats.some((a) => covers(a, k))) : false;
    // A chain asked for by name ("round1") is that chain, whatever category a source filed it under.
    if (intent.cats.length && !inCat && !(match && m >= 0.85 && (p.source === 'plan' || intent.brand))) continue;
    const h = hoursAt(hoursOf(p.hours), when);
    if (wantsOpen && h && !h.open) continue;
    let flagsOk = true;
    for (const mod of intent.mods) { const f = MOD_FLAG[mod]; if (f && !(p.flags & f) && p.source !== 'hotpepper') flagsOk = false; }
    if (!flagsOk) continue;
    if (intent.mods.includes('group') && p.source !== 'hotpepper' && HOTPEPPER) continue;
    const prox = Math.exp(-d / (c.nameSearch ? 3 : scale));
    // A name search is decided by the name, nearness breaking ties; a category search by nearness.
    const score = c.nameSearch
      ? 4 * m * m + 0.8 * prox + p.notable
      : 3 * m + (inCat ? 1 : 0) + (need ? 2.2 : 1.3) * prox + (need ? 0.3 : 1) * p.notable + (h ? (h.open ? (wantsOpen ? 0.6 : 0.2) : -0.4) : 0);
    out.push({ ...p, dist: d, match: m, score });
  }
  return out.sort((a, b) => b.score! - a.score!).slice(0, 25);
}

// ── Schedule fit: the free time on this day where a place slots in ──
function fit(p: Place): string | null {
  const day = viewDay();
  if (!day) return null;
  const list = trip.stops.filter((s) => s.d === day && s.lat != null);
  let best: { text: string; extra: number } | null = null;
  for (let i = 0; i + 1 < list.length; i++) {
    const a = list[i], b = list[i + 1];
    const A = { lat: a.lat!, lng: a.lng! }, B = { lat: b.lat!, lng: b.lng! };
    const gap = (Date.parse(b.s) - Date.parse(a.e)) / 60000;
    const there = walkMin(km(A, p)), back = walkMin(km(p, B)), direct = walkMin(km(A, B));
    const spare = gap - direct;
    const extra = there + back - direct;
    if (there > 20 || back > 25 || spare < 20 || extra + 15 > spare) continue;
    const h = hoursAt(hoursOf(p.hours), Date.parse(a.e) + there * 60000);
    if (h && !h.open) continue;
    if (!best || extra < best.extra) best = { extra, text: `Fits your free time ${a.end}–${b.start} after stop ${a.i} · ${there} min walk there` };
  }
  return best?.text ?? null;
}

// ── Photos: the place's Wikidata image, when it has one ──
const photoCache = new Map<string, string | null>();
async function photoFor(p: Place): Promise<string | null> {
  if (p.photo) return p.photo;
  if (!p.wikidata) return null;
  if (photoCache.has(p.wikidata)) return photoCache.get(p.wikidata)!;
  try {
    const j = await (await fetch(`https://www.wikidata.org/wiki/Special:EntityData/${p.wikidata}.json`)).json();
    const f = j.entities?.[p.wikidata]?.claims?.P18?.[0]?.mainsnak?.datavalue?.value as string | undefined;
    const url = f ? `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(f.replace(/ /g, '_'))}?width=480` : null;
    photoCache.set(p.wikidata, url);
    return url;
  } catch { return null; }
}

// ── Which day a place belongs to (for quick add) ──
type Stop = ClientTrip['stops'][number];
function dayFor(p: Place): { day: number; stop: Stop; km: number } | null {
  const day = viewDay();
  let best: { day: number; stop: Stop; km: number } | null = null;
  for (const s of trip.stops) {
    if (s.lat == null || s.lng == null || (day && s.d !== day)) continue;
    const d = km(p, { lat: s.lat, lng: s.lng });
    if (!best || d < best.km) best = { day: s.d, stop: s, km: d };
  }
  return best;
}
const asTrend = (p: Place, near: { stop: Stop; km: number }): ClientTrend => ({
  id: p.id, name: p.name, ja: p.ja ?? null, kind: p.kind, lat: p.lat, lng: p.lng, near: { stop: near.stop.id, i: near.stop.i, km: +near.km.toFixed(2) },
  views30: 0, rise: 1, december: 1, tag: 'pick', wiki: p.website ?? `https://www.google.com/maps/search/?api=1&query=${p.lat},${p.lng}`, photo: p.photo ?? null, photoPage: null,
});

// ── One search: local answer now, then each network source as it lands ──
/** local: this keystroke, phone only · type: typing paused, network too · full: Enter or a chip, every source. */
type Depth = 'local' | 'type' | 'full';
interface Run { q: string; intent: Intent; ctx: Ctx; pool: Map<string, Place>; pending: number; notes: Set<string>; depth: Depth; settled: boolean; asked?: number }
let current: Run | null = null;

async function search(q: string, mode: ScopeMode, signal: AbortSignal, depth: Depth, onUpdate: (r: Run) => void): Promise<Run> {
  const intent = await resolve(q, mode, signal, depth !== 'local');
  const zoom = stageApi().map?.getZoom() ?? 14;
  const isRoute = intent.scope.kind === 'route';
  const radius = isRoute ? 350 : intent.explicitScope ? 900 : zoom >= 16 ? 500 : zoom >= 14.5 ? 900 : 1600;
  // A name ("tokyo tower") or a chain ("round1") is found wherever it is, nearest first.
  const nameSearch = !!intent.text && !intent.explicitScope && (!intent.cats.length || intent.brand);
  const pts = nameSearch ? [bias()] : pointsOf(intent.scope);
  const ctx: Ctx = { intent, pts, radiusKm: radius / 1000 + 0.15, nameSearch, at: nowMs() };
  const run: Run = { q, intent, ctx, pool: new Map(), pending: 0, notes: new Set(), depth, settled: false };
  if (intent.problem) run.notes.add(intent.problem);
  if (intent.mods.includes('group') && !HOTPEPPER) run.notes.add('Seat counts need a Hot Pepper key (see README), so these aren’t filtered for 8: call ahead or book.');

  // 1. On the phone: plan, stations, pack. Usually all of it, in a few milliseconds.
  mergeInto(run.pool, plan());
  if (intent.text) mergeInto(run.pool, stations());
  const packPts = nameSearch ? pts : pointsOf(intent.scope, 0.6);
  const reachKm = ctx.radiusKm * (isRoute ? 1 : 1.5);
  const inCats = (p: PackPlace) => !intent.cats.length || p.cats.some((k) => intent.cats.some((a) => covers(a, k)));
  const named = (s: (k: Keys) => number) => (p: PackPlace) => inCats(p) && s(p.keys) > 0;
  const look = (keep: (p: PackPlace) => boolean) => packQuery(packPts, nameSearch ? Infinity : reachKm, keep, nameSearch ? 6 : radius / 1000).catch(() => [] as PackPlace[]);
  // Exact matches first; forgiving typos only when they find too little (the typo pass is the slow one).
  let pack = await look(intent.text ? named(scorer(intent.text, false)) : inCats);
  if (intent.text && pack.length < 5) pack = await look(named(scorer(intent.text)));
  if (signal.aborted) return run;
  mergeInto(run.pool, pack.map(fromPack));
  onUpdate(run);

  // 2. The network adds to it, source by source.
  if (depth === 'local') return run;
  if (!navigator.onLine) { run.notes.add('Offline: showing your plan and the places saved on this phone.'); run.settled = true; return run; }
  const inPack = await covered(packPts, radius / 1000);
  const mid = pts[Math.floor(pts.length / 2)];
  const samples = intent.scope.kind === 'route' ? thin(intent.scope.line, 1.2).slice(0, 6).map(([x, y]) => ({ lat: y, lng: x })) : [mid];
  const jobs: Promise<unknown>[] = [];
  const add = (p: Promise<Place[]>, note?: string) => {
    run.pending++;
    jobs.push(p.then((list) => { if (!signal.aborted) mergeInto(run.pool, list); }, (e) => { if (note && (e as Error).name !== 'AbortError') run.notes.add(note); })
      .finally(() => { run.pending--; if (!signal.aborted) onUpdate(run); }));
  };
  const words = intent.text || intent.cats.map((k) => CAT[k].trekQ).find(Boolean);
  // Asked by a category's word ("izakaya"), the index's answers are that category even if their names don't say so.
  const tagged = (l: Place[]) => (intent.text ? l : l.map((p) => (p.source === 'trek' ? { ...p, cats: [...new Set([...p.cats, ...intent.cats])] } : p)));
  if (words && up('trek')) for (const s of samples.slice(0, isRoute ? 3 : 1)) add(trekSearch(words, s, signal, 15).then(tagged));
  if (intent.text && intent.text.length >= 3 && (!intent.cats.length || intent.brand) && up('photon')) add(photon(intent.text, mid, signal));
  // Categories the pack already has in full need the index only to fill in; outside it, ask properly.
  const asked: Cat[] = intent.cats.map((k) => CAT[k]);
  if (up('trek')) for (const c of asked) for (const cat of (c.trekCats ?? []).slice(0, inPack ? 1 : 3)) for (const s of inPack ? samples.slice(0, 2) : samples) add(trekNearby(cat, s, radius, signal));
  const osmOnly = asked.filter((c) => c.osm && !c.trekCats?.length);
  if (depth === 'full' && !inPack && osmOnly.length) {
    const where = intent.scope.kind === 'point'
      ? `(around:${radius},${intent.scope.at.lat.toFixed(5)},${intent.scope.at.lng.toFixed(5)})`
      : `(around:${Math.min(radius, 350)},${thin(intent.scope.line, 0.35).map(([x, y]) => `${y.toFixed(5)},${x.toFixed(5)}`).join(',')})`;
    add(overpass(osmOnly.flatMap((c) => c.osm!), where, signal), 'OpenStreetMap is busy, so toilets and lockers here may be missing.');
  }
  if (HOTPEPPER && (intent.mods.includes('group') || intent.cats.some((k) => k === 'izakaya' || k === 'yakiniku' || k === 'food'))) add(timeout(hotpepper(mid), 7000));
  run.asked = jobs.length;
  await Promise.all(jobs);
  run.settled = true;
  return run;
}

// ── UI ──
type Mk = { remove: () => void; getElement: () => HTMLElement };
type Pop = { remove: () => void; setLngLat: (c: [number, number]) => unknown; setHTML: (h: string) => unknown; addTo: (m: unknown) => unknown };
let markers: Mk[] = [];
let pinned = '';
let popup: Pop | null = null;
let results: Place[] = [];
let active = -1;
let ctrl: AbortController | null = null;
let timer = 0;
let scopeMode: ScopeMode = 'map';
const RECENT = 'jpc:recent-searches';
const recent = (): string[] => { try { return JSON.parse(localStorage.getItem(RECENT) ?? '[]'); } catch { return []; } };
const remember = (q: string) => { try { localStorage.setItem(RECENT, JSON.stringify([q, ...recent().filter((x) => x.toLowerCase() !== q.toLowerCase())].slice(0, 8))); } catch { /* private mode */ } };

const root = () => document.querySelector<HTMLElement>('[data-search]');
const list = () => root()?.querySelector<HTMLElement>('[data-search-results]');
const input = () => root()?.querySelector<HTMLInputElement>('[data-search-input]');
const areaBtn = () => root()?.querySelector<HTMLButtonElement>('[data-search-area]');

function setScopeLine(scope: Scope | null) {
  const { map } = stageApi();
  if (!map) return;
  const data = { type: 'FeatureCollection', features: scope?.kind === 'route' ? [{ type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: scope.line } }] : [] };
  const src = map.getSource('search-scope') as unknown as { setData: (d: object) => void } | undefined;
  if (src) { src.setData(data); return; }
  if (!scope || scope.kind !== 'route') return;
  map.addSource('search-scope', { type: 'geojson', data } as never);
  map.addLayer({ id: 'search-scope', type: 'line', source: 'search-scope', layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': '#e3411f', 'line-width': 18, 'line-opacity': 0.13, 'line-blur': 4 } } as never);
}
function clearPins() { markers.forEach((m) => m.remove()); markers = []; pinned = ''; popup?.remove(); setScopeLine(null); }
function pins(places: Place[]) {
  const { map, lib } = stageApi();
  if (!map || !lib) return;
  const sig = places.map((p) => p.id).join('|');
  if (sig === pinned) return; // same places, same pins: no flicker as late sources agree
  pinned = sig;
  markers.forEach((m) => m.remove()); markers = [];
  places.forEach((p, i) => {
    const el = document.createElement('button');
    el.type = 'button';
    el.className = 'search-pin';
    el.dataset.kind = p.source === 'plan' ? 'plan' : p.kind;
    el.setAttribute('aria-label', p.name);
    el.textContent = String(i + 1);
    el.addEventListener('click', (e) => { e.stopPropagation(); void open(i, false); });
    markers.push(new lib.Marker({ element: el }).setLngLat([p.lng, p.lat]).addTo(map) as unknown as Mk);
  });
}
const flagTags = (f: number) => [f & FLAG.card ? 'Cards OK' : null, f & FLAG.vegetarian ? 'Vegetarian' : null, f & FLAG.halal ? 'Halal' : null, f & FLAG.wheelchair ? 'Step-free' : null, f & FLAG.nosmoking ? 'Non-smoking' : null, f & FLAG.free ? 'Free' : null];
// Cuisine adds to the label, never repeats it ("Ramen" doesn't need a "ramen" tag).
const cuisineTag = (p: Place) => p.cuisine?.split(';').filter((c) => !p.cats.includes(c.trim())).slice(0, 2).map((c) => c.trim().replace(/_/g, ' ')).join(', ') || null;
const tagsOf = (p: Place) => [cuisineTag(p), ...flagTags(p.flags)].filter(Boolean) as string[];
const distLabel = (p: Place, route: boolean) => {
  const d = p.dist ?? 0;
  return d < 1.5 ? `${walkMin(d)} min${route ? ' off route' : ''}` : `${d < 10 ? d.toFixed(1) : Math.round(d)} km`;
};
function credits() {
  const src = new Set(results.flatMap((r) => [...r.sources]));
  const bits = [src.has('TREK Places') ? 'TREK Places (Overture)' : null, src.has('OpenStreetMap') ? '© OpenStreetMap contributors' : null].filter(Boolean);
  return (bits.length ? `<p class="sr-credit">${bits.join(' · ')}</p>` : '')
    + (src.has('Hot Pepper') ? '<p class="sr-credit"><a href="http://webservice.recruit.co.jp/" target="_blank" rel="noopener">Powered by ホットペッパー Webサービス</a></p>' : '');
}
// What a result is, in the words of the search when it was asked for ("Don Quijote", not "Supermarket").
const kindLabel = (p: Place) => {
  if (p.source === 'plan' || p.kind === 'station') return '';
  const asked = current?.intent.cats.find((a) => p.cats.includes(a));
  const k = asked ?? p.kind;
  return CAT[k]?.label.replace(/(?<!Sweet)s$/, '') ?? label(k);
};
function render(note = '') {
  const l = list();
  const inp = input();
  if (!l || !inp) return;
  const r = current;
  const at = nowMs();
  const route = r?.intent.scope.kind === 'route' && !r.ctx.nameSearch;
  const busy = !!r && !r.settled; // a keystroke's answer is followed by the network's
  const notes = [note, ...(r?.notes ?? [])].filter(Boolean);
  const where = r?.ctx.nameSearch ? 'nearest first' : r?.intent.scope.label ?? '';
  const head = r && (results.length || busy) ? `<p class="sr-intent"><span>${[...r.intent.cats.map((k) => CAT[k].label), r.intent.text ? `“${esc(r.intent.text)}”` : null, esc(where), ...r.intent.mods.map((m) => MOD_LABEL[m])].filter(Boolean).join(' · ')}</span><span aria-live="polite">${busy ? '<span class="sr-busy" aria-label="Still searching"></span>' : ''}${results.length}</span></p>` : '';
  const alts = r ? [
    r.intent.scope.kind === 'point' && viewDay() ? [`${r.q} along route`, 'Along the route'] : null,
    r.intent.mods.length ? [r.q.replace(/\b(open now|open|late night|late|vegan|vegetarian|halal|takes cards)\b/gi, '').trim(), 'Without the filters'] : null,
    r.intent.text && r.intent.cats.length ? [r.intent.cats.map((k) => CAT[k].label.toLowerCase()).join(' '), `Any ${CAT[r.intent.cats[0]].label.toLowerCase()}`] : null,
  ].filter(Boolean) as string[][] : [];
  const empty = r && !results.length && !busy
    ? `<p class="sr-note">Nothing found for “${esc(r.q)}”${r.ctx.nameSearch ? '' : ` ${esc(r.intent.scope.label)}`}.</p>${alts.length ? `<div class="sr-alts">${alts.map(([q, t]) => `<button type="button" class="chip-x" data-q="${esc(q)}">${esc(t)}</button>`).join('')}</div>` : ''}`
    : '';
  l.hidden = !results.length && !notes.length && !empty && !busy;
  inp.setAttribute('aria-expanded', String(!l.hidden));
  const qText = r?.intent.text ?? '';
  l.innerHTML = notes.map((n) => `<p class="sr-note">${esc(n)}</p>`).join('') + head + empty + results.map((p, k) => {
    const h = hoursAt(hoursOf(p.hours), at);
    const kind = kindLabel(p);
    const sub = p.source === 'plan' ? p.detail : [kind, p.detail].filter(Boolean).join(' · ');
    const tags = tagsOf(p).slice(0, 3);
    return `<button type="button" class="sr" role="option" id="sr-${k}" data-sr="${k}" aria-selected="${k === active}">
      <span class="sr-n" data-kind="${p.source === 'plan' ? 'plan' : 'place'}">${k + 1}</span>
      <span class="sr-t"><span class="sr-name">${highlight(p.name, qText, esc)}${p.ja && p.ja !== p.name ? ` <span lang="ja">${esc(p.ja)}</span>` : ''}</span>
        ${sub ? `<span class="sr-sub">${esc(sub)}</span>` : ''}
        ${h || tags.length ? `<span class="sr-meta">${h ? `<span class="sr-open" data-open="${h.open}">${esc(h.label)}</span>` : ''}${tags.map((t) => `<span class="sr-tag">${esc(t)}</span>`).join('')}</span>` : ''}</span>
      <span class="sr-d">${distLabel(p, route)}</span></button>`;
  }).join('') + (results.length ? credits() : '');
}
function suggestions(q: string) {
  const l = list();
  if (!l) return;
  const day = currentDay();
  const row = (q2: string, text: string, sub: string, mark: string) => `<button type="button" class="sr sr-suggest" data-q="${esc(q2)}"><span class="sr-n" data-kind="hint">${mark}</span><span class="sr-t"><span class="sr-name">${esc(text)}</span>${sub ? `<span class="sr-sub">${esc(sub)}</span>` : ''}</span></button>`;
  const hour = new Date(nowMs() + 9 * 3600e3).getUTCHours();
  const timely = hour < 10 ? 'breakfast near me open now' : hour < 15 ? 'ramen near me open now' : hour < 18 ? 'cafe along route' : hour < 23 ? 'izakaya near me open now' : 'late night ramen near me';
  const rows = [
    ...recent().slice(0, 5).map((r) => row(r, r, 'recent', '↺')),
    ...[timely, ...(day ? ['konbini between stop 1 and 2', 'toilets along route'] : ['sushi in Shibuya']), 'coin lockers near me', 'karaoke near me', 'round1'].map((r) => row(r, r, 'try', '?')),
  ];
  if (q.trim()) { l.hidden = true; return; }
  l.hidden = false;
  l.innerHTML = rows.join('');
}
/** As you type a category's name, offer it before the matches by name. */
function catHints(q: string): string {
  const f = q.trim().toLowerCase();
  if (f.length < 2 || /\s/.test(f) || parseQuery(q).cats.length) return '';
  const day = currentDay();
  return CATS.filter((c) => c.label.toLowerCase().startsWith(f) || c.key.startsWith(f)).slice(0, 2)
    .map((c) => `<button type="button" class="chip-x" data-q="${esc(c.label.toLowerCase())}">${esc(c.label)} around the map</button>${day ? `<button type="button" class="chip-x" data-q="${esc(`${c.label.toLowerCase()} along route`)}">… along Day ${day}</button>` : ''}`).join('');
}

async function open(i: number, fly = true) {
  const p = results[i];
  const { map, lib, offset, reduceMotion, pad } = stageApi();
  if (!p || !map || !lib) return;
  active = i;
  markers.forEach((m, k) => m.getElement().classList.toggle('on', k === i));
  input()?.setAttribute('aria-activedescendant', `sr-${i}`);
  const near = dayFor(p);
  const added = near ? isAdded(near.day, p.id) : false;
  const inPlan = p.source === 'plan' && p.kind === 'stop';
  const h = hoursAt(hoursOf(p.hours), nowMs());
  const slot = inPlan ? null : fit(p);
  const tags = tagsOf(p);
  const from = near?.stop;
  const dir = from && near.km < 1.5
    ? `https://www.google.com/maps/dir/?api=1&origin=${from.lat},${from.lng}&destination=${p.lat},${p.lng}&travelmode=walking`
    : `https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lng}&travelmode=transit`;
  const kind = kindLabel(p);
  const html = (photo: string | null) => `<div class="tc">${photo ? `<span class="tc-photo"><img src="${esc(photo)}" alt="" referrerpolicy="no-referrer"></span>` : ''}
    <p class="tc-tag">${esc(p.source === 'plan' ? (p.kind === 'stop' ? 'In your plan' : 'From your plan') : kind || 'Place')}</p>
    <p class="tc-name">${esc(p.name)}${p.ja && p.ja !== p.name ? ` <span lang="ja">${esc(p.ja)}</span>` : ''}</p>
    ${p.detail ? `<p class="tc-why">${esc(p.detail)}</p>` : ''}
    ${p.note ? `<p class="tc-why">${esc(p.note)}</p>` : ''}
    ${h ? `<p class="tc-when" data-open="${h.open}">${esc(h.label)}</p>` : p.hours ? `<p class="tc-why">Hours: ${esc(p.hours)}</p>` : ''}
    ${tags.length ? `<p class="tc-tags">${tags.map((t) => `<span>${esc(t)}</span>`).join('')}</p>` : ''}
    ${slot ? `<p class="tc-fit">${esc(slot)}</p>` : near && !inPlan ? `<p class="tc-walk">${near.km < 1.5 ? `${walkMin(near.km)} min walk` : `${near.km.toFixed(1)} km`} from stop ${near.stop.i} on Day ${near.day}</p>` : ''}
    <div class="tc-actions">
      ${inPlan ? `<a class="tc-add" href="${base}/day/${p.day}/#${p.stopId}">Open Day ${p.day}</a>`
        : near ? `<button type="button" class="tc-add" data-search-add="${i}" aria-pressed="${added}">${added ? `Added to Day ${near.day}` : `+ Add to Day ${near.day}`}</button>` : ''}
      <a href="${dir}" target="_blank" rel="noopener">Directions</a>
      ${p.website ? `<a href="${esc(p.website)}" target="_blank" rel="noopener">Website</a>` : ''}
      ${p.phone ? `<a href="tel:${esc(p.phone.replace(/[^\d+]/g, ''))}">Call</a>` : ''}
    </div>
    <p class="tc-src">${esc([...p.sources].join(' + '))}</p></div>`;
  popup ??= new lib.Popup({ closeButton: true, offset: 18, anchor: 'bottom', maxWidth: '300px', className: 'trip-popup trend-popup' }) as unknown as Pop;
  popup.setLngLat([p.lng, p.lat]); popup.setHTML(html(p.photo ?? null)); popup.addTo(map);
  const openH = map.getContainer().clientHeight - pad.top - pad.bottom;
  if (fly) map.easeTo({ center: [p.lng, p.lat], zoom: Math.max(map.getZoom(), 15.5), offset: [offset[0], offset[1] + Math.min(150, openH * 0.3)], duration: reduceMotion ? 0 : 900 });
  if (matchMedia('(max-width: 899px)').matches) { root()!.dataset.open = 'false'; input()?.blur(); }
  list()?.querySelectorAll('[data-sr]').forEach((b, k) => b.setAttribute('aria-selected', String(k === i)));
  if (!p.photo && p.wikidata) { const ph = await photoFor(p); if (ph && active === i) { p.photo = ph; popup.setHTML(html(ph)); } }
}

let framed = false;
let searchedAt: At | null = null;
function frame(r: Run) {
  const { map, pad } = stageApi();
  if (!map || !results.length || framed) return;
  if (!(r.intent.explicitScope || r.intent.scope.kind === 'route' || r.ctx.nameSearch)) return;
  framed = true;
  const pts: [number, number][] = results.slice(0, r.ctx.nameSearch ? 5 : 15).map((p) => [p.lng, p.lat]);
  if (r.intent.scope.kind === 'route') pts.push(...thin(r.intent.scope.line, 1)); else if (!r.ctx.nameSearch) pts.push([r.intent.scope.at.lng, r.intent.scope.at.lat]);
  const lng = pts.map((x) => x[0]), lat = pts.map((x) => x[1]);
  map.fitBounds([[Math.min(...lng), Math.min(...lat)], [Math.max(...lng), Math.max(...lat)]], { padding: { top: pad.top + 100, bottom: pad.bottom + 30, left: pad.left + 30, right: pad.right + 30 }, maxZoom: 16, duration: 900 } as never);
}

/** Every search paints what the phone knows first, then each network answer as it lands. */
async function go(q: string, depth: Depth) {
  const full = depth === 'full';
  ctrl?.abort();
  const c = (ctrl = new AbortController());
  framed = false;
  const t0 = performance.now();
  let first = true;
  const paint = (r: Run) => {
    if (c.signal.aborted) return;
    current = r;
    const prev = results[active]?.id;
    results = rank(r.pool.values(), r.ctx);
    active = prev ? results.findIndex((p) => p.id === prev) : -1;
    setScopeLine(r.intent.scope);
    render();
    const hint = full ? '' : catHints(q);
    if (hint) list()!.insertAdjacentHTML('afterbegin', `<div class="sr-alts">${hint}</div>`);
    if (hint) list()!.hidden = false;
    pins(results);
    if (full) frame(r);
    // For measuring: how long until the first results, and until the last source answered.
    const t = window as unknown as { __search?: { q: string; depth: Depth; first: number; last: number; n: number; done: boolean; asked?: number } };
    if (first) { t.__search = { q, depth, first: performance.now() - t0, last: 0, n: results.length, done: r.settled }; first = false; }
    else if (t.__search) Object.assign(t.__search, { last: performance.now() - t0, n: results.length, done: r.settled, asked: r.asked });
  };
  try {
    const r = await search(q, scopeMode, c.signal, depth, paint);
    if (c.signal.aborted) return;
    paint(r);
    if (r.intent.scope.kind === 'point') searchedAt = r.intent.scope.at;
    if (full && results.length) remember(q);
  } catch (e) { if ((e as Error).name !== 'AbortError') render('Search hit a snag; your own stops still search offline.'); }
}

function close() {
  const r = root();
  if (!r) return;
  ctrl?.abort();
  r.dataset.open = 'false';
  r.querySelectorAll('[data-explore]').forEach((b) => b.setAttribute('aria-pressed', 'false'));
  results = []; current = null; active = -1; searchedAt = null; render(); clearPins();
  areaBtn()?.setAttribute('hidden', '');
  input()!.value = '';
  r.querySelector<HTMLElement>('[data-search-clear]')!.hidden = true;
}

const CHIPS: [string, string][] = [
  ['ramen', 'Ramen'], ['izakaya', 'Izakaya'], ['bars', 'Bars'], ['sushi', 'Sushi'], ['cafe', 'Cafés'], ['sweets', 'Sweets'],
  ...(HOTPEPPER ? [['izakaya for a group of 8', 'Seats 8'] as [string, string]] : []),
  ['konbini', 'Konbini'], ['karaoke', 'Karaoke'], ['arcades', 'Arcades'], ['clubs', 'Clubs'], ['atm', 'ATMs'], ['coin lockers', 'Lockers'], ['toilets', 'Toilets'],
  ['drugstore', 'Drugstore'], ['don quijote', 'Don Quijote'], ['vintage', 'Vintage'], ['onsen', 'Onsen'],
];
type Rec = { lang: string; interimResults: boolean; onresult: (e: { results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }> }) => void; onend: () => void; onerror: () => void; start: () => void };
let bound = false;
export function bindSearch() {
  const r = root();
  if (!r || bound) return;
  bound = true;
  const day = currentDay();
  if (day) prefetch(day);
  const chips = r.querySelector<HTMLElement>('[data-search-chips]')!;
  const scopeName = () => (scopeMode === 'route' ? 'Along route' : scopeMode === 'me' ? 'Near me' : 'Around map');
  const drawChips = () => { chips.innerHTML = `<button type="button" class="chip-x chip-scope" data-scope title="Where to search">${scopeName()} ▾</button>` + CHIPS.map(([q, l]) => `<button type="button" class="chip-x" data-explore="${esc(q)}" aria-pressed="false">${l}</button>`).join(''); };
  drawChips();
  const inp = input()!;
  const l = list()!;
  l.id ||= 'search-results';
  inp.setAttribute('role', 'combobox');
  inp.setAttribute('aria-controls', l.id);
  inp.setAttribute('aria-autocomplete', 'list');
  inp.setAttribute('aria-expanded', 'false');
  const clear = r.querySelector<HTMLElement>('[data-search-clear]')!;
  const w = window as unknown as { SpeechRecognition?: new () => Rec; webkitSpeechRecognition?: new () => Rec };
  const SR = w.SpeechRecognition ?? w.webkitSpeechRecognition;
  const mic = r.querySelector<HTMLButtonElement>('[data-search-mic]');
  if (mic && SR) {
    mic.hidden = false;
    mic.addEventListener('click', () => {
      const rec = new SR();
      rec.lang = navigator.language.startsWith('ja') ? 'ja-JP' : 'en-US';
      rec.interimResults = true; // words appear as they're said, and the local search follows them
      rec.onresult = (e) => {
        const res = e.results[0];
        inp.value = res[0].transcript; clear.hidden = false;
        void go(inp.value, res.isFinal ? 'full' : 'local');
      };
      rec.onend = rec.onerror = () => mic.classList.remove('on');
      mic.classList.add('on');
      rec.start();
    });
  }
  inp.addEventListener('focus', () => {
    r.dataset.open = 'true';
    document.dispatchEvent(new CustomEvent('search:open'));
    if (!day) { const d = currentDay(); if (d) prefetch(d); }
    if (results.length) { l.hidden = false; render(); } else suggestions(inp.value);
  });
  inp.addEventListener('input', () => {
    if (r.dataset.open !== 'true') { r.dataset.open = 'true'; document.dispatchEvent(new CustomEvent('search:open')); }
    const q = inp.value.trim();
    clear.hidden = !inp.value;
    r.querySelectorAll('[data-explore]').forEach((b) => b.setAttribute('aria-pressed', 'false'));
    clearTimeout(timer);
    if (q.length < 2) { ctrl?.abort(); results = []; current = null; clearPins(); suggestions(q); return; }
    // The phone answers on every keystroke; the network only once typing pauses.
    void go(q, 'local');
    timer = window.setTimeout(() => void go(q, parseQuery(q).cats.length ? 'full' : 'type'), 220);
  });
  inp.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (!results.length) return;
      active = (active + (e.key === 'ArrowDown' ? 1 : -1) + results.length) % results.length;
      l.querySelectorAll('[data-sr]').forEach((b, k) => b.setAttribute('aria-selected', String(k === active)));
      l.querySelector(`#sr-${active}`)?.scrollIntoView({ block: 'nearest' });
      inp.setAttribute('aria-activedescendant', `sr-${active}`);
      markers.forEach((m, k) => m.getElement().classList.toggle('on', k === active));
    } else if (e.key === 'Escape') { close(); inp.blur(); }
  });
  r.querySelector('form')!.addEventListener('submit', (e) => {
    e.preventDefault();
    const q = inp.value.trim();
    if (!q) return;
    clearTimeout(timer);
    // Enter on a highlighted row opens it; otherwise search fully, and open a clear best match.
    if (active >= 0 && results[active]) { void open(active); return; }
    void go(q, 'full').then(() => { if (results.length && current?.ctx.nameSearch && (results[0].match ?? 0) >= 0.85 && (results[1]?.match ?? 0) < 1) void open(0); });
    inp.blur();
  });
  clear.addEventListener('click', () => { close(); inp.focus(); });
  r.addEventListener('mouseover', (e) => {
    const sr = (e.target as HTMLElement).closest<HTMLElement>('[data-sr]');
    if (sr) markers.forEach((m, k) => m.getElement().classList.toggle('hover', k === Number(sr.dataset.sr)));
  });
  r.addEventListener('mouseleave', () => markers.forEach((m) => m.getElement().classList.remove('hover')));
  r.addEventListener('click', (e) => {
    const t = e.target as HTMLElement;
    const sg = t.closest<HTMLElement>('[data-q]');
    if (sg) { inp.value = sg.dataset.q!; clear.hidden = false; clearTimeout(timer); void go(inp.value, 'full'); return; }
    const sr = t.closest<HTMLElement>('[data-sr]');
    if (sr) { void open(Number(sr.dataset.sr)); return; }
    if (t.closest('[data-search-area]')) { areaBtn()!.hidden = true; if (inp.value.trim()) void go(inp.value, 'full'); return; }
    if (t.closest('[data-scope]')) {
      const order: ScopeMode[] = currentDay() ? ['map', 'route', 'me'] : ['map', 'me'];
      scopeMode = order[(order.indexOf(scopeMode) + 1) % order.length];
      drawChips();
      if (inp.value.trim()) void go(inp.value, 'full');
      return;
    }
    const ex = t.closest<HTMLElement>('[data-explore]');
    if (ex) {
      r.querySelectorAll('[data-explore]').forEach((b) => b.setAttribute('aria-pressed', String(b === ex)));
      inp.value = ex.dataset.explore!; clear.hidden = false; clearTimeout(timer);
      void go(ex.dataset.explore!, 'full');
    }
  });
  // The quick add inside a result card (the card lives in the map's popup, outside the search box).
  document.addEventListener('click', (e) => {
    const b = (e.target as HTMLElement).closest<HTMLElement>('[data-search-add]');
    if (!b) return;
    const i = Number(b.dataset.searchAdd);
    const p = results[i];
    const near = p && dayFor(p);
    if (!p || !near) return;
    if (!isAdded(near.day, p.id)) addTrend(near.day, asTrend(p, near));
    void open(i, false);
  });
  // "/" or ⌘K / Ctrl-K to search from anywhere.
  document.addEventListener('keydown', (e) => {
    const typing = (e.target as HTMLElement).closest('input, textarea, [contenteditable]');
    if ((e.key === '/' && !typing) || (e.key.toLowerCase() === 'k' && (e.metaKey || e.ctrlKey))) { e.preventDefault(); inp.focus(); inp.select(); }
  });
  // "Search this area": offered once the map has moved well away from where a map search looked.
  const watch = () => {
    const { map } = stageApi();
    if (!map) { setTimeout(watch, 500); return; }
    let byHand = false; // only after the person moves the map, not after search frames its results
    map.on('movestart', (e: { originalEvent?: Event }) => { if (e.originalEvent) byHand = true; });
    map.on('moveend', () => {
      if (!byHand) return;
      byHand = false;
      const b = areaBtn();
      if (!b || !current || current.intent.explicitScope || current.intent.scope.kind !== 'point' || !searchedAt) return;
      b.hidden = km(searchedAt, mapCentre()) < Math.max(0.35, current.ctx.radiusKm * 0.6);
    });
  };
  watch();
}
document.addEventListener('astro:page-load', bindSearch);
document.addEventListener('astro:after-swap', () => { popup?.remove(); });
