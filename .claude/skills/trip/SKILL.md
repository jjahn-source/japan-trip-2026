---
name: trip
description: Plan, edit or extend the Japan trip itinerary inside this Claude Code session (no Anthropic API spend). Researches with helper agents, verifies facts against official pages, schedules each day with the solver against real travel times, writes short guidebook spreads, fact-checks with proven citations, and publishes to the site. Use for "/trip", "/trip Hakone", "/trip edit …", "/trip add <url>".
---
# /trip: plan the trip in this session

All the work runs here, on the subscription. The only outside spend is TikHub (about $0.001 a call); every other data source is free or within a free tier.

**Tools:** the `trip-tools` MCP server (`mcp__trip-tools__*`), or the same tools from the shell: `node planner/tools.ts <tool> '<json>'` in /Users/jjahn/japan-trip. Run `node planner/tools.ts list` for the list.

**Helper roles:** the files in `.claude/agents/`:
- `trip-researcher` (Opus)
- `trip-fact-reader` (Haiku)
- `trip-day-planner` (Opus)
- `trip-writer` (Opus)
- `trip-checker` (Sonnet)

If those agent types aren't available in this session, spawn `general-purpose` agents with the `model` named in the role file. Pass the role file's text, then the task.

Run every independent piece in parallel, in one message, in the background.

## Arguments
- `/trip`: the whole brief in `planner/brief.md`.
- `/trip <City>`: a one-city preview, published as `data/research/preview-<city>.json`. The live itinerary stays untouched.
- `/trip edit <what>`: change only what's affected: re-plan the affected days (step 6), then steps 8–11 for those days.
- `/trip add <url> [note]`: watch or read it (`watch_video` / WebFetch), add it as a candidate if it's worth it, then treat it as an edit.

## Steps
1. **Status.** `status`. Pick up where the session left off. Never redo a finished step unless the brief changed.
2. **Brief.** Read `planner/brief.md` and extract the brief faithfully: title, people, who, legs (city, from, to, base), arrival, departure, wishes (every concrete wish in their own words, w1…), pace. Save it with `save_brief`. For a city preview, keep only that city's legs.
3. **Research.** Earlier research for a city is reused automatically by `resolve`, so research only cities with none.
   - Spawn one `trip-researcher` per city × theme. Use 5 themes (food, night, sights, shop, only) for stays over 2 nights, else 3 merged themes (food-night, sights-shop, only). The `only` theme (dated one-offs and the brief's set pieces) is never skipped. `prompt {"role":"themes"}` has the theme briefs.
   - Each researcher's prompt includes the brief JSON, the city and dates, the theme, and what the other researchers cover.
3b. **Plan C.** If the group has a plan of their own (`data/japan-plan-c.md`), `node planner/seed-plan-c.ts` adds its stops as candidates (raw/<city>-planc.json) so they are verified and kept where they survive.
4. **Resolve.** `resolve`. This merges, finds and verifies the places, and adds photos.
5. **Facts.**
   - `list_candidates {"missing_facts": true}`, split into batches of about 10, one `trip-fact-reader` per batch.
   - After they finish, check `status`.
   - Places a reader skipped get a second pass.
6. **Skeleton (you).**
   - `context` for the whole trip.
   - Decide each day's city, area and theme, its start and end (stay, check-in and check-out times, inter-city trains) and its anchors.
   - Spread the wishes across days and keep each day in one area.
   - Respect closures (year-end, regular days off).
   - Decide the trip-wide logistics once: where the luggage is each day, which passes and what they cover, the tax-free rules.
   - Save with `save_skeleton`.
7. **Days.**
   - One `trip-day-planner` per day, or per pair of adjacent days in the same city.
   - When all are saved, read every day once for the whole-trip view: no repeats, variety, wishes covered, energy. Re-plan any weak day.
8. **Extras (you).** `save_extras` with:
   - to-dos for every booking: what, how (online, phone, set menu for 7+), and the due date;
   - budget rows (group and per person);
   - coverage for every wish.
9. **Write.** One `trip-writer` per day or pair of days.
10. **Check.** One `trip-checker` per day or pair of days.
11. **Publish.** `publish` (for a preview: `{"preview": "<city>"}`). Report any warning.
12. **Site.**
   - Full trip: `npm run transit && npm run legs && npm run places`, then `npm run build`.
   - Preview: `TRIP_FILE=data/research/preview-<city>.json npx astro build --outDir dist-<city>`, with `PUBLIC_RAPIDAPI_KEY=` empty for anything shared.
13. **Report.** Days, stops, problems fixed, corrections applied, any warnings, the outside API calls made, and how long it took.

## Rules
- Never book, pay, or post anything.
- Tabelog is read-only: cite it, never copy its scores, reviews or photos.
- Hard facts only from verified facts, measured routes or cited sources. When something can't be verified, the guide says to check it.
- Keep it glanceable: one-line hooks, at most 3 tips, at most 3 day notes.
