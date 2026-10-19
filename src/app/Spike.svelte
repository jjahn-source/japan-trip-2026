<script lang="ts">
  // Throwaway spike: one real leg drawing itself on Mapbox 3D with a dot riding it.
  import { onMount } from 'svelte';
  let el: HTMLDivElement;
  let status = $state('loading');
  let progress = $state(0);
  onMount(async () => {
    const [{ default: mapboxgl }] = await Promise.all([import('mapbox-gl'), import('mapbox-gl/dist/mapbox-gl.css')]);
    mapboxgl.accessToken = import.meta.env.PUBLIC_MAPBOX_TOKEN;
    const legs = await (await fetch('/legs.json')).json();
    const leg = legs.days['11'][0];
    const coords: [number, number][] = leg.segs.flatMap((s: { coords: [number, number][] }) => s.coords);
    const colour = leg.segs.find((s: { colour?: string }) => s.colour)?.colour ?? '#e80000';
    const map = new mapboxgl.Map({ container: el, style: 'mapbox://styles/mapbox/standard', center: coords[0], zoom: 14, pitch: 55, config: { basemap: { lightPreset: 'dusk' } } } as never);
    (window as unknown as { __spike: unknown }).__spike = map;
    map.on('load', () => {
      map.addSource('route', { type: 'geojson', lineMetrics: true, data: { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: coords } } });
      map.addLayer({ id: 'route', type: 'line', source: 'route', slot: 'top', layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': colour, 'line-width': 6, 'line-emissive-strength': 1, 'line-trim-offset': [0, 1] } } as never);
      map.addSource('dot', { type: 'geojson', data: { type: 'Point', coordinates: coords[0] } });
      map.addLayer({ id: 'dot', type: 'circle', source: 'dot', slot: 'top', paint: { 'circle-radius': 8, 'circle-color': '#fff', 'circle-stroke-width': 4, 'circle-stroke-color': colour, 'circle-emissive-strength': 1 } } as never);
      // Cumulative distance along the path, so the dot moves at a steady speed.
      const d = [0];
      for (let i = 1; i < coords.length; i++) d.push(d[i - 1] + Math.hypot(coords[i][0] - coords[i - 1][0], coords[i][1] - coords[i - 1][1]));
      const total = d.at(-1)!;
      const at = (p: number): [number, number] => {
        const t = p * total; const i = d.findIndex((x) => x >= t); if (i <= 0) return coords[0];
        const f = (t - d[i - 1]) / (d[i] - d[i - 1]); return [coords[i - 1][0] + f * (coords[i][0] - coords[i - 1][0]), coords[i - 1][1] + f * (coords[i][1] - coords[i - 1][1])];
      };
      status = 'playing';
      const start = performance.now(), dur = 5000;
      const tick = (now: number) => {
        const p = Math.min(1, (now - start) / dur);
        const e = p < 0.5 ? 2 * p * p : 1 - (-2 * p + 2) ** 2 / 2;
        progress = e;
        map.setPaintProperty('route', 'line-trim-offset', [e, 1]);
        (map.getSource('dot') as unknown as { setData: (x: unknown) => void }).setData({ type: 'Point', coordinates: at(e) });
        map.jumpTo({ center: at(e) });
        if (p < 1) requestAnimationFrame(tick); else status = 'done';
      };
      requestAnimationFrame(tick);
    });
  });
</script>

<div class="map" bind:this={el}></div>
<p class="hud" data-status={status}>{status} · {Math.round(progress * 100)}%</p>

<style>
  .map { position: fixed; inset: 0; }
  .hud { position: fixed; left: 16px; bottom: 16px; padding: 8px 12px; border-radius: 10px; background: #000a; color: #fff; font: 600 14px system-ui; }
</style>
