// Real timetable for each longer ride (3 km+, not on foot), written to public/timetable.json: NAVITIME
// Route (totalnavi) on RapidAPI, asked for the first departure after the planned time on the trip's
// own date. Needs RAPIDAPI_KEY in .env (free Basic plan: 500 requests a month, hard limit, so it can
// never bill). About 40 requests per run. Run: npm run timetable
import { readFile, writeFile } from 'node:fs/promises';

const KEY = process.env.RAPIDAPI_KEY;
if (!KEY && !process.argv.includes('--relabel')) {
  console.log('No RAPIDAPI_KEY in .env: skipping the timetable. Subscribe to "NAVITIME Route(totalnavi)" (Basic, free) on rapidapi.com and add RAPIDAPI_KEY=... to .env.');
  process.exit(0);
}
const HOST = 'navitime-route-totalnavi.p.rapidapi.com';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const legs = JSON.parse(await readFile(new URL('../public/legs.json', import.meta.url), 'utf8'));

// The same normaliser the phone uses (Node 24 strips the TypeScript types on import).
const { normalize } = await import('../src/lib/navitime.ts');
const transit = JSON.parse(await readFile(new URL('../public/transit.json', import.meta.url), 'utf8'));
const { translator } = await import('../src/lib/navitime.ts');
const tr = translator(new Map(transit.stations.map((s) => [s.ja, s.name])), new Map(transit.lines.map((l) => [l.ja, l.name])));
// Keep NAVITIME's own Japanese names beside the English, so a relabel can always start over from them.
const toEnglish = (route) => ({ ...route, rides: route.rides.map((r) => {
  const ja = r.ja ?? { line: r.line, from: r.from, to: r.to };
  return { ...r, ja, line: tr.line(ja.line), from: tr.station(ja.from), to: tr.station(ja.to) };
}) });
// --relabel: translate an existing timetable.json again without spending any requests.
if (process.argv.includes('--relabel')) {
  const cur = JSON.parse(await readFile(new URL('../public/timetable.json', import.meta.url), 'utf8'));
  for (const [k, r] of Object.entries(cur.legs)) { if (!r.rides.length) delete cur.legs[k]; else cur.legs[k] = toEnglish(r); }
  await writeFile(new URL('../public/timetable.json', import.meta.url), JSON.stringify(cur));
  for (const [k, r] of Object.entries(cur.legs)) console.log(k, r.rides.map((x) => `${x.line}: ${x.from} → ${x.to}`).join(' | '));
  process.exit(0);
}

const out = { generated: new Date().toISOString(), source: 'NAVITIME Route (totalnavi)', legs: {} };
let calls = 0, ok = 0;
for (const [d, list] of Object.entries(legs.days)) {
  for (const l of list) {
    if (l.mode === 'walk' || (l.km ?? 0) < 3 || !l.a || !l.b || !l.depart) continue;
    const u = new URL(`https://${HOST}/route_transit`);
    Object.entries({ start: `${l.a[1]},${l.a[0]}`, goal: `${l.b[1]},${l.b[0]}`, start_time: l.depart.slice(0, 19), limit: '1', datum: 'wgs84', coord_unit: 'degree' }).forEach(([k, v]) => u.searchParams.set(k, v));
    const res = await fetch(u, { headers: { 'X-RapidAPI-Key': KEY, 'X-RapidAPI-Host': HOST } });
    calls++;
    if (res.status === 429) { console.log('Rate or monthly limit reached; stopping.'); break; }
    if (!res.ok) { console.log(`Day ${d} ${l.from}: HTTP ${res.status} ${(await res.text()).slice(0, 160)}`); await sleep(1500); continue; }
    const route = normalize((await res.json()).items?.[0] ?? {});
    // Only routes that ride something: the free plan has no buses or boats, and answers those with a long walk.
    if (route && route.rides.length) { out.legs[l.from] = toEnglish(route); ok++; console.log(`Day ${d} ${l.from}: dep ${route.dep.slice(11, 16)} arr ${route.arr.slice(11, 16)} · ${route.rides.map((r) => `${r.line} ${r.from}→${r.to}`).join(' | ')} · ¥${route.fare}`); }
    await sleep(1500);
  }
}
await writeFile(new URL('../public/timetable.json', import.meta.url), JSON.stringify(out));
console.log(`Wrote public/timetable.json: ${ok} rides from ${calls} requests`);
