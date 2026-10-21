// npm run thumbs: small local copies of every photo the app shows, so a day's page doesn't pull ~4 MB
// of full-size share images over roaming data. Each photo becomes a 160 px square for lists and a
// 960 px-wide picture for a stop's sheet (WebP); the app keeps the original link as a fallback.
// Reads dist/app-data.json (so it runs between two builds), writes public/thumbs/ and data/thumbs.json.
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = fileURLToPath(new URL('..', import.meta.url));
const cache = join(root, 'node_modules/.cache/thumbs');
const out = join(root, 'public/thumbs');
const manifestPath = join(root, 'data/thumbs.json');
const data = JSON.parse(readFileSync(join(root, 'dist/app-data.json'), 'utf8'));
const UA = 'JapanTripApp/1.0 (private group trip planner; image thumbnails)';

const urls = new Set();
for (const d of data.days) {
  for (const s of d.stops) for (const m of s.guide?.media ?? []) if (m.kind === 'image') urls.add(m.url);
  for (const p of d.picks) if (p.photo) urls.add(p.photo);
}

mkdirSync(cache, { recursive: true });
mkdirSync(out, { recursive: true });
const old = existsSync(manifestPath) ? JSON.parse(readFileSync(manifestPath, 'utf8')) : {};
const manifest = {};
let made = 0, failed = 0;
for (const url of [...urls].sort()) {
  const id = createHash('sha1').update(url).digest('hex').slice(0, 12);
  const s = `/thumbs/${id}-s.webp`, l = `/thumbs/${id}-l.webp`;
  if (old[url] && existsSync(join(root, 'public', s)) && existsSync(join(root, 'public', l))) { manifest[url] = old[url]; continue; }
  try {
    const raw = join(cache, id);
    if (!existsSync(raw)) {
      await new Promise((r) => setTimeout(r, 1200)); // Wikimedia rate-limits bursts
      // Wikimedia's file server turns away scripts (429); its Special:FilePath route serves the same
      // picture at the size asked for.
      const wm = url.match(/^https:\/\/upload\.wikimedia\.org\/wikipedia\/commons\/(?:thumb\/)?[0-9a-f]\/[0-9a-f]{2}\/([^/?]+)/);
      const src = wm ? `https://commons.wikimedia.org/wiki/Special:FilePath/${wm[1]}?width=1200` : url;
      const res = await fetch(src, { headers: { 'user-agent': UA, accept: 'image/*' }, redirect: 'follow', signal: AbortSignal.timeout(20000) });
      if (!res.ok || !/^image\//.test(res.headers.get('content-type') ?? '')) throw new Error(`${res.status} ${res.headers.get('content-type')}`);
      writeFileSync(raw, Buffer.from(await res.arrayBuffer()));
    }
    const img = sharp(readFileSync(raw), { failOn: 'none' }).rotate();
    await img.clone().resize(160, 160, { fit: 'cover', position: 'attention' }).webp({ quality: 72 }).toFile(join(root, 'public', s));
    await img.clone().resize({ width: 960, height: 720, fit: 'inside', withoutEnlargement: true }).webp({ quality: 74 }).toFile(join(root, 'public', l));
    manifest[url] = { s, l };
    made++;
  } catch (e) {
    failed++;
    console.warn(`skip ${url.slice(0, 90)}: ${e.message}`);
  }
}
writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 1)}\n`);
console.log(`${Object.keys(manifest).length}/${urls.size} photos have local copies (${made} new, ${failed} failed) → public/thumbs/`);
