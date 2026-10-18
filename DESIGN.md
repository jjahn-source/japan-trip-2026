---
name: Japan Plan C
description: Eight friends, sixteen days, one eki-stamp rally card laid over a living map of Japan.
colors:
  paper: "oklch(97.6% 0.004 285)"
  paper-2: "oklch(94.6% 0.009 285)"
  paper-3: "oklch(91.5% 0.014 285)"
  field: "oklch(36% 0.15 282)"
  field-deep: "oklch(28.5% 0.125 282)"
  on-field: "oklch(98.5% 0.006 285)"
  on-field-2: "oklch(85% 0.06 285)"
  print: "oklch(36% 0.15 282)"
  print-2: "oklch(48% 0.12 282)"
  print-line: "oklch(85% 0.045 282)"
  print-wash: "oklch(92.5% 0.028 282)"
  verm: "oklch(60.5% 0.205 35)"
  verm-text: "oklch(51% 0.19 33)"
  verm-wash: "oklch(94% 0.035 35)"
  verm-fill: "oklch(52% 0.19 33)"
  on-verm: "#ffffff"
  text: "oklch(22% 0.035 282)"
  text-2: "oklch(43% 0.045 282)"
  chart-bar: "#4b3fa3"
  map-violet: "#3a2f8f"
  map-verm: "#e3411f"
  map-ring: "#ffffff"
typography:
  display:
    fontFamily: "'Archivo Variable', 'Archivo', system-ui, sans-serif"
    fontSize: "1.9rem"
    fontWeight: 850
    lineHeight: 0.95
    letterSpacing: "-0.01em"
    fontVariation: "'wdth' 125"
  headline:
    fontFamily: "'Archivo Variable', 'Archivo', system-ui, sans-serif"
    fontSize: "1.15rem"
    fontWeight: 800
    lineHeight: 1.1
    letterSpacing: "-0.01em"
    fontVariation: "'wdth' 118"
  title:
    fontFamily: "'Atkinson Hyperlegible Next Variable', 'Atkinson Hyperlegible Next', 'Zen Kaku Gothic New', system-ui, sans-serif"
    fontSize: "1.04rem"
    fontWeight: 700
    lineHeight: 1.3
  body:
    fontFamily: "'Atkinson Hyperlegible Next Variable', 'Atkinson Hyperlegible Next', 'Zen Kaku Gothic New', system-ui, sans-serif"
    fontSize: "1.0625rem"
    fontWeight: 400
    lineHeight: 1.55
    fontFeature: "'lnum'"
  label:
    fontFamily: "'Atkinson Hyperlegible Next Variable', 'Atkinson Hyperlegible Next', system-ui, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 600
    lineHeight: 1.2
  time:
    fontFamily: "'Archivo Variable', 'Archivo', system-ui, sans-serif"
    fontSize: "1.15rem"
    fontWeight: 650
    lineHeight: 1.1
    letterSpacing: "0"
    fontFeature: "'tnum'"
    fontVariation: "'wdth' 106"
  marker:
    fontFamily: "'Archivo Variable', 'Archivo', system-ui, sans-serif"
    fontSize: "0.8rem"
    fontWeight: 750
    lineHeight: 1
    fontFeature: "'tnum'"
    fontVariation: "'wdth' 108"
  kanji:
    fontFamily: "'Zen Kaku Gothic New', 'Hiragino Kaku Gothic ProN', 'Yu Gothic', sans-serif"
    fontSize: "1.9rem"
    fontWeight: 900
    lineHeight: 1
rounded:
  sm: "4px"
  plate: "5px"
  md: "10px"
  lg: "12px"
  xl: "14px"
  dock: "18px"
  sheet: "20px"
  pill: "999px"
spacing:
  inset: "12px"
  panel-pad: "1rem"
  section: "1.6rem"
  row: "0.65rem"
  dock-width: "404px"
  touch: "44px"
components:
  panel-dock:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.text}"
    rounded: "{rounded.dock}"
    width: "404px"
    padding: "1rem"
  panel-sheet:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.text}"
    rounded: "{rounded.sheet}"
    padding: "0.35rem 1rem 0.7rem"
  nav-tab:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.text-2}"
    rounded: "{rounded.lg}"
    size: "40px"
  nav-tab-active:
    backgroundColor: "{colors.print-wash}"
    textColor: "{colors.print}"
    rounded: "{rounded.lg}"
    size: "40px"
  rail-cell:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.print}"
    rounded: "{rounded.pill}"
    width: "52px"
  chip:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.print}"
    rounded: "{rounded.pill}"
    padding: "0.5rem 0.9rem"
    height: "44px"
  chip-hover:
    backgroundColor: "{colors.print-wash}"
    textColor: "{colors.print}"
  chip-primary:
    backgroundColor: "{colors.field}"
    textColor: "{colors.on-field}"
    rounded: "{rounded.pill}"
    padding: "0.5rem 0.9rem"
    height: "44px"
  chip-primary-hover:
    backgroundColor: "{colors.field-deep}"
  play-button:
    backgroundColor: "{colors.field}"
    textColor: "{colors.on-field}"
    rounded: "{rounded.pill}"
    size: "46px"
  checkbox-checked:
    backgroundColor: "{colors.verm-fill}"
    textColor: "{colors.on-verm}"
    rounded: "{rounded.pill}"
    size: "22px"
  now-flag:
    backgroundColor: "{colors.verm-fill}"
    textColor: "{colors.on-verm}"
    rounded: "{rounded.pill}"
    padding: "0.12rem 0.5rem"
  base-card:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.text}"
    rounded: "{rounded.xl}"
    padding: "0.9rem 0.95rem"
  scrubber:
    backgroundColor: "{colors.paper-2}"
    textColor: "{colors.print}"
    rounded: "{rounded.xl}"
    padding: "0.8rem 0.9rem 1.5rem"
  station-sign:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.text}"
    rounded: "{rounded.md}"
    height: "56px"
  popup:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.text}"
    rounded: "{rounded.lg}"
    padding: "0.7rem 0.85rem"
  flight-caption:
    backgroundColor: "{colors.field}"
    textColor: "{colors.on-field}"
    rounded: "{rounded.pill}"
    padding: "0.45rem 0.5rem 0.45rem 1.1rem"
  stop-ring:
    backgroundColor: "{colors.map-ring}"
    textColor: "{colors.map-violet}"
    rounded: "{rounded.pill}"
    size: "22px"
  stop-ring-active:
    backgroundColor: "{colors.map-verm}"
    textColor: "{colors.map-ring}"
    rounded: "{rounded.pill}"
    size: "28px"
  base-ring:
    backgroundColor: "{colors.map-ring}"
    textColor: "{colors.map-violet}"
    typography: "{typography.marker}"
    rounded: "{rounded.pill}"
    height: "28px"
  bed-marker:
    backgroundColor: "{colors.map-violet}"
    textColor: "{colors.map-ring}"
    rounded: "{rounded.pill}"
    size: "28px"
  trip-stamp:
    backgroundColor: "{colors.map-ring}"
    textColor: "{colors.map-violet}"
    typography: "{typography.kanji}"
    rounded: "{rounded.pill}"
    size: "32px"
  todo-ring-book:
    backgroundColor: "{colors.map-ring}"
    textColor: "{colors.map-violet}"
    rounded: "{rounded.pill}"
    size: "28px"
---

# Design System: Japan Plan C

## Overview

**Creative North Star: "The Eki-Stamp Rally Card"**

The site is one printed rally card, the kind Japanese stations put out for collecting stamps, laid over a living map of Japan. The map is the page. It fills the screen, persists across every navigation and is never reloaded; pages only tell it which view to show, and the camera flies there. Over it sits a single sheet of cool white card stock, the panel, which carries the brand, the five sections, a live Now/Next line, the sixteen-stamp rail and then the page itself. Stamp-pad violet prints the frame: section rules, timetable rails, base rings, the route line, the station-sign band. Vermilion 朱 is ink, and it lands only where something is happening or has happened: now, the active stop, a stamped day, a booking still to make.

The type comes from station signage. Archivo is set very wide (`wdth` 125) and heavy for display, slightly wide with tabular figures for every time and every marker numeral. Atkinson Hyperlegible Next carries reading text so it stays legible at arm's length outdoors. Zen Kaku Gothic New 900 sets the kanji. The signature object is built from type alone: a circular kanji stamp with the place name on the upper rim and the day and date on the lower rim. On the map the same object returns as the day-trip stamp, and the card's ring marks return as the numbered stop rings.

The map is lit by the real sun at that place and minute. Its ground, water, roads, sky and hillshade light all derive from six lighting keyframes blended by solar altitude, so a Tokyo evening goes violet, rose and gold in the order it actually does. Density is practical: read with one thumb on a phone in the cold, so the card stays flat, rows are hairline-separated, and the only decoration is a stamp landing or a route inking in.

**Key Characteristics:**
- The map is the page: full-screen, persistent, every navigation a camera move.
- One card-stock panel over the map: a 404px left dock on desktop, a three-snap bottom sheet on phones.
- Two inks: violet prints the frame, vermilion marks now, active, stamped and to-book.
- State is carried by ring marks: solid means done or confirmed, open means still to do, dashed means ahead or unconfirmed.
- Stamps are type only, with no illustration or photography.
- Map light follows the real sun; map inks are picked from the ground's luminance so they always read.
- Expanded Archivo for display, times and marker numerals; Atkinson for reading; Zen Kaku 900 for kanji.

## Colors

A two-ink print palette on faintly violet-cool paper, plus a fixed set of map inks that stay constant while the sun repaints the ground beneath them.

### Primary
- **Stamp-Pad Violet** (`field` / `print`): the printed frame. As `field` it fills primary chips, the play button and the flyover caption pill. As `print` it sets section heads, rules, timetable dots and rails, due dates, links, the station-sign band and the current-day ring in the stamp rail. `field-deep` is the hover state for filled violet.
- **Violet Mid-Print** (`print-2`): category and fact icons, checkbox rings, and an ahead stamp in the day opener.
- **Map Violet** (`map-violet`): the same violet as a literal for MapLibre and DOM markers, which cannot read CSS custom properties. Route line on light ground, leg and day-trip lines, stop-ring strokes and numerals, base rings, bed discs, day-trip stamp ink, to-check ring strokes, to-do labels.

### Secondary
- **Vermilion Stamp Ink** (`verm`): stamped and today stamps, the Now flag dot, the overdue ring on the Now line, the active nav icon, the scrubber thumb ring, the focus outline, caret and accent colour.
- **Vermilion Text** (`verm-text`): vermilion at text contrast, for the current stop's start time, the popup time line, the scrubber phase readout, sunrise and sunset tick icons, and copy confirmations.
- **Vermilion Fill** (`verm-fill`, with `on-verm`): vermilion surfaces that carry text: the Now pill, the current timetable dot, ticked checkboxes, selection.
- **Vermilion Wash** (`verm-wash`): the brief highlight behind a stop row picked from the map, and a targeted booking row.
- **Map Vermilion** (`map-verm`): the active stop ring on the map (filled, white stroke, white numeral) and the stroke of every to-book ring and of any to-do cluster that holds one.

### Neutral
- **Card Stock** (`paper`, `paper-2`, `paper-3`): the panel and popups. `paper-2` is the scrubber well.
- **Violet Hairline** (`print-line`): every border and divider, including the panel-head rule, chip strokes, row separators, section-head rules, the unlit timetable rail and the sheet's grab handle.
- **Violet Wash** (`print-wash`): hover and active backgrounds for chips, nav tabs and station-sign sides.
- **Ink Text** (`text`, `text-2`): body and secondary text, both violet-tinted.
- **On-Field** (`on-field`, `on-field-2`): text on violet fields, and the Skip button inside the flyover pill.
- **Map Ring White** (`map-ring`): the fill of every stop ring, base ring, day-trip stamp and to-do ring in every light, the route casing by day, the name plates under base rings (at 94% opacity) and the bed disc's stroke.
- **Budget Bar** (`chart-bar`): the single data-viz hue for budget bars, `#7d72df` on dark.

The dark set (see sidecar) lowers paper to oklch 17.5% violet, raises `print` to a pale lavender (82%) and lightens vermilion (68%) while keeping its role. Dark mode reaches the panel only; the map follows the sun, not the theme.

### Map light
The map has no fixed palette. Six keyframes (NIGHT, TWILIGHT, DUSK, SUNSET, GOLDEN, DAY; the middle four in separate morning and evening tints) are blended by real solar altitude: night at or below -12°, night to twilight to -6°, twilight to dusk to -3°, dusk to sunset to 0°, sunset to golden to 4°, golden to day to 14°. DUSK and SUNSET exist so the passage from violet night to peach day stays saturated instead of passing through mud-grey. The sidecar holds the keyframe values.

### Named Rules
**The Two Inks Rule.** Violet prints the card and vermilion records events. Vermilion is reserved for now, active, stamped and to-book. If nothing is happening, has happened or is waiting on the group, it is not vermilion.

**The Violet Neutral Rule.** Every neutral, from paper to hairline to secondary text, carries the 282–285 violet hue. A hue-less grey is off-card.

**The Readable Ink Rule.** Route, label and halo inks are chosen from the blended ground's luminance (above 0.3 counts as light): violet route on a white halo by day, pale lavender (`#d8d0ff`) on a near-black halo by night. Stop rings never switch: white with violet numerals in every light, the card's own mark glowing at night.

## Typography

**Display Font:** Archivo Variable (fallback system-ui), on the `wdth` axis
**Body Font:** Atkinson Hyperlegible Next Variable (falling back to Zen Kaku Gothic New, then system-ui)
**Kanji Font:** Zen Kaku Gothic New 500/700/900, subset at build time to the characters the site uses

**Character:** Wide, heavy station-sign lettering for names, numbers and map markers, paired with a face built for legibility for everything that has to be read on the move.

### Hierarchy
- **Display** (850, `wdth` 125, line-height 0.95): day numbers in the opener (1.9rem), page titles (1.6rem), the countdown figure on the Now line (1.35rem) and the JAPAN C brand (1.15rem).
- **Headline** (800, `wdth` 118, 1.15rem in the panel): section heads in violet print, followed by a hairline that runs to the edge.
- **Title** (Atkinson 700, 1.04rem, 1.3): stop names in the timetable. Base names use Archivo 800 at `wdth` 112, about 1rem. Day titles use Atkinson 650 at 1.02rem.
- **Body** (Atkinson 400, 1.0625rem, 1.55, lining figures): reading text. Panel copy runs 0.94–0.96rem; long notes keep a 68ch measure where the panel allows.
- **Label** (600–650, 0.78–0.8125rem): ring marks, booking state, captions and legends.
- **Time** (Archivo 650, `wdth` 106, tabular figures): every clock time, date, due date, count and confirmation code (codes are 700 with 0.06em tracking). The scrubber clock is 1.4rem.
- **Marker** (Archivo 750, `wdth` 108, tabular figures): base-ring numerals and name plates on the map. Stop-ring and to-do numerals are drawn by the map renderer at 12px and 11.5px.
- **Kanji** (Zen Kaku Gothic New 900): stamp centres, rail stamps, station-sign kanji, day-trip stamps on the map (1rem) and city plates that replace base names when the map is 700px wide or less. Phrase cards use 700.

### Named Rules
**The Tabular Time Rule.** Any figure the group compares or acts on (times, dates, deadlines, codes, counts, ring numerals) is set in the time voice with tabular figures.

**The Wide Display Rule.** Display Archivo is always expanded (`wdth` 106–125). Archivo at normal width is not part of the system.

## Layout

The map is the page. A fixed full-screen stage holds the map and persists across navigation; only the panel's body swaps, with an 0.18s cross-fade. While the map loads, the stage shows a violet night gradient, never a blank. The panel is the only content surface.

**Desktop (900px and up).** The panel docks left at a 12px inset on top, bottom and left: 404px wide, full height, 18px corners. The map's camera padding starts 24px past the panel's right edge (72px on the right for controls, 24px top and bottom), so every camera move centres in the open map. Map attribution moves to clear the dock (left 436px). Floating captions and the preview note centre on the open map, offset by half the dock (214px).

**Phone (under 900px).** The panel is a bottom sheet with 20px top corners and three snaps: peek (the head plus 10px: grab handle, brand and nav, Now/Next line, one-row rail), half (52% of the viewport) and full (viewport minus 52px). It drags from the head and snaps to the nearest height, or one step further after a fast fling. Each view opens at its own snap: overview at peek, day and bookings at half, plain pages at full. Camera padding follows the sheet: bottom equals the sheet's height plus 12px, with 24px left and 56px right. Tapping a stop row's map control drops a full sheet to half; a stop picked on the map raises a peeked sheet to half.

**The panel head** is fixed and never scrolls: brand row (JAPAN C plus 八人の旅, then five 40px icon tabs), the Now/Next line, then the stamp rail. The rail is an 8×2 grid on desktop and a single scroll-snapping row of 52px cells on phones. A 1.5px hairline separates the head from the scrolling body. **The panel body** scrolls on its own with 1rem side padding; section heads sit 1.6rem apart. Lists are flat rows divided by hairlines rather than cards.

Day pages keep one order inside the panel: opener (76px stamp beside the day number and title), facts line, station sign, scrubber, briefing, night-before check, timetable, closing station sign. The timetable is a rail: a 30px column of numbered dots on a 3px line, the time above the stop.

**Camera.** Views fly over 2.2s (curve 1.5). Overview frames the whole route top-down to a maximum zoom of 7.4. Day views frame the day's stops at pitch 48 and bearing -14 to a maximum zoom of 14.6, keeping that night's bed in frame when it belongs to the day's area. Over Hakone on MapLibre the pitch drops to 44 so no ridge hides a stop. A day that crosses Japan frames where the day is spent (the stop cluster with the most scheduled minutes) rather than shrinking to two dots. Bookings frames every to-do ring top-down. Focusing a stop flies to zoom 16, pitch 64. Reduced motion jumps instead of flying.

Touch targets are at least 44px, with 40px allowed for nav tabs and secondary actions inside rows. Map controls are 40px.

## Elevation & Depth

Three layers, in a fixed order. The map is the ground. Objects that float over the map (the panel, map controls, popups, markers, the flyover pill, the preview note) lift with soft, dark shadows sized to their distance. Content on the card is flat: rows, timetable, bases and stamps are separated by hairlines and print, never by shadow. The one exception is the station sign, a physical board object that lifts slightly off the card.

### Shadow Vocabulary
- **Dock** (`box-shadow: 0 1px 2px oklch(0% 0 0 / 0.12), 0 18px 48px -16px oklch(0% 0 0 / 0.5)`): the desktop panel.
- **Sheet** (`box-shadow: 0 -1px 0 oklch(0% 0 0 / 0.06), 0 -12px 36px -12px oklch(0% 0 0 / 0.45)`): the phone panel, cast upward.
- **Map control** (`box-shadow: 0 1px 2px oklch(0% 0 0 / 0.18), 0 8px 22px -8px oklch(0% 0 0 / 0.45)`): the zoom, compass and locate groups.
- **Popup** (`box-shadow: 0 1px 2px oklch(0% 0 0 / 0.2), 0 10px 28px -8px oklch(0% 0 0 / 0.45)`): stop popups.
- **Marker** (`box-shadow: 0 2px 6px oklch(0% 0 0 / 0.25)`, 0.18–0.3 by object): base rings, name plates, beds and day-trip stamps.
- **Caption pill** (`box-shadow: 0 10px 30px -10px oklch(0% 0 0 / 0.6)`): the flyover caption.
- **Lifted object** (`box-shadow: 0 1px 2px oklch(0% 0 0 / 0.07), 0 6px 18px -6px oklch(18% 0.015 282 / 0.2)`; dark: `0 1px 2px oklch(0% 0 0 / 0.3), 0 8px 24px -8px oklch(0% 0 0 / 0.5)`): the preview note.
- **Station sign** (`box-shadow: 0 1px 2px oklch(0% 0 0 / 0.14), 0 10px 24px -12px oklch(0% 0 0 / 0.4)`): the sign on the card.

### Named Rules
**The Flat Card Rule.** Content on the card is never shadowed. Only objects that sit above it, over the map, may lift; the station sign is the single on-card exception.

**The Persistent Stage Rule.** The map never reloads, never moves for a panel swap and never sits inside a frame. Navigation changes the panel and flies the camera.

## Shapes

The language is circles and rings. Stamps, rail cells, timetable dots, stop rings, base rings, bed discs, day-trip stamps, to-do rings, checkboxes, the play button, copy buttons, state marks and the Now-flag dot are all circles, and their stroke weight carries meaning. Rings that hold a merged label ("1·5–7") stretch into a pill, never a box. Interactive pills (chips, the Now pill, the flyover caption and its Skip button) are fully rounded (999px).

Containers soften with size: 20px for the phone sheet's top corners, 18px for the desktop dock, 14px for base cards and the scrubber well, 12px for nav tabs, map control groups and popups, 10px for the station sign, 5px for the name plates under base rings, 4px for small badges and the focus outline. Borders are 1.5px violet hairlines on containers and 1px between rows. Ring marks use 2–2.5px strokes; map stop rings 2.6px, to-do rings 3px, the stamped outer ring 3.6px. The grab handle is a 44×5px bar with 3px corners.

**The Ring Mark Rule.** Solid fill means done or confirmed. An open ring means still to do. A dashed ring means ahead or unconfirmed. Colour may reinforce the mark but never replaces it.

## Components

### Panel
The card stock over the map. Paper ground, no border; lifted by the Dock or Sheet shadow. The head (brand row, Now/Next, rail) is fixed; the body scrolls with contained overscroll. The sheet's grab handle is a button that cycles peek, half and full. The sheet's height eases over 0.34s on the out-expo curve; dragging moves it 1:1.

### Navigation
Five 40px icon tabs with 12px corners in the brand row: Trip (the custom double-ring stamp glyph), Today, Bookings, Budget, Info. Labels are visually hidden and exposed as the accessible name and tooltip. Default icons are `text-2`; hover and the current tab get a `print-wash` ground and violet print, and the current tab's icon turns vermilion. Icons are Lucide at 1.9 stroke, 20px.

### Now / Next Line
Two lines under the brand row, in 0.9rem and 0.84rem. During the trip, a vermilion flag dot with an offset outline ring marks Now, and Next follows in `text-2`, each led by a time in the time voice. Before the trip, a display-weight countdown figure leads the line, and overdue bookings are counted beside an open vermilion ring. Lines truncate with an ellipsis rather than wrap.

### Stamp Rail
The sixteen days as small station stamps with the rim lettering hidden and the kanji enlarged to fill the ring. The current day's cell carries a violet ring outside a 2px paper gap. Stamps follow their state: dashed violet ahead, solid vermilion today and stamped. Tapping a stamp swaps the panel to that day and flies the camera.

### Buttons and Chips
Pill-shaped and confident, in the card's print vocabulary.
- **Shape:** fully rounded (999px), 1.5px `print-line` stroke, at least 44px tall (38–40px inside rows; see Do's and Don'ts).
- **Default chip:** paper ground with violet print text at 650 weight, with an optional 16px Lucide icon in front.
- **Primary chip:** a filled violet field with on-field text ("On the map"). Hover deepens it to `field-deep`.
- **Hover / Focus:** hover fills with `print-wash` and darkens the stroke to `print-2` over 0.2s on the out-expo ease. Focus is the global 2.5px vermilion outline with a 3px offset.
- **Round icon buttons:** copy buttons are paper circles with a hairline ring that swap to a vermilion check when confirmed. The play button is a 46px filled violet circle.

### Ring Marks and Booking State
- **Style:** an inline 0.8em circle with a 2px stroke before an 0.8125rem / 600 label. Confirmed fills the ring, to-book turns the label `verm-text`, and unconfirmed or to-check dashes the ring.
- **Booking state:** open `print-line` ring by default, `print` ring when soon, a vermilion ring with full-contrast text when overdue, and a solid violet ring when done.

### Inputs / Fields
- **Checkboxes:** a 22–24px open ring (2px `print-2`) on paper. When ticked, it fills with `verm-fill` and an inner `on-verm` dot scales in over 0.18s. The ticked item's text drops to `text-2` with a vermilion strikethrough.
- **Scrubber:** inside a 14px `paper-2` well with a hairline border, a 46px play button, a 1.4rem clock, a vermilion phase readout and the active stop name. The 10px pill track is painted with the day's real sky gradient; a 24px paper thumb is ringed 3px in vermilion; sunrise and sunset ticks sit below in the time voice.

### Cards / Containers
- **Base card:** 14px corners, paper, 1.5px `print-line` border, 0.9rem 0.95rem padding, flat. A 2.2rem violet-ringed base number beside an Archivo 800 name.
- **Popup:** 12px corners on paper with the Popup shadow. A vermilion time line in the time voice, an Atkinson 650 stop name, then Details and Google Maps links in violet. Several stops at one ring stack with hairlines between.

### Station Stamp (signature)
A 120-unit SVG built from type alone. The kanji (Zen Kaku 900) sits in the centre, the place name runs along the upper rim and DAY nn · MM.DD WKD along the lower rim, both in Archivo 700 at `wdth` 112.
- **Ahead:** a violet dashed outer ring with lettering at 75–85% opacity.
- **Today:** vermilion, a solid 3.6px outer ring, the inner ring visible, full opacity.
- **Stamped:** vermilion with a 10% ink wash inside the double ring, rotated to a fixed per-day tilt (between -9° and 8°).
- **Press:** the first time a day is seen as done, the stamp drops in from 1.45× scale with 3px blur and 10° extra rotation, overshoots to 0.94 and settles (0.62s, out-expo).
- **Small stamps** under 480px hide the rim lettering and grow the kanji.

### Station Sign (駅名標)
The prev / current / next day board, drawn like a JR station name board, at the top and bottom of every day. Three columns on paper with a 10px corner and a 6px violet line-colour band along the bottom. The current day is a large kanji over a small violet D-number badge, set between 1.5px hairlines. The sides show kanji, the day number in Archivo and the place name, which is hidden under 420px. Sides are at least 56px tall and take `print-wash` on hover.

### Map: Route and Stop Rings
- **Route:** a white casing (6–11px by zoom, 90% opacity) under a violet line (3–6px). At night the casing becomes a near-black halo and the line pale lavender (The Readable Ink Rule). Overview legs between bases are solid 3.2px; day-trip legs are dashed 2.2px.
- **Ink-in:** on arriving at a day, the route waits blank while the camera travels, then inks from first stop to last over 1.6s (ease-out cubic). A newer day supersedes an unfinished ink; leaving mid-ink leaves no half-drawn line. Reduced motion draws it at once.
- **Stop rings:** white circles (11px radius, 14px when active, plus 4–7px for longer labels) with a 2.6px violet stroke and a 12px violet numeral, flat to the viewport at any pitch. The active stop fills vermilion with a white stroke and numeral.
- **Regrouping:** stops within 150m share a ring ("4·5"). Beyond that, rings that would touch on screen at the current zoom merge into one ("4·5", "6–9", "1·5–7"; runs of three or more collapse to a range) and split again as you zoom in. The route is redrawn through the ring anchors so lines always meet their rings.
- **Basemap yield:** invisible collision blockers sit under every marker, so the basemap's own labels give way wherever a ring, stamp or plate stands.

### Map: Bases, Beds and Day-Trip Stamps
- **Base ring:** a 28px white ring with a 2.5px violet stroke and an Archivo 750 numeral, beside a white name plate (5px corners, 94% opacity). When the map is 700px wide or less, the name plate becomes a Zen Kaku 900 city kanji plate. Two same-city bases on the same pixels merge into one "1·4" ring.
- **Bed:** on day maps the base number is replaced by a 28px violet disc with a white 2.5px stroke and a 15px bed icon, so a base never reads as a stop. Only that night's bed and the previous night's bed appear.
- **Day-trip stamp:** a 32px white disc with a 2px dashed violet ring and that day's kanji in Zen Kaku 900, the card's ahead stamp in miniature. Shown on the overview only.
- **Precedence:** rings place first, then day-trip stamps, then base name labels. A stamp that overlaps its base's ring steps out along its own bearing, fanning ±40° and ±80° to find a free spot; if none is free it hides. A name label that collides with anything placed hides.

### Map: Bookings To-Do Rings
The bookings view clears bases and stamps and gives the map to what is still undone. Each stop to book or check is a white 14px ring with a 3px stroke: vermilion for to book, violet for to check. Labels are the day ("D7") in 11.5px violet. Nearby rings cluster into one 15px "×3" ring, vermilion if any member is to book; tapping a cluster zooms to its expansion over 0.9s.

### Map: Light, Terrain and Engine
- **Light:** the real sun at that place and minute picks the palette (see Map light). The hillshade's illumination comes from the sun's azimuth; the 3D light's position from its azimuth and altitude. Paint changes apply instantly: the style's transition is zero, because the clock and scrubber step the light and a tween would freeze in terrain's cached textures. Sky atmosphere is visible only below zoom 5; from the country view inward it would wash out every ink.
- **Terrain (MapLibre):** 3D terrain at 1.1× on the overview and 1.25× on Hakone days only. City days drop terrain, because a draped route breaks into dashes on flat streets, and keep a faint hillshade at 0.15. Elsewhere hillshade strengthens with zoom (0.4 at z5, 0.6 at z9, 0.8 at z12).
- **Flyover:** before the trip, once per session, the camera flies seven frames from Haneda to Shinjuku (3.4s each, curve 1.6, pitch 58–70, then a 1.6s hold). Each frame shows only its days' lines and small stop dots, with no numbered rings, lit at the planned moment of that visit. A violet caption pill names the frame and carries a Skip button. Reduced motion and `?noflight` skip it.
- **Engine:** MapLibre over OpenFreeMap with the custom style is the shipped path. Mapbox Standard is a supported but untested branch, used when `PUBLIC_MAPBOX_TOKEN` is set: same layers and markers, plus emissive glow, a violet line gradient (`#5b4fd6` to `#2a2170`) and terrain at 1.1×.

## Do's and Don'ts

### Do:
- **Do** keep the map full-screen and persistent; change the panel and fly the camera, never reload or frame the map.
- **Do** print structure in violet (`field` for slabs, `print` for type and rules, `print-line` for hairlines) and keep every neutral on the 282–285 hue.
- **Do** reserve vermilion for now, active, stamped and to-book, on the card and on the map alike.
- **Do** draw state as a ring mark (solid / open / dashed) so it reads without colour.
- **Do** derive any new map colour from the sunlight keyframes, and pick map inks from ground luminance, never from a fixed theme.
- **Do** keep stop rings white with violet numerals in every light.
- **Do** merge rings by on-screen overlap and redraw the route through the merged anchors.
- **Do** keep camera padding equal to the part of the screen the panel covers, so every move centres in the open map.
- **Do** set every time, date, deadline, code and ring numeral in expanded Archivo with tabular figures.
- **Do** keep touch targets at least 44px (40px for nav tabs and inside rows) and honour reduced motion, which disables the press, the flyover, camera flights, ink-in and view transitions.

### Don't:
- **Don't** use vermilion for decoration, section accents, list bullets or static emphasis.
- **Don't** add illustration, photography or icon art to a stamp. Stamps are type only.
- **Don't** shadow content sitting on the card. Lift only objects that float over the map.
- **Don't** let a base read as a stop on a day map: show its bed, and only that night's and the previous night's.
- **Don't** drape terrain under city-day routes on MapLibre; use the faint hillshade instead.
- **Don't** add paint transitions or atmosphere at country zoom and closer.
- **Don't** set Archivo at normal width or use a system display face for display text.
- **Don't** show state by hue alone.


## Transit, trending and quick adds (map-first, round 2)

- **Transit layer** (`public/transit.json`, OSM): every rail line in the trip's regions in its official
  colour, with a soft glow that strengthens at night, white casings by day, stations from z12 and labels
  from z13. Shinkansen show from the country view; other lines fade in towards city zoom. Marching
  white dashes animate the flow (off for reduced motion). On a day page the lines that day rides are
  1.8× wider and flowing while the rest of the network drops to 30% opacity; chips under *Trains in
  today's plan* use each line's colour as a swatch. The basemap's own rail hairlines are hidden while the
  layer is on; the train button in the map controls toggles it.
- **Trending nearby**: 34px circular photo pins (white ring, violet hairline, a small violet ↗ badge when
  rising), a 168px photo-card strip in the panel, and a photo card popup anchored above its pin. Tags read
  Rising / Big in December / Popular. Photos credit Wikimedia Commons.
- **Quick adds**: a dashed rail and a + dot in the timetable after the nearest stop, a dashed violet spur
  and white ring on the map. Saved per phone; *Share adds* exports a plain list.
- **Orbit**: a control that tilts to 60° and circles the open map's centre at about 8°/s until touched.
