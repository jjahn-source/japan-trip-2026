// npm run google: what Google Maps knows about each stop, written to data/google-places.json for the stop
// sheet. The rating and Google's own review summary ("Summarized with Gemini", with the link Google asks
// for), whether it takes cards, takes bookings and suits a group, whether it's still in business, and its
// opening hours: the weekly ones, plus the exact hours Google has for the next seven days (holidays and
// year-end closures show up only there, so run this again in the week before and during the trip).
// The build checks each visit against these hours (src/lib/google-hours.ts). Needs GOOGLE_MAPS_API_KEY;
// one Place Details call a place (Enterprise + Atmosphere fields), cached a day. Stays and transport are
// skipped. Reads dist/app-data.json (runs between two builds).
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { keyOf, placeOf } from './streetview.mjs';
import { datedHours } from '../src/lib/google-hours.ts';

const FIELDS = 'id,googleMapsUri,rating,userRatingCount,businessStatus,regularOpeningHours.periods,currentOpeningHours.periods,currentOpeningHours.specialDays,paymentOptions,goodForGroups,reservable,reviewSummary';

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
      // A stop that isn't the place's opening hours (a walk past it at night) keeps { "noHours": "why" }.
      manifest[k] = { name: s.name, place: g.name, ...entryOf(d, today), ...(old[k]?.noHours ? { noHours: old[k].noHours } : {}) };
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
