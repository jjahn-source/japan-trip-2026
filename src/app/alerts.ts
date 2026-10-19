// Safety alerts during the trip, keyless and straight from the phone: Japan Meteorological Agency
// warnings for the prefecture the group is in, and P2PQuake earthquake/tsunami reports for the trip's
// prefectures. Quiet outside the trip (add ?alerts to the URL to see the strip any time).
import type { AppData } from './types';

export interface Alert { text: string; href: string; severe: boolean }

const DAY = 864e5;
async function cached<T>(key: string, ttlMs: number, load: () => Promise<T>): Promise<T> {
  try {
    const hit = JSON.parse(localStorage.getItem(key) ?? 'null');
    if (hit && Date.now() - hit.at < ttlMs) return hit.v as T;
  } catch { /* storage off */ }
  const v = await load();
  try { localStorage.setItem(key, JSON.stringify({ at: Date.now(), v })); } catch { /* storage off */ }
  return v;
}

const PREF = (lat: number, lng: number) =>
  lng < 133 ? { code: '340000', name: 'Hiroshima' }
  : lng < 139 ? (lat > 34.85 && lng < 135.85 ? { code: '260000', name: 'Kyoto' } : lng > 135.72 && lat < 34.75 ? { code: '290000', name: 'Nara' } : { code: '270000', name: 'Osaka' })
  : lng < 139.4 ? { code: '140000', name: 'Kanagawa (Hakone)' } : { code: '130000', name: 'Tokyo' };
// JMA warning codes (警報 and 特別警報 only; advisories are left out).
const JMA: Record<string, string> = {
  '02': 'Blizzard warning', '03': 'Heavy rain warning', '04': 'Flood warning', '05': 'Storm warning', '06': 'Heavy snow warning', '07': 'High wave warning', '08': 'Storm surge warning',
  '32': 'Emergency: blizzard', '33': 'Emergency: heavy rain', '35': 'Emergency: storm', '36': 'Emergency: heavy snow', '37': 'Emergency: high waves', '38': 'Emergency: storm surge',
};
const TRIP_PREFS = ['東京都', '神奈川県', '京都府', '大阪府', '奈良県', '広島県'];
const SCALE: Record<number, string> = { 10: '1', 20: '2', 30: '3', 40: '4', 45: '5-', 50: '5+', 55: '6-', 60: '6+', 70: '7' };
type Quake = { time: string; earthquake: { domesticTsunami: string; hypocenter?: { name?: string; magnitude?: number } }; points?: { pref: string; scale: number }[] };

export async function alerts(data: AppData, todayN: number | null): Promise<Alert[]> {
  const first = Date.parse(`${data.days[0].date}T00:00:00+09:00`), last = Date.parse(`${data.days.at(-1)!.date}T23:59:00+09:00`);
  const demo = new URLSearchParams(location.search).has('alerts');
  if (!demo && (Date.now() < first - DAY || Date.now() > last + DAY)) return [];
  const today = data.days.find((d) => d.n === todayN) ?? data.days[1] ?? data.days[0];
  const at = today.sun ?? { lat: 35.68, lng: 139.76 };
  const pref = PREF(at.lat, at.lng);
  const out: Alert[] = [];
  try {
    const w = await cached(`jt:jma:${pref.code}`, 10 * 60e3, async () => (await fetch(`https://www.jma.go.jp/bosai/warning/data/warning/${pref.code}.json`)).json());
    const active = new Set<string>();
    for (const type of w.areaTypes ?? []) for (const area of type.areas ?? []) for (const x of area.warnings ?? []) if (JMA[x.code] && x.status !== '解除' && x.status !== '発表警報・注意報はなし') active.add(x.code);
    for (const c of active) out.push({ text: `${JMA[c]} in ${pref.name}`, href: `https://www.jma.go.jp/bosai/warning/#area_type=offices&area_code=${pref.code}&lang=en`, severe: +c >= 30 });
  } catch { /* JMA unreachable */ }
  try {
    const q = await cached('jt:quake', 5 * 60e3, async () => (await fetch('https://api.p2pquake.net/v2/history?codes=551&limit=10')).json()) as Quake[];
    for (const e of q) {
      const when = Date.parse(e.time.replace(/\//g, '-').replace(' ', 'T').slice(0, 19) + '+09:00');
      if (!Number.isFinite(when) || Date.now() - when > 12 * 3600e3) continue;
      const here = (e.points ?? []).filter((p) => TRIP_PREFS.includes(p.pref) && p.scale >= 30);
      const tsunami = !['None', 'Unknown', 'Checking', 'NonEffective'].includes(e.earthquake.domesticTsunami);
      if (!here.length && !tsunami) continue;
      const top = here.sort((a, b) => b.scale - a.scale)[0];
      out.push({
        text: `Earthquake ${e.time.slice(11, 16)}${top ? ` · shindo ${SCALE[top.scale] ?? ''} in ${top.pref}` : ''} · M${e.earthquake.hypocenter?.magnitude ?? '?'} ${e.earthquake.hypocenter?.name ?? ''} · ${tsunami ? 'Tsunami advisory: move away from the coast' : 'no tsunami risk'}`,
        href: 'https://www.jma.go.jp/bosai/map.html#contents=earthquake_map&lang=en',
        severe: tsunami || (top?.scale ?? 0) >= 50,
      });
      break;
    }
  } catch { /* P2PQuake unreachable */ }
  if (demo && !out.length) out.push({ text: `All clear: no weather warnings in ${pref.name} and no felt earthquakes in the last 12 hours.`, href: 'https://www.jma.go.jp/bosai/warning/#lang=en', severe: false });
  return out;
}
