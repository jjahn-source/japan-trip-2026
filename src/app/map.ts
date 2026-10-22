// The 3D map: the trip's route, a day's route in its railways' colours, numbered stop pins, and the
// signature move, a leg playing out along its real path. One instance for the app's whole life.
import type { AppDay, AppLeg, AppStop } from './types';
// The map's own stylesheet loads with the map, not before the page's first paint.
import mapboxCss from 'mapbox-gl/dist/mapbox-gl.css?url';
import { LANTERN, colourOf, type Phase } from './lines';
export { colourOf, inkOn, phaseAt } from './lines';

type MB = typeof import('mapbox-gl').default;
type MbMap = import('mapbox-gl').Map;
type Marker = import('mapbox-gl').Marker;
type Spot = { stops: AppStop[]; at: LngLat };
/** A pin's numbers: runs shortened ("3–6"), a long scatter kept short ("2 +4"). */
function pinLabel(ns: number[]): string {
  const parts: string[] = [];
  for (let i = 0; i < ns.length;) {
    let j = i;
    while (j + 1 < ns.length && ns[j + 1] === ns[j] + 1) j++;
    parts.push(j - i >= 2 ? `${ns[i]}–${ns[j]}` : ns.slice(i, j + 1).join('·'));
    i = j + 1;
  }
  const s = parts.join('·');
  return s.length <= 7 ? s : `${ns[0]} +${ns.length - 1}`;
}
type Popup = import('mapbox-gl').Popup;
type LngLat = [number, number];

// The places the trip goes, to name a marker by where its days actually are (a day trip to Kyoto
// sleeps in Osaka).
const CITIES: [string, number, number][] = [
  ['Tokyo', 139.74, 35.68], ['Yokohama', 139.64, 35.45], ['Kamakura', 139.55, 35.32], ['Hakone', 139.05, 35.23],
  ['Osaka', 135.5, 34.69], ['Kyoto', 135.76, 35.01], ['Nara', 135.83, 34.69], ['Kobe', 135.19, 34.69],
  ['Hiroshima', 132.46, 34.39], ['Nikko', 139.6, 36.75], ['Fuji', 138.75, 35.45],
];
const cityNear = ([lng, lat]: LngLat) => {
  let best: string | null = null, bd = 0.35; // ~35 km
  for (const [name, x, y] of CITIES) { const d = Math.hypot((x - lng) * 0.82, y - lat); if (d < bd) { bd = d; best = name; } }
  return best;
};
// The city in the app's own night palette: indigo land, deep water, muted parks, slate roads with
// lantern-warm motorways, pale labels. The light still follows the hour (day is brighter than night),
// but daytime no longer turns the map stark white next to the dark app.
const PALETTE = {
  colorLand: 'hsl(234, 26%, 27%)', colorWater: 'hsl(219, 46%, 19%)', colorGreenspace: 'hsl(152, 20%, 27%)',
  colorCommercial: 'hsl(248, 20%, 31%)', colorEducation: 'hsl(240, 18%, 31%)', colorMedical: 'hsl(250, 18%, 32%)', colorIndustrial: 'hsl(232, 16%, 29%)',
  colorRoads: 'hsl(232, 18%, 43%)', colorHdRoads: 'hsl(232, 18%, 43%)', colorTrunks: 'hsl(232, 20%, 50%)', colorMotorways: 'hsl(36, 32%, 52%)',
  colorBuildings: 'hsl(238, 18%, 40%)', colorBuildingHighlight: 'hsl(238, 20%, 48%)',
  colorPlaceLabels: 'hsl(40, 30%, 92%)', colorRoadLabels: 'hsl(230, 20%, 82%)', colorAdminBoundaries: 'hsl(262, 30%, 62%)',
};
const reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

export class TripMap {
  map: MbMap | null = null;
  private mb: MB | null = null;
  private markers: Marker[] = [];
  private tags: Popup[] = [];
  private phase: Phase | null = null;
  private wantPhase: Phase = 'dusk';
  private anim = 0;
  private run = 0;
  /** The day's places (stops at one spot together), the stop selected, and a playing ride's two ends:
   *  what layoutPins() groups into pins for the current zoom. */
  private spots: Spot[] = [];
  private picked: string | null = null;
  private riding = new Set<string>();
  private layoutKey = '';
  private styled = false;
  private pinMarker: Marker | null = null;
  private dot: Marker | null = null;
  private inset = 0;
  private stopAnim: (() => void) | null = null;
  ready: Promise<void>;
  failed = false;

  constructor(private el: HTMLElement, private token: string | undefined, private onPick: (id: string) => void, private onDay: (n: number) => void) {
    this.ready = this.init();
  }

  private async init() {
    try {
      if (!document.querySelector('link[data-mapbox-css]')) {
        const link = Object.assign(document.createElement('link'), { rel: 'stylesheet', href: mapboxCss });
        link.dataset.mapboxCss = '';
        document.head.append(link);
        await new Promise((r) => { link.onload = link.onerror = r; });
      }
      const { default: mb } = await import('mapbox-gl');
      if (!this.token) throw new Error('no map token');
      mb.accessToken = this.token;
      this.mb = mb;
      const map = new mb.Map({
        container: this.el, style: 'mapbox://styles/mapbox/standard', center: [137.2, 35.3], zoom: 5.4, pitch: 0,
        attributionControl: false, maxPitch: 75,
        // A phone's 3× screen would draw 9 pixels per point; 2× is still sharp and less than half the
        // work for the GPU, which is what keeps flights and rides smooth on a phone.
        pixelRatio: Math.min(devicePixelRatio || 1, 2),
        performanceMetricsCollection: false,
        config: { basemap: { lightPreset: this.wantPhase, show3dObjects: true, showPointOfInterestLabels: false, showTransitLabels: true, showRoadLabels: false, showPlaceLabels: true, ...PALETTE } },
      } as never);
      map.addControl(new mb.AttributionControl({ compact: true }), 'bottom-right');
      this.map = map;
      this.phase = this.wantPhase;
      await new Promise<void>((r) => map.on('load', () => r()));
      this.styled = true;
      const empty = { type: 'FeatureCollection', features: [] };
      for (const id of ['trip', 'day', 'play']) map.addSource(id, { type: 'geojson', data: empty as never });
      map.addLayer({ id: 'trip', type: 'line', source: 'trip', slot: 'top', layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': LANTERN, 'line-width': 2.4, 'line-opacity': 0.85, 'line-dasharray': [1.2, 1.6], 'line-emissive-strength': 1 } } as never);
      map.addLayer({ id: 'day-glow', type: 'line', source: 'day', slot: 'top', filter: ['!=', ['get', 'm'], 'walk'], layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': ['get', 'colour'], 'line-width': 9, 'line-opacity': 0.16, 'line-blur': 4, 'line-emissive-strength': 1 } } as never);
      map.addLayer({ id: 'day', type: 'line', source: 'day', slot: 'top', layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': ['get', 'colour'], 'line-width': ['case', ['==', ['get', 'm'], 'walk'], 2.2, 3.6], 'line-opacity': 0.9, 'line-dasharray': ['case', ['==', ['get', 'm'], 'walk'], ['literal', [0.6, 1.4]], ['literal', [1, 0]]], 'line-emissive-strength': 1 } } as never);
      map.addLayer({ id: 'play-glow', type: 'line', source: 'play', slot: 'top', layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': ['get', 'colour'], 'line-width': 16, 'line-opacity': 0.35, 'line-blur': 7, 'line-emissive-strength': 1 } } as never);
      map.addLayer({ id: 'play', type: 'line', source: 'play', slot: 'top', layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': ['get', 'colour'], 'line-width': 5.5, 'line-emissive-strength': 1 } } as never);
      // Light changes only when the camera rests, never mid-flight.
      map.on('idle', () => this.applyPhase());
      // Pins regroup once the camera rests (zoom, rotate, a flight), never frame by frame in a ride.
      map.on('moveend', () => { if (!this.anim) this.layoutPins(); });
      map.on('mousedown', () => this.stop());
      map.on('touchstart', () => this.stop());
    } catch (e) {
      this.failed = true;
      throw e;
    }
  }

  /** Changes the light. At rest it waits for the camera to stop; during a ride (`live`) it changes at
   *  once with a long fade, so the city darkens as the ride's clock passes sunset. */
  private applyPhase(live = false) {
    if (!this.map || (this.anim && !live) || this.phase === this.wantPhase) return;
    this.phase = this.wantPhase;
    const m = this.map as unknown as { style?: { setTransition?: (t: { duration: number; delay: number }) => void }; setConfigProperty: (a: string, b: string, c: string) => void };
    m.style?.setTransition?.({ duration: reduce() ? 0 : live ? 1800 : 600, delay: 0 });
    m.setConfigProperty('basemap', 'lightPreset', this.wantPhase);
  }
  setPhase(p: Phase, live = false) {
    this.wantPhase = p;
    // Our own "style is in" flag: Mapbox's loaded() and isStyleLoaded() both turn false while tiles and
    // resources are coming in, which is always the case while the camera flies, so the light would
    // never change mid-ride.
    if (!this.styled) return;
    if (live) this.applyPhase(true);
    else if (!this.map!.isMoving()) this.applyPhase();
  }

  private clearMarkers() { for (const m of this.markers) m.remove(); this.markers = []; }
  private set(id: string, data: unknown) { (this.map?.getSource(id) as unknown as { setData: (d: unknown) => void } | undefined)?.setData(data); }
  private fit(points: LngLat[], opts: { pad?: number; pitch?: number; bearing?: number; max?: number; duration?: number } = {}) {
    if (!this.map || !points.length) return;
    const xs = points.map((p) => p[0]), ys = points.map((p) => p[1]);
    // Per-side padding with the covered right edge added: a plain number would replace the map's
    // padding, and the panel would lose its place.
    const p = opts.pad ?? 56;
    const padding = { top: p, bottom: p, left: p, right: p + this.inset };
    const cam = this.map.cameraForBounds([[Math.min(...xs), Math.min(...ys)], [Math.max(...xs), Math.max(...ys)]], { padding, maxZoom: opts.max ?? 15.5, pitch: opts.pitch ?? 0, bearing: opts.bearing ?? 0 } as never);
    if (cam) this.map.flyTo({ ...cam, pitch: opts.pitch ?? 0, bearing: opts.bearing ?? 0, duration: reduce() ? 0 : opts.duration ?? 1400, curve: 1.3, essential: true } as never);
  }
  private dayFeatures(day: AppDay) {
    return Object.values(day.legs).flatMap((l) => l.segs.map((s) => ({ type: 'Feature', properties: { m: s.m, colour: colourOf(s.m, s.colour) }, geometry: { type: 'LineString', coordinates: s.coords } })));
  }

  /** The whole trip: a dashed lantern line between the places it sleeps, one marker per run of days. */
  showTrip(days: AppDay[], todayN: number | null) {
    if (!this.map || !this.mb) return;
    this.spots = []; // no day pins to regroup on the trip view
    this.stop(); this.clearMarkers();
    this.set('day', { type: 'FeatureCollection', features: [] });
    const groups: { days: AppDay[]; at: LngLat }[] = [];
    for (const d of days) {
      const pts = d.stops.filter((s) => s.lat != null).map((s) => [s.lng!, s.lat!] as LngLat);
      if (!pts.length) continue;
      const at: LngLat = [pts.map((p) => p[0]).sort((a, b) => a - b)[pts.length >> 1], pts.map((p) => p[1]).sort((a, b) => a - b)[pts.length >> 1]];
      const g = groups.at(-1);
      if (g && Math.hypot(g.at[0] - at[0], g.at[1] - at[1]) < 0.3) g.days.push(d); else groups.push({ days: [d], at });
    }
    this.set('trip', { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: groups.map((g) => g.at) } });
    // A city the trip comes back to gets one marker listing both stays ("1–4 · 12–15").
    const places: { at: LngLat; runs: AppDay[][] }[] = [];
    for (const g of groups) {
      const p = places.find((x) => Math.hypot(x.at[0] - g.at[0], x.at[1] - g.at[1]) < 0.3);
      if (p) p.runs.push(g.days); else places.push({ at: g.at, runs: [g.days] });
    }
    const span = (r: AppDay[]) => `${r[0].n}${r.length > 1 ? `–${r.at(-1)!.n}` : ''}`;
    for (const p of places) {
      const el = document.createElement('button');
      el.className = 'mk-place';
      const first = p.runs[0][0];
      el.innerHTML = `<span class="mk-city">${esc(cityNear(p.at) ?? first.city)}</span><span class="mk-days num"><span class="sr-only">, days </span>${p.runs.map(span).join(' · ')}</span>`;
      if (p.runs.flat().some((d) => d.n === todayN)) el.classList.add('is-today');
      // Opens the stay happening now or next, else the first.
      const pick = p.runs.flat().find((d) => todayN != null && d.n >= todayN) ?? first;
      el.addEventListener('click', (e) => { e.stopPropagation(); this.onDay(pick.n); });
      // Two places close together (Osaka and Kyoto at country zoom): the northern label sits above, the
      // southern one below, so neither covers the other.
      const near = places.find((o) => o !== p && Math.hypot((o.at[0] - p.at[0]) * 0.82, o.at[1] - p.at[1]) < 0.9);
      const offset: [number, number] = near ? [0, p.at[1] > near.at[1] ? -24 : 24] : [0, 0];
      this.markers.push(new this.mb.Marker({ element: el, anchor: 'center', offset }).setLngLat(p.at).addTo(this.map));
      el.setAttribute('role', 'button'); el.removeAttribute('aria-label'); // Mapbox labels markers as images called "Map marker"; these are buttons named by their text
    }
    this.fit(groups.map((g) => g.at), { pad: 48, max: 8 });
  }

  /** A day: its legs in their real colours, its stops as numbered lanterns. */
  showDay(day: AppDay, selected: string | null) {
    if (!this.map || !this.mb) return;
    this.stop(); this.clearMarkers();
    this.set('trip', { type: 'FeatureCollection', features: [] });
    this.set('day', { type: 'FeatureCollection', features: this.dayFeatures(day) });
    const located = day.stops.filter((s) => s.lat != null);
    // Stops at the same spot (a building, a station) are one place for good ("3·4").
    this.spots = [];
    for (const s of located) {
      const g = this.spots.find((x) => Math.hypot(x.at[0] - s.lng!, x.at[1] - s.lat!) < 0.00035);
      if (g) g.stops.push(s); else this.spots.push({ stops: [s], at: [s.lng!, s.lat!] });
    }
    this.picked = selected;
    this.layoutKey = '';
    this.layoutPins();
    const sel = located.find((s) => s.id === selected);
    if (sel) this.focus(sel);
    else this.fit(located.map((s) => [s.lng!, s.lat!] as LngLat), { pad: 64, pitch: 38, bearing: -12, max: 15 });
  }

  highlight(id: string | null) {
    this.picked = id;
    this.layoutPins();
  }

  /** The day's pins as they fit the screen right now: places closer than a lantern's width at this
   *  zoom share one pin ("3–6"); zooming in splits them, and tapping one zooms in to split it. The stop
   *  that's selected, and the two ends of a ride playing, always keep a pin of their own; during a ride
   *  every other pin steps back. Redone when the camera comes to rest, not while it moves. */
  private layoutPins() {
    if (!this.map || !this.mb || !this.spots.length) return;
    const map = this.map;
    const own = (sp: Spot) => sp.stops.some((s) => s.id === this.picked || this.riding.has(s.id));
    type Group = { spots: Spot[]; x: number; y: number; own: boolean };
    // A pin is 28 px tall and as wide as its label ("3" is round, "4–11" a pill): two touch when their
    // boxes would, with a little air.
    const label = (g: Group) => pinLabel(g.spots.flatMap((s) => s.stops.map((x) => x.i)).sort((a, b) => a - b));
    const width = (g: Group) => 28 + Math.max(0, label(g).length - 2) * 7;
    const touch = (a: Group, b: Group) => Math.abs(a.x - b.x) < (width(a) + width(b)) / 2 + 4 && Math.abs(a.y - b.y) < 32;
    const groups: Group[] = this.spots.map((sp) => { const p = map.project(sp.at); return { spots: [sp], x: p.x, y: p.y, own: own(sp) }; });
    // Merge touching pins until none touch (a merged pin is wider, so it can reach a new neighbour).
    for (let merged = true; merged;) {
      merged = false;
      outer: for (let i = 0; i < groups.length; i++) for (let j = i + 1; j < groups.length; j++) {
        const a = groups[i], b = groups[j];
        if (a.own || b.own || !touch(a, b)) continue;
        const n = a.spots.length + b.spots.length;
        a.x = (a.x * a.spots.length + b.x * b.spots.length) / n; a.y = (a.y * a.spots.length + b.y * b.spots.length) / n;
        a.spots.push(...b.spots); groups.splice(j, 1); merged = true;
        break outer;
      }
    }
    const key = `${groups.map((g) => g.spots.map((s) => s.stops[0].id).join(',')).join('|')}/${[...this.riding].join()}`;
    if (key !== this.layoutKey) {
      this.layoutKey = key;
      this.clearMarkers();
      for (const g of groups) {
        const stops = g.spots.flatMap((s) => s.stops).sort((a, b) => a.i - b.i);
        const at: LngLat = g.spots.length === 1 ? g.spots[0].at
          : [g.spots.reduce((n, s) => n + s.at[0], 0) / g.spots.length, g.spots.reduce((n, s) => n + s.at[1], 0) / g.spots.length];
        const el = document.createElement('button');
        el.className = `mk-stop${stops.some((s) => s.cat === 'stay') ? ' is-stay' : ''}${g.spots.length > 1 ? ' is-group' : ''}${this.riding.size && !stops.some((s) => this.riding.has(s.id)) ? ' is-quiet' : ''}`;
        el.dataset.ids = stops.map((s) => s.id).join(' ');
        el.innerHTML = `<span class="num">${pinLabel(stops.map((s) => s.i))}</span><span class="sr-only"> ${stops.map((s) => esc(s.name)).join(', ')}${g.spots.length > 1 ? ' (zooms in)' : ''}</span>`;
        el.addEventListener('click', (e) => {
          e.stopPropagation();
          if (g.spots.length > 1) this.fit(g.spots.map((s) => s.at), { pad: 90, pitch: map.getPitch(), bearing: map.getBearing(), max: 17.5, duration: 700 });
          else this.onPick(stops[0].id);
        });
        this.markers.push(new this.mb.Marker({ element: el, anchor: 'center' }).setLngLat(at).addTo(map));
        el.setAttribute('role', 'button'); el.removeAttribute('aria-label'); // Mapbox labels markers as images called "Map marker"; these are buttons named by their text
      }
    }
    for (const m of this.markers) { const el = m.getElement(); el.classList.toggle('is-selected', !!this.picked && (el.dataset.ids ?? '').split(' ').includes(this.picked)); }
  }
  /** How much of the map's right edge is covered (the laptop details panel); centring uses the rest. */
  /** The camera moves that follow (a stop, a ride, a day) carry it as padding, so the panel and the
   *  flight animate together instead of one interrupting the other. */
  setInset(right: number) { this.inset = right; }
  focus(s: AppStop, instant = false) {
    if (!this.map || s.lat == null) return;
    this.highlight(s.id);
    // On desktop the stop's panel covers the right of the map: centre the stop in what's left.
    // Close enough to see the place, far enough to see where it sits (any panel is in the padding).
    this.map.flyTo({ center: [s.lng!, s.lat], padding: { top: 0, bottom: 0, left: 0, right: this.inset }, zoom: Math.min(16, Math.max(this.map.getZoom(), 15)), pitch: 45, bearing: -18, duration: reduce() || instant ? 0 : 1200, essential: true } as never);
  }

  /** The signature move: the leg lights up along its real path, segment by segment, in its own colours. */
  async playLeg(leg: AppLeg, depart: number, arrive: number, onTick: (p: number, clock: string) => void): Promise<boolean> {
    if (!this.map) return false;
    this.stop();
    const map = this.map;
    const pts: { c: LngLat; seg: number; d: number }[] = [];
    leg.segs.forEach((s, si) => s.coords.forEach((c) => {
      const prev = pts.at(-1);
      const d = prev ? prev.d + Math.hypot(c[0] - prev.c[0], (c[1] - prev.c[1]) * 1.2) : 0;
      pts.push({ c, seg: si, d });
    }));
    if (pts.length < 2) return false;
    // The ride's two ends keep their pins, lit; the rest of the day steps back while it plays.
    this.riding = new Set([leg.from, leg.to]);
    this.layoutPins();
    const total = pts.at(-1)!.d || 1;
    const all = pts.map((p) => p.c);
    this.fit(all, { pad: 72, pitch: 50, bearing: -15, max: 15.8, duration: 900 });
    // Anything that stops playback (a touch on the map, another leg, a new day) bumps the run number.
    const run = ++this.run;
    await new Promise((r) => setTimeout(r, reduce() ? 0 : 950));
    if (run !== this.run) return false;
    const clock = (p: number) => { const m = Math.round(depart + (arrive - depart) * p); return `${String(Math.floor(m / 60) % 24).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`; };
    const shown = new Set<string>();
    const tag = (at: LngLat, text: string, colour: string) => {
      if (!this.mb || shown.has(text)) return;
      shown.add(text);
      const el = document.createElement('div');
      el.className = 'mk-tag';
      el.style.setProperty('--line', colour);
      el.textContent = text;
      this.tags.push(new this.mb.Popup({ closeButton: false, closeOnClick: false, anchor: 'bottom', offset: 14, className: 'tag-pop' }).setLngLat(at).setDOMContent(el).addTo(map));
    };
    // Per frame only the cursor moves forward and an HTML dot is placed; the trail (map data, parsed
    // off the main thread) is redrawn about 20 times a second from pieces prepared once.
    const segPts = leg.segs.map((_, si) => pts.filter((x) => x.seg === si).map((x) => x.c));
    const segStart = leg.segs.map((_, si) => pts.findIndex((x) => x.seg === si));
    const colours = leg.segs.map((s) => colourOf(s.m, s.colour));
    const dotEl = document.createElement('div');
    dotEl.className = 'mk-dot';
    this.dot = new this.mb!.Marker({ element: dotEl, anchor: 'center' }).setLngLat(pts[0].c).addTo(map);
    let cursor = 1, frame = 0, lastSeg = -1;
    const draw = (p: number) => {
      const t = p * total;
      while (cursor < pts.length - 1 && pts[cursor].d < t) cursor++;
      const a = pts[cursor - 1], b = pts[cursor];
      const f = b.d === a.d ? 1 : Math.min(1, Math.max(0, (t - a.d) / (b.d - a.d)));
      const head: LngLat = [a.c[0] + f * (b.c[0] - a.c[0]), a.c[1] + f * (b.c[1] - a.c[1])];
      this.dot?.setLngLat(head);
      if (b.seg !== lastSeg) { dotEl.style.setProperty('--line', colours[b.seg]); lastSeg = b.seg; }
      if (frame++ % 3 === 0 || p >= 1) {
        const features = [];
        for (let si = 0; si <= b.seg; si++) {
          const coords = si < b.seg ? segPts[si] : [...segPts[si].slice(0, Math.max(1, cursor - segStart[si])), head];
          if (coords.length > 1) features.push({ type: 'Feature', properties: { colour: colours[si] }, geometry: { type: 'LineString', coordinates: coords } });
        }
        this.set('play', { type: 'FeatureCollection', features });
      }
      // Station names pop in as the dot reaches them.
      const seg = leg.segs[b.seg];
      if (seg.on && seg.line) tag(seg.coords[0], `${seg.on} · ${seg.line}`, colours[b.seg]);
      if (p >= 1 && seg.off) tag(seg.coords.at(-1)!, seg.off, colours[b.seg]);
      return head;
    };
    if (reduce()) { draw(1); onTick(1, clock(1)); return true; }
    const dur = Math.min(6500, Math.max(3200, leg.minutes * 120));
    const start = performance.now();
    let cam = map.getCenter().toArray() as LngLat;
    await new Promise<void>((resolve) => {
      this.stopAnim = () => { cancelAnimationFrame(this.anim); this.anim = 0; resolve(); };
      const step = (now: number) => {
        const p = Math.min(1, (now - start) / dur);
        const e = p < 0.5 ? 4 * p ** 3 : 1 - (-2 * p + 2) ** 3 / 2;
        const head = draw(e);
        cam = [cam[0] + (head[0] - cam[0]) * 0.08, cam[1] + (head[1] - cam[1]) * 0.08];
        map.jumpTo({ center: cam });
        onTick(e, clock(e));
        if (p < 1) this.anim = requestAnimationFrame(step);
        else { this.anim = 0; this.stopAnim = null; resolve(); }
      };
      this.anim = requestAnimationFrame(step);
    });
    if (run !== this.run) return false;
    map.easeTo({ center: all.at(-1)!, zoom: Math.max(map.getZoom(), 15.6), duration: 900, essential: true });
    return true;
  }

  /** Stop a playing leg and clear its trail. */
  stop() {
    this.run++;
    this.stopAnim?.(); this.stopAnim = null;
    for (const t of this.tags) t.remove();
    this.tags = [];
    this.set('play', { type: 'FeatureCollection', features: [] });
    this.dot?.remove(); this.dot = null;
    if (this.riding.size) { this.riding = new Set(); this.layoutPins(); }
  }
  resize() { this.map?.resize(); }

  /** A place found in search or a nearby pick, dropped as a pin with its name. */
  showPin(p: { lat: number; lng: number; name: string } | null) {
    this.pinMarker?.remove(); this.pinMarker = null;
    if (!p || !this.map || !this.mb) return;
    const el = document.createElement('div');
    el.className = 'mk-pin';
    el.innerHTML = `<span class="mk-pin-name">${esc(p.name)}</span><span class="mk-pin-dot"></span>`;
    this.pinMarker = new this.mb.Marker({ element: el, anchor: 'bottom' }).setLngLat([p.lng, p.lat]).addTo(this.map);
    this.map.flyTo({ center: [p.lng, p.lat], zoom: Math.max(this.map.getZoom(), 16), pitch: 45, duration: reduce() ? 0 : 1100, essential: true });
  }
}
