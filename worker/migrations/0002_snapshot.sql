-- The current state (every change folded in order, src/lib/live.ts) kept in one row, so a phone's check
-- and the cron run read one row instead of the whole history (D1's free plan: 5M rows read a day).
-- `v` is the last change folded in; the Worker brings it up to date after every save and every cron run.
CREATE TABLE snapshot (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  v INTEGER NOT NULL,
  state TEXT NOT NULL
);
INSERT INTO snapshot (id, v, state) VALUES (1, 0, '{"v":0,"items":{},"log":[]}');
