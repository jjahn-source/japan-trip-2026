// How you actually get from each stop to the next, written to public/legs.json.
//
// Each leg's mode comes from the plan's own words ("Then: ropeway down to Tōgendai", "Getting there:
// Ōedo line direct", "Van to Ninja House", "10:45 boat"), falling back to distance (a short hop is a
// walk, anything longer is the train). Then:
//   rail  → shortest trip on the real rail network (public/transit.json): walk to a station, ride the
//           lines (preferring the ones the plan names), change at stations, walk from the last one;
//   walk  → along streets (OSRM foot profile, routing.openstreetmap.de);
//   bus / car → along roads (OSRM car profile);
//   boat  → straight across the water.
// Routing results are cached in data/.routing-cache.json, so reruns are quick.
//
// Run: npm run legs (after npm run transit; builds first, because the stops come from the built site).
import { readFile, writeFile } from 'node:fs/promises';

const UA = 'japan-plan-c-trip-site/1.0 (private trip planner)';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const R = 6371000, rad = Math.PI / 180;
const dist = (a, b) => { // metres between [lng, lat] points
  const dLat = (b[1] - a[1]) * rad, dLng = (b[0] - a[0]) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a[1] * rad) * Math.cos(b[1] * rad) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
};

// The trip as the build wrote it (src/pages/trip-data.json.ts), so build first.
const trip = JSON.parse(await readFile(new URL('../dist/trip-data.json', import.meta.url), 'utf8'));
const transit = JSON.parse(await readFile(new URL('../public/transit.json', import.meta.url), 'utf8'));
const plan = await readFile(new URL('../data/japan-plan-c.md', import.meta.url), 'utf8');
// The itinerary agent's plan (data/itinerary.json), when there is one, is what the site shows: read its
// own words about each hop instead of the TREK export's.
const itinerary = await readFile(new URL('../data/itinerary.json', import.meta.url), 'utf8').then(JSON.parse).catch(() => null);

// ── The plan's words about each stop, by stop id (blocks are "### HH:MM–HH:MM · Name").
const blocks = {};
if (itinerary && process.env.TRIP_SOURCE !== 'trek') {
  for (const d of itinerary.days) for (const s of d.stops) blocks[s.id] = `**Plan:** ${s.plan ?? ''}\n**Then:** ${s.transport ?? ''}\n`;
} else {
  const parts = plan.split(/^## Day (\d+)\b/m);
  for (let i = 1; i < parts.length; i += 2) {
    const d = +parts[i];
    parts[i + 1].split(/^### /m).slice(1).forEach((b, k) => { blocks[`d${String(d).padStart(2, '0')}-s${String(k + 1).padStart(2, '0')}`] = b; });
  }
}
const briefing = {};
if (itinerary && process.env.TRIP_SOURCE !== 'trek') {
  for (const d of itinerary.days) briefing[d.n] = d.notes.map((x) => x.text).join(' ');
} else {
  const parts = plan.split(/^## Day (\d+)\b/m);
  for (let i = 1; i < parts.length; i += 2) briefing[+parts[i]] = parts[i + 1].split(/^### /m)[0].split('\n').filter((l) => l.startsWith('>')).join(' ');
}
const field = (b, label) => (b?.match(new RegExp(`\\*\\*${label}:\\*\\*\\s*(.+)`)) ?? [])[1] ?? '';

// ── Mode from words: the vehicle mentioned first is the one for this hop ("ropeway down to Tōgendai
// for the 10:45 boat" is the ropeway). "Walk" only counts when no vehicle is named ("5 min walk to the
// K bus" is the bus).
const VEHICLES = [
  ['rail', /\b(ropeway|cable ?car|tozan|line|train|subway|metro|jr|shinkansen|nozomi|hikari|kodama|romancecar|monorail|yurikamome|tram|streetcar|rapid|express|loop)\b|ōedo|oedo/],
  ['boat', /\b(boat|ferry|cruise|pirate ship|yakatabune|water bus)\b/],
  ['bus', /\b(bus|coach|limousine)\b/],
  ['car', /\b(van|taxi|uber|drive)\b|(?<!cable |first |last )\bcar\b/],
];
function modeOf(text) {
  const t = text.toLowerCase();
  let best = null, at = Infinity;
  for (const [mode, re] of VEHICLES) { const m = re.exec(t); if (m && m.index < at) { at = m.index; best = mode; } }
  if (best) return best;
  if (/\b(walk|on foot|stroll|wander|min walk)\b/.test(t)) return 'walk';
  return null;
}
/** The day's briefing ("K bus ~14:03 to Amazake-chaya → … → H bus 14:58 → Yunessun"): the last vehicle
 *  named in the stretch just before the next stop's name. */
function fromBriefing(dayText, stopName) {
  const key = stopName.split(/ — | \(|,| → /)[0].trim();
  const i = key.length >= 4 ? dayText.toLowerCase().indexOf(key.toLowerCase()) : -1;
  if (i < 0) return null;
  const before = dayText.slice(Math.max(0, i - 70), i).toLowerCase();
  let best = null, at = -1;
  for (const [mode, re] of VEHICLES) { const g = new RegExp(re.source, 'g'); let m; while ((m = g.exec(before))) if (m.index > at) { at = m.index; best = mode; } }
  return best;
}

// Lines the words name, matched against the network (same vocabulary as scripts/transit.mjs).
const NAMED = [
  [/[ŌO]edo/i, /大江戸線|^[ŌO]edo Line/i], [/Nozomi|Hikari|Kodama|Shinkansen/i, /新幹線/], [/Romancecar|Odakyu/i, /小田急|Odakyu/i],
  [/Tozan/i, /箱根登山|Hakone Tozan/i], [/cable ?car/i, /Cable/i], [/ropeway/i, /Ropeway|ロープウェイ/i], [/Kintetsu/i, /近鉄|Kintetsu/i],
  [/Hanshin|Namba line/i, /阪神|Hanshin/i], [/Mid[oō]suji/i, /御堂筋|Mid[oō]suji/i], [/Ch[uū][oō] line/i, /中央線|Ch[uū][oō]/i],
  [/\bMita\b/i, /三田線|Mita Line/i], [/Yurikamome/i, /ゆりかもめ|Yurikamome/i], [/Setagaya line/i, /世田谷線|Setagaya/i],
  [/Shinjuku line/i, /都営新宿線|Toei Shinjuku/i], [/Rinkai/i, /りんかい|Rinkai/i], [/Keikyu/i, /京急|Keiky[uū]/i],
  [/Hibiya/i, /日比谷線|Hibiya/i], [/Ginza line/i, /銀座線|Ginza Line/i], [/Fukutoshin/i, /副都心線|Fukutoshin/i],
  [/Chiyoda/i, /千代田線|Chiyoda/i], [/Asakusa line/i, /浅草線|Asakusa Line/i], [/Karasuma/i, /烏丸線|Karasuma/i],
  [/Loop line/i, /大阪環状線|Osaka Loop/i], [/Yumesaki/i, /ゆめ咲|桜島線|Yumesaki|Sakurajima/i], [/S[oō]bu/i, /総武|S[oō]bu/i],
  [/Hankyu/i, /阪急|Hankyu/i], [/Yamanote/i, /山手線|Yamanote/i], [/tram|streetcar|Hiroden/i, /広島電鉄|広電|Hiroden/i],
  [/Nara line/i, /奈良線|Nara Line/i], [/Keihan/i, /京阪|Keihan/i], [/Sagano|San-?in/i, /嵯峨野|山陰|Sagano/i],
  [/Hanz[oō]mon/i, /半蔵門|Hanz[oō]mon/i], [/Den-?en-?toshi/i, /田園都市|Den-?en-?toshi/i], [/Marunouchi/i, /丸ノ内|Marunouchi/i],
  [/Inokashira/i, /井の頭|Inokashira/i], [/Keio (line|railway|new line)/i, /京王線|京王新線|Keio Line|Keio New Line/i],
  [/Seibu Ikebukuro/i, /西武鉄道池袋線|Seibu Ikebukuro/i], [/Seibu Shinjuku/i, /西武新宿線|Seibu Shinjuku/i],
  [/Saiky[oō]/i, /埼京|Saiky[oō]/i], [/Yotsubashi/i, /四つ橋|Yotsubashi/i], [/Sakaisuji/i, /堺筋|Sakaisuji/i],
  [/T[oō]zai/i, /東西線|T[oō]zai/i], [/T[oō]yoko/i, /東横|T[oō]yoko/i], [/Nankai/i, /南海|Nankai/i],
  [/Namboku/i, /南北線|Namboku/i], [/Nagahori/i, /長堀|Nagahori/i], [/JR Kyoto|Kyoto line/i, /JR東海道本線|^JR Kyoto/i],
];
// Stations the plan names for a hop ("walk to Yoyogi", "Momodani"): boarding and getting off there
// wins over a slightly closer station it doesn't mention.
const fold = (x) => x.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');
const namedStations = (text) => {
  const t = fold(text);
  const out = new Set();
  transit.stations.forEach((st, i) => {
    const names = [st.name, ...(st.name.match(/['"(（]([^'")）]+)['")）]/g) ?? []).map((m) => m.slice(1, -1)), st.name.split(/\s+['"(]/)[0]];
    if (names.some((n) => { const f = fold(n); return f.length >= 4 && t.includes(f); })) out.add(i);
  });
  return out;
};
const namedLines = (text) => {
  const ids = new Set();
  // Everyday lines only: a through-service relation ("Denentoshi bypass line") would win over the two
  // lines the plan names and hide the change between them.
  for (const [said, name] of NAMED) if (said.test(text)) for (const L of transit.lines) if (name.test(`${L.name} ${L.ja}`) && !/bypass|直通/i.test(`${L.name} ${L.ja}`)) ids.add(L.id);
  return ids;
};

// ── Rail graph. Nodes: points along each line's paths, plus a hub node per station. Riding along a
// line costs time at that line's speed; boarding or alighting goes through a station hub.
const SPEED = { shinkansen: 3300, jr: 650, rail: 620, subway: 540, monorail: 500, tram: 250, funicular: 150, ropeway: 200 }; // metres a minute
const nodes = []; // { p: [lng, lat], line?, station? }
const adj = [];   // adj[i] = [[j, minutes, kind]]
const addNode = (n) => { nodes.push(n); adj.push([]); return nodes.length - 1; };
const link = (a, b, min, kind) => { adj[a].push([b, min, kind]); adj[b].push([a, min, kind]); };

// Grid of line segments, to drop each station onto the lines that pass it.
const CELL = 0.004; // ~400 m
const cellKey = (lng, lat) => `${Math.floor(lng / CELL)},${Math.floor(lat / CELL)}`;
const segGrid = new Map();
transit.lines.forEach((L, li) => L.paths.forEach((p, pi) => p.forEach((pt, k) => {
  if (k === 0) return;
  const a = p[k - 1];
  // A long simplified segment can cross many cells: walk along it.
  const steps = Math.max(1, Math.ceil(Math.max(Math.abs(pt[0] - a[0]), Math.abs(pt[1] - a[1])) / (CELL / 2)));
  const keys = new Set();
  for (let s = 0; s <= steps; s++) keys.add(cellKey(a[0] + ((pt[0] - a[0]) * s) / steps, a[1] + ((pt[1] - a[1]) * s) / steps));
  for (const key of keys) { if (!segGrid.has(key)) segGrid.set(key, []); segGrid.get(key).push([li, pi, k]); }
})));
function project(p, a, b) { // closest point on segment ab to p (planar approximation, fine at this scale)
  const kx = Math.cos(p[1] * rad);
  const ax = a[0] * kx, ay = a[1], bx = b[0] * kx, by = b[1], px = p[0] * kx, py = p[1];
  const dx = bx - ax, dy = by - ay, len = dx * dx + dy * dy;
  const t = len ? Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / len)) : 0;
  return { t, q: [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t] };
}
// Ropeway and cable-car stops aren't railway=station in OSM: add a stop at each end of their track.
for (const L of transit.lines) {
  if (L.kind !== 'ropeway' && L.kind !== 'funicular') continue;
  for (const path of L.paths) for (const p of [path[0], path.at(-1)]) {
    if (transit.stations.some((st) => dist(p, [st.lng, st.lat]) < 120)) continue;
    const near = transit.stations.map((st) => ({ st, d: dist(p, [st.lng, st.lat]) })).sort((a, b) => a.d - b.d)[0];
    transit.stations.push({ name: near && near.d < 600 ? near.st.name : `${L.name} stop`, ja: '', lng: p[0], lat: p[1] });
  }
}
// Insertions: for each station, the nearest spot on each passing line within 220 m. Some lines come
// as one path that runs out to the terminus and back (OSM's two directions chained, e.g. the Tōkyū
// Setagaya Line), others as one path per track (the Ginza Line). With one stop per line, a ride
// between two stations that landed on different tracks ran to the terminus and back, so the station
// also goes on the line's other passes when they're about as close (the other track).
const inserts = new Map(); // `${li}:${pi}` → [{ k, t, q, s, d }]
transit.stations.forEach((st, si) => {
  const p = [st.lng, st.lat];
  const best = new Map(); // li → { d, pi, k, t, q }
  const near = new Map(); // `${li}:${pi}` → [{ d, k, t, q }]
  const [cx, cy] = [Math.floor(st.lng / CELL), Math.floor(st.lat / CELL)];
  for (let x = cx - 1; x <= cx + 1; x++) for (let y = cy - 1; y <= cy + 1; y++) {
    for (const [li, pi, k] of segGrid.get(`${x},${y}`) ?? []) {
      const path = transit.lines[li].paths[pi];
      const { t, q } = project(p, path[k - 1], path[k]);
      const d = dist(p, q);
      if (d > 220) continue;
      if (!best.has(li) || d < best.get(li).d) best.set(li, { d, pi, k, t, q });
      const key = `${li}:${pi}`;
      if (!near.has(key)) near.set(key, []);
      near.get(key).push({ d, k, t, q });
    }
  }
  for (const [li, b] of best) {
    for (const [key, list] of near) {
      if (!key.startsWith(`${li}:`)) continue;
      // Each pass of the track near the station (a run of segments along the path), at its nearest
      // spot; on the best path, the best spot itself is one of them.
      const pi = Number(key.slice(key.indexOf(':') + 1));
      const segs = [...list].sort((a, c) => a.k - c.k);
      const passes = [];
      for (const x of segs) { const last = passes.at(-1); if (last && x.k - last.at(-1).k <= 2) last.push(x); else passes.push([x]); }
      for (const pass of passes) {
        const o = pass.reduce((m, x) => (x.d < m.d ? x : m));
        const isBest = pi === b.pi && pass.some((x) => x.k === b.k);
        if (!isBest && o.d > b.d + 60) continue;
        if (!inserts.has(key)) inserts.set(key, []);
        inserts.get(key).push(isBest ? { k: b.k, t: b.t, q: b.q, s: si, d: b.d } : { k: o.k, t: o.t, q: o.q, s: si, d: o.d });
      }
    }
  }
});
// Station hubs.
const hub = transit.stations.map((st) => addNode({ p: [st.lng, st.lat], station: st.name }));
// Line nodes, with station stops spliced in.
transit.lines.forEach((L, li) => L.paths.forEach((path, pi) => {
  const ins = (inserts.get(`${li}:${pi}`) ?? []).sort((a, b) => a.k - b.k || a.t - b.t);
  const seq = [];
  let n = 0;
  path.forEach((pt, k) => {
    while (n < ins.length && ins[n].k === k) { seq.push({ p: ins[n].q, s: ins[n].s, d: ins[n].d }); n++; }
    seq.push({ p: pt });
  });
  let prev = -1;
  for (const s of seq) {
    const id = addNode({ p: s.p, line: li });
    if (prev >= 0) link(prev, id, dist(nodes[prev].p, s.p) / (SPEED[L.kind] ?? 600), 'ride');
    if (s.s != null) link(id, hub[s.s], 1.5 + s.d / 75, 'board'); // step on or off, plus the walk across the station
    prev = id;
  }
}));
// A line's track comes in several pieces (OSM splits it); join each piece's ends to the nearest point
// of the same line within 500 m, so trains can run through.
{
  const byLine = new Map(); // li → [node ids]
  const ends = [];
  let prevLine = -1, prevId = -1;
  nodes.forEach((n, id) => {
    if (n.line == null) return;
    if (!byLine.has(n.line)) byLine.set(n.line, []);
    byLine.get(n.line).push(id);
    // A piece starts where a line node has no 'ride' link back to the previous node.
    if (n.line !== prevLine || !adj[id].some(([v, , k]) => v === prevId && k === 'ride')) { if (prevId >= 0 && nodes[prevId].line != null) ends.push(prevId); ends.push(id); }
    prevLine = n.line; prevId = id;
  });
  if (prevId >= 0) ends.push(prevId);
  let joined = 0;
  for (const e of ends) {
    const li = nodes[e].line;
    let best = -1, bd = 500;
    for (const id of byLine.get(li)) {
      if (id === e || adj[e].some(([v]) => v === id)) continue;
      const d = dist(nodes[e].p, nodes[id].p);
      if (d < bd && !(Math.abs(id - e) < 3)) { bd = d; best = id; }
    }
    if (best >= 0) { link(e, best, bd / (SPEED[transit.lines[li].kind] ?? 600) + 0.2, 'ride'); joined++; }
  }
  console.log(`Joined ${joined} track-piece ends`);
}
console.log(`Rail graph: ${nodes.length} nodes, ${transit.stations.length} stations`);

// Dijkstra between two street points: walk to nearby stations, ride, walk off.
class Heap {
  constructor() { this.a = []; }
  get size() { return this.a.length; }
  push(x) { const a = this.a; a.push(x); let i = a.length - 1; while (i) { const p = (i - 1) >> 1; if (a[p][0] <= a[i][0]) break; [a[p], a[i]] = [a[i], a[p]]; i = p; } }
  pop() {
    const a = this.a; const top = a[0]; const last = a.pop();
    if (a.length) { a[0] = last; let i = 0; for (;;) { const l = 2 * i + 1, r = l + 1; let m = i; if (l < a.length && a[l][0] < a[m][0]) m = l; if (r < a.length && a[r][0] < a[m][0]) m = r; if (m === i) break; [a[m], a[i]] = [a[i], a[m]]; i = m; } }
    return top;
  }
}
const WALK = 75; // metres a minute
const SERVICE = /Limited Express|特急|急行|Bypass|service|Direct|Train\b|Rakuraku|Narita|Chichibu|Kinugawa|Hitachi|Sagami|Azusa|Enoshima|Mt\.? ?Fuji|Shonan-Shinjuku|Express|Exp\.|Rapid|Local$|Liner|Romance|Skyliner|Access|Super |Hakone$|はこね|Comm\./i;
const isLine = (L) => !SERVICE.test(L.name) && (/Line|線|Shinkansen|Yurikamome|Ropeway|Cable|Monorail/i.test(`${L.name} ${L.ja}`));
const nearStations = (p, max = 1300, k = 8) => transit.stations.map((st, i) => ({ i, d: dist(p, [st.lng, st.lat]) }))
  .filter((x) => x.d <= max).sort((a, b) => a.d - b.d).slice(0, k);
const DEBUG_BAN = process.env.DEBUG_BAN ? new RegExp(process.env.DEBUG_BAN, 'i') : null;
function railRoute(from, to, prefer, daily, named = new Set()) {
  const starts = nearStations(from).length ? nearStations(from) : nearStations(from, 4000, 4);
  const endList = nearStations(to).length ? nearStations(to) : nearStations(to, 4000, 4); // an island: the last stretch is the ferry
  const ends = new Map(endList.map((x) => [hub[x.i], named.has(x.i) ? x.d * 0.6 : x.d]));
  if (!starts.length || !ends.size) return null;
  const namedNames = new Set([...named].map((i) => transit.stations[i].name));
  const cost = new Float64Array(nodes.length).fill(Infinity), prev = new Int32Array(nodes.length).fill(-1);
  const h = new Heap();
  for (const s of starts) { cost[hub[s.i]] = ((named.has(s.i) ? s.d * 0.6 : s.d) * 1.25) / WALK; h.push([cost[hub[s.i]], hub[s.i]]); }
  let best = Infinity, bestEnd = -1;
  while (h.size) {
    const [c, u] = h.pop();
    if (c > cost[u] || c >= best) continue;
    if (ends.has(u)) { const total = c + (ends.get(u) * 1.25) / WALK; if (total < best) { best = total; bestEnd = u; } }
    for (const [v, m, kind] of adj[u]) {
      let w = m;
      if (kind === 'ride') {
        const L = transit.lines[nodes[u].line];
        w *= prefer.has(L.id) ? 0.2 : daily.has(L.id) ? 0.75 : 1; // the plan named it: take it
        if ((L.kind === 'shinkansen' || /新幹線|Shinkansen|Hitachi|ひたち|Tokiwa/i.test(`${L.name} ${L.ja}`)) && !prefer.has(L.id)) w *= 6; // only when the plan says so (it's a separate ticket)
        if (SERVICE.test(L.name)) w *= 1.15; // on shared track, name the everyday line, not an express service
        if (DEBUG_BAN && DEBUG_BAN.test(L.name)) w *= 50; // DEBUG_BAN=Odakyu: compare against the route without a line
      }
      if (kind === 'board' && nodes[u].station != null) w += 2; // waiting for the train
      if (kind === 'board' && nodes[v].line != null && prefer.has(transit.lines[nodes[v].line].id)) w *= 0.5; // a change the plan tells you to make
      else if (kind === 'board' && nodes[v].line != null && prefer.size) w += 6; // the plan named its lines: leave them only for a clear gain
      if (kind === 'board' && (namedNames.has(nodes[u].station) || namedNames.has(nodes[v].station))) w *= 0.7; // change where the plan says (Gotokuji, not Yamashita next door)
      const nc = c + w;
      if (nc < cost[v]) { cost[v] = nc; prev[v] = u; h.push([nc, v]); }
    }
  }
  if (bestEnd < 0) return null;
  const chain = [];
  for (let u = bestEnd; u >= 0; u = prev[u]) chain.push(u);
  chain.reverse();
  // Collapse into ride segments per line, with the stations you get on and off at.
  const rides = [];
  for (let i = 0; i < chain.length; i++) {
    const n = nodes[chain[i]];
    if (n.line == null) continue;
    const last = rides.at(-1);
    if (last && last.line === n.line && nodes[chain[i - 1]]?.line === n.line) last.coords.push(n.p);
    else rides.push({ line: n.line, coords: [n.p], on: nodes[chain[i - 1]]?.station ?? null, off: null });
    const next = nodes[chain[i + 1]];
    if (next?.station != null) rides.at(-1).off = next.station;
  }
  // The real time along the chosen path (the search cost above is weighted towards the plan's lines
  // and stations, so it isn't a duration): rides and transfers as timed, a wait at each boarding,
  // and the walks at both ends.
  let minutes = 0;
  for (let i = 1; i < chain.length; i++) {
    const e = adj[chain[i - 1]].find(([v]) => v === chain[i]);
    if (!e) continue;
    minutes += e[1];
    if (e[2] === 'board' && nodes[chain[i - 1]].station != null) minutes += 2;
  }
  const walkOn = starts.find((x) => hub[x.i] === chain[0])?.d ?? 0, walkOff = endList.find((x) => hub[x.i] === chain.at(-1))?.d ?? 0;
  minutes += ((walkOn + walkOff) * 1.25) / WALK;
  return { cost: best, minutes, startStation: nodes[chain[0]], endStation: nodes[chain.at(-1)], rides: rides.filter((r) => r.coords.length > 1) };
}

// A ride booked on an express service's relation gets the name of the everyday line on the same
// track: the canonical line that passes within 80 m of the ride at a quarter, half and three quarters.
function canonical(li, coords) {
  const L = transit.lines[li];
  if (isLine(L) || coords.length < 2) return L;
  const at = (f) => coords[Math.min(coords.length - 1, Math.floor(f * (coords.length - 1)))];
  const samples = [at(0.25), at(0.5), at(0.75)];
  const votes = new Map();
  for (const p of samples) {
    const [cx, cy] = [Math.floor(p[0] / CELL), Math.floor(p[1] / CELL)];
    const hit = new Set();
    for (let x = cx - 1; x <= cx + 1; x++) for (let y = cy - 1; y <= cy + 1; y++) for (const [l2, pi, k] of segGrid.get(`${x},${y}`) ?? []) {
      if (l2 === li || hit.has(l2) || !isLine(transit.lines[l2]) || (transit.lines[l2].kind === 'shinkansen') !== (L.kind === 'shinkansen')) continue;
      const path = transit.lines[l2].paths[pi];
      if (dist(p, project(p, path[k - 1], path[k]).q) <= 80) hit.add(l2);
    }
    for (const l2 of hit) votes.set(l2, (votes.get(l2) ?? 0) + 1);
  }
  const best = [...votes].filter(([, v]) => v === 3).sort((a, b) => transit.lines[a[0]].name.length - transit.lines[b[0]].name.length)[0];
  return best ? transit.lines[best[0]] : L;
}

// ── Street routing (OSRM), cached.
const CACHE_URL = new URL('../data/.routing-cache.json', import.meta.url);
const cache = await readFile(CACHE_URL, 'utf8').then(JSON.parse).catch(() => ({}));
let calls = 0;
async function street(profile, a, b) {
  const key = `${profile}:${a.map((x) => x.toFixed(5))}:${b.map((x) => x.toFixed(5))}`;
  if (cache[key]) return cache[key];
  if (dist(a, b) < 40) return (cache[key] = { coords: [a, b], m: dist(a, b) });
  const url = `https://routing.openstreetmap.de/routed-${profile}/route/v1/driving/${a[0]},${a[1]};${b[0]},${b[1]}?overview=full&geometries=geojson`;
  for (let i = 0; i < 5; i++) {
    try {
      if (calls++) await sleep(1100);
      const res = await fetch(url, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(30000) });
      if (res.ok) {
        const r = (await res.json()).routes?.[0];
        if (r) return (cache[key] = { coords: r.geometry.coordinates, m: r.distance });
      }
    } catch { /* retry */ }
    await sleep(3000 * (i + 1));
  }
  return { coords: [a, b], m: dist(a, b) }; // couldn't route: draw it straight rather than fail
}

// Douglas–Peucker (degrees) + 5-decimal rounding.
function simplify(pts, tol = 0.00004) {
  if (pts.length < 3) return pts.map(([x, y]) => [+x.toFixed(5), +y.toFixed(5)]);
  const keep = new Uint8Array(pts.length); keep[0] = keep[pts.length - 1] = 1;
  const stack = [[0, pts.length - 1]];
  while (stack.length) {
    const [a, b] = stack.pop(); let max = 0, idx = -1;
    const [x1, y1] = pts[a], [x2, y2] = pts[b]; const dx = x2 - x1, dy = y2 - y1, len = dx * dx + dy * dy;
    for (let i = a + 1; i < b; i++) { const [x, y] = pts[i]; const t = len ? Math.max(0, Math.min(1, ((x - x1) * dx + (y - y1) * dy) / len)) : 0; const d = (x - x1 - t * dx) ** 2 + (y - y1 - t * dy) ** 2; if (d > max) { max = d; idx = i; } }
    if (max > tol * tol) { keep[idx] = 1; stack.push([a, idx], [idx, b]); }
  }
  return pts.filter((_, i) => keep[i]).map(([x, y]) => [+x.toFixed(5), +y.toFixed(5)]);
}
const cleanLine = (n) => n.replace(/\s+(Local|Rapid|Express|Ltd\.? ?Exp\.?|Limited Express.*|Semi-Express|Commuter.*)$/i, '').replace(/\s+/g, ' ').trim();

// ── Legs.
const stops = trip.stops.filter((s) => s.lat != null);
const out = { generated: new Date().toISOString(), source: 'Rail: © OpenStreetMap contributors. Streets: OSRM on routing.openstreetmap.de.', days: {} };
for (const d of [...new Set(stops.map((s) => s.d))].sort((a, b) => a - b)) {
  const list = stops.filter((s) => s.d === d);
  const daily = new Set((transit.days[String(d)] ?? []).flatMap((r) => r.ids ?? [r]));
  const legs = [];
  for (let i = 0; i + 1 < list.length; i++) {
    const A = list[i], B = list[i + 1];
    const a = [A.lng, A.lat], b = [B.lng, B.lat];
    const gap = dist(a, b);
    if (gap < 60) continue; // next door: no line to draw
    const bA = blocks[A.id] ?? '', bB = blocks[B.id] ?? '';
    // What the plan says about this hop: the stop's "Then", the next stop's "Getting there", and, when
    // this stop is itself a ride ("Nozomi Shin-Osaka → Hiroshima"), its own name and plan.
    // A ride stop ("Romancecar → Hakone-Yumoto") is pinned either where it arrives (then the leg INTO it
    // is the ride: it sits next to the stop after it) or where it leaves (then the leg OUT of it is).
    const C = list[i + 2];
    const isRide = (S) => S.cat === 'transport' && /→/.test(S.name);
    const pinnedAtArrival = (S, next) => {
      // "Nozomi Shin-Osaka → Hiroshima": is the pin by a station named like the arrival or the departure?
      const [x, y] = S.name.split('→').map((t) => t.trim().split(/[ (—]/).filter(Boolean).pop()?.toLowerCase() ?? '');
      const near = (k) => k.length >= 4 && transit.stations.some((st) => st.name.toLowerCase().includes(k) && dist([S.lng, S.lat], [st.lng, st.lat]) < 2000);
      const yKey = S.name.split('→')[1]?.trim().split(/ [(—]/)[0].toLowerCase() ?? '';
      if (near(yKey)) return true;
      if (near(x)) return false;
      return !next || dist([S.lng, S.lat], [next.lng, next.lat]) < 1500;
    };
    const rideInto = isRide(B) && pinnedAtArrival(B, C) ? `${B.name} · ${field(bB, 'Plan')}` : '';
    const rideOut = isRide(A) && !pinnedAtArrival(A, B) ? `${A.name} · ${field(bA, 'Plan')}` : '';
    const said = [rideInto, rideOut, field(bA, 'Then'), field(bB, 'Getting there'), A.cat === 'transport' && !isRide(A) ? `${A.name} · ${field(bA, 'Plan')}` : ''].filter(Boolean).join(' · ');
    let mode = modeOf(said) ?? (gap >= 1300 ? fromBriefing(briefing[d] ?? '', B.name) : null) ?? (gap < 1300 ? 'walk' : 'rail');
    if (mode === 'walk' && gap > 2500) mode = 'rail'; // the word "walk" was about something else
    const prefer = namedLines(said);
    if (process.env.DEBUG_LEG === A.id) {
      // Reachability on the preferred lines alone: walk the graph through only those lines and stations.
      const ok = new Set([...prefer]);
      const seen = new Set(nearStations(a).map((x) => hub[x.i])); const q = [...seen]; let far = a[0];
      while (q.length) { const u = q.pop(); for (const [v] of adj[u]) { const n = nodes[v]; if (seen.has(v)) continue; if (n.line != null && !ok.has(transit.lines[n.line].id)) continue; seen.add(v); q.push(v); far = Math.min(far, n.p[0]); } }
      const endHubs = nearStations(b).map((x) => hub[x.i]);
      console.log('DEBUG', { said, mode, reachWestTo: far, endReached: endHubs.some((h) => seen.has(h)), ends: nearStations(b).map((x) => transit.stations[x.i].name) });
    }
    const segs = [];
    let minutes = 0, lines = [], text = '';
    if (mode === 'rail') {
      const r = railRoute(a, b, prefer, daily, namedStations(said));
      if (process.env.DEBUG_LEG === A.id && r) console.log('ROUTE cost', r.cost.toFixed(1), 'minutes', r.minutes.toFixed(1), r.rides.map((x) => `${transit.lines[x.line].name} ${x.on}→${x.off}`).join(' | '));
      const walkMin = (gap * 1.3) / WALK;
      if (!r || !r.rides.length) mode = gap < 2500 ? 'walk' : /ferry|boat/i.test(said) ? 'boat' : 'car'; // no ride in it: it's a walk
      else if (r.cost > walkMin * 0.95 && gap < 2500) mode = 'walk';
      else {
        const w1 = await street('foot', a, r.startStation.p);
        segs.push({ m: 'walk', coords: simplify(w1.coords) });
        for (const ride of r.rides) {
          const L = canonical(ride.line, ride.coords);
          segs.push({ m: L.kind === 'ropeway' || L.kind === 'funicular' ? L.kind : 'rail', line: cleanLine(L.name), colour: L.colour, coords: simplify(ride.coords, L.kind === 'shinkansen' ? 0.0003 : 0.00004), on: ride.on, off: ride.off });
        }
        if (dist(r.endStation.p, b) > 1500 && /ferry|boat/i.test(said)) segs.push({ m: 'boat', coords: [r.endStation.p, b].map(([x, y]) => [+x.toFixed(5), +y.toFixed(5)]) });
        else { const w2 = await street('foot', r.endStation.p, b); segs.push({ m: 'walk', coords: simplify(w2.coords) }); }
        minutes = Math.round(r.minutes);
        lines = [...new Set(segs.filter((x) => x.line).map((x) => x.line))];
        text = segs.filter((s) => s.line).map((s) => `${s.line}${s.on && s.off ? ` ${s.on} → ${s.off}` : ''}`).join(', then ');
      }
    }
    if (mode === 'walk') {
      const w = await street('foot', a, b);
      segs.push({ m: 'walk', coords: simplify(w.coords) });
      minutes = Math.round(w.m / WALK);
      text = `Walk ${minutes} min`;
    } else if (mode === 'bus' || mode === 'car') {
      const c = await street('car', a, b);
      segs.push({ m: mode, coords: simplify(c.coords) });
      minutes = Math.round(c.m / (mode === 'bus' ? 350 : 450));
      text = mode === 'bus' ? 'Bus' : 'By car';
    } else if (mode === 'boat') {
      segs.push({ m: 'boat', coords: [a, b].map(([x, y]) => [+x.toFixed(5), +y.toFixed(5)]) });
      minutes = Math.round(gap / 300);
      text = 'Boat';
    }
    legs.push({ from: A.id, to: B.id, mode, minutes, km: +(gap / 1000).toFixed(2), lines, text, a, b, depart: A.e, segs: segs.filter((s) => s.coords.length > 1) });
  }
  out.days[d] = legs;
  console.log(`Day ${d}: ${legs.map((l) => (l.mode === 'rail' ? `rail[${l.lines.join('+')}]` : l.mode)).join(' · ')}`);
  await writeFile(CACHE_URL, JSON.stringify(cache));
}
await writeFile(new URL('../public/legs.json', import.meta.url), JSON.stringify(out));
console.log(`Wrote public/legs.json (${(JSON.stringify(out).length / 1024).toFixed(0)} KB), ${calls} routing calls`);
