-- Answers from Google (worker/index.ts /api/nearby and /api/ask) kept for a few minutes, so the same
-- question from the same block isn't paid for twice. Cloudflare's own cache does nothing on a workers.dev
-- address, so it lives here: one row read per search, old rows cleared as new ones are written.
CREATE TABLE gcache (
  k TEXT PRIMARY KEY,          -- the request, normalised: "nearby|ramen|35.694|139.705|1"
  body TEXT NOT NULL,          -- the JSON answer as sent to the phone
  at INTEGER NOT NULL          -- ms since epoch
);
