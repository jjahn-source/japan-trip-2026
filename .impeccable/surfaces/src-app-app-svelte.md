---
version: 1
slug: "src-app-app-svelte"
primary_target: "src/app/App.svelte"
related_targets: []
---

# Trip app (Operate)

Scope: the whole trip app shell: trip home, day timeline, stop sheet, journey strips with leg playback on the 3D map, bookings, budget, search. Phone (390) first, desktop (1440) equal.
Audience/job: eight friends ~20, before and during a 15-day Japan trip (Dec 15-29 2026), often at night, outdoors, one thumb. Job: what's now/next, how we get there, everything about the place, what to book.
Decision: the user declined the direction question; the assigned direction was built unattended (assumption stated to the user).

## Direction contract

THESIS: The trip lives after dark in Tokyo and Osaka, so the app is a lantern-lit night city where the route itself glows. It refuses the white-card travel-app default and the near-black-with-one-neon cliche: deep indigo, warm lantern light, and the railways' own line colours.

OWN-WORLD: Night indigo ground, dusk-violet panels, paper-lantern amber as the one light (selection halo, times, now), noren vermilion only for book/now/alerts, washi-white text; official line colours are the only other hues. Dela Gothic One for numerals and kanji at poster scale against small Zen Kaku Gothic New labels. One-device-pixel hairlines, a visible hour grid behind the timeline, pill chips in line colours, solid panels with a lantern top edge, no glass.

STORY: Open and see now/next or the countdown; tap a day and its timeline and route light up; tap a leg's play and the route ignites along the real path on the 3D night map; tap a stop for everything; bookings and budget one tap away. Never lost, never reading raw transit strings.

FIRST VIEWPORT: Phone: top 42% is the 3D dusk/night map with the day's route glowing in line colours and numbered lantern pins; below, the day header (huge Dela Gothic day numeral and city kanji, date, weather, sunset), then timeline rows (amber tabular time column, name, one-line hook, fixed chips) with journey strips between them. Top bar: trip mark, 15-day switcher, search, bookings badge. Desktop: a 440px left column with the same content; the map fills the rest.

FORM: candidate 3 of 7 (night city: lantern and neon signage), seed: none (unavailable). Raise from the Crouwel grid: the hour grid as visible armature. Raise from the character catalog: every stop keeps fixed furniture slots (time, price, book, cash) in fixed places. Raise from the centre-rail setting: one-device-pixel hairlines, crisp. Raise from the variable-font specimen: hierarchy by scale contrast, giant numerals against small labels. Signature move: leg playback, the route lighting up like a neon tube segment by segment, station names popping in as lantern tags, a clock ticking departure to arrival.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
