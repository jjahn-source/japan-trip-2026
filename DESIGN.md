---
name: Japan trip · Lantern night city
description: The trip as a lantern-lit night city. Deep indigo, one warm lantern light, the railways' own line colours, and a 3D night map where each ride lights up along its real path.
colors:
  night: "oklch(19% 0.05 276)"
  night-2: "oklch(23.5% 0.058 278)"
  night-3: "oklch(29% 0.066 280)"
  night-4: "oklch(35% 0.07 282)"
  rule: "oklch(42% 0.05 280 / 0.55)"
  rule-strong: "oklch(55% 0.06 280 / 0.7)"
  washi: "oklch(95.5% 0.012 85)"
  washi-2: "oklch(80% 0.035 280)"
  washi-3: "oklch(68% 0.04 280)"
  lantern: "oklch(83% 0.145 76)"
  lantern-2: "oklch(74% 0.155 66)"
  lantern-wash: "oklch(83% 0.145 76 / 0.13)"
  noren: "oklch(64% 0.2 31)"
  noren-wash: "oklch(64% 0.2 31 / 0.16)"
  on-noren: "oklch(98% 0.01 85)"
  ok: "oklch(79% 0.13 155)"
  map-lantern: "#f2c46d"
typography:
  display:
    fontFamily: "'Dela Gothic One', 'Zen Kaku Gothic New', system-ui, sans-serif"
    use: "day numerals (5.4rem), the trip mark, money totals, the playback clock, the days' kanji"
  body:
    fontFamily: "'Zen Kaku Gothic New', system-ui, -apple-system, 'Hiragino Sans', sans-serif"
    fontSize: "1rem"
    lineHeight: 1.55
    weights: [400, 500, 700]
  numerals: "tabular figures (.num) for every time, date, price and count"
rounded:
  s: "8px"
  m: "14px"
  l: "22px"
  pill: "99px"
spacing:
  gutter: "max(16px, safe-area-inset-left)"
  bar-height: "56px"
  map-phone: "40svh (70svh enlarged)"
  pane-desktop: "440px (480px from 1280px)"
  touch: "40–44px"
motion:
  ease: "cubic-bezier(0.16, 1, 0.3, 1)"
  fast: "160ms"
  med: "320ms"
  slow: "560ms"
components:
  top-bar: "trip mark (八), Days / Bookings / Budget tabs, search; sticky"
  map-stage: "Mapbox Standard 3D; phone: sticky under the bar; desktop: fills the right"
  day-header: "giant numeral + outlined kanji watermark + date line, title full width, facts row"
  timeline-row: "time column (amber start, dim end), lantern number on the rail, name, Japanese name, hook, fixed chips"
  journey-strip: "proportional segment bar in line colours (walks dotted), one row per ride: line pill, on → off, minutes; play button"
  stop-sheet: "native dialog; phone: bottom sheet sized to content; desktop: right panel"
  search: "native dialog palette: trip stops first, then places near the day"
  pin-card: "solid card over the map: name, distance, Go, Site, remove"
---

# Design System: Lantern night city

## Overview

The trip happens after dark in Tokyo and Osaka, so the app is a night city: a deep indigo ground,
one warm light (the paper lantern) for whatever matters now, and the railways' own line colours for
getting around. It refuses the white-card travel-app default and the near-black-with-neon cliché.
Mode: Operate. The job is "what's now, how do we get there, everything about the place, what to
book", one thumb, outdoors, often at night. Phone (390 px) first, desktop (1440 px) equal.

The signature move is **leg playback**: tap ▶ on the hop between two stops and the ride lights up
along its real path on the 3D map, segment by segment in each line's colour, station names
popping in as lantern tags and a clock ticking from departure to arrival.

## Colors

- **Night** (`night` to `night-4`): the ground and the panels. All neutrals sit on the 276–282
  hue, so nothing looks grey.
- **Washi** (`washi` to `washi-3`): text. `washi` reads at 15:1 on `night`; `washi-3` is the
  quietest text allowed (secondary lines, never body copy).
- **Lantern** amber: the one light. Times, selection, the active tab, the current day, the
  trip mark, totals. A soft glow (`text-shadow`/`box-shadow` in lantern at low alpha) is the
  only "shadow" the content gets.
- **Noren** vermilion: only for now, overdue, book, alerts and a dropped pin.
- **Line colours**: the official colours of each railway or bus line come from the data, never
  from the theme. Pill text picks dark or white by WCAG luminance (`inkOn` in
  `src/app/lines.ts`).

## Typography

Dela Gothic One draws numerals, the days' kanji and the trip mark at poster scale. Zen Kaku
Gothic New sets everything else at small, calm sizes, so hierarchy comes from scale contrast.
Fonts are self-hosted and subset to what the trip shows (`npm run fonts`): Latin regular,
medium and bold plus the display face are about 10 KB each. The Japanese glyphs (about 80 KB) load
only where Japanese text appears; anything outside the subset falls back to the system's
Japanese font.

## Layout

- Phone: top bar, then the map (40% of the screen, sticky; the pill under it enlarges it to
  70%), then the view. Scroll padding keeps focused rows clear of the sticky map.
- Desktop (900 px+): the view in a 440 px left column that scrolls on its own; the map fills the
  rest. A stop's sheet opens as a right panel, and the map centres the stop in the part still
  visible.
- Every page is pre-rendered with the real trip (`#boot`), so it reads at first paint and its
  links work without JavaScript; the live app replaces it in the same frame once the data is in.

## Components

- **Timeline row**: fixed furniture in fixed places: start (amber) over end (dim), the stop
  number on the rail, name, Japanese name, one-line hook, then chips in a set order (Now, Book or
  Check, price, Cash only, Booked) and a 160 px photo.
- **Journey strip**: between two stops. The bar's segments are sized by minutes; walks are
  dotted. Each ride is a line pill and "on → off". The play button stops a ride mid-way and
  replays it once it has arrived.
- **Stop sheet**: a native `<dialog>`. Back, Escape, the backdrop, the close button and a swipe
  down on the grip all close it, and the URL carries the open stop (`#d03-s02`).
- **Map markers**: places on the trip map (kanji + day ranges, one per city even when the trip
  comes back), numbered lanterns on a day map (stops at one spot share a pin, "1·9"), a
  vermilion pin for a search result. They're real buttons named by their text.
- **Search**: `/` or ⌘K. Trip stops first, then places near the day from the place pack, by
  name, kind ("ramen", "konbini") and "open now".

## Motion

One authored motion (leg playback). Everything else is short and functional: views rise in
(only after navigation, never on first load), sheets slide up, tags pop. The map's light
follows the hour of the open stop or the playing ride (dawn, day, dusk, night) and changes only
while the camera rests. `prefers-reduced-motion` drops playback to its end state and stops
camera flights and entrances.

## Do's and Don'ts

### Do
- Keep lantern for what matters now and noren for what needs doing; let line colours carry
  transit.
- Set every time, price and count in tabular figures.
- Keep the URL, the back button, the map and the view in step through the store
  (`src/app/state.svelte.ts`).
- Keep touch targets 40–44 px and the sheet's close paths all working.

### Don't
- Don't use glass, blur or hard drop shadows on content.
- Don't add kicker or eyebrow labels above headings.
- Don't colour by hue alone: chips carry words, pins carry numbers.
- Don't show raw transit strings when the legs data can draw the ride.
