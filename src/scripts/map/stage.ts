// The stage: one full-screen map that lives for the whole visit. Pages never reload it;
// they tell it which view to show (overview, a day, the bookings) and it flies there.
// Mapbox Standard when PUBLIC_MAPBOX_TOKEN is set; MapLibre + OpenFreeMap otherwise.
import type { ClientTrip, ClientStop } from '../../lib/client';
import { jstClock } from '../../lib/sun';
import { lighting, type Phase } from './light';
import { adds, addTrend, isAdded, removeAdd, walkMin } from '../adds';
import type { ClientTrend } from '../../lib/client';
import rotateIcon from 'lucide-static/icons/rotate-3d.svg?raw';
import trainIcon from 'lucide-static/icons/train-front.svg?raw';

type Stop = ClientStop & { lat: number; lng: number };
export type ViewKind = 'overview' | 'day' | 'bookings' | 'plain';
export interface View { kind: ViewKind; day: number }

const trip: ClientTrip = JSON.parse(document.getElementById('trip-data')!.textContent!);
const TOKEN = import.meta.env.PUBLIC_MAPBOX_TOKEN as string | undefined;
const base = import.meta.env.BASE_URL.replace(/\/$/, '');
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const ms = (iso: string) => Date.parse(iso);
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));
const stops = trip.stops.filter((s) => s.lat != null) as Stop[];
const stays = trip.stays.filter((s) => s.lat != null) as (ClientTrip['stays'][number] & { lat: number; lng: number })[];
const TOKYO = { lat: 35.68, lng: 139.76 };

export function previewNow() {
  const o = new URLSearchParams(location.search).get('now');
  const t = o ? Date.parse(/[+Z]/.test(o.slice(10)) ? o : `${o}${o.length <= 16 ? ':00' : ''}+09:00`) : NaN;
  return Number.isFinite(t) ? t : Date.now();
}

const km = (a: [number, number], b: [number, number]) => {
  const R = 6371; const r = Math.PI / 180;
  const dLat = (b[1] - a[1]) * r; const dLng = (b[0] - a[0]) * r;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a[1] * r) * Math.cos(b[1] * r) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
};
const boundsOf = (pts: [number, number][]) => {
  const lng = pts.map((p) => p[0]); const lat = pts.map((p) => p[1]);
  return [[Math.min(...lng), Math.min(...lat)], [Math.max(...lng), Math.max(...lat)]] as [[number, number], [number, number]];
};

/* ── Trip geometry ── */
const prevDate = (date: string) => new Date(Date.parse(`${date}T12:00:00Z`) - 864e5).toISOString().slice(0, 10);
const baseFor = (date: string) => stays.find((s) => s.in <= `${date}T23:59:00+09:00` && s.out > `${date}T12:00:00+09:00`);
function overview() {
  const features: object[] = [{ type: 'Feature', properties: { kind: 'leg' }, geometry: { type: 'LineString', coordinates: stays.map((s) => [s.lng, s.lat]) } }];
  const trips: { day: number; lng: number; lat: number }[] = [];
  trip.days.forEach((d, i) => {
    const b = baseFor(d.date);
    const prev = i > 0 ? baseFor(trip.days[i - 1].date) : undefined;
    if (!b || b !== prev) return; // move days ride the legs
    const far = stops.filter((s) => s.d === d.n).map((s) => ({ s, dist: km([b.lng, b.lat], [s.lng, s.lat]) })).sort((a, z) => z.dist - a.dist)[0];
    if (far && far.dist > 25) {
      features.push({ type: 'Feature', properties: { kind: 'trip', day: d.n }, geometry: { type: 'LineString', coordinates: [[b.lng, b.lat], [far.s.lng, far.s.lat]] } });
      trips.push({ day: d.n, lng: far.s.lng, lat: far.s.lat });
    }
  });
  return { features, trips };
}
/** Stops of one day closer than 150 m share a marker ("4·5"). */
function groups(day: number) {
  const out: { at: Stop; members: Stop[] }[] = [];
  for (const s of stops.filter((x) => x.d === day)) {
    const g = out.find((gr) => km([gr.at.lng, gr.at.lat], [s.lng, s.lat]) < 0.15);
    if (g) g.members.push(s); else out.push({ at: s, members: [s] });
  }
  return out;
}
const groupIndex = new Map<string, number>(); // stop id → feature id
const dayGroups = trip.days.flatMap((d) => groups(d.n).map((g, gi) => {
  const id = d.n * 100 + gi;
  g.members.forEach((m) => groupIndex.set(m.id, id));
  return { type: 'Feature', id, properties: { day: d.n, label: g.members.map((m) => m.i).join('·'), ids: g.members.map((m) => m.id).join(',') }, geometry: { type: 'Point', coordinates: [g.at.lng, g.at.lat] } };
}));
const dayRoutes = trip.days.map((d) => ({ type: 'Feature', properties: { day: d.n }, geometry: { type: 'LineString', coordinates: stops.filter((s) => s.d === d.n).map((s) => [s.lng, s.lat]) } }))
  .filter((f) => f.geometry.coordinates.length > 1);
const cityJa = (lng: number) => (lng > 139.5 ? '東京' : lng > 138.8 ? '箱根' : '大阪');
const cityEn = (lng: number) => (lng > 139.5 ? 'Tokyo' : lng > 138.8 ? 'Hakone' : 'Osaka');

/* ── Opening flight: the whole route in one pass, before the trip ──
 * Each stop of the flight shows those days' routes and rings, lit as they will be at that moment. */
const FLIGHT = [
  { center: [139.79, 35.55], zoom: 10.6, pitch: 58, bearing: 24, days: [2], at: '2026-12-15T16:05', caption: 'Day 2 · Land at Haneda' },
  { center: [139.70, 35.69], zoom: 12.4, pitch: 64, bearing: -18, days: [3, 4, 5], at: '2026-12-16T16:40', caption: 'Days 3–5 · Tokyo' },
  { center: [139.02, 35.24], zoom: 11.2, pitch: 70, bearing: -48, days: [6, 7], at: '2026-12-20T10:30', caption: 'Days 6–7 · Hakone' },
  { center: [135.77, 35.0], zoom: 12.2, pitch: 62, bearing: 18, days: [9], at: '2026-12-22T16:20', caption: 'Day 9 · Kyoto' },
  { center: [135.50, 34.67], zoom: 12.0, pitch: 62, bearing: -22, days: [8, 11, 12], at: '2026-12-21T20:00', caption: 'Days 8–12 · Osaka' },
  { center: [132.32, 34.30], zoom: 12.0, pitch: 64, bearing: 30, days: [10], at: '2026-12-23T11:30', caption: 'Day 10 · Miyajima' },
  { center: [139.71, 35.69], zoom: 12.6, pitch: 66, bearing: -30, days: [13, 14, 15, 16], at: '2026-12-26T21:30', caption: 'Days 13–16 · Shinjuku' },
] as const;

/* ── State ── */
type AnyMap = import('maplibre-gl').Map;
let map: AnyMap | null = null;
let kind: 'mapbox' | 'maplibre' = 'maplibre';
let lib: typeof import('maplibre-gl');
let buildStyle: typeof import('./style').buildStyle | null = null;
let applyPalette: typeof import('./style').applyPalette | null = null;
let ready: Promise<void> | null = null;
let view: View = { kind: 'overview', day: 0 };
let lastPhase: Phase | null = null;
let activeId: number | null = null;
let activeStop: string | null = null;
let flying = false;
let drawRaf = 0;
/** The part of the screen the panel covers; camera moves keep the subject in the open map. */
let pad = { top: 0, right: 0, bottom: 0, left: 0 };
const offset = (): [number, number] => [(pad.left - pad.right) / 2, (pad.top - pad.bottom) / 2];
const stage = () => document.getElementById('stage')!;

async function loadEngine() {
  if (TOKEN) {
    const [{ default: mapboxgl }] = await Promise.all([import('mapbox-gl'), import('mapbox-gl/dist/mapbox-gl.css')]);
    mapboxgl.accessToken = TOKEN;
    kind = 'mapbox';
    return mapboxgl as unknown as typeof import('maplibre-gl');
  }
  // MapLibre 6 resolves its worker from a runtime URL the bundler cannot see; bundle it via Vite.
  const [ml, worker, style] = await Promise.all([
    import('maplibre-gl'),
    import('maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url'),
    import('./style'),
    import('maplibre-gl/dist/maplibre-gl.css'),
  ]);
  ml.setWorkerUrl(worker.default);
  buildStyle = style.buildStyle;
  applyPalette = style.applyPalette;
  kind = 'maplibre';
  return ml;
}

/* ── Boot (once per visit) ── */
export function boot() {
  if (ready) return ready;
  ready = (async () => {
    const canvas = document.getElementById('map-canvas')!;
    try { lib = await loadEngine(); } catch { stage().dataset.failed = 'true'; return; }
    const l = lighting(previewNow(), TOKYO.lat, TOKYO.lng);
    try {
      map = new lib.Map({
        container: canvas,
        style: kind === 'mapbox' ? 'mapbox://styles/mapbox/standard' : buildStyle!(l.palette, { terrain: true }),
        bounds: boundsOf(stops.map((s) => [s.lng, s.lat])),
        fitBoundsOptions: { padding: 80 },
        maxPitch: 80,
        attributionControl: { compact: true },
        ...(kind === 'mapbox' ? {
          // Our own stations, stops and trending pins carry the labels; the basemap keeps only a few landmarks.
          config: { basemap: { lightPreset: l.phase, show3dObjects: true, showPointOfInterestLabels: true, densityPointOfInterestLabels: 1, showTransitLabels: false, showRoadLabels: false } },
        } : {}),
      } as never);
    } catch { stage().dataset.failed = 'true'; return; }
    const m = map;
    lastPhase = l.phase;
    // ?debug exposes the map instance for inspection in the console.
    if (new URLSearchParams(location.search).has('debug')) (window as unknown as { __map: AnyMap }).__map = m;
    new ResizeObserver(() => m.resize()).observe(canvas);
    m.on('error', (e: { error?: { message?: string } }) => { if (/webgl/i.test(String(e.error?.message))) stage().dataset.failed = 'true'; });
    m.addControl(new lib.NavigationControl({ visualizePitch: true }), 'top-right');
    m.addControl(new OrbitControl() as never, 'top-right');
    m.addControl(new TransitControl() as never, 'top-right');
    m.addControl(new lib.GeolocateControl({ positionOptions: { enableHighAccuracy: true }, trackUserLocation: true, showUserHeading: true } as never), 'top-right');
    await new Promise<void>((resolve) => m.on('load', () => resolve()));
    addLayers(m);
    if (kind === 'maplibre') applyPalette!(m, l.palette, l);
    void loadTransit(m);
    void loadLegs();
    stage().dataset.ready = 'true';
    // Taking the controls cancels the opening flight.
    for (const ev of ['mousedown', 'touchstart', 'wheel']) canvas.addEventListener(ev, () => { if (flying) stopFlight(); if (orbiting) setOrbit(false); }, { passive: true });
  })();
  return ready;
}

function addLayers(m: AnyMap) {
  const mb = kind === 'mapbox';
  const slot = mb ? { slot: 'top' } : {};
  const glow = (prop: string, v = 1) => (mb ? { [prop]: v } : {});
  const font = mb ? ['DIN Pro Bold', 'Arial Unicode MS Bold'] : ['Noto Sans Bold'];
  if (mb) {
    m.addSource('mapbox-dem', { type: 'raster-dem', url: 'mapbox://mapbox.mapbox-terrain-dem-v1', tileSize: 512, maxzoom: 14 } as never);
    m.setTerrain({ source: 'mapbox-dem', exaggeration: 1.1 } as never);
  } else {
    m.setProjection({ type: 'globe' });
    m.setTerrain({ source: 'dem', exaggeration: 1.1 });
  }
  const ov = overview();
  m.addSource('legs', { type: 'geojson', data: { type: 'FeatureCollection', features: ov.features } } as never);
  m.addSource('day-route', { type: 'geojson', lineMetrics: true, data: { type: 'FeatureCollection', features: dayRoutes } } as never);
  m.addSource('day-stops', { type: 'geojson', data: { type: 'FeatureCollection', features: dayGroups } } as never);
  m.addSource('dots', { type: 'geojson', data: { type: 'FeatureCollection', features: stops.map((s, i) => ({ type: 'Feature', id: i, properties: { day: s.d, id: s.id, mark: s.mark ?? '' }, geometry: { type: 'Point', coordinates: [s.lng, s.lat] } })) } } as never);

  // Overview: legs between bases (solid) and day trips (dashed).
  m.addLayer({ id: 'legs-casing', type: 'line', source: 'legs', filter: ['==', ['get', 'kind'], 'leg'], layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': '#ffffff', 'line-width': 7, 'line-opacity': 0.85, ...glow('line-emissive-strength') }, ...slot } as never);
  m.addLayer({ id: 'legs', type: 'line', source: 'legs', filter: ['==', ['get', 'kind'], 'leg'], layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': '#3a2f8f', 'line-width': 3.2, ...glow('line-emissive-strength') }, ...slot } as never);
  m.addLayer({ id: 'trips', type: 'line', source: 'legs', filter: ['==', ['get', 'kind'], 'trip'], layout: { 'line-cap': 'round' }, paint: { 'line-color': '#3a2f8f', 'line-width': 2.2, 'line-dasharray': [1.4, 2], ...glow('line-emissive-strength') }, ...slot } as never);

  // A day: its route (inked in on arrival over a white track) and numbered stops.
  const none = ['==', ['get', 'day'], -1];
  m.addLayer({ id: 'route-casing', type: 'line', source: 'day-route', filter: none, layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': '#ffffff', 'line-width': ['interpolate', ['linear'], ['zoom'], 7, 0, 9, 4, 10, 8, 16, 14], 'line-opacity': 0.95, ...glow('line-emissive-strength') }, ...slot } as never);
  // Legs ride in the colour of the train line; walks are dotted, boats dashed, roads plain ink.
  const ink0 = '#3a2f8f';
  m.addLayer({
    id: 'route', type: 'line', source: 'day-route', filter: none, layout: { 'line-cap': 'round', 'line-join': 'round' },
    paint: { 'line-width': ['interpolate', ['linear'], ['zoom'], 7, 1.4, 9, 2.8, 10, 4.6, 16, 9], 'line-color': ['coalesce', ['get', 'colour'], ink0], ...glow('line-emissive-strength') },
    ...slot,
  } as never);
  m.addLayer({
    id: 'route-walk', type: 'line', source: 'day-route', filter: none, layout: { 'line-cap': 'round', 'line-join': 'round' },
    paint: { 'line-width': ['interpolate', ['linear'], ['zoom'], 9, 2, 12, 3, 16, 5], 'line-color': ink0, 'line-dasharray': [0, 1.8], ...glow('line-emissive-strength') },
    ...slot,
  } as never);
  m.addLayer({
    id: 'route-boat', type: 'line', source: 'day-route', filter: none, layout: { 'line-cap': 'round', 'line-join': 'round' },
    paint: { 'line-width': ['interpolate', ['linear'], ['zoom'], 9, 2, 16, 5], 'line-color': ink0, 'line-dasharray': [2.2, 1.6], ...glow('line-emissive-strength') },
    ...slot,
  } as never);
  // Trains running along your own legs: white dashes that march (see runFlow).
  m.addLayer({
    id: 'route-flow', type: 'line', source: 'day-route', filter: none, layout: { 'line-cap': 'butt', 'line-join': 'round' },
    paint: { 'line-width': ['interpolate', ['linear'], ['zoom'], 9, 1.2, 16, 3], 'line-color': '#ffffff', 'line-opacity': 0.95, 'line-dasharray': [0, 4, 3], ...glow('line-emissive-strength') },
    ...slot,
  } as never);
  // Quick adds: a dashed spur from the stop it hangs off, and a small ring under its photo pin.
  m.addSource('adds', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } } as never);
  m.addLayer({ id: 'add-spur', type: 'line', source: 'adds', filter: ['==', ['geometry-type'], 'LineString'], layout: { 'line-cap': 'round' }, paint: { 'line-color': '#3a2f8f', 'line-width': 2.2, 'line-dasharray': [1.2, 1.6], ...glow('line-emissive-strength') }, ...slot } as never);
  m.addLayer({ id: 'add-ring', type: 'circle', source: 'adds', filter: ['==', ['geometry-type'], 'Point'], paint: { 'circle-radius': 7, 'circle-color': '#ffffff', 'circle-stroke-color': '#3a2f8f', 'circle-stroke-width': 2.6, 'circle-pitch-alignment': 'viewport', ...glow('circle-emissive-strength') }, ...slot } as never);
  // The overview maps every day: a "Day 3" tag on each day's patch, from city zoom in.
  m.addSource('day-tags', { type: 'geojson', data: { type: 'FeatureCollection', features: trip.days.filter((d) => stops.some((s) => s.d === d.n)).map((d) => {
    const pts = dayFrame(d.n);
    return { type: 'Feature', properties: { day: d.n, label: `Day ${d.n}` }, geometry: { type: 'Point', coordinates: [pts.reduce((a, s) => a + s.lng, 0) / pts.length, pts.reduce((a, s) => a + s.lat, 0) / pts.length] } };
  }) } } as never);
  m.addLayer({ id: 'day-tags', type: 'symbol', source: 'day-tags', minzoom: 9, layout: { visibility: 'none', 'text-field': ['get', 'label'], 'text-font': font, 'text-size': 13, 'text-padding': 6 }, paint: { 'text-color': '#ffffff', 'text-halo-color': '#3a2f8f', 'text-halo-width': 3, ...glow('text-emissive-strength') }, ...slot } as never);
  m.on('click', 'day-tags', ((e: { features?: { properties: { day: number } }[] }) => {
    const d = e.features?.[0]?.properties.day;
    if (d) document.dispatchEvent(new CustomEvent('stage:day', { detail: { day: d } }));
  }) as never);
  m.on('mouseenter', 'day-tags', () => { m.getCanvas().style.cursor = 'pointer'; });
  m.on('mouseleave', 'day-tags', () => { m.getCanvas().style.cursor = ''; });
  m.addSource('ink', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } } as never);
  m.addLayer({ id: 'route-ink', type: 'line', source: 'ink', layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': '#3a2f8f', 'line-width': ['interpolate', ['linear'], ['zoom'], 10, 3, 16, 6], ...glow('line-emissive-strength') }, ...slot } as never);
  m.addLayer({
    id: 'day-stops', type: 'circle', source: 'day-stops', filter: none, ...slot,
    paint: {
      'circle-radius': ['+', ['case', ['boolean', ['feature-state', 'active'], false], 14, 11], ['case', ['>', ['length', ['get', 'label']], 3], 7, ['>', ['length', ['get', 'label']], 2], 4, 0]],
      'circle-color': ['case', ['boolean', ['feature-state', 'active'], false], '#e3411f', '#ffffff'],
      'circle-stroke-color': ['case', ['boolean', ['feature-state', 'active'], false], '#ffffff', '#3a2f8f'],
      'circle-stroke-width': 2.6, 'circle-pitch-alignment': 'viewport', 'circle-pitch-scale': 'viewport',
      ...glow('circle-emissive-strength'),
    },
  } as never);
  m.addLayer({
    id: 'day-stop-numbers', type: 'symbol', source: 'day-stops', filter: none, ...slot,
    layout: { 'text-field': ['get', 'label'], 'text-font': font, 'text-size': 12, 'text-allow-overlap': true, 'text-ignore-placement': false, 'text-padding': 9, 'text-pitch-alignment': 'viewport' }, // basemap labels yield to the rings
    paint: { 'text-color': ['case', ['boolean', ['feature-state', 'active'], false], '#ffffff', '#3a2f8f'], ...glow('text-emissive-strength') },
  } as never);

  // Overview detail when zoomed in, and the bookings view's stops still to book or check.
  m.addLayer({ id: 'dots', type: 'circle', source: 'dots', minzoom: 8, layout: { visibility: 'none' }, paint: { 'circle-radius': ['interpolate', ['linear'], ['zoom'], 8, 3, 14, 6], 'circle-color': '#ffffff', 'circle-stroke-color': '#3a2f8f', 'circle-stroke-width': 1.6, 'circle-pitch-alignment': 'viewport', ...glow('circle-emissive-strength') }, ...slot } as never);
  // Bookings: what's still to book (vermilion) or check (violet), labelled by day; nearby ones
  // gather into one "×3" ring that opens on tap.
  const todos = stops.filter((s) => s.mark === 'tobook' || s.mark === 'tocheck');
  m.addSource('todos', {
    type: 'geojson', cluster: true, clusterRadius: 30, clusterMaxZoom: 15,
    clusterProperties: { book: ['+', ['case', ['==', ['get', 'mark'], 'tobook'], 1, 0]] },
    data: { type: 'FeatureCollection', features: todos.map((s) => ({ type: 'Feature', properties: { id: s.id, day: s.d, mark: s.mark, label: `D${s.d}` }, geometry: { type: 'Point', coordinates: [s.lng, s.lat] } })) },
  } as never);
  const todoRing = { 'circle-color': '#ffffff', 'circle-stroke-width': 3, 'circle-pitch-alignment': 'viewport', ...glow('circle-emissive-strength') };
  m.addLayer({ id: 'todo-cluster', type: 'circle', source: 'todos', filter: ['has', 'point_count'], layout: { visibility: 'none' }, paint: { ...todoRing, 'circle-radius': 15, 'circle-stroke-color': ['case', ['>', ['get', 'book'], 0], '#e3411f', '#3a2f8f'] }, ...slot } as never);
  m.addLayer({ id: 'todo', type: 'circle', source: 'todos', filter: ['!', ['has', 'point_count']], layout: { visibility: 'none' }, paint: { ...todoRing, 'circle-radius': 14, 'circle-stroke-color': ['case', ['==', ['get', 'mark'], 'tobook'], '#e3411f', '#3a2f8f'] }, ...slot } as never);
  m.addLayer({ id: 'todo-label', type: 'symbol', source: 'todos', layout: { visibility: 'none', 'text-field': ['case', ['has', 'point_count'], ['concat', '×', ['get', 'point_count']], ['get', 'label']], 'text-font': font, 'text-size': 11.5, 'text-allow-overlap': true, 'text-ignore-placement': false, 'text-padding': 9, 'text-pitch-alignment': 'viewport' }, paint: { 'text-color': '#3a2f8f', ...glow('text-emissive-strength') }, ...slot } as never);

  // DOM markers: bases (numbered rings, Archivo names) and day-trip stamps (that day's kanji).
  // On a day map the base shows a bed instead of its number, so it never reads as a stop.
  const BED = '<span class="bed" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 20v-8a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v8"/><path d="M4 10V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v4"/><path d="M12 4v6"/><path d="M2 18h20"/></svg></span>';
  const narrow = document.getElementById('map-canvas')!.clientWidth < 700;
  const twinOf = (i: number) => stays.findIndex((o, j) => j !== i && km([o.lng, o.lat], [stays[i].lng, stays[i].lat]) < 15);
  stays.forEach((s, i) => {
    const twin = twinOf(i);
    const side = twin >= 0 ? (twin > i ? 'left' : 'none') : 'below'; // names hang below, clear of the day-trip stamps east and west
    const also = twin > i ? stays[twin] : null;
    const el = document.createElement('a');
    el.className = `base-marker ${side}`;
    el.draggable = false;
    el.dataset.stay = String(i);
    el.href = `${base}/#bases`;
    el.title = s.name;
    el.innerHTML = side === 'none' ? `${BED}<span class="n" data-n="${i + 1}">${i + 1}</span>`
      : `${BED}<span class="n" data-n="${i + 1}">${i + 1}</span><span class="nm">${esc(s.name)}${also ? `<span class="also">${twin + 1} · ${esc(also.name)}</span>` : ''}</span><span class="city" lang="ja">${cityJa(s.lng)}</span>`;
    const anchor = ({ left: 'right', below: 'top', none: 'center', right: 'left' } as const)[side];
    const offset = ({ left: [13, 0], below: [0, -13], none: [0, 0], right: [-13, 0] } as const)[side] as [number, number];
    new lib.Marker({ element: el, anchor, offset }).setLngLat([s.lng, s.lat]).addTo(m);
  });
  ov.trips.forEach((tr) => {
    const d = trip.days[tr.day - 1];
    const el = document.createElement('a');
    el.className = 'trip-stamp';
    el.draggable = false;
    el.href = `${base}/day/${d.n}/`;
    el.title = `Day ${d.n} · ${d.title}`;
    el.setAttribute('aria-label', `Day ${d.n} day trip: ${d.title}`);
    el.innerHTML = `<span lang="ja">${esc(d.kanji)}</span>`;
    stampMarkers.push(new lib.Marker({ element: el }).setLngLat([tr.lng, tr.lat]).addTo(m) as unknown as StampMarker);
  });

  // Invisible collision blockers above the basemap: its labels yield wherever our markers stand.
  const blockers = [
    ...stays.map((s) => ({ lng: s.lng, lat: s.lat, text: 'O', size: 24, anchor: 'center', offset: [0, 0] })),
    ...stays.flatMap((s, i) => {
      const twin = twinOf(i);
      if (twin >= 0 && twin < i) return [];
      const text = narrow ? cityEn(s.lng) : twin > i ? `${s.name}\n${twin + 1} ${stays[twin].name}` : s.name;
      if (twin > i) return [{ lng: s.lng, lat: s.lat, text, size: 13, anchor: 'right', offset: [-1.3, 0] }];
      return [{ lng: s.lng, lat: s.lat, text, size: 13, anchor: 'top', offset: [0, 1.1] }];
    }),
    ...ov.trips.map((tr) => ({ lng: tr.lng, lat: tr.lat, text: 'O', size: 28, anchor: 'center', offset: [0, 0] })),
  ];
  m.addSource('blockers', { type: 'geojson', data: { type: 'FeatureCollection', features: blockers.map((b) => ({ type: 'Feature', properties: b, geometry: { type: 'Point', coordinates: [b.lng, b.lat] } })) } } as never);
  m.addLayer({ id: 'blockers', type: 'symbol', source: 'blockers', ...slot, layout: { 'text-field': ['get', 'text'], 'text-font': font, 'text-size': ['get', 'size'], 'text-anchor': ['get', 'anchor'], 'text-offset': ['get', 'offset'], 'text-padding': 9, 'text-allow-overlap': true }, paint: { 'text-opacity': 0 } } as never);

  // Clicking a stop: a popup with the hand-off to Google Maps; on a day, its row is selected too.
  const popup = new lib.Popup({ closeButton: false, offset: 16, maxWidth: '270px', className: 'trip-popup' });
  const onStop = (e: { features?: { properties: Record<string, unknown>; geometry: { coordinates: [number, number] } }[] }) => {
    const f = e.features?.[0];
    if (!f) return;
    const ids = String(f.properties.ids ?? f.properties.id).split(',');
    const here = ids.map((id) => stops.find((s) => s.id === id)).filter((s): s is Stop => !!s);
    popup.setLngLat(f.geometry.coordinates).setHTML(here.map((s) =>
      `<p class="pp-time">Day ${s.d} · ${s.start}–${s.end}</p><p class="pp-name">${esc(s.name)}</p>` +
      `<p class="pp-links"><a href="${base}/day/${s.d}/#${s.id}">Details</a>${s.map ? ` · <a href="${esc(s.map)}" target="_blank" rel="noopener">Google Maps</a>` : ''}</p>`).join('')).addTo(m);
    if (view.kind === 'day' && here[0]?.d === view.day) {
      setActive(here[0].id);
      document.dispatchEvent(new CustomEvent('stage:stop', { detail: { id: here[0].id } }));
    }
  };
  m.on('click', 'todo-cluster', ((e: { features?: { properties: { cluster_id: number }; geometry: { coordinates: [number, number] } }[] }) => {
    const f = e.features?.[0];
    if (!f) return;
    const src = m.getSource('todos') as unknown as { getClusterExpansionZoom: (id: number, cb?: (err: unknown, z: number) => void) => Promise<number> | void };
    const go = (z: number) => m.easeTo({ center: f.geometry.coordinates, zoom: z + 0.3, offset: offset(), duration: reduceMotion ? 0 : 900 });
    // MapLibre returns a promise; Mapbox takes a callback.
    const r = src.getClusterExpansionZoom(f.properties.cluster_id, (err, z) => { if (!err) go(z); });
    if (r && typeof (r as Promise<number>).then === 'function') void (r as Promise<number>).then(go);
  }) as never);
  for (const id of ['day-stops', 'dots', 'todo', 'todo-cluster']) {
    if (id !== 'todo-cluster') m.on('click', id, onStop as never);
    m.on('mouseenter', id, () => { m.getCanvas().style.cursor = 'pointer'; });
    m.on('mouseleave', id, () => { m.getCanvas().style.cursor = ''; });
  }
  m.on('moveend', declutter);
  m.on('moveend', regroup);
  m.once('idle', declutter);
}

/* ── Declutter our own markers: rings first, then day-trip stamps, then labels ── */
type StampMarker = { getElement: () => HTMLElement; setOffset: (o: [number, number]) => unknown };
const stampMarkers: StampMarker[] = [];
function declutter() {
  if (probing || orbiting) return;
  const root = stage();
  const placed: DOMRect[] = [];
  const overlap = (a: DOMRect, b: DOMRect) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
  const hits = (r: DOMRect) => placed.some((p) => overlap(r, p));
  const markers = [...root.querySelectorAll<HTMLElement>('.base-marker')];
  // The visible ring: the number on the overview, the bed on a day map.
  const ring = (mk: HTMLElement) => [...mk.querySelectorAll<HTMLElement>('.n, .bed')].find((x) => getComputedStyle(x).display !== 'none')!;
  markers.forEach((mk) => { mk.classList.remove('merged', 'crowded'); const n = mk.querySelector<HTMLElement>('.n')!; n.textContent = n.dataset.n!; });
  // Same-city rings on the same pixels merge into one "1·4" ring until zoom separates them.
  const lead = markers.find((mk) => mk.classList.contains('left'));
  const twin = markers.find((mk) => mk.classList.contains('none'));
  if (lead && twin && !lead.classList.contains('off-day') && !twin.classList.contains('off-day')) {
    const a = lead.querySelector<HTMLElement>('.n')!; const b = twin.querySelector<HTMLElement>('.n')!;
    if (overlap(ring(lead).getBoundingClientRect(), ring(twin).getBoundingClientRect())) { twin.classList.add('merged'); a.textContent = `${a.dataset.n}·${b.dataset.n}`; }
  }
  markers.filter((mk) => !mk.classList.contains('merged')).forEach((mk) => placed.push(ring(mk).getBoundingClientRect()));
  // Day-trip stamps outrank base names. A stamp sitting on its base's ring (Kyoto and Nara beside
  // Osaka at country zoom) steps out along its own direction, fanning round if that spot is taken.
  const rings = placed.slice();
  for (const mk of stampMarkers) {
    const s = mk.getElement();
    s.classList.remove('crowded');
    mk.setOffset([0, 0]);
    if (getComputedStyle(s).visibility === 'hidden') continue; // hidden by the view (day, bookings)
    const r = s.getBoundingClientRect();
    if (!hits(r)) { placed.push(r); continue; }
    const c = { x: (r.left + r.right) / 2, y: (r.top + r.bottom) / 2 };
    const ringHit = rings.find((p) => overlap(r, p));
    let done = false;
    if (ringHit) {
      const rc = { x: (ringHit.left + ringHit.right) / 2, y: (ringHit.top + ringHit.bottom) / 2 };
      const a0 = Math.atan2(c.y - rc.y, c.x - rc.x);
      const dist = ringHit.width / 2 + r.width / 2 + 5;
      for (const da of [0, 0.7, -0.7, 1.4, -1.4]) {
        const nx = rc.x + Math.cos(a0 + da) * dist; const ny = rc.y + Math.sin(a0 + da) * dist;
        const moved = new DOMRect(nx - r.width / 2, ny - r.height / 2, r.width, r.height);
        if (!hits(moved)) { mk.setOffset([nx - c.x, ny - c.y]); placed.push(moved); done = true; break; }
      }
    }
    if (!done) s.classList.add('crowded');
  }
  markers.forEach((mk) => {
    const label = [...mk.querySelectorAll<HTMLElement>('.nm, .city')].find((x) => getComputedStyle(x).display !== 'none');
    if (!label) return;
    const r = label.getBoundingClientRect();
    if (hits(r)) mk.classList.add('crowded'); else placed.push(r);
  });
}

/* ── Light: the real sun at that place and minute ── */
export function setTime(t: number, at = TOKYO) {
  if (!map) return null;
  const l = lighting(t, at.lat, at.lng);
  stage().dataset.phase = l.phase;
  if (kind === 'maplibre') applyPalette?.(map, l.palette, l);
  else if (l.phase !== lastPhase) (map as unknown as { setConfigProperty: (a: string, b: string, c: string) => void }).setConfigProperty('basemap', 'lightPreset', l.phase);
  lastPhase = l.phase;
  transitLight(l.phase);
  return l;
}

/** Highlight the marker holding this stop (a group can hold several). */
function setActive(stopId: string | null) {
  activeStop = stopId;
  if (!map) return;
  const id = stopId ? groupIndex.get(stopId) ?? null : null;
  if (activeId != null && activeId !== id) map.setFeatureState({ source: 'day-stops', id: activeId }, { active: false });
  if (id != null) map.setFeatureState({ source: 'day-stops', id }, { active: true });
  activeId = id;
}

/** Regroup the shown days' markers for the zoom on screen: rings that would touch merge into one
 *  ("4·5", "6–9", "1·5–7") and split again as you zoom in. The route is redrawn through the rings. */
let groupedAt = '';
let shownDays: number[] = [];
const label = (ms: Stop[]) => {
  const n = [...new Set(ms.map((x) => x.i))].sort((a, b) => a - b);
  const runs: number[][] = [];
  for (const v of n) { const r = runs.at(-1); if (r && v === r.at(-1)! + 1) r.push(v); else runs.push([v]); }
  return runs.map((r) => (r.length > 2 ? `${r[0]}–${r.at(-1)}` : r.join('·'))).join('·');
};
// Ring radius on screen, matching the day-stops circle (radius + stroke), by label length.
const ringR = (text: string) => 11 + (text.length > 3 ? 7 : text.length > 2 ? 4 : 0) + 2.6;
function regroup() {
  if (!map || probing || orbiting) return;
  const m = map;
  const key = `${shownDays.join(',')}@${m.getZoom().toFixed(2)}/${m.getPitch().toFixed(0)}/${m.getBearing().toFixed(0)}`;
  if (key === groupedAt) return;
  groupedAt = key;
  const pointFeatures: object[] = [];
  const routeFeatures: object[] = [];
  for (const day of shownDays) {
    type G = { at: Stop; xy: { x: number; y: number }; members: Stop[] };
    const groups: G[] = stops.filter((x) => x.d === day).map((s) => ({ at: s, xy: m.project([s.lng, s.lat] as never), members: [s] }));
    // Merge any two rings that touch (or stand on the same spot) until none do.
    for (let merged = true; merged;) {
      merged = false;
      outer: for (let a = 0; a < groups.length; a++) {
        for (let b = a + 1; b < groups.length; b++) {
          const ga = groups[a]; const gb = groups[b];
          const gap = ringR(label(ga.members)) + ringR(label(gb.members)) + 4;
          if (Math.hypot(ga.xy.x - gb.xy.x, ga.xy.y - gb.xy.y) < gap || km([ga.at.lng, ga.at.lat], [gb.at.lng, gb.at.lat]) < 0.03) {
            ga.members.push(...gb.members);
            groups.splice(b, 1);
            merged = true;
            break outer;
          }
        }
      }
    }
    groups.forEach((g, gi) => {
      const id = day * 100 + gi;
      g.members.forEach((x) => groupIndex.set(x.id, id));
      pointFeatures.push({ type: 'Feature', id, properties: { day, label: label(g.members), ids: g.members.map((x) => x.id).join(',') }, geometry: { type: 'Point', coordinates: [g.at.lng, g.at.lat] } });
    });
    // With routed legs (public/legs.json) the route follows the real trains, streets and water.
    const dayLegs = legs?.days[String(day)];
    if (dayLegs?.length) {
      for (const leg of dayLegs) for (const sg of leg.segs) routeFeatures.push({ type: 'Feature', properties: { day, m: sg.m, ...(sg.colour ? { colour: sg.colour } : {}) }, geometry: { type: 'LineString', coordinates: sg.coords } });
      continue;
    }
    // Otherwise the route visits the rings in stop order, so no line pokes out past a merged ring.
    const path: [number, number][] = [];
    let last = -1;
    for (const s of stops.filter((x) => x.d === day)) {
      const gid = groupIndex.get(s.id)!;
      if (gid === last) continue;
      last = gid;
      const g = groups[gid - day * 100];
      path.push([g.at.lng, g.at.lat]);
    }
    if (path.length > 1) routeFeatures.push({ type: 'Feature', properties: { day, m: 'line' }, geometry: { type: 'LineString', coordinates: path } });
  }
  if (activeId != null) m.setFeatureState({ source: 'day-stops', id: activeId }, { active: false });
  activeId = null;
  (m.getSource('day-stops') as unknown as { setData: (d: object) => void }).setData({ type: 'FeatureCollection', features: pointFeatures });
  (m.getSource('day-route') as unknown as { setData: (d: object) => void }).setData({ type: 'FeatureCollection', features: routeFeatures });
  // The ink runs as one stroke from the first stop to the last, leg after leg.
  routeLines = shownDays.length === 1 ? [routeFeatures.flatMap((f) => (f as { geometry: { coordinates: [number, number][] } }).geometry.coordinates)] : routeFeatures.map((f) => (f as { geometry: { coordinates: [number, number][] } }).geometry.coordinates);
  if (ink < 1) inkTo(ink);
  setActive(activeStop);
}

/** Show these days' routes and rings (one day on a day page; several during the flyover). */
function showDays(days: number[]) {
  if (!map) return;
  shownDays = days;
  const f = ['in', ['get', 'day'], ['literal', days.length ? days : [-1]]];
  for (const id of ['route-casing', 'day-stops', 'day-stop-numbers']) map.setFilter(id, f as never);
  const m = ['coalesce', ['get', 'm'], 'line'];
  map.setFilter('route', ['all', f, ['!', ['in', m, ['literal', ['walk', 'boat']]]]] as never);
  map.setFilter('route-walk', ['all', f, ['==', m, 'walk']] as never);
  map.setFilter('route-boat', ['all', f, ['==', m, 'boat']] as never);
  map.setFilter('route-flow', ['all', f, ['in', m, ['literal', ['rail', 'ropeway', 'funicular']]]] as never);
  regroup();
}

/* ── Trending nearby + quick adds ── */
let trendMarkers: { mk: { remove: () => void; getElement: () => HTMLElement }; t: ClientTrend }[] = [];
let trendDay: number | null = null;
const TAG = { rising: 'Rising this month', december: 'Big in December', popular: 'Popular now', pick: 'Researched pick' } as const;
const k = (n: number) => (n >= 10000 ? `${Math.round(n / 1000)}k` : n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n));
export const trendsFor = (day: number): ClientTrend[] => trip.trending?.[String(day)] ?? [];

function showTrending(day: number | null) {
  trendMarkers.forEach((x) => x.mk.remove());
  trendMarkers = [];
  trendDay = day;
  paintAdds();
  if (!map || day == null) return;
  for (const t of trendsFor(day)) {
    const el = document.createElement('button');
    el.type = 'button';
    el.className = 'trend-pin';
    el.dataset.trend = t.id;
    el.dataset.tag = t.tag;
    el.setAttribute('aria-label', `${t.name}: ${TAG[t.tag]}, ${walkMin(t.near.km)} minutes' walk from stop ${t.near.i}`);
    el.innerHTML = t.photo ? `<img src="${esc(t.photo)}" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer">` : `<span class="glyph" aria-hidden="true">${esc((t.ja ?? t.name).slice(0, 1))}</span>`;
    el.addEventListener('click', (e) => { e.stopPropagation(); openTrend(day, t.id); });
    const mk = new lib.Marker({ element: el }).setLngLat([t.lng, t.lat]).addTo(map) as unknown as { remove: () => void; getElement: () => HTMLElement };
    trendMarkers.push({ mk, t });
  }
  markAdded();
}
function markAdded() {
  for (const { mk, t } of trendMarkers) mk.getElement().classList.toggle('added', trendDay != null && isAdded(trendDay, t.id));
}
function paintAdds() {
  if (!map) return;
  const day = trendDay;
  const features = day == null ? [] : adds().filter((a) => a.day === day).flatMap((a) => {
    const from = stops.find((s) => s.id === a.afterId);
    return [
      { type: 'Feature', properties: { day: a.day }, geometry: { type: 'Point', coordinates: [a.lng, a.lat] } },
      ...(from ? [{ type: 'Feature', properties: { day: a.day }, geometry: { type: 'LineString', coordinates: [[from.lng, from.lat], [a.lng, a.lat]] } }] : []),
    ];
  });
  (map.getSource('adds') as unknown as { setData: (d: object) => void } | undefined)?.setData({ type: 'FeatureCollection', features });
}
document.addEventListener('adds:change', () => { paintAdds(); markAdded(); if (openTrendId && trendDay != null) openTrend(trendDay, openTrendId, false); });

let trendPopup: { remove: () => void; setLngLat: (c: [number, number]) => unknown; setHTML: (h: string) => unknown; addTo: (m: unknown) => unknown; on: (e: string, f: () => void) => unknown } | null = null;
let openTrendId: string | null = null;
/** The card for a trending place: photo, why it's trending, how far, and the quick add. */
export function openTrend(day: number, id: string, fly = true) {
  const t = trendsFor(day).find((x) => x.id === id);
  if (!map || !t) return;
  const added = isAdded(day, id);
  const why = t.tag === 'pick' ? (t.why ?? '') : t.tag === 'rising' ? `${Math.round((t.rise - 1) * 100)}% more interest than usual this month`
    : t.tag === 'december' ? `Interest ran ${Math.round((t.december - 1) * 100)}% above normal last December`
    : `${k(t.views30)} Wikipedia readers in the last 30 days`;
  const html = `<div class="tc">${t.photo ? `<a class="tc-photo" href="${esc(t.photoPage ?? t.wiki)}" target="_blank" rel="noopener"><img src="${esc(t.photo)}" alt="" referrerpolicy="no-referrer"><span class="tc-credit">Wikimedia Commons</span></a>` : ''}
    <p class="tc-tag" data-tag="${t.tag}">${TAG[t.tag]}</p>
    <p class="tc-name">${esc(t.name)}${t.ja && t.ja !== t.name ? ` <span lang="ja">${esc(t.ja)}</span>` : ''}</p>
    <p class="tc-why">${esc(why)}</p>
    ${t.when ? `<p class="tc-when">${esc(t.when)}${t.check ? ' · <span>check before you go</span>' : ''}</p>` : ''}
    <p class="tc-walk">${walkMin(t.near.km)} min walk from stop ${t.near.i}</p>
    <div class="tc-actions">
      <button type="button" class="tc-add" data-trend-toggle="${esc(t.id)}" data-day="${day}" aria-pressed="${added}">${added ? 'Added to Day ' + day : '+ Add to Day ' + day}</button>
      ${t.tag === 'pick' && t.source ? `<a href="${esc(t.source)}" target="_blank" rel="noopener">Source</a>` : `<a href="${esc(t.wiki)}" target="_blank" rel="noopener">Wikipedia</a>`}
      <a href="https://www.google.com/maps/search/?api=1&query=${t.lat},${t.lng}" target="_blank" rel="noopener">Maps</a>
    </div></div>`;
  if (!trendPopup) {
    trendPopup = new lib.Popup({ closeButton: true, offset: 22, anchor: 'bottom', maxWidth: '290px', className: 'trip-popup trend-popup' }) as unknown as typeof trendPopup;
    trendPopup!.on('close', () => { openTrendId = null; });
  }
  openTrendId = id;
  trendPopup!.setLngLat([t.lng, t.lat]);
  trendPopup!.setHTML(html);
  trendPopup!.addTo(map);
  // The card sits above its pin, so put the pin in the lower part of the open map.
  const c = map.getContainer();
  const open = c.clientHeight - pad.top - pad.bottom;
  if (fly) map.easeTo({ center: [t.lng, t.lat], zoom: Math.max(map.getZoom(), 15), offset: [offset()[0], offset()[1] + Math.min(170, open * 0.28)], duration: reduceMotion ? 0 : 900 });
}
document.addEventListener('click', (e) => {
  const b = (e.target as HTMLElement).closest<HTMLElement>('[data-trend-toggle]');
  if (!b) return;
  const day = Number(b.dataset.day); const id = b.dataset.trendToggle!;
  if (isAdded(day, id)) removeAdd(day, id);
  else { const t = trendsFor(day).find((x) => x.id === id); if (t) addTrend(day, t); }
});

/* ── For the search and Japan helpers (search.ts, japan.ts) ── */
export const stageApi = () => ({ map, lib, offset: offset(), pad, view, stops, stations: transit?.stations ?? [], lines: transit?.lines ?? [], reduceMotion });
/** The day's route as one line, leg after leg (walks, trains, roads), for corridor search. */
export function routeCoords(day: number, fromStop?: string, toStop?: string): [number, number][] {
  const ls = legs?.days[String(day)] ?? [];
  const i0 = fromStop ? ls.findIndex((l) => l.from === fromStop) : 0;
  const i1 = toStop ? ls.findIndex((l) => l.to === toStop) : ls.length - 1;
  const pick = i0 >= 0 && i1 >= i0 ? ls.slice(i0, i1 + 1) : ls;
  const line = pick.flatMap((l) => l.segs.flatMap((sg) => sg.coords));
  if (line.length > 1) return line;
  return stops.filter((s) => s.d === day).map((s) => [s.lng, s.lat] as [number, number]);
}
/** Centre of the part of the map the panel doesn't cover. */
export function openCentre(): { lat: number; lng: number } | null {
  if (!map) return null;
  const c = map.getContainer();
  const p = map.unproject([c.clientWidth / 2 + offset()[0], c.clientHeight / 2 + offset()[1]] as never);
  return { lat: p.lat, lng: p.lng };
}

/* ── Legs: how each hop is travelled (scripts/legs.mjs) ── */
interface LegSeg { m: string; line?: string; colour?: string; coords: [number, number][]; on?: string; off?: string }
interface Leg { from: string; to: string; mode: string; minutes: number; lines: string[]; text: string; segs: LegSeg[] }
let legs: { days: Record<string, Leg[]> } | null = null;
async function loadLegs() {
  try {
    const res = await fetch(`${base}/legs.json`);
    if (!res.ok) return;
    legs = await res.json();
  } catch { return; }
  groupedAt = '';
  regroup();
  if (ink < 1) inkTo(ink);
  transitView();
}

/* ── Transit: Japan's rail network in its own colours, trains flowing along it ── */
interface TransitLine { id: string; name: string; ja: string; colour: string; kind: string; paths: [number, number][][] }
interface Ride { label: string; colour: string; ids: string[] }
interface Transit { lines: TransitLine[]; stations: { name: string; ja: string; lng: number; lat: number }[]; days: Record<string, Ride[]> }
let transit: Transit | null = null;
let transitOn = (() => { try { return localStorage.getItem('jpc:transit') !== 'off'; } catch { return true; } })();
let flowRaf = 0;
// Zoom may only drive the outermost expression, so data terms sit inside each stop.
const isHS = ['==', ['get', 'kind'], 'shinkansen'];
/** Shinkansen from the country view; the rest of the network fades in towards city zoom. */
const zfade = (k: unknown) => ['interpolate', ['linear'], ['zoom'], 6, ['case', isHS, k, 0], 8.5, k];
/** Width by zoom, scaled per line by its kind (and an optional emphasis multiplier). */
const zwidth = (stops: [number, number][], mult: unknown = 1) => ['interpolate', ['exponential', 1.5], ['zoom'], ...stops.flatMap(([z, v]) => [z, ['*', ['get', 'w'], mult, v]])];
const WIDTH = { shinkansen: 1.7, jr: 1.15, subway: 1, rail: 1, monorail: 0.9, tram: 0.8, funicular: 0.9, ropeway: 0.9 } as Record<string, number>;

async function loadTransit(m: AnyMap) {
  try {
    const res = await fetch(`${base}/transit.json`);
    if (!res.ok) return;
    transit = await res.json() as Transit;
  } catch { return; }
  const mb = kind === 'mapbox';
  const slot = mb ? { slot: 'middle' } : {};
  const glow = (prop: string) => (mb ? { [prop]: 1 } : {});
  const features = transit.lines.flatMap((L) => L.paths.map((p) => ({ type: 'Feature', properties: { id: L.id, colour: L.colour, kind: L.kind, w: WIDTH[L.kind] ?? 1, name: L.name }, geometry: { type: 'LineString', coordinates: p } })));
  m.addSource('transit', { type: 'geojson', data: { type: 'FeatureCollection', features }, lineMetrics: false } as never);
  m.addSource('stations', { type: 'geojson', data: { type: 'FeatureCollection', features: transit.stations.map((st) => ({ type: 'Feature', properties: { name: st.name, ja: st.ja }, geometry: { type: 'Point', coordinates: [st.lng, st.lat] } })) } } as never);
  const before = m.getLayer('label-minor') ? 'label-minor' : m.getLayer('legs-casing') ? 'legs-casing' : undefined; // under place names and the trip's own lines
  const width = (base: number, top: number) => zwidth([[6, base * 0.5], [10, base], [15, top]]);
  const layer = (o: object) => m.addLayer({ ...o, ...slot } as never, mb ? undefined : before);
  layer({ id: 'transit-glow', type: 'line', source: 'transit', layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': ['get', 'colour'], 'line-width': width(7, 18), 'line-blur': 6, 'line-opacity': zfade(0.25) } });
  layer({ id: 'transit-casing', type: 'line', source: 'transit', minzoom: 11, layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': '#ffffff', 'line-width': width(3.6, 9), 'line-opacity': zfade(0.5) } });
  layer({ id: 'transit-line', type: 'line', source: 'transit', layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': ['get', 'colour'], 'line-width': width(2.2, 5.5), 'line-opacity': zfade(0.95), ...glow('line-emissive-strength') } });
  layer({ id: 'transit-flow', type: 'line', source: 'transit', minzoom: 9, layout: { 'line-cap': 'butt', 'line-join': 'round' }, paint: { 'line-color': '#ffffff', 'line-width': width(1.2, 2.6), 'line-opacity': 0.9, 'line-dasharray': [0, 4, 3], ...glow('line-emissive-strength') } });
  layer({ id: 'station-dot', type: 'circle', source: 'stations', minzoom: 12, paint: { 'circle-radius': ['interpolate', ['linear'], ['zoom'], 12, 2.2, 16, 5], 'circle-color': '#ffffff', 'circle-stroke-color': '#2a2170', 'circle-stroke-width': ['interpolate', ['linear'], ['zoom'], 12, 1.2, 16, 2], 'circle-pitch-alignment': 'viewport', ...glow('circle-emissive-strength') } });
  layer({ id: 'station-label', type: 'symbol', source: 'stations', minzoom: 13.2, layout: { 'text-field': ['get', 'name'], 'text-font': mb ? ['DIN Pro Medium', 'Arial Unicode MS Regular'] : ['Noto Sans Regular'], 'text-size': 11.5, 'text-offset': [0, 0.9], 'text-anchor': 'top', 'text-optional': true, 'text-padding': 4 }, paint: { 'text-color': '#2a2170', 'text-halo-color': '#ffffff', 'text-halo-width': 1.6 } });
  if (m.getLayer('rail')) m.setLayoutProperty('rail', 'visibility', 'none'); // our lines replace the basemap's hairlines
  transitLight(lastPhase);
  transitView();
  setTransit(transitOn);
  document.dispatchEvent(new CustomEvent('transit:ready'));
}
/** Lines glow at night and sit quieter by day. */
function transitLight(phase: Phase | null) {
  if (!map?.getLayer('transit-glow')) return;
  const night = phase === 'night' ? 1 : phase === 'dusk' || phase === 'dawn' ? 0.6 : 0.15;
  map.setPaintProperty('transit-glow', 'line-opacity', zfade(0.15 + 0.45 * night) as never);
  map.setPaintProperty('transit-casing', 'line-opacity', zfade(0.6 - 0.45 * night) as never);
  map.setPaintProperty('station-label', 'text-color', night > 0.5 ? '#ece9ff' : '#2a2170');
  map.setPaintProperty('station-label', 'text-halo-color', night > 0.5 ? '#100e22' : '#ffffff');
}
/** On a day, the lines that day rides are drawn boldly and flow; the rest of the network steps back. */
function transitView() {
  if (!map?.getLayer('transit-line') || !transit) return;
  const used = view.kind === 'day' ? (transit.days[String(view.day)] ?? []).flatMap((r) => r.ids) : [];
  const isUsed = ['in', ['get', 'id'], ['literal', used.length ? used : ['-']]];
  // With routed legs, your own route carries the colour and the motion; the network is backdrop.
  if (view.kind === 'day' && legs?.days[String(view.day)]?.length) {
    map.setPaintProperty('transit-line', 'line-opacity', zfade(0.28) as never);
    map.setPaintProperty('transit-line', 'line-width', zwidth([[5, 1.2], [10, 1.6], [15, 3.6]]) as never);
    map.setPaintProperty('transit-glow', 'line-width', zwidth([[5, 2], [10, 3], [15, 6]], 0.6) as never);
    map.setFilter('transit-flow', ['==', ['get', 'id'], '-'] as never);
    return;
  }
  const day = view.kind === 'day' && used.length > 0;
  map.setPaintProperty('transit-line', 'line-opacity', zfade(day ? ['case', isUsed, 1, 0.3] : 0.95) as never);
  map.setPaintProperty('transit-line', 'line-width', zwidth([[5, 1.5], [8, 1.8], [10, 2.2], [15, 5.5]], day ? ['case', isUsed, 1.8, 1] : 1) as never);
  map.setPaintProperty('transit-glow', 'line-width', zwidth([[5, 5], [10, 7], [15, 18]], day ? ['case', isUsed, 1.6, 0.8] : 1) as never);
  // Flow: on a day only its own lines; elsewhere the whole network is alive.
  map.setFilter('transit-flow', (day ? isUsed : null) as never);
  map.setPaintProperty('transit-flow', 'line-width', zwidth([[9, 0.8], [15, 2.6]], day ? 1.5 : 1) as never);
}
// Marching dashes, the classic way to make a line run: a short loop of dash patterns.
const FLOW = [[0, 4, 3], [0.5, 4, 2.5], [1, 4, 2], [1.5, 4, 1.5], [2, 4, 1], [2.5, 4, 0.5], [3, 4, 0], [0, 0.5, 3, 3.5], [0, 1, 3, 3], [0, 1.5, 3, 2.5], [0, 2, 3, 2], [0, 2.5, 3, 1.5], [0, 3, 3, 1], [0, 3.5, 3, 0.5]];
function runFlow() {
  cancelAnimationFrame(flowRaf);
  if (!map?.getLayer('transit-flow') || !transitOn || reduceMotion) return;
  let step = -1; let last = 0;
  const tick = (now: number) => {
    if (!transitOn) return;
    if (now - last > 70 && !document.hidden) {
      last = now;
      step = (step + 1) % FLOW.length;
      map!.setPaintProperty('transit-flow', 'line-dasharray', FLOW[step] as never);
      if (map!.getLayer('route-flow')) map!.setPaintProperty('route-flow', 'line-dasharray', FLOW[step] as never);
    }
    flowRaf = requestAnimationFrame(tick);
  };
  flowRaf = requestAnimationFrame(tick);
}
export function setTransit(on: boolean) {
  transitOn = on;
  try { localStorage.setItem('jpc:transit', on ? 'on' : 'off'); } catch { /* private mode */ }
  document.querySelector('[data-transit]')?.setAttribute('aria-pressed', String(on));
  if (!map) return;
  for (const id of ['transit-glow', 'transit-casing', 'transit-line', 'transit-flow', 'station-dot', 'station-label']) if (map.getLayer(id)) setVisible(id, on);
  if (map.getLayer('rail')) setVisible('rail', !on || !transit);
  if (on) runFlow(); else cancelAnimationFrame(flowRaf);
}
class TransitControl {
  private el?: HTMLDivElement;
  onAdd() {
    const el = document.createElement('div');
    el.className = 'maplibregl-ctrl maplibregl-ctrl-group mapboxgl-ctrl mapboxgl-ctrl-group';
    el.innerHTML = `<button type="button" class="orbit-btn" data-transit aria-pressed="${transitOn}" aria-label="Show trains and stations" title="Trains and stations">${trainIcon.replace(/<!--[\s\S]*?-->/, '').replace(/\s(width|height)="24"/g, '')}</button>`;
    el.querySelector('button')!.addEventListener('click', () => setTransit(!transitOn));
    this.el = el;
    return el;
  }
  onRemove() { this.el?.remove(); }
}
/** Fit the camera to one line around today's stops (tapping a "Your trains" chip). */
export function focusLine(ids: string[]) {
  const Ls = (transit?.lines ?? []).filter((l) => ids.includes(l.id));
  if (!map || !Ls.length) return;
  const pts = stops.filter((s) => s.d === view.day);
  // Around today's stops; for the Shinkansen, the stretch between today's first and last stop.
  const [[w, so], [e, n]] = boundsOf(pts.map((s) => [s.lng, s.lat]));
  const near = Ls.flatMap((L) => L.paths.flat().filter(([x, y]) => L.kind === 'shinkansen'
    ? x > w - 0.15 && x < e + 0.15 && y > so - 0.15 && y < n + 0.15
    : pts.some((s) => Math.abs(s.lng - x) < 0.08 && Math.abs(s.lat - y) < 0.06)));
  if (near.length < 2) return;
  if (!transitOn) setTransit(true);
  const side = Math.min(56, Math.round(map.getContainer().clientWidth * 0.08));
  map.fitBounds(boundsOf(near), { padding: { top: pad.top + 56, right: pad.right + side, bottom: pad.bottom + side, left: pad.left + side }, pitch: 40, duration: reduceMotion ? 0 : 1600, maxZoom: 14 } as never);
}

/* ── Orbit: circle the view in 3D around the middle of the open map ── */
let orbiting = false;
let orbitRaf = 0;
class OrbitControl {
  private el?: HTMLDivElement;
  onAdd() {
    const el = document.createElement('div');
    el.className = 'maplibregl-ctrl maplibregl-ctrl-group mapboxgl-ctrl mapboxgl-ctrl-group';
    el.innerHTML = `<button type="button" class="orbit-btn" data-orbit aria-pressed="false" aria-label="Orbit in 3D" title="Orbit in 3D (or right-drag / two-finger twist)">${rotateIcon.replace(/<!--[\s\S]*?-->/, '').replace(/\s(width|height)="24"/g, '')}</button>`;
    el.querySelector('button')!.addEventListener('click', () => setOrbit(!orbiting));
    this.el = el;
    return el;
  }
  onRemove() { this.el?.remove(); }
}
export function setOrbit(on: boolean) {
  if (!map || on === orbiting) return;
  const m = map;
  orbiting = on;
  document.querySelector('[data-orbit]')?.setAttribute('aria-pressed', String(on));
  cancelAnimationFrame(orbitRaf);
  if (!on) { declutter(); regroup(); return; }
  const c = m.getContainer();
  const pivot = m.unproject([c.clientWidth / 2 + offset()[0], c.clientHeight / 2 + offset()[1]] as never);
  const start = () => {
    let last = performance.now();
    const tick = (now: number) => {
      if (!orbiting) return;
      const dt = Math.min(64, now - last); last = now;
      m.easeTo({ bearing: m.getBearing() + dt * 0.008, around: pivot, duration: 0 } as never); // ~8° a second
      orbitRaf = requestAnimationFrame(tick);
    };
    orbitRaf = requestAnimationFrame(tick);
  };
  if (reduceMotion) { orbiting = false; m.easeTo({ pitch: 60, bearing: m.getBearing() + 45, around: pivot, duration: 0 } as never); document.querySelector('[data-orbit]')?.setAttribute('aria-pressed', 'false'); return; }
  if (m.getPitch() < 50) { m.easeTo({ pitch: 60, around: pivot, duration: 900 } as never); m.once('moveend', start); }
  else start();
}

/* ── Views ── */
const setVisible = (id: string, on: boolean) => map?.setLayoutProperty(id, 'visibility', on ? 'visible' : 'none');

/** Ink the day's route in from its first stop to its last: the styled route waits hidden while a
 *  growing copy draws along it (MapLibre doesn't redraw a changed line-gradient; this works on both). */
let ink = 1;
let drawToken = 0;
let routeLines: [number, number][][] = [];
function inkTo(e: number) {
  if (!map) return;
  const part = routeLines.map((line) => {
    const seg = line.slice(1).map((p, i) => km(line[i], p));
    let left = seg.reduce((a, b) => a + b, 0) * e;
    const out: [number, number][] = [line[0]];
    for (let i = 0; i < seg.length && left > 0; i++) {
      const t = Math.min(1, left / (seg[i] || 1e-9));
      const [a, b] = [line[i], line[i + 1]];
      out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]);
      left -= seg[i];
    }
    return { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: out.length > 1 ? out : [line[0], line[0]] } };
  });
  (map.getSource('ink') as unknown as { setData: (d: object) => void } | undefined)?.setData({ type: 'FeatureCollection', features: e >= 1 ? [] : part });
  for (const id of ['route', 'route-walk', 'route-boat']) map.setPaintProperty(id, 'line-opacity', e >= 1 ? 1 : 0);
  map.setPaintProperty('route-flow', 'line-opacity', e >= 1 ? 0.95 : 0);
}
function drawRoute() {
  if (!map) return;
  cancelAnimationFrame(drawRaf);
  const set = (e: number) => {
    ink = e;
    inkTo(e);
  };
  if (reduceMotion) { set(1); return; }
  // The track waits blank while the camera travels, and inks in once it has arrived.
  set(0);
  const token = ++drawToken; // a newer day's ink supersedes this one
  const run = () => {
    if (token !== drawToken) return;
    const start = performance.now();
    const tick = (now: number) => {
      if (token !== drawToken) return;
      const p = Math.min(1, (now - start) / 1600);
      set(p < 1 ? 1 - (1 - p) ** 3 : 1);
      if (p < 1) drawRaf = requestAnimationFrame(tick);
    };
    drawRaf = requestAnimationFrame(tick);
  };
  const m = map;
  if (m.isMoving()) m.once('moveend', run); else run();
}

/** MapLibre breaks a draped route into dashes on flat city streets at street zoom, so its terrain is kept
 *  for the country view and for the one day map where the relief is the point: Hakone. The hillshade
 *  still models every other day's hills. */
const HAKONE = [138.95, 35.15, 139.15, 35.3];
const hakoneDay = (day: number) => stops.some((s) => s.d === day && s.lng > HAKONE[0] && s.lng < HAKONE[2] && s.lat > HAKONE[1] && s.lat < HAKONE[3]);
function relief(v: View) {
  const day = v.kind === 'day';
  const want = !day ? 1.1 : hakoneDay(v.day) ? 1.25 : 0; // Hakone's ridges, raised a little so they read
  // Flat city days keep a whisper of hillshade; at full strength it smudges the streets grey.
  if (map!.getLayer('hillshade')) map!.setPaintProperty('hillshade', 'hillshade-exaggeration', (want === 0 ? 0.15 : ['interpolate', ['linear'], ['zoom'], 5, 0.4, 9, 0.6, 12, 0.8]) as never);
  const t = map!.getTerrain() as { exaggeration?: number } | null;
  if (!want) { if (t) map!.setTerrain(null); return; }
  if (!t || t.exaggeration !== want) map!.setTerrain({ source: 'dem', exaggeration: want });
}

function camera(k: ViewKind, day: number, animate: boolean) {
  if (!map) return;
  const pts = k === 'day' ? dayFrame(day) : k === 'bookings' ? stops.filter((s) => s.mark === 'tobook' || s.mark === 'tocheck') : stops;
  if (!pts.length) return;
  // Breathing room for labels and stamps; a phone can't spare 56px a side.
  const side = Math.min(56, Math.round(map.getContainer().clientWidth * 0.08));
  const inset = { top: pad.top + 56, right: pad.right + side, bottom: pad.bottom + side, left: pad.left + side };
  const pitch = k !== 'day' ? 0 : hakoneDay(day) ? (kind === 'mapbox' ? 58 : 44) : 48; // a touch flatter over Hakone, so no ridge hides a stop
  const coords: [number, number][] = pts.map((s) => [s.lng, s.lat]);
  if (k === 'day') {
    // Keep that night's bed in frame when it is part of the day's area.
    const date = trip.days[day - 1]?.date;
    for (const b of date ? [baseFor(date), baseFor(prevDate(date))] : []) {
      if (b && pts.some((s) => km([s.lng, s.lat], [b.lng, b.lat]) < 15)) coords.push([b.lng, b.lat]);
    }
  }
  const target = fit(coords, inset, pitch, k === 'day' ? -14 : 0, k === 'day' ? 14.6 : 7.4);
  if (!target) return;
  if (!animate || reduceMotion) map.jumpTo(target);
  else map.flyTo({ ...target, duration: 2200, curve: 1.5, essential: true });
}

/** A day that crosses Japan (Osaka → Hiroshima, Osaka → Tokyo) would shrink to two dots, so frame
 *  the place where the day is spent: stops chained within 25 km, weighted by scheduled minutes. */
function dayFrame(day: number) {
  const pts = stops.filter((s) => s.d === day);
  const spread = Math.max(0, ...pts.flatMap((a) => pts.map((b) => km([a.lng, a.lat], [b.lng, b.lat]))));
  if (spread < 50) return pts;
  const clusters: Stop[][] = [];
  for (const s of pts) {
    const near = clusters.find((c) => c.some((o) => km([o.lng, o.lat], [s.lng, s.lat]) < 25));
    if (near) near.push(s); else clusters.push([s]);
  }
  const minutes = (c: Stop[]) => c.reduce((a, s) => a + Math.max(15, (Date.parse(s.e) - Date.parse(s.s)) / 60000 || 0), 0);
  return clusters.reduce((best, c) => (minutes(c) > minutes(best) ? c : best));
}

/** Fit points inside the inset rect at the target pitch and bearing. cameraForBounds only knows a flat
 *  top-down view (MapLibre ignores pitch), so probe the real camera a few times within one frame and
 *  correct zoom and centre from where the points actually land, then put the camera back. */
let probing = false;
function fit(pts: [number, number][], inset: { top: number; right: number; bottom: number; left: number }, pitch: number, bearing: number, maxZoom: number) {
  const m = map!;
  const cam = m.cameraForBounds(boundsOf(pts), { padding: inset, bearing, maxZoom } as never) as { center: [number, number] | { lng: number; lat: number }; zoom: number } | undefined;
  if (!cam) return null;
  const c = m.getContainer();
  const safe = { l: inset.left, t: inset.top, r: c.clientWidth - inset.right, b: c.clientHeight - inset.bottom };
  if (safe.r - safe.l < 40 || safe.b - safe.t < 40) return { center: cam.center, zoom: cam.zoom, pitch, bearing };
  const prev = { center: m.getCenter(), zoom: m.getZoom(), pitch: m.getPitch(), bearing: m.getBearing() };
  let target = { center: cam.center as unknown as { lng: number; lat: number }, zoom: cam.zoom, pitch, bearing };
  probing = true;
  try {
    for (let i = 0; i < 4; i++) {
      m.jumpTo(target as never);
      const xy = pts.map((p) => m.project(p as never));
      const box = { l: Math.min(...xy.map((q) => q.x)), r: Math.max(...xy.map((q) => q.x)), t: Math.min(...xy.map((q) => q.y)), b: Math.max(...xy.map((q) => q.y)) };
      const scale = Math.max((box.r - box.l) / (safe.r - safe.l), (box.b - box.t) / (safe.b - safe.t), 1e-6);
      const dx = (box.l + box.r) / 2 - (safe.l + safe.r) / 2;
      const dy = (box.t + box.b) / 2 - (safe.t + safe.b) / 2;
      const zoom = Math.min(maxZoom, target.zoom - Math.log2(scale));
      const centre = m.unproject([c.clientWidth / 2 + dx, c.clientHeight / 2 + dy] as never);
      const done = Math.abs(zoom - target.zoom) < 0.02 && Math.abs(dx) < 2 && Math.abs(dy) < 2;
      target = { center: { lng: centre.lng, lat: centre.lat }, zoom, pitch, bearing };
      if (done) break;
    }
  } finally {
    m.jumpTo(prev as never);
    probing = false;
  }
  return target;
}

export async function show(next: View, { initial = false } = {}) {
  await boot();
  if (!map) return;
  const changed = initial || next.kind !== view.kind || next.day !== view.day;
  view = next;
  stage().dataset.view = next.kind;
  setOrbit(false);
  // A day shows its own route and rings; the overview maps every day's route (rings stay off).
  showDays(next.kind === 'day' ? [next.day] : next.kind === 'overview' ? trip.days.map((d) => d.n) : []); // moveend regroups at the final zoom
  for (const id of ['day-stops', 'day-stop-numbers']) setVisible(id, next.kind === 'day');
  setVisible('day-tags', next.kind === 'overview');
  showTrending(next.kind === 'day' ? next.day : null);
  transitView();
  const overviewish = next.kind !== 'day';
  setVisible('legs-casing', next.kind === 'overview'); // on bookings they'd read as a route between to-dos
  setVisible('legs', next.kind === 'overview');
  setVisible('trips', next.kind === 'overview');
  setVisible('blockers', overviewish);
  setVisible('dots', next.kind === 'overview');
  for (const id of ['todo', 'todo-cluster', 'todo-label']) setVisible(id, next.kind === 'bookings');
  setActive(null);
  // A day map shows only the beds you leave that morning and reach that night.
  const date = next.kind === 'day' ? trip.days[next.day - 1]?.date : null;
  const beds = new Set(date ? [baseFor(date), baseFor(prevDate(date))].filter(Boolean).map((b) => String(stays.indexOf(b!))) : []);
  stage().querySelectorAll<HTMLElement>('.base-marker').forEach((mk) => mk.classList.toggle('off-day', !!date && !beds.has(mk.dataset.stay!)));
  if (next.kind !== 'day') setTime(previewNow());
  if (kind === 'maplibre') relief(next);
  if (changed) {
    if (next.kind === 'overview' && initial && shouldFly()) await flight();
    else camera(next.kind, next.day, !initial);
  }
  if (next.kind === 'day') drawRoute();
  else { drawToken++; cancelAnimationFrame(drawRaf); ink = 1; inkTo(1); } // leaving a day mid-ink: no half-drawn route left behind
  requestAnimationFrame(declutter);
}

/** Fly to a place that isn't a planned stop (a quick add). */
export async function focusPoint(lng: number, lat: number) {
  await boot();
  if (!map) return;
  const target = { center: [lng, lat] as [number, number], zoom: 16, pitch: 62, offset: offset() };
  if (reduceMotion) map.jumpTo(target); else map.flyTo({ ...target, duration: 1600, essential: true });
}

/** Mark a stop on the day map without moving the camera: the day stays in view. */
export async function pickStop(id: string) {
  await boot();
  setActive(id);
}

export async function focusStop(id: string) {
  await boot();
  const s = stops.find((x) => x.id === id);
  if (!map || !s) return;
  setActive(id);
  const target = { center: [s.lng, s.lat] as [number, number], zoom: 16, pitch: 64, bearing: -20 + (s.i % 6) * 12, offset: offset() };
  if (reduceMotion) map.jumpTo(target); else map.flyTo({ ...target, duration: 1800, essential: true });
}

export function setPadding(p: { top: number; right: number; bottom: number; left: number }) {
  pad = p;
}

/* ── Play the day ── */
export function bindScrubber(root: HTMLElement, day: number) {
  const d = trip.days[day - 1];
  const list = stops.filter((s) => s.d === day);
  if (!list.length) return () => {};
  const range = root.querySelector<HTMLInputElement>('[data-scrub]')!;
  const clock = root.querySelector<HTMLElement>('[data-clock]')!;
  const phaseLabel = root.querySelector<HTMLElement>('[data-phase-label]')!;
  const activeLabel = root.querySelector<HTMLElement>('[data-active-name]')!;
  const play = root.querySelector<HTMLButtonElement>('[data-play]')!;
  const lo = ms(list[0].s) - 30 * 60000;
  const hi = Math.max(ms(list.at(-1)!.e), d.sun ? d.sun.set + 45 * 60000 : 0);
  range.min = String(lo); range.max = String(hi); range.step = String(60000);
  const pos = (t: number) => `${((t - lo) / (hi - lo)) * 100}%`;
  root.querySelectorAll<HTMLElement>('[data-tick]').forEach((tick) => {
    const t = tick.dataset.tick === 'rise' ? d.sun?.rise : d.sun?.set;
    if (!t || t < lo || t > hi) { tick.hidden = true; return; }
    tick.style.left = pos(t); tick.hidden = false;
  });
  let current = -1;
  let t0 = lo;
  const describe = (t: number, l: NonNullable<ReturnType<typeof setTime>>) => {
    if (d.sun && Math.abs(t - d.sun.set) < 12 * 60000) return 'Sunset';
    if (d.sun && Math.abs(t - d.sun.rise) < 12 * 60000) return 'Sunrise';
    if (l.altitude >= 0 && l.altitude < 6) return 'Golden hour';
    if (l.altitude < 0 && l.altitude >= -6) return l.phase === 'dawn' ? 'First light' : 'Blue hour';
    return l.altitude < -6 ? 'Night' : 'Daylight';
  };
  const set = (t: number, fly: boolean) => {
    t0 = t;
    let idx = 0;
    list.forEach((s, i) => { if (ms(s.s) <= t) idx = i; });
    const s = list[idx];
    const l = setTime(t, { lat: s.lat, lng: s.lng });
    clock.textContent = jstClock(t);
    if (l) phaseLabel.textContent = describe(t, l);
    if (Number(range.value) !== t) range.value = String(t);
    if (idx !== current) {
      current = idx;
      activeLabel.textContent = `${s.i} · ${s.name}`;
      setActive(s.id);
      if (fly && map) {
        const target = { center: [s.lng, s.lat] as [number, number], zoom: 15.2, pitch: 66, bearing: -24 + idx * 11, offset: offset() };
        if (reduceMotion) map.jumpTo(target); else map.flyTo({ ...target, duration: 1500, essential: true });
      }
    }
  };
  // On the day itself the scrubber follows the clock, held at the day's ends before and after;
  // any other day opens on its first stop.
  const now = previewNow();
  const onTheDay = now > lo - 6 * 3600000 && now < hi + 8 * 3600000;
  set(onTheDay ? Math.min(hi, Math.max(lo, now)) : ms(list[0].s), false);
  const onInput = () => set(Number(range.value), true);
  range.addEventListener('input', onInput);
  let raf = 0; let last = 0;
  const stopPlay = () => { cancelAnimationFrame(raf); raf = 0; play.setAttribute('aria-pressed', 'false'); root.dataset.playing = 'false'; };
  const step = (frame: number) => {
    const dt = last ? frame - last : 16; last = frame;
    const nextT = t0 + ((hi - lo) / 32000) * dt; // the whole day in ~32 s
    if (nextT >= hi) { set(hi, true); stopPlay(); return; }
    set(nextT, true);
    raf = requestAnimationFrame(step);
  };
  const onPlay = () => {
    if (raf) { stopPlay(); return; }
    if (t0 >= hi - 60000) set(lo, true);
    last = 0; play.setAttribute('aria-pressed', 'true'); root.dataset.playing = 'true';
    raf = requestAnimationFrame(step);
  };
  play.addEventListener('click', onPlay);
  return () => { stopPlay(); range.removeEventListener('input', onInput); play.removeEventListener('click', onPlay); };
}

/* ── Opening flight ── */
function shouldFly() {
  if (reduceMotion || new URLSearchParams(location.search).has('noflight')) return false;
  if (previewNow() >= ms(trip.stops[0].s) - 36 * 3600000) return false; // only before the trip
  try { return sessionStorage.getItem('jpc:flown') !== '1'; } catch { return true; }
}
let flightAbort: (() => void) | null = null;
function stopFlight() { flightAbort?.(); }

export async function flight() {
  await boot();
  if (!map || flying) return;
  const m = map;
  const box = stage().querySelector<HTMLElement>('[data-flight]');
  const caption = box?.querySelector<HTMLElement>('[data-caption]');
  try { sessionStorage.setItem('jpc:flown', '1'); } catch { /* private mode */ }
  flying = true;
  stage().dataset.flying = 'true';
  if (box) box.hidden = false;
  let aborted = false;
  flightAbort = () => { aborted = true; m.stop(); };
  m.jumpTo({ center: [137.6, 35.9], zoom: 4.3, pitch: 0, bearing: 0 });
  // Several days share each frame and their numbers would collide: fly over lines and stop dots only.
  for (const id of ['day-stops', 'day-stop-numbers']) setVisible(id, false);
  setVisible('dots', true);
  for (const k of FLIGHT) {
    if (aborted) break;
    if (caption) caption.textContent = k.caption; // where we're heading
    await new Promise<void>((resolve) => {
      m.once('moveend', () => resolve());
      m.flyTo({ center: [k.center[0], k.center[1]], zoom: k.zoom, pitch: k.pitch, bearing: k.bearing, offset: offset(), duration: 3400, curve: 1.6, essential: true });
    });
    if (aborted) break;
    // On arrival: that place's days, in the light they'll have at that moment of the trip.
    showDays([...k.days]);
    setTime(new Date(`${k.at}:00+09:00`).getTime(), { lat: k.center[1], lng: k.center[0] });
    await new Promise((r) => setTimeout(r, 1600));
  }
  flying = false;
  delete stage().dataset.flying;
  if (box) box.hidden = true;
  flightAbort = null;
  // Back to the page's own days and the real clock.
  for (const id of ['day-stops', 'day-stop-numbers']) setVisible(id, true);
  setVisible('dots', view.kind === 'overview');
  showDays(view.kind === 'day' ? [view.day] : []);
  if (view.kind !== 'day') setTime(previewNow());
  camera(view.kind, view.day, true);
}

document.addEventListener('click', (e) => {
  const t = e.target as HTMLElement;
  if (t.closest('[data-skip-flight]')) stopFlight();
  if (t.closest('[data-replay-flight]')) void flight();
});
