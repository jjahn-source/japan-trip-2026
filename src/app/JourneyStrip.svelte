<script lang="ts">
  // The hop between two stops, drawn as what it is: walking dots, then each train or bus as a bar in
  // its line's own colour, sized by how long it takes. Tap ▶ and the map plays it.
  import { icon } from '../lib/icons';
  import { colourOf } from './map';
  import type { AppLeg, AppSeg, AppStop } from './types';

  let { leg, from, to, active = false, progress = 0, clock = '', onplay }: {
    leg: AppLeg | undefined; from: AppStop; to: AppStop; active?: boolean; progress?: number; clock?: string; onplay?: () => void;
  } = $props();

  const km = (c: [number, number][]) => {
    let d = 0;
    for (let i = 1; i < c.length; i++) {
      const [a, b] = [c[i - 1], c[i]];
      const x = (b[0] - a[0]) * Math.cos(((a[1] + b[1]) / 2) * Math.PI / 180), y = b[1] - a[1];
      d += Math.hypot(x, y) * 111.2;
    }
    return d;
  };
  // Minutes per segment: walking at a group's pace, the rest of the leg's time shared by distance.
  const parts = $derived.by(() => {
    if (!leg) return [] as { seg: AppSeg; min: number }[];
    const segs = leg.segs.filter((s) => s.coords.length > 1);
    const walkMin = (s: AppSeg) => Math.max(1, Math.round((km(s.coords) * 1.25) / 4.5 * 60));
    const walk = segs.filter((s) => s.m === 'walk').reduce((n, s) => n + walkMin(s), 0);
    const rideKm = segs.filter((s) => s.m !== 'walk').reduce((n, s) => n + km(s.coords), 0) || 1;
    const rideMin = Math.max(segs.some((s) => s.m !== 'walk') ? 2 : 0, leg.minutes - walk);
    return segs.map((seg) => ({ seg, min: seg.m === 'walk' ? walkMin(seg) : Math.max(1, Math.round((km(seg.coords) / rideKm) * rideMin)) }));
  });
  const total = $derived(parts.reduce((n, p) => n + p.min, 0) || leg?.minutes || 0);
  const rides = $derived(parts.filter((p) => p.seg.m !== 'walk'));
  const MODE: Record<string, string> = { walk: 'Walk', rail: 'Train', bus: 'Bus', car: 'Taxi', ropeway: 'Ropeway', funicular: 'Cable car', boat: 'Boat' };
  const ICON = { walk: 'footprints', rail: 'transport', bus: 'bus', car: 'car', ropeway: 'mountain', funicular: 'mountain', boat: 'ship' } as const;
  const fare = $derived(from.transport?.match(/¥\s?[\d,]+/)?.[0] ?? null);
</script>

{#if leg && parts.length}
  <div class="strip" class:active>
    <div class="row">
      <span class="when num">{from.end}</span>
      <div class="bar" aria-hidden="true">
        {#each parts as p}
          <span class="seg" data-m={p.seg.m} style:flex-grow={Math.max(p.min, total * 0.08)} style:--c={colourOf(p.seg.m, p.seg.colour)}></span>
        {/each}
        {#if active}<span class="sweep" style:inset-inline-start="{progress * 100}%"></span>{/if}
      </div>
      <span class="when num">{active && clock ? clock : to.start}</span>
      {#if onplay}
        <button class="play" type="button" onclick={onplay} aria-label={`Play the route from ${from.name} to ${to.name} on the map`} aria-pressed={active}>
          {@html icon(active ? 'pause' : 'play')}
        </button>
      {/if}
    </div>
    <ol class="legs">
      {#each parts as p}
        {#if p.seg.m === 'walk'}
          <li class="walk">{@html icon('footprints')}<span>Walk {p.min} min</span></li>
        {:else}
          <li class="ride" style:--c={colourOf(p.seg.m, p.seg.colour)}>
            <span class="ic">{@html icon(ICON[p.seg.m] ?? 'transport')}</span>
            <span class="pill">{p.seg.line ?? MODE[p.seg.m]}</span>
            {#if p.seg.on && p.seg.off}<span class="stations">{p.seg.on} <span class="arrow">→</span> {p.seg.off}</span>{/if}
            <span class="mins num">{p.min} min</span>
          </li>
        {/if}
      {/each}
    </ol>
    <p class="sum"><span class="num">{leg.minutes} min</span>{#if rides.length}<span>· {rides.length === 1 ? MODE[rides[0].seg.m] ?? 'Ride' : `${rides.length} rides`}</span>{/if}{#if fare}<span>· {fare}</span>{/if}</p>
  </div>
{:else if from.transport}
  <div class="strip plain">
    <div class="row"><span class="ic">{@html icon(/taxi|car/i.test(from.transport) ? 'car' : /walk/i.test(from.transport) ? 'footprints' : 'transport')}</span><span class="text">{from.transport}</span></div>
  </div>
{/if}

<style>
  .strip { margin: 2px 0 2px 64px; padding: 10px 12px 11px; border-radius: var(--r-m); background: color-mix(in oklch, var(--night-2) 70%, transparent); border: 1px solid var(--rule); display: grid; gap: 8px; transition: border-color var(--t-med) var(--ease), box-shadow var(--t-med) var(--ease); }
  .strip.active { border-color: color-mix(in oklch, var(--lantern) 60%, transparent); box-shadow: var(--lantern-halo); }
  .row { display: flex; align-items: center; gap: 10px; min-width: 0; }
  .when { font-size: 0.78rem; color: var(--washi-2); flex: none; }
  .bar { position: relative; flex: 1; display: flex; gap: 3px; height: 8px; min-width: 0; }
  .seg { flex-basis: 0; border-radius: 99px; background: var(--c); box-shadow: 0 0 10px -2px var(--c); }
  .seg[data-m='walk'] { background: radial-gradient(circle, var(--c) 1.4px, transparent 1.6px) 0 50% / 7px 8px repeat-x; box-shadow: none; opacity: 0.85; }
  .sweep { position: absolute; top: -4px; width: 16px; height: 16px; margin-inline-start: -8px; border-radius: 50%; background: oklch(98% 0.01 85); box-shadow: 0 0 0 3px var(--lantern), 0 0 16px 2px var(--lantern); transition: inset-inline-start 80ms linear; }
  .play { flex: none; width: 36px; height: 36px; display: grid; place-items: center; border-radius: 50%; border: 1px solid color-mix(in oklch, var(--lantern) 55%, transparent); background: var(--lantern-wash); color: var(--lantern); cursor: pointer; transition: transform var(--t-fast) var(--ease), background var(--t-fast); }
  .play :global(svg) { width: 16px; height: 16px; }
  .play:hover { background: color-mix(in oklch, var(--lantern) 26%, transparent); }
  .play:active { transform: scale(0.94); }
  .legs { list-style: none; padding: 0; display: grid; gap: 5px; }
  .legs li { display: flex; align-items: center; gap: 7px; font-size: 0.82rem; color: var(--washi-2); min-width: 0; }
  .legs :global(svg) { width: 14px; height: 14px; flex: none; }
  .walk { color: var(--washi-3); }
  .ride .ic { color: var(--c); display: grid; }
  .pill { flex: none; padding: 1px 8px 2px; border-radius: 99px; background: var(--c); color: oklch(18% 0.03 280); font-weight: 700; font-size: 0.76rem; white-space: nowrap; }
  .stations { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--washi); }
  .arrow { color: var(--washi-3); }
  .mins { margin-inline-start: auto; flex: none; color: var(--washi-3); }
  .sum { display: flex; gap: 6px; font-size: 0.78rem; color: var(--washi-3); }
  .sum .num { color: var(--lantern); font-weight: 700; }
  .plain .ic { display: grid; color: var(--lantern); }
  .plain .ic :global(svg) { width: 16px; height: 16px; }
  .plain .text { font-size: 0.84rem; color: var(--washi-2); }
</style>
