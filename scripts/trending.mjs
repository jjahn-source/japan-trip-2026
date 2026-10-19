// Trending attractions near each day's plan, written to data/trending.json.
//
// Candidates: OpenStreetMap places with a Wikidata link (attractions, museums, viewpoints,
// shrines and temples, gardens, historic sites) within a short walk of that day's stops.
// Signal: Wikipedia pageviews in Japanese and English, all of it free and keyless.
//   interest  = views over the last 30 days (Wikipedia views track same-day visits to sights)
//   rising    = last 30 days against the 30 days before
//   december  = how far last December's views ran above that average: illuminations, winter events
// Places already in the plan are left out. Photos come from Wikimedia Commons (with credit).
//
// Run: npm run trending (builds first, because the stops are read from the built site).
import { readFile, writeFile, stat } from 'node:fs/promises';

const UA = 'japan-plan-c-trip-site/1.0 (private trip planner)';
const RADIUS = 1000; // metres: about a 12-minute walk
const PER_DAY = 8;

// The trip as the build wrote it (src/pages/trip-data.json.ts), so build first.
const trip = JSON.parse(await readFile(new URL('../dist/trip-data.json', import.meta.url), 'utf8'));
const stops = trip.stops.filter((s) => s.lat != null);

const km = (a, b) => {
  const R = 6371, r = Math.PI / 180;
  const dLat = (b.lat - a.lat) * r, dLng = (b.lng - a.lng) * r;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function get(url, init = {}, tries = 6, soft = false) {
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url, { ...init, signal: AbortSignal.timeout(150000), headers: { 'User-Agent': UA, ...(init.headers ?? {}) } });
      if (res.ok) return res.json();
      if (res.status === 404) return null;
      // Wikimedia and Overpass both say how long to wait; honour it.
      const wait = Number(res.headers.get('retry-after'));
      console.log(`  ${res.status}, waiting ${wait || 2 * (i + 1)} s`);
      await sleep(((wait || 2 * (i + 1)) + 1) * 1000);
      continue;
    } catch { /* network blip: retry */ }
    await sleep(2000 * (i + 1));
  }
  if (soft) { console.log(`  skipped after ${tries} tries: ${url.slice(0, 90)}…`); return null; }
  throw new Error(`Failed: ${url}`);
}
async function pool(items, n, fn) {
  let next = 0;
  await Promise.all(Array.from({ length: n }, async () => { while (next < items.length) { const i = next++; await fn(items[i], i); } }));
}

// 1. Candidates per day from Overpass.
const KIND = (t) => {
  if (t.tourism === 'museum' || t.tourism === 'gallery') return 'museum';
  if (t.tourism === 'viewpoint') return 'view';
  if (['theme_park', 'zoo', 'aquarium'].includes(t.tourism)) return 'fun';
  if (t.amenity === 'place_of_worship') return t.religion === 'shinto' ? 'shrine' : t.religion === 'buddhist' ? 'temple' : 'worship';
  if (t.leisure === 'park' || t.leisure === 'garden') return 'garden';
  if (t.historic) return 'historic';
  return 'sight';
};
const days = [...new Set(stops.map((s) => s.d))].sort((a, b) => a - b);
const cand = new Map(); // wikidata id → candidate
// Overpass is the slow part; keep its result for a day so a retry starts at the Wikipedia step.
const CACHE = new URL('../data/.trending-candidates.json', import.meta.url);
const fresh = await stat(CACHE).then((st) => Date.now() - st.mtimeMs < 864e5).catch(() => false);
if (fresh) for (const c of JSON.parse(await readFile(CACHE, 'utf8'))) cand.set(c.qid, c);
if (fresh) console.log(`Reusing ${cand.size} cached candidates`);
for (const d of fresh ? [] : days) {
  const pts = stops.filter((s) => s.d === d);
  // One box per cluster of stops (a day can span cities); distances are checked below. Boxes are
  // far quicker for Overpass than one "around" clause per stop.
  const boxes = [];
  for (const s of pts) {
    const b = boxes.find((x) => x.some((o) => km(o, s) < 25));
    if (b) b.push(s); else boxes.push([s]);
  }
  const pad = RADIUS / 111000;
  const bb = boxes.map((g) => {
    const la = g.map((s) => s.lat), lo = g.map((s) => s.lng), pl = pad / Math.cos((la[0] * Math.PI) / 180);
    return `${Math.min(...la) - pad},${Math.min(...lo) - pl},${Math.max(...la) + pad},${Math.max(...lo) + pl}`;
  });
  const sel = (f) => bb.map((b) => `nwr(${b})${f}["wikidata"];`).join('');
  const q = `[out:json][timeout:120];(${sel('["tourism"~"^(attraction|museum|viewpoint|gallery|theme_park|zoo|aquarium)$"]')}${sel('["historic"~"^(castle|monument|memorial|ruins|archaeological_site|building|temple|shrine)$"]')}${sel('["amenity"="place_of_worship"]')}${sel('["leisure"~"^(park|garden)$"]')});out center tags;`;
  const res = await get('https://overpass-api.de/api/interpreter', { method: 'POST', body: new URLSearchParams({ data: q }) });
  let n = 0;
  for (const e of res?.elements ?? []) {
    const t = e.tags; const at = { lat: e.lat ?? e.center?.lat, lng: e.lon ?? e.center?.lon };
    if (at.lat == null || !t.wikidata) continue;
    if (stops.some((s) => km(s, at) < 0.12)) continue; // already in the plan, on any day
    const near = pts.map((s) => ({ s, k: km(s, at) })).sort((a, b) => a.k - b.k)[0];
    if (near.k > RADIUS / 1000) continue; // inside the box but not within a walk of a stop
    const c = cand.get(t.wikidata) ?? { qid: t.wikidata, nameJa: t.name, nameEn: t['name:en'], kind: KIND(t), at, days: {} };
    const prev = c.days[d];
    if (!prev || near.k < prev.km) c.days[d] = { stop: near.s.id, i: near.s.i, km: +near.k.toFixed(2) };
    cand.set(t.wikidata, c); n++;
  }
  console.log(`Day ${d}: ${n} candidates`);
  await sleep(1500);
}

if (!fresh) await writeFile(CACHE, JSON.stringify([...cand.values()]));

// 2. Wikidata: article titles, labels, photo.
const qids = [...cand.keys()];
for (let i = 0; i < qids.length; i += 50) {
  const ids = qids.slice(i, i + 50).join('|');
  const res = await get(`https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${ids}&props=sitelinks|claims|labels&sitefilter=enwiki|jawiki&languages=en|ja&format=json`, {}, 6, true);
  for (const [id, e] of Object.entries(res?.entities ?? {})) {
    const c = cand.get(id);
    if (!c) continue;
    c.en = e.sitelinks?.enwiki?.title; c.ja = e.sitelinks?.jawiki?.title;
    c.labelEn = e.labels?.en?.value; c.labelJa = e.labels?.ja?.value;
    c.photo = e.claims?.P18?.[0]?.mainsnak?.datavalue?.value ?? null;
    c.p31 = (e.claims?.P31 ?? []).map((x) => x.mainsnak?.datavalue?.value?.id).filter(Boolean);
  }
  await sleep(800);
}
// Not places to add: people (a shrine's OSM tag can point at its deity), districts we wouldn't send
// the group to, and anything the plan already visits under its own name.
const NOT_PLACES = new Set(['Q5']);
const SKIP_NAMES = /Tobita Shinchi|飛田新地|red[- ]light/i;
const planNames = stops.map((s) => s.name.toLowerCase());
const inPlan = (c) => [c.labelEn, c.en, c.labelJa, c.ja, c.nameJa, c.nameEn].filter((n) => n && n.length >= 3)
  .some((n) => { const k = n.toLowerCase(); const core = k.replace(/ (temple|shrine|park)$/, ''); return planNames.some((p) => p.includes(core.length >= 6 ? core : k)); });
const withWiki = [...cand.values()].filter((c) => (c.en || c.ja) && !(c.p31 ?? []).some((q) => NOT_PLACES.has(q))
  && !SKIP_NAMES.test(`${c.labelEn} ${c.en} ${c.ja} ${c.nameJa}`) && !inPlan(c));
console.log(`${withWiki.length} of ${cand.size} have a Wikipedia article`);

// 3. Pageviews, gently: Wikimedia throttles bursts, so requests go one at a time.
//    a) the last 60 days for 50 articles per call (MediaWiki pageviews API) → interest and rising;
//    b) monthly history only for each day's finalists → how last December ran.
const now = new Date();
const ymd = (d) => d.toISOString().slice(0, 10).replace(/-/g, '');
const lastDec = `${now.getUTCMonth() === 11 ? now.getUTCFullYear() : now.getUTCFullYear() - 1}12`;
const daily = { ja: new Map(), en: new Map() }; // title → [views by day, oldest first]
for (const wiki of ['ja', 'en']) {
  const titles = [...new Set(withWiki.map((c) => c[wiki]).filter(Boolean))];
  for (let i = 0; i < titles.length; i += 50) {
    const batch = titles.slice(i, i + 50);
    const res = await get(`https://${wiki}.wikipedia.org/w/api.php?action=query&prop=pageviews&pvipdays=60&redirects=1&format=json&formatversion=2&titles=${encodeURIComponent(batch.join('|'))}`, {}, 8, true);
    const back = new Map((res?.query?.redirects ?? []).map((r) => [r.to, r.from]));
    const norm = new Map((res?.query?.normalized ?? []).map((r) => [r.to, r.from]));
    for (const pg of res?.query?.pages ?? []) {
      const series = Object.entries(pg.pageviews ?? {}).sort(([a], [b]) => a.localeCompare(b)).map(([, v]) => v ?? 0);
      let t = pg.title; t = back.get(t) ?? t; t = norm.get(t) ?? t;
      daily[wiki].set(t, series);
    }
    console.log(`  ${wiki} pageviews ${Math.min(i + 50, titles.length)}/${titles.length}`);
    await sleep(1200);
  }
}
for (const c of withWiki) {
  const ja = daily.ja.get(c.ja) ?? []; const en = daily.en.get(c.en) ?? [];
  const sum = (a, from, to) => a.slice(from, to).reduce((x, y) => x + y, 0);
  const last = (a) => sum(a, Math.max(0, a.length - 30)); const prev = (a) => sum(a, Math.max(0, a.length - 60), Math.max(0, a.length - 30));
  c.views30 = last(ja) + last(en);
  const p = prev(ja) + prev(en);
  c.rise = p > 0 ? c.views30 / p : 1;
  c.december = 1;
}
// b) Finalists only: monthly views over the past year, to see how last December compared.
const prelim = (c) => Math.log10(1 + (c.views30 ?? 0)) * (0.7 + 0.3 * Math.min(2.5, Math.max(0.5, c.rise)));
const finalists = new Set();
for (const d of days) withWiki.filter((c) => c.days[d] && c.views30 >= 60).sort((a, b) => prelim(b) - prelim(a)).slice(0, 12).forEach((c) => finalists.add(c));
const monthStart = new Date(Date.UTC(now.getUTCFullYear() - 1, now.getUTCMonth() - 1, 1));
const monthEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 0));
let done = 0;
for (const c of finalists) {
  const wiki = c.ja ? 'ja' : 'en'; // one edition is enough for a seasonal ratio
  const t = encodeURIComponent(c[wiki].replace(/ /g, '_'));
  const res = await get(`https://wikimedia.org/api/rest_v1/metrics/pageviews/per-article/${wiki}.wikipedia/all-access/user/${t}/monthly/${ymd(monthStart)}/${ymd(monthEnd)}`, {}, 8, true);
  const months = (res?.items ?? []).map((x) => ({ m: x.timestamp.slice(0, 6), v: x.views }));
  const avg = months.length ? months.reduce((a, x) => a + x.v, 0) / months.length : 0;
  const dec = months.find((x) => x.m === lastDec);
  c.december = avg > 0 && dec ? dec.v / avg : 1;
  if (++done % 25 === 0) console.log(`  december ${done}/${finalists.size}`);
  await sleep(700);
}

// 4. Score, label, pick per day.
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
for (const c of withWiki) {
  const interest = Math.log10(1 + (c.views30 ?? 0));
  c.score = +(interest * (0.7 + 0.3 * clamp(c.rise, 0.5, 2.5)) * (0.85 + 0.15 * clamp(c.december, 0.7, 2))).toFixed(3);
  c.tag = c.rise >= 1.4 ? 'rising' : c.december >= 1.4 ? 'december' : 'popular';
}
const commons = (f) => f && `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(f.replace(/ /g, '_'))}?width=360`;
const out = {
  generated: now.toISOString(),
  method: 'OpenStreetMap places within 1 km of the day\'s stops, ranked by Wikipedia pageviews (ja + en) over the last 30 days, boosted when rising against the 30 days before and when last December ran above the 12-month average.',
  days: {},
};
for (const d of days) {
  const list = withWiki.filter((c) => c.days[d] && (c.views30 ?? 0) >= 60).sort((a, b) => b.score - a.score);
  const seen = {}; const pick = [];
  for (const c of list) { // variety: at most three of one kind per day
    if ((seen[c.kind] = (seen[c.kind] ?? 0) + 1) > 3) continue;
    pick.push(c); if (pick.length >= PER_DAY) break;
  }
  out.days[d] = pick.map((c) => ({
    id: c.qid, name: c.labelEn || c.en || c.nameEn || c.labelJa || c.nameJa, ja: c.labelJa || c.ja || c.nameJa || null,
    kind: c.kind, lat: +c.at.lat.toFixed(6), lng: +c.at.lng.toFixed(6),
    near: c.days[d], views30: c.views30, rise: +c.rise.toFixed(2), december: +c.december.toFixed(2), tag: c.tag, score: c.score,
    wiki: c.en ? `https://en.wikipedia.org/wiki/${encodeURIComponent(c.en.replace(/ /g, '_'))}` : `https://ja.wikipedia.org/wiki/${encodeURIComponent(c.ja.replace(/ /g, '_'))}`,
    photo: commons(c.photo), photoPage: c.photo ? `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(c.photo.replace(/ /g, '_'))}` : null,
  }));
}
await writeFile(new URL('../data/trending.json', import.meta.url), JSON.stringify(out, null, 1) + '\n');
console.log('Wrote data/trending.json:', Object.entries(out.days).map(([d, l]) => `D${d}:${l.length}`).join(' '));
