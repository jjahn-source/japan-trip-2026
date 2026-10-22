<script lang="ts">
  // One search for everything: the trip's own stops first, then places around the day in view
  // ("ramen", "izakaya open now", "Don Quijote"). Keyboard: / or ⌘K opens it, arrows move, Enter opens.
  // With signal and the live layer, one tap (or Enter) searches live: Google Maps' open-now list near the phone,
  // and, when the search needs judgement the list can't give, Gemini's answer from Google Maps on top. The Worker
  // decides which (src/lib/route.ts: TypeSafe's Jev, or a word check); "Ask Gemini too" overrides it.
  import { icon } from '../lib/icons';
  import { CATS } from '../lib/categories';
  import { hoursAt, parseHours, type Hours } from '../lib/hours';
  import { keys, scorer, type Keys } from '../lib/textmatch';
  import { app, BASE, go, now, openSheet, todayN } from './state.svelte';
  import { live } from './live.svelte';
  import type { NearbyRow } from '../lib/nearby';

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

  // Open now on Google Maps (the Worker's /api/nearby): only when asked, since each search is a paid call.
  let gRows = $state<NearbyRow[] | null>(null), gBusy = $state(false), gErr = $state(''), gFor = $state(''), gemini = $state(false);
  $effect(() => { void q; gRows = null; gErr = ''; answer = null; aErr = ''; gemini = false; });
  const inJapan = (lat: number, lng: number) => lat > 24 && lat < 46 && lng > 122 && lng < 146;
  /** The phone's position when it's in Japan; otherwise the stop picked on the map, or the day's first. */
  const where = () => new Promise<{ lat: number; lng: number; from: string } | null>((done) => {
    const sel = dayStops.find((x) => x.id === app.selected) ?? dayStops[0];
    let settled = false;
    const fallback = () => { if (!settled) { settled = true; done(sel ? { lat: sel.lat!, lng: sel.lng!, from: `near ${sel.name}` } : null); } };
    if (!navigator.geolocation) return fallback();
    // A location prompt nobody answers never calls back: after 8 s, search around the stop instead.
    setTimeout(fallback, 8000);
    navigator.geolocation.getCurrentPosition((p) => {
      if (settled) return;
      if (!inJapan(p.coords.latitude, p.coords.longitude)) return fallback();
      settled = true; done({ lat: p.coords.latitude, lng: p.coords.longitude, from: 'near you' });
    }, fallback, { timeout: 6000, maximumAge: 120e3 });
  });
  async function searchLive() {
    if (gBusy) return;
    gBusy = true; gErr = '';
    try {
      const at = await where();
      if (!at) { gErr = 'No place to search around.'; return; }
      const r = await fetch(`${BASE}/api/find`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ q: q.trim(), lat: at.lat, lng: at.lng }), signal: AbortSignal.timeout(12e3) });
      const j = await r.json();
      gFor = at.from;
      if (j.rows) gRows = j.rows; else gErr = j.error ?? 'Google Maps did not answer.';
      // The search needs judgement the list can't give: Gemini answers too, on top.
      if (j.route?.route === 'gemini') { gemini = true; askGemini(at); }
    } catch { gErr = 'No signal for Google Maps right now: the places above work offline.'; } finally { gBusy = false; }
  }
  // Ask: the question in plain words, to Gemini with Google Maps (the Worker's /api/ask). About 10 s.
  let answer = $state<{ text: string; sources: { title: string; uri: string }[] } | null>(null), aBusy = $state(false), aErr = $state('');
  async function askGemini(near?: { lat: number; lng: number } | null) {
    aBusy = true; aErr = ''; gemini = true;
    try {
      const at = near ?? (await where());
      if (!at) { aErr = 'No place to ask about.'; return; }
      const r = await fetch(`${BASE}/api/ask`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ q: q.trim(), lat: at.lat, lng: at.lng }), signal: AbortSignal.timeout(45e3) });
      const j = await r.json();
      if (!r.ok) { aErr = j.error ?? 'Gemini did not answer.'; return; }
      answer = j;
    } catch { aErr = 'No answer: check the signal and try again.'; } finally { aBusy = false; }
  }
  function pickGoogle(g: NearbyRow) {
    app.search = false;
    app.pin = { lat: g.lat, lng: g.lng, name: g.name, sub: [g.kind, g.rating ? `${g.rating.toFixed(1)}★` : null, `${g.walk} min walk`, g.closes ? `open until ${g.closes}` : 'open now', g.cash ? 'cash only' : null].filter(Boolean).join(' · '), web: g.maps ?? undefined };
  }

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
    else if (e.key === 'Enter' && live.on && q.trim().length >= 2) { e.preventDefault(); searchLive(); }
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
        {#if !total && q.trim().split(/\s+/).length < 4}<p class="empty">Nothing matches “{q}” in the trip or near day {dayN}. Try a kind of place, like ramen, karaoke or konbini.</p>{/if}
        {#if live.on}
          {#if aBusy}<p class="note thinking" role="status">{@html icon('mic')} Gemini is looking into “{q.trim()}”… about 10 seconds</p>{/if}
          {#if answer}
            <div class="answer" aria-live="polite">
              <p class="grp">Gemini, from Google Maps</p>
              <p class="atext">{answer.text}</p>
              {#if answer.sources.length}<p class="asrc">Sources: {#each answer.sources as x, k}{k ? ' · ' : ''}<a href={x.uri} target="_blank" rel="noopener">{x.title}</a>{/each} <span>(Google Maps)</span></p>{/if}
            </div>
          {/if}
          {#if aErr}<p class="note" role="status">{aErr}</p>{/if}
          {#if gRows}
            {#if gRows.length || !gemini}<p class="grp">Open now on Google Maps · {gFor}</p>{/if}
            {#each gRows as g (g.id)}
              <button type="button" class="res" onclick={() => pickGoogle(g)}>
                <span class="badge g">{@html icon('clock')}</span>
                <span class="nm">{g.name}<small>{[g.kind, g.rating ? `${g.rating.toFixed(1)}★ ${(g.ratings ?? 0).toLocaleString('en-US')}` : null, `${g.walk} min walk`, g.closes ? `until ${g.closes}` : null, g.cash ? 'cash only' : null, g.book ? 'takes bookings' : null].filter(Boolean).join(' · ')}</small></span>
              </button>
            {/each}
            {#if !gRows.length && !gemini}<p class="note">Nothing open on Google Maps for that within a 15-minute walk.</p>{/if}
          {:else}
            <button type="button" class="ask" onclick={searchLive} disabled={gBusy}>{@html icon('globe')}<span>{gBusy ? 'Searching Google Maps…' : `Search live near you: “${q.trim()}”`}</span></button>
          {/if}
          {#if gErr}<p class="note" role="status">{gErr}</p>{/if}
          {#if (gRows || gErr) && !gemini}<button type="button" class="more" onclick={() => askGemini()}>Not what you need? Ask Gemini too</button>{/if}
        {/if}
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
  .ask { display: flex; align-items: center; gap: 10px; width: 100%; margin-top: 6px; padding: 11px 12px; border: 1px dashed oklch(83% 0.145 76 / 0.45); border-radius: var(--r-m); background: none; color: var(--lantern); font: 600 0.88rem var(--f-body); text-align: left; cursor: pointer; }
  .ask:disabled { opacity: 0.7; cursor: progress; }
  .ask :global(svg) { width: 16px; height: 16px; flex: none; }
  .thinking { display: flex; align-items: center; gap: 8px; color: var(--washi-2); }
  .thinking :global(svg) { width: 15px; height: 15px; color: var(--lantern); }
  .more { margin: 4px 10px 6px; padding: 0; border: 0; background: none; color: var(--lantern); font: 600 0.82rem var(--f-body); text-decoration: underline; text-underline-offset: 2px; cursor: pointer; }
  .ask span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .answer { margin-top: 6px; padding: 4px 6px 10px; border-radius: var(--r-m); background: var(--night-3); }
  .atext { padding: 0 6px; white-space: pre-line; font-size: 0.9rem; line-height: 1.5; color: var(--washi); }
  .asrc { padding: 8px 6px 0; font-size: 0.76rem; color: var(--washi-3); }
  .asrc a { color: var(--lantern); }
  .badge.g { background: oklch(79% 0.13 155 / 0.16); color: var(--ok); }
  .note { padding: 8px 10px 6px; color: var(--washi-3); font-size: 0.8rem; }
  .empty, .hint { padding: 16px; color: var(--washi-2); font-size: 0.88rem; line-height: 1.5; }
  .hint b { color: var(--lantern); font-weight: 600; }
</style>
