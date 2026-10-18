# Itinerary agent: design

## Intent

Saved reels and TikToks never get researched, so the good finds never make the trip. The agent is
the competent friend or concierge who does the research and hands back a plan you trust: from a
plain-language brief ("Tokyo 15–19 Dec, Hakone 19–21, Osaka 21–26, Tokyo 26–29", plus anything said
about the group), it reads what people post (TikTok, Instagram Reels, Lemon8, Xiaohongshu, Reddit,
X, YouTube), what Japanese locals rate (Japanese-language posts and Google reviews, Tabelog read-only)
and the web, then makes the calls and writes a day-by-day, hour-by-hour guidebook into this site.
For now it serves one person and runs on their Mac.

## Goals

- Every explicit wish in the brief is honoured and traceable to where it landed.
- Every stop is real, open that day at that hour, and reachable in the time allowed.
- Each stop is a guidebook spread: photo or the original video, the story, how to do it, tips,
  cost, booking needs, and where the recommendation came from.
- Rich but skimmable: written to be read on a train.
- Runs with whatever keys exist; each source switches on when its key is added.

## Non-goals and anti-goals

- No booking or paying (it lists what to book, by when). No accounts or hosting yet.
- Never invented places, closures, prices or hours: nothing goes in without a source.
- Never republishes Tabelog scores, reviews or photos (its terms forbid it); links out instead.
- Never a wall of raw notes.

## Decisions made by the owner

- Guidebook style (everything visible per stop) on this site's day pages, over the map.
- The agent decides; the owner edits afterwards in plain words. It does not stop to ask.
- Runs from the Mac. Spend is not a constraint, but optimise.
- Sources: TikHub (TikTok, Instagram incl. by-location, Lemon8, Xiaohongshu, Reddit, Threads),
  Grok 4.7 X Search, Perplexity Search API, SerpApi (Google JP + all Maps reviews), Google Places
  (official), Hot Pepper, Gemini 3.8 Flash for watching videos, Claude Opus 5.5 as the planner.

## Builder's calls

- Claude API Tool Runner (TypeScript SDK) rather than the Agent SDK: mostly code-controlled stages
  with one open-ended research stage. Opus 5.5 throughout; server-side refusal fallback on.
- Stages: brief → research per city (parallel) → resolve and verify places (code) → plan the days
  (structured output) → write each day's spreads (parallel) → deterministic checks + repair pass.
- Every external call is cached on disk; re-runs are cheap and resumable.
- Fixed anchors (stays with confirmation codes) come from the current TREK export and never move.
- Output is `data/itinerary.json`; when present the site builds from it instead of the TREK export,
  so the map, routes, search and bookings follow the agent's plan.
- Photos: the original TikTok/Instagram/YouTube embedded (click to load), else Wikimedia or the
  venue's og:image. Google Places photos are not stored (their terms forbid caching).
