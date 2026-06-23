# Itinerary Optimizer & Google Places Validator Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Build a client-side AI Itinerary Optimizer that detects scheduling conflicts (date mismatches, out-of-order timings, closed hours) and provides an Auto-Fix button to resolve them, and integrate a universal Google Places validator badge.

**Architecture:** A conflict detection utility parses the current effective itinerary and matches it against critical rules and operating hours fetched via Google Places Text Search. A global and day-level UI banner offers on-demand Auto-Fix.

**Tech Stack:** React, TypeScript, Tailwind CSS, Firestore, Google Places API (New)

## Global Constraints
*   Target date range is Dec 14–29, 2026.
*   Must leverage `import.meta.env.VITE_GOOGLE_PLACES_KEY` for Places API requests.
*   Must cache Google Places Text Search results in `sessionStorage` with a 1-hour TTL.
*   Must support fallback to `localStorage` for overrides when Firebase is disabled.

---

### Task 1: Overrides Hook Extensions & Local Fallback

**Files:**
- Modify: `src/hooks/useItineraryOverrides.ts`

**Interfaces:**
- Consumes: Firestore types and local storage helpers.
- Produces: 
  * `overrides`: `Record<string, DayOverride>`
  * `skip(date: string, key: string, value: boolean): Promise<void>`
  * `setOrder(date: string, order: string[]): Promise<void>`
  * `setAllOverrides(newOverrides: Record<string, DayOverride>): Promise<void>`

- [x] **Step 1: Read hook file and apply edits**

Update `src/hooks/useItineraryOverrides.ts` to implement local storage fallback if `FIREBASE_ENABLED` is false, and define the `setAllOverrides` function:

```typescript
import { useEffect, useState } from "react";
import { onSnapshot, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import { FIREBASE_ENABLED, tripDoc } from "../lib/firebase";
import { toast } from "../lib/toast";

export type DayOverride = { order: string[]; skipped: string[] };

const LOCAL_STORAGE_KEY = "itinerary-overrides-fallback";

export function useItineraryOverrides() {
  const [overrides, setOverrides] = useState<Record<string, DayOverride>>({});

  useEffect(() => {
    if (!FIREBASE_ENABLED || !tripDoc) {
      // Local storage fallback
      try {
        const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (raw) setOverrides(JSON.parse(raw));
      } catch (err) {
        console.error("Failed to load local overrides:", err);
      }
      return;
    }
    return onSnapshot(tripDoc, (snap) => {
      if (snap.exists()) {
        setOverrides((snap.data()?.overrides ?? {}) as Record<string, DayOverride>);
      }
    });
  }, []);

  const saveLocal = (next: Record<string, DayOverride>) => {
    setOverrides(next);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(next));
    } catch (err) {
      console.error("Failed to save local overrides:", err);
    }
  };

  const skip = async (date: string, key: string, value: boolean): Promise<void> => {
    if (!FIREBASE_ENABLED || !tripDoc) {
      const next = { ...overrides };
      if (!next[date]) next[date] = { order: [], skipped: [] };
      const skipped = new Set(next[date].skipped);
      if (value) skipped.add(key); else skipped.delete(key);
      next[date].skipped = Array.from(skipped);
      saveLocal(next);
      return;
    }
    await updateDoc(tripDoc, {
      [`overrides.${date}.skipped`]: value ? arrayUnion(key) : arrayRemove(key),
    }).catch((err) => {
      console.error(err);
      toast.error("Itinerary sync failed — check your connection");
    });
  };

  const setOrder = async (date: string, order: string[]): Promise<void> => {
    if (!FIREBASE_ENABLED || !tripDoc) {
      const next = { ...overrides };
      if (!next[date]) next[date] = { order: [], skipped: [] };
      next[date].order = order;
      saveLocal(next);
      return;
    }
    await updateDoc(tripDoc, { [`overrides.${date}.order`]: order }).catch((err) => {
      console.error(err);
      toast.error("Itinerary sync failed — check your connection");
    });
  };

  const setAllOverrides = async (newOverrides: Record<string, DayOverride>): Promise<void> => {
    if (!FIREBASE_ENABLED || !tripDoc) {
      saveLocal(newOverrides);
      return;
    }
    await updateDoc(tripDoc, { overrides: newOverrides }).catch((err) => {
      console.error(err);
      toast.error("Itinerary sync failed — check your connection");
    });
  };

  return { overrides, skip, setOrder, setAllOverrides };
}
```

- [x] **Step 2: Verify lint passes**

Run: `npm run lint`
Expected: PASS with no errors in the overrides hook.

- [x] **Step 3: Commit overrides hook changes**

---

### Task 2: Google Places Text Search Hook

**Files:**
- Create: `src/hooks/useGooglePlaceSearch.ts`

**Interfaces:**
- Consumes: `import.meta.env.VITE_GOOGLE_PLACES_KEY`
- Produces:
  * `useGooglePlaceSearch(query: string | undefined, city?: string)` returning:
    `{ loading: boolean; id?: string; status: "open" | "closed" | "unknown"; closesAt: string | null; rating: number | null; regularOpeningHours?: any; displayName?: string }`
  * `isClosedAt(regularOpeningHours: any, dow: string, timeHHMM: string): boolean`

- [x] **Step 1: Create the place search hook file**

Write `src/hooks/useGooglePlaceSearch.ts` with modern Places API Text Search, sessionStorage caching, and hours checking helper:

```typescript
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

  // Filter periods matching target day
  const periods = regularOpeningHours.periods.filter((p: any) => p.open && p.open.day === targetDay);
  if (periods.length === 0) return true; // closed all day

  for (const period of periods) {
    if (!period.close) return false; // Open all day starting at open time
    const openMinutes = parseTimeMinutes(period.open.time);
    let closeMinutes = parseTimeMinutes(period.close.time);
    
    // Handle overnight close times (e.g. opens 18:00 close 02:00)
    if (closeMinutes < openMinutes) {
      closeMinutes += 1440;
    }

    let checkMinutes = targetMinutes;
    if (checkMinutes < openMinutes && period.close.day !== targetDay) {
      checkMinutes += 1440; // check overnight overlap
    }

    if (checkMinutes >= openMinutes && checkMinutes <= closeMinutes) {
      return false; // within open window
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
      .then((r) => r.json())
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
              const m = hhmm.slice(2);
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
```

- [x] **Step 2: Verify lint passes**

Run: `npm run lint`
Expected: PASS

- [x] **Step 3: Commit search hook**

---

### Task 3: Create Itinerary Optimizer Utilities

**Files:**
- Create: `src/utils/itineraryOptimizer.ts`

**Interfaces:**
- Consumes: `DAYS` from `src/data/itinerary.ts`, `isTimed` and `parseMinutes` from `src/utils/itineraryTools.ts`.
- Produces:
  * `Conflict`: `{ type: 'DATE_MISMATCH' | 'CHRONO_ORDER' | 'VENUE_CLOSED'; activityKey: string; activityTitle: string; currentDay: string; srcDate?: string; detail: string }`
  * `detectConflicts(days: Day[], overrides: Record<string, DayOverride>, placeData: Record<string, any>): Conflict[]`
  * `autoFixOverrides(days: Day[], overrides: Record<string, DayOverride>): Record<string, DayOverride>`

- [x] **Step 1: Create the optimizer utilities file**

Write `src/utils/itineraryOptimizer.ts`:

```typescript
import type { Day, Activity } from "../data/itinerary";
import type { DayOverride } from "../hooks/useItineraryOverrides";
import { isTimed, parseMinutes } from "./itineraryTools";
import { isClosedAt } from "../hooks/useGooglePlaceSearch";

export interface Conflict {
  type: "DATE_MISMATCH" | "CHRONO_ORDER" | "VENUE_CLOSED";
  activityKey: string;
  activityTitle: string;
  currentDay: string;
  srcDate?: string;
  detail: string;
}

// Critical date-locked items
export function isDateLocked(a: Activity): boolean {
  if (a.booking) return true;
  const title = a.title.toLowerCase();
  const note = (a.note ?? "").toLowerCase();
  return (
    title.includes("flight") ||
    title.includes("check-in") ||
    title.includes("shinkansen") ||
    title.includes("nozomi") ||
    title.includes("dl 2538") ||
    title.includes("dl 121") ||
    title.includes("dl 120") ||
    title.includes("land haneda") ||
    title.includes("land rdu") ||
    note.includes("flight") ||
    note.includes("check-in")
  );
}

export function detectConflicts(
  days: Day[],
  overrides: Record<string, DayOverride>,
  placeData: Record<string, any> // Keyed by query: { regularOpeningHours }
): Conflict[] {
  const conflicts: Conflict[] = [];

  // Helper to resolve current activity ordering
  const getOrder = (date: string): string[] => {
    const d = days.find((x) => x.date === date);
    if (!d) return [];
    const defaultKeys = d.activities.map((_, i) => `${date}:${i}`);
    return overrides[date]?.order?.length ? [...overrides[date].order] : defaultKeys;
  };

  const skippedMap = new Record<string, Set<string>>();
  days.forEach((d) => {
    skippedMap[d.date] = new Set(overrides[d.date]?.skipped ?? []);
  });

  days.forEach((day) => {
    const order = getOrder(day.date).filter((k) => !skippedMap[day.date].has(k));
    
    // Resolve activities currently assigned to this day
    const activitiesWithKeys = order.map((key) => {
      const parts = key.split(":");
      const srcDate = parts[0];
      const idx = Number(parts[1]);
      const srcDay = days.find((x) => x.date === srcDate);
      const activity = srcDay?.activities[idx];
      return { key, activity, srcDate };
    }).filter((x): x is { key: string; activity: Activity; srcDate: string } => !!x.activity);

    // Rule 1: Date-locked mismatch
    activitiesWithKeys.forEach(({ key, activity, srcDate }) => {
      if (srcDate !== day.date && isDateLocked(activity)) {
        conflicts.push({
          type: "DATE_MISMATCH",
          activityKey: key,
          activityTitle: activity.title,
          currentDay: day.date,
          srcDate,
          detail: `"${activity.title}" is scheduled on ${day.date} but belongs to ${srcDate} (fixed flight/booking date).`,
        });
      }
    });

    // Rule 2: Chronological order
    const timedActivities = activitiesWithKeys
      .map(({ key, activity }) => ({ key, activity, mins: parseMinutes(activity.time) }))
      .filter((x): x is { key: string; activity: Activity; mins: number } => x.mins !== null);

    for (let i = 0; i + 1 < timedActivities.length; i++) {
      if (timedActivities[i].mins > timedActivities[i + 1].mins) {
        conflicts.push({
          type: "CHRONO_ORDER",
          activityKey: timedActivities[i + 1].key,
          activityTitle: timedActivities[i + 1].activity.title,
          currentDay: day.date,
          detail: `Timeline out of chronological order: "${timedActivities[i].activity.title}" (${timedActivities[i].activity.time}) appears before "${timedActivities[i + 1].activity.title}" (${timedActivities[i + 1].activity.time}).`,
        });
      }
    }

    // Rule 3: Operating Hours Conflict
    activitiesWithKeys.forEach(({ key, activity }) => {
      if (activity.place && isTimed(activity)) {
        const placeSearch = placeData[activity.place.toLowerCase().trim()];
        if (placeSearch && placeSearch.regularOpeningHours) {
          const closed = isClosedAt(placeSearch.regularOpeningHours, day.dow, activity.time);
          if (closed) {
            conflicts.push({
              type: "VENUE_CLOSED",
              activityKey: key,
              activityTitle: activity.title,
              currentDay: day.date,
              detail: `"${activity.title}" is scheduled at ${activity.time} on ${day.dow}, but the venue (${activity.place}) is closed then.`,
            });
          }
        }
      }
    });
  });

  return conflicts;
}

export function autoFixOverrides(
  days: Day[],
  overrides: Record<string, DayOverride>
): Record<string, DayOverride> {
  const nextOverrides = JSON.parse(JSON.stringify(overrides)) as Record<string, DayOverride>;

  // Initialize order for every day if missing
  days.forEach((day) => {
    if (!nextOverrides[day.date]) {
      nextOverrides[day.date] = { order: [], skipped: [] };
    }
    if (nextOverrides[day.date].order.length === 0) {
      nextOverrides[day.date].order = day.activities.map((_, i) => `${day.date}:${i}`);
    }
  });

  // Step 1: Force critical date-locked items back to their home day
  days.forEach((day) => {
    const defaultKeys = day.activities.map((_, i) => `${day.date}:${i}`);
    defaultKeys.forEach((key) => {
      const idx = Number(key.split(":")[1]);
      const activity = day.activities[idx];
      if (activity && isDateLocked(activity)) {
        // Find where it currently resides and delete it from order / skipped list
        Object.keys(nextOverrides).forEach((date) => {
          nextOverrides[date].order = nextOverrides[date].order.filter((k) => k !== key);
          nextOverrides[date].skipped = nextOverrides[date].skipped.filter((k) => k !== key);
        });

        // Add back to original day
        if (!nextOverrides[day.date].order.includes(key)) {
          nextOverrides[day.date].order.push(key);
        }
      }
    });
  });

  // Step 2: Chronologically sort each day's orders by their time
  days.forEach((day) => {
    const order = nextOverrides[day.date].order;
    const skippedSet = new Set(nextOverrides[day.date].skipped);

    // Resolve details for items in order
    const resolvedItems = order.map((key) => {
      const parts = key.split(":");
      const srcDate = parts[0];
      const idx = Number(parts[1]);
      const srcDay = days.find((x) => x.date === srcDate);
      const activity = srcDay?.activities[idx];
      const mins = activity ? parseMinutes(activity.time) : null;
      return { key, activity, mins };
    });

    const timed = resolvedItems.filter((x) => x.mins !== null) as { key: string; activity: Activity; mins: number }[];
    const untimed = resolvedItems.filter((x) => x.mins === null);

    // Sort timed items by minutes
    timed.sort((a, b) => a.mins - b.mins);

    // Reconstruct ordered list: timed ones first in chronological order, untimed after
    nextOverrides[day.date].order = [...timed.map((t) => t.key), ...untimed.map((u) => u.key)];
  });

  return nextOverrides;
}
```

- [x] **Step 2: Verify lint passes**

Run: `npm run lint`
Expected: PASS

- [x] **Step 3: Commit optimizer utilities**

---

### Task 4: Place Search Badge Component

**Files:**
- Create: `src/components/ui/PlaceSearchBadge.tsx`

**Interfaces:**
- Consumes: `useGooglePlaceSearch` and `isClosedAt` from `src/hooks/useGooglePlaceSearch.ts`.
- Produces: `<PlaceSearchBadge query={string} city={string} time={string | undefined} dow={string | undefined} />`

- [x] **Step 1: Create the PlaceSearchBadge component**

Write `src/components/ui/PlaceSearchBadge.tsx`:

```tsx
import { Star, AlertTriangle, Loader2 } from "lucide-react";
import { useGooglePlaceSearch, isClosedAt } from "../../hooks/useGooglePlaceSearch";

export function PlaceSearchBadge({
  query,
  city,
  time,
  dow,
}: {
  query: string | undefined;
  city?: string;
  time?: string;
  dow?: string;
}) {
  const info = useGooglePlaceSearch(query, city);
  const { status, closesAt, rating, regularOpeningHours, loading } = info;

  if (!query || (!loading && status === "unknown" && rating === null)) return null;

  if (loading) {
    return (
      <span className="inline-flex items-center gap-1 text-[0.62rem] text-slate-500">
        <Loader2 size={9} className="animate-spin" />
        checking...
      </span>
    );
  }

  // Check if scheduled during closed hours
  const isClosedNow = time && dow && regularOpeningHours && isClosedAt(regularOpeningHours, dow, time);

  return (
    <div className="inline-flex items-center gap-2 mt-1 flex-wrap">
      {rating !== null && (
        <span className="inline-flex items-center gap-0.5 text-[0.65rem] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded px-1">
          <Star size={9} className="fill-amber-400 shrink-0" />
          {rating.toFixed(1)}
        </span>
      )}

      {isClosedNow ? (
        <span className="inline-flex items-center gap-1 text-[0.65rem] font-bold text-red-300 bg-red-500/10 border border-red-500/20 rounded px-1">
          <AlertTriangle size={9} className="shrink-0" />
          Closed at {time}
        </span>
      ) : status === "open" ? (
        <span className="inline-flex items-center gap-1 text-[0.65rem] font-semibold text-emerald-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0 animate-pulse" />
          Open{closesAt ? ` · closes ${closesAt}` : ""}
        </span>
      ) : status === "closed" ? (
        <span className="inline-flex items-center gap-1 text-[0.65rem] font-semibold text-slate-500">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-500 shrink-0" />
          Closed
        </span>
      ) : null}
    </div>
  );
}
```

- [x] **Step 2: Verify lint passes**

Run: `npm run lint`
Expected: PASS

- [x] **Step 3: Commit PlaceSearchBadge**

---

### Task 5: Integrate Optimizer UI and Badges in Itinerary

**Files:**
- Modify: `src/components/Itinerary.tsx`

**Interfaces:**
- Consumes:
  * `detectConflicts` and `autoFixOverrides` from `src/utils/itineraryOptimizer.ts`.
  * `<PlaceSearchBadge>` from `src/components/ui/PlaceSearchBadge.tsx`.
  * `setAllOverrides` from `useItineraryOverrides`.

- [x] **Step 1: Add place caching logic for optimizer**

We need to gather regularOpeningHours from loaded badges to feed the optimizer conflict detector. We'll listen to a global event or write to a shared window map when PlaceSearchBadge loads.

Update `src/hooks/useGooglePlaceSearch.ts` to expose loaded place data to a global registry:

```typescript
// Add this near the top of useGooglePlaceSearch.ts:
if (typeof window !== "undefined") {
  (window as any).gPlacesRegistry = (window as any).gPlacesRegistry || {};
}
```
And inside `useGooglePlaceSearch`'s successful fetch and cache-hits:
```typescript
const registerPlace = (queryStr: string, res: PlaceSearchInfo) => {
  if (typeof window !== "undefined") {
    (window as any).gPlacesRegistry[queryStr.toLowerCase().trim()] = res;
    window.dispatchEvent(new CustomEvent("gplace-registered"));
  }
};
```
Make sure `registerPlace` is called in the `useEffect` on cache hit and fetch resolve.

- [x] **Step 2: Update ActivityRow to render PlaceSearchBadge**

Modify `ActivityRow` in `src/components/Itinerary.tsx` to display `<PlaceSearchBadge>`:

```tsx
// Import PlaceSearchBadge at the top
import { PlaceSearchBadge } from "./ui/PlaceSearchBadge";

// Render under activity note or title
// Locate line where: {activity.note && <p className={...}>{activity.note}</p>}
// Add right after:
{activity.place && !isSkipped && (
  <PlaceSearchBadge query={activity.place} city={srcDate.slice(0, 4) === "2026" ? "Japan" : undefined} time={activity.time} dow={DAYS.find(d => d.date === srcDate)?.dow} />
)}
```

- [x] **Step 3: Implement Conflict Alert Banner and Auto-Fix in Itinerary**

Modify `Itinerary` component in `src/components/Itinerary.tsx` to run conflict detection and render the banner at the top of the day list:

```tsx
// Imports at the top
import { detectConflicts, autoFixOverrides, type Conflict } from "../utils/itineraryOptimizer";

// Inside Itinerary() component:
const { overrides, skip, setOrder, setAllOverrides } = useItineraryOverrides();
const [placeRegistry, setPlaceRegistry] = useState<Record<string, any>>({});
const [conflicts, setConflicts] = useState<Conflict[]>([]);

useEffect(() => {
  const updateRegistry = () => {
    setPlaceRegistry({ ...((window as any).gPlacesRegistry || {}) });
  };
  window.addEventListener("gplace-registered", updateRegistry);
  updateRegistry();
  return () => window.removeEventListener("gplace-registered", updateRegistry);
}, []);

useEffect(() => {
  setConflicts(detectConflicts(DAYS, overrides, placeRegistry));
}, [overrides, placeRegistry]);

const handleAutoFix = async () => {
  const fixed = autoFixOverrides(DAYS, overrides);
  await setAllOverrides(fixed);
  toast.success("AI Optimizer: Schedule conflicts resolved and sorted chronologically!");
};
```

Render the warning banner at the top:

```tsx
{conflicts.length > 0 && (
  <div className="mb-6 rounded-2xl border border-red-500/30 bg-red-500/[0.05] p-5 text-sm text-slate-300 shadow-[0_0_20px_rgba(239,68,68,0.08)] backdrop-blur-md">
    <div className="flex items-center gap-2 mb-3 text-red-400 font-bold uppercase tracking-wider text-xs">
      <AlertTriangle size={15} className="animate-pulse shrink-0" />
      <span>Route Optimization Suggestions ({conflicts.length})</span>
    </div>
    <ul className="space-y-2 list-disc pl-4 mb-4 text-xs text-slate-400 leading-relaxed">
      {conflicts.slice(0, 3).map((c, idx) => (
        <li key={idx} className="marker:text-red-500">
          <span className="font-semibold text-slate-300">{c.activityTitle}</span>: {c.detail}
        </li>
      ))}
      {conflicts.length > 3 && (
        <li className="list-none pl-0 text-slate-500">...and {conflicts.length - 3} more schedule errors.</li>
      )}
    </ul>
    <button
      type="button"
      onClick={handleAutoFix}
      className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white font-bold text-xs uppercase tracking-wider px-4 py-2.5 shadow-lg shadow-red-500/10 hover:shadow-red-500/20 active:scale-95 transition-all"
    >
      <Sparkles size={13} className="animate-bounce" />
      Auto-Fix Schedule Conflicts
    </button>
  </div>
)}
```

- [x] **Step 4: Verify lint and build**

Run: `npm run lint && npm run build`
Expected: PASS

- [x] **Step 5: Commit changes**
