// npm run streetview: a street-level photo of every stop, aimed at its pin, so the group can spot the
// door on arrival ("the grey gate left of the vending machine"). For each stop it takes Google Places'
// own location for the place (with GOOGLE_MAPS_API_KEY; usually its entrance, often a few metres off the
// plan's pin), finds the nearest Google Street View panorama within MAX_M metres, faces the camera from
// there toward it, and saves a 960 × 540 WebP to public/streetview/ with data/streetview.json as the index.
// To drop a photo that shows the wrong thing, set its entry to { "hide": "why" }: reruns keep that.
//
// These are Google Maps' own web endpoints, not a public API (the method is from Belluxx/Aleph, MIT):
// they can change or rate-limit without notice, and Google's terms don't allow downloading the imagery.
// The photos are fetched once, here, and served from the site, so the app itself never calls Google and
// keeps working whatever happens to the endpoints. Reads dist/app-data.json (runs between two builds).
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

/** Farther than this and the photo shows the street, not the place. */
export const MAX_M = 60;
/** Big sites (an airport, a park) have no one door to show. */
const SKIP_CATS = new Set(['transport', 'nature']);
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36';

/** "lat,lng" to 5 places (~1 m): the stop's key, so a re-plan that keeps the place keeps its photo. */
export const keyOf = (lat, lng) => `${lat.toFixed(5)},${lng.toFixed(5)}`;

/** The zoom-17 map tile holding a point (Google lists panoramas per tile at this zoom only). */
export function tileOf(lat, lng) {
  const n = 2 ** 17, r = (lat * Math.PI) / 180;
  return [Math.floor(((lng + 180) / 360) * n), Math.floor(((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2) * n)];
}

/** Metres between two [lat, lng] (flat-earth; fine at street scale). */
export function metres(a, b) {
  const p = Math.PI / 180, dx = (b[1] - a[1]) * p * Math.cos(((a[0] + b[0]) / 2) * p), dy = (b[0] - a[0]) * p;
  return 6371000 * Math.hypot(dx, dy);
}

/** Compass bearing from a to b, 0–360° clockwise from north. */
export function bearing(a, b) {
  const p = Math.PI / 180, dl = (b[1] - a[1]) * p;
  const y = Math.sin(dl) * Math.cos(b[0] * p), x = Math.cos(a[0] * p) * Math.sin(b[0] * p) - Math.sin(a[0] * p) * Math.cos(b[0] * p) * Math.cos(dl);
  return ((Math.atan2(y, x) / p) + 360) % 360;
}

/** Every tile within MAX_M of the point: one, or up to four near a tile edge. */
export function tilesNear(lat, lng) {
  const dLat = MAX_M / 111320, dLng = MAX_M / (111320 * Math.cos((lat * Math.PI) / 180));
  const seen = new Map();
  for (const a of [-dLat, dLat]) for (const b of [-dLng, dLng]) { const t = tileOf(lat + a, lng + b); seen.set(t.join('-'), t); }
  return [...seen.values()];
}

/** Google's own panoramas in a coverage response (not people's uploaded photo spheres). */
export function parseCoverage(text) {
  const j = JSON.parse(text.replace(/^\)\]\}'\s*/, ''));
  return (j[1]?.[1] ?? [])
    .filter((row) => Array.isArray(row?.[0]?.[0]) && row[0][0][0] === 2 && typeof row[0][0][1] === 'string')
    .map((row) => ({ pano: row[0][0][1], lat: row[0][2][0][2], lng: row[0][2][0][3] }))
    .filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng));
}

/** The nearest panorama to the point within MAX_M, with its distance. */
export function nearest(panos, lat, lng) {
  let best = null;
  for (const p of panos) { const d = metres([lat, lng], [p.lat, p.lng]); if (d <= MAX_M && (!best || d < best.d)) best = { ...p, d }; }
  return best;
}

/** Google Places' location for a stop, when Places finds the same place (its own name words) near the
 *  pin; stays are private homes Places doesn't know, so they keep the pin. */
async function placeOf(s, city, S) {
  if (s.cat === 'stay' || !S.has.places()) return null;
  const name = s.name.replace(/\s*\([^)]*\)\s*/g, ' ').trim();
  for (const q of [s.ja, name].filter(Boolean)) {
    const g = await S.placesLookup(`${q} ${city}`, { lat: s.lat, lng: s.lng });
    if (g && (S.nameMatch(name, g.name) || (s.ja && S.nameMatch(s.ja, g.name))) && metres([s.lat, s.lng], [g.lat, g.lng]) < PLACE_M) return g;
  }
  return null;
}
/** A Places hit farther than this from the pin is some other branch, not this stop. */
const PLACE_M = 400;

/** A Google Maps link (the documented Maps URLs) that opens this panorama facing the stop, to look around. */
export const mapsLink = (pano, heading) => `https://www.google.com/maps/@?api=1&map_action=pano&pano=${encodeURIComponent(pano)}&heading=${Math.round(heading)}&pitch=0&fov=90`;

async function get(url, cachePath) {
  if (cachePath && existsSync(cachePath)) return readFileSync(cachePath);
  await new Promise((r) => setTimeout(r, 400)); // be gentle: one request at a time
  const res = await fetch(url, { headers: { 'user-agent': UA }, signal: AbortSignal.timeout(20000) });
  if (!res.ok) throw new Error(`${res.status} from ${new URL(url).host}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (cachePath) writeFileSync(cachePath, buf);
  return buf;
}

const coverageUrl = ([x, y]) => `https://www.google.com/maps/photometa/ac/v1?pb=${encodeURIComponent(`!1m1!1smaps_sv.tactile!6m3!1i${x}!2i${y}!3i17!8b1`)}`;
const metaUrl = (pano) => `https://www.google.com/maps/photometa/v1?authuser=0&hl=en&gl=US&pb=${encodeURIComponent(`!1m1!1smaps_sv.tactile!2m2!1sen!2sUS!3m3!1m2!1e2!2s${pano}!4m6!1e1!1e2!1e3!1e4!2m1!1e1`)}`;
// The thumbnail service's pitch is positive-down: -4 tilts up a little, toward signs above doors.
const photoUrl = (pano, heading) => `https://streetviewpixels-pa.googleapis.com/v1/thumbnail?panoid=${encodeURIComponent(pano)}&cb_client=maps_sv.tactile&w=1024&h=576&yaw=${heading.toFixed(1)}&pitch=-4&thumbfov=90`;

/** The capture month ("2020-03") from a panorama's metadata, when it has one. */
export function parseDate(text) {
  const m = JSON.parse(text.replace(/^\)\]\}'\s*/, ''))[1]?.[0];
  const d = m?.[6]?.[7];
  return Array.isArray(d) && Number.isInteger(d[0]) && Number.isInteger(d[1]) && d[1] >= 1 && d[1] <= 12 ? `${d[0]}-${String(d[1]).padStart(2, '0')}` : null;
}

async function main() {
  const root = fileURLToPath(new URL('..', import.meta.url));
  const cache = join(root, 'node_modules/.cache/streetview');
  const out = join(root, 'public/streetview');
  const manifestPath = join(root, 'data/streetview.json');
  const data = JSON.parse(readFileSync(join(root, 'dist/app-data.json'), 'utf8'));
  const S = await import('../planner/sources.ts');
  mkdirSync(cache, { recursive: true });
  mkdirSync(out, { recursive: true });
  const old = existsSync(manifestPath) ? JSON.parse(readFileSync(manifestPath, 'utf8')) : {};

  const stops = new Map();
  for (const d of data.days) for (const s of d.stops) if (s.lat != null && s.lng != null && !SKIP_CATS.has(s.cat)) stops.set(keyOf(s.lat, s.lng), { ...s, city: d.city });

  const manifest = {};
  let made = 0, none = 0, failed = 0, google = 0;
  for (const [key, s] of [...stops].sort(([a], [b]) => a.localeCompare(b))) {
    const prev = old[key];
    if (prev?.hide) { manifest[key] = prev; continue; }
    try {
      const g = await placeOf(s, s.city, S);
      const at = g ? [g.lat, g.lng] : [s.lat, s.lng];
      const t = keyOf(...at);
      if (g) google++;
      // Same target as last time: keep it (the photo is still on disk, or there's still nothing near).
      if (prev?.t === t && (prev.none || existsSync(join(root, 'public', prev.src)))) { manifest[key] = prev; continue; }
      const panos = [];
      for (const tile of tilesNear(...at)) panos.push(...parseCoverage(String(await get(coverageUrl(tile), join(cache, `tile-${tile.join('-')}.json`)))));
      const p = nearest(panos, ...at);
      if (!p) { manifest[key] = { none: `no Street View within ${MAX_M} m`, t }; none++; continue; }
      const date = parseDate(String(await get(metaUrl(p.pano), join(cache, `meta-${p.pano}.json`))));
      const heading = bearing([p.lat, p.lng], at);
      const raw = await get(photoUrl(p.pano, heading), join(cache, `photo-${p.pano}-${Math.round(heading)}.jpg`));
      const src = `/streetview/${createHash('sha1').update(key).digest('hex').slice(0, 12)}.webp`;
      await sharp(raw).resize(960, 540, { fit: 'cover' }).webp({ quality: 72 }).toFile(join(root, 'public', src));
      manifest[key] = { src, date, m: Math.round(p.d), t, at: g ? 'google' : 'pin', url: mapsLink(p.pano, heading) };
      made++;
    } catch (e) {
      failed++;
      console.warn(`skip ${s.name}: ${e.message}`);
    }
  }
  writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 1)}\n`);
  const have = Object.values(manifest).filter((x) => x.src).length;
  console.log(`${have}/${stops.size} stops have a street photo (${made} new, ${none} with no panorama near, ${failed} failed; ${google} aimed at Google Places' location) → public/streetview/`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await main();
