import { useEffect, useState } from "react";

export type PlaceStatus = "open" | "closed" | "unknown";

export interface PlaceSearchInfo {
  id?: string;
  status: PlaceStatus;
  closesAt: string | null;
  rating: number | null;
  regularOpeningHours?: any;
  displayName?: string;
}

const CACHE_TTL = 60 * 60 * 1000; // 1 hour

function cacheKey(query: string) {
  return `gplacesearch:${query.toLowerCase().trim()}`;
}

function readCache(query: string): PlaceSearchInfo | null {
  try {
    const raw = sessionStorage.getItem(cacheKey(query));
    if (!raw) return null;
    const { data, ts } = JSON.parse(raw) as { data: PlaceSearchInfo; ts: number };
    if (Date.now() - ts > CACHE_TTL) return null;
    return data;
  } catch {
    return null;
  }
}

function writeCache(query: string, data: PlaceSearchInfo) {
  try {
    sessionStorage.setItem(cacheKey(query), JSON.stringify({ data, ts: Date.now() }));
  } catch {}
}

const UNKNOWN: PlaceSearchInfo = { status: "unknown", closesAt: null, rating: null };

function parseTimeMinutes(hhmm: string): number {
  const h = parseInt(hhmm.slice(0, 2), 10);
  const m = parseInt(hhmm.slice(2), 10);
  return h * 60 + m;
}

const MAP_DOW: Record<string, number> = {
  Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6
};

export function isClosedAt(regularOpeningHours: any, dow: string, timeHHMM: string): boolean {
  if (!regularOpeningHours || !regularOpeningHours.periods) return false;

  const targetDay = MAP_DOW[dow];
  if (targetDay === undefined) return false;

  const targetMinutes = parseTimeMinutes(timeHHMM.replace(":", ""));

  // Check if open 24 hours
  const open24h = regularOpeningHours.periods.some(
    (p: any) => p.open && p.open.day === targetDay && p.open.time === "0000" && !p.close
  );
  if (open24h) return false;

  // Convert check time to week-minutes (0-10080)
  const checkWeekMinutes = targetDay * 1440 + targetMinutes;

  // Check all periods for coverage
  for (const period of regularOpeningHours.periods) {
    if (!period.open) continue;
    if (!period.close) return false; // Open all day starting at open time

    // Convert period times to week-minutes
    const openWeekMinutes = period.open.day * 1440 + parseTimeMinutes(period.open.time);
    let closeWeekMinutes = period.close.day * 1440 + parseTimeMinutes(period.close.time);

    // If close time is before open time, it wraps to next week
    if (closeWeekMinutes < openWeekMinutes) {
      closeWeekMinutes += 10080;
    }

    // Check if check time falls within this period (handle week wrapping)
    if (checkWeekMinutes >= openWeekMinutes && checkWeekMinutes <= closeWeekMinutes) {
      return false; // within open window
    }

    // Also check if check time + 10080 falls within (wrapping perspective)
    if (checkWeekMinutes + 10080 >= openWeekMinutes && checkWeekMinutes + 10080 <= closeWeekMinutes) {
      return false;
    }
  }

  return true; // closed
}

export function useGooglePlaceSearch(query: string | undefined, city?: string) {
  const [info, setInfo] = useState<PlaceSearchInfo & { loading: boolean }>({ ...UNKNOWN, loading: false });

  useEffect(() => {
    if (!query) {
      setInfo({ ...UNKNOWN, loading: false });
      return;
    }
    const apiKey = import.meta.env.VITE_GOOGLE_PLACES_KEY as string | undefined;
    if (!apiKey) {
      console.warn("VITE_GOOGLE_PLACES_KEY environment variable is not set. Place search will not work.");
      setInfo({ ...UNKNOWN, loading: false });
      return;
    }

    const searchQuery = city ? `${query}, ${city}` : query;
    const cached = readCache(searchQuery);
    if (cached) {
      setInfo({ ...cached, loading: false });
      return;
    }

    setInfo((prev) => ({ ...prev, loading: true }));

    // Places API Text Search (New)
    fetch("https://places.googleapis.com/v1/places:searchText", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": "places.id,places.displayName,places.regularOpeningHours,places.rating,places.location",
      },
      body: JSON.stringify({
        textQuery: searchQuery,
        languageCode: "en",
      }),
    })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}: ${r.statusText}`);
        return r.json();
      })
      .then((json) => {
        const place = json?.places?.[0];
        if (!place) {
          writeCache(searchQuery, UNKNOWN);
          setInfo({ ...UNKNOWN, loading: false });
          return;
        }

        const rating = place.rating ?? null;
        const oh = place.regularOpeningHours;
        const displayName = place.displayName?.text ?? "";

        let status: PlaceStatus = "unknown";
        let closesAt: string | null = null;

        if (oh) {
          status = oh.openNow ? "open" : "closed";
          if (oh.periods) {
            const todayIdx = new Date().getDay();
            const period = oh.periods.find(
              (p: any) => p.open?.day === todayIdx && p.close
            );
            if (period?.close?.time) {
              const hhmm = period.close.time;
              const h = parseInt(hhmm.slice(0, 2), 10);
              const m = hhmm.slice(2).padStart(2, "0");
              const suffix = h >= 12 ? "PM" : "AM";
              const h12 = h > 12 ? h - 12 : h === 0 ? 12 : h;
              closesAt = `${h12}:${m} ${suffix}`;
            }
          }
        }

        const result: PlaceSearchInfo = {
          id: place.id,
          status,
          closesAt,
          rating,
          regularOpeningHours: oh,
          displayName,
        };

        writeCache(searchQuery, result);
        setInfo({ ...result, loading: false });
      })
      .catch(() => {
        setInfo({ ...UNKNOWN, loading: false });
      });
  }, [query, city]);

  return info;
}
