# Japan Plan C · trip site

The trip app for 8 friends, Dec 2026. Built from the trip plan (`data/itinerary.json`, from the
itinerary agent below); every page is static, works offline once loaded, and knows the time in Japan.

One app (Svelte 5 in Astro) shows the whole trip: the home page (now/next or the countdown, what to
book, every day, money, stays), each day hour by hour, the bookings and the budget. A 3D night map
(Mapbox Standard) sits on top of the phone screen and to the right on a laptop. Between every two
stops a journey strip draws the ride in its lines' own colours; tap ▶ and the ride plays out on the
map along its real path, station by station, with the clock running from departure to arrival.
Tap a stop for everything about it. The look is documented in `DESIGN.md`.

## Run it

```sh
npm install
npm run dev        # http://localhost:4321
npm run build      # static site in dist/
npm run serve      # serve dist/ compressed and cached like a real host, on :4326
npm test           # unit tests (search parsing, money, line colours, the map's light)
npm run e2e        # the built app in Chromium at phone and desktop sizes (Playwright)
npm run sweep      # with serve running: opens every stop, plays every ride, searches; prints anything wrong
npm run perf       # with serve running: tap-to-paint times on a 4x-slowed phone, and scroll smoothness
npm run frames     # with serve running: frame times while rides play, the camera flies and sheets open
```

Node 22.12+ required (Astro 7).

## Update the plan

Re-export from TREK, then:

```sh
npm run sync       # copies /Users/jjahn/TREK/japan-plan-c.md into data/
npm run fonts      # only if the plan gained new Japanese text (re-subsets the fonts)
npm run thumbs     # only if the plan gained new photos (makes small local copies)
npm run build
```

The parser (`src/lib/plan.ts`) reads the export's structure directly: days, timed stops, notes,
stays, the booking schedule and the budget. Known export quirks are corrected in
`src/lib/trip.ts` (`corrections()`), to-dos are linked to stops in `TODO_LINKS`, and map pins that
sit away from the place they name are moved in `src/lib/plan.ts` (`PIN_FIXES`, checked against
OpenStreetMap).

## Nearby picks, trains and routes

- **Trending nearby** (`npm run trending`, writes `data/trending.json`): OpenStreetMap attractions,
  museums, shrines, temples, gardens and viewpoints within a 12-minute walk of each day's stops, ranked
  by Wikipedia readers (Japanese + English) over the last 30 days. Places get a boost when interest is
  rising against the 30 days before, or when it ran high last December (illuminations, winter
  events). People, red-light districts and places already in the plan are filtered out. Free and
  keyless, but Wikimedia throttles bursts, so the script paces itself (about 15 minutes); rerun it
  closer to the trip for fresher rankings.
- **Nearby picks**: each day ends with a strip of the picks and trends near its stops; tap one to
  drop it on the map with a Go button.
- **Trains** (`npm run transit`, writes `public/transit.json`): the rail network around every place
  the trip goes, from OpenStreetMap, each line in its official colour. `npm run legs` routes each
  ride over it.
- **Real routes** (`npm run legs`, after `npm run transit`; writes `public/legs.json`): each hop is
  drawn the way you'll travel it. The mode comes from the plan's own words ("Then: Ginza line…",
  "Getting there: Ōedo line…", "Van to…", "10:45 boat"; the first vehicle named wins), then the
  day's briefing ("K bus ~14:03 to Amazake-chaya"), falling back to distance. Train legs are the
  shortest trip on the real rail network, preferring the lines the plan names, drawn in each line's
  colour; walks follow streets (OSRM foot), buses and cars follow roads (OSRM car), boats cross the
  water. Between every two stops a journey strip shows the ride (line pills, on → off stations,
  minutes), and ▶ plays it on the map. Times are estimates; Directions opens Google Maps for live times.
- **Researched picks** (`scripts/picks.mjs` → `data/picks.json`, `npm run picks`): events and places
  found by web research for the trip's own dates, each with its source, a date window, and a "check
  before you go" flag where organisers hadn't confirmed 2026 details. Picks already in the plan are
  skipped automatically. They lead the nearby strip, ahead of the Wikipedia trends.
- **3D**: right-drag (or a two-finger drag or twist on a phone) tilts and turns the map.

## The itinerary agent

`npm run plan` turns a plain-language brief (`planner/brief.md`) into the whole trip: it researches
what people post (TikTok, Instagram incl. posts tagged at a place, Lemon8, Xiaohongshu, Reddit,
Threads, X, YouTube), what Japanese locals rate (Japanese Google, every Japanese Google Maps review,
Tabelog read-only) and the web; watches the best videos; verifies every place; plans each day hour
by hour around the booked stays; checks the plan (opening hours, travel time between stops, every
wish in the brief accounted for) and repairs what fails; then writes a guidebook spread per stop:
photo or the original video, the story, how to do it, tips, cost, booking, and where it came from.
The result is `data/itinerary.json`; when it exists the site builds from it instead of the TREK
export, and the map, routes, search and bookings follow. `TRIP_SOURCE=trek` switches back.

```sh
npm run plan                                   # plan from planner/brief.md
npm run plan -- edit "swap day 3's izakaya for somewhere louder"
npm run plan -- add https://www.tiktok.com/@…/video/… "this looks fun"
npm run plan -- status                         # which sources are on
```

Each run re-derives the rail lines, routes and search place pack (`--no-site` skips that). Every
outside call is cached in `planner/.cache/`, so re-runs and edits only pay for what changed. The
agent decides by itself; you edit afterwards in plain words.

| Source | What for | `.env` key |
|---|---|---|
| Claude Opus 5.5 | Planner, researcher and writer (required) | `ANTHROPIC_API_KEY` |
| [TikHub](https://tikhub.io) | TikTok, Instagram (+ by location), Lemon8, Xiaohongshu, Reddit, Threads, YouTube | `TIKHUB_API_KEY` |
| [xAI](https://console.x.ai) Grok 4.7 X Search | X (Twitter), Japanese and English | `XAI_API_KEY` |
| [Perplexity Search API](https://www.perplexity.ai/api-platform) | Web search | `PERPLEXITY_API_KEY` |
| [SerpApi](https://serpapi.com) | Google as seen in Japan; every Google Maps review | `SERPAPI_API_KEY` |
| [Google Maps Platform](https://console.cloud.google.com/google/maps-apis) (Places API New) | Real, open, hours, address | `GOOGLE_MAPS_API_KEY` |
| [Hot Pepper](https://webservice.recruit.co.jp/) | Restaurants with seats for the group | `HOTPEPPER_API_KEY` |
| [Gemini API](https://aistudio.google.com/apikey) (3.8 Flash) | Watching reels and TikToks | `GEMINI_API_KEY` |

Without the optional keys it still works on Claude's own web search plus TREK Places, OpenStreetMap
and Wikipedia. Design: `docs/superpowers/specs/2026-10-17-itinerary-agent-design.md`.

## Search and live Japan data

**Search** (`src/app/Search.svelte`; `/` or ⌘K, or the search button). Every keystroke is answered
on the phone, with no signal: first the trip's own stops (any day), then places near the day you're
looking at from the *place pack* (`npm run places` → `public/places/day-N.json`): every ramen shop,
izakaya, bar, konbini, ATM, toilet, coin locker, arcade and so on within ~11 minutes' walk of each
stop, with opening hours and cuisine. Type a name, a kind of place (`ramen`, `konbini`, `ラーメン`)
or add `open now`. Names match the way they're typed (Tōkyō = tokyo = toukyou, one typo per word,
`src/lib/textmatch.ts`). Picking a stop opens it; picking a place drops a pin on the map with a Go
button (Google Maps transit directions).

Rebuild the pack when the plan changes: `npm run places` (about 5–15 minutes; Overpass is slow,
and its answers are cached for a day in `data/.places-cache.json`).

| What | Source | Key |
|---|---|---|
| Search | Your plan + the place pack, on the phone | none |
| Weather | Typical (Open-Meteo archive, `npm run climate`), then the live forecast 15 days out | none |
| Alerts | JMA weather warnings + P2PQuake earthquakes/tsunami, during the trip (`?alerts` to test) | none |
| ≈ $ beside ¥ prices in a stop's sheet | Frankfurter (ECB rates) | none |
| Ride routes and timings (the journey strips) | NAVITIME at build: `npm run legs` / `npm run timetable` | `RAPIDAPI_KEY` (build only) |
| The 3D map | Mapbox Standard | `PUBLIC_MAPBOX_TOKEN` |

Copy `.env.example` to `.env` and fill in what you have. Without a map token everything except
the map works (each stop's Directions button still opens Google Maps).

## Preview any moment

Add `?now=` (Japan time) to any URL: `/?now=2026-12-20T16:36` shows the app as it will be on
Day 6 at sunset (now/next, today's day, the map's light). Remove it to go back to real time.
Add `?debug` to reach the map controller as `window.__map` in the console.

## Maps

Mapbox Standard in 3D, with its dawn/day/dusk/night light set from the hour of the stop you have
open (or the ride playing), using each day's own sunrise and sunset. Put the token in `.env`:

```sh
echo "PUBLIC_MAPBOX_TOKEN=pk.your-token" > .env
npm run build
```

In the Mapbox account, restrict the token to the site's URL. The free tier (about 50,000 map loads
a month) is far more than eight people need.

## Deploy

`dist/` is plain static files: drag it into Netlify or Cloudflare Pages, or `vercel deploy dist`.
To share from this Mac, `npm run serve` serves it with compression and the right cache headers
(hashed files cached for a year, pages and trip data always fresh).
Build shared copies with `PUBLIC_RAPIDAPI_KEY=` empty, so no key ends up in the page.
For a sub-path host such as GitHub Pages: `BASE=/japan-plan-c/ npm run build`.

The site includes street addresses and booking confirmation codes (by choice), and is marked
`noindex`. Share the link only with the group.

## Stack

Astro 7.3 (static output, every view pre-rendered with the real trip), Svelte 5 (runes) for the
app, Mapbox GL 3 (Standard style) for the map, hand-written CSS with oklch tokens
(`src/app/theme.css`), a build-generated service worker (`scripts/service-worker.mjs`), and
self-hosted fonts subset to what the trip shows: Zen Kaku Gothic New and Dela Gothic One
(`npm run fonts`). Tests: `node --test` units and Playwright end-to-end.
