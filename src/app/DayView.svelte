<script lang="ts">
  // One day: who, where and when at a glance. The timeline runs down a lantern-lit hour rail; every
  // stop keeps the same furniture in the same places; the hop to the next stop sits between them.
  import { icon } from '../lib/icons';
  import { app, go, openSheet, todayN, now } from './state.svelte';
  import JourneyStrip from './JourneyStrip.svelte';
  import type { AppDay, AppStop } from './types';

  let { day, onplay, onpick }: { day: AppDay; onplay: (fromId: string) => void; onpick: (lat: number, lng: number, name: string) => void } = $props();

  const days = $derived(app.data?.days ?? []);
  const today = $derived(todayN());
  const cash = (s: AppStop) => !!s.guide && [...s.guide.tips, ...s.guide.facts.map((f) => f.text), s.guide.cost ?? ''].some((x) => /cash only|cash-only|現金のみ/i.test(x));
  const photo = (s: AppStop) => s.guide?.media.find((m) => m.kind === 'image')?.url ?? null;
  const NOTE: Record<string, string> = { BRING: 'Bring', MONEY: 'Money', CHECK: 'Check', WEATHER: 'Weather', NOTE: 'Note', BOOK: 'Book' };
  const kind = (k: string) => NOTE[k.toUpperCase()] ?? k.charAt(0) + k.slice(1).toLowerCase();

  // Weather: the real forecast once the day is within reach, else the typical day for the date.
  let forecast = $state<{ hi: number; lo: number; rain: number | null } | null>(null);
  $effect(() => {
    forecast = null;
    const d = day;
    const ahead = Date.parse(`${d.date}T12:00:00+09:00`) - Date.now();
    if (!d.sun || ahead > 15 * 864e5 || ahead < -864e5) return;
    const u = `https://api.open-meteo.com/v1/forecast?latitude=${d.sun.lat}&longitude=${d.sun.lng}&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=Asia%2FTokyo&start_date=${d.date}&end_date=${d.date}`;
    let live = true;
    fetch(u).then((r) => r.json()).then((j) => { if (live) forecast = { hi: Math.round(j.daily.temperature_2m_max[0]), lo: Math.round(j.daily.temperature_2m_min[0]), rain: j.daily.precipitation_probability_max[0] ?? null }; }).catch(() => {});
    return () => { live = false; };
  });

  // Where the day is right now (on the day itself).
  const nowId = $derived.by(() => {
    if (today !== day.n) return null;
    const t = now();
    return day.stops.find((s) => Date.parse(s.startISO) <= t && t < Date.parse(s.endISO))?.id ?? day.stops.find((s) => Date.parse(s.startISO) > t)?.id ?? null;
  });

  let strip = $state<HTMLElement>();
  $effect(() => { void day.n; strip?.querySelector('[aria-current="page"]')?.scrollIntoView({ inline: 'center', block: 'nearest' }); });
</script>

<section class="day" aria-labelledby="day-title">
  <nav class="days" aria-label="Days" bind:this={strip}>
    {#each days as d (d.n)}
      <a href={`/day/${d.n}/`} class="chip" class:today={d.n === today} aria-current={d.n === day.n ? 'page' : undefined} onclick={(e) => go({ kind: 'day', n: d.n }, e)}>
        <span class="k">{d.kanji}</span><span class="n num">{d.n}</span>
      </a>
    {/each}
  </nav>

  <header class="head">
    <span class="kanji" aria-hidden="true">{day.kanji}</span>
    <p class="numeral display num" aria-hidden="true">{String(day.n).padStart(2, '0')}</p>
    <div class="meta">
      <p class="date">Day {day.n} · {day.label} · {day.city}</p>
      <h1 id="day-title">{day.title}</h1>
    </div>
    <ul class="facts">
      {#if day.base}<li>{@html icon('bed')}<span>{day.base.short}</span></li>{/if}
      {#if day.sun}<li>{@html icon('sunrise')}<span class="num">{day.sun.sunrise}</span></li><li>{@html icon('sunset')}<span class="num">{day.sun.sunset}</span></li>{/if}
      {#if forecast}<li>{@html icon((forecast.rain ?? 0) >= 50 ? 'cloudRain' : 'cloudSun')}<span class="num">{forecast.hi}° / {forecast.lo}°{forecast.rain != null ? ` · ${forecast.rain}% rain` : ''}</span></li>
      {:else if day.climate}<li title="Typical for this date">{@html icon(day.climate.wet >= 35 ? 'cloudRain' : 'cloudSun')}<span class="num">{day.climate.hi}° / {day.climate.lo}° typical</span></li>{/if}
    </ul>
  </header>

  {#if day.notes.length}
    <ul class="brief">
      {#each day.notes.slice(0, 4) as n}
        <li><b>{kind(n.kind)}.</b> {n.text}</li>
      {/each}
    </ul>
  {/if}

  <ol class="timeline">
    {#each day.stops as s, i (s.id)}
      <li class="stop" class:sel={app.selected === s.id} class:now={nowId === s.id} data-id={s.id} style:--i={i}>
        <button class="hit" type="button" onclick={() => openSheet(s.id)} onmouseenter={() => (app.selected = s.id)} aria-label={`${s.start} ${s.name}: open details`}>
          <span class="time num"><b>{s.start}</b><small>{s.end}</small></span>
          <span class="no num" aria-hidden="true">{s.i}</span>
          <span class="body">
            <span class="name">{s.name}</span>
            {#if s.ja}<span class="ja" lang="ja">{s.ja}</span>{/if}
            {#if s.hook ?? s.plan}<span class="hook">{s.hook ?? s.plan}</span>{/if}
            <span class="chips">
              {#if nowId === s.id}<span class="chip-s nowc">Now</span>{/if}
              {#if s.mark === 'tobook'}<span class="chip-s book">Book</span>{:else if s.mark === 'tocheck'}<span class="chip-s check">Check</span>{/if}
              {#if s.price}<span class="chip-s">{s.price}</span>{/if}
              {#if cash(s)}<span class="chip-s">Cash only</span>{/if}
              {#if s.confirmation}<span class="chip-s ok">Booked</span>{/if}
            </span>
          </span>
          {#if photo(s)}<img class="thumb" src={photo(s)} alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer" onerror={(e) => (e.currentTarget as HTMLElement).remove()} />{/if}
        </button>
      </li>
      {#if day.stops[i + 1]}
        <li class="hop">
          <JourneyStrip leg={day.legs[s.id]} from={s} to={day.stops[i + 1]} active={app.playing === s.id} progress={app.playing === s.id ? app.progress : 0} clock={app.playing === s.id ? app.clock : ''} onplay={day.legs[s.id] ? () => onplay(s.id) : undefined} />
        </li>
      {/if}
    {/each}
  </ol>

  {#if day.picks.length}
    <section class="picks" aria-labelledby="picks-h">
      <h2 id="picks-h">Nearby, if you have time</h2>
      <ul>
        {#each day.picks.slice(0, 8) as p (p.id)}
          <li>
            <button type="button" onclick={() => onpick(p.lat, p.lng, p.name)}>
              {#if p.photo}<img src={p.photo} alt="" loading="lazy" referrerpolicy="no-referrer" onerror={(e) => (e.currentTarget as HTMLElement).remove()} />{:else}<span class="glyph" lang="ja">{(p.ja ?? p.name).slice(0, 1)}</span>{/if}
              <span class="pn">{p.name}</span>
              <span class="pw">{p.why ?? p.when ?? `${Math.round(p.km * 1000)} m from stop ${day.stops.find((x) => x.id === p.near)?.i ?? ''}`}</span>
            </button>
          </li>
        {/each}
      </ul>
    </section>
  {/if}

  <nav class="pager" aria-label="Other days">
    {#if days.find((d) => d.n === day.n - 1)}<a href={`/day/${day.n - 1}/`} onclick={(e) => go({ kind: 'day', n: day.n - 1 }, e)}>{@html icon('prev')}<span>Day {day.n - 1}</span></a>{:else}<span></span>{/if}
    {#if days.find((d) => d.n === day.n + 1)}<a href={`/day/${day.n + 1}/`} onclick={(e) => go({ kind: 'day', n: day.n + 1 }, e)}><span>Day {day.n + 1}</span>{@html icon('next')}</a>{/if}
  </nav>
</section>

<style>
  .day { padding: 0 max(16px, env(safe-area-inset-right, 0px)) 40px var(--gutter); }
  .days { display: flex; gap: 6px; overflow-x: auto; scrollbar-width: none; margin: 0 calc(-1 * var(--gutter)); padding: 12px var(--gutter) 6px; scroll-snap-type: x proximity; }
  .days::-webkit-scrollbar { display: none; }
  .chip { flex: none; scroll-snap-align: center; display: grid; justify-items: center; gap: 1px; width: 46px; padding: 6px 0 5px; border-radius: var(--r-m); border: 1px solid var(--rule); color: var(--washi-2); text-decoration: none; transition: background var(--t-fast), color var(--t-fast), border-color var(--t-fast); }
  .chip .k { font-family: var(--f-display); font-size: 1.1rem; line-height: 1.1; }
  .chip .n { font-size: 0.7rem; }
  .chip:hover { border-color: var(--rule-strong); color: var(--washi); }
  .chip[aria-current='page'] { background: var(--lantern); border-color: var(--lantern); color: oklch(20% 0.05 276); box-shadow: 0 4px 18px -4px oklch(83% 0.145 76 / 0.6); }
  .chip.today:not([aria-current]) { border-color: var(--noren); color: var(--washi); }

  .head { position: relative; display: grid; grid-template-columns: auto 1fr; gap: 4px 16px; align-items: end; padding: 18px 0 14px; isolation: isolate; }
  .kanji { position: absolute; z-index: -1; right: -6px; top: -4px; font-family: var(--f-display); font-size: 9rem; line-height: 1; color: oklch(83% 0.145 76 / 0.07); pointer-events: none; }
  .numeral { font-size: clamp(3.6rem, 16vw, 5.4rem); line-height: 0.82; color: var(--lantern); text-shadow: 0 0 34px oklch(83% 0.145 76 / 0.35); }
  .meta { min-width: 0; display: grid; gap: 4px; }
  .date { font-size: 0.82rem; color: var(--washi-2); }
  h1 { font-weight: 700; font-size: 1.12rem; line-height: 1.32; }
  .facts { grid-column: 1 / -1; list-style: none; padding: 6px 0 0; display: flex; flex-wrap: wrap; gap: 4px 14px; font-size: 0.8rem; color: var(--washi-2); }
  .facts li { display: inline-flex; align-items: center; gap: 5px; }
  .facts :global(svg) { width: 15px; height: 15px; color: var(--lantern); }

  .brief { list-style: none; padding: 12px 14px; margin: 4px 0 16px; display: grid; gap: 8px; border-radius: var(--r-m); background: var(--night-2); border-top: 1px solid oklch(83% 0.145 76 / 0.45); font-size: 0.9rem; color: var(--washi-2); }
  .brief b { color: var(--washi); font-weight: 700; }

  .timeline { list-style: none; padding: 0; position: relative; }
  .timeline::before { content: ''; position: absolute; left: 75px; top: 14px; bottom: 14px; width: 1px; background: linear-gradient(var(--rule-strong), var(--rule) 30%, var(--rule)); }
  .stop { position: relative; animation: rise var(--t-slow) var(--ease) both; animation-delay: calc(min(var(--i), 10) * 28ms); }
  @keyframes rise { from { opacity: 0; transform: translateY(10px); } }
  .hit { width: 100%; display: grid; grid-template-columns: 58px 22px 1fr auto; align-items: start; gap: 0 12px; padding: 12px 6px 12px 0; border: 0; border-radius: var(--r-m); background: none; text-align: left; cursor: pointer; transition: background var(--t-fast); }
  .hit:hover { background: oklch(29% 0.066 280 / 0.45); }
  .time { display: grid; justify-items: end; line-height: 1.15; padding-top: 2px; }
  .time b { font-size: 1.02rem; color: var(--lantern); font-weight: 700; }
  .time small { font-size: 0.72rem; color: var(--washi-3); }
  .no { position: relative; z-index: 1; width: 22px; height: 22px; margin-top: 1px; display: grid; place-items: center; border-radius: 50%; background: var(--night); border: 1.5px solid var(--lantern-2); color: var(--lantern); font-size: 0.7rem; font-weight: 700; transition: background var(--t-fast), color var(--t-fast), box-shadow var(--t-med) var(--ease); }
  .sel .no { background: var(--lantern); color: oklch(20% 0.05 276); box-shadow: var(--lantern-halo); }
  .now .no { background: var(--noren); border-color: var(--noren); color: var(--on-noren); }
  .body { min-width: 0; display: grid; gap: 3px; }
  .name { font-weight: 700; font-size: 1rem; line-height: 1.3; color: var(--washi); }
  .ja { font-size: 0.78rem; color: var(--washi-3); }
  .hook { font-size: 0.88rem; line-height: 1.45; color: var(--washi-2); }
  .chips { display: flex; flex-wrap: wrap; gap: 5px; margin-top: 3px; }
  .chip-s { padding: 1px 8px 2px; border-radius: 99px; font-size: 0.72rem; font-weight: 600; color: var(--washi-2); background: var(--night-3); }
  .chip-s.book, .chip-s.nowc { background: var(--noren); color: var(--on-noren); }
  .chip-s.check { background: var(--noren-wash); color: oklch(82% 0.11 35); }
  .chip-s.ok { background: oklch(79% 0.13 155 / 0.16); color: var(--ok); }
  .thumb { width: 64px; height: 64px; border-radius: 12px; object-fit: cover; background: var(--night-3); }
  .hop { list-style: none; padding: 2px 0 6px; }

  .picks { margin-top: 28px; }
  .picks h2 { font-size: 1rem; font-weight: 700; margin-bottom: 10px; }
  .picks ul { list-style: none; padding: 0 var(--gutter) 4px; margin: 0 calc(-1 * var(--gutter)); display: flex; gap: 10px; overflow-x: auto; scroll-snap-type: x proximity; scrollbar-width: none; }
  .picks li { flex: none; width: 168px; scroll-snap-align: start; }
  .picks button { width: 100%; display: grid; gap: 4px; padding: 0; border: 0; background: none; text-align: left; cursor: pointer; }
  .picks img, .glyph { width: 100%; aspect-ratio: 4 / 3; border-radius: 12px; object-fit: cover; background: var(--night-3); }
  .glyph { display: grid; place-items: center; font-family: var(--f-display); font-size: 2.4rem; color: var(--lantern); }
  .pn { font-weight: 700; font-size: 0.9rem; line-height: 1.25; }
  .pw { font-size: 0.78rem; color: var(--washi-3); display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }

  .pager { display: flex; justify-content: space-between; margin-top: 30px; }
  .pager a { display: inline-flex; align-items: center; gap: 6px; min-height: 44px; padding: 0 14px; border-radius: 99px; border: 1px solid var(--rule); color: var(--washi); text-decoration: none; font-weight: 600; font-size: 0.9rem; }
  .pager a:hover { border-color: var(--lantern); }
  .pager :global(svg) { width: 16px; height: 16px; }
</style>
