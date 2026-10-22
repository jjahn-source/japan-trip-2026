// npm run place-photos: a photo of the place for every stop the plan has none for, from Google Places
// (the pictures owners and visitors post on Google Maps; needs GOOGLE_MAPS_API_KEY). Each becomes the
// same two local copies scripts/thumbs.mjs makes (a 160 px square for lists, 960 px wide for the stop's
// sheet) in public/thumbs/, with data/place-photos.json as the index and the photographer credited.
// Stays and transport are skipped (private homes, stations). To drop a photo that shows the wrong thing,
// set its entry to { "hide": "why" }: reruns keep that. Reads dist/app-data.json (runs between two builds).
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { keyOf, placeOf } from './streetview.mjs';

/** The place's own pictures come first in Google's list; the first wide one of these makes the best
 *  16:9 header, else the first. */
export function pickPhoto(photos = []) {
  const top = photos.slice(0, 6);
  return top.find((p) => p.widthPx >= p.heightPx * 1.1) ?? top[0] ?? null;
}

async function main() {
  const root = fileURLToPath(new URL('..', import.meta.url));
  const S = await import('../planner/sources.ts');
  const L = await import('../planner/lib.ts');
  const apiKey = L.key('GOOGLE_MAPS_API_KEY');
  if (!apiKey) throw new Error('GOOGLE_MAPS_API_KEY is not set');
  const cache = join(root, 'node_modules/.cache/place-photos');
  const manifestPath = join(root, 'data/place-photos.json');
  const data = JSON.parse(readFileSync(join(root, 'dist/app-data.json'), 'utf8'));
  mkdirSync(cache, { recursive: true });
  mkdirSync(join(root, 'public/thumbs'), { recursive: true });
  const old = existsSync(manifestPath) ? JSON.parse(readFileSync(manifestPath, 'utf8')) : {};

  // Stops with no photo of their own, once per place.
  const stops = new Map();
  for (const d of data.days) for (const s of d.stops) {
    if (s.lat == null || s.lng == null || s.cat === 'stay' || s.cat === 'transport') continue;
    if (s.guide?.media.some((m) => m.kind === 'image' && !m.url.startsWith('/thumbs/g-'))) continue;
    stops.set(keyOf(s.lat, s.lng), { ...s, city: d.city });
  }

  const manifest = {};
  let made = 0, none = 0, failed = 0;
  for (const [key, s] of [...stops].sort(([a], [b]) => a.localeCompare(b))) {
    const prev = old[key];
    if (prev?.hide || prev?.none || (prev?.l && existsSync(join(root, 'public', prev.l)))) { manifest[key] = prev; continue; }
    try {
      const g = await placeOf(s, s.city, S);
      if (!g?.placeId) { manifest[key] = { none: 'Google Places has no match near the pin' }; none++; continue; }
      const details = await L.cached('placephotos', [g.placeId], () => L.http(`https://places.googleapis.com/v1/places/${encodeURIComponent(g.placeId)}`, {
        headers: { 'X-Goog-Api-Key': apiKey, 'X-Goog-FieldMask': 'photos' },
      }), 30);
      const p = pickPhoto(details?.photos);
      if (!p) { manifest[key] = { none: 'no photos on Google Maps' }; none++; continue; }
      const id = `g-${createHash('sha1').update(key).digest('hex').slice(0, 12)}`;
      const raw = join(cache, `${createHash('sha1').update(p.name).digest('hex').slice(0, 16)}`);
      if (!existsSync(raw)) {
        await new Promise((r) => setTimeout(r, 200));
        const res = await fetch(`https://places.googleapis.com/v1/${p.name}/media?maxWidthPx=1600&key=${apiKey}`, { redirect: 'follow', signal: AbortSignal.timeout(30000) });
        if (!res.ok || !/^image\//.test(res.headers.get('content-type') ?? '')) throw new Error(`photo ${res.status}`);
        writeFileSync(raw, Buffer.from(await res.arrayBuffer()));
      }
      const sm = `/thumbs/${id}-s.webp`, lg = `/thumbs/${id}-l.webp`;
      const img = sharp(readFileSync(raw), { failOn: 'none' }).rotate();
      await img.clone().resize(160, 160, { fit: 'cover', position: 'attention' }).webp({ quality: 72 }).toFile(join(root, 'public', sm));
      await img.clone().resize({ width: 960, height: 720, fit: 'inside', withoutEnlargement: true }).webp({ quality: 74 }).toFile(join(root, 'public', lg));
      manifest[key] = { s: sm, l: lg, credit: p.authorAttributions?.[0]?.displayName ?? null, maps: g.maps ?? null };
      made++;
    } catch (e) {
      failed++;
      console.warn(`skip ${s.name}: ${e.message}`);
    }
  }
  writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 1)}\n`);
  const have = Object.values(manifest).filter((x) => x.l).length;
  console.log(`${have}/${stops.size} photo-less stops now have a Google Maps photo (${made} new, ${none} with none, ${failed} failed) → public/thumbs/`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await main();
