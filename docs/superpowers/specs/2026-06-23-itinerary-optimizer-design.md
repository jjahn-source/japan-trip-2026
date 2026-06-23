# Itinerary Optimizer & Google Places Validator Design Specification

**Author**: Claude Code
**Date**: 2026-06-23
**Status**: Draft

## 1. Goal & Overview

The purpose of this feature is to prevent and auto-correct routing or scheduling errors when users manually reorder or move activities in the master itinerary. It also integrates universal Google Places validation to display live opening status, ratings, and closing times for all activities, restaurants, and shops.

When a user drags and drops an activity to a suboptimal or illogical position (e.g. putting the flight check-in on a different day, placing a late-night dinner before breakfast, or scheduling a visit when a temple/restaurant is closed), the system will:
1. Detect the conflict in real-time.
2. Display a clear warning alert on that day's card.
3. Provide an **"Auto-Fix"** button to automatically reorganize the day's timeline and sort/move activities back to logical positions.

---

## 2. Conflict Detection Rules

We define three major categories of scheduling conflicts:

### A. Date-Locked Mismatches
Certain activities are logistically bound to their original dates. If they are moved to a different day, it represents a critical conflict.
*   **Date-locked activities include**:
    *   Flights (`DL 2538`, `DL 121`, `DL 120`, `check-in`, `Land Haneda`, `Land RDU`).
    *   Shinkansen bullet trains (`Nozomi west`, `Nozomi east`).
    *   Fixed-date reservations (`booking: true` on activities like teamLab, USJ, Ghibli, Nintendo Museum).
*   **Conflict Trigger**: If `srcDate !== currentDay` for any date-locked activity.
*   **Resolution**: Move the activity back to its original day (`srcDate`) and restore default order.

### B. Chronological Order Anomalies
Activities on the same day must be scheduled in order of time.
*   **Conflict Trigger**: If timed activities (`isTimed(a)`) are ordered such that a later time appears before an earlier time (e.g. `18:00` before `09:00`).
*   **Resolution**: Sort all timed activities on that day chronologically by `time`. Untimed activities are kept in their relative order or appended at the end.

### C. Venue Operating Hours Conflict
Using the Google Places API, we validate if a venue is open at the scheduled activity time.
*   **Conflict Trigger**: If an activity has a `place` name and a scheduled `time` (e.g. `09:30`), and Google Places API indicates that the venue is closed at that hour on that day of the week.
*   **Resolution**: Flag the conflict in the UI and suggest either moving it back to its original time or shifting the schedule of that day to fit the operating hours.

---

## 3. Google Place Validation & Caching

To avoid hitting rate limits or incurring unnecessary API costs, we will implement a unified search and caching hook:

### A. API endpoint: Text Search (New)
For items with names but no static IDs (like itinerary activities, restaurants, and shops), we will fetch:
*   **URL**: `https://places.googleapis.com/v1/places:searchText`
*   **Method**: `POST`
*   **Headers**:
    ```json
    {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": "apiKey",
      "X-Goog-FieldMask": "places.id,places.displayName,places.regularOpeningHours,places.rating,places.location"
    }
    ```
*   **Body**:
    ```json
    {
      "textQuery": "Ichiran Kabukicho, Tokyo",
      "languageCode": "en"
    }
    ```

### B. Caching Protocol
*   We will store search results in `sessionStorage` keyed by `gplacesearch:${query}`.
*   Cache TTL: **1 hour**.
*   If a query is already cached, return it instantly to avoid duplicate network calls.

### C. Checking Hours Programmatically
We will write a utility `isClosedAt(periods: any, dow: string, time: string): boolean` which:
1. Translates the activity's day of week (e.g. `Mon`) to Google day index (0-6).
2. Parses the activity's time (e.g. `18:45`).
3. Determines if the time falls within any open period for that day.
4. Returns `true` if closed, else `false`.

---

## 4. UI Integration

### A. Live AI Insights Banner (Itinerary tab)
If conflicts exist, the top of the Itinerary tab (or inside the "Live AI Insights" panel) will show:
> **⚠️ 2 Schedule Conflicts Detected**
> *   *RDU check-in is scheduled on Tuesday (Day 2) but the flight departs on Monday (Day 1).*
> *   *Yudofu (Okutan) is scheduled at 18:00 but closes at 15:45.*
> 
> **[Auto-Fix Schedule]** (Button)

### B. Day Card Warnings
Inside the `DayCard` expanded view, next to the "Live Updates & AI Optimizations" section, we will display individual warnings and a per-day **[Auto-Fix Day]** button.

### C. Place Badges
On each `ActivityRow`, we will render a `<PlaceSearchBadge query={activity.place} city={day.city} time={activity.time} />` showing:
*   The rating (`⭐ 4.6`).
*   Operating hours check (`⚠️ Closed at 09:00 AM`).
*   Live status (`Open · Closes 10:00 PM`).

---

## 5. Proposed Changes & Code Structure

1.  **`src/hooks/useGooglePlaceSearch.ts`** (New): A React hook that searches places by text, parses opening hours, and caches queries.
2.  **`src/utils/itineraryOptimizer.ts`** (New):
    *   `detectConflicts(days: Day[], overrides: Record<string, DayOverride>): Conflict[]`
    *   `autoFixOverrides(days: Day[], overrides: Record<string, DayOverride>): Record<string, DayOverride>`
3.  **`src/components/ui/PlaceSearchBadge.tsx`** (New): Displays rating, open/closed status, and alerts for any text query.
4.  **`src/hooks/useItineraryOverrides.ts`**:
    *   Add a local storage fallback when `FIREBASE_ENABLED` is false, so reordering works locally.
    *   Add `setAllOverrides` to let us update the entire overrides document in one write.
5.  **`src/components/Itinerary.tsx`**:
    *   Integrate the global and day-level optimizer UI.
    *   Pass the optimization/conflict details to `ActivityRow` and `DayCard`.
