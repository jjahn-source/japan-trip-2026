// Typical weather for each day of the trip, written to data/climate.json: the mean high, low and
// chance of a wet day (≥1 mm) for that calendar date ±3 days over 2016–2025 at the day's place, from
// Open-Meteo's historical archive (ERA5; keyless). The day page shows it until the real forecast
// (16 days out) takes over in the browser. Run: npm run climate
import { readFile, writeFile } from 'node:fs/promises';

// The trip as the build wrote it (src/pages/trip-data.json.ts), so build first.
const trip = JSON.parse(await readFile(new URL('../dist/trip-data.json', import.meta.url), 'utf8'));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const out = { generated: new Date().toISOString(), source: 'Open-Meteo historical weather (ERA5), 2016–2025', days: {} };
const byPlace = new Map();
for (const d of trip.days) {
  if (!d.sun) continue;
  const key = `${d.sun.lat.toFixed(1)},${d.sun.lng.toFixed(1)}`;
  if (!byPlace.has(key)) {
    const u = `https://archive-api.open-meteo.com/v1/archive?latitude=${d.sun.lat}&longitude=${d.sun.lng}&start_date=2016-12-01&end_date=2025-12-31&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=Asia%2FTokyo`;
    let j = null;
    for (let i = 0; i < 4 && !j; i++) { const r = await fetch(u); if (r.ok) j = await r.json(); else await sleep(5000); }
    byPlace.set(key, j);
    await sleep(1500);
  }
  const j = byPlace.get(key);
  if (!j) continue;
  const md = d.date.slice(5);
  const want = new Set([-3, -2, -1, 0, 1, 2, 3].map((k) => { const t = new Date(`2026-${md}T12:00:00Z`); t.setUTCDate(t.getUTCDate() + k); return t.toISOString().slice(5, 10); }));
  const hi = [], lo = [], wet = [];
  j.daily.time.forEach((t, i) => { if (want.has(t.slice(5)) && j.daily.temperature_2m_max[i] != null) { hi.push(j.daily.temperature_2m_max[i]); lo.push(j.daily.temperature_2m_min[i]); wet.push((j.daily.precipitation_sum[i] ?? 0) >= 1); } });
  const mean = (a) => a.reduce((x, y) => x + y, 0) / a.length;
  out.days[d.n] = { hi: Math.round(mean(hi)), lo: Math.round(mean(lo)), wet: Math.round((wet.filter(Boolean).length / wet.length) * 100), n: hi.length };
  console.log(`Day ${d.n} (${d.date}): ${out.days[d.n].hi}° / ${out.days[d.n].lo}°, wet ${out.days[d.n].wet}%`);
}
await writeFile(new URL('../data/climate.json', import.meta.url), JSON.stringify(out, null, 1) + '\n');
