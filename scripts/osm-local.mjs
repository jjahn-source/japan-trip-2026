// OpenStreetMap places from a local Geofabrik extract instead of the public Overpass servers.
//
// Why: Overpass is overloaded and often down (OSM community forum, 2026), and a build that depends on it
// is slow and unrepeatable. The three regional extracts the trip needs (Kantō, Kansai, Chūgoku; ~1 GB,
// refreshed daily by Geofabrik) are downloaded once; after that every build reads them from disk.
//
// How, per region: osmium tags-filter keeps the objects with a key the category table uses (cached, so a
// rebuild after a plan change skips it); one osmium extract pass cuts every area's box out of that; osmium
// export writes each as GeoJSON lines; the category table's own Overpass selectors then run as predicates
// (src/lib/osmselect.ts), so the result is what the Overpass query would have returned.
//
//   node scripts/osm-local.mjs fetch     download or refresh the extracts (resumable, only if newer)
import { spawn } from 'node:child_process';
import { createReadStream } from 'node:fs';
import { mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { createInterface } from 'node:readline';
import { compileAny, primaryKeys } from '../src/lib/osmselect.ts';

const DIR = new URL('../data/osm/', import.meta.url).pathname;
const WORK = `${DIR}work/`;
const BASE = 'https://download.geofabrik.de/asia/japan';
// Rough bounds of each region as Geofabrik cuts them [minLat, minLng, maxLat, maxLng]: enough to tell
// which areas the extracts cover (an area outside all of them falls back to Overpass).
export const REGIONS = {
  kanto: [34.8, 138.3, 37.3, 141.1],
  kansai: [33.4, 134.2, 35.8, 137.0],
  chugoku: [33.7, 130.7, 35.7, 134.5],
};

const run = (cmd, args) => new Promise((res, rej) => {
  const p = spawn(cmd, args, { stdio: ['ignore', 'ignore', 'pipe'] });
  let err = '';
  p.stderr.on('data', (d) => { err += d; });
  p.on('error', rej);
  p.on('close', (c) => (c === 0 ? res() : rej(new Error(`${cmd} ${args.slice(0, 2).join(' ')} exited ${c}: ${err.slice(-400)}`))));
});
const mtime = (f) => stat(f).then((s) => s.mtimeMs).catch(() => 0);
const pbf = (r) => `${DIR}${r}-latest.osm.pbf`;
async function pool(items, n, fn) {
  let next = 0;
  await Promise.all(Array.from({ length: Math.min(n, items.length) }, async () => { while (next < items.length) { const i = next++; await fn(items[i], i); } }));
}

/** True when osmium is installed and every region's extract is on disk. */
export async function available() {
  try { await run('osmium', ['--version']); } catch { return false; }
  return (await Promise.all(Object.keys(REGIONS).map((r) => mtime(pbf(r))))).every((t) => t > 0);
}

/** Download or refresh the regional extracts: resumable, and only when Geofabrik has a newer one. */
export async function fetchExtracts(log = console.log) {
  await mkdir(DIR, { recursive: true });
  await pool(Object.keys(REGIONS), 3, async (r) => {
    log(`fetching ${r}-latest.osm.pbf`);
    const have = await mtime(pbf(r)) > 0;
    await new Promise((res, rej) => {
      const args = ['-sSL', '--retry', '3', '-C', '-', '-o', pbf(r), ...(have ? ['-z', pbf(r)] : []), `${BASE}/${r}-latest.osm.pbf`];
      const p = spawn('curl', args, { stdio: 'inherit' });
      p.on('close', (c) => (c === 0 ? res() : rej(new Error(`curl ${r} exited ${c}`))));
    });
  });
}

const centreOf = (coords) => {
  let a = 1e9, b = 1e9, c = -1e9, d = -1e9;
  (function walk(x) { if (typeof x[0] === 'number') { a = Math.min(a, x[0]); c = Math.max(c, x[0]); b = Math.min(b, x[1]); d = Math.max(d, x[1]); } else x.forEach(walk); })(coords);
  return { lat: (b + d) / 2, lon: (a + c) / 2 };
};

/** Which areas (boxes as [s, w, n, e]) lie inside a region the extracts cover. */
const covered = (box) => Object.values(REGIONS).some(([s, w, n, e]) => (box[0] + box[2]) / 2 >= s && (box[0] + box[2]) / 2 <= n && (box[1] + box[3]) / 2 >= w && (box[1] + box[3]) / 2 <= e);

/**
 * Elements (Overpass's shape) for every box, from the local extracts, plus the boxes no extract covers.
 * @param {number[][]} boxes [south, west, north, east]
 * @param {string[]} sels   the category table's Overpass selectors
 */
export async function localOsm(boxes, sels, log = console.log) {
  const t0 = Date.now();
  const mine = boxes.filter(covered), missing = boxes.filter((b) => !covered(b));
  if (!mine.length) return { elements: [], missing };
  await mkdir(WORK, { recursive: true });
  const { keys } = primaryKeys(sels);
  const keyTag = keys.join(',');
  const match = compileAny(sels);
  const regions = Object.keys(REGIONS);

  // 1. Coarse filter by key, once per extract (cached until the extract or the key list changes).
  await pool(regions, regions.length, async (r) => {
    const out = `${WORK}${r}.filtered.osm.pbf`, tag = `${WORK}${r}.filtered.keys`;
    const same = (await readFile(tag, 'utf8').catch(() => '')) === keyTag;
    if (same && await mtime(out) > await mtime(pbf(r))) return log(`  ${r}: filtered extract is current`);
    const s = Date.now();
    await run('osmium', ['tags-filter', '--overwrite', '-o', out, pbf(r), ...keys.map((k) => `nwr/${k}`)]);
    await writeFile(tag, keyTag);
    log(`  ${r}: filtered by key in ${((Date.now() - s) / 1000).toFixed(0)} s`);
  });

  // 2. One pass per region cuts every area's box out of the filtered file.
  const els = new Map();
  await pool(regions, regions.length, async (r) => {
    const cfg = `${WORK}${r}.extract.json`;
    await writeFile(cfg, JSON.stringify({ directory: WORK, extracts: mine.map((b, i) => ({ output: `${r}-${i}.osm.pbf`, output_format: 'pbf', bbox: [b[1], b[0], b[3], b[2]] })) }));
    await run('osmium', ['extract', '--overwrite', '-c', cfg, `${WORK}${r}.filtered.osm.pbf`]);
    // 3. Each cut becomes GeoJSON lines; the selectors decide what stays.
    await pool(mine.map((_, i) => i), 4, async (i) => {
      const src = `${WORK}${r}-${i}.osm.pbf`, out = `${WORK}${r}-${i}.geojsonseq`;
      await run('osmium', ['export', '--overwrite', '-f', 'geojsonseq', '--geometry-types=point,polygon', '--add-unique-id=type_id', '-o', out, src]);
      const rl = createInterface({ input: createReadStream(out, 'utf8'), crlfDelay: Infinity });
      for await (const line of rl) {
        const j = line.replace(/^\x1e/, '').trim();
        if (!j) continue;
        const f = JSON.parse(j), tags = f.properties ?? {};
        if (!f.geometry || !match(tags)) continue;
        // A point is `n<id>`; a polygon is `a<area id>`, where osmium numbers areas 2 × way id (from a way) or
        // 2 × relation id + 1 (from a multipolygon relation). Back to the OSM id, so it matches Overpass's.
        const raw = String(f.id), n = Number(raw.slice(1));
        const type = raw[0] === 'n' ? 'node' : raw[0] === 'w' ? 'way' : raw[0] === 'r' ? 'relation' : n % 2 === 0 ? 'way' : 'relation';
        const osmId = raw[0] === 'a' ? Math.floor(n / 2) : n;
        const c = f.geometry.type === 'Point' ? { lat: f.geometry.coordinates[1], lon: f.geometry.coordinates[0] } : centreOf(f.geometry.coordinates);
        els.set(`${type[0]}${osmId}`, type === 'node' ? { type, id: osmId, lat: c.lat, lon: c.lon, tags } : { type, id: osmId, center: c, tags });
      }
      await rm(out, { force: true });
      await rm(src, { force: true });
    });
  });
  log(`  local OSM: ${els.size} places in ${((Date.now() - t0) / 1000).toFixed(0)} s${missing.length ? `; ${missing.length} area(s) outside the extracts` : ''}`);
  return { elements: [...els.values()], missing };
}

if (process.argv[2] === 'fetch') {
  await fetchExtracts();
  console.log(await available() ? 'extracts ready' : 'extracts incomplete (is osmium installed? brew install osmium-tool)');
}
