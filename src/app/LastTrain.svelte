<script lang="ts">
  // The night's last train home: shown under the day's briefing, and the time the 20-minute warning
  // works from. Found at build time by Yahoo!乗換案内's last-train search on the trip's own date
  // (npm run last-trains); anyone in the group can correct it here for everyone.
  import { icon } from '../lib/icons';
  import { ago, change, itemOf, live, setName } from './live.svelte';
  import { nightISO } from '../lib/live';
  import type { AppDay } from './types';
  import { app } from './state.svelte';

  let { day }: { day: AppDay } = $props();
  const t = $derived(day.lastTrain);
  const by = $derived(itemOf(`day:${day.n}`));
  let editing = $state(false);
  let leave = $state(''), dep = $state(''), arr = $state(''), from = $state(''), line = $state(''), name = $state('');
  $effect(() => { void day.n; editing = false; problem = ''; });
  const lookup = $derived(day.home ? `https://www.google.com/maps/dir/?api=1&origin=${day.home.from.lat},${day.home.from.lng}&destination=${day.home.to.lat},${day.home.to.lng}&travelmode=transit` : null);

  function open() {
    leave = t?.leave ?? ''; dep = t?.dep ?? ''; arr = t?.arr ?? ''; from = t?.from ?? ''; line = t?.line ?? ''; name = live.name;
    editing = true;
  }
  let problem = $state('');
  function save(e: Event) {
    e.preventDefault();
    // Leave the bar, then the train goes, then bed: in that order on the night (after midnight counts).
    const at = (hm: string) => Date.parse(nightISO(day.date, hm));
    if (!(at(leave) <= at(dep) && at(dep) < at(arr))) { problem = 'Leave by, then the train, then in bed: the times need to run in that order.'; return; }
    problem = '';
    if (name.trim() && name.trim() !== live.name) setName(name);
    change('day', String(day.n), { lastTrain: { leave, dep, arr, from, line } });
    editing = false;
  }
  function clear() { change('day', String(day.n), { lastTrain: null }); editing = false; }
</script>

<section class="lt" aria-labelledby={`lt-${day.n}`}>
  <h2 id={`lt-${day.n}`}>{@html icon('transport')}<span>Last {t?.bus ? 'bus' : 'train'} home</span></h2>
  {#if day.home}<p class="route">{day.home.from.name} → {day.home.to.name}</p>{/if}
  {#if editing}
    <form onsubmit={save}>
      <p class="hint">Times as in Yahoo!乗換案内 or Google Maps (time set to <b>Last</b>): leave the stop by, the train, and in bed by.</p>
      <div class="three">
        <label>Leave by<input type="time" bind:value={leave} required /></label>
        <label>Train at<input type="time" bind:value={dep} required /></label>
        <label>In bed by<input type="time" bind:value={arr} required /></label>
      </div>
      <div class="two">
        <label>From station<input bind:value={from} maxlength="60" placeholder="Shibuya" /></label>
        <label>Line<input bind:value={line} maxlength="80" placeholder="JR Yamanote → Seibu Ikebukuro" /></label>
      </div>
      {#if !live.name}<label>Your name<input bind:value={name} maxlength="40" required autocomplete="given-name" /></label>{/if}
      {#if problem}<p class="err" role="alert">{problem}</p>{/if}
      <div class="btns">
        <button type="submit" class="primary">Save for everyone</button>
        {#if lookup}<a href={lookup} target="_blank" rel="noopener">{@html icon('navigation')}<span>Look it up</span></a>{/if}
        {#if t}<button type="button" onclick={clear}>Remove</button>{/if}
        <button type="button" onclick={() => (editing = false)}>Cancel</button>
      </div>
    </form>
  {:else if t}
    <p class="big num"><b>{t.dep}</b>{#if t.from}{' '}<span>from {t.from}</span>{/if}</p>
    <p class="sub">Leave by <b class="num">{t.leave}</b>{' · in bed '}<span class="num">{t.arr}</span>{#if t.line}{' · '}{t.line}{/if}</p>
    <p class="meta">{#if by}Set by {by.by}, {ago(by.at)}{:else if t.url}<a href={t.url} target="_blank" rel="noopener">Yahoo!乗換案内 last-train search</a> for this date{/if} · a phone alert goes out 20 min before you need to leave.
      {#if live.on}<button type="button" class="link" onclick={open}>Change</button>{/if}</p>
  {:else}
    <p class="sub">{#if day.lastTrainWhy}{day.lastTrainWhy.charAt(0).toUpperCase() + day.lastTrainWhy.slice(1)}.{:else}Not checked yet.{/if}{#if live.on}{' If you find a train, save it here and everyone gets a warning 20 min before it’s time to go.'}{/if}</p>
    <div class="btns">
      {#if lookup}<a href={lookup} target="_blank" rel="noopener">{@html icon('navigation')}<span>Look it up</span></a>{/if}
      {#if live.on}<button type="button" class="primary" onclick={open}>Add it</button>{/if}
    </div>
  {/if}
  {#if day.taxi && day.home && !editing}
    <!-- Missed it: the taxi home at that hour (Google's traffic-aware drive time, the meter with the
         late-night surcharge), and Uber, which calls ordinary taxis in Tokyo and Osaka. -->
    <p class="taxi">{@html icon('car')}<span>Miss it? Taxi home <b class="num">{day.taxi.minutes} min</b>, about <b class="num">¥{day.taxi.fare[0].toLocaleString('en-US')}–{day.taxi.fare[1].toLocaleString('en-US')}</b> a car{#if day.taxi.cars > 1}{` · ${day.taxi.cars} cars for ${app.data?.people ?? 8}`}{/if}{#if day.taxi.km > 20}{' · plus expressway tolls'}{/if}.
      <a href={`https://m.uber.com/ul/?action=setPickup&pickup=my_location&dropoff[latitude]=${day.home.to.lat}&dropoff[longitude]=${day.home.to.lng}&dropoff[nickname]=${encodeURIComponent(day.home.to.name)}`} target="_blank" rel="noopener">Call one in Uber</a></span></p>
  {/if}
  {#if live.error && live.errorFor === `day:${day.n}`}<p class="err" role="alert">{live.error}</p>{/if}
</section>

<style>
  .lt { display: grid; gap: 6px; margin: 0 0 16px; padding: 12px 14px; border-radius: var(--r-m); background: var(--night-2); border: 1px solid var(--rule); }
  h2 { display: flex; align-items: center; gap: 8px; font-size: 0.86rem; font-weight: 700; color: var(--lantern); }
  h2 :global(svg) { width: 16px; height: 16px; flex: none; }
  .route { margin-top: -2px; font-size: 0.78rem; color: var(--washi-3); }
  .big { font-size: 1.05rem; color: var(--washi-2); }
  .big b { font-family: var(--f-display); font-size: 1.6rem; font-weight: 400; color: var(--washi); }
  .sub { font-size: 0.88rem; color: var(--washi-2); }
  .sub b { color: var(--washi); }
  .meta { font-size: 0.76rem; color: var(--washi-3); }
  .meta a { color: var(--washi-2); }
  .taxi { display: flex; gap: 8px; align-items: flex-start; margin-top: 4px; padding-top: 8px; border-top: 1px solid var(--rule); font-size: 0.82rem; line-height: 1.45; color: var(--washi-2); }
  .taxi :global(svg) { flex: none; width: 16px; height: 16px; margin-top: 1px; color: var(--lantern); }
  .taxi b { color: var(--washi); }
  .taxi a { color: var(--lantern); font-weight: 700; }
  .err { color: oklch(82% 0.11 35); font-size: 0.84rem; }
  .hint { font-size: 0.82rem; color: var(--washi-2); }
  .link { border: 0; background: none; padding: 0 2px; color: var(--lantern); font: inherit; font-weight: 700; cursor: pointer; text-decoration: underline; text-underline-offset: 2px; }
  form { display: grid; gap: 10px; }
  .three { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
  .two { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
  label { display: grid; gap: 4px; font-size: 0.74rem; font-weight: 700; color: var(--washi-2); min-width: 0; }
  input { width: 100%; min-height: 44px; padding: 8px; border-radius: 10px; border: 1px solid var(--rule-strong); background: var(--night); color: var(--washi); font: inherit; font-size: 1rem; }
  input:focus-visible { outline: 2px solid var(--lantern); outline-offset: 1px; }
  .btns { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 2px; }
  .btns button, .btns a { display: inline-flex; align-items: center; gap: 6px; min-height: 40px; padding: 0 14px; border-radius: 99px; border: 1px solid var(--rule-strong); background: none; color: var(--washi); font-weight: 700; font-size: 0.84rem; text-decoration: none; cursor: pointer; }
  .btns :global(svg) { width: 15px; height: 15px; color: var(--lantern); }
  .btns .primary { background: var(--lantern); border-color: var(--lantern); color: oklch(20% 0.05 276); }
  @media (max-width: 380px) { .two { grid-template-columns: 1fr; } }
</style>
