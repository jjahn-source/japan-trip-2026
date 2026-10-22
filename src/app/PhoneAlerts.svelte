<script lang="ts">
  // The group panel on the trip page: what the group changed lately, and phone alerts (leave now, the
  // last train, booking deadlines, plan changes) turned on per phone. Only with the live layer.
  import { onMount } from 'svelte';
  import { icon } from '../lib/icons';
  import { describe, type LivePlan } from '../lib/live';
  import { app, go, openSheet, stopOf } from './state.svelte';
  import { ago, live, setName } from './live.svelte';
  import { DEFAULT_PREFS, isOn, needsInstall, savedPrefs, supported, test, turnOff, turnOn, updatePrefs, type Prefs } from './notify';

  const KINDS: { k: keyof Prefs; label: string; sub: string }[] = [
    { k: 'leave', label: 'Leave now', sub: '10 min before each ride' },
    { k: 'last', label: 'Last train', sub: '20 min before you must leave' },
    { k: 'due', label: 'Booking deadlines', sub: '3 days before and on the day, 9am' },
    { k: 'changes', label: 'Plan changes', sub: 'when someone changes a stop' },
    { k: 'closed', label: 'Closed on the day', sub: 'Google Maps holiday hours, checked each morning' },
  ];
  let on = $state(false), busy = $state(false), msg = $state(''), err = $state('');
  let prefs = $state<Prefs>({ ...DEFAULT_PREFS });
  let name = $state('');
  let canPush = $state(false), install = $state(false);
  onMount(() => {
    canPush = supported(); install = needsInstall(); prefs = savedPrefs(); name = live.name;
    isOn().then((v) => (on = v)).catch(() => {});
  });

  async function run(f: () => Promise<unknown>, done: string) {
    busy = true; err = ''; msg = '';
    try { await f(); msg = done; } catch (e) { err = (e as Error).message; } finally { busy = false; }
  }
  const enable = () => run(async () => { if (name.trim()) setName(name); await turnOn($state.snapshot(prefs), live.name); on = true; }, 'Alerts are on for this phone.');
  const disable = () => run(async () => { await turnOff(); on = false; }, 'Alerts are off for this phone.');
  const toggle = (k: keyof Prefs) => { prefs[k] = !prefs[k]; if (on) run(() => updatePrefs($state.snapshot(prefs), live.name), 'Saved.'); };

  // The change log, in words: names and times from the plan on screen.
  const plan = $derived.by((): LivePlan => {
    const d = app.data!;
    return { generated: '', days: [], legs: [], stops: d.days.flatMap((x) => x.stops.map((s) => ({ id: s.id, d: x.n, name: s.name, cat: s.cat, s: s.startISO, e: s.endISO }))), todos: d.todos.map((t) => ({ id: t.id, due: t.due, text: t.text })) };
  });
  const recent = $derived(live.state.log.slice(0, 5).map((c) => ({ c, t: describe(c, plan) })));
  let showAll = $state(false);
  function openChange(kind: string, target: string) {
    if (kind === 'stop') { const f = stopOf(target); if (f) { go({ kind: 'day', n: f.day.n }); openSheet(target); } }
    else if (kind === 'todo') go({ kind: 'bookings' });
    else go({ kind: 'day', n: Number(target) });
  }
</script>

{#if live.on}
  {#if recent.length}
    <section class="panel" aria-labelledby="chg-h">
      <h2 id="chg-h">Changed by the group</h2>
      <ul class="chg">
        {#each showAll ? recent : recent.slice(0, 3) as { c, t } (c.id)}
          <li><button type="button" onclick={() => openChange(c.kind, c.target)}><b>{t.title}</b><small>{c.author} · {ago(c.at)}</small></button></li>
        {/each}
      </ul>
      {#if recent.length > 3}<button type="button" class="more" onclick={() => (showAll = !showAll)} aria-expanded={showAll}>{showAll ? 'Show fewer' : 'Show more'}</button>{/if}
    </section>
  {/if}

  <section class="panel" aria-labelledby="alerts-h">
    <h2 id="alerts-h">{@html icon('bell')}<span>Phone alerts</span>{#if on}<span class="pill">On</span>{/if}</h2>
    {#if !canPush && install}
      <p class="sub">On iPhone, alerts work from the Home Screen app: tap <b>Share</b>, then <b>Add to Home Screen</b>, open <b>Japan</b> from there and come back to this panel.</p>
    {:else if !canPush}
      <p class="sub">This browser can't receive alerts. Chrome, Edge, Firefox or Safari on a Mac can, and so can the Home Screen app on an iPhone.</p>
    {:else}
      <ul class="kinds">
        {#each KINDS as x}
          <li><label><input type="checkbox" checked={prefs[x.k]} onchange={() => toggle(x.k)} disabled={busy} /><span class="sw" aria-hidden="true"></span><span class="t"><b>{x.label}</b><small>{x.sub}</small></span></label></li>
        {/each}
      </ul>
      {#if !on && !live.name}<label class="nm">Your name<input bind:value={name} maxlength="40" autocomplete="given-name" placeholder="Shown on your changes" /></label>{/if}
      <div class="btns">
        {#if on}
          <button type="button" onclick={() => run(test, 'Sent. It should arrive in a few seconds.')} disabled={busy}>Send a test</button>
          <button type="button" onclick={disable} disabled={busy}>Turn off</button>
        {:else}
          <button type="button" class="primary" onclick={enable} disabled={busy}>{busy ? 'Turning on…' : 'Turn on alerts'}</button>
        {/if}
      </div>
    {/if}
    {#if msg}<p class="ok" role="status">{msg}</p>{/if}
    {#if err}<p class="err" role="alert">{err}</p>{/if}
  </section>
{/if}

<style>
  .panel { display: grid; gap: 10px; padding: 14px 16px; border-radius: var(--r-m); background: var(--night-2); border-top: 1px solid oklch(83% 0.145 76 / 0.3); }
  h2 { display: flex; align-items: center; gap: 8px; font-size: 1rem; font-weight: 700; }
  h2 :global(svg) { width: 17px; height: 17px; color: var(--lantern); }
  .pill { margin-left: auto; padding: 1px 9px 2px; border-radius: 99px; background: oklch(79% 0.13 155 / 0.16); color: var(--ok); font-size: 0.72rem; }
  .sub { font-size: 0.88rem; color: var(--washi-2); line-height: 1.5; }
  .sub b { color: var(--washi); }
  .chg { list-style: none; padding: 0; display: grid; gap: 2px; }
  .chg button { width: 100%; display: grid; gap: 2px; padding: 8px 4px; border: 0; border-bottom: 1px solid var(--rule); background: none; color: var(--washi); text-align: left; font-size: 0.9rem; cursor: pointer; }
  .chg b { font-weight: 600; }
  .chg small { color: var(--washi-3); font-size: 0.76rem; }
  .more { justify-self: start; border: 0; background: none; color: var(--lantern); font-weight: 700; font-size: 0.84rem; cursor: pointer; padding: 4px 0; }
  .kinds { list-style: none; padding: 0; display: grid; gap: 4px; }
  .kinds label { position: relative; display: flex; align-items: center; gap: 12px; min-height: 48px; cursor: pointer; }
  .kinds input { position: absolute; opacity: 0; width: 1px; height: 1px; }
  .sw { flex: none; position: relative; width: 40px; height: 24px; border-radius: 99px; background: var(--night-4); transition: background var(--t-fast); }
  .sw::after { content: ''; position: absolute; top: 3px; left: 3px; width: 18px; height: 18px; border-radius: 50%; background: var(--washi); transition: translate var(--t-fast) var(--ease); }
  .kinds input:checked + .sw { background: var(--lantern); }
  .kinds input:checked + .sw::after { translate: 16px 0; background: oklch(20% 0.05 276); }
  .kinds input:focus-visible + .sw { outline: 2px solid var(--lantern); outline-offset: 2px; }
  .t { display: grid; font-size: 0.9rem; }
  .t small { color: var(--washi-3); font-size: 0.76rem; }
  .nm { display: grid; gap: 4px; font-size: 0.76rem; font-weight: 700; color: var(--washi-2); }
  .nm input { min-height: 44px; padding: 8px 10px; border-radius: 10px; border: 1px solid var(--rule-strong); background: var(--night); color: var(--washi); font: inherit; font-size: 1rem; }
  .btns { display: flex; flex-wrap: wrap; gap: 8px; }
  .btns button { min-height: 44px; padding: 0 16px; border-radius: 99px; border: 1px solid var(--rule-strong); background: none; color: var(--washi); font-weight: 700; font-size: 0.88rem; cursor: pointer; }
  .btns button:disabled { opacity: 0.6; cursor: default; }
  .btns .primary { background: var(--lantern); border-color: var(--lantern); color: oklch(20% 0.05 276); }
  .ok { color: var(--ok); font-size: 0.84rem; }
  .err { color: oklch(82% 0.11 35); font-size: 0.84rem; }
</style>
