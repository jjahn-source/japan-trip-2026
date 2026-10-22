// The trip as a calendar feed (worker/index.ts /api/calendar.ics), built from the plan with the group's
// changes on it, so a phone subscribed in Google Calendar (or Apple's) shows every stop where it is now:
// moved stops at their new time, cancelled ones gone, the group's note in the description.
import type { PlanStop } from './live';

const esc = (t: string) => t.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/([,;])/g, '\\$1');
const utc = (iso: string) => new Date(Date.parse(iso)).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
/** Lines longer than 75 bytes continue on the next line after a space (RFC 5545), never mid-character. */
function fold(line: string): string {
  const enc = new TextEncoder();
  if (enc.encode(line).length <= 75) return line;
  const out: string[] = [];
  let cur = '', size = 0;
  for (const ch of line) {
    const n = enc.encode(ch).length;
    if (size + n > (out.length ? 74 : 75)) { out.push(cur); cur = ''; size = 0; }
    cur += ch; size += n;
  }
  out.push(cur);
  return out.join('\r\n ');
}

/** Every stop but the stays (a stay is a whole night, shown by its check-in stop) as one event each. */
export function calendar(stops: PlanStop[], origin: string, stamp: number): string {
  const lines = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//japan-plan-c//trip//EN', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
    'X-WR-CALNAME:Japan trip', 'X-WR-TIMEZONE:Asia/Tokyo', 'REFRESH-INTERVAL;VALUE=DURATION:PT1H', 'X-PUBLISHED-TTL:PT1H',
  ];
  for (const s of stops) {
    if (s.cat === 'stay' || s.cancelled) continue;
    const url = `${origin}/day/${s.d}/#${s.id}`;
    lines.push(
      'BEGIN:VEVENT', `UID:${s.id}@japan-plan-c`, `DTSTAMP:${utc(new Date(stamp).toISOString())}`,
      `DTSTART:${utc(s.s)}`, `DTEND:${utc(Date.parse(s.e) > Date.parse(s.s) ? s.e : s.s)}`,
      `SUMMARY:${esc(s.name)}`,
      ...(s.a ? [`LOCATION:${esc(s.a)}`] : []),
      `DESCRIPTION:${esc([s.note ? `Note: ${s.note}` : null, `Day ${s.d} in the trip: ${url}`].filter(Boolean).join('\n'))}`,
      `URL:${url}`, 'END:VEVENT',
    );
  }
  lines.push('END:VCALENDAR');
  return `${lines.map(fold).join('\r\n')}\r\n`;
}
