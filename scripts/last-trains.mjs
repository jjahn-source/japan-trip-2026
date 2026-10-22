// The real last train home for each night out, written to data/last-trains.json for the day's
// "Last train home" panel and the live layer's last-train alert. Source: Yahoo!乗換案内's own 終電
// (last-train) search on the trip's dates, which uses the operators' real timetables (NAVITIME's free
// plan only averages late-night intervals, and Google's API has no Japanese transit).
//
// Where no station is near (Hakone's Sengokuhara), the night's last bus instead: the bus stops nearest each
// end (from Google Places, by name), searched as Yahoo names them ("仙石/箱根登山バス") with local buses on,
// and kept only when Yahoo's stop is the one we meant (its coordinates are checked, as for stations). A
// last bus that leaves before the night there ends makes it a taxi night, and the reason says when it went.
//
// For each night: the night's last stop out and the bed; the two stations nearest each (by our rail
// data, public/transit.json); a 終電 search for each pair. A result only counts when Yahoo picked the
// station we meant (Kujō in Osaka, not Kujō in Kyoto: its coordinates are checked). The night's answer
// is the pair that lets the group leave latest, walking time to the platform included. Polite: one
// request every 2.5 s, about 40 a run, on a path robots.txt allows.
// Run: npm run last-trains   (one night: node scripts/last-trains.mjs --day 7)
import { readFile, writeFile } from 'node:fs/promises';

const read = async (p) => JSON.parse(await readFile(new URL(p, import.meta.url), 'utf8'));
const trip = await read('../dist/trip-data.json');
const transit = await read('../public/transit.json');
const { translator } = await import('../src/lib/navitime.ts');
const tr = translator(new Map(transit.stations.map((s) => [s.ja, s.name])), new Map(transit.lines.map((l) => [l.ja, l.name])));
const only = process.argv.includes('--day') ? Number(process.argv[process.argv.indexOf('--day') + 1]) : null;
const out = only ? await read('../data/last-trains.json').catch(() => ({ days: {}, skipped: {} })) : { days: {}, skipped: {} };
out.generated = new Date().toISOString();
out.source = 'Yahoo!乗換案内 last-train (終電) search, transit.yahoo.co.jp';

const km = (a, b) => { const r = Math.PI / 180, x = Math.sin(((b.lat - a.lat) * r) / 2) ** 2 + Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(((b.lng - a.lng) * r) / 2) ** 2; return 12742 * Math.asin(Math.sqrt(x)); };
/** Minutes on foot: streets are ~1.3× the straight line, 75 m a minute in a group, 3 min station to platform. */
const walkMin = (k) => Math.round((k * 1300) / 75) + 3;
const toMin = (hm) => { const [h, m] = hm.split(':').map(Number); return (h < 12 ? h + 24 : h) * 60 + m; };
const hm = (m) => `${String(Math.floor(m / 60) % 24).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const near = (p, max = 1.5, n = 2) => {
  const seen = new Set();
  return transit.stations.map((s) => ({ ...s, k: km(p, s) })).filter((s) => s.k <= max).sort((a, b) => a.k - b.k)
    .filter((s) => !seen.has(s.ja) && seen.add(s.ja)).slice(0, n);
};
const english = (railName) => tr.line(railName.replace(/(外回り|内回り)$/, '').trim());

let calls = 0;

// ── Buses, where there's no station ──
/** Local bus companies to try a stop's name with, as Yahoo writes them. */
const BUS_OPS = ['箱根登山バス', '伊豆箱根バス'];
const BUS_EN = { '箱根登山バス': 'Hakone Tozan Bus', '伊豆箱根バス': 'Izuhakone Bus' };
const L = await import('../planner/lib.ts');
const gkey = L.key('GOOGLE_MAPS_API_KEY');
/** Bus stops within 500 m of a point, nearest first, by their Japanese name (Yahoo's) and English one. */
async function busStops(p) {
  if (!gkey) return [];
  const ask = (languageCode) => L.cached('busstops', [p.lat.toFixed(4), p.lng.toFixed(4), languageCode], () => L.http('https://places.googleapis.com/v1/places:searchNearby', {
    method: 'POST', headers: { 'X-Goog-Api-Key': gkey, 'Content-Type': 'application/json', 'X-Goog-FieldMask': 'places.id,places.displayName,places.location' },
    body: JSON.stringify({ includedTypes: ['bus_stop', 'bus_station'], maxResultCount: 8, rankPreference: 'DISTANCE', languageCode, locationRestriction: { circle: { center: { latitude: p.lat, longitude: p.lng }, radius: 500 } } }),
  }), 30);
  const [ja, en] = await Promise.all([ask('ja'), ask('en')]);
  const enOf = new Map((en?.places ?? []).map((x) => [x.id, x.displayName?.text]));
  const seen = new Set();
  return (ja?.places ?? []).map((x) => ({ ja: x.displayName.text.replace(/[（(]バス[）)]$/, '').trim(), name: (enOf.get(x.id) ?? x.displayName.text).replace(/\s*[（(](Bus|バス)[）)]$/i, ''), lat: x.location.latitude, lng: x.location.longitude }))
    .filter((x) => !seen.has(x.ja) && seen.add(x.ja)).slice(0, 2);
}
/** The night's last bus between the stops nearest each end, or null. */
async function lastBus(origin, bed, date) {
  const starts = await busStops(origin), ends = await busStops(bed);
  let best = null;
  for (const a of starts) for (const b of ends) for (const op of BUS_OPS) {
    if (a.ja === b.ja) continue;
    const found = await lastTrains({ ...a, ja: `${a.ja}/${op}` }, { ...b, ja: `${b.ja}/${op}` }, date, true);
    for (const r of found) {
      const leave = toMin(r.dep) - walkMin(km(origin, a)) + 3, home = toMin(r.arr) + walkMin(km(b, bed)) - 3;
      if (!best || leave > best.leaveMin) best = { ...r, a, b, op, leaveMin: leave, homeMin: home };
    }
    if (found.length) break; // this stop pair is that company's
  }
  return best;
}
async function lastTrains(from, to, date, bus = false) {
  const [y, m, d] = date.split('-');
  const u = new URL('https://transit.yahoo.co.jp/search/result');
  Object.entries({ from: from.ja, to: to.ja, y, m, d, hh: '23', m1: '0', m2: '0', type: '2', ticket: 'ic', expkind: '1', ws: '3', s: '0', al: '0', shin: '0', ex: '1', hb: '0', lb: bus ? '1' : '0', sr: '0' })
    .forEach(([k, v]) => u.searchParams.set(k, v));
  if (calls++) await sleep(2500);
  const res = await fetch(u, { headers: { 'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0 Safari/537.36', 'accept-language': 'ja' } });
  if (!res.ok) throw new Error(`Yahoo ${res.status} for ${from.ja} → ${to.ja}`);
  const html = await res.text();
  const data = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/)?.[1];
  const list = data ? JSON.parse(data).props?.pageProps?.naviSearchParam?.featureInfoList ?? [] : [];
  const at = (e) => { const g = e?.linkInfo?.map?.match(/lon=([\d.]+)&lat=([\d.]+)/); return g ? { lng: +g[1], lat: +g[2] } : null; };
  return list.flatMap((f) => {
    const edges = f.edgeInfoList ?? [];
    const a = at(edges[0]), b = at(edges.at(-1));
    // Yahoo matched a different station with the same name: not ours.
    if (!a || !b || km(a, from) > 1 || km(b, to) > 1) return [];
    // Each station lists the line it's on; the arrival station repeats the last one.
    const rides = edges.map((e) => e.railNameExcludingDestination).filter((x, i, all) => x && x !== '徒歩' && x !== all[i - 1]);
    if (!rides.length) return [];
    return [{ dep: f.summaryInfo.departureTime, arr: f.summaryInfo.arrivalTime, rides, url: u.toString() }];
  });
}

for (const day of trip.days) {
  if (only && day.n !== only) continue;
  delete out.days[day.n]; delete out.skipped[day.n];
  const skip = (why) => { out.skipped[day.n] = why; console.log(`Day ${day.n}: ${why}`); };
  const evening = Date.parse(`${day.date}T20:00:00+09:00`);
  const bed = trip.stays.find((s) => Date.parse(s.in) <= evening && evening < Date.parse(s.out) && s.lat != null);
  // Where the plan has the group when last trains leave (23:30): the stop on then, else the last one
  // started by then, else the day's last stop out (an early night).
  const out_ = trip.stops.filter((s) => s.d === day.n && s.lat != null && s.cat !== 'stay' && s.cat !== 'transport');
  const lateNight = Date.parse(`${day.date}T23:30:00+09:00`);
  const origin = out_.find((s) => Date.parse(s.s) <= lateNight && lateNight < Date.parse(s.e))
    ?? out_.filter((s) => Date.parse(s.s) <= lateNight).at(-1) ?? out_.at(-1);
  if (!bed || !origin) { skip('no night in a bed (travel day)'); continue; }
  if (km(origin, bed) < 1.2) { skip(`${origin.name} is a walk from ${bed.name}`); continue; }
  const starts = near(origin), ends = near(bed);
  if (!starts.length || !ends.length) {
    const far = !starts.length ? origin : bed;
    const bus = await lastBus(origin, bed, day.date);
    if (!bus) { skip(`no station within 1.5 km of ${far.name}, and no bus found: a taxi night`); continue; }
    const by = `the last bus from ${bus.a.name} (${bus.a.ja}) leaves ${bus.dep} (${BUS_EN[bus.op] ?? bus.op}, to ${bus.b.name} by ${bus.arr})`;
    // Gone before the night there ends: say when, and it's a taxi.
    if (bus.leaveMin < toMin(origin.e.slice(11, 16))) { skip(`${by}, before ${origin.name} ends at ${origin.e.slice(11, 16)}: a taxi night`); continue; }
    out.days[day.n] = {
      origin: origin.id, leave: hm(bus.leaveMin), dep: bus.dep, arr: hm(bus.homeMin),
      from: bus.a.name, line: BUS_EN[bus.op] ?? bus.op, url: bus.url, bus: true,
    };
    console.log(`Day ${day.n}: last bus ${bus.dep} from ${bus.a.name} · in bed ${hm(bus.homeMin)}`);
    continue;
  }
  let best = null;
  for (const a of starts) for (const b of ends) {
    if (a.ja === b.ja) continue;
    for (const r of await lastTrains(a, b, day.date)) {
      const leave = toMin(r.dep) - walkMin(km(origin, a));
      const home = toMin(r.arr) + walkMin(km(b, bed)) - 3;
      if (!best || leave > best.leaveMin || (leave === best.leaveMin && home < best.homeMin)) best = { ...r, a, b, leaveMin: leave, homeMin: home };
    }
  }
  if (!best) { skip(`no last train found from ${starts.map((s) => s.ja).join('/')} to ${ends.map((s) => s.ja).join('/')}`); continue; }
  out.days[day.n] = {
    origin: origin.id, leave: hm(best.leaveMin), dep: best.dep, arr: hm(best.homeMin),
    from: best.a.name, line: best.rides.map(english).join(' → '), url: best.url,
  };
  console.log(`Day ${day.n}: leave ${origin.name} by ${hm(best.leaveMin)} · ${best.dep} from ${best.a.name} (${out.days[day.n].line}) · ${best.arr} at ${best.b.name} · in bed ${hm(best.homeMin)}`);
}
await writeFile(new URL('../data/last-trains.json', import.meta.url), `${JSON.stringify(out, null, 2)}\n`);
console.log(`${Object.keys(out.days).length} nights with a last train, ${Object.keys(out.skipped).length} without · ${calls} searches`);
