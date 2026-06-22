import { useEffect, useState } from "react";

export type PlaceStatus = "open" | "closed" | "unknown";

export interface PlaceInfo {
  status: PlaceStatus;
  closesAt: string | null;
  rating: number | null;
}

const CACHE_TTL = 60 * 60 * 1000; // 1 hour

function cacheKey(placeId: string) {
  return `gplace:${placeId}`;
}

function readCache(placeId: string): PlaceInfo | null {
  try {
    const raw = sessionStorage.getItem(cacheKey(placeId));
    if (!raw) return null;
    const { data, ts } = JSON.parse(raw) as { data: PlaceInfo; ts: number };
    if (Date.now() - ts > CACHE_TTL) return null;
    return data;
  } catch {
    return null;
  }
}

function writeCache(placeId: string, data: PlaceInfo) {
  try {
    sessionStorage.setItem(cacheKey(placeId), JSON.stringify({ data, ts: Date.now() }));
  } catch {}
}

const UNKNOWN: PlaceInfo = { status: "unknown", closesAt: null, rating: null };

export function useGooglePlace(placeId: string | undefined): PlaceInfo {
  const [info, setInfo] = useState<PlaceInfo>(UNKNOWN);

  useEffect(() => {
    if (!placeId) return;
    const key = import.meta.env.VITE_GOOGLE_PLACES_KEY as string | undefined;
    if (!key) return;

    const cached = readCache(placeId);
    if (cached) { setInfo(cached); return; }

    const url =
      `https://maps.googleapis.com/maps/api/place/details/json` +
      `?place_id=${encodeURIComponent(placeId)}` +
      `&fields=opening_hours,rating` +
      `&key=${key}`;

    fetch(url)
      .then((r) => r.json())
      .then((json) => {
        const oh = json?.result?.opening_hours;
        const rating = json?.result?.rating ?? null;
        if (!oh) { writeCache(placeId, UNKNOWN); return; }

        const status: PlaceStatus = oh.open_now ? "open" : "closed";

        // Find today's period to get closing time
        let closesAt: string | null = null;
        if (oh.periods) {
          const now = new Date();
          const todayIdx = now.getDay();
          const todayPeriod = oh.periods.find(
            (p: { open?: { day: number }; close?: { time: string } }) => p.open?.day === todayIdx && p.close,
          );
          if (todayPeriod?.close?.time) {
            const t = todayPeriod.close.time;
            const h = parseInt(t.slice(0, 2), 10);
            const m = t.slice(2);
            const suffix = h >= 12 ? "PM" : "AM";
            const h12 = h > 12 ? h - 12 : h === 0 ? 12 : h;
            closesAt = `${h12}:${m} ${suffix}`;
          }
        }

        const result: PlaceInfo = { status, closesAt, rating };
        writeCache(placeId, result);
        setInfo(result);
      })
      .catch(() => {});
  }, [placeId]);

  return info;
}
