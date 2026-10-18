// Quick adds: trending places saved on this phone, slotted after the stop they're nearest to.
// Stored in localStorage; the map and the day's timetable both listen for changes.
import type { ClientTrend } from '../lib/client';

export interface Add {
  id: string; day: number; after: number; afterId: string;
  name: string; ja: string | null; kind: string; lat: number; lng: number; km: number; wiki: string; at: string;
}
const KEY = 'jpc:adds';

export function adds(): Add[] {
  try { return JSON.parse(localStorage.getItem(KEY) ?? '[]') as Add[]; } catch { return []; }
}
function save(list: Add[]) {
  try { localStorage.setItem(KEY, JSON.stringify(list)); } catch { /* private mode: lives for this page only */ }
  document.dispatchEvent(new CustomEvent('adds:change', { detail: list }));
}
export const isAdded = (day: number, id: string) => adds().some((a) => a.day === day && a.id === id);

export function addTrend(day: number, t: ClientTrend) {
  if (isAdded(day, t.id)) return;
  save([...adds(), {
    id: t.id, day, after: t.near.i, afterId: t.near.stop, name: t.name, ja: t.ja, kind: t.kind,
    lat: t.lat, lng: t.lng, km: t.near.km, wiki: t.wiki, at: new Date().toISOString(),
  }]);
}
export function removeAdd(day: number, id: string) {
  save(adds().filter((a) => !(a.day === day && a.id === id)));
}

/** Walking minutes, allowing for streets not running straight (×1.3 at 4.5 km/h). */
export const walkMin = (km: number) => Math.max(1, Math.round(((km * 1.3) / 4.5) * 60));

/** Plain-text list to paste into TREK or the group chat. */
export function exportText(): string {
  const list = adds().slice().sort((a, b) => a.day - b.day || a.after - b.after);
  if (!list.length) return '';
  return ['Japan Plan C · our adds', ...list.map((a) =>
    `Day ${a.day} · after stop ${a.after}: ${a.name}${a.ja && a.ja !== a.name ? ` (${a.ja})` : ''} · ${walkMin(a.km)} min walk · https://www.google.com/maps/search/?api=1&query=${a.lat},${a.lng}`)].join('\n');
}
