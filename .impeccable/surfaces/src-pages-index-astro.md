---
version: 1
slug: "src-pages-index-astro"
primary_target: "src/pages/index.astro"
related_targets: ["src/pages/day/[n].astro"]
---

# Surface brief: Japan Plan C trip site (map-first)

Scope: whole site. Visitor mode: Read (guide + on-trip companion), with the map as the stage.
User-pinned (2026-10-13): "Make it so that the map is the entire website and the website is built
around it ... the map to be as visually attractive as possible." Engine: Mapbox Standard (user
choice), MapLibre fallback when no token. Layout: map + sheets. Opening: flyover pre-trip, "now"
during the trip. Audience/job and content constraints unchanged (PRODUCT.md).

## Direction contract

THESIS: The trip is a stamp-rally card laid over a living 3D map of Japan: the map is the page,
every navigation is a camera flight, and the card's stamps are how you steer it. Refuses the
page-with-an-embedded-map layout.

OWN-WORLD: Unchanged world. Cool white card stock panels; stamp-pad violet (oklch 36% .15 282)
prints the frame; vermilion 朱 is ink only (stamps, now flag, active stop, focus). Archivo expanded
display + tabular times, Atkinson Hyperlegible Next reading, Zen Kaku Gothic New kanji. Ring marks
carry state. Station-sign prev/next. On the map: violet route with white casing that glows at night,
numbered white rings, base rings with Archivo pills, day-trip kanji stamps; Mapbox Standard 3D
city, landmarks and terrain lit by the real sun's preset.

STORY: Visitor sees Japan in 3D, watches the route fly by (pre-trip) or lands on where the group is
now; taps a stamp, the camera flies to that day while its timetable rises beside it; hands off to
Google Maps for directions.

FIRST VIEWPORT: Full-bleed map. Desktop: a 404px card-stock panel docked left (brand + nav, live
Now/Next line, 8×2 stamp rail, then the view's content), map fills the rest, controls top-right.
Phone: map full screen; bottom sheet with peek (grab handle, brand + nav row, Now/Next line,
one-row scrolling stamp rail), half and full snaps; map padding follows the sheet.

FORM: Eki-stamp rally card, candidate 3 of 7 on my ordered list, assigned by the first direction roll
(ASSIGNED INDEX 3; that roll printed no SEED REFERENCE line). Structure pinned by the user.
seed: none (unavailable)

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
