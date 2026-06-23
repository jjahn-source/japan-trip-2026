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

  // Initialize order for every day if missing; also guard against partial Firebase data
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
          nextOverrides[date].skipped = (nextOverrides[date].skipped ?? []).filter((k) => k !== key);
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
