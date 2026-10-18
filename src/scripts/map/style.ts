// A purpose-built MapLibre style over OpenFreeMap vector tiles (OpenMapTiles schema)
// and Mapterhorn terrain. Every colour is repainted from the sunlight palette.
import type { StyleSpecification, Map as MLMap } from 'maplibre-gl';
import type { Palette } from './light';

const NAME = ['coalesce', ['get', 'name_en'], ['get', 'name:latin'], ['get', 'name']] as const;
const MAJOR = ['motorway', 'trunk', 'primary'];
const MID = ['secondary', 'tertiary'];

export function buildStyle(p: Palette, opts: { terrain: boolean }): StyleSpecification {
  return {
    version: 8,
    // The light is stepped by the clock and the scrubber, so paint changes apply at once. A tween
    // would also be frozen at its first frame in the terrain's cached textures (see applyPalette).
    transition: { duration: 0, delay: 0 },
    glyphs: 'https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf',
    sources: {
      omt: { type: 'vector', url: 'https://tiles.openfreemap.org/planet', attribution: '<a href="https://openfreemap.org">OpenFreeMap</a> © <a href="https://www.openmaptiles.org/">OpenMapTiles</a> Data from <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' },
      ...(opts.terrain ? {
        dem: { type: 'raster-dem', tiles: ['https://tiles.mapterhorn.com/{z}/{x}/{y}.webp'], encoding: 'terrarium', tileSize: 512, maxzoom: 14, attribution: '<a href="https://mapterhorn.com/attribution">© Mapterhorn</a>' },
        // A second handle on the same tiles: MapLibre renders hillshade better off its own source.
        'dem-shade': { type: 'raster-dem', tiles: ['https://tiles.mapterhorn.com/{z}/{x}/{y}.webp'], encoding: 'terrarium', tileSize: 512, maxzoom: 14 },
      } : {}),
    },
    layers: [
      { id: 'bg', type: 'background', paint: { 'background-color': p.bg } },
      { id: 'landcover', type: 'fill', source: 'omt', 'source-layer': 'landcover', filter: ['in', ['get', 'class'], ['literal', ['wood', 'grass', 'farmland', 'scrub']]], paint: { 'fill-color': p.park, 'fill-opacity': 0.55 } },
      { id: 'park', type: 'fill', source: 'omt', 'source-layer': 'park', paint: { 'fill-color': p.park, 'fill-opacity': 0.8 } },
      // Relief over the land cover (woods would otherwise mute it), under water, roads and labels;
      // stronger as you zoom in so Hakone's ridges read at day zoom.
      ...(opts.terrain ? [{
        id: 'hillshade', type: 'hillshade' as const, source: 'dem-shade',
        paint: { 'hillshade-exaggeration': ['interpolate', ['linear'], ['zoom'], 5, 0.4, 9, 0.6, 12, 0.8] as never, 'hillshade-shadow-color': p.shadow, 'hillshade-highlight-color': p.highlight, 'hillshade-accent-color': p.shadow },
      }] : []),
      { id: 'water', type: 'fill', source: 'omt', 'source-layer': 'water', paint: { 'fill-color': p.water } },
      { id: 'waterway', type: 'line', source: 'omt', 'source-layer': 'waterway', paint: { 'line-color': p.water, 'line-width': ['interpolate', ['linear'], ['zoom'], 8, 0.5, 14, 2.5] } },
      { id: 'building', type: 'fill', source: 'omt', 'source-layer': 'building', minzoom: 13, maxzoom: 14.5, paint: { 'fill-color': p.building, 'fill-opacity': 0.8 } },
      { id: 'road-case', type: 'line', source: 'omt', 'source-layer': 'transportation', filter: ['in', ['get', 'class'], ['literal', [...MAJOR, ...MID]]], layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': p.roadCase, 'line-width': ['interpolate', ['exponential', 1.5], ['zoom'], 6, 0.8, 16, 14] } },
      { id: 'road-minor', type: 'line', source: 'omt', 'source-layer': 'transportation', minzoom: 12, filter: ['in', ['get', 'class'], ['literal', ['minor', 'service']]], layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': p.road, 'line-width': ['interpolate', ['exponential', 1.5], ['zoom'], 12, 0.5, 17, 8] } },
      { id: 'road', type: 'line', source: 'omt', 'source-layer': 'transportation', filter: ['in', ['get', 'class'], ['literal', [...MAJOR, ...MID]]], layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': p.road, 'line-width': ['interpolate', ['exponential', 1.5], ['zoom'], 6, 0.4, 16, 10] } },
      { id: 'rail', type: 'line', source: 'omt', 'source-layer': 'transportation', filter: ['in', ['get', 'class'], ['literal', ['rail', 'transit']]], paint: { 'line-color': p.rail, 'line-width': ['interpolate', ['linear'], ['zoom'], 5, 0.8, 8, 1.3, 15, 2.4], 'line-opacity': 0.9 } }, // rail is the stamp rally's own line
      { id: 'building-3d', type: 'fill-extrusion', source: 'omt', 'source-layer': 'building', minzoom: 14, paint: {
        'fill-extrusion-color': p.building,
        'fill-extrusion-height': ['interpolate', ['linear'], ['zoom'], 14, 0, 15, ['coalesce', ['get', 'render_height'], 6]],
        'fill-extrusion-base': ['coalesce', ['get', 'render_min_height'], 0],
        'fill-extrusion-opacity': 0.88,
      } },
      { id: 'label-minor', type: 'symbol', source: 'omt', 'source-layer': 'place', minzoom: 11, filter: ['in', ['get', 'class'], ['literal', ['suburb', 'quarter', 'neighbourhood']]], layout: { 'text-field': NAME as never, 'text-font': ['Noto Sans Regular'], 'text-size': 11.5, 'text-letter-spacing': 0.04, 'text-max-width': 8 }, paint: { 'text-color': p.label, 'text-halo-color': p.halo, 'text-halo-width': 1.4, 'text-opacity': 0.8 } },
      { id: 'label-town', type: 'symbol', source: 'omt', 'source-layer': 'place', minzoom: 7, filter: ['in', ['get', 'class'], ['literal', ['town', 'village']]], layout: { 'text-field': NAME as never, 'text-font': ['Noto Sans Regular'], 'text-size': 12.5, 'text-max-width': 8 }, paint: { 'text-color': p.label, 'text-halo-color': p.halo, 'text-halo-width': 1.5 } },
      { id: 'label-city', type: 'symbol', source: 'omt', 'source-layer': 'place', filter: ['==', ['get', 'class'], 'city'], layout: { 'text-field': NAME as never, 'text-font': ['Noto Sans Bold'], 'text-size': ['interpolate', ['linear'], ['zoom'], 5, 12, 12, 17], 'text-letter-spacing': 0.03, 'text-max-width': 8 }, paint: { 'text-color': p.label, 'text-halo-color': p.halo, 'text-halo-width': 1.8 } },
    ],
  };
}

/** Repaint an existing map for new sunlight without reloading the style. */
export function applyPalette(map: MLMap, p: Palette, sun: { altitude: number; azimuth: number }) {
  const set = (layer: string, prop: string, value: unknown) => {
    if (map.getLayer(layer)) map.setPaintProperty(layer, prop as never, value as never);
  };
  set('bg', 'background-color', p.bg);
  set('hillshade', 'hillshade-shadow-color', p.shadow);
  set('hillshade', 'hillshade-accent-color', p.shadow);
  set('hillshade', 'hillshade-highlight-color', p.highlight);
  // Hillshade light comes from where the sun actually is.
  set('hillshade', 'hillshade-illumination-direction', sun.azimuth);
  set('landcover', 'fill-color', p.park);
  set('park', 'fill-color', p.park);
  set('water', 'fill-color', p.water);
  set('waterway', 'line-color', p.water);
  set('building', 'fill-color', p.building);
  set('building-3d', 'fill-extrusion-color', p.building);
  set('road-case', 'line-color', p.roadCase);
  set('road', 'line-color', p.road);
  set('road-minor', 'line-color', p.road);
  set('rail', 'line-color', p.rail);
  for (const id of ['label-minor', 'label-town', 'label-city']) { set(id, 'text-color', p.label); set(id, 'text-halo-color', p.halo); }
  // Our own layers (stage.ts) follow the light too: lines and halos invert at night; rings stay white.
  for (const id of ['route-casing', 'legs-casing']) set(id, 'line-color', p.routeHalo);
  for (const id of ['legs', 'trips', 'route-walk', 'route-boat', 'route-ink', 'add-spur']) set(id, 'line-color', p.route);
  set('route', 'line-color', ['coalesce', ['get', 'colour'], p.route]); // train legs keep their line's colour
  const active = (on: string, off: string) => ['case', ['boolean', ['feature-state', 'active'], false], on, off];
  set('day-stops', 'circle-color', active('#e3411f', p.stopFill));
  set('day-stops', 'circle-stroke-color', active('#ffffff', '#3a2f8f'));
  set('day-stop-numbers', 'text-color', active('#ffffff', p.stopText));
  set('dots', 'circle-color', p.stopFill);
  set('dots', 'circle-stroke-color', '#3a2f8f');
  for (const id of ['todo', 'todo-cluster']) set(id, 'circle-color', p.stopFill);
  for (const id of ['todo-label']) set(id, 'text-color', p.stopText);
  map.setSky({
    'sky-color': p.sky, 'horizon-color': p.horizon, 'fog-color': p.fog,
    'sky-horizon-blend': 0.6, 'horizon-fog-blend': 0.55, 'fog-ground-blend': 0.35,
    // The globe's haze belongs at world zoom only; by the country view (z5+) it would wash every ink out.
    'atmosphere-blend': ['interpolate', ['linear'], ['zoom'], 0, 0.8, 3, 0.4, 5, 0],
  });
  map.setLight({
    anchor: 'map',
    position: [1.4, sun.azimuth, Math.min(89, Math.max(5, 90 - sun.altitude))],
    color: p.light,
    intensity: p.intensity,
  });
  // Under terrain, MapLibre 6 caches the draped layers per tile and only re-renders them when tiles,
  // zoom or visible layers change, never for a paint change, so the new light would not show.
  // Drop the cached textures; they re-render on the next frame. (Internal API, pinned 6.11.)
  (map as unknown as { terrain?: { tileManager?: { releaseAllRTT?: () => void } } }).terrain?.tileManager?.releaseAllRTT?.();
  map.triggerRepaint();
}
