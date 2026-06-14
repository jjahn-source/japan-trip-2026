import type { Day, Activity } from "../data/itinerary";
import type { Booking } from "../data/bookings";

// ── Time helpers ─────────────────────────────────────────────────────────────
const TIME_RE = /^(\d{2}):(\d{2})$/;

export function isTimed(a: Activity): boolean {
  return TIME_RE.test(a.time);
}

export function parseMinutes(time: string): number | null {
  const m = TIME_RE.exec(time);
  if (!m) return null;
  return Number(m[1]) * 60 + Number(m[2]);
}

/** First→last timed span of a day, e.g. "08:30 – 23:30 · 15h 0m". null if <2 timed. */
export function daySpan(day: Day): { first: string; last: string; label: string } | null {
  const timed = day.activities.filter(isTimed);
  if (timed.length < 2) return null;
  const first = timed[0].time;
  const last = timed[timed.length - 1].time;
  const mins = (parseMinutes(last)! - parseMinutes(first)! + 1440) % 1440;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return { first, last, label: `${h}h ${m}m` };
}

// ── Google Maps deep-links ───────────────────────────────────────────────────
/** Pin a known establishment by name — Google shows the real venue card, not a bare coordinate. */
export function mapsSearchUrl(query: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

export function mapsPinUrl([lat, lng]: [number, number]): string {
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
}

/**
 * Best Maps link for an activity: prefer the named venue (accurate pin on the
 * actual establishment); fall back to raw coordinates only when no name exists.
 */
export function activityMapUrl(a: Activity): string | null {
  if (a.place) return mapsSearchUrl(a.place);
  if (a.coord) return mapsPinUrl(a.coord);
  return null;
}

/** A single waypoint token for the directions path — name if known, else "lat,lng". */
function waypointToken(a: Activity): string {
  if (a.place) return encodeURIComponent(a.place);
  const [la, ln] = a.coord!;
  return `${la},${ln}`;
}

/** Directions through every mapped stop of the day, in order. null if <2 stops. */
export function mapsRouteUrl(day: Day): string | null {
  const stops = day.activities.filter((a) => a.coord || a.place);
  if (stops.length < 2) return null;
  const path = stops.map(waypointToken).join("/");
  return `https://www.google.com/maps/dir/${path}`;
}

// ── ICS (iCalendar) export ───────────────────────────────────────────────────
function pad(n: number): string {
  return String(n).padStart(2, "0");
}

/** Floating local datetime stamp YYYYMMDDTHHMMSS (no TZ → calendar uses device local). */
function icsStamp(dateISO: string, minutes: number): string {
  const [y, mo, d] = dateISO.split("-").map(Number);
  // Roll over past-midnight activities (e.g. 00:00 entries belong to the next calendar day).
  const dayOffset = Math.floor(minutes / 1440);
  const mins = ((minutes % 1440) + 1440) % 1440;
  const base = new Date(Date.UTC(y, mo - 1, d + dayOffset));
  return (
    `${base.getUTCFullYear()}${pad(base.getUTCMonth() + 1)}${pad(base.getUTCDate())}` +
    `T${pad(Math.floor(mins / 60))}${pad(mins % 60)}00`
  );
}

function escapeICS(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

function dayEvents(day: Day): string[] {
  const timed = day.activities.filter(isTimed);
  const lines: string[] = [];
  timed.forEach((a, i) => {
    const start = parseMinutes(a.time)!;
    // End = next timed activity, else +90 min. Guard against negative (past-midnight).
    let end = i + 1 < timed.length ? parseMinutes(timed[i + 1].time)! : start + 90;
    if (end <= start) end += 1440;
    const uid = `${day.date}-${i}@japan-trip-2026`;
    const desc = [a.note, a.booking ? "⚠ NEEDS ADVANCE BOOKING" : ""].filter(Boolean).join("\\n\\n");
    lines.push(
      "BEGIN:VEVENT",
      `UID:${uid}`,
      `DTSTAMP:${icsStamp(day.date, 0)}`,
      `DTSTART:${icsStamp(day.date, start)}`,
      `DTEND:${icsStamp(day.date, end)}`,
      `SUMMARY:${escapeICS(`${day.emoji} ${a.title}`)}`,
      `LOCATION:${escapeICS(day.city)}`,
      ...(desc ? [`DESCRIPTION:${escapeICS(desc)}`] : []),
      ...(a.coord ? [`GEO:${a.coord[0]};${a.coord[1]}`] : []),
      "END:VEVENT",
    );
  });
  return lines;
}

function wrapCalendar(events: string[]): string {
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//japan-trip-2026//EN",
    "CALSCALE:GREGORIAN",
    "X-WR-CALNAME:Japan 2026",
    "X-WR-TIMEZONE:Asia/Tokyo",
    ...events,
    "END:VCALENDAR",
  ].join("\r\n");
}

export function buildDayICS(day: Day): string {
  return wrapCalendar(dayEvents(day));
}

export function buildTripICS(days: Day[]): string {
  return wrapCalendar(days.flatMap(dayEvents));
}

/** All-day date stamp YYYYMMDD for VALUE=DATE events. */
function icsDate(dateISO: string): string {
  return dateISO.replace(/-/g, "");
}

/**
 * Booking-deadline reminders: one all-day VEVENT on each deadline with a DISPLAY
 * VALARM firing `remindDaysBefore` days ahead, so the whole crew gets nudged in
 * their own calendar to book teamLab / Ghibli / USJ / shinkansen on time.
 */
export function buildBookingsICS(bookings: Booking[]): string {
  const events = bookings.flatMap((b) => {
    const start = icsDate(b.deadline);
    const lead = b.remindDaysBefore ?? 3;
    const owner = b.owner ? ` [${b.owner}]` : "";
    const desc = [b.detail, b.url ? `Book: ${b.url}` : ""].filter(Boolean).join("\\n\\n");
    return [
      "BEGIN:VEVENT",
      `UID:booking-${b.id}@japan-trip-2026`,
      `DTSTAMP:${icsStamp(b.deadline, 0)}`,
      `DTSTART;VALUE=DATE:${start}`,
      `SUMMARY:${escapeICS(`🎌 BOOK: ${b.what}${owner}`)}`,
      ...(desc ? [`DESCRIPTION:${escapeICS(desc)}`] : []),
      ...(b.url ? [`URL:${b.url}`] : []),
      "BEGIN:VALARM",
      `TRIGGER:-P${lead}D`,
      "ACTION:DISPLAY",
      `DESCRIPTION:${escapeICS(`Book soon: ${b.what}`)}`,
      "END:VALARM",
      "END:VEVENT",
    ];
  });
  return wrapCalendar(events);
}

/** Trigger a client-side .ics download. */
export function downloadICS(filename: string, ics: string): void {
  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
