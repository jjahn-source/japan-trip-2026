# Japan Plan C · trip site

A stamp-rally card for 8 friends, Dec 14–29 2026. Built from the TREK export
(`data/japan-plan-c.md`); every page is static, works offline once loaded, and knows the time in Japan.

The map is the site. One full-screen map stays loaded while you move between pages; each page is a
card laid over it (a left dock on a laptop, a bottom sheet you drag between three heights on a phone)
and tells the map where to fly: the whole route, one day's stops, or the bookings still to make.
Before the trip the home page opens with a short flyover (Skip, or `?noflight`); during the trip it
opens on today, at the stop you're at.

## Run it

```sh
npm install
npm run dev        # http://localhost:4321
npm run build      # static site in dist/
npm run preview    # serve dist/ (service worker active) on :4321
```

Node 22.12+ required (Astro 7).

## Update the plan

Re-export from TREK, then:

```sh
npm run sync       # copies /Users/jjahn/TREK/japan-plan-c.md into data/
npm run fonts      # only if the plan gained new Japanese text (re-subsets the font)
npm run build
```

The parser (`src/lib/plan.ts`) reads the export's structure directly: days, timed stops, notes,
stays, the booking schedule and the budget. Known export quirks are corrected in
`src/lib/trip.ts` (`corrections()`), to-dos are linked to stops in `TODO_LINKS`, and map pins that
sit away from the place they name are moved in `src/lib/plan.ts` (`PIN_FIXES`, checked against
OpenStreetMap).

## Trending nearby, quick adds, trains

- **Trending nearby** (`npm run trending`, writes `data/trending.json`): OpenStreetMap attractions,
  museums, shrines, temples, gardens and viewpoints within a 12-minute walk of each day's stops, ranked
  by Wikipedia readers (Japanese + English) over the last 30 days. Places get a boost when interest is
  rising against the 30 days before, or when it ran high last December (illuminations, winter
  events). People, red-light districts and places already in the plan are filtered out. Free and
  keyless, but Wikimedia throttles bursts, so the script paces itself (about 15 minutes); rerun it
  closer to the trip for fresher rankings.
- **Quick add**: tap + Add on a card or a map pin. Adds are saved on that phone, slot into the
  timetable after the nearest stop, draw a dashed spur on the map, and *Share adds* copies a list
  to paste into TREK or the group chat.
- **Trains** (`npm run transit`, writes `public/transit.json`): the rail network around every place
  the trip goes (Tokyo, Hakone, Kyoto, Osaka, Nara, Hiroshima, and the Shinkansen between them) from
  OpenStreetMap, each line in its official colour, with stations and animated train flow. On a day
  page the lines that day rides are drawn boldly and listed under *Your trains today*.
- **Real routes** (`npm run legs`, after `npm run transit`; writes `public/legs.json`): each hop is
  drawn the way you'll travel it. The mode comes from the plan's own words ("Then: Ginza line…",
  "Getting there: Ōedo line…", "Van to…", "10:45 boat"; the first vehicle named wins), then the
  day's briefing ("K bus ~14:03 to Amazake-chaya"), falling back to distance. Train legs are the
  shortest trip on the real rail network, preferring the lines the plan names, drawn in each line's
  colour with trains running along them; walks follow streets (OSRM foot), buses and cars follow roads
  (OSRM car), boats cross the water. Each stop in the timetable shows the next hop ("Tokyo Metro Ginza
  Line Ueno-hirokōji–Ginza · ~8 min"). Times are estimates; Directions opens Google Maps for live times.
- **Researched picks** (`scripts/picks.mjs` → `data/picks.json`, `npm run picks`): events and places
  found by web research for the trip's own dates, each with its source, a date window, and a "check
  before you go" flag where organisers hadn't confirmed 2026 details. Picks already in the plan are
  skipped automatically. They lead the *Things to do nearby* strip, ahead of the Wikipedia trends.
- **3D**: the orbit button circles the view; right-drag (or two-finger twist on a phone) tilts and turns.

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

**How search works** (`src/scripts/search.ts`). Every keystroke is answered on the phone, in a few
milliseconds and with no signal: your stops, picks and stations, plus the *place pack*
(`npm run places` → `public/places/day-N.json`), which holds every ramen shop, izakaya, bar,
konbini, ATM, toilet, coin locker, arcade and so on within ~11 minutes' walk of every stop, with
opening hours, cuisine, cards and diet tags. When typing pauses (220 ms), the network adds to the list
as each source answers, never waiting for the slowest: TREK Places and Photon for names, TREK
nearby for categories, and Overpass only for toilets and lockers outside the pack (one server at a
time, as its operators ask). Answers are cached in memory and by the service worker, so a repeated
search is instant and works offline.

- It reads what you type: `ramen near stop 5 open now`, `late night izakaya near Shinjuku`,
  `toilets between stop 3 and 4`, `coffee along day 6 route`, `7-eleven near me`, `ラーメン`.
  The rules live in `src/lib/query.ts`, the categories (words, TREK categories, OSM tags) in
  `src/lib/categories.ts`, and `npm test` checks both.
- Names match the way they're typed: Tōkyō = tokyo = toukyou, Shimbashi = Shinbashi,
  カフェ = かふぇ, full-width letters, and one typo per word (`src/lib/textmatch.ts`).
- Results say open or closed now, fit your free time on a day page, and add to the right day.
  Enter opens a clear best match; ↑↓ move through results; `/` or ⌘K focuses search; panning
  after a map search offers *Search this area*.

Rebuild the pack when the plan changes: `npm run places` (about 5–15 minutes; Overpass is slow,
and its answers are cached for a day in `data/.places-cache.json`).

| What | Source | Key |
|---|---|---|
| Search (top of the map) | Your plan + the place pack on the phone, then [TREK Places](https://places.liketrek.com) (Overture + its OpenStreetMap layer) and [Photon](https://photon.komoot.io) | none |
| Explore chips: food, cafés, bars, konbini, ATMs, pharmacy | TREK Places `/v1/nearby` | none |
| Coin lockers, toilets, opening hours | The place pack (`npm run places`); Overpass only outside it | none |
| Seats 8 (group restaurants) | Hot Pepper Gourmet API | `PUBLIC_HOTPEPPER_KEY` |
| Weather | Typical (Open-Meteo archive, `npm run climate`), then the live forecast 16 days out | none |
| Alerts | JMA weather warnings + P2PQuake earthquakes/tsunami, during the trip (`?alerts` to test) | none |
| ≈ $ beside ¥ prices, converter on Info | Frankfurter (ECB rates) | none |
| Timetable for rides of 3 km+ | NAVITIME Route (totalnavi) at build: `npm run timetable` | `RAPIDAPI_KEY` |
| Live times button | NAVITIME on the phone, else Google Maps transit (live in its app) | `PUBLIC_RAPIDAPI_KEY` (optional) |

Copy `.env.example` to `.env` and fill in what you have; everything without a key works as is.

## Preview any moment

Add `?now=` (Japan time) to any URL: `/?now=2026-12-20T16:36` shows the card on Day 7 at sunset.
Add `?debug` to expose the map as `window.__map` in the console.
A banner offers the way back to real time.

## Maps

- Default: MapLibre GL 6 over OpenFreeMap vector tiles and Mapterhorn terrain (no key, no account).
  The light, sky and hillshade follow the real sun position for each place and minute.
- Mapbox: add a public token and the same map switches to Mapbox Standard (3D buildings and
  landmarks, terrain, the route inking itself in), with its dawn/day/dusk/night light preset
  driven by the same sun maths. Put the token in `.env` once:

  ```sh
  echo "PUBLIC_MAPBOX_TOKEN=pk.your-token" > .env
  npm run build
  ```

  In the Mapbox account, restrict the token to the site's URL.

  The free tier (about 50,000 map loads a month) is far more than eight people need.

## Deploy

`dist/` is plain static files: drag it into Netlify or Cloudflare Pages, or `vercel deploy dist`.
For a sub-path host such as GitHub Pages: `BASE=/japan-plan-c/ npm run build`.

The site includes street addresses and booking confirmation codes (by choice), and is marked
`noindex`. Share the link only with the group.

## Stack

Astro 7.3 (static), TypeScript, MapLibre GL 6 (optional Mapbox GL 3), hand-written CSS with oklch
tokens, Astro's ClientRouter (the map persists across pages via `transition:persist`), a build-generated service worker
(`scripts/service-worker.mjs`), self-hosted fonts: Archivo, Atkinson Hyperlegible Next, and
Zen Kaku Gothic New subset to the site's own ~260 Japanese characters.
