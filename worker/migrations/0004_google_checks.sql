-- The trip's morning check of Google Maps' hours (worker/index.ts runGoogle): which stops were already
-- asked about on a Japan date, so the checks spread over several cron runs and each stop costs one
-- Google call a day. `news` is what the check found ('gone', 'closed', 'closes'), or null for fine.
CREATE TABLE gchecks (
  day TEXT NOT NULL,           -- Japan date of the check, 2026-12-20
  stop TEXT NOT NULL,          -- stop id, d06-s03
  news TEXT,
  at INTEGER NOT NULL,         -- ms since epoch
  PRIMARY KEY (day, stop)
);
