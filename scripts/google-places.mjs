// npm run google: what Google Maps knows about each stop, written to data/google-places.json for the stop
// sheet. The rating and Google's own review summary ("Summarized with Gemini", with the link Google asks
// for), whether it takes cards, takes bookings and suits a group, whether it's still in business, and its
// opening hours: the weekly ones, plus the exact hours Google has for the next seven days (holidays and
// year-end closures show up only there, so run this again in the week before and during the trip).
// The build checks each visit against these hours (src/lib/google-hours.ts).
// Also, to find the door: the building's own name (as on its sign), the floor, and the nearest landmark
// Google describes it by ("beside Kinokuniya"). And for each restaurant and bar, Plan B: the best-rated
// places of the same kind within a short walk, with their weekly hours, so the build can offer the ones
// open at the visit's time (offline, and in the morning closure alert).
// Needs GOOGLE_MAPS_API_KEY; one Place Details call a place (Enterprise + Atmosphere fields), cached a day,
// and one Nearby Search per restaurant or bar, cached a week. Stays and transport are skipped. Reads
// dist/app-data.json (runs between two builds).
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { keyOf, placeOf } from './streetview.mjs';
import { datedHours } from '../src/lib/google-hours.ts';

const FIELDS = 'id,primaryType,addressComponents,addressDescriptor,googleMapsUri,rating,userRatingCount,businessStatus,regularOpeningHours.periods,currentOpeningHours.periods,currentOpeningHours.specialDays,paymentOptions,goodForGroups,reservable,reviewSummary';

const SWAP_FIELDS = 'places.id,places.displayName,places.location,places.rating,places.userRatingCount,places.primaryTypeDisplayName,places.businessStatus,places.regularOpeningHours.periods,places.goodForGroups,places.reservable,places.googleMapsUri';
/** How far a swap may be from the stop, and what counts as well-liked. */
const SWAP_M = 700, SWAP_RATING = 4, SWAP_REVIEWS = 150;
/** Stops that get swaps: places to eat and drink, where a full or closed door needs a fallback now. */
const SWAP_CATS = new Set(['restaurant', 'bar']);

const metres = (a, b) => Math.hypot((b.lng - a.lng) * Math.cos((a.lat * Math.PI) / 180), b.lat - a.lat) * 111195;
/** Landmarks nobody steers by. */
const DULL = /parking|car park|駐車場|toilet|トイレ|restroom|coin locker|apartment|mansion|マンション|atm\b|bus stop|taxi stand/i;
/** Google place types that are somewhere to eat or drink: the only stops that get swaps. */
export const FOOD = /restaurant|bar\b|_bar|pub|izakaya|cafe|coffee|bakery|diner|food|meal|sushi|ramen|yakiniku|steak|brewery|wine|tea_house|dessert|confectionery/;
const WHERE = { BESIDE: 'beside', ACROSS_THE_ROAD: 'across the road from', DOWN_THE_ROAD: 'down the road from', AROUND_THE_CORNER: 'around the corner from', BEHIND: 'behind', WITHIN: 'inside', NEAR: 'near' };

/** Finding the door: the building's name (Japanese, as on the sign), the floor ("4F", "B1F", "1-4F"),
 *  and the closest landmark Google describes the place by. Null when Google has none of it. */
export function doorOf(d) {
  const parts = d.addressComponents ?? [];
  const floor = parts.find((c) => c.types?.includes('subpremise') && /\d\s*F|階|B\d/i.test(c.longText))?.longText ?? null;
  const building = parts.find((c) => c.types?.includes('premise') && !/^[\d-]+$/.test(c.longText))?.longText ?? null;
  const lm = (d.addressDescriptor?.landmarks ?? []).filter((l) => l.displayName?.text && !DULL.test(l.displayName.text) && (l.travelDistanceMeters ?? l.straightLineDistanceMeters) < 300)
    .sort((a, b) => (a.travelDistanceMeters ?? a.straightLineDistanceMeters) - (b.travelDistanceMeters ?? b.straightLineDistanceMeters))[0];
  const near = lm ? `${WHERE[lm.spatialRelationship] ?? 'near'} ${lm.displayName.text}` : null;
  return building || floor || near ? { building, floor, near } : null;
}

/** Plan B candidates from a Nearby Search: in business, well-liked, close, not the stop itself and not
 *  marked bad for groups; best first (rating, weighted by how many people rated it). The build picks the
 *  ones open at the visit's time. */
export function swapsOf(places, at, selfId) {
  return (places ?? [])
    .filter((p) => p.id !== selfId && p.location && (p.businessStatus ?? 'OPERATIONAL') === 'OPERATIONAL' && p.goodForGroups !== false
      && (p.rating ?? 0) >= SWAP_RATING && (p.userRatingCount ?? 0) >= SWAP_REVIEWS)
    .map((p) => ({ p, m: metres(at, { lat: p.location.latitude, lng: p.location.longitude }) }))
    .filter((x) => x.m <= SWAP_M)
    .sort((a, b) => b.p.rating * Math.log10(b.p.userRatingCount) - a.p.rating * Math.log10(a.p.userRatingCount))
    .slice(0, 6)
    .map(({ p, m }) => ({
      id: p.id, name: p.displayName?.text ?? '', kind: p.primaryTypeDisplayName?.text ?? null, rating: p.rating, ratings: p.userRatingCount,
      m: Math.round(m), lat: p.location.latitude, lng: p.location.longitude, maps: p.googleMapsUri ?? null,
      groups: p.goodForGroups ?? null, book: p.reservable ?? null, weekly: p.regularOpeningHours?.periods ?? null,
    }));
}

/** Cards, cash only, or not known (Google often doesn't say). */
export function payment(p) {
  if (!p) return null;
  if (p.acceptsCashOnly) return 'cash';
  if (p.acceptsCreditCards || p.acceptsDebitCards || p.acceptsNfc) return 'cards';
  if (p.acceptsCreditCards === false) return 'cash';
  return null;
}

/** The entry the site keeps for a place, from Google's Place Details answer. */
export function entryOf(d, today) {
  return {
    id: d.id, maps: d.googleMapsUri ?? null,
    rating: d.rating ?? null, ratings: d.userRatingCount ?? null,
    status: d.businessStatus ?? null,
    weekly: d.regularOpeningHours?.periods ?? null,
    dated: datedHours(d.currentOpeningHours, today),
    pay: payment(d.paymentOptions), groups: d.goodForGroups ?? null, book: d.reservable ?? null,
    type: d.primaryType ?? null, door: doorOf(d),
    summary: d.reviewSummary?.text?.text ? { text: d.reviewSummary.text.text, uri: d.reviewSummary.reviewsUri ?? d.googleMapsUri ?? null } : null,
    fetched: today,
  };
}

async function main() {
  const root = fileURLToPath(new URL('..', import.meta.url));
  const S = await import('../planner/sources.ts');
  const L = await import('../planner/lib.ts');
  const apiKey = L.key('GOOGLE_MAPS_API_KEY');
  if (!apiKey) throw new Error('GOOGLE_MAPS_API_KEY is not set');
  const out = join(root, 'data/google-places.json');
  const data = JSON.parse(readFileSync(join(root, 'dist/app-data.json'), 'utf8'));
  const old = existsSync(out) ? JSON.parse(readFileSync(out, 'utf8')) : {};
  const today = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Tokyo' });

  const stops = new Map();
  for (const d of data.days) for (const s of d.stops) {
    if (s.lat == null || s.lng == null || s.cat === 'stay' || s.cat === 'transport') continue;
    stops.set(keyOf(s.lat, s.lng), { ...s, city: d.city });
  }
  const manifest = {};
  let found = 0, none = 0, failed = 0;
  for (const [k, s] of [...stops].sort(([a], [b]) => a.localeCompare(b))) {
    // A wrong match someone hid stays hidden: { "hide": "why" }.
    if (old[k]?.hide) { manifest[k] = old[k]; continue; }
    try {
      const g = await placeOf(s, s.city, S);
      if (!g?.placeId) { manifest[k] = { none: 'Google Places has no match near the pin' }; none++; continue; }
      const d = await L.cached('placedetails', [g.placeId, FIELDS, today], () => L.http(`https://places.googleapis.com/v1/places/${encodeURIComponent(g.placeId)}?languageCode=en&regionCode=JP`, {
        headers: { 'X-Goog-Api-Key': apiKey, 'X-Goog-FieldMask': FIELDS },
      }), 1);
      let swaps = null;
      if (SWAP_CATS.has(s.cat) && FOOD.test(d.primaryType ?? '')) {
        const near = await L.cached('placenearby', [d.primaryType, k, SWAP_FIELDS], () => L.http('https://places.googleapis.com/v1/places:searchNearby', {
          method: 'POST', headers: { 'X-Goog-Api-Key': apiKey, 'Content-Type': 'application/json', 'X-Goog-FieldMask': SWAP_FIELDS },
          body: JSON.stringify({ includedTypes: [d.primaryType], maxResultCount: 20, rankPreference: 'POPULARITY', languageCode: 'en', regionCode: 'JP', locationRestriction: { circle: { center: { latitude: s.lat, longitude: s.lng }, radius: SWAP_M } } }),
        }), 7);
        swaps = swapsOf(near?.places, { lat: s.lat, lng: s.lng }, d.id);
      }
      // A stop that isn't the place's opening hours (a walk past it at night) keeps { "noHours": "why" }.
      manifest[k] = { name: s.name, place: g.name, ...entryOf(d, today), swaps, ...(old[k]?.noHours ? { noHours: old[k].noHours } : {}) };
      found++;
    } catch (e) {
      failed++;
      if (old[k]) manifest[k] = old[k];
      console.warn(`skip ${s.name}: ${e.message}`);
    }
  }
  writeFileSync(out, `${JSON.stringify(manifest, null, 1)}\n`);
  console.log(`${found}/${stops.size} stops matched on Google Maps (${none} with no match, ${failed} failed) → data/google-places.json`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await main();
