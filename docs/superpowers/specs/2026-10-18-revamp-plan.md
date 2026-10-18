# Japan trip agent + site: the revamp

## Why

- **Making it is slow and costs API money:** a Hakone run takes about 25 min (batch waits) and $1.19 of Anthropic credit. A full trip would cost about $10–14.
- **The plan has quality problems:** the AI decides both *what* and *when*, then code asks for repairs. Routing and timing mistakes survive that loop (taxi ping-pong, a 1-minute train connection). Year-end closures (around Dec 28 onward) aren't looked for.
- **The site is hard to scan:** too much to read, everything open at once.
- **The site is heavy and clunky on a phone:** 1.8 MB of map code loads before anything else. The intro walkthrough is hard-coded to the old TREK trip (Kyoto, Miyajima, wrong day numbers), jumps back and forth in time, and flips day/night as it lands.

**Your idea, and the core of this plan:** run the thinking inside Claude Code on your subscription, not the API. A local tool server (MCP) gives the session every data source and check. Anthropic API cost drops to $0; only the data APIs (TikHub, Perplexity, SerpApi, Google, NAVITIME) are still billed.

Research behind it:
- **[HiMAP-Travel](https://proceedings.mlr.press/v306/bui26b.html) (ICML 2026):** a coordinator plus days planned in parallel is more accurate and about 2.5× faster.
- **[Embark Now](https://arxiv.org/pdf/2607.10651):** the AI handles your preferences while a route-optimisation algorithm builds the schedule, beating AI-only planners.
- **[TravelPlanner](https://arxiv.org/abs/2404.11891):** AI plus code verification reaches about 97% on hard constraints; AI alone gets under 1%.

## 0. Stack and costs: what runs on the session, what stays paid

The rule: the session does the thinking and the searching. Paid APIs stay only where nothing free gets the same data, and each has a cap per run.

| Job | Before | After | Cost per full trip |
|---|---|---|---|
| Thinking: research, planning, writing, checking | Anthropic API (~$10–14) | **This session**: Opus for research/planning/writing, Haiku helper agents for fact reading | **$0** (plan usage) |
| Web search | Perplexity ($5 per 1,000) | **Session WebSearch + WebFetch**; Perplexity off by default | **$0** |
| X / Twitter (queues, closures, sold-out) | Grok x_search (now billed per post, ~$0.10 a search) | **Yahoo! Japan realtime search** (free, public, Japanese locals' posts); Grok optional for English X | **$0** |
| TikTok, Instagram, Xiaohongshu, Lemon8, Threads, Reddit, YouTube | TikHub | TikHub (no free equivalent without logging in as you) | ~$0.50–1 ($0.001/request) |
| Google Japan results + Maps reviews | SerpApi | SerpApi, **capped at ~100 a run** | $0 (free 250/month) |
| Place lookup, hours | Google Places (New) | Same, cached | $0 (per-SKU free tier, ~5k/month) |
| Walking/driving times | Google Routes | Same, cached | $0 (free tier, ~10k/month) |
| Train/bus timetables | NAVITIME (RapidAPI) | Same; `travel_matrix` reuses cached legs | $0 (500/month free) |
| Watching reels/videos | Gemini 3.8 Flash | Same | $0 (free tier) |
| Official pages, quote checks | own fetch | Same | $0 |

**Expected outside spend for the whole trip: about $1 (TikHub), versus $10–15 before.** A per-run spend log prints each paid API's calls, and hard caps stop runaway loops.

Not used, on purpose:
- **Driving your logged-in Chrome to browse TikTok or Instagram for free:** slow, and it risks flagging your accounts. TikHub costs cents.
- **The Batch API:** no longer needed.

Helper agents are defined in `.claude/agents/`, each pinned to a model and given only the tools it needs:
- `trip-researcher` (Opus): trip-tools, WebSearch, WebFetch.
- `trip-fact-reader` (Haiku): `fact_sources` and `save_facts`.
- `trip-day-planner` (Opus): `travel_matrix`, `solve_day`, `check_plan`.
- `trip-writer` (Opus): `audit_day`.
- `trip-checker` (Sonnet): WebSearch, WebFetch, `verify_citation`.

MCP: the official `@modelcontextprotocol/sdk` (TypeScript, stdio), pinned to a release at least two weeks old.

## 1. `trip-tools` MCP server (the agent's hands, inside the session)

- **`planner/mcp.ts`:** an MCP server registered in `.mcp.json`, so this session and its helper agents get the tools.
- **Research:**
  - social_search, posts_at_place, google_japan, maps_reviews, watch_video and find_place (from `planner/sources.ts`).
  - A new free `x_japan` (Yahoo! Japan realtime search).
  - Web searching uses the session's own WebSearch and WebFetch.
- **Facts:**
  - `fact_sources(place, urls)` returns page text. The helper agent finds the official URLs with WebSearch, so Perplexity isn't needed.
  - `save_facts(place, sheet)` runs the code quote-check and reports what it drops.
  - The helper agent reading the pages fills in the sheet, so no Haiku API calls are needed.
- **Routing:** `travel(a, b, depart)`, plus a new cached `travel_matrix(places, depart)`.
- **Checks:**
  - `check_plan` and `audit_day` move into a shared `planner/core.ts`.
  - `verify_citation(url, quote)` fetches the page and confirms the quote is on it.
- **State:** save/list candidates, skeleton, days, guides, and status. `publish` writes `data/itinerary.json` and rebuilds the site data.
- **The API pipeline (`npm run plan`) stays** as a fallback and shares `core.ts`.

## 2. `/trip` skill (how the session plans: hierarchical and parallel)

1. **Brief:** wishes and legs.
2. **Research:** parallel helper agents, one per city × theme, on session usage. Cached research is reused.
3. **Facts:** parallel helper agents on a cheaper model fill the fact sheets. The sheets gain **year-end hours (年末年始)** and **group/booking rules**.
4. **Skeleton:** one pass sets each day's area, anchors, pace and taxi budget, plus the trip-wide luggage and pass plan.
5. **Days:** parallel, one per day. The AI picks *what* and how much it matters; **the solver decides when and in what order**.
6. **Write:** short spreads, then the number audit. Anything unbacked gets fixed or cut.
7. **Fact-check:** a correction applies only if `verify_citation` proves its quote and it doesn't overrule measured data.
8. **Publish:** itinerary, then the site build.

## 3. Day solver: correct by construction (`planner/solver.ts`)

- **Input:** start and end, candidates (priority, visit length, hours on that date, fixed times, meal type), and the travel matrix.
- **Method:** insertion + local search, maximising priority and penalising taxi yen and backtracking.
- **Hard rules:**
  - opening hours, last entry, time limits;
  - travel time plus a group buffer (+10 min off trains);
  - meals in windows and at least 2.5 h apart;
  - no overlap;
  - the daily taxi cap.
- **Output:** a timetable that already passes the checks, plus what didn't fit and why. Unit tested.

## 4. Site: glance first, fast, and an intro that works

- **Each stop:** time, name, a **one-line hook**, and chips (price · book · cash · next train). One tap shows the story, how-to, tips, checked facts and video.
- **Day briefing:** at most 3 lines.
- **A "Now / Next" card** on the day you're in it.
- **Shorter writing:** a hook of ≤ 120 characters, a story of 2–3 sentences, the top 3 tips.
- **Speed:**
  - Text renders first and the map loads after.
  - The lighter MapLibre map is the default on phones; Mapbox 3D is opt-in.
  - Target: mobile LCP under 2.5 s and under 300 KB of JavaScript before the map.
- **Intro:**
  - Built from your itinerary: one stop per base, in date order.
  - One light for the whole flight, so no day/night flips.
  - About 8 s, plays once, skippable, and off with reduced motion.

## 5. Order

1. `core.ts` refactor (tests stay green).
2. The solver and its tests.
3. The MCP server, with every tool smoke-tested.
4. Run `/trip` on Hakone and benchmark it against the current preview.
5. The site: the day page, lazy map, intro and a Lighthouse pass, then a look on the phone.
6. The full trip.

## Done means

- `npm test` and `astro check` pass, with solver, citation and year-end tests.
- Hakone via `/trip`:
  - 0 plan-check problems and 0 unbacked numbers;
  - every correction proven by its citation;
  - fewer judge-found errors than today's 13;
  - **$0 of Anthropic API spend**.
- Lighthouse mobile before/after numbers; the intro shows no light flips; day pages scan at 375 px.

## Notes

- A full-trip run uses a big chunk of your plan's usage limit; research is the bulk.
- NAVITIME's 500 free requests a month is tight, so routes are cached and reused.
- The temporary public link stays up until you say you're done.
