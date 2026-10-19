// Japan's rail network around the trip, written to public/transit.json (loaded by the map on demand).
//
// From OpenStreetMap: train, subway, monorail, tram and funicular route relations in each region the
// trip visits, plus the Tōkaidō and San'yō Shinkansen end to end, the Hakone ropeway, and stations.
// Each line keeps its official colour (the OSM `colour` tag). Lines the plan mentions on a given day
// ("Ōedo", "Romancecar", "Nozomi" …) are listed per day so the map can draw them boldly.
//
// Run: npm run transit (builds first, because the stops are read from the built site).
import { readFile, writeFile } from 'node:fs/promises';

const UA = 'japan-plan-c-trip-site/1.0 (private trip planner)';
const REGIONS = {
  tokyo: [35.52, 139.55, 35.82, 139.92],
  hakone: [35.18, 138.98, 35.3, 139.2],
  kyoto: [34.9, 135.66, 35.06, 135.82],
  osaka: [34.57, 135.38, 34.77, 135.6],
  nara: [34.6, 135.58, 34.72, 135.87],
  hiroshima: [34.26, 132.27, 34.43, 132.5],
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function overpass(q) {
  for (let i = 0; i < 6; i++) {
    try {
      const res = await fetch('https://overpass-api.de/api/interpreter', { method: 'POST', body: new URLSearchParams({ data: q }), headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(200000) });
      if (res.ok) return res.json();
      console.log(`  overpass ${res.status}, retrying`);
    } catch (e) { console.log(`  overpass ${e.name}, retrying`); }
    await sleep(8000 * (i + 1));
  }
  throw new Error('Overpass failed');
}

// Douglas–Peucker in degrees, then 5-decimal rounding (~1 m).
function simplify(pts, tol) {
  if (pts.length < 3) return pts.map(([x, y]) => [+x.toFixed(5), +y.toFixed(5)]);
  const keep = new Uint8Array(pts.length); keep[0] = keep[pts.length - 1] = 1;
  const stack = [[0, pts.length - 1]];
  while (stack.length) {
    const [a, b] = stack.pop();
    let max = 0, idx = -1;
    const [x1, y1] = pts[a], [x2, y2] = pts[b];
    const dx = x2 - x1, dy = y2 - y1, len = dx * dx + dy * dy;
    for (let i = a + 1; i < b; i++) {
      const [x, y] = pts[i];
      const t = len ? Math.max(0, Math.min(1, ((x - x1) * dx + (y - y1) * dy) / len)) : 0;
      const d = (x - x1 - t * dx) ** 2 + (y - y1 - t * dy) ** 2;
      if (d > max) { max = d; idx = i; }
    }
    if (max > tol * tol) { keep[idx] = 1; stack.push([a, idx], [idx, b]); }
  }
  return pts.filter((_, i) => keep[i]).map(([x, y]) => [+x.toFixed(5), +y.toFixed(5)]);
}
// Join way pieces end to end so each line is a few long strokes (smoother flow animation).
function chain(segs) {
  const out = [];
  const pool = segs.map((s) => s.slice());
  const key = (p) => `${p[0].toFixed(5)},${p[1].toFixed(5)}`;
  while (pool.length) {
    let line = pool.pop();
    for (let grew = true; grew;) {
      grew = false;
      for (let i = 0; i < pool.length; i++) {
        const s = pool[i];
        if (key(s[0]) === key(line.at(-1))) line = line.concat(s.slice(1));
        else if (key(s.at(-1)) === key(line.at(-1))) line = line.concat(s.slice(0, -1).reverse());
        else if (key(s.at(-1)) === key(line[0])) line = s.concat(line.slice(1));
        else if (key(s[0]) === key(line[0])) line = s.slice(1).reverse().concat(line);
        else continue;
        pool.splice(i, 1); grew = true; break;
      }
    }
    out.push(line);
  }
  return out;
}

const KIND = (t) => {
  const n = `${t.name ?? ''} ${t['name:en'] ?? ''}`;
  if (/新幹線|Shinkansen/i.test(n) || t.service === 'high_speed') return 'shinkansen';
  if (t.route === 'subway') return 'subway';
  if (['monorail', 'tram', 'light_rail', 'funicular'].includes(t.route)) return t.route === 'light_rail' ? 'tram' : t.route;
  if (/旅客鉄道|JR|Japan Railway/i.test(`${t.operator ?? ''} ${t.network ?? ''} ${n}`)) return 'jr';
  return 'rail';
};
const FALLBACK = { shinkansen: '#1f5fbf', jr: '#2f8f4e', subway: '#7a73c7', rail: '#8a7fb8', monorail: '#2aa7a0', tram: '#d06a3a', funicular: '#b05aa0', ropeway: '#c0457a' };
const cleanName = (s) => (s ?? '').replace(/\s*[(（].*?[)）]\s*/g, ' ').replace(/[:：].*$/, '').replace(/\s*(上り|下り|内回り|外回り|Inner|Outer|Northbound|Southbound|Eastbound|Westbound).*$/i, '').trim();

const lines = new Map(); // key → { name, ja, colour, kind, ways: Map(wayId → coords) }
function addRelation(e) {
  const t = e.tags ?? {};
  const kind = KIND(t);
  const ja = cleanName(t.name);
  const en = cleanName(t['name:en']) || ja;
  const colour = /^#[0-9a-f]{6}$/i.test(t.colour ?? '') ? t.colour.toLowerCase() : FALLBACK[kind];
  const key = `${en}|${colour}`;
  const L = lines.get(key) ?? { name: en, ja, colour, kind, ways: new Map() };
  for (const m of e.members ?? []) {
    if (m.type !== 'way' || !m.geometry || (m.role && /platform|stop/.test(m.role))) continue;
    const pts = m.geometry.filter(Boolean).map((p) => [p.lon, p.lat]);
    if (pts.length > 1) L.ways.set(m.ref, pts);
  }
  lines.set(key, L);
}

// 1. Regional networks.
for (const [name, [s, w, n, e]] of Object.entries(REGIONS)) {
  const q = `[out:json][timeout:180];rel(${s},${w},${n},${e})["type"="route"]["route"~"^(train|subway|monorail|tram|light_rail|funicular)$"];out geom(${s},${w},${n},${e});`;
  const res = await overpass(q);
  for (const el of res.elements) addRelation(el);
  console.log(`${name}: ${res.elements.length} route relations`);
  await sleep(4000);
}
// 2. Shinkansen end to end (Tokyo → Hiroshima), whole geometry.
{
  // OSM names Shinkansen relations by service; the Nozomi relation runs Tokyo → Hakata on the
  // Tōkaidō and San'yō lines, which is exactly the trip's corridor.
  const res = await overpass(`[out:json][timeout:240];rel(35.6,139.7,35.7,139.8)["type"="route"]["route"="train"]["name"~"^のぞみ.*東京 =>"];out geom;`);
  for (const el of res.elements) addRelation({ ...el, tags: { ...el.tags, name: '東海道・山陽新幹線', 'name:en': "Tōkaidō–San'yō Shinkansen", colour: '#1a63c7', service: 'high_speed' } });
  console.log(`shinkansen: ${res.elements.length} relations`);
  await sleep(4000);
}
// 2b. Lines between the cities, end to end (the regional boxes above clip them): Odakyu to Odawara,
//     Hakone Tozan, and the Kyoto–Osaka–Nara–Kobe private and JR lines.
{
  const BETWEEN = '小田急.*小田原線|小田急.*江ノ島線|箱根登山|阪急京都|京阪本線|京阪鴨東線|JR京都線|東海道本線|琵琶湖線|JR神戸線|近鉄奈良線|近鉄京都線|阪神なんば線|阪神本線|大阪環状線|JR奈良線|JR東西線|京急本線|京急空港線';
  const res = await overpass(`[out:json][timeout:240];rel(34.3,134.9,35.9,140.0)["type"="route"]["route"="train"]["name"~"${BETWEEN}"];out geom;`);
  for (const el of res.elements) addRelation(el);
  console.log(`between cities: ${res.elements.length} relations`);
  await sleep(4000);
}
// 3. Hakone ropeway as its own line.
{
  const [s, w, n, e] = REGIONS.hakone;
  const res = await overpass(`[out:json][timeout:120];way(${s},${w},${n},${e})["aerialway"~"^(gondola|cable_car)$"];out geom;`);
  const L = { name: 'Hakone Ropeway', ja: '箱根ロープウェイ', colour: FALLBACK.ropeway, kind: 'ropeway', ways: new Map() };
  for (const w2 of res.elements) L.ways.set(w2.id, w2.geometry.map((p) => [p.lon, p.lat]));
  if (L.ways.size) lines.set('ropeway', L);
  console.log(`ropeway: ${L.ways.size} ways`);
  await sleep(4000);
}
// 4. Stations.
const stations = [];
for (const [name, [s, w, n, e]] of Object.entries(REGIONS)) {
  const res = await overpass(`[out:json][timeout:120];node(${s},${w},${n},${e})["railway"="station"]["name"];out tags center;`);
  const seen = new Set();
  for (const el of res.elements) {
    const t = el.tags;
    if (seen.has(t.name)) continue;
    seen.add(t.name);
    stations.push({ name: t['name:en'] || t.name, ja: t.name, lng: +el.lon.toFixed(5), lat: +el.lat.toFixed(5) });
  }
  console.log(`${name}: ${seen.size} stations`);
  await sleep(4000);
}

// 5. Lines named in each day of the plan.
const plan = await readFile(new URL('../data/japan-plan-c.md', import.meta.url), 'utf8');
// The trip as the build wrote it (src/pages/trip-data.json.ts), so build first.
const trip = JSON.parse(await readFile(new URL('../dist/trip-data.json', import.meta.url), 'utf8'));
const sections = {};
// The itinerary agent's plan (data/itinerary.json), when there is one, is what the site shows.
const itinerary = await readFile(new URL('../data/itinerary.json', import.meta.url), 'utf8').then(JSON.parse).catch(() => null);
if (itinerary && process.env.TRIP_SOURCE !== 'trek') {
  for (const d of itinerary.days) sections[d.n] = [...d.notes.map((x) => x.text), ...d.stops.flatMap((x) => [x.name, x.plan ?? '', x.transport ?? ''])].join('\n');
} else {
  const parts = plan.split(/^## Day (\d+)\b/m);
  for (let i = 1; i < parts.length; i += 2) sections[parts[i]] = parts[i + 1];
}
// [what the plan says, which OSM lines it means, the chip label, official colour]
const MENTIONS = [
  [/[ŌO]edo\b/, /大江戸線|^[ŌO]edo Line/i, 'Toei Ōedo Line', '#b6007a'],
  [/Nozomi|Hikari|Kodama|Shinkansen/i, /東海道・山陽新幹線/, "Tōkaidō–San'yō Shinkansen", '#1a63c7'],
  [/Romancecar|Odakyu (line|train|Odawara)/i, /小田急小田原線|Odakyu Odawara Line/i, 'Odakyu Romancecar', '#0d82c7'],
  [/Tozan (train|railway|line|bus)?|Hakone Tozan/i, /箱根登山(鉄道|線)|Hakone Tozan Line/i, 'Hakone Tozan Line', '#a72126'],
  [/cable ?car/i, /Hakone Tozan Cable/i, 'Hakone Tozan Cable Car', null],
  [/ropeway/i, /ロープウェイ|Ropeway/i, 'Hakone Ropeway', '#c0457a'],
  [/Kintetsu/i, /Kintetsu (Nara|Namba) Line/i, 'Kintetsu Nara Line', '#d21644'],
  [/Hanshin|Namba line/i, /Hanshin Namba Line|阪神なんば線/i, 'Hanshin Namba Line', '#f08300'],
  [/Mid[oō]suji/i, /御堂筋線|Mid[oō]suji Line/i, 'Osaka Metro Midōsuji Line', '#e5171f'],
  [/Ch[uū][oō] line/i, /Osaka.*Ch[uū][oō] Line|Ch[uū][oō] Line.*Osaka|大阪.*中央線/i, 'Osaka Metro Chūō Line', '#019a66'],
  [/Ch[uū][oō] line/i, /^JR Ch[uū]o (Rapid )?Line|中央線快速/i, 'JR Chūō Line', '#f15620'],
  [/\bMita\b/, /三田線|Mita Line/i, 'Toei Mita Line', '#0079c2'],
  [/Yurikamome/i, /ゆりかもめ|Yurikamome/i, 'Yurikamome', null],
  [/Setagaya line/i, /世田谷線|Setagaya Line/i, 'Tōkyū Setagaya Line', '#f2b200'],
  [/Shinjuku line/i, /都営新宿線|Toei Shinjuku Line/i, 'Toei Shinjuku Line', '#6cbb5a'],
  [/Rinkai/i, /りんかい|Rinkai/i, 'Rinkai Line', null],
  [/Keikyu/i, /^Keiky[uū] Airport Line|京急空港線/i, 'Keikyū Airport Line', '#00bfff'],
  [/Hibiya/i, /日比谷線|Hibiya Line/i, 'Tokyo Metro Hibiya Line', '#9caeb7'],
  [/Ginza line/i, /銀座線|Ginza Line/i, 'Tokyo Metro Ginza Line', '#f39700'],
  [/Fukutoshin/i, /副都心線|Fukutoshin Line/i, 'Tokyo Metro Fukutoshin Line', '#9c5e31'],
  [/Chiyoda/i, /千代田線|Chiyoda Line/i, 'Tokyo Metro Chiyoda Line', '#00bb85'],
  [/Asakusa line/i, /^都営浅草線|^Toei Asakusa Line/i, 'Toei Asakusa Line', '#e85298'],
  [/Karasuma/i, /烏丸線|Karasuma Line/i, 'Kyoto Subway Karasuma Line', '#008000'],
  [/Loop line/i, /大阪環状線|Osaka Loop Line/i, 'JR Osaka Loop Line', '#f15d22'],
  [/Yumesaki/i, /ゆめ咲線|桜島線|Yumesaki|Sakurajima/i, 'JR Yumesaki Line', '#007ac0'],
  [/S[oō]bu/i, /総武線|S[oō]bu Line/i, 'JR Chūō–Sōbu Line', '#ffd400'],
  [/Hankyu/i, /阪急(京都|神戸|宝塚)線|Hankyu (Kyoto|Kobe|Takarazuka)/i, 'Hankyu', '#7a1a2a'],
  [/Yamanote/i, /山手線|Yamanote Line/i, 'JR Yamanote Line', '#9acd32'],
  [/\btram\b|streetcar|Hiroden/i, /広島電鉄|広電|Hiroden|Hiroshima Electric/i, 'Hiroden streetcar', '#00a65f'],
];
const all = [...lines.values()].filter((L) => L.ways.size);
all.forEach((L, i) => { L.id = `l${i}`; });
const near = (L, pts) => [...L.ways.values()].some((c) => c.some(([x, y]) => pts.some((s) => Math.abs(s.lng - x) < 0.05 && Math.abs(s.lat - y) < 0.04)));
const days = {};
for (const [d, text] of Object.entries(sections)) {
  const pts = trip.stops.filter((s) => s.d === +d && s.lat != null);
  if (!pts.length) continue;
  const rides = [];
  for (const [mention, nameRe, label, colour] of MENTIONS) {
    if (!mention.test(text)) continue;
    const ids = all.filter((L) => nameRe.test(`${L.name} ${L.ja}`) && (L.kind === 'shinkansen' || near(L, pts))).map((L) => L.id);
    if (!ids.length) continue;
    const c = colour ?? all.find((L) => L.id === ids[0]).colour;
    rides.push({ label, colour: c, ids });
  }
  days[d] = rides;
}

// 6. Write.
const TOL = { shinkansen: 0.0003, jr: 0.00012, rail: 0.00012, subway: 0.0001, monorail: 0.0001, tram: 0.00008, funicular: 0.00005, ropeway: 0.00005 };
const out = {
  generated: new Date().toISOString(),
  source: '© OpenStreetMap contributors (ODbL)',
  lines: all.map((L) => ({
    id: L.id, name: L.name, ja: L.ja, colour: L.colour, kind: L.kind,
    paths: chain([...L.ways.values()]).map((p) => simplify(p, TOL[L.kind] ?? 0.0001)).filter((p) => p.length > 1),
  })).filter((L) => L.paths.length),
  stations,
  days,
};
const json = JSON.stringify(out);
await writeFile(new URL('../public/transit.json', import.meta.url), json);
console.log(`Wrote public/transit.json: ${out.lines.length} lines, ${stations.length} stations, ${(json.length / 1024).toFixed(0)} KB`);
console.log('Lines by day:', Object.entries(days).map(([d, l]) => `D${d}:${l.length}`).join(' '));
