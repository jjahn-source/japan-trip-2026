// Pure helpers the map and the strips share: line colours, readable text on them, and the light
// for an hour of the day. No Mapbox here, so tests can import it.
export type Phase = 'dawn' | 'day' | 'dusk' | 'night';

export const LANTERN = '#f2c46d';
export const colourOf = (m: string, c?: string) => c ?? (m === 'bus' ? '#7fc8a9' : m === 'boat' ? '#79b8ff' : LANTERN);
/** Dark or light text, whichever reads on a line's colour (WCAG relative luminance). */
export function inkOn(hex: string) {
  const m = hex.match(/^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
  if (!m) return '#14122a';
  const [r, g, b] = m.slice(1).map((x) => { const c = parseInt(x, 16) / 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; });
  const L = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return (L + 0.05) / 0.05 >= 1.05 / (L + 0.05) ? '#14122a' : '#ffffff';
}
/** The light for a moment of the day, from that day's own sunrise and sunset. */
export function phaseAt(minute: number, sun: { sunrise: string; sunset: string } | null): Phase {
  const m = ((minute % 1440) + 1440) % 1440;
  const rise = sun ? +sun.sunrise.slice(0, 2) * 60 + +sun.sunrise.slice(3, 5) : 400;
  const set = sun ? +sun.sunset.slice(0, 2) * 60 + +sun.sunset.slice(3, 5) : 1000;
  if (m < rise - 40 || m > set + 50) return 'night';
  if (m < rise + 40) return 'dawn';
  if (m > set - 50) return 'dusk';
  return 'day';
}

