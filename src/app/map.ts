// The 3D map: the trip's route, a day's route in its railways' colours, numbered stop pins, and the
// signature move, a leg playing out along its real path. One instance for the app's whole life.
import type { AppDay, AppLeg, AppStop } from './types';

type MB = typeof import('mapbox-gl').default;
type MbMap = import('mapbox-gl').Map;
type Marker = import('mapbox-gl').Marker;
type Popup = import('mapbox-gl').Popup;
type LngLat = [number, number];
type Phase = 'dawn' | 'day' | 'dusk' | 'night';

const LANTERN = '#f2c46d';
export const colourOf = (m: string, c?: string) => c ?? (m === 'bus' ? '#7fc8a9' : m === 'boat' ? '#79b8ff' : LANTERN);
const reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

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

export class TripMap {
  map: MbMap | null = null;
  private mb: MB | null = null;
  private markers: Marker[] = [];
  private tags: Popup[] = [];
  private phase: Phase | null = null;
  private wantPhase: Phase = 'dusk';
  private anim = 0;
  private stopAnim: (() => void) | null = null;
  ready: Promise<void>;
  failed = false;

  constructor(private el: HTMLElement, private token: string | undefined, private onPick: (id: string) => void, private onDay: (n: number) => void) {
    this.ready = this.init();
  }

  private async init() {
    try {
      const [{ default: mb }] = await Promise.all([import('mapbox-gl'), import('mapbox-gl/dist/mapbox-gl.css')]);
      if (!this.token) throw new Error('no map token');
      mb.accessToken = this.token;
      this.mb = mb;
      const map = new mb.Map({
        container: this.el, style: 'mapbox://styles/mapbox/standard', center: [137.2, 35.3], zoom: 5.4, pitch: 0,
        attributionControl: false, maxPitch: 75,
        config: { basemap: { lightPreset: this.wantPhase, show3dObjects: true, showPointOfInterestLabels: false, showTransitLabels: true, showRoadLabels: false, showPlaceLabels: true } },
      } as never);
      map.addControl(new mb.AttributionControl({ compact: true }), 'bottom-right');
      this.map = map;
      this.phase = this.wantPhase;
      await new Promise<void>((r) => map.on('load', () => r()));
      const empty = { type: 'FeatureCollection', features: [] };
      for (const id of ['trip', 'day', 'play', 'dot']) map.addSource(id, { type: 'geojson', data: empty as never });
      map.addLayer({ id: 'trip', type: 'line', source: 'trip', slot: 'top', layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': LANTERN, 'line-width': 2.4, 'line-opacity': 0.85, 'line-dasharray': [1.2, 1.6], 'line-emissive-strength': 1 } } as never);
      map.addLayer({ id: 'day-glow', type: 'line', source: 'day', slot: 'top', filter: ['!=', ['get', 'm'], 'walk'], layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': ['get', 'colour'], 'line-width': 9, 'line-opacity': 0.16, 'line-blur': 4, 'line-emissive-strength': 1 } } as never);
      map.addLayer({ id: 'day', type: 'line', source: 'day', slot: 'top', layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': ['get', 'colour'], 'line-width': ['case', ['==', ['get', 'm'], 'walk'], 2.2, 3.6], 'line-opacity': 0.9, 'line-dasharray': ['case', ['==', ['get', 'm'], 'walk'], ['literal', [0.6, 1.4]], ['literal', [1, 0]]], 'line-emissive-strength': 1 } } as never);
      map.addLayer({ id: 'play-glow', type: 'line', source: 'play', slot: 'top', layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': ['get', 'colour'], 'line-width': 16, 'line-opacity': 0.35, 'line-blur': 7, 'line-emissive-strength': 1 } } as never);
      map.addLayer({ id: 'play', type: 'line', source: 'play', slot: 'top', layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': ['get', 'colour'], 'line-width': 5.5, 'line-emissive-strength': 1 } } as never);
      map.addLayer({ id: 'dot-halo', type: 'circle', source: 'dot', slot: 'top', paint: { 'circle-radius': 18, 'circle-color': ['get', 'colour'], 'circle-opacity': 0.28, 'circle-blur': 0.8, 'circle-emissive-strength': 1 } } as never);
      map.addLayer({ id: 'dot', type: 'circle', source: 'dot', slot: 'top', paint: { 'circle-radius': 7, 'circle-color': '#fff8ea', 'circle-stroke-width': 3, 'circle-stroke-color': ['get', 'colour'], 'circle-emissive-strength': 1 } } as never);
      // Light changes only when the camera rests, never mid-flight.
      map.on('idle', () => this.applyPhase());
      map.on('mousedown', () => this.stop());
      map.on('touchstart', () => this.stop());
    } catch (e) {
      this.failed = true;
      throw e;
    }
  }

  private applyPhase() {
    if (!this.map || this.anim || this.phase === this.wantPhase) return;
    this.phase = this.wantPhase;
    (this.map as unknown as { setConfigProperty: (a: string, b: string, c: string) => void }).setConfigProperty('basemap', 'lightPreset', this.wantPhase);
  }
  setPhase(p: Phase) { this.wantPhase = p; if (this.map?.loaded() && !this.map.isMoving()) this.applyPhase(); }

  private clearMarkers() { for (const m of this.markers) m.remove(); this.markers = []; }
  private set(id: string, data: unknown) { (this.map?.getSource(id) as unknown as { setData: (d: unknown) => void } | undefined)?.setData(data); }
  private fit(points: LngLat[], opts: { pad?: number; pitch?: number; bearing?: number; max?: number; duration?: number } = {}) {
    if (!this.map || !points.length) return;
    const xs = points.map((p) => p[0]), ys = points.map((p) => p[1]);
    const cam = this.map.cameraForBounds([[Math.min(...xs), Math.min(...ys)], [Math.max(...xs), Math.max(...ys)]], { padding: opts.pad ?? 56, maxZoom: opts.max ?? 15.5, pitch: opts.pitch ?? 0, bearing: opts.bearing ?? 0 } as never);
    if (cam) this.map.flyTo({ ...cam, pitch: opts.pitch ?? 0, bearing: opts.bearing ?? 0, duration: reduce() ? 0 : opts.duration ?? 1400, curve: 1.3, essential: true } as never);
  }
  private dayFeatures(day: AppDay) {
    return Object.values(day.legs).flatMap((l) => l.segs.map((s) => ({ type: 'Feature', properties: { m: s.m, colour: colourOf(s.m, s.colour) }, geometry: { type: 'LineString', coordinates: s.coords } })));
  }

  /** The whole trip: a dashed lantern line between the places it sleeps, one marker per run of days. */
  showTrip(days: AppDay[], todayN: number | null) {
    if (!this.map || !this.mb) return;
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
    for (const g of groups) {
      const el = document.createElement('button');
      el.className = 'mk-place';
      const first = g.days[0], last = g.days.at(-1)!;
      el.setAttribute('aria-label', `${first.city}, day ${first.n}${last !== first ? ` to ${last.n}` : ''}`);
      el.innerHTML = `<span class="mk-kanji">${esc(first.kanji)}</span><span class="mk-days num">${first.n}${last !== first ? `–${last.n}` : ''}</span>`;
      if (g.days.some((d) => d.n === todayN)) el.classList.add('is-today');
      el.addEventListener('click', (e) => { e.stopPropagation(); this.onDay(first.n); });
      this.markers.push(new this.mb.Marker({ element: el, anchor: 'center' }).setLngLat(g.at).addTo(this.map));
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
    // Stops at the same spot share one pin ("3·4").
    const groups: { stops: AppStop[]; at: LngLat }[] = [];
    for (const s of located) {
      const g = groups.find((x) => Math.hypot(x.at[0] - s.lng!, x.at[1] - s.lat!) < 0.00035);
      if (g) g.stops.push(s); else groups.push({ stops: [s], at: [s.lng!, s.lat!] });
    }
    for (const g of groups) {
      const el = document.createElement('button');
      el.className = `mk-stop${g.stops.some((s) => s.cat === 'stay') ? ' is-stay' : ''}`;
      el.dataset.ids = g.stops.map((s) => s.id).join(' ');
      el.setAttribute('aria-label', g.stops.map((s) => `${s.i}. ${s.name}`).join(', '));
      el.innerHTML = `<span class="num">${g.stops.map((s) => s.i).join('·')}</span>`;
      el.addEventListener('click', (e) => { e.stopPropagation(); this.onPick(g.stops[0].id); });
      this.markers.push(new this.mb.Marker({ element: el, anchor: 'center' }).setLngLat(g.at).addTo(this.map));
    }
    this.highlight(selected);
    const sel = located.find((s) => s.id === selected);
    if (sel) this.focus(sel);
    else this.fit(located.map((s) => [s.lng!, s.lat!] as LngLat), { pad: 64, pitch: 38, bearing: -12, max: 15 });
  }

  highlight(id: string | null) {
    for (const m of this.markers) { const el = m.getElement(); el.classList.toggle('is-selected', !!id && (el.dataset.ids ?? '').split(' ').includes(id)); }
  }
  focus(s: AppStop) {
    if (!this.map || s.lat == null) return;
    this.highlight(s.id);
    this.map.flyTo({ center: [s.lng!, s.lat], zoom: Math.max(this.map.getZoom(), 15.4), pitch: 52, bearing: -18, duration: reduce() ? 0 : 1200, essential: true });
  }

  /** The signature move: the leg lights up along its real path, segment by segment, in its own colours. */
  async playLeg(leg: AppLeg, depart: number, arrive: number, onTick: (p: number, clock: string) => void): Promise<void> {
    if (!this.map) return;
    this.stop();
    const map = this.map;
    const pts: { c: LngLat; seg: number; d: number }[] = [];
    leg.segs.forEach((s, si) => s.coords.forEach((c) => {
      const prev = pts.at(-1);
      const d = prev ? prev.d + Math.hypot(c[0] - prev.c[0], (c[1] - prev.c[1]) * 1.2) : 0;
      pts.push({ c, seg: si, d });
    }));
    if (pts.length < 2) return;
    const total = pts.at(-1)!.d || 1;
    const all = pts.map((p) => p.c);
    this.fit(all, { pad: 72, pitch: 50, bearing: -15, max: 15.8, duration: 900 });
    await new Promise((r) => setTimeout(r, reduce() ? 0 : 950));
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
    const draw = (p: number) => {
      const t = p * total;
      let i = pts.findIndex((x) => x.d >= t); if (i < 1) i = 1;
      const a = pts[i - 1], b = pts[i];
      const f = b.d === a.d ? 1 : (t - a.d) / (b.d - a.d);
      const head: LngLat = [a.c[0] + f * (b.c[0] - a.c[0]), a.c[1] + f * (b.c[1] - a.c[1])];
      const features = leg.segs.map((s, si) => {
        const mine = pts.filter((x, k) => x.seg === si && k < i).map((x) => x.c);
        if (si === b.seg) mine.push(head);
        return { type: 'Feature', properties: { colour: colourOf(s.m, s.colour) }, geometry: { type: 'LineString', coordinates: mine } };
      }).filter((x) => x.geometry.coordinates.length > 1);
      this.set('play', { type: 'FeatureCollection', features });
      const seg = leg.segs[b.seg];
      this.set('dot', { type: 'Feature', properties: { colour: colourOf(seg.m, seg.colour) }, geometry: { type: 'Point', coordinates: head } });
      // Station names pop in as the dot reaches them.
      if (seg.on && seg.line) tag(seg.coords[0], `${seg.on} · ${seg.line}`, colourOf(seg.m, seg.colour));
      if (p >= 1 && seg.off) tag(seg.coords.at(-1)!, seg.off, colourOf(seg.m, seg.colour));
      return head;
    };
    if (reduce()) { draw(1); onTick(1, clock(1)); return; }
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
    if (map) map.easeTo({ center: all.at(-1)!, zoom: Math.max(map.getZoom(), 15.6), duration: 900, essential: true });
  }

  /** Stop a playing leg and clear its trail. */
  stop() {
    this.stopAnim?.(); this.stopAnim = null;
    for (const t of this.tags) t.remove();
    this.tags = [];
    this.set('play', { type: 'FeatureCollection', features: [] });
    this.set('dot', { type: 'FeatureCollection', features: [] });
  }
  resize() { this.map?.resize(); }
}
