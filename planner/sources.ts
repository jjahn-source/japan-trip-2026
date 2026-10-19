// Every outside source the agent can use. Each one is cached, fails soft (returns an error string the
// model can read rather than throwing), and is only offered to the model when its key is set.
//   keyed:   TikHub · Grok X Search · Perplexity Search · SerpApi · Google Places · Hot Pepper · Gemini
//   keyless: TREK Places (Overture + OSM) and Photon for finding places · oEmbed · Wikipedia photos
import { execFile } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, readdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';
import { CACHE_DIR, cached, digest, http, key, km } from './lib.ts';
import { NAVITIME_HOST, normalize, routeUrl } from '../src/lib/navitime.ts';

const run = promisify(execFile);
export type LatLng = { lat: number; lng: number };
const soft = async (label: string, fn: () => Promise<string>) => {
  try { return await fn(); } catch (e) { return `${label} failed: ${(e as Error).message.slice(0, 300)}`; }
};

export const has = {
  tikhub: () => !!key('TIKHUB_API_KEY'),
  grok: () => !!key('XAI_API_KEY'),
  perplexity: () => !!key('PERPLEXITY_API_KEY'),
  serpapi: () => !!key('SERPAPI_API_KEY'),
  places: () => !!key('GOOGLE_MAPS_API_KEY'),
  hotpepper: () => !!key('HOTPEPPER_API_KEY') || !!key('PUBLIC_HOTPEPPER_KEY'),
  gemini: () => !!key('GEMINI_API_KEY'),
};

// ── TikHub: TikTok, Instagram, Lemon8, Xiaohongshu, Reddit, Threads, YouTube ──
const TIKHUB = 'https://api.tikhub.io';
async function tikhub(path: string, params: Record<string, string | number>) {
  const u = new URL(path, TIKHUB);
  for (const [k, v] of Object.entries(params)) u.searchParams.set(k, String(v));
  return cached('tikhub', u.toString(), () => http(u.toString(), { headers: { Authorization: `Bearer ${key('TIKHUB_API_KEY')}` }, timeoutMs: 45000 }), 3);
}
export type SocialPlatform = 'tiktok' | 'instagram' | 'lemon8' | 'xiaohongshu' | 'reddit' | 'threads' | 'youtube';
export function socialSearch(platform: SocialPlatform, query: string) {
  return soft(`${platform} search`, async () => {
    const r = await ({
      tiktok: () => tikhub('/api/v1/tiktok/app/v3/fetch_video_search_result', { keyword: query, count: 20, sort_type: 0, publish_time: 180, region: /[぀-ヿ一-鿿]/.test(query) ? 'JP' : 'US' }),
      // Instagram keyword search returns nothing for Japanese; hashtags are how it's searched anyway.
      instagram: () => tikhub('/api/v1/instagram/v1/fetch_hashtag_posts', { hashtag: query.replace(/[#\s]/g, '') }),
      lemon8: () => tikhub('/api/v1/lemon8/app/fetch_search', { query }),
      xiaohongshu: () => tikhub('/api/v1/xiaohongshu/app_v2/search_notes', { keyword: query, sort_type: 'general' }),
      reddit: () => tikhub('/api/v1/reddit/app/fetch_dynamic_search', { query, search_type: 'post', sort: 'RELEVANCE', need_format: 'True' }),
      threads: () => tikhub('/api/v1/threads/web/search_posts', { query }),
      youtube: () => tikhub('/api/v1/youtube/web_v2/get_general_search_v2', { keyword: query }),
    })[platform]();
    return digest(r);
  });
}
/** Recent Instagram posts tagged at (or next to) a place: the best proof a spot is real and current. */
export function postsAtPlace(at: LatLng, name: string) {
  return soft('posts at place', async () => {
    const locs = await tikhub('/api/v1/instagram/v3/search_by_coordinates', { latitude: at.lat.toFixed(5), longitude: at.lng.toFixed(5) }) as Record<string, unknown>;
    const flat = JSON.stringify(locs);
    // Prefer the location whose name matches; else the nearest the API returned first.
    const ids = [...flat.matchAll(/"(?:pk|id|location_id|external_id)":"?(\d{6,})"?[^{}]*?"name":"([^"]+)"/g)].map((m) => ({ id: m[1], name: m[2] }));
    const pick = ids.find((x) => x.name.toLowerCase().includes(name.toLowerCase().slice(0, 6))) ?? ids[0];
    if (!pick) return `No Instagram location found near ${name}.`;
    const posts = await tikhub('/api/v1/instagram/v3/get_location_posts', { location_id: pick.id, tab: 'recent', first: 12 });
    return `Instagram location "${pick.name}" (${pick.id}), recent posts: ${digest(posts, 8000)}`;
  });
}

// ── X (Twitter) through Grok's own X Search ──
export function xSearch(query: string, fromDate?: string) {
  return soft('X search', () => cached('grok', [query, fromDate], async () => {
    const r = await http<{ output?: { type: string; content?: { type: string; text?: string }[] }[] }>('https://api.x.ai/v1/responses', {
      method: 'POST', timeoutMs: 180000,
      headers: { Authorization: `Bearer ${key('XAI_API_KEY')}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'grok-4.7',
        tools: [{ type: 'x_search', ...(fromDate ? { from_date: fromDate } : {}) }],
        input: [{ role: 'user', content: `Search X (Japanese and English posts) for: ${query}\nReport what people actually say: specific places, recent first-hand experiences, warnings (queues, closures, sold out, price changes), with each post's date and URL. Be concrete; no generic advice.` }],
      }),
    });
    return (r.output ?? []).flatMap((o) => o.content ?? []).filter((c) => c.type === 'output_text').map((c) => c.text).join('\n').slice(0, 12000) || 'No X results.';
  }, 2));
}

// ── Yahoo! Japan realtime search: what people in Japan are posting on X right now (free, no login) ──
export function xJapan(query: string) {
  return soft('Yahoo realtime', () => cached('yahoo-rt', query, async () => {
    const res = await fetch(`https://search.yahoo.co.jp/realtime/search?p=${encodeURIComponent(query)}`, { headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36', 'Accept-Language': 'ja' }, signal: AbortSignal.timeout(20000) });
    const m = (await res.text()).match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);
    const entries = (m ? JSON.parse(m[1])?.props?.pageProps?.pageData?.timeline?.entry : null) as { createdAt?: number; displayText?: string; screenName?: string; id?: string; likesCount?: number; rtCount?: number }[] | null;
    if (!entries?.length) return 'No recent posts.';
    return entries.slice(0, 15).map((e) => `- ${e.createdAt ? new Date(e.createdAt * 1000).toISOString().slice(0, 16).replace('T', ' ') : ''} @${e.screenName} (${e.likesCount ?? 0}♥ ${e.rtCount ?? 0}RT): ${(e.displayText ?? '').replace(/\tSTART\t|\tEND\t/g, '').replace(/\s+/g, ' ').slice(0, 280)} https://x.com/${e.screenName}/status/${e.id}`).join('\n');
  }, 1));
}

// ── Perplexity Search API (top of the Artificial Analysis search index) ──
export function webSearch(query: string) {
  return soft('Perplexity search', () => cached('perplexity', query, async () => {
    const r = await http<{ results?: { title: string; url: string; snippet?: string; date?: string }[] }>('https://api.perplexity.ai/search', {
      method: 'POST', headers: { Authorization: `Bearer ${key('PERPLEXITY_API_KEY')}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, max_results: 10 }),
    });
    return (r.results ?? []).map((x) => `- ${x.title} (${x.date ?? 'undated'}) ${x.url}\n  ${(x.snippet ?? '').slice(0, 400)}`).join('\n') || 'No results.';
  }, 3));
}

// ── SerpApi: Google as Japanese users see it, and every Google Maps review ──
const serp = (params: Record<string, string>) => {
  const u = new URL('https://serpapi.com/search.json');
  for (const [k, v] of Object.entries({ ...params, api_key: key('SERPAPI_API_KEY')! })) u.searchParams.set(k, v);
  return cached('serpapi', params, () => http<Record<string, unknown>>(u.toString(), { timeoutMs: 60000 }), 5);
};
export function googleJapan(query: string) {
  return soft('Google (JP)', async () => {
    const r = await serp({ engine: 'google', q: query, gl: 'jp', hl: 'ja', num: '10' }) as { organic_results?: { title: string; link: string; snippet?: string; date?: string }[] };
    return (r.organic_results ?? []).map((x) => `- ${x.title} ${x.link}${x.date ? ` (${x.date})` : ''}\n  ${(x.snippet ?? '').slice(0, 300)}`).join('\n') || 'No results.';
  });
}
/** The newest Japanese-language Google Maps reviews for a place (all of them, not Google's five). */
export function mapsReviews(name: string, at: LatLng, topic?: string) {
  return soft('Google Maps reviews', async () => {
    const found = await serp({ engine: 'google_maps', q: name, ll: `@${at.lat},${at.lng},16z`, hl: 'ja', type: 'search' }) as { place_results?: { data_id?: string; title?: string; rating?: number; reviews?: number }; local_results?: { data_id?: string; title?: string; rating?: number; reviews?: number }[] };
    const p = found.place_results ?? found.local_results?.[0];
    if (!p?.data_id) return `No Google Maps place found for ${name}.`;
    const rv = await serp({ engine: 'google_maps_reviews', data_id: p.data_id, hl: 'ja', sort_by: 'newestFirst', ...(topic ? { query: topic } : {}) }) as { reviews?: { rating?: number; date?: string; iso_date?: string; snippet?: string }[] };
    const lines = (rv.reviews ?? []).slice(0, 20).map((x) => `- ${x.rating ?? '?'}★ ${x.iso_date?.slice(0, 10) ?? x.date ?? ''}: ${(x.snippet ?? '').slice(0, 280)}`);
    return `${p.title}: ${p.rating ?? '?'}★ from ${p.reviews ?? '?'} reviews. Newest${topic ? ` mentioning "${topic}"` : ''}:\n${lines.join('\n')}`;
  });
}

// ── Google Places (official): is it real, open, and when ──
export interface PlaceFacts {
  name: string; address?: string; lat: number; lng: number; status?: string; rating?: number; ratings?: number;
  hours?: string[]; website?: string; maps?: string; phone?: string; price?: string; placeId?: string; source: string;
  /** Machine-readable weekly hours (Google): day 0 = Sunday, times as HHMM. */
  periods?: { open: { day: number; hour: number; minute: number }; close?: { day: number; hour: number; minute: number } }[];
}
export async function placesLookup(query: string, near?: LatLng): Promise<PlaceFacts | null> {
  return cached('places2', [query, near && [near.lat.toFixed(3), near.lng.toFixed(3)]], async () => {
    const r = await http<{ places?: { id: string; displayName?: { text: string }; formattedAddress?: string; location?: { latitude: number; longitude: number }; rating?: number; userRatingCount?: number; businessStatus?: string; regularOpeningHours?: { weekdayDescriptions?: string[]; periods?: PlaceFacts['periods'] }; websiteUri?: string; googleMapsUri?: string; nationalPhoneNumber?: string; priceLevel?: string }[] }>('https://places.googleapis.com/v1/places:searchText', {
      method: 'POST',
      headers: {
        'X-Goog-Api-Key': key('GOOGLE_MAPS_API_KEY')!, 'Content-Type': 'application/json',
        'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.location,places.rating,places.userRatingCount,places.businessStatus,places.regularOpeningHours.weekdayDescriptions,places.regularOpeningHours.periods,places.websiteUri,places.googleMapsUri,places.nationalPhoneNumber,places.priceLevel',
      },
      body: JSON.stringify({ textQuery: query, languageCode: 'en', regionCode: 'JP', ...(near ? { locationBias: { circle: { center: { latitude: near.lat, longitude: near.lng }, radius: 20000 } } } : {}) }),
    });
    const p = r.places?.[0];
    if (!p?.location) return null;
    return {
      name: p.displayName?.text ?? query, address: p.formattedAddress, lat: p.location.latitude, lng: p.location.longitude, status: p.businessStatus,
      rating: p.rating, ratings: p.userRatingCount, hours: p.regularOpeningHours?.weekdayDescriptions, website: p.websiteUri, maps: p.googleMapsUri,
      phone: p.nationalPhoneNumber, price: p.priceLevel, placeId: p.id, source: 'Google Places', periods: p.regularOpeningHours?.periods,
    };
  }, 14).catch(() => null);
}

// ── Keyless place finding: the TREK Places index (Overture + its OSM layer), then Photon ──
// A hit must share the place's OWN name words, not just its neighbourhood: "Uoshin Shibuya" must
// not come back as some other bar in Shibuya.
const GENERIC = new Set(['the', 'and', 'tokyo', 'osaka', 'kyoto', 'nara', 'hakone', 'japan', 'shibuya', 'shinjuku', 'harajuku', 'ginza', 'umeda', 'namba', 'station', 'store', 'shop', 'branch', 'main', 'restaurant', 'bar', 'cafe', 'honten', 'ten', 'stn', 'east', 'west', 'north', 'south', 'exit']);
const tokens = (s: string) => s.toLowerCase().normalize('NFKC').split(/[\s,·()\-–—/.'’&]+/).filter((w) => (w.length > 2 || /[\u3040-\u30ff\u4e00-\u9fff]/.test(w)) && !GENERIC.has(w));
export function nameMatch(want: string, got: string): boolean {
  const w = tokens(want), g = got.toLowerCase().normalize('NFKC');
  // Names made only of common words (e.g. Shinjuku Station) must match whole.
  if (!w.length) { const x = want.toLowerCase().normalize('NFKC').trim(); return g === x || g.startsWith(x); }
  // A station exit or car park named after a place is not the place.
  const infra = /\b(station|eki|mae|exit|entrance|bus stop|parking|car park|gate|platform)\b|駅|出口|入口|駐車場|乗り場|停留所/;
  if (infra.test(g) && !infra.test(want.toLowerCase())) return false;
  const hit = w.filter((t) => g.includes(t)).length;
  return hit >= Math.max(1, Math.ceil(w.length / 2));
}
export async function findPlace(name: string, near?: LatLng, area = ''): Promise<PlaceFacts | null> {
  const query = `${name} ${area}`.trim();
  if (has.places()) { const g = await placesLookup(query, near); if (g && nameMatch(name, g.name)) return g; }
  return cached('findplace4', [query, near && [near.lat.toFixed(2), near.lng.toFixed(2)]], async () => {
    const at = near ?? { lat: 35.68, lng: 139.76 };
    try {
      const t = await http<{ results?: { name: string; lat: number; lng: number; category?: string; hours?: { osm?: string } | null; contact?: { website?: string; phone?: string } | null; address?: { freeform?: string | null } | null; locality?: string | null }[] }>(
        `https://places.liketrek.com/v1/search?q=${encodeURIComponent(query)}&lat=${at.lat}&lng=${at.lng}&limit=5&lang=en&sources=index,osm`, { timeoutMs: 15000 });
      const hit = (t.results ?? []).filter((h) => Number.isFinite(h.lat) && km(h, at) < 60 && nameMatch(name, h.name))[0];
      if (hit) {
        return { name: hit.name, lat: hit.lat, lng: hit.lng, address: hit.address?.freeform ?? hit.locality ?? undefined, hours: hit.hours?.osm ? [hit.hours.osm] : undefined, website: hit.contact?.website, phone: hit.contact?.phone, source: 'TREK Places' };
      }
    } catch { /* fall through to Photon */ }
    try {
      const p = await http<{ features: { geometry: { coordinates: [number, number] }; properties: { name?: string; city?: string; district?: string } }[] }>(
        `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&lat=${at.lat}&lon=${at.lng}&limit=3&lang=en`, { timeoutMs: 15000 });
      const f = p.features.find((x) => x.properties.name && nameMatch(name, x.properties.name) && km({ lat: x.geometry.coordinates[1], lng: x.geometry.coordinates[0] }, at) < 60);
      if (f) return { name: f.properties.name!, lat: f.geometry.coordinates[1], lng: f.geometry.coordinates[0], address: [f.properties.district, f.properties.city].filter(Boolean).join(', '), source: 'OpenStreetMap' };
    } catch { /* nothing found */ }
    return null;
  }, 14);
}

// ── Real travel times: NAVITIME for trains and buses (Japan's own timetables), Google for walks and cars ──
// (Google's Routes API has no transit in Japan; it does walking and driving.)
export interface Travel { mode: 'walk' | 'transit' | 'car'; minutes: number; dep?: string; arr?: string; fare?: number | null; rides?: string[]; carMinutes?: number }
export async function googleMinutes(a: LatLng, b: LatLng, mode: 'WALK' | 'DRIVE') {
  if (!has.places()) return null;
  return cached('gmroute', [a.lat.toFixed(4), a.lng.toFixed(4), b.lat.toFixed(4), b.lng.toFixed(4), mode], async () => {
    const r = await http<{ routes?: { duration?: string }[] }>('https://routes.googleapis.com/directions/v2:computeRoutes', {
      method: 'POST', headers: { 'X-Goog-Api-Key': key('GOOGLE_MAPS_API_KEY')!, 'Content-Type': 'application/json', 'X-Goog-FieldMask': 'routes.duration' },
      body: JSON.stringify({ origin: { location: { latLng: { latitude: a.lat, longitude: a.lng } } }, destination: { location: { latLng: { latitude: b.lat, longitude: b.lng } } }, travelMode: mode }),
    });
    const d = r.routes?.[0]?.duration;
    return d ? Math.round(parseInt(d, 10) / 60) : null;
  }, 60).catch(() => null);
}
// NAVITIME's remaining monthly calls, as its last reply reported them.
const QUOTA = join(CACHE_DIR, 'navitime-quota.json');
const readQuota = () => { try { const q = JSON.parse(readFileSync(QUOTA, 'utf8')) as { left: number; at: number }; return Date.now() - q.at < 31 * 864e5 ? q.left : null; } catch { return null; } };
const writeQuota = (left: number) => { try { mkdirSync(CACHE_DIR, { recursive: true }); writeFileSync(QUOTA, JSON.stringify({ left, at: Date.now() })); } catch { /* best effort */ } };
export const navitimeLeft = readQuota;
/** How long A → B really takes when leaving at `depart` (Japan time, "YYYY-MM-DDTHH:MM"). */
export async function travel(a: LatLng, b: LatLng, depart: string): Promise<Travel | null> {
  const d = km(a, b);
  if (d < 1.0) { const w = await googleMinutes(a, b, 'WALK'); return { mode: 'walk', minutes: w ?? Math.max(1, Math.round((d * 1.3 / 4.5) * 60)) }; }
  const car = await googleMinutes(a, b, 'DRIVE');
  if (!key('RAPIDAPI_KEY')) return car != null ? { mode: 'car', minutes: car, carMinutes: car } : null;
  // Rounded UP to 10 minutes so nearby checks share one request (the free plan is 500 a month) and no
  // route ever leaves before they do.
  const t = new Date(`${depart}:00+09:00`); t.setMinutes(Math.ceil(t.getMinutes() / 10) * 10);
  const start = new Date(t.getTime() + 9 * 3600e3).toISOString().slice(0, 16);
  const tr = await cached('navitime4', [a.lat.toFixed(3), a.lng.toFixed(3), b.lat.toFixed(3), b.lng.toFixed(3), start], async () => {
    // The free plan has a hard monthly limit: keep the last 40 calls in reserve and estimate instead.
    const q = readQuota();
    if (q != null && q < 40) throw new Error('NAVITIME quota nearly used up');
    const res = await fetch(routeUrl([a.lng, a.lat], [b.lng, b.lat], `${start}:00`, 2), { headers: { 'x-rapidapi-key': key('RAPIDAPI_KEY')!, 'x-rapidapi-host': NAVITIME_HOST }, signal: AbortSignal.timeout(30000) });
    const left = Number(res.headers.get('x-ratelimit-requests-remaining'));
    if (Number.isFinite(left)) writeQuota(left);
    if (!res.ok) throw new Error(`NAVITIME ${res.status}`);
    const j = await res.json() as { items?: unknown[] };
    const n = j.items?.[0] ? normalize(j.items[0] as Parameters<typeof normalize>[0]) : null;
    return n ? { dep: n.dep, arr: n.arr, door: n.door ?? n.arr, minutes: n.minutes, fare: n.fare, rides: n.rides.map((x) => `${x.line}${/bus/.test(x.mode ?? '') && !/バス|bus/i.test(x.line) ? ' (bus)' : ''} ${x.from}→${x.to} ${x.dep.slice(11, 16)}→${x.arr.slice(11, 16)}`) } : null;
  }, 60).catch(() => null);
  // NAVITIME answers "walk" when no train serves the trip: a long walk means no rail route, so time it by car.
  // No regular trains run between about 00:45 and 04:45: a ride timed then is not real, so it's a taxi.
  if (tr && tr.rides.some((r) => { const m = r.match(/ (\d\d):(\d\d)→/); const v = m ? +m[1] * 60 + +m[2] : -1; return v >= 45 && v < 285; })) return car != null ? { mode: 'car', minutes: car, carMinutes: car } : null;
  if (tr && !tr.rides.length) { const walk = Math.round((Date.parse(tr.arr) - Date.parse(tr.dep)) / 60000); if (walk <= 30 || car == null) return { mode: 'walk', minutes: walk }; return { mode: 'car', minutes: car, carMinutes: car }; }
  // Total time from the moment they leave: waiting for the train counts.
  if (tr) return { mode: 'transit', minutes: Math.round((Date.parse(tr.door ?? tr.arr) - Date.parse(`${depart}:00+09:00`)) / 60000), dep: tr.dep, arr: tr.arr, fare: tr.fare, rides: tr.rides, carMinutes: car ?? undefined };
  return car != null ? { mode: 'car', minutes: car, carMinutes: car } : null;
}

// ── Hot Pepper (official): restaurants with room for the whole group ──
export function groupDining(at: LatLng, keyword: string, people: number) {
  return soft('Hot Pepper', () => cached('hotpepper', [at.lat.toFixed(3), at.lng.toFixed(3), keyword, people], async () => {
    const k = key('HOTPEPPER_API_KEY') ?? key('PUBLIC_HOTPEPPER_KEY');
    const u = `https://webservice.recruit.co.jp/hotpepper/gourmet/v1/?key=${k}&lat=${at.lat}&lng=${at.lng}&range=3&party_capacity=${people}&count=20&format=json${keyword ? `&keyword=${encodeURIComponent(keyword)}` : ''}`;
    const r = await http<{ results: { shop?: { name: string; genre?: { name: string }; budget?: { average?: string }; party_capacity?: number | string; open?: string; urls?: { pc?: string }; lat: number; lng: number; catch?: string }[] } }>(u);
    return (r.results.shop ?? []).map((s) => `- ${s.name} · ${s.genre?.name ?? ''} · seats ${s.party_capacity} · ${s.budget?.average ?? ''} · ${s.open ?? ''} · ${s.urls?.pc ?? ''} (${(+s.lat).toFixed(5)},${(+s.lng).toFixed(5)})`).join('\n') || 'No group-sized restaurants found.';
  }, 7));
}

// ── Gemini 3.8 Flash watches a video: speech, on-screen text and what's shown ──
const GEMINI_MODEL = 'gemini-3.8-flash';
export function watchVideo(url: string, question: string) {
  return soft('watch video', () => cached('gemini', [url, question], async () => {
    let part: Record<string, unknown>;
    if (/youtube\.com|youtu\.be/.test(url)) part = { file_data: { file_uri: url } };
    else {
      // TikTok / Instagram / others: download the public video with yt-dlp, then send it inline.
      const dir = mkdtempSync(join(tmpdir(), 'reel-'));
      try {
        await run('yt-dlp', ['-q', '--no-playlist', '-f', 'mp4/best[filesize<18M]/best', '--max-filesize', '19M', '-o', join(dir, 'v.%(ext)s'), url], { timeout: 120000 });
        const f = readdirSync(dir).find((x) => x.startsWith('v.'));
        if (!f || statSync(join(dir, f)).size > 19.5e6) throw new Error('video unavailable or too large');
        part = { inline_data: { mime_type: 'video/mp4', data: readFileSync(join(dir, f)).toString('base64') } };
      } finally { rmSync(dir, { recursive: true, force: true }); }
    }
    const r = await http<{ candidates?: { content?: { parts?: { text?: string }[] } }[] }>(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`, {
        method: 'POST', timeoutMs: 180000,
        headers: { 'x-goog-api-key': key('GEMINI_API_KEY')!, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [part, { text: `${question}\n\nWatch and listen to the whole video, and read any on-screen text (much of it may be Japanese). Report: every place named or shown (with any address, station or neighbourhood visible), prices, what the creator actually says about it (good and bad), queue/booking hints, and the posting context if visible. Quote Japanese place names in Japanese as well.` }] }],
          generationConfig: { mediaResolution: 'MEDIA_RESOLUTION_HIGH' },
        }),
      });
    return r.candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join('') || 'The model returned nothing for this video.';
  }, 30));
}

// ── Free extras: embeds and photos ──
export type Media = { kind: 'tiktok' | 'instagram' | 'youtube' | 'image'; url: string; embed?: string; thumb?: string; credit?: string; title?: string };
/** Embed details for a social video URL (TikTok and YouTube need no key; Meta went tokenless in 2026). */
export async function embedFor(url: string): Promise<Media | null> {
  return cached('oembed', url, async () => {
    try {
      if (/tiktok\.com/.test(url)) {
        const o = await http<{ title?: string; author_name?: string; thumbnail_url?: string }>(`https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`, { timeoutMs: 15000 }, 1);
        const id = url.match(/video\/(\d+)/)?.[1];
        return id ? { kind: 'tiktok' as const, url, embed: `https://www.tiktok.com/embed/v2/${id}`, title: o.title, credit: o.author_name } : null;
      }
      if (/instagram\.com\/(reel|p)\//.test(url)) {
        const code = url.match(/instagram\.com\/(?:reel|p)\/([\w-]+)/)?.[1];
        const o = await http<{ author_name?: string; title?: string }>(`https://graph.facebook.com/v25.0/instagram_oembed?url=${encodeURIComponent(url)}&omitscript=true`, { timeoutMs: 15000 }, 1).catch(() => null);
        return code ? { kind: 'instagram' as const, url, embed: `https://www.instagram.com/reel/${code}/embed`, credit: o?.author_name, title: o?.title } : null;
      }
      const yt = url.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)([\w-]{11})/)?.[1];
      if (yt) {
        const o = await http<{ title?: string; author_name?: string }>(`https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`, { timeoutMs: 15000 }, 1).catch(() => null);
        return { kind: 'youtube' as const, url, embed: `https://www.youtube-nocookie.com/embed/${yt}`, thumb: `https://i.ytimg.com/vi/${yt}/hqdefault.jpg`, title: o?.title, credit: o?.author_name };
      }
    } catch { /* not embeddable */ }
    return null;
  }, 30);
}
/** The venue's own preview image (og:image on its website): free, and the photo it chose for itself. */
export async function siteImage(website: string): Promise<Media | null> {
  return cached('ogimage2', website, async () => {
    try {
      const res = await fetch(website, { signal: AbortSignal.timeout(12000), redirect: 'follow', headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh) japan-plan-c-trip-site/1.0' } });
      if (!res.ok || !/html/.test(res.headers.get('content-type') ?? '')) return null;
      const head = (await res.text()).slice(0, 200000);
      const m = head.match(/<meta[^>]+(?:property|name)=["'](?:og:image|twitter:image)(?::url)?["'][^>]*content=["']([^"']+)["']/i)
        ?? head.match(/<meta[^>]+content=["']([^"']+)["'][^>]*(?:property|name)=["'](?:og:image|twitter:image)["']/i);
      if (!m) return null;
      const url = new URL(m[1].replace(/&amp;/g, '&'), res.url).toString();
      if (!/^https:/.test(url) || /logo|icon|favicon|placeholder|noimage|blank\./i.test(url)) return null;
      // Only a real, loadable picture of a decent size makes it into the guide.
      const img = await fetch(url, { signal: AbortSignal.timeout(12000), headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh)' } });
      if (!img.ok || !/^image\//.test(img.headers.get('content-type') ?? '') || (await img.arrayBuffer()).byteLength < 15000) return null;
      return { kind: 'image' as const, url, credit: new URL(res.url).hostname.replace(/^www\./, '') };
    } catch { return null; }
  }, 30);
}
/** A freely licensed photo of the place: the Wikipedia article's lead image, if the article sits on the spot. */
export async function photoFor(name: string, at: LatLng): Promise<Media | null> {
  return cached('photo', [name, at.lat.toFixed(3), at.lng.toFixed(3)], async () => {
    for (const lang of ['en', 'ja']) {
      try {
        const r = await http<{ query?: { pages?: Record<string, { title: string; original?: { source: string }; coordinates?: { lat: number; lon: number }[] }> } }>(
          `https://${lang}.wikipedia.org/w/api.php?action=query&format=json&generator=search&gsrlimit=3&gsrsearch=${encodeURIComponent(name)}&prop=pageimages|coordinates&piprop=original`,
          { timeoutMs: 15000, headers: { 'User-Agent': 'japan-plan-c-trip-site/1.0 (private trip planner)' } }, 1);
        for (const p of Object.values(r.query?.pages ?? {})) {
          const c = p.coordinates?.[0];
          if (p.original?.source && c && km({ lat: c.lat, lng: c.lon }, at) < 1.5 && !/\.svg$/i.test(p.original.source)) {
            return { kind: 'image' as const, url: p.original.source, credit: `Wikipedia · ${p.title}` };
          }
        }
      } catch { /* try the next language */ }
    }
    return null;
  }, 30);
}
