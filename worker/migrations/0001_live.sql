-- The live layer's tables (D1). Changes are append-only: the current plan is every change folded in
-- order (src/lib/live.ts fold), so the history doubles as the "what changed" list.
CREATE TABLE changes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  kind TEXT NOT NULL,          -- stop | todo | day
  target TEXT NOT NULL,        -- stop id (d03-s10), to-do id, or day number
  patch TEXT NOT NULL,         -- JSON; null clears a field back to the plan
  author TEXT NOT NULL,
  device TEXT,
  at INTEGER NOT NULL          -- ms since epoch
);

-- One row per phone with alerts on.
CREATE TABLE subs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  device TEXT,
  name TEXT,
  tz TEXT,                     -- IANA zone, for 9am deadline reminders before the trip
  prefs TEXT NOT NULL,         -- JSON {leave, last, due, changes}
  at INTEGER NOT NULL
);

-- Alerts already sent, by "<alert key>|<sub id>", so each goes out once.
CREATE TABLE sent (
  key TEXT PRIMARY KEY,
  at INTEGER NOT NULL
);
CREATE INDEX sent_at ON sent (at);
