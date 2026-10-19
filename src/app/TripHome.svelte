<script lang="ts">
  // The whole trip in one view: what's now (or how long until wheels-down), what to book next, every
  // day as one line, the money, and the logistics that hold the days together.
  import { icon } from '../lib/icons';
  import { app, go, now, openSheet, ticks, todayN } from './state.svelte';
  import { budgetOf } from './types';

  const data = $derived(app.data!);
  const today = $derived(todayN());
  const first = $derived(data.days[0]?.stops[0]);
  const last = $derived(data.days.at(-1)?.stops.at(-1));
  const t = $derived(now());
  const phase = $derived(!first ? 'before' : t < Date.parse(first.startISO) ? 'before' : last && t > Date.parse(last.endISO) ? 'after' : 'during');
  const daysLeft = $derived(first ? Math.ceil((Date.parse(first.startISO) - t) / 864e5) : 0);
  const allStops = $derived(data.days.flatMap((d) => d.stops.map((s) => ({ d, s }))));
  const cur = $derived(allStops.find(({ s }) => Date.parse(s.startISO) <= t && t < Date.parse(s.endISO)) ?? null);
  const next = $derived(allStops.find(({ s }) => Date.parse(s.startISO) > t) ?? null);
  const open = $derived(data.todos.filter((x) => x.due && !ticks[x.id]).sort((a, b) => a.due!.localeCompare(b.due!)));
  const overdue = $derived(open.filter((x) => Date.parse(`${x.due}T23:59:59+09:00`) < t));
  const perPerson = $derived(budgetOf(data.budgetTotals).total);
  const until = (iso: string) => { const m = Math.round((Date.parse(iso) - t) / 60000); return m < 60 ? `in ${m} min` : m < 1440 ? `in ${Math.floor(m / 60)} h ${m % 60} min` : `in ${Math.round(m / 1440)} days`; };
  const openStop = (n: number, id: string) => { go({ kind: 'day', n }); openSheet(id); };
</script>

<section class="home" aria-labelledby="home-title">
  <header class="hero">
    <p class="mark display" aria-hidden="true">八人の旅</p>
    <h1 id="home-title">{data.title}</h1>
    <p class="dates">{data.dates} · {data.people} people · {data.days.length} days</p>
  </header>

  <section class="now" aria-label="Now">
    {#if phase === 'before'}
      <p class="big"><span class="display num">{daysLeft}</span> days until wheels-down at Haneda</p>
    {:else if phase === 'during'}
      {#if cur}<button class="nowrow" type="button" onclick={() => openStop(cur.d.n, cur.s.id)}><span class="lbl now-l">Now</span><span class="num">{cur.s.start}–{cur.s.end}</span><b>{cur.s.name}</b></button>{/if}
      {#if next}<button class="nowrow" type="button" onclick={() => openStop(next.d.n, next.s.id)}><span class="lbl">Next</span><span class="num">{next.s.start}</span><b>{next.s.name}</b><small>{until(next.s.startISO)}</small></button>{/if}
    {:else}
      <p class="big">お帰り · welcome home</p>
    {/if}
    {#if today}<a class="todaylink" href={`/day/${today}/`} onclick={(e) => go({ kind: 'day', n: today! }, e)}>Open today, day {today} {@html icon('next')}</a>{/if}
  </section>

  {#if open.length}
    <section class="panel" aria-labelledby="book-h">
      <div class="ph"><h2 id="book-h">Book next</h2><a href="/bookings/" onclick={(e) => go({ kind: 'bookings' }, e)}>{open.length} open{overdue.length ? `, ${overdue.length} overdue` : ''} {@html icon('next')}</a></div>
      <ul class="todo">
        {#each open.slice(0, 3) as x (x.id)}
          <li class:late={overdue.includes(x)}><span class="due num">{x.dueLabel ?? x.due}</span><span>{x.text}</span></li>
        {/each}
      </ul>
    </section>
  {/if}

  <section aria-labelledby="days-h">
    <h2 id="days-h" class="sh">The days</h2>
    <ol class="days">
      {#each data.days as d (d.n)}
        <li style:--i={d.n}>
          <a href={`/day/${d.n}/`} class:today={d.n === today} onclick={(e) => go({ kind: 'day', n: d.n }, e)}>
            <span class="n display num">{String(d.n).padStart(2, '0')}</span>
            <span class="k display" aria-hidden="true">{d.kanji}</span>
            <span class="txt"><span class="dl">{d.label} · {d.city}</span><span class="dt">{d.title}</span></span>
          </a>
        </li>
      {/each}
    </ol>
  </section>

  <div class="two">
    <section class="panel" aria-labelledby="money-h">
      <div class="ph"><h2 id="money-h">Budget</h2><a href="/budget/" onclick={(e) => go({ kind: 'budget' }, e)}>Breakdown {@html icon('next')}</a></div>
      <p class="money"><span class="display num">¥{perPerson.toLocaleString('en-US')}</span> <span>per person</span></p>
    </section>
    <section class="panel" aria-labelledby="stays-h">
      <h2 id="stays-h">Stays</h2>
      <ul class="stays">{#each data.stays as s}<li><b>{s.short}</b><span class="num">{s.checkIn} → {s.checkOut}</span></li>{/each}</ul>
    </section>
  </div>

  {#if data.logistics.length}
    <section class="panel" aria-labelledby="log-h">
      <h2 id="log-h">How the trip works</h2>
      <ul class="log">{#each data.logistics as l}<li>{l}</li>{/each}</ul>
    </section>
  {/if}

  {#if data.coverage.length}
    <details class="panel wishes">
      <summary><h2>Everything you asked for</h2><span class="num">{data.coverage.length}</span></summary>
      <ul>{#each data.coverage as c}<li><b>{c.wish}</b><span>{c.how}</span></li>{/each}</ul>
    </details>
  {/if}
</section>

<style>
  .home { padding: 8px max(16px, env(safe-area-inset-right, 0px)) 48px var(--gutter); display: grid; gap: 18px; }
  .hero { position: relative; padding: 14px 0 2px; }
  .mark { font-size: clamp(2.6rem, 12vw, 3.8rem); line-height: 1; color: var(--lantern); text-shadow: 0 0 40px oklch(83% 0.145 76 / 0.35); }
  h1 { margin-top: 10px; font-size: 1.3rem; font-weight: 700; }
  .dates { font-size: 0.86rem; color: var(--washi-2); margin-top: 2px; }
  .now { display: grid; gap: 8px; }
  .big { font-size: 1rem; color: var(--washi-2); display: flex; align-items: baseline; gap: 10px; flex-wrap: wrap; }
  .big .display { font-size: 3rem; line-height: 1; color: var(--lantern); }
  .nowrow { display: flex; align-items: baseline; gap: 10px; flex-wrap: wrap; text-align: left; padding: 12px 14px; border-radius: var(--r-m); border: 1px solid var(--rule); background: var(--night-2); color: var(--washi); cursor: pointer; }
  .nowrow .lbl { padding: 1px 8px 2px; border-radius: 99px; background: var(--night-4); font-size: 0.72rem; font-weight: 700; }
  .nowrow .now-l { background: var(--noren); color: var(--on-noren); }
  .nowrow .num { color: var(--lantern); font-weight: 700; }
  .nowrow small { color: var(--washi-3); margin-left: auto; }
  .todaylink { display: inline-flex; align-items: center; gap: 6px; font-weight: 700; text-decoration: none; }
  .todaylink :global(svg) { width: 16px; height: 16px; }
  .panel { border-radius: var(--r-m); background: var(--night-2); padding: 14px 16px; display: grid; gap: 10px; border-top: 1px solid oklch(83% 0.145 76 / 0.3); }
  .ph { display: flex; align-items: baseline; justify-content: space-between; gap: 10px; }
  h2 { font-size: 1rem; font-weight: 700; }
  .ph a { display: inline-flex; align-items: center; gap: 4px; font-size: 0.82rem; font-weight: 600; text-decoration: none; }
  .ph :global(svg) { width: 14px; height: 14px; }
  .todo { list-style: none; padding: 0; display: grid; gap: 8px; font-size: 0.9rem; }
  .todo li { display: grid; grid-template-columns: 5.4rem 1fr; gap: 10px; color: var(--washi-2); }
  .due { color: var(--lantern); font-weight: 700; font-size: 0.82rem; }
  .late .due { color: var(--noren); }
  .sh { margin-bottom: 8px; }
  .days { list-style: none; padding: 0; display: grid; gap: 4px; }
  .days li { animation: rise var(--t-slow) var(--ease) both; animation-delay: calc(var(--i) * 22ms); }
  @keyframes rise { from { opacity: 0; transform: translateY(8px); } }
  .days a { position: relative; display: grid; grid-template-columns: 3.1rem 1fr; align-items: center; gap: 12px; padding: 10px 12px; border-radius: var(--r-m); text-decoration: none; color: var(--washi); overflow: hidden; transition: background var(--t-fast); }
  .days a:hover { background: var(--night-2); }
  .days a.today { background: var(--night-2); box-shadow: inset 0 0 0 1px var(--noren); }
  .n { font-size: 1.9rem; line-height: 1; color: var(--lantern); }
  .k { position: absolute; right: 10px; top: 50%; translate: 0 -50%; font-size: 2.6rem; color: oklch(83% 0.145 76 / 0.08); pointer-events: none; }
  .txt { display: grid; gap: 2px; min-width: 0; }
  .dl { font-size: 0.76rem; color: var(--washi-3); }
  .dt { font-size: 0.92rem; font-weight: 600; line-height: 1.35; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
  .two { display: grid; gap: 18px; }
  .money { display: flex; align-items: baseline; gap: 8px; color: var(--washi-2); font-size: 0.86rem; }
  .money .display { font-size: 1.9rem; color: var(--lantern); }
  .stays { list-style: none; padding: 0; display: grid; gap: 6px; font-size: 0.86rem; }
  .stays li { display: grid; gap: 1px; }
  .stays span { color: var(--washi-3); font-size: 0.8rem; }
  .log { padding-left: 1.1rem; display: grid; gap: 7px; font-size: 0.88rem; line-height: 1.5; color: var(--washi-2); }
  .wishes summary { display: flex; align-items: center; justify-content: space-between; cursor: pointer; list-style: none; min-height: 32px; }
  .wishes summary::-webkit-details-marker { display: none; }
  .wishes summary .num { color: var(--lantern); font-weight: 700; }
  .wishes ul { list-style: none; padding: 0; display: grid; gap: 10px; font-size: 0.86rem; margin-top: 8px; }
  .wishes li { display: grid; gap: 2px; }
  .wishes span { color: var(--washi-2); }
  @media (min-width: 900px) { .two { grid-template-columns: 1fr 1fr; } }
</style>
