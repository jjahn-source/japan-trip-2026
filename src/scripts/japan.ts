// Live Japan helpers, all keyless and called straight from the phone:
//   weather  · Open-Meteo forecast for the day's place once it's within 16 days (before that, the
//              build bakes in the 10-year normal from Open-Meteo's archive: data/climate.json);
//   alerts   · during the trip, Japan Meteorological Agency warnings for the day's prefecture and
//              P2PQuake earthquake/tsunami reports, shown at the top of the panel;
//   money    · today's USD→JPY rate (Frankfurter, ECB data): ≈ $ beside every ¥ price.
import type { ClientTrip } from '../lib/client';

const trip: ClientTrip = JSON.parse(document.getElementById('trip-data')!.textContent!);
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));
const DAY = 864e5;

function nowMs() {
  const o = new URLSearchParams(location.search).get('now');
  const t = o ? Date.parse(/[+Z]/.test(o.slice(10)) ? o : `${o}${o.length <= 16 ? ':00' : ''}+09:00`) : NaN;
  return Number.isFinite(t) ? t : Date.now();
}
async function cached<T>(key: string, ttlMs: number, load: () => Promise<T>): Promise<T> {
  try {
    const hit = JSON.parse(localStorage.getItem(key) ?? 'null');
    if (hit && Date.now() - hit.at < ttlMs) return hit.v as T;
  } catch { /* storage off */ }
  const v = await load();
  try { localStorage.setItem(key, JSON.stringify({ at: Date.now(), v })); } catch { /* storage off */ }
  return v;
}
const iconHtml = (name: string) => document.querySelector<HTMLTemplateElement>(`template[data-wx-icon="${name}"]`)?.innerHTML ?? '';

// ── Weather ──
const WMO: [number[], string, string][] = [
  [[0, 1], 'Clear', 'sun'], [[2], 'Partly cloudy', 'cloudSun'], [[3], 'Cloudy', 'cloud'], [[45, 48], 'Fog', 'cloudFog'],
  [[51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82], 'Rain', 'cloudRain'], [[71, 73, 75, 77, 85, 86], 'Snow', 'cloudSnow'], [[95, 96, 99], 'Thunderstorms', 'cloudRain'],
];
async function weather() {
  const el = document.querySelector<HTMLElement>('[data-weather]');
  const day = Number(document.getElementById('view')?.dataset.day ?? 0);
  const d = trip.days.find((x) => x.n === day);
  if (!el || !d?.sun) return;
  const until = Date.parse(`${d.date}T12:00:00+09:00`) - Date.now(); // the forecast only exists for real dates, not ?now= previews
  if (until > 15 * DAY || until < -DAY) return; // outside the forecast window: the baked-in normal stays
  try {
    const sun = d.sun;
    const f = await cached(`jpc:wx:${d.date}:${sun.lat.toFixed(2)}`, 3 * 3600e3, async () => {
      const u = `https://api.open-meteo.com/v1/forecast?latitude=${sun.lat}&longitude=${sun.lng}&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=Asia%2FTokyo&start_date=${d.date}&end_date=${d.date}`;
      const j = await (await fetch(u)).json();
      return { code: j.daily.weather_code[0] as number, hi: j.daily.temperature_2m_max[0] as number, lo: j.daily.temperature_2m_min[0] as number, rain: j.daily.precipitation_probability_max[0] as number | null };
    });
    const [, word, icon] = WMO.find(([codes]) => codes.includes(f.code)) ?? [[], 'Weather', 'cloud'];
    el.innerHTML = `${iconHtml(icon)}<span class="time">${Math.round(f.hi)}° / ${Math.round(f.lo)}°</span><span class="where">${word}${f.rain != null ? ` · ${f.rain}% rain` : ''} · forecast</span>`;
    el.dataset.kind = 'forecast';
  } catch { /* offline: keep the normal */ }
}

// ── Alerts (during the trip) ──
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
async function alerts() {
  const box = document.querySelector<HTMLElement>('[data-alert]');
  if (!box) return;
  const first = Date.parse(`${trip.days[0].date}T00:00:00+09:00`), last = Date.parse(`${trip.days.at(-1)!.date}T23:59:00+09:00`);
  const demo = new URLSearchParams(location.search).has('alerts');
  if (!demo && (Date.now() < first - DAY || Date.now() > last + DAY)) { box.hidden = true; return; }
  const today = trip.days.find((x) => x.date === new Date(nowMs() + 9 * 3600e3).toISOString().slice(0, 10)) ?? trip.days[1];
  const at = today.sun ?? { lat: 35.68, lng: 139.76 };
  const pref = PREF(at.lat, at.lng);
  const lines: { text: string; severe: boolean }[] = [];
  try {
    const w = await cached(`jpc:jma:${pref.code}`, 10 * 60e3, async () => (await fetch(`https://www.jma.go.jp/bosai/warning/data/warning/${pref.code}.json`)).json());
    const active = new Set<string>();
    for (const type of w.areaTypes ?? []) for (const area of type.areas ?? []) for (const x of area.warnings ?? []) if (JMA[x.code] && x.status !== '解除' && x.status !== '発表警報・注意報はなし') active.add(x.code);
    for (const c of active) lines.push({ text: `${JMA[c]} in ${pref.name} · <a href="https://www.jma.go.jp/bosai/warning/#area_type=offices&area_code=${pref.code}&lang=en" target="_blank" rel="noopener">JMA</a>`, severe: +c >= 30 });
  } catch { /* JMA unreachable */ }
  try {
    const q = await cached('jpc:quake', 5 * 60e3, async () => (await fetch('https://api.p2pquake.net/v2/history?codes=551&limit=10')).json()) as Quake[];
    for (const e of q) {
      const when = Date.parse(e.time.replace(/\//g, '-').replace(' ', 'T').slice(0, 19) + '+09:00');
      if (!Number.isFinite(when) || Date.now() - when > 12 * 3600e3) continue;
      const here = (e.points ?? []).filter((p) => TRIP_PREFS.includes(p.pref) && p.scale >= 30);
      const tsunami = !['None', 'Unknown', 'Checking', 'NonEffective'].includes(e.earthquake.domesticTsunami);
      if (!here.length && !tsunami) continue;
      const top = here.sort((a, b) => b.scale - a.scale)[0];
      lines.push({
        text: `Earthquake ${e.time.slice(11, 16)}${top ? ` · shindo ${SCALE[top.scale] ?? ''} in ${top.pref}` : ''} · M${e.earthquake.hypocenter?.magnitude ?? '?'} ${esc(e.earthquake.hypocenter?.name ?? '')} · ${tsunami ? '<strong>tsunami advisory: move away from the coast</strong>' : 'no tsunami risk'} · <a href="https://www.jma.go.jp/bosai/map.html#contents=earthquake_map&lang=en" target="_blank" rel="noopener">JMA</a>`,
        severe: tsunami || (top?.scale ?? 0) >= 50,
      });
      break;
    }
  } catch { /* P2PQuake unreachable */ }
  if (demo && !lines.length) lines.push({ text: `All clear: no weather warnings in ${pref.name} and no felt earthquakes in the last 12 hours.`, severe: false });
  box.hidden = !lines.length;
  box.dataset.level = lines.some((l) => l.severe) ? 'severe' : 'notice';
  box.innerHTML = `${iconHtml('alert')}<span>${lines.map((l) => l.text).join('<br>')}</span>`;
}

// ── Money: ≈ $ beside ¥ prices ──
async function money() {
  let rate = 0;
  try {
    rate = await cached('jpc:fx', 12 * 3600e3, async () => (await (await fetch('https://api.frankfurter.dev/v1/latest?from=USD&to=JPY')).json()).rates.JPY as number);
  } catch { return; }
  if (!rate) return;
  document.querySelectorAll<HTMLElement>('.price .time, [data-yen]').forEach((el) => {
    if (el.dataset.fx) return;
    const m = el.textContent?.match(/¥\s?([\d,]+)/);
    if (!m) return;
    const usd = Number(m[1].replace(/,/g, '')) / rate;
    el.dataset.fx = '1';
    el.insertAdjacentHTML('afterend', `<span class="usd" title="At today's rate, 1 USD = ¥${rate.toFixed(0)}"> ≈ $${usd < 10 ? usd.toFixed(1) : Math.round(usd).toLocaleString('en-US')}</span>`);
  });
  document.querySelectorAll<HTMLElement>('[data-fx-rate]').forEach((el) => { el.textContent = `1 USD = ¥${rate.toFixed(1)} today (ECB rate)`; el.hidden = false; });
  const conv = document.querySelector<HTMLInputElement>('[data-fx-input]');
  const out = document.querySelector<HTMLElement>('[data-fx-out]');
  if (conv && out && !conv.dataset.bound) {
    conv.dataset.bound = '1';
    const update = () => { const y = Number(conv.value.replace(/[^\d.]/g, '')); out.textContent = y ? `≈ $${(y / rate).toFixed(2)}` : ''; };
    conv.addEventListener('input', update); update();
  }
}

function run() { void weather(); void alerts(); void money(); }
document.addEventListener('astro:page-load', run);
setInterval(() => { if (!document.hidden) void alerts(); }, 10 * 60e3);
