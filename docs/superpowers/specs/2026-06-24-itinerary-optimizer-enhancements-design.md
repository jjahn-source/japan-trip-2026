# Itinerary Optimizer & Routing Enhancements Design Specification

**Author**: Claude Code
**Date**: 2026-06-24
**Status**: Approved

## 1. Goal & Overview
The itinerary planning portal allows users to drag and drop activities to custom sort them or move them between days. To help users plan efficiently, the system detects conflicts in the schedule (such as date-locked flight mismatches, out-of-order timings, or closed venues).
We will enhance this system by:
- **Improving time handling**: Adding support for late-night/past-midnight activities (sorting `00:00–05:00` after `23:00`), detecting overlapping timed activities, and using city-specific Google Place searches for better accuracy.
- **Adding geographic warnings**: Detecting large distance jumps and zig-zag routes between sequential activities, and automatically organizing untimed activities to minimize transit distance.
- **Enhancing the UI**: Showing day-level conflict lists directly on each day card, rendering warnings on individual conflicting activities, and adding a per-day "Auto-Fix Day" button.

---

## 2. Updated Conflict Detection Rules

### A. Date-Locked Mismatches (Existing)
*   **Trigger**: If an activity designated as date-locked (`isDateLocked`) is scheduled on a date other than its source date.

### B. Chronological Order Anomalies (Refined)
*   **Trigger**: If timed activities are ordered such that an activity with a later adjusted time appears before an earlier adjusted time.
*   **Late-night Adjustment**: For sorting and comparison, any activity time between `00:00` and `04:59` is considered a late-night activity continuation of the previous day, and has 1,440 minutes (24 hours) added to its timestamp. E.g. `00:30` is evaluated as 1,470 minutes, which correctly sorts it *after* a `23:30` (1,410 minutes) activity rather than at the start of the day.

### C. Venue Operating Hours Conflict (Existing)
*   **Trigger**: If an activity has a scheduled time and name, and the Google Places API indicates that the venue is closed at that hour on that day of the week.

### D. Time Overlap (New)
*   **Trigger**: If two distinct timed activities on the same day are scheduled at the same time or within a 30-minute window of each other.
*   **Exclusion**: We exclude flight check-in or transit activities from triggering this overlap, as they can overlap with other plans (e.g. check-in and breakfast).

### E. Geographic Distance Anomaly & Zig-Zagging (New)
*   **Distance Jump Trigger**: If consecutive activities with coordinates (`coord`) on the same day are $> 15\text{ km}$ apart (computed using the Haversine formula).
*   **Zig-Zag Trigger**: If three consecutive activities with coordinates $A \rightarrow B \rightarrow C$ are ordered such that the travel path zig-zags across the city:
    - $\text{dist}(A, B) > 10\text{ km}$
    - $\text{dist}(B, C) > 10\text{ km}$
    - $\text{dist}(A, C) < 5\text{ km}$
    - (This indicates visiting $A$, traveling far to $B$, and then returning to $C$ which is right next to $A$, which is highly inefficient).

---

## 3. Geographic Routing Solver (Auto-Fix Day)

For a single day:
1.  **Date-Locked Restoral**: Move any date-locked activities back to their original home day.
2.  **Chronological Sort**: Sort all timed activities chronologically by their adjusted minutes (accounting for past-midnight times).
3.  **TSP Geographic Reordering**:
    *   Find the coordinate of the last timed activity of the day. If none exists, use the default coordinates for that city's base camp.
    *   Collect all untimed activities that have coordinates.
    *   Find the permutation of these untimed activities that minimizes the total travel distance (using the Haversine formula), starting the path from the last timed activity. Since the number of untimed activities per day is small ($N \le 8$), a brute-force permutation search is optimal and runs in milliseconds.
4.  **Reassemble**: Create the new day's order:
    *   Timed activities (sorted chronologically).
    *   Untimed activities with coordinates (sorted by the geographic TSP path solver).
    *   Remaining untimed activities without coordinates (preserving their relative order).

---

## 4. UI Integration

### A. Day Card Warnings
Each `DayCard` will display a day-specific list of warnings when conflicts are detected.
*   If `dayConflicts.length > 0`, render a box below the weather badge inside the expanded card, listing each conflict.
*   Include an **`[Auto-Fix Day]`** button inside the warning box. When clicked, it will run `autoFixDay` for that day and update the overrides state.

### B. Activity Warnings
Each `ActivityRow` will display a small red warning badge/tooltip (e.g., `⚠️ Out of order` or `⚠️ Closed`) when a conflict points to that specific activity key.

### C. City-Specific Place Badges
In `Itinerary.tsx`, pass the specific city (`day.city`, e.g. `"Tokyo"`, `"Kyoto"`, `"Osaka"`) to `<PlaceSearchBadge>` instead of the hardcoded `"Japan"`. This narrows down the Google Place text searches and prevents cross-city results.
