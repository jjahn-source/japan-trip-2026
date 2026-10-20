// The place pack: every searchable place within a short walk of each day's stops, written to
// public/places/day-N.json so search answers from the phone itself: instantly, and offline.
//
// Why at build time: the public Overpass servers are overloaded and ban clients that query them
// from every browser, or spread load across mirrors (OSM community forum, April 2026). Asking once
// here, slowly, with a real User-Agent, is what they ask for, and it means opening hours, cuisine,
// toilets and coin lockers are on the phone before anyone is hungry or lost.
//
// Sources, merged: OpenStreetMap (tags: hours, cuisine, cards, diet, step-free) and the TREK Places
// index (Overture: far more restaurants and bars in Japan, with websites). Categories come from
// src/lib/categories.ts, the same table the search box reads.
//
// Run: npm run places (builds first, because the stops are read from the built site). With the local OSM
// extracts (npm run osm, once) about a minute; asking Overpass instead is 15 minutes to an hour, and fails
// when the servers are down. PLACES_OSM=local|overpass forces one; the default uses the extracts if present.
import { readFile, writeFile, mkdir, stat } from 'node:fs/promises';
import { CATS, catsOfTags, catsOfTrek } from '../src/lib/categories.ts';
import { fold, words } from '../src/lib/textmatch.ts';
import { available as localAvailable, localOsm } from './osm-local.mjs';

const UA = 'japan-plan-c-trip-site/1.0 (private trip planner; build-time place pack)';
const RADIUS = 900; // metres from a stop: about an 11-minute walk
const OVERPASS = ['https://overpass-api.de/api/interpreter', 'https://overpass.private.coffee/api/interpreter'];
const TREK = 'https://places.liketrek.com';
// The TREK categories worth asking for by name: where Overture knows far more than OSM in Japan.
const TREK_ASK = ['restaurant', 'japanese_restaurant', 'ramen_restaurant', 'sushi_restaurant', 'coffee_shop', 'bar', 'sake_bar', 'cocktail_bar', 'karaoke', 'dance_club', 'arcade', 'dessert_shop'];

// The trip as the build wrote it (src/pages/trip-data.json.ts), so build first.
const trip = JSON.parse(await readFile(new URL('../dist/trip-data.json', import.meta.url), 'utf8'));
const stops = trip.stops.filter((s) => s.lat != null);

const km = (a, b) => {
  const r = Math.PI / 180, dLat = (b.lat - a.lat) * r, dLng = (b.lng - a.lng) * r;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(dLng / 2) ** 2;
  return 12742 * Math.asin(Math.sqrt(h));
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function pool(items, n, fn) {
  let next = 0;
  await Promise.all(Array.from({ length: n }, async () => { while (next < items.length) { const i = next++; await fn(items[i], i); } }));
}

// Kept for a day, so a rerun after a failure doesn't ask again.
const CACHE = new URL('../data/.places-cache.json', import.meta.url);
const fresh = await stat(CACHE).then((st) => Date.now() - st.mtimeMs < 864e5).catch(() => false);
const cache = fresh ? JSON.parse(await readFile(CACHE, 'utf8')) : {};
const saveCache = () => writeFile(CACHE, JSON.stringify(cache));

// ── 1. Areas: stops chained within 3 km, one Overpass box each ──
const groups = [];
for (const s of stops) {
  const g = groups.find((x) => x.some((o) => km(o, s) < 3));
  if (g) g.push(s); else groups.push([s]);
}
const pad = RADIUS / 111000 + 0.001;
const boxes = groups.map((g) => {
  const la = g.map((s) => s.lat), lo = g.map((s) => s.lng), pl = pad / Math.cos((la[0] * Math.PI) / 180);
  return [Math.min(...la) - pad, Math.min(...lo) - pl, Math.max(...la) + pad, Math.max(...lo) + pl].map((x) => +x.toFixed(4));
});
console.log(`${stops.length} stops in ${boxes.length} areas`);

// ── 2. OpenStreetMap: one query per area, one mirror at a time, paced ──
const sels = CATS.flatMap((c) => c.osm ?? []);
async function overpass(box) {
  const key = `osm:${box.join(',')}`;
  if (cache[key]) return cache[key];
  // Declared limits count against the server's budget (a request is admitted only if they fit in half of what
  // is free), so ask for what an area needs: the densest one, Shinjuku, is under 20,000 elements.
  const q = `[out:json][timeout:60][maxsize:134217728][bbox:${box.join(',')}];(${sels.map((s) => `nwr${s};`).join('')});out center tags;`;
  for (let attempt = 0; attempt < 6; attempt++) {
    const url = OVERPASS[attempt % OVERPASS.length];
    try {
      const res = await fetch(url, { method: 'POST', body: new URLSearchParams({ data: q }), headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(150000) });
      if (res.ok) {
        const els = (await res.json()).elements ?? [];
        cache[key] = els; await saveCache();
        return els;
      }
      console.log(`  ${new URL(url).host} ${res.status}; waiting`);
    } catch (e) { console.log(`  ${new URL(url).host} ${e.name}; waiting`); }
    if (attempt % OVERPASS.length === OVERPASS.length - 1) await sleep(30000); // the Overpass wiki: after a 429 or 406, pause 30 s
  }
  console.log(`  gave up on area ${box.join(',')}`);
  return null; // not []: an area that failed must not look like an area with nothing in it
}
const osm = [];
let todo = boxes;
// The local Geofabrik extracts when they are there (seconds, repeatable, no server to depend on); Overpass
// for an area they don't cover, or when asked: PLACES_OSM=overpass. `npm run osm` fetches the extracts.
const mode = process.env.PLACES_OSM ?? 'auto';
if (mode !== 'overpass') {
  if (await localAvailable()) {
    const local = await localOsm(boxes, sels);
    osm.push(...local.elements);
    todo = local.missing;
  } else if (mode === 'local') throw new Error('PLACES_OSM=local, but osmium or the extracts are missing: brew install osmium-tool && npm run osm');
  else console.log('no local OSM extracts (npm run osm); asking Overpass');
}
const failed = [];
for (const [i, box] of todo.entries()) {
  const els = await overpass(box);
  console.log(`OSM area ${i + 1}/${todo.length}: ${els ? els.length : 'failed'} elements`);
  if (els) osm.push(...els); else failed.push(box);
  await sleep(1500);
}
// One more go at the areas that failed, after the servers have had time to recover.
if (failed.length) {
  await sleep(60000);
  for (const box of failed) {
    const els = await overpass(box);
    console.log(`OSM retry ${box.join(',')}: ${els ? els.length : 'failed again'} elements`);
    if (els) osm.push(...els);
  }
}

// ── 3. TREK Places: nearest by category around each distinct stop ──
const centres = [];
for (const s of stops) if (!centres.some((c) => km(c, s) < 0.45)) centres.push(s);
const trek = [];
let asked = 0;
await pool(centres.flatMap((c) => TREK_ASK.map((cat) => [c, cat])), 6, async ([c, cat]) => {
  const key = `trek:${c.lat.toFixed(4)},${c.lng.toFixed(4)}:${cat}`;
  if (!cache[key]) {
    try {
      const res = await fetch(`${TREK}/v1/nearby?lat=${c.lat}&lng=${c.lng}&radius=700&limit=30&category=${cat}&lang=en`, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(20000) });
      cache[key] = res.ok ? (await res.json()).results ?? [] : [];
    } catch { cache[key] = []; }
    if (++asked % 50 === 0) { console.log(`TREK ${asked} asked`); await saveCache(); }
  }
  trek.push(...cache[key]);
});
await saveCache();
console.log(`TREK: ${trek.length} hits around ${centres.length} spots`);

// ── 4. One shape, merged, deduplicated ──
const F = { card: 1, wheelchair: 2, vegetarian: 4, halal: 8, nosmoking: 16, free: 32 };
const yes = (v) => /^(yes|only|designated)$/.test(v ?? '');
const places = new Map();
for (const e of osm) {
  const t = e.tags ?? {};
  const lat = e.lat ?? e.center?.lat, lng = e.lon ?? e.center?.lon;
  if (lat == null) continue;
  const cats = catsOfTags(t);
  if (!cats.length) continue;
  const name = t['name:en'] || t.name || '';
  const named = !!name;
  // Unnamed is fine for what you need, not for what you'd visit.
  if (!named && !cats.some((k) => CATS.find((c) => c.key === k)?.need)) continue;
  const alt = [t.name !== name ? t.name : null, t['name:ja-Latn'], t['name:ja_rm'], t['brand:en'], t.brand, t['name:ja'] !== t.name ? t['name:ja'] : null, t.operator && !named ? t.operator : null].filter((x) => x && x !== name);
  const flags = (yes(t['payment:credit_cards']) || yes(t['payment:visa']) ? F.card : 0) | (t.wheelchair === 'yes' ? F.wheelchair : 0)
    | (yes(t['diet:vegetarian']) || yes(t['diet:vegan']) ? F.vegetarian : 0) | (yes(t['diet:halal']) ? F.halal : 0)
    | (t.smoking === 'no' ? F.nosmoking : 0) | (t.fee === 'no' ? F.free : 0);
  const kind = t.cuisine?.split(';')[0] ?? t.amenity ?? t.shop ?? t.tourism ?? t.leisure ?? 'place';
  places.set(`o${e.type[0]}${e.id}`, {
    id: `osm:${e.type}:${e.id}`, name, alt: [...new Set(alt)], lat, lng, cats, kind, cuisine: t.cuisine ?? '', hours: t.opening_hours ?? '',
    flags, web: t.website ?? t['contact:website'] ?? '', wd: t.wikidata ?? '', src: 'o',
  });
}
const near = [...places.values()];
let merged = 0;
for (const h of trek) {
  if (!Number.isFinite(h.lat) || !h.name) continue;
  const id = `trek:${h.gers}`;
  if (places.has(id)) continue;
  const f = fold(h.name);
  const twin = near.find((p) => Math.abs(p.lat - h.lat) < 0.0008 && Math.abs(p.lng - h.lng) < 0.001 && p.name && km(p, h) < 0.07
    && (fold(p.name).includes(f) || f.includes(fold(p.name)) || p.alt.some((a) => fold(a) === f)));
  if (twin) { // the same shop in both: OSM keeps its tags, the index adds what it knows
    merged++;
    if (!twin.web && h.contact?.website) twin.web = h.contact.website;
    if (!twin.hours && h.hours?.osm) twin.hours = h.hours.osm;
    if (twin.src === 'o') twin.src = 'ot';
    for (const k of catsOfTrek(h.category, h.name)) if (!twin.cats.includes(k)) twin.cats.push(k);
    continue;
  }
  const cats = catsOfTrek(h.category, h.name);
  if (!cats.length) continue;
  const p = { id, name: h.name, alt: h.brand?.name && h.brand.name !== h.name ? [h.brand.name] : [], lat: h.lat, lng: h.lng, cats, kind: h.category ?? 'place', cuisine: '', hours: h.hours?.osm ?? '', flags: 0, web: h.contact?.website ?? '', wd: h.brand?.wikidata ?? '', src: 't' };
  places.set(id, p); near.push(p);
}
console.log(`${places.size} places (${merged} found in both sources)`);

// ── 5. One file per day: what's within RADIUS of that day's stops ──
const out = new URL('../public/places/', import.meta.url);
await mkdir(out, { recursive: true });
const index = { generated: new Date().toISOString(), radius: RADIUS, cats: CATS.map((c) => c.key), days: {} };
const ci = Object.fromEntries(CATS.map((c, i) => [c.key, i]));
let total = 0;
for (const d of [...new Set(stops.map((s) => s.d))].sort((a, b) => a - b)) {
  const ds = stops.filter((s) => s.d === d);
  const rows = [];
  for (const p of places.values()) {
    if (!ds.some((s) => Math.abs(s.lat - p.lat) < 0.012 && km(s, p) <= RADIUS / 1000)) continue;
    // [name, alt names, lat, lng, category indexes, cuisine, hours, flags, website, wikidata, source, short id,
    //  search keys: each name folded (src/lib/textmatch.ts), words space-separated, names |-separated —
    //  folded here once rather than on every phone, where Unicode normalisation is the slow part]
    // Short ids: OSM as n123/w123/r123; the index's GERS id cut to 16 hex (twins are matched by place too).
    const sid = p.id.startsWith('osm:') ? `${p.id[4]}${p.id.split(':')[2]}` : `t${p.id.slice(5).replace(/-/g, '').slice(0, 16)}`;
    const k = [...new Set([p.name, ...p.alt].filter(Boolean).map((n) => words(n).join(' ')))].join('|');
    rows.push([p.name, p.alt.join('|'), Math.round(p.lat * 1e5), Math.round(p.lng * 1e5), p.cats.map((k) => ci[k]), p.cuisine, p.hours, p.flags, p.web, p.wd, p.src, sid, k]);
  }
  const body = JSON.stringify({ day: d, rows });
  await writeFile(new URL(`day-${d}.json`, out), body);
  index.days[d] = { count: rows.length, bytes: body.length, at: ds.map((s) => [Math.round(s.lat * 1e5), Math.round(s.lng * 1e5)]) };
  total += body.length;
  console.log(`Day ${d}: ${rows.length} places, ${(body.length / 1024).toFixed(0)} kB`);
}
await writeFile(new URL('index.json', out), JSON.stringify(index));
console.log(`Wrote public/places/ (${(total / 1048576).toFixed(1)} MB before compression)`);
