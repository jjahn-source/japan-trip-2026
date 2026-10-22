// npm run taxis: if the group misses the last train, the taxi home, written to data/taxis.json for the
// day's last-train panel. For each night with a ride home (the night's last stop out → the bed): Google's
// traffic-aware drive time and distance at that hour on the trip's own date (Routes API; Google has no
// Japanese trains, but it does have roads), the fare per car from the local meter rates with the late-night
// surcharge, and how many cars the group needs (a Japanese taxi takes four). The fare is an estimate,
// shown as a range: meters also tick while stopped, and rates change.
// Needs GOOGLE_MAPS_API_KEY. Reads dist/app-data.json (runs between two builds). Run: npm run taxis
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { nightISO } from '../src/lib/live.ts';

/** Meter rates for a medium taxi: the flag fall and the distance it covers, then ¥100 a step. Tokyo's 23
 *  wards and Kanagawa (Hakone) since the 2024–26 revisions, Osaka city's area; all about ¥430 a km. */
const RATES = {
  tokyo: { flag: 500, flagM: 1000, stepM: 232 },
  hakone: { flag: 500, flagM: 1000, stepM: 232 },
  osaka: { flag: 600, flagM: 1200, stepM: 231 },
};
/** Late-night surcharge, 22:00–05:00: the meter runs 20% faster. */
const NIGHT = 1.2;
const SEATS = 4;

export const regionOf = (lng) => (lng < 136.5 ? 'osaka' : lng < 139.3 ? 'hakone' : 'tokyo');

/** About what the meter shows for a ride of `m` metres starting at Japan hour `hour`, as a range. */
export function fareOf(m, hour, region) {
  const r = RATES[region] ?? RATES.tokyo;
  const base = r.flag + Math.max(0, Math.ceil((m - r.flagM) / r.stepM)) * 100;
  const night = hour >= 22 || hour < 5 ? NIGHT : 1;
  const round = (y) => Math.round(y / 100) * 100;
  return [round(base * night * 0.95), round(base * night * 1.15)];
}
export const carsFor = (people) => Math.max(1, Math.ceil(people / SEATS));

async function main() {
  const root = fileURLToPath(new URL('..', import.meta.url));
  const L = await import('../planner/lib.ts');
  const apiKey = L.key('GOOGLE_MAPS_API_KEY');
  if (!apiKey) throw new Error('GOOGLE_MAPS_API_KEY is not set');
  const data = JSON.parse(readFileSync(join(root, 'dist/app-data.json'), 'utf8'));
  const out = {};
  for (const d of data.days) {
    if (!d.home) continue;
    // When they'd take it: once the last train has gone, else half past midnight.
    const at = nightISO(d.date, d.lastTrain?.dep ?? '00:30');
    const hour = +at.slice(11, 13);
    const body = {
      origin: { location: { latLng: { latitude: d.home.from.lat, longitude: d.home.from.lng } } },
      destination: { location: { latLng: { latitude: d.home.to.lat, longitude: d.home.to.lng } } },
      travelMode: 'DRIVE', routingPreference: 'TRAFFIC_AWARE_OPTIMAL', departureTime: new Date(Date.parse(at)).toISOString(),
      languageCode: 'en', regionCode: 'JP',
    };
    try {
      const r = await L.cached('taxi', body, () => L.http('https://routes.googleapis.com/directions/v2:computeRoutes', {
        method: 'POST', headers: { 'X-Goog-Api-Key': apiKey, 'Content-Type': 'application/json', 'X-Goog-FieldMask': 'routes.duration,routes.distanceMeters' },
        body: JSON.stringify(body),
      }), 14);
      const route = r?.routes?.[0];
      if (!route?.distanceMeters) { console.warn(`day ${d.n}: no drive route`); continue; }
      const region = regionOf(d.home.from.lng);
      out[d.n] = {
        from: d.home.from.name, to: d.home.to.name, at: at.slice(11, 16),
        minutes: Math.round(parseInt(route.duration, 10) / 60), km: Math.round(route.distanceMeters / 100) / 10,
        fare: fareOf(route.distanceMeters, hour, region), cars: carsFor(data.people ?? 8),
      };
    } catch (e) { console.warn(`day ${d.n}: ${e.message}`); }
  }
  writeFileSync(join(root, 'data/taxis.json'), `${JSON.stringify(out, null, 1)}\n`);
  console.log(`${Object.keys(out).length} nights with a taxi home → data/taxis.json`);
  for (const [n, t] of Object.entries(out)) console.log(`  day ${n}: ${t.from} → ${t.to} at ${t.at}: ${t.minutes} min, ${t.km} km, ¥${t.fare[0]}–${t.fare[1]} a car × ${t.cars}`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await main();
