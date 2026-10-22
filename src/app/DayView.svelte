<script lang="ts">
  // One day: who, where and when at a glance. The timeline runs down a lantern-lit hour rail; every
  // stop keeps the same furniture in the same places; the hop to the next stop sits between them.
  import { icon } from '../lib/icons';
  import { app, BASE, go, openSheet, todayN, now } from './state.svelte';
  import JourneyStrip from './JourneyStrip.svelte';
  import LastTrain from './LastTrain.svelte';
  import { live } from './live.svelte';
  import { alertsFor, hmOf, nightISO, type LivePlan } from '../lib/live';
  import type { AppDay, AppStop } from './types';

  let { day, onplay, onpick }: { day: AppDay; onplay: (fromId: string) => void; onpick: (lat: number, lng: number, name: string) => void } = $props();

  const days = $derived(app.data?.days ?? []);
  const today = $derived(todayN());
  const cash = (s: AppStop) => s.google?.pay === 'cash' || !!s.guide && [...s.guide.tips, ...s.guide.facts.map((f) => f.text), s.guide.cost ?? ''].some((x) => /cash only|cash-only|現金のみ/i.test(x));
  // The local 160 px copy when there is one (scripts/thumbs.mjs), else the original.
  const photo = (s: AppStop) => { const m = s.guide?.media.find((x) => x.kind === 'image'); return m ? (m.small ? BASE + m.small : m.url) : null; };
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
    const on = day.stops.filter((s) => !s.live?.cancelled);
    return on.find((s) => Date.parse(s.startISO) <= t && t < Date.parse(s.endISO))?.id ?? on.find((s) => Date.parse(s.startISO) > t)?.id ?? null;
  });

  // The night on the rail: where the last-train cutoff falls, a bell on each ride a phone alert goes
  // out for (by the live layer's own rules, src/lib/live.ts), and a "now" line on the day itself.
  const clock = $derived(now());
  const night = $derived.by(() => {
    const plan: LivePlan = {
      generated: '', todos: [], days: [{ n: day.n, date: day.date, lastTrain: day.lastTrain }],
      stops: day.stops.map((s) => ({ id: s.id, d: day.n, name: s.name, cat: s.cat, s: s.startISO, e: s.endISO, cancelled: !!s.live?.cancelled })),
      legs: Object.values(day.legs).map((l) => ({ from: l.from, to: l.to, minutes: l.minutes, mode: l.mode, text: l.text })),
    };
    const alerts = live.on ? alertsFor(plan, 'Asia/Tokyo') : [];
    const t = day.lastTrain;
    return {
      bell: new Map(alerts.filter((a) => a.kind === 'leave').map((a) => [a.key.split(':')[1], a.at])),
      lastAlert: alerts.find((a) => a.kind === 'last')?.at ?? null,
      leave: t ? Date.parse(nightISO(day.date, t.leave)) : null,
      dep: t ? Date.parse(nightISO(day.date, t.dep)) : null,
      bed: t ? Date.parse(nightISO(day.date, t.arr)) : null,
    };
  });
  // Each marker goes before the first row (a stop at its start, a ride at its departure) that comes
  // after it, or at the end while the day's last stop is still on (an all-nighter). The cutoff only
  // inside the night: before the first stop or after everyone's home, the panel above says it.
  type Mark = { k: 'cut' | 'now'; t: number };
  const marks = $derived.by(() => {
    const rows: [string, number][] = [];
    day.stops.forEach((s, i) => { rows.push([`s${s.id}`, Date.parse(s.startISO)]); if (day.stops[i + 1]) rows.push([`h${s.id}`, Date.parse(s.endISO)]); });
    const last = day.stops.at(-1);
    const at = new Map<string, Mark[]>();
    const add = (key: string, m: Mark) => at.set(key, [...(at.get(key) ?? []), m].sort((a, b) => a.t - b.t));
    const put = (m: Mark, atTop: boolean) => {
      const i = rows.findIndex(([, t]) => t > m.t);
      if (i > 0 || (i === 0 && atTop)) add(rows[i][0], m);
      else if (i < 0 && last && m.t < Date.parse(last.endISO)) add('end', m);
    };
    if (night.leave) put({ k: 'cut', t: night.leave }, false);
    if (today === day.n) put({ k: 'now', t: clock }, true);
    return at;
  });
  // A stop that starts after the last train has gone, except getting into bed on that very train.
  const late = (s: AppStop) => {
    if (night.dep == null || s.live?.cancelled || Date.parse(s.startISO) <= night.dep) return false;
    return !(s.cat === 'stay' && night.bed != null && Date.parse(s.startISO) <= night.bed + 30 * 60e3);
  };
  const hm = (t: number) => hmOf(new Date(t).toISOString());

  let strip = $state<HTMLElement>();
  // Centre today's chip in the strip after the day has painted (it needs layout).
  $effect(() => {
    void day.n;
    const raf = requestAnimationFrame(() => {
      const el = strip?.querySelector<HTMLElement>('[aria-current="page"]');
      if (el && strip) strip.scrollLeft = el.offsetLeft - strip.clientWidth / 2 + el.offsetWidth / 2;
    });
    return () => cancelAnimationFrame(raf);
  });
</script>

<section class="day" aria-labelledby="day-title">
  <nav class="days" aria-label="Days" bind:this={strip}>
    {#each days as d (d.n)}
      <a href={`/day/${d.n}/`} class="chip" class:today={d.n === today} aria-current={d.n === day.n ? 'page' : undefined} onclick={(e) => go({ kind: 'day', n: d.n }, e)}>
        <span class="n num">{d.n}</span><span class="dt num">{d.weekday} {Number(d.date.slice(8))}</span>
      </a>
    {/each}
  </nav>

  <header class="head">
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

  {#if day.home || day.lastTrain}<LastTrain {day} />{/if}

  <p id="open-hint" class="sr-only">Opens the stop's details</p>
  {#snippet markers(key: string)}
    {#each marks.get(key) ?? [] as m (m.k)}
      {#if m.k === 'cut' && day.lastTrain}
        <li class="cut">
          <span class="ct num">{day.lastTrain.leave}</span><span class="dot" aria-hidden="true"></span>
          <span class="cl"><b>Leave for the last train</b><span class="num">{day.lastTrain.dep} from {day.lastTrain.from}, in bed {day.lastTrain.arr}</span>{#if night.lastAlert}<small>{@html icon('bell')}<span class="num">Phones buzz at {hm(night.lastAlert)}</span></small>{/if}</span>
        </li>
      {:else if m.k === 'now'}
        <li class="nowline"><span class="ct num">{hm(m.t)}</span><span class="dot" aria-hidden="true"></span><span class="nl">Now</span></li>
      {/if}
    {/each}
  {/snippet}
  <ol class="timeline">
    {#each day.stops as s, i (s.id)}
      {@render markers(`s${s.id}`)}
      <li class="stop" class:sel={app.selected === s.id} class:now={nowId === s.id} class:off={s.live?.cancelled} class:late={late(s)} data-id={s.id} style:--i={i}>
        <button class="hit" type="button" onclick={() => openSheet(s.id)} onmouseenter={() => (app.selected = s.id)} aria-describedby="open-hint">
          <span class="time num"><b>{s.start}</b><small>{s.end}</small></span>
          <span class="no num" aria-hidden="true">{s.i}</span>
          <span class="body">
            <span class="name">{s.name}</span>
            {#if s.ja}<span class="ja" lang="ja">{s.ja}</span>{/if}
            {#if s.live?.note}<span class="lnote">{s.live.note} <small>· {s.live.by}</small></span>{/if}
            {#if s.hook ?? s.plan}<span class="hook">{s.hook ?? s.plan}</span>{/if}
            <span class="chips">
              {#if s.live?.cancelled}<span class="chip-s book">Cancelled</span>{:else if s.live?.moved}<span class="chip-s moved">Moved · was {s.live.planned}</span>{/if}
              {#if nowId === s.id}<span class="chip-s nowc">Now</span>{/if}
              {#if late(s)}<span class="chip-s late">After the last train</span>{/if}
              {#if s.google?.closed}<span class="chip-s late">Closed {s.google.closed}</span>{:else if s.google?.clash?.kind === 'closed'}<span class="chip-s late">Closed then</span>{/if}
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
        {@render markers(`h${s.id}`)}
        <li class="hop">
          {#if night.bell.get(s.id)}{@const at = night.bell.get(s.id)!}<span class="bell num" title={`Phone alert at ${hm(at)}: time to leave for ${day.stops[i + 1].name}`}>{@html icon('bell')}{hm(at)}<span class="sr-only">: phone alert to leave</span></span>{/if}
          <JourneyStrip leg={day.legs[s.id]} from={s} to={day.stops[i + 1]} date={day.date} active={app.playing === s.id} progress={app.playing === s.id ? app.progress : 0} clock={app.playing === s.id ? app.clock : ''} onplay={day.legs[s.id] ? () => onplay(s.id) : undefined} />
        </li>
      {/if}
    {/each}
    {@render markers('end')}
  </ol>

  {#if day.picks.length}
    <section class="picks" aria-labelledby="picks-h">
      <h2 id="picks-h">Nearby, if you have time</h2>
      <ul>
        {#each day.picks.slice(0, 8) as p (p.id)}
          <li>
            <button type="button" onclick={() => onpick(p.lat, p.lng, p.name)}>
              {#if p.photo}<img src={p.photoSmall ? BASE + p.photoSmall : p.photo} alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer" onerror={(e) => (e.currentTarget as HTMLElement).remove()} />{:else}<span class="glyph" lang="ja">{(p.ja ?? p.name).slice(0, 1)}</span>{/if}
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
  .days { mask-image: linear-gradient(90deg, transparent, #000 18px, #000 calc(100% - 18px), transparent); display: flex; gap: 6px; overflow-x: auto; scrollbar-width: none; margin: 0 calc(-1 * var(--gutter)); padding: 12px var(--gutter) 6px; scroll-snap-type: x proximity; }
  .days::-webkit-scrollbar { display: none; }
  .chip { position: relative; flex: none; scroll-snap-align: center; display: grid; justify-items: center; gap: 1px; min-width: 54px; padding: 6px 6px 5px; border-radius: var(--r-m); border: 1px solid var(--rule); color: var(--washi-2); text-decoration: none; transition: background var(--t-fast), color var(--t-fast), border-color var(--t-fast); }
  .chip .n { font-family: var(--f-display); font-size: 1.15rem; line-height: 1.1; }
  .chip .dt { font-size: 0.66rem; font-weight: 700; letter-spacing: 0.01em; white-space: nowrap; }
  @media (hover: hover) { .chip:hover { border-color: var(--rule-strong); color: var(--washi); } }
  .chip[aria-current='page'] { background: var(--lantern); border-color: var(--lantern); color: oklch(20% 0.05 276); box-shadow: 0 4px 18px -4px oklch(83% 0.145 76 / 0.6); }
  .chip.today:not([aria-current]) { border-color: var(--noren); color: var(--washi); }

  .head { position: relative; display: grid; grid-template-columns: auto 1fr; gap: 4px 16px; align-items: end; padding: 18px 0 14px; isolation: isolate; }
  .numeral { font-size: clamp(3.6rem, 16vw, 5.4rem); line-height: 0.82; color: var(--lantern); text-shadow: 0 0 34px oklch(83% 0.145 76 / 0.35); }
  .meta { display: contents; }
  .date { align-self: end; padding-bottom: 4px; font-size: 0.86rem; font-weight: 500; color: var(--washi-2); }
  h1 { grid-column: 1 / -1; margin-top: 8px; font-weight: 700; font-size: 1.2rem; line-height: 1.34; text-wrap: pretty; }
  .facts { grid-column: 1 / -1; list-style: none; padding: 6px 0 0; display: flex; flex-wrap: wrap; gap: 4px 14px; font-size: 0.8rem; color: var(--washi-2); }
  .facts li { display: inline-flex; align-items: center; gap: 5px; }
  .facts :global(svg) { width: 15px; height: 15px; color: var(--lantern); }

  .brief { list-style: none; padding: 12px 14px; margin: 4px 0 16px; display: grid; gap: 8px; border-radius: var(--r-m); background: var(--night-2); border-top: 1px solid oklch(83% 0.145 76 / 0.45); font-size: 0.9rem; color: var(--washi-2); }
  .brief b { color: var(--washi); font-weight: 700; }

  .timeline { list-style: none; padding: 0; position: relative; }
  .timeline::before { content: ''; position: absolute; left: 75px; top: 14px; bottom: 14px; width: 1px; background: linear-gradient(var(--rule-strong), var(--rule) 30%, var(--rule)); }
  .stop { position: relative; }
  /* Rows below the fold are laid out when they scroll near, not when the day opens. */
  .stop, .hop { content-visibility: auto; contain-intrinsic-size: auto 104px; }
  :global(.enter) .stop { animation: rise var(--t-slow) var(--ease) both; animation-delay: calc(min(var(--i), 8) * 16ms); }
  @keyframes rise { from { opacity: 0; transform: translateY(10px); } }
  .hit { width: 100%; display: grid; grid-template-columns: 58px 22px 1fr auto; align-items: start; gap: 0 12px; padding: 12px 6px 12px 0; border: 0; border-radius: var(--r-m); background: none; text-align: left; cursor: pointer; transition: background var(--t-fast); }
  @media (hover: hover) { .hit:hover { background: oklch(29% 0.066 280 / 0.45); } }
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
  .chip-s.moved { background: var(--lantern-wash); color: var(--lantern); }
  .lnote { font-size: 0.88rem; line-height: 1.4; color: var(--washi); padding-left: 8px; border-left: 2px solid var(--lantern); }
  .lnote small { color: var(--washi-3); font-size: 0.76rem; }
  /* A cancelled stop stays in the list (so nobody wonders where it went), dimmed and struck through. */
  .off .name { text-decoration: line-through; text-decoration-color: var(--noren); color: var(--washi-3); }
  .off .time, .off .thumb, .off .hook { opacity: 0.45; }
  .thumb { width: 64px; height: 64px; border-radius: 12px; object-fit: cover; background: var(--night-3); }
  .hop { position: relative; list-style: none; padding: 2px 0 6px; }

  /* The night on the rail: the last-train cutoff (noren: something to do), the "now" line (lantern),
     and the bell in the time column where a ride's phone alert goes out. */
  .cut, .nowline { list-style: none; display: grid; grid-template-columns: 58px 22px 1fr; gap: 0 12px; align-items: start; padding: 4px 6px 10px 0; }
  .ct { justify-self: end; font-size: 0.9rem; font-weight: 700; line-height: 1.2; padding-top: 3px; }
  .dot { position: relative; z-index: 1; justify-self: center; width: 12px; height: 12px; margin-top: 5px; border-radius: 50%; }
  .cl, .nl { display: grid; gap: 2px; margin-top: 10px; padding-top: 6px; font-size: 0.84rem; color: var(--washi-2); }
  .cut .ct { color: var(--noren); }
  .cut .dot { background: var(--noren); box-shadow: 0 0 0 4px var(--noren-wash); }
  .cl { border-top: 1.5px dashed var(--noren); }
  .cl b { color: var(--washi); font-weight: 700; }
  .cl small { display: inline-flex; align-items: center; gap: 5px; margin-top: 2px; color: var(--washi-3); font-size: 0.76rem; }
  .cl small :global(svg) { width: 12px; height: 12px; color: var(--lantern); }
  .nowline .ct { color: var(--lantern); }
  .nowline .dot { background: var(--lantern); box-shadow: var(--lantern-halo); animation: glow 1.8s var(--ease-in-out) infinite alternate; }
  .nl { border-top: 2px solid var(--lantern); color: var(--lantern); font-weight: 700; }
  @keyframes glow { to { box-shadow: 0 0 0 6px var(--lantern-wash); } }
  @media (prefers-reduced-motion: reduce) { .nowline .dot { animation: none; } }
  .bell { position: absolute; z-index: 1; left: 0; top: 50%; width: 58px; translate: 0 -50%; display: inline-flex; justify-content: flex-end; align-items: center; gap: 3px; font-size: 0.7rem; font-weight: 700; color: var(--lantern); }
  .bell :global(svg) { width: 11px; height: 11px; flex: none; }
  /* Past the last train: the stop's lantern goes dashed (off the rail network), with a chip in words. */
  .stop.late .no { border-style: dashed; }
  .chip-s.late { background: var(--noren-wash); color: oklch(82% 0.11 35); }

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
  @media (hover: hover) { .pager a:hover { border-color: var(--lantern); } }
  .pager :global(svg) { width: 16px; height: 16px; }
</style>
