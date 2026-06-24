# Hokkaido & Flights Integration Design

## 1. Context & Scope
The request involves two major goals:
1. **Itinerary Adjustment:** Add a new Hokkaido leg to the Japan 2026 trip. This requires cutting nights from other legs (Tokyo, Kyoto, Osaka) to make space for Hokkaido.
2. **Flights Integration:** Integrate a Google Flights search feature into the application by reverse engineering the open-source `fli` repository.

## 2. Approach: Itinerary Adjustment
We currently have 15 nights split across 3 bases:
- Tokyo: 6 nights
- Kyoto: 3 nights
- Osaka: 5 nights (+ 1 night in the air)

**Proposed Adjustments:**
Hokkaido deserves at least 3-4 nights to be worthwhile (Sapporo, Otaru, Noboribetsu/Niseko).
To get 3-4 nights, we can:
- Cut 1 night from Tokyo (5 nights)
- Cut 1 night from Kyoto (2 nights)
- Cut 1-2 nights from Osaka (3-4 nights)
This will create a new base: Hokkaido (Sapporo area) for 3-4 nights.
The route could be: Tokyo -> Hokkaido (fly) -> Kyoto -> Osaka.

## 3. Approach: Flights Integration
We cloned `fli`, a project providing Google Flights search capabilities via an MCP server, CLI, and library.
For our website/app, we'll want to use the JavaScript/TypeScript library: `fli-js`.
Instead of manually reverse engineering it from scratch, we can just consume the `fli-js` npm package which provides `FlightSearchFilters` and `SearchFlights` out of the box.

### 3.1. Implementation Strategy for Flights
- **Dependency:** Add `fli-js` to `package.json`.
- **Backend/Scripting:** Since `fli-js` makes direct API calls to Google's internal APIs, it's safer to run it server-side (Node.js/Bun) or during build time to avoid CORS issues in the browser. 
- **Feature:** We can add a script (e.g. `scripts/refresh-flights.mjs`) to query flights (e.g. domestic flights from Tokyo to Sapporo, Sapporo to Kyoto/Osaka) and save them to a JSON file (`public/flights.json`).
- **UI:** Add a new tab/component in the Dashboard or Bookings view that reads this JSON and shows live or recently fetched flight options.

## 4. Next Steps
I will present these options to the user to get approval on:
1. The exact nights to cut for the Hokkaido leg.
2. The approach for integrating flights (using the `fli-js` package in a script to bypass CORS).
## Spec Review Checklist
- [x] Placeholders checked
- [x] Internal consistency checked
- [x] Scope checked
- [x] Ambiguity checked
