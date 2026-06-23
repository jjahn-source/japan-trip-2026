import { useEffect, useState } from "react";

export type PlaceStatus = "open" | "closed" | "unknown";

export interface PlaceInfo {
  status: PlaceStatus;
  closesAt: string | null;
  rating: number | null;
}

const CACHE_TTL = 60 * 60 * 1000; // 1 hour

function cacheKey(placeId: string) {
  return `gplace2:${placeId}`;
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

function fmtTime(hhmm: string): string {
  const h = parseInt(hhmm.slice(0, 2), 10);
  const m = hhmm.slice(2);
  const suffix = h >= 12 ? "PM" : "AM";
  const h12 = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${h12}:${m} ${suffix}`;
}

const UNKNOWN: PlaceInfo = { status: "unknown", closesAt: null, rating: null };

export function useGooglePlace(placeId: string | undefined): PlaceInfo {
  const [info, setInfo] = useState<PlaceInfo>(UNKNOWN);

  useEffect(() => {
    if (!placeId) return;
    const apiKey = import.meta.env.VITE_GOOGLE_PLACES_KEY as string | undefined;
    if (!apiKey) return;

    const cached = readCache(placeId);
    if (cached) { setInfo(cached); return; }

    // Places API (New) at places.googleapis.com — supports browser CORS, unlike maps.googleapis.com
    fetch(`https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`, {
      headers: {
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": "regularOpeningHours,rating",
      },
    })
      .then((r) => r.json())
      .then((json) => {
        const oh = json?.regularOpeningHours;
        const rating: number | null = json?.rating ?? null;

        if (!oh) {
          writeCache(placeId, UNKNOWN);
          return;
        }

        const status: PlaceStatus = oh.openNow ? "open" : "closed";

        let closesAt: string | null = null;
        if (oh.periods) {
          const todayIdx = new Date().getDay();
          const period = oh.periods.find(
            (p: { open?: { day: number }; close?: { time: string } }) =>
              p.open?.day === todayIdx && p.close,
          );
          if (period?.close?.time) closesAt = fmtTime(period.close.time);
        }

        const result: PlaceInfo = { status, closesAt, rating };
        writeCache(placeId, result);
        setInfo(result);
      })
      .catch(() => {});
  }, [placeId]);

  return info;
}
