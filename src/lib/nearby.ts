// "What's open near us right now?": the search box asks the Worker (/api/nearby), the Worker asks Google
// Places (open now, near the phone) and shapes the answer here: close enough to walk, with rating, when it
// closes tonight, and whether it suits a group. Google's own order (relevance near the phone) is kept.

/** The Places fields the Worker asks for (Text Search; Enterprise + Atmosphere). */
export const NEARBY_FIELDS = ['id', 'displayName', 'location', 'rating', 'userRatingCount', 'primaryTypeDisplayName', 'goodForGroups', 'reservable', 'paymentOptions', 'currentOpeningHours.nextCloseTime', 'googleMapsUri']
  .map((f) => `places.${f}`).join(',');
/** As far as anyone walks at 1am: about 15 minutes. */
export const NEARBY_M = 1200;

export interface GPlace {
  id: string; displayName?: { text: string }; location?: { latitude: number; longitude: number };
  rating?: number; userRatingCount?: number; primaryTypeDisplayName?: { text: string };
  goodForGroups?: boolean; reservable?: boolean; paymentOptions?: { acceptsCashOnly?: boolean; acceptsCreditCards?: boolean };
  currentOpeningHours?: { nextCloseTime?: string }; googleMapsUri?: string;
}
export interface NearbyRow {
  id: string; name: string; kind: string | null; rating: number | null; ratings: number | null;
  m: number; walk: number; closes: string | null; groups: boolean | null; book: boolean | null; cash: boolean;
  lat: number; lng: number; maps: string | null;
}

const metres = (a: { lat: number; lng: number }, b: { lat: number; lng: number }) => Math.hypot((b.lng - a.lng) * Math.cos((a.lat * Math.PI) / 180), b.lat - a.lat) * 111195;
/** "02:00" in Japan time for an ISO moment. */
const jstClock = (iso: string) => new Date(Date.parse(iso) + 9 * 3600e3).toISOString().slice(11, 16);

/** Google's places as rows for the search box: walkable, and (for the group) not marked bad for groups. */
export function nearbyRows(places: GPlace[] | undefined, at: { lat: number; lng: number }, group: boolean): NearbyRow[] {
  const out: NearbyRow[] = [];
  for (const p of places ?? []) {
    if (!p.location) continue;
    const here = { lat: p.location.latitude, lng: p.location.longitude };
    const m = Math.round(metres(at, here));
    if (m > NEARBY_M || (group && p.goodForGroups === false)) continue;
    out.push({
      id: p.id, name: p.displayName?.text ?? '', kind: p.primaryTypeDisplayName?.text ?? null,
      rating: p.rating ?? null, ratings: p.userRatingCount ?? null, m, walk: Math.max(1, Math.round((m * 1.3) / 80)),
      closes: p.currentOpeningHours?.nextCloseTime ? jstClock(p.currentOpeningHours.nextCloseTime) : null,
      groups: p.goodForGroups ?? null, book: p.reservable ?? null, cash: !!p.paymentOptions?.acceptsCashOnly,
      lat: here.lat, lng: here.lng, maps: p.googleMapsUri ?? null,
    });
  }
  return out;
}

/** A search the Worker will send to Google: words only, at most 60 characters, and a point in Japan. */
export function nearbyQuery(q: string | null, lat: number, lng: number): { q: string; lat: number; lng: number } | null {
  const text = (q ?? '').replace(/\bopen( now)?\b|\bnear(by| me| us)?\b|営業中/gi, '').replace(/\s+/g, ' ').trim().slice(0, 60);
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat < 24 || lat > 46 || lng < 122 || lng > 146) return null;
  return { q: text || 'restaurant', lat: Math.round(lat * 1e3) / 1e3, lng: Math.round(lng * 1e3) / 1e3 };
}
