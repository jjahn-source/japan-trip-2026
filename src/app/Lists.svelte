<script lang="ts">
  // Bookings (what to do by when, ticked on this phone) and the budget (per person, by category).
  import { icon } from '../lib/icons';
  import { app, go, now, openSheet, stopOf, tick, ticks } from './state.svelte';
  import { budgetOf, yen } from './types';
  import { ago, itemOf, live } from './live.svelte';
  import { loadRate, usd } from './fx.svelte';
  $effect(() => { if (mode === 'budget') loadRate(); });

  let { mode }: { mode: 'bookings' | 'budget' } = $props();
  const data = $derived(app.data!);
  const t = $derived(now());
  const week = 7 * 864e5;
  const groups = $derived.by(() => {
    const due = (x: { due: string | null }) => (x.due ? Date.parse(`${x.due}T23:59:59+09:00`) : Infinity);
    const sorted = [...data.todos].sort((a, b) => (a.due ?? '9').localeCompare(b.due ?? '9'));
    return [
      { key: 'late', title: 'Overdue', items: sorted.filter((x) => !ticks[x.id] && due(x) < t) },
      { key: 'soon', title: 'This week', items: sorted.filter((x) => !ticks[x.id] && due(x) >= t && due(x) < t + week) },
      { key: 'later', title: 'Later', items: sorted.filter((x) => !ticks[x.id] && due(x) >= t + week) },
      { key: 'done', title: 'Done', items: sorted.filter((x) => ticks[x.id]) },
    ].filter((g) => g.items.length);
  });
  const rows = $derived(data.budget.map((b) => ({ ...b, pp: yen(b.perPerson) ?? 0 })));
  const budget = $derived(budgetOf(data.budgetTotals));
  const totals = $derived(budget.cats);
  const max = $derived(Math.max(1, ...totals.map((x) => x.v)));
  const sum = $derived(budget.total);
  const openStop = (id: string) => { const f = stopOf(id); if (!f) return; go({ kind: 'day', n: f.day.n }); openSheet(id); };
</script>

{#if mode === 'bookings'}
  <section class="list" aria-labelledby="bk-title">
    <header><h1 id="bk-title">Bookings and to-dos</h1><p class="sub">{data.todos.filter((x) => !ticks[x.id]).length} open · {live.on ? 'a tick shows on everyone’s phone' : 'ticks are saved on this phone'}</p></header>
    {#each groups as g (g.key)}
      <section class="grp" data-k={g.key} aria-labelledby={`g-${g.key}`}>
        <h2 id={`g-${g.key}`}>{g.title} <span class="num">{g.items.length}</span></h2>
        <ul>
          {#each g.items as x (x.id)}
            <li class:done={ticks[x.id]}>
              <label class="row">
                <input type="checkbox" checked={!!ticks[x.id]} onchange={(e) => tick(x.id, (e.currentTarget as HTMLInputElement).checked)} />
                <span class="box" aria-hidden="true">{@html icon('check')}</span>
                <span class="due num">{x.dueLabel ?? x.due ?? 'Any time'}</span>
                <span class="txt">{x.text}{#if x.detail}<small>{x.detail}</small>{/if}{#if ticks[x.id] && itemOf(`todo:${x.id}`)}{@const by = itemOf(`todo:${x.id}`)!}<small class="by">Done · {by.by}, {ago(by.at)}</small>{/if}</span>
              </label>
              {#if x.stops.length}
                <div class="links">{#each x.stops as id}{@const f = stopOf(id)}{#if f}<button type="button" onclick={() => openStop(id)}>Day {f.day.n} · {f.stop.name} {@html icon('next')}</button>{/if}{/each}</div>
              {/if}
            </li>
          {/each}
        </ul>
      </section>
    {/each}
  </section>
{:else}
  <section class="list" aria-labelledby="bg-title">
    <header><h1 id="bg-title">Budget</h1><p class="sub"><span class="display num total">¥{sum.toLocaleString('en-US')}</span> per person{#if usd(`¥${sum}`)}<span class="usd num">≈ ${usd(`¥${sum}`)} at today’s rate</span>{/if}</p></header>
    <ul class="bars">
      {#each totals as b, i}
        <li style:--w="{(b.v / max) * 100}%" style:--i={i}><span class="cat">{b.category}</span><span class="v num">¥{b.v.toLocaleString('en-US')}</span><span class="bar" aria-hidden="true"></span></li>
      {/each}
    </ul>
    <h2 class="sh">Every item</h2>
    <ul class="items">
      {#each rows as r}
        <!-- A row without an amount (the stays, already paid) shows none rather than two dashes. -->
        <li><span class="it">{r.item}<small>{r.category}{r.note ? ` · ${r.note}` : ''}</small></span>{#if /\d/.test(r.perPerson)}<span class="pp num">{r.perPerson}{#if usd(r.perPerson)}<small>≈ ${usd(r.perPerson)}</small>{/if}</span>{/if}{#if /\d/.test(r.group)}<span class="gp num">{r.group} group</span>{/if}</li>
      {/each}
    </ul>
  </section>
{/if}

<style>
  .list { padding: 18px max(16px, env(safe-area-inset-right, 0px)) 48px var(--gutter); display: grid; gap: 18px; }
  h1 { font-size: 1.5rem; font-weight: 700; }
  .sub { color: var(--washi-2); font-size: 0.86rem; margin-top: 4px; display: flex; align-items: baseline; gap: 8px; }
  .total { font-size: 2.2rem; color: var(--lantern); }
  h2 { font-size: 0.95rem; font-weight: 700; margin-bottom: 8px; display: flex; gap: 8px; align-items: baseline; }
  h2 .num { color: var(--washi-3); font-weight: 500; }
  .grp[data-k='late'] h2 { color: var(--noren); }
  .grp ul { list-style: none; padding: 0; display: grid; gap: 6px; }
  .grp li { border-radius: var(--r-m); background: var(--night-2); padding: 4px 6px 6px; }
  .row { position: relative; display: grid; grid-template-columns: 30px 1fr; gap: 2px 10px; align-items: start; padding: 10px 6px 4px; cursor: pointer; }
  /* The due date sits above the to-do, so the text gets the full width of a phone. */
  .row .box { grid-row: 1 / span 2; margin-top: 1px; }
  .row .due, .row .txt { grid-column: 2; }
  .row input { position: absolute; opacity: 0; width: 1px; height: 1px; }
  .box { grid-row: 1; width: 24px; height: 24px; display: grid; place-items: center; border-radius: 8px; border: 1.5px solid var(--rule-strong); color: transparent; transition: background var(--t-fast), border-color var(--t-fast), color var(--t-fast); }
  .box :global(svg) { width: 15px; height: 15px; }
  .row input:checked + .box { background: var(--ok); border-color: var(--ok); color: oklch(20% 0.05 276); }
  .row input:focus-visible + .box { outline: 2px solid var(--lantern); outline-offset: 2px; }
  .due { font-size: 0.76rem; font-weight: 700; color: var(--lantern); line-height: 1.4; }
  .grp[data-k='late'] .due { color: var(--noren); }
  .txt { display: grid; gap: 3px; font-size: 0.92rem; }
  .txt small { color: var(--washi-3); font-size: 0.8rem; line-height: 1.45; }
  .txt small.by { color: var(--ok); text-decoration: none; display: inline-block; }
  .done .txt { color: var(--washi-3); text-decoration: line-through; text-decoration-color: var(--rule-strong); }
  .links { display: flex; flex-wrap: wrap; gap: 6px; padding: 2px 6px 4px 46px; }
  .links button { display: inline-flex; align-items: center; gap: 4px; text-align: left; min-height: 32px; padding: 0 10px; border-radius: 99px; border: 1px solid var(--rule); background: none; color: var(--lantern); font-size: 0.78rem; font-weight: 600; cursor: pointer; }
  .links :global(svg) { width: 13px; height: 13px; }
  .bars { list-style: none; padding: 0; display: grid; gap: 12px; }
  .bars li { display: grid; grid-template-columns: 1fr auto; gap: 4px 10px; font-size: 0.88rem; }
  .bars .v { color: var(--lantern); font-weight: 700; }
  .bar { grid-column: 1 / -1; height: 8px; border-radius: 99px; background: linear-gradient(90deg, var(--lantern-2), var(--lantern)) 0 0 / var(--w) 100% no-repeat, var(--night-3); box-shadow: 0 0 14px -4px oklch(83% 0.145 76 / 0.5); }
  :global(.enter) .bar { animation: grow var(--t-slow) var(--ease) both; animation-delay: calc(var(--i) * 40ms); }
  @keyframes grow { from { background-size: 0 100%, auto; } }
  .sh { margin-top: 6px; }
  .items { list-style: none; padding: 0; display: grid; }
  .items li { display: grid; grid-template-columns: 1fr auto; gap: 2px 12px; padding: 10px 0; border-bottom: 1px solid var(--rule); font-size: 0.88rem; }
  .it { display: grid; gap: 2px; }
  .it small { color: var(--washi-3); font-size: 0.76rem; }
  .pp { color: var(--washi); font-weight: 700; text-align: right; display: grid; }
  .pp small { color: var(--washi-3); font-weight: 500; font-size: 0.74rem; }
  .usd { flex-basis: 100%; margin-top: -2px; color: var(--washi-3); font-size: 0.82rem; }
  .sub:has(.usd) { flex-wrap: wrap; }
  .gp { grid-column: 2; color: var(--washi-3); font-size: 0.76rem; text-align: right; }
</style>
