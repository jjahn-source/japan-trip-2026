-- Who saved each change, as a short hash of the address (never the address itself), so the Worker can
-- refuse more than 60 saves a minute from one place: a limit that holds across every Cloudflare
-- instance, counted with the index below (at most 60 rows read per save).
ALTER TABLE changes ADD COLUMN ip TEXT;
CREATE INDEX changes_ip_at ON changes (ip, at);
