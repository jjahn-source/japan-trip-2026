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

Rebuild the pack when the plan changes: `npm run places`. About a minute with the local OpenStreetMap
extracts, which come from Geofabrik (Kantō, Kansai and Chūgoku, ~1 GB, refreshed daily) and are read
with `osmium`: `brew install osmium-tool`, then `npm run osm` once (and again to refresh them; it only
downloads what is newer). The category table's own Overpass selectors run as predicates on the extract
(`src/lib/osmselect.ts`, `scripts/osm-local.mjs`), so the result matches what an Overpass query returns,
and it is fresher: the Overpass mirror we used was missing edits from August and September 2026 (shops closed since were still listed).
Without the extracts, or with `PLACES_OSM=overpass`, it asks the public Overpass servers instead: 15
minutes to an hour, and it fails when they are down (answers are cached for a day in
`data/.places-cache.json`). An area outside the three regions falls back to Overpass by itself.

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

## The live layer

On Cloudflare, one Worker (`worker/index.ts`) serves the built site and a small API on D1 (SQLite),
so the plan can change after it's built:

- **Shared edits.** Anyone with the link can move a stop's time, add a note for the group or cancel
  it, from the stop's details. "Back to the plan" undoes it. Every phone shows the change within
  30 seconds, with who made it, and the trip page lists recent changes.
- **Shared bookings.** A tick on the Bookings page shows on everyone's phone.
- **Last train home.** Each night out has a panel under the day's briefing: leave by, the train, in
  bed by. `npm run last-trains` finds them with Yahoo!乗換案内's own last-train (終電) search on the
  trip's dates (real timetables; NAVITIME's free plan only averages late-night intervals and Google's
  API has no Japanese transit). It starts from where the plan has the group at 23:30, tries the two
  stations nearest that stop and the bed, checks Yahoo matched the right station by its coordinates,
  and keeps the train that lets the group leave latest, walk included. About 40 searches, 2.5 s apart.
  Nights a walk from bed, and Hakone (no station near the villa: a taxi night), get none. Operators
  publish year-end timetables in December, so run it again a week before the trip. Anyone can
  correct a night on the site.
- **Phone alerts (Web Push).** Turned on per phone from the trip page: leave now (10 min before each
  ride), last train (20 min before you must leave), booking deadlines (9am local, 3 days before and on
  the day) and plan changes (as they happen, not to the phone that made them). A cron run every minute
  sends what's due, once. On an iPhone, alerts only work from the Home Screen app (iOS 16.4+).

Offline, a phone keeps the last state it saw and queues its own edits until there's signal. On a
plain static host (no Worker) the site works as before: no edit buttons, ticks saved on the phone.
The rules shared by the Worker and the app are in `src/lib/live.ts`; push encryption and signing
(WebCrypto, no dependencies) are in `worker/push.ts`.

```sh
npm run live:setup      # once: local push keys in .dev.vars (never committed)
npm run live:dev        # build, local database, Worker + site on http://localhost:8787
npm run e2e:live        # end to end against it (a stand-in push service decrypts the real pushes)
npm run stress:live     # its limits: 1,000 saves at once, 50 phones checking, hostile input, every alert of the trip
```

Sized for Cloudflare's free plan, and tested at its limits (`npm run stress:live`):

- **Reads.** The current state is kept in one row (`snapshot`), updated with only the new changes on each
  save, so a phone's check and a cron run read 2 rows, not the history. A phone that already has the
  latest version gets 22 bytes back. A worst day (8 phones open 16 hours, checking every 30 s) is about
  48,000 rows read of the 5,000,000 free, and about 17,000 requests of the 100,000.
- **Saves.** Two people saving at once can't overwrite each other: the snapshot only moves forward
  from the version it was read at. 1,000 saves, 40 at a time, all land and match the full history.
- **CPU (10 ms a run).** Alerts for the whole plan take ~0.4 ms per time zone; a run sends at most 20
  pushes (~0.4 ms each) and the rest follow a minute later, inside the 15-minute window.
- **Abuse.** Bodies over 8 KB, or without a declared length, are refused unread; at most 40 phones can
  turn alerts on; subscriptions must point at Apple's, Google's, Mozilla's or Microsoft's push service.
- **Phones.** Requests give up after 10 s (a tunnel can't jam later checks); repeated edits made
  offline to the same thing merge into one.
- **Alerts.** From today to the end of the trip, in three time zones, with the cron running only every
  13 minutes, every alert goes out exactly once and on time.

`npm run dev` works beside `npx wrangler dev` (the dev server sends `/api` to port 8787).

## Deploy

With the live layer (Cloudflare's free plan is enough):

```sh
npx wrangler login
npm run live:setup -- --remote   # once: creates the database, publishes, stores push keys as secrets
npm run live:deploy              # every later update
```

Without it, `dist/` is plain static files: drag it into Netlify or Cloudflare Pages, or `vercel deploy dist`.
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
(`npm run fonts`). The live layer is a Cloudflare Worker with static assets, D1 and a cron trigger
(`wrangler.jsonc`), with Web Push written on WebCrypto. Tests: `node --test` units and Playwright end-to-end.
