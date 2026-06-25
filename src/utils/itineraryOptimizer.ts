import type { Day, Activity } from "../data/itinerary";
import type { DayOverride } from "../hooks/useItineraryOverrides";
import { isTimed, parseMinutes, haversineKm } from "./itineraryTools";
import { isClosedAt } from "../hooks/useGooglePlaceSearch";

export interface Conflict {
  type: "DATE_MISMATCH" | "CHRONO_ORDER" | "VENUE_CLOSED" | "TIME_OVERLAP" | "GEO_DISTANCE_ANOMALY";
  activityKey: string;
  activityTitle: string;
  currentDay: string;
  srcDate?: string;
  detail: string;
}

const CITY_COORDS: Record<string, [number, number]> = {
  Tokyo: [35.6896, 139.6917],
  Kyoto: [35.0116, 135.7681],
  Osaka: [34.6684, 135.5023],
};

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

// True when an activity is a travel leg between venues (train, shinkansen,
// ferry, bus, etc.) rather than a destination. These break a "same-area"
// walking segment: a long hop across one is intended travel, not an anomaly.
const TRANSPORT_RE =
  /\b(jr|shinkansen|nozomi|kintetsu|odakyu|keikyu|hankyu|hanshin|keihan|limousine|ferry|train|subway|metro|transit|monorail|bus)\b/i;

export function isTransport(a: Activity): boolean {
  return TRANSPORT_RE.test(a.title);
}

// Adjusts minutes for late-night/past-midnight activities (00:00 to 02:59)
// by adding 1440 minutes (24 hours) so they sort correctly after 23:00.
export function parseMinutesAdjusted(time: string): number | null {
  const mins = parseMinutes(time);
  if (mins === null) return null;
  const h = Math.floor(mins / 60);
  if (h < 3) {
    return mins + 1440;
  }
  return mins;
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

  const skippedMap: Record<string, Set<string>> = {};
  days.forEach((d) => {
    skippedMap[d.date] = new Set(overrides[d.date]?.skipped ?? []);
  });

  days.forEach((day) => {
    const order = getOrder(day.date).filter((k) => !skippedMap[day.date].has(k));

    // Resolve activities currently assigned to this day
    const activitiesWithKeys = order
      .map((key) => {
        const parts = key.split(":");
        const srcDate = parts[0];
        const idx = Number(parts[1]);
        const srcDay = days.find((x) => x.date === srcDate);
        const activity = srcDay?.activities[idx];
        return { key, activity, srcDate };
      })
      .filter((x): x is { key: string; activity: Activity; srcDate: string } => !!x.activity);

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
      .map(({ key, activity }) => ({ key, activity, mins: parseMinutesAdjusted(activity.time) }))
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

    // Rule 4: Time Overlap
    // Sort timed items for overlap checks
    const sortedTimed = [...timedActivities].sort((a, b) => a.mins - b.mins);
    for (let i = 0; i + 1 < sortedTimed.length; i++) {
      const act1 = sortedTimed[i];
      const act2 = sortedTimed[i + 1];
      const diff = Math.abs(act1.mins - act2.mins);
      if (diff < 30) {
        const isFlight1 =
          act1.activity.title.toLowerCase().includes("flight") ||
          act1.activity.title.toLowerCase().includes("check-in");
        const isFlight2 =
          act2.activity.title.toLowerCase().includes("flight") ||
          act2.activity.title.toLowerCase().includes("check-in");
        if (!isFlight1 && !isFlight2) {
          conflicts.push({
            type: "TIME_OVERLAP",
            activityKey: act2.key,
            activityTitle: act2.activity.title,
            currentDay: day.date,
            detail: `Time conflict: "${act1.activity.title}" (${act1.activity.time}) and "${act2.activity.title}" (${act2.activity.time}) are scheduled within ${diff} minutes of each other.`,
          });
        }
      }
    }

    // Rule 5: Geographic Distance & Zig-Zagging
    // Split the day into walking segments at transport legs (train, shinkansen,
    // ferry, etc.) and date-locked anchors. A long hop across a transport leg is
    // intended travel, not an anomaly — so distance/zig-zag checks only run
    // *within* a segment of consecutive same-area venues, never across a break.
    const segments: { key: string; activity: Activity }[][] = [];
    let segment: { key: string; activity: Activity }[] = [];
    activitiesWithKeys.forEach(({ key, activity }) => {
      if (isTransport(activity) || isDateLocked(activity)) {
        if (segment.length) segments.push(segment);
        segment = [];
        return;
      }
      if (activity.coord) segment.push({ key, activity });
    });
    if (segment.length) segments.push(segment);

    segments.forEach((venues) => {
      // Check for large distance jumps (> 15 km) between consecutive venues
      for (let i = 0; i + 1 < venues.length; i++) {
        const act1 = venues[i];
        const act2 = venues[i + 1];
        const dist = haversineKm(act1.activity.coord!, act2.activity.coord!);
        if (dist > 15) {
          conflicts.push({
            type: "GEO_DISTANCE_ANOMALY",
            activityKey: act2.key,
            activityTitle: act2.activity.title,
            currentDay: day.date,
            detail: `Large distance jump: "${act1.activity.title}" to "${act2.activity.title}" is ${dist.toFixed(1)} km apart with no transit between them. Consider grouping activities by area.`,
          });
        }
      }

      // Check for zig-zagging: A -> B -> C where dist(A, B) > 10, dist(B, C) > 10, but dist(A, C) < 5
      for (let i = 0; i + 2 < venues.length; i++) {
        const actA = venues[i];
        const actB = venues[i + 1];
        const actC = venues[i + 2];
        const distAB = haversineKm(actA.activity.coord!, actB.activity.coord!);
        const distBC = haversineKm(actB.activity.coord!, actC.activity.coord!);
        const distAC = haversineKm(actA.activity.coord!, actC.activity.coord!);
        if (distAB > 10 && distBC > 10 && distAC < 5) {
          conflicts.push({
            type: "GEO_DISTANCE_ANOMALY",
            activityKey: actB.key,
            activityTitle: actB.activity.title,
            currentDay: day.date,
            detail: `Zig-zag routing detected: you travel from "${actA.activity.title}" to "${actB.activity.title}" (${distAB.toFixed(1)} km) and then back to "${actC.activity.title}" (${distBC.toFixed(1)} km), which is only ${distAC.toFixed(1)} km from "${actA.activity.title}".`,
          });
        }
      }
    });
  });

  return conflicts;
}

// TSP solver using brute-force search for small paths
function solveTSP(
  startCoord: [number, number],
  items: { key: string; coord: [number, number] }[]
): string[] {
  if (items.length === 0) return [];
  if (items.length === 1) return [items[0].key];

  if (items.length > 8) {
    const path: string[] = [];
    const unvisited = [...items];
    let currentCoord = startCoord;
    while (unvisited.length > 0) {
      let nearestIdx = 0;
      let nearestDist = Infinity;
      for (let i = 0; i < unvisited.length; i++) {
        const dist = haversineKm(currentCoord, unvisited[i].coord);
        if (dist < nearestDist) {
          nearestDist = dist;
          nearestIdx = i;
        }
      }
      const nextItem = unvisited.splice(nearestIdx, 1)[0];
      currentCoord = nextItem.coord;
      path.push(nextItem.key);
    }
    return path;
  }

  let bestPath: string[] = [];
  let minDist = Infinity;

  const permute = (arr: number[], m: number[] = []) => {
    if (arr.length === 0) {
      let currentCoord = startCoord;
      let totalDist = 0;
      const currentPath: string[] = [];
      for (const idx of m) {
        const item = items[idx];
        totalDist += haversineKm(currentCoord, item.coord);
        currentCoord = item.coord;
        currentPath.push(item.key);
      }
      if (totalDist < minDist) {
        minDist = totalDist;
        bestPath = currentPath;
      }
    } else {
      for (let i = 0; i < arr.length; i++) {
        const curr = arr.slice();
        const next = curr.splice(i, 1);
        permute(curr.slice(), m.concat(next));
      }
    }
  };

  const indices = Array.from({ length: items.length }, (_, i) => i);
  permute(indices);
  return bestPath;
}

export function autoFixDay(day: Day, dayOverride: DayOverride, days: Day[]): DayOverride {
  const override = JSON.parse(JSON.stringify(dayOverride)) as DayOverride;
  if (!override.order) override.order = [];
  if (!override.skipped) override.skipped = [];

  const defaultKeys = day.activities.map((_, i) => `${day.date}:${i}`);
  if (override.order.length === 0) {
    override.order = [...defaultKeys];
  }

  // Resolve all activities in the current order
  const resolvedItems = override.order
    .map((key) => {
      const parts = key.split(":");
      const srcDate = parts[0];
      const idx = Number(parts[1]);
      const srcDay = days.find((x) => x.date === srcDate);
      const activity = srcDay?.activities[idx];
      return { key, activity, srcDate };
    })
    .filter((x): x is { key: string; activity: Activity; srcDate: string } => !!x.activity);

  // 1. Separate timed vs untimed
  const timed = resolvedItems
    .map((item) => ({ ...item, mins: parseMinutesAdjusted(item.activity.time) }))
    .filter(
      (x): x is { key: string; activity: Activity; srcDate: string; mins: number } =>
        x.mins !== null
    );

  const untimed = resolvedItems.filter((item) => parseMinutesAdjusted(item.activity.time) === null);

  // Sort timed items chronologically
  timed.sort((a, b) => a.mins - b.mins);

  // 2. Untimed items with coordinates
  const untimedMapped = untimed
    .filter((item) => !!item.activity.coord)
    .map((item) => ({ key: item.key, coord: item.activity.coord! }));

  const untimedUnmapped = untimed.filter((item) => !item.activity.coord);

  // Determine starting coordinate for TSP solver
  let startCoord = CITY_COORDS[day.city] || [35.6896, 139.6917];
  if (timed.length > 0) {
    const lastTimedWithCoord = [...timed].reverse().find((item) => !!item.activity.coord);
    if (lastTimedWithCoord) {
      startCoord = lastTimedWithCoord.activity.coord!;
    }
  }

  // Solve TSP for untimed mapped items
  const tspOrderKeys = solveTSP(startCoord, untimedMapped);

  // Reassemble order: timed first, then geo-sorted untimed, then remaining untimed unmapped
  override.order = [
    ...timed.map((t) => t.key),
    ...tspOrderKeys,
    ...untimedUnmapped.map((u) => u.key),
  ];

  return override;
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
    if (!nextOverrides[day.date].order) nextOverrides[day.date].order = [];
    if (!nextOverrides[day.date].skipped) nextOverrides[day.date].skipped = [];
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
          nextOverrides[date].order = (nextOverrides[date].order ?? []).filter((k) => k !== key);
          nextOverrides[date].skipped = (nextOverrides[date].skipped ?? []).filter(
            (k) => k !== key
          );
        });

        // Add back to original day
        if (!nextOverrides[day.date].order.includes(key)) {
          nextOverrides[day.date].order.push(key);
        }
      }
    });
  });

  // Step 2: Optimize each day individually
  days.forEach((day) => {
    nextOverrides[day.date] = autoFixDay(day, nextOverrides[day.date], days);
  });

  return nextOverrides;
}

export function autoFixSingleDay(
  date: string,
  days: Day[],
  overrides: Record<string, DayOverride>
): Record<string, DayOverride> {
  const nextOverrides = JSON.parse(JSON.stringify(overrides)) as Record<string, DayOverride>;

  // Initialize overrides for all days if missing
  days.forEach((day) => {
    if (!nextOverrides[day.date]) {
      nextOverrides[day.date] = { order: [], skipped: [] };
    }
    if (!nextOverrides[day.date].order) nextOverrides[day.date].order = [];
    if (!nextOverrides[day.date].skipped) nextOverrides[day.date].skipped = [];
    if (nextOverrides[day.date].order.length === 0) {
      nextOverrides[day.date].order = day.activities.map((_, i) => `${day.date}:${i}`);
    }
  });

  const targetDay = days.find((d) => d.date === date);
  if (!targetDay) return nextOverrides;

  // 1. Move date-locked activities belonging to other days out of the target day
  const targetOrder = nextOverrides[date].order;
  targetOrder.forEach((key) => {
    const parts = key.split(":");
    const srcDate = parts[0];
    const idx = Number(parts[1]);
    const srcDay = days.find((x) => x.date === srcDate);
    const activity = srcDay?.activities[idx];
    if (activity && srcDate !== date && isDateLocked(activity)) {
      // Find where it currently resides and delete it from all order / skipped lists
      Object.keys(nextOverrides).forEach((d) => {
        nextOverrides[d].order = (nextOverrides[d].order ?? []).filter((k) => k !== key);
        nextOverrides[d].skipped = (nextOverrides[d].skipped ?? []).filter((k) => k !== key);
      });

      // Add back to original home day
      if (!nextOverrides[srcDate].order.includes(key)) {
        nextOverrides[srcDate].order.push(key);
      }
    }
  });

  // 2. Pull date-locked activities belonging to the target day back to the target day
  const defaultKeys = targetDay.activities.map((_, i) => `${date}:${i}`);
  defaultKeys.forEach((key) => {
    const idx = Number(key.split(":")[1]);
    const activity = targetDay.activities[idx];
    if (activity && isDateLocked(activity)) {
      // Find where it currently resides and delete it
      Object.keys(nextOverrides).forEach((d) => {
        nextOverrides[d].order = (nextOverrides[d].order ?? []).filter((k) => k !== key);
        nextOverrides[d].skipped = (nextOverrides[d].skipped ?? []).filter((k) => k !== key);
      });

      // Add back to target day
      if (!nextOverrides[date].order.includes(key)) {
        nextOverrides[date].order.push(key);
      }
    }
  });

  // 3. Optimize the target day itself
  nextOverrides[date] = autoFixDay(targetDay, nextOverrides[date], days);

  return nextOverrides;
}
