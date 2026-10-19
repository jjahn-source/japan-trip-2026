# UI revamp: a simple, fast, beautiful trip app

## Why

The itinerary data is now excellent: 15 days, 143 stops, checked facts, measured routes, 31 to-dos and a budget. The UI around it is the problem: cluttered, clunky and buggy, and the transit lines are raw strings like `都営大江戸線 落合南長崎→中野坂上 10:15→10:21`.

The causes:
- **About 4,800 lines of hand-wired scripts:**
  - `search.ts` (894 lines) and `map/stage.ts` (1,154 lines);
  - a custom drag-sheet, a scrubber, an auto intro flight, stamps, adds and trending;
  - two map engines, and page transitions that keep a live map alive across pages.

  Each works alone; together they fight.
- **No component or state model**, so every interaction patches the DOM by hand.
- **Unused route data:** `public/legs.json` already holds every leg's real path, split into walk/rail segments with English line names and official colours.

**Your decisions:**
- **Keep:** search, live info (weather, alerts, live trains, yen to dollar), nearby picks.
- **Cut:** stamp rally.
- **Map:** the 3D Mapbox map everywhere.
- **Transit:** tap to play each leg.

## 1. Rebuild the front end as one small app; keep the data layer

- **What stays:** the data and logic (`src/lib/*` and the search matching in `query.ts`/`textmatch.ts`), the route and place scripts, the service worker, and the live-info fetchers (`japan.ts`, `livetimes.ts`).
- **What's replaced:** pages, layout and client scripts.
- **Framework:** Svelte 5 islands (`@astrojs/svelte`) for real components, state and built-in transitions. A compatibility spike against Astro 7.3/TypeScript 6 comes first. If that fails, fall back to plain TypeScript web components.
- **One persistent map, one app shell, client routing:**
  - Astro still prerenders every route with full text, so first paint is instant and works offline.
  - The app then navigates without reloading the map.
- **No custom drag physics:**
  - **Phone:** the map is on top (~42% of the screen) and shrinks as you scroll, while the timeline scrolls natively.
  - **Desktop:** a content column on the left, the map filling the rest.
  - Stop details open in a native `<dialog>` sheet (back, Escape, swipe-down and close all work).

## 2. What you see

- **Trip home:**
  - Now/Next, or the countdown and the next booking due.
  - 15 day cards (date, city colour, title, weather).
  - The whole route on the map.
  - Panels for bookings due, budget per person, and logistics (luggage, passes, tax-free).
- **Day:**
  - A header (date, city, weather, sunset) and a ≤3-line briefing.
  - A timeline of stops: time, photo, name, one-line hook, and chips (price, book, cash only, open now).
  - A journey strip between stops.
  - The map shows the day's route and numbered pins, and selecting a pin or a row selects it in both places.
- **Stop sheet:**
  - photo, Japanese name, time, price and category;
  - hook and story, how-to, tips;
  - checked facts with sources, videos (tap to load);
  - nearby picks;
  - Directions, Website, Call and Copy address;
  - booking status.
- **Bookings:** overdue / this week / later, with ticks saved on the phone.
- **Budget:** per person, by category.
- **Search:** a command palette over the stops and nearby places.

## 3. Signature: transit you can watch

- **The journey strip:** a proportional bar of the leg's segments.
  - Walking is shown dotted, with its minutes.
  - Each train or bus is a pill in its official line colour, with the English line name, *from → to* stations, times and stop count.
  - It ends with total minutes and fare. Taxis show minutes and the per-car fare.
  - English first, with the Japanese as a small secondary label.
- **Tap ▶:**
  1. The 3D map frames the route.
  2. A glowing dot travels the real path. The line draws itself behind it in its own colour (Mapbox progressive line trim).
  3. The camera follows at a gentle pitch.
  4. Station names pop in as the dot reaches them, and a clock ticks from departure to arrival.
  5. It runs about 3–6 seconds. A tap stops it, and with reduced motion the route just highlights.
- **Data:** measured legs go into `itinerary.json` as structured data (mode, minutes, times, fare, and rides with English line, stations, times and colour). This touches `planner/sources.ts` (`travel()`), `planner/core.ts` (`assemble`) and `src/lib/itinerary.ts`.

## 4. Look and motion

- **Direction:** the design skill's direction round gives you up to three complete visual directions as cards, plus the plain "category standard". **You pick.** The old violet stamp-card look is what we move away from.
- **Map lighting:** it follows the real time of day at each stop, but changes only when the camera is at rest and always eases, so it never flips mid-flight.
- **Motion system, defined once:**
  - day slide with staggered rows;
  - row → sheet morph;
  - one easing and duration scale for every camera move.
  - All of it respects reduced motion.

## 5. Order

1. **Spike:** Svelte 5 + Astro 7, and the Mapbox line-draw plus moving dot on one real leg.
2. **Direction round:** you pick the look.
3. **Structured English legs** in `itinerary.json`, with tests.
4. **The core:** app shell, router, map controller and state store.
5. **The screens:** trip home, day timeline and stop sheet.
6. **The signature:** journey strip and leg playback.
7. **The rest:** bookings, budget, search, live info and nearby picks.
8. **Finish:**
   - motion, responsive (390 px → 1440), accessibility and performance;
   - remove the old UI files;
   - update `PRODUCT.md`/`DESIGN.md`;
   - design finish review;
   - publish.

## Verification

- **Playwright end-to-end tests** at 390×844 and 1440×900:
  - trip → day → stop sheet, then close (button, Escape, back);
  - switch days;
  - pin ↔ row selection;
  - play a leg (the dot reaches the next stop, and the clock shows arrival);
  - search;
  - deep-link reload;
  - offline reload;
  - **zero console errors.**
- **Unit tests** for structured legs and strip proportions, with `npm test` and `astro check` green.
- **Lighthouse mobile:** text first paint under 1.5 s and the map after it, with before/after numbers.
- **Screenshots and the phone link** for you to try.
