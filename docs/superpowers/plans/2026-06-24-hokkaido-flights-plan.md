# Hokkaido & Flights Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adjust the itinerary to add a 4-night Hokkaido leg, integrate flight searches using `fli-js`, and show those flights on the Dashboard.

**Architecture:** 
- Itinerary: Update `src/data/itinerary.ts` to swap Tokyo, Kyoto, and Osaka days for Hokkaido days (Dec 19-22). We'll fly from Tokyo to Sapporo (CTS) and then from Sapporo (CTS) to Osaka/Kyoto (ITM/KIX).
- Flights: Add `fli-js` dependency. Create a script `scripts/refresh-flights.mjs` to fetch current flight prices for our exact routes and dates, writing to `public/flights.json`.
- UI: Add a new `FlightIntelPanel` component that reads `flights.json` and renders it on the Dashboard.

**Tech Stack:** React, TypeScript, Vite, fli-js

## Global Constraints

- Avoid changing existing logic not related to Hokkaido or Flights.
- Only run the `fli-js` search in the node script to avoid browser CORS.

---

### Task 1: Add Hokkaido to Itinerary

**Files:**
- Modify: `src/data/itinerary.ts`

**Interfaces:**
- Consumes: N/A
- Produces: Updated `DAYS` array and `BASES` array.

- [ ] **Step 1: Update the BASES array**
Modify `BASES` at the bottom of `src/data/itinerary.ts`.
Reduce Tokyo to 5 nights, add Hokkaido for 4 nights, reduce Kyoto to 2 nights, reduce Osaka to 3 nights.
```typescript
export const BASES: { name: string; coord: [number, number]; dates: string }[] = [
  { name: "Tokyo (Shinjuku)", coord: [35.6896, 139.7006], dates: "Dec 15–20 · 5 nights" },
  { name: "Hokkaido (Sapporo)", coord: [43.0618, 141.3545], dates: "Dec 20–24 · 4 nights" },
  { name: "Kyoto", coord: [35.0116, 135.7681], dates: "Dec 24–26 · 2 nights" },
  { name: "Osaka (Namba)", coord: [34.6661, 135.5013], dates: "Dec 26–29 · 3 nights" },
];
```

- [ ] **Step 2: Rewrite Day 6 (Dec 19)**
Change Dec 19 to the final Tokyo day. Keep it Tokyo.

- [ ] **Step 3: Rewrite Day 7 (Dec 20) as Tokyo -> Sapporo**
Change `city` to `"Tokyo → Sapporo"`.
Update `activities` to include a flight from HND to CTS (New Chitose) around midday.
Add an evening activity in Sapporo (e.g., Susukino ramen).

- [ ] **Step 4: Rewrite Day 8 (Dec 21) as Otaru Day Trip**
Change `city` to `"Sapporo / Otaru"`.
Add activities for Otaru Canal and Nikka Whisky Yoichi Distillery.

- [ ] **Step 5: Rewrite Day 9 (Dec 22) as Sapporo / Niseko**
Change `city` to `"Sapporo / Niseko"`.
Add activities for a snow day.

- [ ] **Step 6: Rewrite Day 10 (Dec 23) as Sapporo -> Kyoto**
Change `city` to `"Sapporo → Kyoto"`.
Update `activities` for a flight from CTS to ITM/KIX, then train to Kyoto.

- [ ] **Step 7: Shift the remaining Kyoto/Osaka days**
Adjust dates on the Kyoto and Osaka days so Kyoto is Dec 24-25, Osaka is Dec 26-28. Adjust the departure day to Dec 29.
Since this is a large manual refactor of `DAYS`, the implementer should carefully shift the remaining days, preserving the most iconic activities (e.g., Universal Studios, Kani Doraku).

- [ ] **Step 8: Commit**
```bash
git add src/data/itinerary.ts
git commit -m "refactor: insert Hokkaido leg into itinerary, adjusting Tokyo/Kyoto/Osaka nights"
```

### Task 2: Setup Flight Search Script

**Files:**
- Modify: `package.json`
- Create: `scripts/refresh-flights.mjs`

**Interfaces:**
- Produces: `public/flights.json`

- [ ] **Step 1: Install `fli-js`**
Run:
```bash
npm install fli-js
```

- [ ] **Step 2: Create `scripts/refresh-flights.mjs`**
```javascript
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { Airport, FlightSearchFilters, FlightSegment, SearchFlights, SeatType } from "fli-js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_FILE = path.join(__dirname, "../public/flights.json");

async function fetchRoute(origin, dest, dateStr, label) {
  const filters = new FlightSearchFilters({
    passenger_info: { adults: 8, children: 0, infants_in_seat: 0, infants_on_lap: 0 },
    flight_segments: [
      new FlightSegment({
        departure_airport: [[[origin, 0]]],
        arrival_airport: [[[dest, 0]]],
        travel_date: dateStr,
      }),
    ],
    seat_type: SeatType.ECONOMY,
  });

  const search = new SearchFlights();
  try {
    const results = await search.search(filters, { currency: "USD", topN: 3 });
    return {
      route: label,
      date: dateStr,
      flights: (results || []).slice(0, 3).map(f => {
        const leg = f.legs[0];
        return {
          airline: leg.airline,
          flightNumber: leg.flight_number,
          departs: leg.departure_datetime.toISOString(),
          arrives: leg.arrival_datetime.toISOString(),
          price: f.price,
          duration: f.duration,
          bookingUrl: search.buildFlightBookingUrl(f, { currency: "USD" })
        };
      })
    };
  } catch (err) {
    console.error(`Failed to fetch ${label}:`, err);
    return { route: label, date: dateStr, flights: [], error: err.message };
  }
}

async function main() {
  console.log("Fetching flight prices...");
  const data = {
    fetchedAt: new Date().toISOString(),
    routes: []
  };

  // HND -> CTS (Dec 20)
  data.routes.push(await fetchRoute(Airport.HND, Airport.CTS, "2026-12-20", "Tokyo → Sapporo"));
  
  // CTS -> ITM (Dec 23)
  data.routes.push(await fetchRoute(Airport.CTS, Airport.ITM, "2026-12-23", "Sapporo → Osaka/Kyoto"));

  await fs.writeFile(OUT_FILE, JSON.stringify(data, null, 2));
  console.log(`Wrote ${data.routes.length} routes to flights.json`);
}

main().catch(console.error);
```

- [ ] **Step 3: Add to `package.json` scripts**
Modify the `refresh-all` script to include `node scripts/refresh-flights.mjs;`.
Add a specific script: `"refresh-flights": "node scripts/refresh-flights.mjs && git add public/flights.json && git diff --cached --quiet || git commit -m \"chore: refresh flight prices\" && git push"`

- [ ] **Step 4: Run the script**
```bash
npm run refresh-flights
```
Verify `public/flights.json` is created.

- [ ] **Step 5: Commit**
```bash
git add package.json package-lock.json scripts/refresh-flights.mjs public/flights.json
git commit -m "feat: add fli-js flight search script"
```

### Task 3: Render Flights on Dashboard

**Files:**
- Create: `src/components/FlightIntelPanel.tsx`
- Modify: `src/components/Dashboard.tsx`

**Interfaces:**
- Produces: `<FlightIntelPanel />`

- [ ] **Step 1: Create `src/components/FlightIntelPanel.tsx`**
```tsx
import { useState, useEffect } from "react";
import { Plane, ExternalLink, AlertTriangle, Clock } from "lucide-react";

type Flight = {
  airline: string;
  flightNumber: string;
  departs: string;
  arrives: string;
  price: number;
  duration: number;
  bookingUrl: string;
};

type RouteData = {
  route: string;
  date: string;
  flights: Flight[];
  error?: string;
};

export function FlightIntelPanel() {
  const [data, setData] = useState<{ fetchedAt: string; routes: RouteData[] } | null>(null);

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}flights.json`)
      .then(r => r.ok ? r.json() : null)
      .then(setData)
      .catch(() => {});
  }, []);

  if (!data || !data.routes || data.routes.length === 0) return null;

  return (
    <div className="glass rounded-2xl border border-sky-500/20 p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-sky-300 flex items-center gap-2">
          <Plane size={14} className="text-sky-400" /> Domestic Flight Intel
        </h3>
        <span className="text-[0.6rem] text-slate-500">
          Live prices (8 pax)
        </span>
      </div>

      <div className="space-y-4">
        {data.routes.map((r, i) => (
          <div key={i} className="bg-black/30 rounded-xl p-3 border border-white/5">
            <h4 className="text-xs font-bold text-white mb-2">{r.route} <span className="text-slate-400 font-normal ml-1">· Dec {r.date.split("-")[2]}</span></h4>
            {r.error && (
              <p className="text-xs text-amber-400 flex items-center gap-1"><AlertTriangle size={12}/> Search failed</p>
            )}
            {r.flights.length === 0 && !r.error && (
              <p className="text-xs text-slate-400">No flights found.</p>
            )}
            <div className="space-y-2">
              {r.flights.map((f, j) => {
                const dep = new Date(f.departs).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
                const arr = new Date(f.arrives).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
                return (
                  <div key={j} className="flex items-center justify-between bg-white/5 rounded-lg p-2 hover:bg-white/10 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="text-[0.65rem] font-bold bg-sky-500/20 text-sky-200 px-1.5 py-0.5 rounded">{f.airline.replace(/^_/, "")}</div>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-white">{dep} – {arr}</span>
                        <span className="text-[0.6rem] text-slate-400 flex items-center gap-1"><Clock size={10} /> {Math.floor(f.duration/60)}h {f.duration%60}m</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="block text-xs font-bold text-emerald-400">${f.price}</span>
                        <span className="block text-[0.55rem] text-slate-500">per person</span>
                      </div>
                      <a href={f.bookingUrl} target="_blank" rel="noreferrer" className="bg-sky-500 hover:bg-sky-400 text-black p-1.5 rounded-md transition-colors">
                        <ExternalLink size={14} />
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Add to `Dashboard.tsx`**
Open `src/components/Dashboard.tsx`.
Import the component at the top:
```typescript
import { FlightIntelPanel } from "./FlightIntelPanel";
```

Add `<FlightIntelPanel />` immediately above `<TravelIntelPanel />` in the `PreTripDashboard` component:
```tsx
      {/* Travel Intel + AI Briefing */}
      {/* ... dining / jma alerts ... */}
      <FlightIntelPanel />
      <TravelIntelPanel />
```

Also add it to the feed status list in `FeedStatusFooter`:
```tsx
      { key: "Flights", url: `${import.meta.env.BASE_URL}flights.json` },
```

- [ ] **Step 3: Test rendering**
Run `npm run dev` or preview the build.
Expected: The Domestic Flight Intel panel appears showing the parsed flights.

- [ ] **Step 4: Commit**
```bash
git add src/components/FlightIntelPanel.tsx src/components/Dashboard.tsx
git commit -m "feat: render live flight prices on dashboard"
```
## Spec Review Checklist
- [x] Spec coverage checked
- [x] Placeholders scanned and removed
- [x] Type consistency verified
