<script lang="ts">
  // A stop's live state and the form to change it: new times, a note for the group, or cancelled.
  // Saved on this phone at once and sent to everyone (src/app/live.svelte.ts); "Back to the plan" undoes it.
  import { icon } from '../lib/icons';
  import { ago, change, live, setName } from './live.svelte';
  import type { AppStop } from './types';

  let { stop }: { stop: AppStop } = $props();
  let editing = $state(false);
  let start = $state(''), end = $state(''), note = $state(''), cancelled = $state(false), name = $state('');
  const planned = $derived((stop.live?.planned ?? `${stop.start}–${stop.end}`).split('–'));
  $effect(() => { void stop.id; editing = false; });

  function open() {
    start = stop.start; end = stop.end; note = stop.live?.note ?? ''; cancelled = !!stop.live?.cancelled; name = live.name;
    editing = true;
  }
  function save(e: Event) {
    e.preventDefault();
    if (!live.name && !name.trim()) return;
    if (name.trim() && name.trim() !== live.name) setName(name);
    const patch: Record<string, unknown> = {};
    // A time back at the plan's clears the change instead of storing the same time.
    if (start !== stop.start) patch.start = start === planned[0] ? null : start;
    if (end !== stop.end) patch.end = end === planned[1] ? null : end;
    if (note.trim() !== (stop.live?.note ?? '')) patch.note = note.trim() || null;
    if (cancelled !== !!stop.live?.cancelled) patch.cancelled = cancelled || null;
    if (Object.keys(patch).length) change('stop', stop.id, patch);
    editing = false;
  }
  function reset() { change('stop', stop.id, { start: null, end: null, note: null, cancelled: null }); editing = false; }
</script>

{#if stop.live && !editing}
  <section class="live" class:off={stop.live.cancelled} aria-label="Changed by the group">
    <p class="what">
      {#if stop.live.cancelled}<b>Cancelled</b>{:else if stop.live.moved}<b>Moved</b> from {stop.live.planned}{:else}<b>Note</b>{/if}
      <span class="by">· {stop.live.by}, {ago(stop.live.at)}</span>
    </p>
    {#if stop.live.note}<p class="note">{stop.live.note}</p>{/if}
  </section>
{/if}

{#if live.on}
  {#if editing}
    <form class="edit" onsubmit={save}>
      <div class="times">
        <label>Start<input type="time" bind:value={start} required /></label>
        <label>End<input type="time" bind:value={end} required /></label>
      </div>
      <label class="wide">Note for the group<textarea bind:value={note} rows="2" maxlength="280" placeholder="Running 20 min late, meet at the north exit"></textarea></label>
      <label class="check"><input type="checkbox" bind:checked={cancelled} /><span class="box" aria-hidden="true">{@html icon('check')}</span>Cancelled: skip this stop</label>
      {#if !live.name}<label class="wide">Your name<input bind:value={name} maxlength="40" required autocomplete="given-name" placeholder="So the group knows who changed it" /></label>{/if}
      <div class="btns">
        <button type="submit" class="primary">Save for everyone</button>
        {#if stop.live}<button type="button" onclick={reset}>Back to the plan</button>{/if}
        <button type="button" onclick={() => (editing = false)}>Cancel</button>
      </div>
    </form>
  {:else}
    <button type="button" class="pencil" onclick={open}>{@html icon('pencil')}<span>Change time, add a note or cancel</span></button>
  {/if}
  {#if live.error}<p class="err" role="alert">{live.error}</p>{/if}
{/if}

<style>
  .live { display: grid; gap: 4px; padding: 10px 12px; border-radius: var(--r-m); background: var(--lantern-wash); border-left: 3px solid var(--lantern); font-size: 0.88rem; }
  .live.off { background: var(--noren-wash); border-left-color: var(--noren); }
  .what b { color: var(--washi); }
  .by { color: var(--washi-3); font-size: 0.8rem; }
  .note { color: var(--washi); line-height: 1.45; }
  .pencil { justify-self: start; display: inline-flex; align-items: center; gap: 7px; min-height: 40px; padding: 0 14px; border-radius: 99px; border: 1px dashed var(--rule-strong); background: none; color: var(--washi-2); font-size: 0.84rem; font-weight: 600; cursor: pointer; }
  .pencil :global(svg) { width: 15px; height: 15px; color: var(--lantern); }
  .edit { display: grid; gap: 12px; padding: 14px; border-radius: var(--r-m); background: var(--night-3); }
  .times { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  label { display: grid; gap: 5px; font-size: 0.78rem; font-weight: 700; color: var(--washi-2); }
  input:not([type='checkbox']), textarea { width: 100%; min-height: 44px; padding: 8px 10px; border-radius: 10px; border: 1px solid var(--rule-strong); background: var(--night); color: var(--washi); font: inherit; font-size: 1rem; font-weight: 500; }
  textarea { resize: vertical; line-height: 1.4; }
  input:focus-visible, textarea:focus-visible { outline: 2px solid var(--lantern); outline-offset: 1px; }
  .check { position: relative; display: flex; align-items: center; gap: 10px; font-size: 0.9rem; font-weight: 600; color: var(--washi); cursor: pointer; }
  .check input { position: absolute; opacity: 0; width: 1px; height: 1px; }
  .box { width: 24px; height: 24px; display: grid; place-items: center; border-radius: 8px; border: 1.5px solid var(--rule-strong); color: transparent; }
  .box :global(svg) { width: 15px; height: 15px; }
  .check input:checked + .box { background: var(--noren); border-color: var(--noren); color: var(--on-noren); }
  .check input:focus-visible + .box { outline: 2px solid var(--lantern); outline-offset: 2px; }
  .btns { display: flex; flex-wrap: wrap; gap: 8px; }
  .btns button { min-height: 44px; padding: 0 16px; border-radius: 99px; border: 1px solid var(--rule-strong); background: none; color: var(--washi); font-weight: 700; font-size: 0.88rem; cursor: pointer; }
  .btns .primary { background: var(--lantern); border-color: var(--lantern); color: oklch(20% 0.05 276); }
  .err { color: oklch(82% 0.11 35); font-size: 0.84rem; }
</style>
