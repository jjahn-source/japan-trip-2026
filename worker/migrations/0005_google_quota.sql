-- The open-now search (worker/index.ts /api/nearby) asks Google Places for each search: counted per Japan
-- date so the link, which is public, can never spend more than a set number of Google calls a day.
CREATE TABLE gquota (
  day TEXT PRIMARY KEY,        -- Japan date, 2026-12-20
  n INTEGER NOT NULL
);
