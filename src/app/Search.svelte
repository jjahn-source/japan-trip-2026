<script lang="ts">
  // One search for everything: the trip's own stops first, then places around the day in view
  // ("ramen", "izakaya open now", "Don Quijote"). Keyboard: / or ⌘K opens it, arrows move, Enter opens.
  import { icon } from '../lib/icons';
  import { CATS } from '../lib/categories';
  import { hoursAt, parseHours, type Hours } from '../lib/hours';
  import { keys, scorer, type Keys } from '../lib/textmatch';
  import { app, BASE, go, now, openSheet, todayN } from './state.svelte';

  let dlg = $state<HTMLDialogElement>();
  let q = $state('');
  let active = $state(0);
  type Row = [string, string, number, number, number[], string, string, number, string, string, string, string, string];
  /** A place from the day's pack, with everything a keystroke needs worked out once at load. */
  type Place = { r: Row; at: { lat: number; lng: number }; keys: Keys; near: number; hours?: Hours | null };
  let places0 = $state.raw<Place[]>([]);
  let loadedDay = 0;

  const km = (a: { lat: number; lng: number }, b: { lat: number; lng: number }) => Math.hypot((b.lng - a.lng) * Math.cos((a.lat * Math.PI) / 180), b.lat - a.lat) * 111.2;
  const dayN = $derived(app.view.kind === 'day' ? app.view.n : todayN() ?? 1);
  const dayStops = $derived((app.data?.days.find((d) => d.n === dayN)?.stops ?? []).filter((s) => s.lat != null));
  $effect(() => {
    if (!app.search) return;
    const n = dayN, stopsHere = dayStops;
    if (n === loadedDay) return;
    loadedDay = n;
    fetch(`${BASE}/places/day-${n}.json`).then((r) => (r.ok ? r.json() : { rows: [] })).then((j) => {
      if (loadedDay !== n) return;
      // Distance to the nearest stop of the day, not to the day's centre: a travel day spans two cities.
      places0 = (j.rows ?? []).map((r: Row) => {
        const at = { lat: r[2] / 1e5, lng: r[3] / 1e5 };
        let near = Infinity;
        for (const s of stopsHere) near = Math.min(near, km(at, { lat: s.lat!, lng: s.lng! }));
        return { r, at, keys: keys(r[0], ...r[1].split('|'), r[12]), near };
      });
    }).catch(() => { places0 = []; });
  });
  $effect(() => {
    const d = dlg;
    if (!d) return;
    if (app.search && !d.open) { d.showModal(); q = ''; active = 0; queueMicrotask(() => d.querySelector('input')?.focus()); }
    if (!app.search && d.open) d.close();
  });

  const wantsOpen = $derived(/\bopen( now)?\b|営業中/i.test(q));
  const cats = $derived(CATS.map((c, i) => ({ c, i })).filter(({ c }) => c.words.test(q.toLowerCase())));
  const text = $derived(q.replace(/\bopen( now)?\b|\bnear(by| me)?\b|営業中/gi, '').replace(new RegExp(cats.map(({ c }) => c.words.source).join('|') || '$^', 'gi'), '').trim());

  // The trip's stops, keyed once.
  const stopIndex = $derived((app.data?.days ?? []).flatMap((d) => d.stops.map((st) => ({ d, st, keys: keys(st.name, st.ja, st.catLabel) }))));
  const stops = $derived.by(() => {
    if (q.trim().length < 2) return [];
    const s = scorer(q.trim());
    const out: ((typeof stopIndex)[number] & { score: number })[] = [];
    for (const x of stopIndex) { const score = s(x.keys); if (score > 0) out.push({ ...x, score }); }
    return out.sort((a, b) => b.score - a.score).slice(0, 6);
  });
  const places = $derived.by(() => {
    if (q.trim().length < 2 || !places0.length) return [];
    const s = text.length >= 2 ? scorer(text) : null;
    if (!s && !cats.length && !wantsOpen) return [];
    // Near the stop you picked when there is one, else near any stop of the day.
    const sel = dayStops.find((x) => x.id === app.selected);
    const t = now();
    const out: { r: Row; at: Place['at']; d: number; score: number; open: { open: boolean; label: string } | null }[] = [];
    for (const x of places0) {
      if (cats.length && !cats.some(({ i }) => x.r[4].includes(i))) continue;
      const d = sel ? km(x.at, { lat: sel.lat!, lng: sel.lng! }) : x.near;
      if (d >= 3) continue;
      const score = s ? s(x.keys) : 1;
      if (score <= 0) continue;
      if (x.hours === undefined) x.hours = x.r[6] ? parseHours(x.r[6]) : null;
      const open = x.hours ? hoursAt(x.hours, t) : null;
      if (wantsOpen && !open?.open) continue;
      out.push({ r: x.r, at: x.at, d, score, open });
    }
    // The map data often has one shop twice ("らーめん 山頭火" and "らーめん山頭火" a few metres apart):
    // the same name, spaces and punctuation aside, within 100 m is one place.
    const bare = (n: string) => n.toLowerCase().replace(/[\s・·.,'’()（）\-–]/g, '');
    const kept: typeof out = [];
    for (const x of out.sort((a, b) => (s ? b.score - a.score || a.d - b.d : a.d - b.d))) {
      if (kept.some((k) => bare(k.r[0]) === bare(x.r[0]) && km(k.at, x.at) < 0.1)) continue;
      kept.push(x);
      if (kept.length === 12) break;
    }
    return kept;
  });
  const total = $derived(stops.length + places.length);

  function pickStop(i: number) { const x = stops[i]; app.search = false; go({ kind: 'day', n: x.d.n }); openSheet(x.st.id); }
  function pickPlace(i: number) {
    const x = places[i];
    app.search = false;
    app.pin = { lat: x.at.lat, lng: x.at.lng, name: x.r[0], sub: [x.r[1].split('|')[0], x.open?.label, `${Math.round(x.d * 1000)} m away`].filter(Boolean).join(' · '), web: x.r[8] || undefined, hours: x.r[6] || undefined };
  }
  function key(e: KeyboardEvent) {
    if (e.key === 'Escape') { e.preventDefault(); app.search = false; return; } // a search field's own Escape only clears the text
    if (e.key === 'ArrowDown') { e.preventDefault(); active = Math.min(total - 1, active + 1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); active = Math.max(0, active - 1); }
    else if (e.key === 'Enter' && total) { e.preventDefault(); if (active < stops.length) pickStop(active); else pickPlace(active - stops.length); }
  }
</script>

<svelte:window onkeydown={(e) => {
  const typing = (e.target as HTMLElement | null)?.closest?.('input, textarea, select, [contenteditable]');
  if ((e.key === '/' && !typing) || (e.key.toLowerCase() === 'k' && (e.metaKey || e.ctrlKey))) { e.preventDefault(); app.search = true; }
}} />

<dialog bind:this={dlg} class="search" aria-label="Search" oncancel={(e) => { e.preventDefault(); app.search = false; }} onclick={(e) => { if (e.target === dlg) app.search = false; }}>
  <div class="box">
    <label class="field">
      {@html icon('search')}
      <input type="search" placeholder="Stops, or ramen, izakaya open now…" bind:value={q} oninput={() => (active = 0)} onkeydown={key} aria-label="Search the trip and nearby places" autocomplete="off" enterkeyhint="go" />
      <button type="button" class="x" onclick={() => (app.search = false)} aria-label="Close search">{@html icon('x')}</button>
    </label>
    {#if q.trim().length >= 2}
      <div class="results" role="listbox" aria-label="Results">
        {#if stops.length}<p class="grp">In your trip</p>{/if}
        {#each stops as x, i (x.st.id)}
          <button type="button" role="option" aria-selected={active === i} class="res" onclick={() => pickStop(i)} onmouseenter={() => (active = i)}>
            <span class="badge num">{x.d.n}</span><span class="nm">{x.st.name}<small>Day {x.d.n} · {x.st.start} · {x.st.catLabel}</small></span>
          </button>
        {/each}
        {#if places.length}<p class="grp">Near day {dayN}{cats.length ? ` · ${cats.map(({ c }) => c.label).join(', ')}` : ''}</p>{/if}
        {#each places as x, j (x.r[11] + ':' + j)}
          {@const i = stops.length + j}
          <button type="button" role="option" aria-selected={active === i} class="res" onclick={() => pickPlace(j)} onmouseenter={() => (active = i)}>
            <span class="badge">{@html icon('pin')}</span>
            <span class="nm">{x.r[0]}<small>{Math.round(x.d * 1000)} m{x.open ? ` · ${x.open.label}` : ''}{x.r[5] ? ` · ${x.r[5]}` : ''}</small></span>
          </button>
        {/each}
        {#if total && !places.length && cats.length}<p class="note">No {cats.map(({ c }) => c.label.toLowerCase()).join(' or ')} within 3 km of day {dayN}'s stops{wantsOpen ? ' open now' : ''}.</p>{/if}
        {#if !total}<p class="empty">Nothing matches “{q}” in the trip or near day {dayN}. Try a kind of place, like ramen, karaoke or konbini.</p>{/if}
      </div>
    {:else}
      <p class="hint">Search every stop of the trip, or what's around day {dayN}: <b>ramen</b>, <b>konbini</b>, <b>izakaya open now</b>.</p>
    {/if}
  </div>
</dialog>

<style>
  .search { margin: 0 auto; top: max(10px, env(safe-area-inset-top, 0px)); width: min(640px, calc(100% - 24px)); max-width: none; max-height: min(78svh, 680px); padding: 0; border: 0; background: transparent; color: var(--washi); overflow: visible; }
  .search::backdrop { background: oklch(12% 0.04 276 / 0.6); }
  .box { display: grid; grid-template-rows: auto 1fr; max-height: min(78svh, 680px); border-radius: var(--r-l); background: var(--night-2); border: 1px solid oklch(83% 0.145 76 / 0.35); box-shadow: 0 24px 60px -16px oklch(8% 0.05 276 / 0.9); overflow: hidden; animation: drop var(--t-med) var(--ease); }
  @keyframes drop { from { transform: translateY(-12px); opacity: 0; } }
  .field { display: flex; align-items: center; gap: 10px; padding: 6px 8px 6px 16px; border-bottom: 1px solid var(--rule); }
  .field > :global(svg) { width: 18px; height: 18px; color: var(--lantern); flex: none; }
  input { flex: 1; min-width: 0; height: 48px; border: 0; background: none; color: var(--washi); font: 500 1rem var(--f-body); caret-color: var(--lantern); }
  input:focus { outline: none; }
  input::placeholder { color: var(--washi-3); }
  input::-webkit-search-cancel-button { display: none; }
  .x { width: 40px; height: 40px; display: grid; place-items: center; border-radius: 50%; border: 0; background: none; color: var(--washi-2); cursor: pointer; }
  .x :global(svg) { width: 18px; height: 18px; }
  .results { overflow-y: auto; overscroll-behavior: contain; padding: 6px; display: grid; gap: 2px; align-content: start; }
  .grp { padding: 8px 10px 4px; font-size: 0.74rem; font-weight: 700; color: var(--washi-3); }
  .res { display: flex; align-items: center; gap: 12px; width: 100%; padding: 9px 10px; border: 0; border-radius: var(--r-m); background: none; color: var(--washi); text-align: left; cursor: pointer; }
  .res[aria-selected='true'] { background: var(--night-3); }
  .badge { flex: none; width: 30px; height: 30px; display: grid; place-items: center; border-radius: 50%; background: var(--lantern-wash); color: var(--lantern); font-size: 0.78rem; font-weight: 700; }
  .badge :global(svg) { width: 15px; height: 15px; }
  .nm { display: grid; gap: 1px; min-width: 0; font-weight: 600; font-size: 0.94rem; }
  .nm small { color: var(--washi-3); font-weight: 400; font-size: 0.78rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .note { padding: 8px 10px 6px; color: var(--washi-3); font-size: 0.8rem; }
  .empty, .hint { padding: 16px; color: var(--washi-2); font-size: 0.88rem; line-height: 1.5; }
  .hint b { color: var(--lantern); font-weight: 600; }
</style>
