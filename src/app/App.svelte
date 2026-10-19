<script lang="ts">
  // The whole app: a top bar, the 3D map (top of the phone, right of the desktop), and one pane that
  // is the trip, a day, the bookings or the budget. Every interaction goes through the store, so the
  // URL, the back button, the map and the pane always agree.
  import { onMount, untrack } from 'svelte';
  import { icon } from '../lib/icons';
  import { app, bindHistory, dayOf, go, href, load, now, openSheet, stopOf, ticks, todayN, type View } from './state.svelte';
  import { minutesOf } from './types';
  import { TripMap, phaseAt } from './map';
  import { alerts, type Alert } from './alerts';
  import TripHome from './TripHome.svelte';
  import DayView from './DayView.svelte';
  import Lists from './Lists.svelte';
  import StopSheet from './StopSheet.svelte';
  import Search from './Search.svelte';

  let { initial }: { initial: View } = $props();
  app.view = untrack(() => initial);

  let loadError = $state(false);
  let mapEl = $state<HTMLElement>();
  let map: TripMap | null = null;
  let mapReady = $state(false);
  let mapFailed = $state(false);
  let bigMap = $state(false);
  let alertList = $state<Alert[]>([]);
  let lastDay = $state<number | null>(null);

  const retry = () => { loadError = false; load().catch(() => (loadError = true)); };

  onMount(() => {
    const unbind = bindHistory();
    load().then((d) => alerts(d, todayN()).then((a) => (alertList = a))).catch(() => (loadError = true));
    let cancelled = false;
    // The map loads after first paint, so the day's text is readable before the 3D city arrives.
    const start = () => {
      if (cancelled || !mapEl) return;
      map = new TripMap(mapEl, import.meta.env.PUBLIC_MAPBOX_TOKEN, (id) => openSheet(id), (n) => go({ kind: 'day', n }));
      map.ready.then(() => { if (!cancelled) mapReady = true; }, (e) => { console.warn('Map unavailable:', e); if (!cancelled) mapFailed = true; });
    };
    const idle = (window as { requestIdleCallback?: (f: () => void, o?: { timeout: number }) => number }).requestIdleCallback;
    if (idle) idle(start, { timeout: 700 }); else setTimeout(start, 1);
    const ro = new ResizeObserver(() => map?.resize());
    if (mapEl) ro.observe(mapEl);
    return () => { cancelled = true; unbind(); ro.disconnect(); map?.stop(); map?.map?.remove(); map = null; };
  });

  const day = $derived(app.view.kind === 'day' ? dayOf(app.view.n) ?? null : null);
  const sheet = $derived(app.sheet ? stopOf(app.sheet) : null);
  const today = $derived(app.data ? todayN() : null);
  $effect(() => { if (app.view.kind === 'day') lastDay = app.view.n; });
  const daysTarget = $derived<View>({ kind: 'day', n: lastDay ?? today ?? 1 });
  const urgent = $derived.by(() => {
    if (!app.data) return 0;
    const soon = now() + 7 * 864e5;
    return app.data.todos.filter((x) => x.due && !ticks[x.id] && Date.parse(`${x.due}T23:59:59+09:00`) < soon).length;
  });

  // ── Map follows the store ──
  const mapKey = $derived(app.view.kind === 'day' ? `day:${app.view.n}` : 'trip');
  $effect(() => {
    const key = mapKey, data = app.data;
    if (!mapReady || !data || !map) return;
    untrack(() => {
      app.pin = null;
      if (key === 'trip') map!.showTrip(data.days, todayN());
      else { const d = dayOf(Number(key.slice(4))); if (d) map!.showDay(d, app.selected); }
    });
  });
  $effect(() => { const s = app.selected; if (mapReady) untrack(() => map?.highlight(s)); });
  $effect(() => {
    const id = app.sheet;
    if (!mapReady || !id) return;
    untrack(() => { const f = stopOf(id); if (f && app.view.kind === 'day' && app.view.n === f.day.n) map?.focus(f.stop); });
  });
  $effect(() => { const p = app.pin; if (mapReady) untrack(() => map?.showPin(p)); });

  // The light: the hour of the leg playing or the stop open, else the hour it is on the day itself.
  let playMinute = $state<number | null>(null);
  const phase = $derived.by(() => {
    if (!day) return 'dusk' as const;
    const open = day.stops.find((s) => s.id === app.sheet);
    const m = playMinute ?? (open ? minutesOf(open.startISO, day.date) : today === day.n ? minutesOf(new Date(now()).toISOString(), day.date) : null);
    return m == null ? ('dusk' as const) : phaseAt(m, day.sun);
  });
  $effect(() => { const p = phase; if (mapReady) untrack(() => map?.setPhase(p)); });

  // ── Leg playback: the strip and the map run on one clock ──
  let playRun = 0;
  const hhmm = (m: number) => `${String(Math.floor(m / 60) % 24).padStart(2, '0')}:${String(((m % 60) + 60) % 60).padStart(2, '0')}`;
  async function play(fromId: string) {
    const d = day;
    const leg = d?.legs[fromId];
    const i = d?.stops.findIndex((s) => s.id === fromId) ?? -1;
    if (!d || !leg || i < 0 || !d.stops[i + 1]) return;
    // The button stops a leg that is playing; once it has arrived, it plays it again.
    if (app.playing === fromId && app.progress < 1) { app.playing = null; app.progress = 0; app.clock = ''; return; }
    const from = d.stops[i], to = d.stops[i + 1];
    const arrive = minutesOf(to.startISO, d.date);
    const depart = Math.min(arrive, Math.max(minutesOf(from.endISO, d.date), arrive - leg.minutes));
    const my = ++playRun;
    app.playing = fromId; app.progress = 0; app.clock = hhmm(depart); playMinute = depart;
    const tickFn = (p: number, c: string) => { if (my === playRun) { app.progress = p; app.clock = c; } };
    const done = map && mapReady && leg.segs.some((s) => s.coords.length > 1)
      ? await map.playLeg(leg, depart, arrive, tickFn)
      : await stripOnly(my, depart, arrive, tickFn);
    if (my !== playRun) return;
    if (!done) { app.playing = null; app.progress = 0; app.clock = ''; playMinute = null; }
  }
  // Without the map (offline, no token), the strip still plays.
  function stripOnly(my: number, depart: number, arrive: number, onTick: (p: number, c: string) => void) {
    return new Promise<boolean>((resolve) => {
      const t0 = performance.now(), dur = 2600;
      const step = (t: number) => {
        if (my !== playRun) return resolve(false);
        const p = Math.min(1, Math.max(0, (t - t0) / dur)), e = 1 - (1 - p) ** 3;
        onTick(e, hhmm(Math.round(depart + (arrive - depart) * e)));
        if (p < 1) requestAnimationFrame(step); else resolve(true);
      };
      requestAnimationFrame(step);
    });
  }
  // Leaving the day, or any reset of `playing`, ends playback and clears the trail.
  $effect(() => { if (!app.playing) untrack(() => { playRun++; playMinute = null; map?.stop(); }); });

  const pickPlace = (lat: number, lng: number, name: string) => { app.pin = { lat, lng, name }; };
  const directions = (p: { lat: number; lng: number }) => `https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lng}&travelmode=transit`;
  const quiet = $derived(app.view.kind === 'bookings' || app.view.kind === 'budget');
</script>

<div class="shell">
  <header class="bar">
    <a class="mark" href={href({ kind: 'trip' })} onclick={(e) => go({ kind: 'trip' }, e)} aria-current={app.view.kind === 'trip' ? 'page' : undefined}>
      <span class="display" aria-hidden="true">八</span><span class="sr-only">Trip overview</span>
    </a>
    <nav class="tabs" aria-label="Sections">
      <a href={href(daysTarget)} onclick={(e) => go(daysTarget, e)} aria-current={app.view.kind === 'day' ? 'page' : undefined}>{@html icon('map')}<span>Days</span></a>
      <a href={href({ kind: 'bookings' })} onclick={(e) => go({ kind: 'bookings' }, e)} aria-current={app.view.kind === 'bookings' ? 'page' : undefined}>
        {@html icon('checklist')}<span>Bookings</span>{#if urgent}<b class="badge num" aria-label={`${urgent} due within a week`}>{urgent}</b>{/if}
      </a>
      <a href={href({ kind: 'budget' })} onclick={(e) => go({ kind: 'budget' }, e)} aria-current={app.view.kind === 'budget' ? 'page' : undefined}>{@html icon('wallet')}<span>Budget</span></a>
    </nav>
    <button type="button" class="find" onclick={() => (app.search = true)} aria-label="Search stops and nearby places" aria-keyshortcuts="/ Meta+K">
      {@html icon('search')}<span class="kbd" aria-hidden="true">/</span>
    </button>
  </header>

  <div class="body">
    <section class="stage" class:big={bigMap} class:quiet aria-label="Map">
      <div class="map" bind:this={mapEl}></div>
      {#if mapFailed}
        <p class="nomap">The map can't load right now. Everything else works, and each stop's Directions button opens Google Maps.</p>
      {:else if !mapReady}
        <div class="maploading" aria-hidden="true"></div>
      {/if}
      {#if app.playing && app.clock}
        <p class="clock display num">{app.clock}</p>
      {/if}
      {#if app.pin}
        <div class="pincard" role="status">
          <span class="pin-txt"><b>{app.pin.name}</b>{#if app.pin.sub}<small>{app.pin.sub}</small>{/if}</span>
          <a href={directions(app.pin)} target="_blank" rel="noopener">{@html icon('navigation')}<span>Go</span></a>
          {#if app.pin.web}<a href={app.pin.web} target="_blank" rel="noopener">{@html icon('globe')}<span>Site</span></a>{/if}
          <button type="button" onclick={() => (app.pin = null)} aria-label="Remove the pin">{@html icon('x')}</button>
        </div>
      {/if}
      <button type="button" class="grow" onclick={() => (bigMap = !bigMap)} aria-label={bigMap ? 'Smaller map' : 'Bigger map'} aria-pressed={bigMap}>{@html icon('next')}</button>
    </section>

    <main class="pane" data-scroll>
      {#if alertList.length}
        <div class="alerts" data-level={alertList.some((a) => a.severe) ? 'severe' : 'notice'} role="alert">
          {@html icon('alert')}
          <ul>{#each alertList as a}<li>{a.text} · <a href={a.href} target="_blank" rel="noopener">JMA</a></li>{/each}</ul>
        </div>
      {/if}
      {#if app.data}
        {#key app.view.kind === 'day' ? `d${app.view.n}` : app.view.kind}
          <div class="enter">
            {#if app.view.kind === 'trip'}<TripHome />
            {:else if app.view.kind === 'day'}
              {#if day}<DayView {day} onplay={play} onpick={pickPlace} />
              {:else}<p class="missing">There's no day {app.view.n}. <a href={href({ kind: 'trip' })} onclick={(e) => go({ kind: 'trip' }, e)}>See all days</a></p>{/if}
            {:else}<Lists mode={app.view.kind} />{/if}
          </div>
        {/key}
      {:else if loadError}
        <div class="missing">
          <p>The trip didn't load. Check the connection, then try again.</p>
          <button type="button" class="retry" onclick={retry}>Try again</button>
        </div>
      {:else}
        <div class="skeleton" aria-busy="true" aria-label="Loading the trip">
          <span style:width="38%"></span><span style:width="72%" class="tall"></span><span></span><span></span><span style:width="84%"></span><span></span>
        </div>
      {/if}
    </main>
  </div>

  {#if sheet}<StopSheet stop={sheet.stop} day={sheet.day} />{/if}
  <Search />
</div>

<style>
  .shell { min-height: 100svh; }
  .bar {
    position: sticky; top: 0; z-index: 40; display: flex; align-items: center; gap: 6px;
    height: calc(var(--bar-h) + env(safe-area-inset-top, 0px)); padding: env(safe-area-inset-top, 0px) max(10px, env(safe-area-inset-right, 0px)) 0 var(--gutter);
    background: var(--night); border-bottom: 1px solid var(--rule);
  }
  .mark { display: grid; place-items: center; width: 40px; height: 40px; margin-left: -6px; border-radius: 12px; color: var(--lantern); text-decoration: none; font-size: 1.6rem; line-height: 1; transition: background var(--t-fast); }
  .mark[aria-current='page'] { background: var(--lantern-wash); }
  .tabs { display: flex; gap: 2px; flex: 1; min-width: 0; }
  .tabs a { position: relative; display: inline-flex; align-items: center; gap: 6px; height: 40px; padding: 0 11px; border-radius: 12px; color: var(--washi-2); text-decoration: none; font-size: 0.86rem; font-weight: 700; transition: color var(--t-fast), background var(--t-fast); }
  .tabs a :global(svg) { width: 17px; height: 17px; flex: none; }
  .tabs a:hover { color: var(--washi); }
  .tabs a[aria-current='page'] { color: var(--lantern); background: var(--lantern-wash); }
  .badge { min-width: 18px; height: 18px; padding: 0 5px; display: grid; place-items: center; border-radius: 99px; background: var(--noren); color: var(--on-noren); font-size: 0.68rem; font-weight: 700; }
  .find { display: inline-flex; align-items: center; gap: 8px; height: 40px; padding: 0 10px; border-radius: 12px; border: 1px solid var(--rule); background: var(--night-2); color: var(--washi); cursor: pointer; }
  .find :global(svg) { width: 18px; height: 18px; color: var(--lantern); }
  .kbd { display: none; padding: 0 6px; border-radius: 6px; border: 1px solid var(--rule); color: var(--washi-3); font-size: 0.72rem; }
  @media (max-width: 400px) { .tabs a > :global(svg) { display: none; } .tabs a { padding: 0 10px; } }

  .stage { position: sticky; top: calc(var(--bar-h) + env(safe-area-inset-top, 0px)); z-index: 30; height: 40svh; background: var(--night-2); transition: height var(--t-med) var(--ease); border-bottom: 1px solid var(--rule); overflow: hidden; }
  .stage.big { height: 70svh; }
  .stage.quiet { display: none; }
  .map { position: absolute; inset: 0; }
  .maploading { position: absolute; inset: 0; background: radial-gradient(60% 50% at 50% 60%, oklch(83% 0.145 76 / 0.12), transparent 70%), var(--night-2); animation: breathe 1.8s var(--ease-in-out) infinite alternate; }
  @keyframes breathe { to { opacity: 0.55; } }
  .nomap { position: absolute; inset: 0; display: grid; place-items: center; padding: 24px; text-align: center; color: var(--washi-2); font-size: 0.88rem; }
  .clock { position: absolute; top: 10px; left: 12px; padding: 2px 12px 4px; border-radius: 12px; background: oklch(19% 0.05 276 / 0.82); color: var(--lantern); font-size: 1.7rem; line-height: 1.1; text-shadow: 0 0 18px oklch(83% 0.145 76 / 0.55); pointer-events: none; }
  .grow { position: absolute; bottom: 10px; left: 50%; translate: -50% 0; width: 44px; height: 26px; display: grid; place-items: center; border-radius: 99px; border: 1px solid var(--rule); background: oklch(19% 0.05 276 / 0.85); color: var(--washi-2); cursor: pointer; }
  .grow :global(svg) { width: 16px; height: 16px; rotate: 90deg; transition: rotate var(--t-med) var(--ease); }
  .grow[aria-pressed='true'] :global(svg) { rotate: -90deg; }
  .pincard { position: absolute; left: 10px; right: 10px; bottom: 44px; display: flex; align-items: center; gap: 6px; padding: 8px 8px 8px 14px; border-radius: var(--r-m); background: var(--night-2); border: 1px solid oklch(64% 0.2 31 / 0.55); animation: up var(--t-med) var(--ease); }
  @keyframes up { from { opacity: 0; transform: translateY(10px); } }
  .pin-txt { flex: 1; min-width: 0; display: grid; font-size: 0.9rem; }
  .pin-txt b { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .pin-txt small { color: var(--washi-3); font-size: 0.76rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .pincard a, .pincard button { flex: none; display: inline-flex; align-items: center; gap: 4px; height: 36px; padding: 0 10px; border-radius: 99px; border: 1px solid var(--rule); background: none; color: var(--lantern); font-size: 0.8rem; font-weight: 700; text-decoration: none; cursor: pointer; }
  .pincard button { width: 36px; padding: 0; justify-content: center; color: var(--washi-2); }
  .pincard :global(svg) { width: 15px; height: 15px; }

  .pane { position: relative; z-index: 1; min-width: 0; }
  .enter { animation: enter var(--t-slow) var(--ease); }
  @keyframes enter { from { opacity: 0; transform: translateY(6px); } }
  .alerts { display: flex; gap: 10px; align-items: flex-start; margin: 12px max(16px, env(safe-area-inset-right, 0px)) 0 var(--gutter); padding: 10px 12px; border-radius: var(--r-m); background: var(--lantern-wash); color: var(--washi); font-size: 0.86rem; }
  .alerts[data-level='severe'] { background: var(--noren-wash); border: 1px solid var(--noren); }
  .alerts :global(svg) { flex: none; width: 18px; height: 18px; color: var(--lantern); margin-top: 1px; }
  .alerts[data-level='severe'] :global(svg) { color: var(--noren); }
  .alerts ul { list-style: none; padding: 0; display: grid; gap: 4px; }
  .missing { padding: 32px var(--gutter); display: grid; gap: 12px; justify-items: start; color: var(--washi-2); }
  .retry { height: 44px; padding: 0 18px; border-radius: 99px; border: 0; background: var(--lantern); color: oklch(20% 0.05 276); font-weight: 700; cursor: pointer; }
  .skeleton { padding: 24px max(16px, env(safe-area-inset-right, 0px)) 24px var(--gutter); display: grid; gap: 14px; }
  .skeleton span { height: 16px; width: 100%; border-radius: 8px; background: linear-gradient(90deg, var(--night-2), var(--night-3), var(--night-2)) 0 0 / 200% 100%; animation: shimmer 1.4s linear infinite; }
  .skeleton .tall { height: 44px; }
  @keyframes shimmer { to { background-position: -200% 0; } }

  @media (min-width: 900px) {
    .shell { height: 100svh; display: grid; grid-template-rows: auto 1fr; overflow: hidden; }
    .bar { position: relative; }
    .kbd { display: inline-block; }
    .find { padding: 0 8px 0 12px; }
    .body { display: grid; grid-template-columns: 440px 1fr; grid-template-areas: 'pane stage'; min-height: 0; }
    .pane { grid-area: pane; overflow-y: auto; overscroll-behavior: contain; border-right: 1px solid var(--rule); }
    .stage, .stage.big, .stage.quiet { grid-area: stage; display: block; position: relative; top: 0; height: auto; border-bottom: 0; }
    .grow { display: none; }
    .pincard { left: 16px; right: auto; bottom: 24px; width: min(440px, calc(100% - 32px)); }
  }
  @media (min-width: 1280px) { .body { grid-template-columns: 480px 1fr; } }
</style>
