// "Live times" on the longer rides. With PUBLIC_RAPIDAPI_KEY set, the next three departures come from
// NAVITIME's timetable search (from now, or from the planned time before the trip); without it, the
// button opens Google Maps transit, which carries live Japanese train times in its app. Short hops keep
// their walking estimate.
import { NAVITIME_HOST, jst, normalize, routeUrl, translator, type Route } from '../lib/navitime';
import { stageApi } from './map/stage';

const KEY = import.meta.env.PUBLIC_RAPIDAPI_KEY as string | undefined;
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));
const hhmm = (iso: string) => iso.slice(11, 16);
type Leg = { from: string; a: [number, number]; b: [number, number]; depart: string; minutes: number };
let legs: Record<string, Leg> | null = null;

async function legFor(id: string): Promise<Leg | null> {
  if (!legs) {
    try {
      const j = await (await fetch(`${import.meta.env.BASE_URL.replace(/\/$/, '')}/legs.json`)).json();
      legs = {};
      for (const list of Object.values(j.days) as Leg[][]) for (const l of list) legs[l.from] = l;
    } catch { return null; }
  }
  return legs[id] ?? null;
}
function nowMs() {
  const o = new URLSearchParams(location.search).get('now');
  const t = o ? Date.parse(/[+Z]/.test(o.slice(10)) ? o : `${o}${o.length <= 16 ? ':00' : ''}+09:00`) : NaN;
  return Number.isFinite(t) ? t : Date.now();
}
const option = (r: Route, k: number) => `<span class="live-opt"><span><b>${hhmm(r.dep)}</b> → <b>${hhmm(r.arr)}</b> · ${r.minutes} min${r.transfers ? ` · ${r.transfers} change${r.transfers > 1 ? 's' : ''}` : ''}${r.fare ? ` · ¥${r.fare.toLocaleString('en-US')}` : ''}${k === 0 ? ' · best' : ''}</span>
  <small>${r.rides.map((x) => `${esc(x.line)} ${esc(x.from)} ${hhmm(x.dep)} → ${esc(x.to)} ${hhmm(x.arr)}`).join(' · ')}</small></span>`;

document.addEventListener('click', async (e) => {
  const btn = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-live-btn]');
  if (!btn) return;
  const out = btn.parentElement!.querySelector<HTMLElement>('[data-live-out]')!;
  const leg = await legFor(btn.dataset.liveBtn!);
  if (!leg) return;
  const gmaps = `https://www.google.com/maps/dir/?api=1&origin=${leg.a[1]},${leg.a[0]}&destination=${leg.b[1]},${leg.b[0]}&travelmode=transit`;
  if (!KEY) { window.open(gmaps, '_blank', 'noopener'); return; }
  // On the day itself, from now; before the trip, from the planned departure, so the times are real ones.
  const planned = Date.parse(leg.depart);
  const t = nowMs();
  const start = Math.abs(t - planned) < 18 * 3600e3 ? Math.max(t, planned - 30 * 60e3) : planned;
  btn.disabled = true;
  out.innerHTML = '<span class="live-opt"><small>Checking timetables…</small></span>';
  try {
    const res = await fetch(routeUrl(leg.a, leg.b, jst(start)), { headers: { 'X-RapidAPI-Key': KEY, 'X-RapidAPI-Host': NAVITIME_HOST } });
    if (!res.ok) throw new Error(String(res.status));
    const { stations, lines } = stageApi();
    const tr = translator(new Map(stations.map((x) => [x.ja, x.name])), new Map(lines.map((x) => [x.ja, x.name])));
    const routes = ((await res.json()).items ?? []).map((it: never) => normalize(it)).filter(Boolean)
      .map((r: Route) => ({ ...r, rides: r.rides.map((x) => ({ ...x, line: tr.line(x.line), from: tr.station(x.from), to: tr.station(x.to) })) })) as Route[];
    out.innerHTML = routes.length
      ? routes.slice(0, 3).map(option).join('') + `<span class="live-opt"><small>Timetable times from NAVITIME. <a href="${gmaps}" target="_blank" rel="noopener">Delays & platforms in Google Maps</a></small></span>`
      : `<span class="live-opt"><small>No timetable found. <a href="${gmaps}" target="_blank" rel="noopener">Open Google Maps</a></small></span>`;
  } catch {
    out.innerHTML = `<span class="live-opt"><small>Timetables unavailable right now (offline, or this month's free searches are used up). <a href="${gmaps}" target="_blank" rel="noopener">Open Google Maps transit</a></small></span>`;
  } finally { btn.disabled = false; }
});
