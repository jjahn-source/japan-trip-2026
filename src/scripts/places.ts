// The place pack on the phone (scripts/places.mjs → public/places/): every searchable place near each
// day's stops, loaded a day at a time, folded once, searched in memory. This is what makes search
// answer on the first keystroke and keep answering with no signal.
import { CATS } from '../lib/categories';
import { keys, type Keys } from '../lib/textmatch';

const base = import.meta.env.BASE_URL.replace(/\/$/, '');
export interface PackPlace {
  id: string; name: string; alt: string[]; lat: number; lng: number; cats: string[]; kind: string;
  cuisine: string | null; hours: string | null; flags: number; website: string | null; wikidata: string | null;
  src: 'o' | 't' | 'ot'; keys: Keys;
}
export const FLAG = { card: 1, wheelchair: 2, vegetarian: 4, halal: 8, nosmoking: 16, free: 32 } as const;
interface Index { generated: string; radius: number; cats: string[]; days: Record<string, { count: number; at: [number, number][] }> }
type Row = [string, string, number, number, number[], string, string, number, string, string, 'o' | 't' | 'ot', string, string];
const OSM_TYPE: Record<string, string> = { n: 'node', w: 'way', r: 'relation' };

let index: Promise<Index | null> | null = null;
const days = new Map<number, Promise<PackPlace[]>>();

export function packIndex(): Promise<Index | null> {
  index ??= fetch(`${base}/places/index.json`).then((r) => (r.ok ? r.json() : null)).catch(() => { index = null; return null; });
  return index;
}
export function loadDay(d: number): Promise<PackPlace[]> {
  let p = days.get(d);
  if (!p) {
    p = (async () => {
      const ix = await packIndex();
      if (!ix?.days[d]) return [];
      const r = await fetch(`${base}/places/day-${d}.json`);
      if (!r.ok) throw new Error(String(r.status));
      const cat = ix.cats;
      const out = ((await r.json()).rows as Row[]).map(([name, alt, lat, lng, ci, cuisine, hours, flags, web, wd, src, sid, k]): PackPlace => {
        const alts = alt ? alt.split('|') : [];
        const cats = ci.map((i) => cat[i]).filter(Boolean);
        const segs = k?.split('|');
        return {
          id: sid[0] === 't' ? `trek:${sid.slice(1)}` : `osm:${OSM_TYPE[sid[0]]}:${sid.slice(1)}`,
          name: name || alts[0] || label(cats[0]), alt: alts, lat: lat / 1e5, lng: lng / 1e5, cats,
          kind: cats[0] ?? 'place', cuisine: cuisine || null, hours: hours || null, flags, website: web || null, wikidata: wd || null, src,
          // Folded at build; a pack from before that (still in a phone's cache) is folded here instead.
          keys: segs ? { whole: segs.map((s) => s.replace(/ /g, '')), words: [...new Set(k.replace(/\|/g, ' ').split(' '))].filter(Boolean) } : keys(name, ...alts),
        };
      });
      return out;
    })().catch(() => { days.delete(d); return []; }); // offline and not cached yet: try again next time
    days.set(d, p);
  }
  return p;
}
const label = (k: string | undefined) => CATS.find((c) => c.key === k)?.label.replace(/s$/, '') ?? 'Place';

const near = (a: { lat: number; lng: number }, lat: number, lng: number, km: number) => {
  const dy = (a.lat - lat) * 111, dx = (a.lng - lng) * 111 * Math.cos((lat * Math.PI) / 180);
  return dx * dx + dy * dy <= km * km;
};
/** The days whose packed area reaches these points (within `km`). */
export async function daysFor(points: { lat: number; lng: number }[], km: number): Promise<number[]> {
  const ix = await packIndex();
  if (!ix) return [];
  const reach = ix.radius / 1000 + km;
  return Object.entries(ix.days).filter(([, v]) => v.at.some(([la, lo]) => points.some((p) => near(p, la / 1e5, lo / 1e5, reach)))).map(([d]) => +d);
}
/** Whether every point is well inside the packed area, so the pack alone has the whole answer. */
export async function covered(points: { lat: number; lng: number }[], radiusKm: number): Promise<boolean> {
  const ix = await packIndex();
  if (!ix || !points.length) return false;
  const inner = Math.max(0, ix.radius / 1000 - radiusKm * 0.6);
  const all = Object.values(ix.days).flatMap((v) => v.at);
  return points.every((p) => all.some(([la, lo]) => near(p, la / 1e5, lo / 1e5, inner)));
}
/**
 * The pack places that could answer a search: inside the box around these points (unless `km` is
 * Infinity), passing `keep`, each once. Filtering here, on the folded keys built at load, is what
 * keeps a search over eight Tokyo days (~30,000 places) to a few milliseconds.
 */
export async function packQuery(points: { lat: number; lng: number }[], km: number, keep: (p: PackPlace) => boolean, near = km): Promise<PackPlace[]> {
  const ds = await daysFor(points, Number.isFinite(near) ? near : 6);
  const lists = await Promise.all(ds.map(loadDay));
  const dLat = km / 111, dLng = km / (111 * Math.cos(((points[0]?.lat ?? 35) * Math.PI) / 180));
  const lat0 = Math.min(...points.map((p) => p.lat)) - dLat, lat1 = Math.max(...points.map((p) => p.lat)) + dLat;
  const lng0 = Math.min(...points.map((p) => p.lng)) - dLng, lng1 = Math.max(...points.map((p) => p.lng)) + dLng;
  const seen = new Set<string>();
  const out: PackPlace[] = [];
  for (const list of lists) for (const p of list) {
    if (p.lat < lat0 || p.lat > lat1 || p.lng < lng0 || p.lng > lng1 || seen.has(p.id)) continue;
    seen.add(p.id);
    if (keep(p)) out.push(p);
  }
  return out;
}
/** Warm the pack for a day (and its neighbours) when the phone is idle; on Wi-Fi, every day, for offline. */
export function prefetch(day: number) {
  const go = async () => {
    void loadDay(day); if (day > 1) void loadDay(day - 1); void loadDay(day + 1);
    const c = (navigator as unknown as { connection?: { type?: string; saveData?: boolean; effectiveType?: string } }).connection;
    if (!c || c.saveData || !(c.type === 'wifi' || c.type === 'ethernet' || (!c.type && c.effectiveType === '4g'))) return;
    const ix = await packIndex();
    // Fetched for the service worker to keep; not parsed, so it costs no memory here.
    for (const d of Object.keys(ix?.days ?? {})) await fetch(`${base}/places/day-${d}.json`).catch(() => undefined);
  };
  const w = window as unknown as { requestIdleCallback?: (f: () => void, o?: object) => void };
  if (w.requestIdleCallback) w.requestIdleCallback(go, { timeout: 3000 }); else setTimeout(go, 1500);
}
