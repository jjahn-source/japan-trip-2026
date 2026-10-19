// Astro integration: after the static build, write dist/sw.js with a precache
// manifest of every page and asset. Latin fonts outside the latin/latin-ext ranges
// (Vietnamese) are skipped and cached on first use instead.
import { createHash } from 'node:crypto';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

async function walk(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walk(full)));
    else out.push(full);
  }
  return out;
}

// The place pack (~2 MB gzipped) is not forced onto a phone at install: each day is fetched when it's
// needed (or on Wi-Fi), then kept by the PLACES cache below. A stop's large photo is cached the first
// time its sheet opens; the small list thumbnails are precached.
const SKIP = /(vietnamese.*\.woff2$|\.woff$|\.map$|^sw\.js$|\.DS_Store$|^places\/day-\d+\.json$|^thumbs\/.*-l\.webp$)/;

export function serviceWorker() {
  let base = '/';
  return {
    name: 'trip-service-worker',
    hooks: {
      'astro:config:done': ({ config }) => { base = config.base.endsWith('/') ? config.base : `${config.base}/`; },
      'astro:build:done': async ({ dir, logger }) => {
        const root = fileURLToPath(dir);
        const files = (await walk(root)).map((f) => relative(root, f).split(sep).join('/'))
          .filter((f) => !SKIP.test(f)).sort();
        const hash = createHash('sha256');
        const urls = [];
        for (const f of files) {
          hash.update(f).update(await readFile(join(root, f)));
          urls.push(base + f.replace(/(^|\/)index\.html$/, '$1'));
        }
        const version = hash.digest('hex').slice(0, 12);
        const sw = SW_SOURCE
          .replace('__VERSION__', version)
          .replace('__BASE__', JSON.stringify(base))
          .replace('__PRECACHE__', JSON.stringify(urls));
        await writeFile(join(root, 'sw.js'), sw);
        logger.info(`sw.js: ${urls.length} files precached, version ${version}`);
      },
    },
  };
}

const SW_SOURCE = String.raw`// Generated at build time. Offline support for the Japan Plan C site.
const VERSION = '__VERSION__';
const BASE = __BASE__;
const PRECACHE = __PRECACHE__;
const PAGES = 'pages-' + VERSION;
const RUNTIME = 'runtime-v1';   // fonts and other same-origin files fetched later
const TILES = 'tiles-v1';       // OpenFreeMap tiles, glyphs, sprites
const TILE_LIMIT = 3000;
const PLACES = 'places-v2';    // the place pack, a day at a time: kept, and refreshed after a rebuild
const SEARCH = 'search-v1';    // TREK Places and Photon answers: a repeated search is instant, and works offline
const SEARCH_LIMIT = 600;

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(PAGES).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) {
      if ((key.startsWith('pages-') && key !== PAGES) || (key.startsWith('places-') && key !== PLACES)) await caches.delete(key);
    }
    await self.clients.claim();
  })());
});

async function trim(cacheName, limit) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  for (let i = 0; i < keys.length - limit; i++) await cache.delete(keys[i]);
}

async function networkFirst(request) {
  const cache = await caches.open(PAGES);
  try {
    const response = await Promise.race([
      fetch(request),
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 4000)),
    ]);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch {
    return (await cache.match(request, { ignoreSearch: true }))
      || (await cache.match(BASE))
      || new Response('Offline', { status: 503 });
  }
}

async function cacheFirst(request, cacheName) {
  const hit = await caches.match(request, { ignoreSearch: true });
  if (hit) return hit;
  const response = await fetch(request);
  if (response.ok) (await caches.open(cacheName)).put(request, response.clone());
  return response;
}

async function staleWhileRevalidate(request, cacheName = TILES, limit = TILE_LIMIT) {
  const cache = await caches.open(cacheName);
  const hit = await cache.match(request);
  const refresh = fetch(request).then((response) => {
    if (response.ok) cache.put(request, response.clone()).then(() => trim(cacheName, limit));
    return response;
  }).catch(() => hit || Response.error());
  return hit || refresh;
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin === self.location.origin) {
    if (url.pathname.startsWith(BASE + 'places/day-')) event.respondWith(staleWhileRevalidate(request, PLACES, 100));
    else if (request.mode === 'navigate') event.respondWith(networkFirst(request));
    else event.respondWith(cacheFirst(request, RUNTIME));
  } else if (url.hostname === 'tiles.openfreemap.org') {
    event.respondWith(staleWhileRevalidate(request));
  } else if (url.hostname === 'places.liketrek.com' || url.hostname === 'photon.komoot.io') {
    event.respondWith(staleWhileRevalidate(request, SEARCH, SEARCH_LIMIT));
  }
});
`;
