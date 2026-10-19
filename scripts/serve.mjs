// npm run serve: serves the built site (dist/) the way a good host would, for sharing from this Mac.
//   · Brotli or gzip for text (the map engine is 1.8 MB raw, ~400 KB compressed), kept in memory;
//   · hashed build files (/_astro/) cached for a year, since their names change when they do;
//   · pages, the trip data and the service worker always revalidated, so an update shows at once.
// PORT (default 4326) and HOST (default 127.0.0.1) pick where it listens.
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { brotliCompressSync, constants, gzipSync } from 'node:zlib';

const DIST = fileURLToPath(new URL('../dist/', import.meta.url)).replace(/[\\/]$/, '');
const PORT = Number(process.env.PORT ?? 4326);
const HOST = process.env.HOST ?? '127.0.0.1';
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.webmanifest': 'application/manifest+json',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.ico': 'image/x-icon',
  '.woff2': 'font/woff2', '.txt': 'text/plain; charset=utf-8', '.xml': 'application/xml',
};
const TEXT = /^(text\/|application\/(json|manifest\+json|xml)|image\/svg)/;
const packed = new Map(); // file → { mtime, br, gz }

function cacheFor(path) {
  if (path.startsWith('/_astro/')) return 'public, max-age=31536000, immutable';
  if (/\.(html|json|webmanifest)$/.test(path) || path.endsWith('/') || path === '/sw.js') return 'no-cache';
  return 'public, max-age=86400';
}

createServer(async (req, res) => {
  try {
    if (req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(405); return res.end(); }
    const urlPath = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    let file = normalize(join(DIST, urlPath));
    if (file !== DIST && !file.startsWith(DIST + sep)) { res.writeHead(403); return res.end(); }
    let info = await stat(file).catch(() => null);
    if (info?.isDirectory()) {
      if (!urlPath.endsWith('/')) { res.writeHead(301, { location: urlPath + '/' }); return res.end(); }
      file = join(file, 'index.html');
      info = await stat(file).catch(() => null);
    }
    if (!info) {
      const page = await readFile(join(DIST, '404.html')).catch(() => Buffer.from('Not found'));
      res.writeHead(404, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-cache' });
      return res.end(req.method === 'HEAD' ? undefined : page);
    }
    const type = TYPES[extname(file)] ?? 'application/octet-stream';
    const etag = `"${info.size.toString(36)}-${Math.round(info.mtimeMs).toString(36)}"`;
    const headers = { 'content-type': type, 'cache-control': cacheFor(urlPath), etag, vary: 'Accept-Encoding', 'x-content-type-options': 'nosniff' };
    if (req.headers['if-none-match'] === etag) { res.writeHead(304, headers); return res.end(); }
    let body = await readFile(file);
    const accept = String(req.headers['accept-encoding'] ?? '');
    if (TEXT.test(type) && body.length > 1024 && /\b(br|gzip)\b/.test(accept)) {
      let p = packed.get(file);
      if (!p || p.mtime !== info.mtimeMs) {
        p = { mtime: info.mtimeMs, br: brotliCompressSync(body, { params: { [constants.BROTLI_PARAM_QUALITY]: 9 } }), gz: gzipSync(body, { level: 9 }) };
        packed.set(file, p);
      }
      const br = /\bbr\b/.test(accept);
      body = br ? p.br : p.gz;
      headers['content-encoding'] = br ? 'br' : 'gzip';
    }
    headers['content-length'] = body.length;
    res.writeHead(200, headers);
    res.end(req.method === 'HEAD' ? undefined : body);
  } catch (e) {
    res.writeHead(500); res.end('Server error');
    console.error(e);
  }
}).listen(PORT, HOST, () => console.log(`Serving dist/ on http://${HOST}:${PORT}`));
