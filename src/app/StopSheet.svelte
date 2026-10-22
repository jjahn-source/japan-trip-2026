<script lang="ts">
  // Everything about one stop, in a dialog that leaves the map in view and in reach: a panel beside it
  // on a laptop, a half-height sheet under it on a phone (scroll or swipe up for the whole sheet).
  // Back, Escape, the close button and a swipe down all close it.
  import { fly } from 'svelte/transition';
  import { cubicIn } from 'svelte/easing';
  import { icon } from '../lib/icons';
  import { app, BASE, closeSheet } from './state.svelte';
  import type { AppDay, AppStop } from './types';
  import LiveEdit from './LiveEdit.svelte';
  import { loadRate, usd } from './fx.svelte';

  let { stop, day, onstep }: { stop: AppStop; day: AppDay; onstep?: (dir: 1 | -1) => void } = $props();
  // The stops either side, and the hop to the next one ("Next: Gion · 15 min walk").
  const at = $derived(day.stops.findIndex((s) => s.id === stop.id));
  const prevStop = $derived(day.stops[at - 1] ?? null);
  const nextStop = $derived(day.stops[at + 1] ?? null);
  const hop = $derived.by(() => {
    const leg = day.legs[stop.id];
    if (!nextStop) return null;
    if (!leg) return `at ${nextStop.start}`;
    const rides = leg.segs.filter((x) => x.m !== 'walk' && x.coords.length > 1);
    if (!rides.length) return `${leg.minutes} min walk`;
    const first = rides[0];
    return `${leg.minutes} min by ${first.line ?? ({ car: 'taxi', bus: 'bus', boat: 'boat', ropeway: 'ropeway', funicular: 'cable car' } as Record<string, string>)[first.m] ?? 'train'}${rides.length > 1 ? ` +${rides.length - 1}` : ''}`;
  });
  let dlg = $state<HTMLDialogElement>();
  let body = $state<HTMLElement>();
  let copied = $state('');
  let playing = $state<string | null>(null);

  $effect(() => {
    const d = dlg;
    if (!d) return;
    // Not modal: the map stays lit and you can pan it, tap its pins or pick another stop.
    if (!d.open) d.show();
    return () => { if (d.open) d.close(); };
  });
  $effect(() => { void stop.id; body?.scrollTo({ top: 0 }); playing = null; });
  // Three sizes. Phone: half first, so the map above shows where the stop is; scrolling the details or
  // swiping up opens it to full; swiping down goes full → half → peek (just the name, the map takes
  // the screen) → closed. Laptop: the panel, or a small card in the map's corner.
  const size = $derived(app.sheetSize);
  const phone = () => innerWidth < 900;
  const bigger = () => { app.sheetSize = size === 'peek' ? 'half' : 'full'; };
  const smaller = () => { if (size === 'full') app.sheetSize = 'half'; else if (size === 'half') app.sheetSize = 'peek'; else closeSheet(); };
  const toggle = () => { app.sheetSize = size === 'peek' ? 'half' : 'peek'; body?.scrollTo({ top: 0 }); };
  const onScroll = () => { if (size === 'half' && phone() && (body?.scrollTop ?? 0) > 16) app.sheetSize = 'full'; };
  const release = (d: number, closeAt: number) => {
    if (d > closeAt) { if (phone() && size !== 'peek') { smaller(); dy = 0; } else closeSheet(); }
    else dy = 0;
  };

  const g = $derived(stop.guide);
  const photo = $derived(g?.media.find((m) => m.kind === 'image') ?? null);
  const videos = $derived(g?.media.filter((m) => m.kind !== 'image' && m.embed) ?? []);
  // "2026-12-19, 2026-12-20, 2026-12-21" reads as "Dec 19–21".
  const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const niceDates = (t: string) => t
    .replace(/\b\d{4}-(\d{2})-(\d{2})\b/g, (_, m, d) => `${MON[+m - 1]} ${+d}`)
    .replace(/\b([A-Z][a-z]{2}) (\d{1,2})(?:, \1 \d{1,2})+/g, (all, mon) => {
      const ds = [...all.matchAll(/\b\d{1,2}\b/g)].map((x) => +x[0]);
      return ds.every((v, i) => !i || v === ds[i - 1] + 1) ? `${mon} ${ds[0]}–${ds.at(-1)}` : `${mon} ${ds.join(', ')}`;
    });
  const host = (u: string) => { try { return new URL(u).hostname.replace(/^www\./, ''); } catch { return 'source'; } };
  /** "2020-03" → "Mar 2020": how old the street photo is. */
  const monthOf = (ym: string) => new Date(`${ym}-01T00:00:00Z`).toLocaleDateString('en-GB', { month: 'short', year: 'numeric', timeZone: 'UTC' });
  // With Google's place ID, Maps routes to the place itself (its name, its entrance), not a dropped pin.
  const directions = (s: AppStop) => `https://www.google.com/maps/dir/?api=1&destination=${s.lat},${s.lng}${s.google ? `&destination_place_id=${encodeURIComponent(s.google.id)}` : ''}&travelmode=transit`;
  const gm = $derived(stop.google ?? null);
  /** "Dec 8": when the Google facts were fetched. */
  const checkedOn = (ymd: string) => (ymd ? `${MON[+ymd.slice(5, 7) - 1]} ${+ymd.slice(8, 10)}` : '');

  // Yen at today's rate (a range stays a range: "¥500–1,500" ≈ "$3.2–9.6").
  $effect(() => loadRate());

  async function copy(text: string, what: string) {
    try { await navigator.clipboard.writeText(text); copied = what; setTimeout(() => (copied = ''), 1600); } catch { /* the text is on screen to select */ }
  }
  // Swipe down to close: on the handle, or anywhere on the sheet once it's scrolled to the top (phone).
  let startY = 0;
  let dy = $state(0);
  let dragging = $state(false);
  const down = (e: PointerEvent) => { startY = e.clientY; dragging = true; (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); };
  const move = (e: PointerEvent) => {
    if (!startY) return;
    const d = e.clientY - startY;
    if (d < -40 && size !== 'full' && phone()) { bigger(); startY = 0; dragging = false; dy = 0; return; }
    dy = Math.max(0, d);
  };
  const up = () => { if (startY) release(dy, 90); startY = 0; dragging = false; }; // closing keeps the offset, so it slides on from there
  // A sideways swipe steps to the stop before or after (phone).
  let touchY = 0, touchX = 0, lastX = 0, sideways = false, tracking = false;
  const tStart = (e: TouchEvent) => { tracking = innerWidth < 900 && (body?.scrollTop ?? 0) <= 0; touchY = e.touches[0].clientY; touchX = lastX = e.touches[0].clientX; sideways = false; };
  const tMove = (e: TouchEvent) => {
    lastX = e.touches[0].clientX;
    const dx = lastX - touchX, dyy = e.touches[0].clientY - touchY;
    if (!sideways && Math.abs(dx) > 14 && Math.abs(dx) > Math.abs(dyy) * 1.4) { sideways = true; tracking = false; dy = 0; dragging = false; }
    if (sideways || !tracking) return;
    const d = e.touches[0].clientY - touchY;
    if (d < 0) { tracking = false; dy = 0; dragging = false; return; } // scrolling up into the sheet
    dragging = true; dy = d;
  };
  const tEnd = () => {
    if (sideways && Math.abs(lastX - touchX) > 64) onstep?.(lastX < touchX ? 1 : -1);
    else if (tracking) release(dy, 100); else dy = 0;
    tracking = false; dragging = false; sideways = false;
  };
  // Leaving slides the sheet away (down on a phone, right on a laptop) instead of cutting it.
  const exit = (node: Element) => fly(node, innerWidth < 900 ? { y: Math.max(240, (node as HTMLElement).offsetHeight * 0.6), duration: 200, easing: cubicIn, opacity: 1 } : { x: 160, duration: 180, easing: cubicIn, opacity: 0 });
</script>

<svelte:window onkeydown={(e) => {
  if (app.search || (e.target as HTMLElement | null)?.closest?.('input, textarea, select')) return;
  if (e.key === 'Escape') { e.preventDefault(); closeSheet(); }
  else if (e.key === 'ArrowRight' && nextStop) { e.preventDefault(); onstep?.(1); }
  else if (e.key === 'ArrowLeft' && prevStop) { e.preventDefault(); onstep?.(-1); }
}} />

<dialog bind:this={dlg} class="sheet" class:peek={size === 'peek'} aria-labelledby="sheet-title" style:--drag="{dy}px">
  <div class="panel" class:dragging class:full={size === 'full'} class:peek={size === 'peek'} out:exit|global>
    <!-- Its own bar above the scrolling content, so nothing ever runs under the close button. The
         whole bar is a handle for the swipe down. -->
    <div class="bar" onpointerdown={down} onpointermove={move} onpointerup={up} onpointercancel={up}>
      <span class="grip" aria-hidden="true"></span>
      <span class="steps">
        <button type="button" onclick={() => onstep?.(-1)} onpointerdown={(e) => e.stopPropagation()} disabled={!prevStop} aria-label={prevStop ? `Previous stop: ${prevStop.name}` : 'No earlier stop today'}>{@html icon('prev')}</button>
        <span class="pos num" aria-hidden="true">{at + 1}/{day.stops.length}</span>
        <button type="button" onclick={() => onstep?.(1)} onpointerdown={(e) => e.stopPropagation()} disabled={!nextStop} aria-label={nextStop ? `Next stop: ${nextStop.name}${day.legs[stop.id] ? ', playing the ride' : ''}` : 'Last stop today'}>{@html icon('next')}</button>
      </span>
      <button class="fold" type="button" onclick={toggle} onpointerdown={(e) => e.stopPropagation()} aria-expanded={size !== 'peek'} aria-label={size === 'peek' ? 'Show the details' : 'Show the map'}>{@html icon('next')}</button>
      <button class="close" type="button" onclick={closeSheet} onpointerdown={(e) => e.stopPropagation()} aria-label="Close">{@html icon('x')}</button>
    </div>
    <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
    <div class="scroll" bind:this={body} onclick={() => { if (size === 'peek') app.sheetSize = 'half'; }} onscroll={onScroll} ontouchstart={tStart} ontouchmove={tMove} ontouchend={tEnd} ontouchcancel={tEnd}>
      {#if photo}
        <figure class="hero"><img src={photo.large ? BASE + photo.large : photo.url} alt="" decoding="async" referrerpolicy="no-referrer" onerror={(e) => (e.currentTarget as HTMLElement).closest('figure')?.remove()} />{#if photo.credit}<figcaption>{photo.credit}</figcaption>{/if}</figure>
      {/if}
      <header class="top">
        <p class="when num"><b>{stop.start}</b>–{stop.end} · Day {day.n} · stop {stop.i}</p>
        <h2 id="sheet-title">{stop.name}</h2>
        {#if stop.ja}<p class="ja" lang="ja">{stop.ja}</p>{/if}
        <p class="tags">
          <span>{stop.catLabel}</span>
          {#if stop.price}<span class="num">{stop.price}{#if usd(stop.price)}&nbsp;<small>≈&nbsp;${usd(stop.price)}</small>{/if}</span>{/if}
          {#if stop.mark === 'tobook'}<span class="book">To book</span>{:else if stop.mark === 'tocheck'}<span class="check">Check before</span>{/if}
        </p>
        {#if stop.hook ?? stop.plan}<p class="hook">{stop.hook ?? stop.plan}</p>{/if}
        {#if nextStop || stop.lat != null}
          <p class="next">
            {#if nextStop}<span class="nx">Next: <b>{nextStop.name}</b>{#if hop}{' · '}{hop}{/if}</span>{:else}<span class="nx">Last stop of the day</span>{/if}
            {#if stop.lat != null}<a class="go" href={directions(stop)} target="_blank" rel="noopener" onclick={(e) => e.stopPropagation()}>{@html icon('navigation')}<span>Go</span></a>{/if}
          </p>
        {/if}
      </header>

      <div class="livebox"><LiveEdit {stop} date={day.date} /></div>

      <div class="actions">
        {#if stop.lat != null}<a class="act primary" href={directions(stop)} target="_blank" rel="noopener">{@html icon('navigation')}<span>Directions</span></a>{/if}
        {#if stop.website && !/google\.com\/maps/.test(stop.website)}<a class="act" href={stop.website} target="_blank" rel="noopener">{@html icon('globe')}<span>Website</span></a>{/if}
        {#if stop.phone}<a class="act" href={`tel:${stop.phone.replace(/[^\d+]/g, '')}`}>{@html icon('phone')}<span>{stop.phone}</span></a>{/if}
      </div>

      {#if gm?.closed || gm?.clash}
        <p class="box warn" class:soft={!gm.closed && gm.clash?.kind !== 'closed'}>{@html icon('alert')}<span>{gm.closed ? `Google Maps says it's closed ${gm.closed}.` : gm.clash!.text}{#if gm.checked}{' '}<small>Checked {checkedOn(gm.checked)}.</small>{/if}</span></p>
      {/if}

      {#if gm && (gm.rating || gm.summary || gm.pay || gm.book || gm.groups)}
        <!-- Google's review summary must carry its Gemini disclosure and a link to the reviews. -->
        <section class="box gmaps">
          {#if gm.rating}<p class="stars"><b class="num">{gm.rating.toFixed(1)}</b><span class="st" aria-hidden="true" style:--r={gm.rating}></span>{#if gm.ratings}<span class="num">{gm.ratings.toLocaleString('en-US')} reviews</span>{/if}{#if gm.maps}<a href={gm.maps} target="_blank" rel="noopener">Google Maps</a>{/if}</p>{/if}
          {#if gm.pay || gm.book || gm.groups}
            <p class="gtags">
              {#if gm.pay === 'cash'}<span class="cash">Cash only</span>{:else if gm.pay === 'cards'}<span>Takes cards</span>{/if}
              {#if gm.book}<span>Takes reservations</span>{/if}
              {#if gm.groups}<span>Good for groups</span>{/if}
            </p>
          {/if}
          {#if gm.summary}<p class="gsum">{gm.summary.text}</p><p class="gby">Summarized with Gemini{#if gm.summary.uri}{' · '}<a href={gm.summary.uri} target="_blank" rel="noopener">Read the reviews</a>{/if}</p>{/if}
        </section>
      {/if}

      {#if stop.street}
        <!-- What the pin looks like from the street, to spot the door; tap to look around in Google Maps. -->
        <figure class="street">
          <a href={stop.street.url} target="_blank" rel="noopener"><img src={BASE + stop.street.src} alt={`The street outside ${stop.name}`} loading="lazy" decoding="async" onerror={(e) => (e.currentTarget as HTMLElement).closest('figure')?.remove()} /></a>
          <figcaption>From the street{#if stop.street.date}, {monthOf(stop.street.date)}{/if} · <a href={stop.street.url} target="_blank" rel="noopener">Look around</a></figcaption>
        </figure>
      {/if}

      {#if stop.confirmation}
        <section class="box conf"><span>Confirmation</span><code>{stop.confirmation}</code><button type="button" onclick={() => copy(stop.confirmation!, 'conf')}>{@html icon(copied === 'conf' ? 'check' : 'copy')}<span class="sr-only">Copy confirmation</span></button></section>
      {/if}

      {#if g}
        <p class="story">{g.story}</p>
        {#if g.how.length}<section><h3>How to do it</h3><ol class="how">{#each g.how as x}<li>{x}</li>{/each}</ol></section>{/if}
        {#if g.tips.length}<section><h3>Tips</h3><ul class="tips">{#each g.tips as x}<li>{x}</li>{/each}</ul></section>{/if}
        {#if g.cost || g.booking || g.hours}
          <dl class="box grid">
            {#if g.cost}<div><dt>Cost</dt><dd>{g.cost}</dd></div>{/if}
            {#if g.booking}<div><dt>Booking</dt><dd>{g.booking}</dd></div>{/if}
            {#if g.hours}<div><dt>Hours</dt><dd>{g.hours}</dd></div>{/if}
          </dl>
        {/if}
        {#if videos.length}
          <section><h3>Watch</h3><div class="videos">
            {#each videos as v}
              {#if playing === v.url}<iframe class="frame" data-kind={v.kind} src={v.embed} title="Video" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe>
              {:else}<button type="button" class="vid" data-kind={v.kind} onclick={() => (playing = v.url)} aria-label={`Play ${v.kind} video${v.credit ? ` by ${v.credit}` : ''}`}>{#if v.thumb}<img src={v.thumb} alt="" referrerpolicy="no-referrer" />{/if}<span class="pb">{@html icon('play')}</span><span class="vl">{v.kind === 'youtube' ? 'YouTube' : v.kind === 'tiktok' ? 'TikTok' : 'Reel'}{v.credit ? ` · ${v.credit}` : ''}</span></button>{/if}
            {/each}
          </div></section>
        {/if}
        {#if g.facts.length}
          <section><h3>Checked facts</h3><ul class="facts">{#each g.facts as f}<li>{niceDates(f.text)} <a href={f.url} target="_blank" rel="noopener">{host(f.url)}</a></li>{/each}</ul></section>
        {/if}
        {#if g.wishes.length}<p class="wish">Because you asked: {g.wishes.join(' · ')}</p>{/if}
        {#if g.sources.length}<p class="src">Found in {#each g.sources as x, k}{k ? ' · ' : ''}<a href={x.url} target="_blank" rel="noopener">{x.label}</a>{/each}</p>{/if}
      {/if}

      {#if stop.details.length || stop.extra.length}
        <dl class="box grid">{#each stop.details as d}<div>{#if d.label}<dt>{d.label}</dt>{/if}<dd>{d.text}</dd></div>{/each}</dl>
        {#each stop.extra as x}<p class="extra">{x}</p>{/each}
      {/if}

      {#if stop.address}
        <section class="box addr"><span lang="ja">{stop.address}</span><button type="button" onclick={() => copy(stop.address!, 'addr')}>{@html icon(copied === 'addr' ? 'check' : 'copy')}<span class="sr-only">Copy address</span></button></section>
      {/if}
    </div>
  </div>
</dialog>

<style>
  .sheet { position: fixed; z-index: 50; inset: auto 0 0 0; margin: 0; width: 100%; max-width: 100%; max-height: 92svh; height: auto; padding: 0; border: 0; background: transparent; color: var(--washi); overflow: visible;
    /* Half height: from just under the map to the bottom of the screen. */
    --half: max(44svh, calc(100svh - var(--bar-h) - env(safe-area-inset-top, 0px) - 40svh - 6px)); }
  .panel { position: relative; height: auto; max-height: var(--half); display: flex; flex-direction: column; background: var(--night-2); border-radius: var(--r-l) var(--r-l) 0 0; border-top: 1px solid oklch(83% 0.145 76 / 0.5); box-shadow: 0 -18px 50px -12px oklch(10% 0.05 276 / 0.8); transform: translateY(var(--drag, 0)); animation: up var(--t-slow) var(--ease); transition: transform var(--t-fast) var(--ease), max-height var(--t-med) var(--ease); }
  .panel.full { max-height: 92svh; }
  /* Peek: the bar and the name and time; the map takes the rest. Tap it or swipe up for more. */
  .panel.peek { max-height: calc(var(--peek-h) + env(safe-area-inset-bottom, 0px)); cursor: pointer; }
  .panel.peek .scroll { overflow: hidden; }
  .panel.peek .scroll > :not(.top), .panel.peek .top > :not(.when):not(h2):not(.next) { display: none; }
  .panel.peek h2 { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-size: 1.2rem; }
  /* The bar: previous and next stop on the left, fold and close on the right. */
  .steps { position: absolute; top: 6px; left: 10px; display: flex; align-items: center; gap: 2px; }
  .steps button { width: 40px; height: 40px; display: grid; place-items: center; border-radius: 50%; border: 1px solid var(--rule); background: oklch(23.5% 0.058 278 / 0.9); color: var(--washi); cursor: pointer; }
  .steps button:disabled { opacity: 0.35; cursor: default; }
  .steps button :global(svg) { width: 18px; height: 18px; }
  .pos { min-width: 38px; text-align: center; font-size: 0.74rem; font-weight: 700; color: var(--washi-3); }
  /* Next hop and Go: on the full sheet and on the folded card. */
  .next { display: flex; align-items: center; gap: 10px; margin-top: 6px; padding: 8px 8px 8px 12px; border-radius: var(--r-m); background: var(--night-3); font-size: 0.84rem; color: var(--washi-2); }
  .nx { flex: 1; min-width: 0; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; line-height: 1.35; }
  .nx b { color: var(--washi); font-weight: 700; }
  .go { flex: none; display: inline-flex; align-items: center; gap: 5px; height: 34px; padding: 0 14px; border-radius: 99px; background: var(--lantern); color: oklch(20% 0.05 276); font-weight: 700; font-size: 0.84rem; text-decoration: none; }
  .go :global(svg) { width: 15px; height: 15px; }
  .fold { position: absolute; z-index: 2; top: 6px; right: 58px; width: 40px; height: 40px; display: grid; place-items: center; border-radius: 50%; border: 1px solid var(--rule); background: oklch(23.5% 0.058 278 / 0.9); color: var(--washi); cursor: pointer; }
  .fold :global(svg) { width: 18px; height: 18px; rotate: 90deg; transition: rotate var(--t-med) var(--ease); }
  .fold[aria-expanded='false'] :global(svg) { rotate: -90deg; }
  .panel.dragging { transition: none; }
  @keyframes up { from { transform: translateY(40%); opacity: 0.4; } }
  @keyframes fade { from { opacity: 0; } }
  .bar { flex: none; position: relative; height: 52px; display: grid; place-items: center; cursor: grab; touch-action: none; border-bottom: 1px solid transparent; }
  .grip { width: 42px; height: 5px; border-radius: 99px; background: var(--night-4); }
  .close { position: absolute; z-index: 2; top: 6px; right: 10px; width: 40px; height: 40px; display: grid; place-items: center; border-radius: 50%; border: 1px solid var(--rule); background: oklch(23.5% 0.058 278 / 0.9); color: var(--washi); cursor: pointer; }
  .close :global(svg) { width: 18px; height: 18px; }
  .scroll { overflow-y: auto; overscroll-behavior: contain; padding: 0 max(18px, env(safe-area-inset-right, 0px)) calc(28px + env(safe-area-inset-bottom, 0px)) max(18px, env(safe-area-inset-left, 0px)); display: grid; grid-template-columns: minmax(0, 1fr); gap: 16px; align-content: start; }
  .hero { margin: 0 calc(-1 * max(18px, env(safe-area-inset-left, 0px))); }
  .hero img { width: 100%; aspect-ratio: 16 / 9; object-fit: cover; }
  .hero figcaption { font-size: 0.72rem; color: var(--washi-3); padding: 4px 18px 0; }
  .warn { display: flex; gap: 10px; align-items: flex-start; background: var(--noren-wash); color: oklch(86% 0.09 35); font-size: 0.88rem; line-height: 1.45; font-weight: 600; }
  .warn.soft { background: var(--night-3); color: var(--washi-2); font-weight: 500; }
  .warn :global(svg) { flex: none; width: 17px; height: 17px; margin-top: 1px; color: oklch(78% 0.13 35); }
  .warn.soft :global(svg) { color: var(--lantern); }
  .warn small { color: var(--washi-3); font-weight: 500; }
  .gmaps { display: grid; gap: 8px; font-size: 0.86rem; }
  .stars { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; color: var(--washi-2); }
  .stars b { color: var(--washi); font-size: 1rem; }
  /* Five stars filled to the rating: a gold mask over a dim one. */
  .st { --star: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M12 2l2.9 6.9 7.1.6-5.4 4.7 1.6 7.3L12 17.8 5.8 21.5l1.6-7.3L2 9.5l7.1-.6z'/%3E%3C/svg%3E");
    width: 75px; height: 14px; background: linear-gradient(90deg, var(--lantern) calc(var(--r) / 5 * 100%), var(--night-4) 0); mask: var(--star) 0 0 / 15px 14px repeat-x; -webkit-mask: var(--star) 0 0 / 15px 14px repeat-x; }
  .stars a { margin-left: auto; color: var(--lantern); font-weight: 600; }
  .gtags { display: flex; flex-wrap: wrap; gap: 6px; font-size: 0.76rem; }
  .gtags span { padding: 2px 9px 3px; border-radius: 99px; background: var(--night-2); color: var(--washi-2); font-weight: 600; }
  .gtags .cash { background: var(--noren-wash); color: oklch(82% 0.11 35); }
  .gsum { color: var(--washi); line-height: 1.5; }
  .gby { font-size: 0.74rem; color: var(--washi-3); }
  .gby a { color: var(--lantern); font-weight: 600; }
  .street { display: grid; gap: 5px; margin: 0; }
  .street img { display: block; width: 100%; aspect-ratio: 16 / 9; object-fit: cover; border-radius: var(--r-m); background: var(--night-3); }
  .street figcaption { font-size: 0.78rem; color: var(--washi-3); }
  .street figcaption a { color: var(--lantern); font-weight: 600; }
  .top { display: grid; grid-template-columns: minmax(0, 1fr); gap: 5px; min-width: 0; }
  .when { font-size: 0.82rem; color: var(--washi-2); }
  .when b { color: var(--lantern); font-weight: 700; font-size: 0.95rem; }
  h2 { font-size: 1.4rem; line-height: 1.22; font-weight: 700; }
  .ja { color: var(--washi-3); font-size: 0.86rem; }
  .tags { display: flex; flex-wrap: wrap; gap: 6px; font-size: 0.76rem; }
  .tags span { padding: 2px 9px 3px; border-radius: 99px; background: var(--night-3); color: var(--washi-2); font-weight: 600; }
  .tags small { color: var(--washi-3); font-weight: 500; }
  .tags .book { background: var(--noren); color: var(--on-noren); }
  .tags .check { background: var(--noren-wash); color: oklch(82% 0.11 35); }
  .hook { font-size: 1rem; line-height: 1.5; color: var(--washi); font-weight: 500; }
  .actions { display: flex; flex-wrap: wrap; gap: 8px; }
  .livebox { display: grid; gap: 10px; }
  .livebox:empty { display: none; }
  .panel.peek .livebox { display: none; }
  .act { display: inline-flex; align-items: center; gap: 7px; min-height: 44px; padding: 0 16px; border-radius: 99px; border: 1px solid var(--rule-strong); color: var(--washi); text-decoration: none; font-weight: 600; font-size: 0.9rem; }
  .act :global(svg) { width: 17px; height: 17px; }
  .act.primary { background: var(--lantern); border-color: var(--lantern); color: oklch(20% 0.05 276); }
  .story { font-size: 0.98rem; line-height: 1.62; color: var(--washi); max-width: 68ch; }
  h3 { font-size: 0.86rem; font-weight: 700; color: var(--lantern); margin-bottom: 6px; }
  .how, .tips { padding-left: 1.15rem; display: grid; gap: 6px; font-size: 0.92rem; line-height: 1.5; color: var(--washi-2); }
  .tips { list-style: '·  '; }
  .box { border-radius: var(--r-m); background: var(--night-3); padding: 12px 14px; }
  .grid { display: grid; gap: 8px; margin: 0; font-size: 0.88rem; }
  .grid div { display: grid; grid-template-columns: 5.2rem 1fr; gap: 10px; }
  .grid dt { color: var(--washi-3); font-weight: 600; }
  .grid dd { margin: 0; color: var(--washi); }
  .conf, .addr { display: flex; align-items: center; gap: 10px; font-size: 0.88rem; }
  .conf span { color: var(--washi-3); }
  code { font-family: var(--f-display); letter-spacing: 0.06em; color: var(--lantern); }
  .conf button, .addr button { margin-left: auto; flex: none; width: 40px; height: 40px; display: grid; place-items: center; border-radius: 50%; border: 1px solid var(--rule); background: none; color: var(--lantern); cursor: pointer; }
  .conf :global(svg), .addr :global(svg) { width: 17px; height: 17px; }
  .addr span { color: var(--washi-2); }
  .videos { display: flex; gap: 10px; overflow-x: auto; scrollbar-width: none; }
  .vid { position: relative; flex: none; width: 140px; aspect-ratio: 9 / 16; padding: 0; border: 0; border-radius: 14px; overflow: hidden; background: var(--night-3); cursor: pointer; color: var(--washi); }
  .vid[data-kind='youtube'] { width: 240px; aspect-ratio: 16 / 9; }
  .vid img { width: 100%; height: 100%; object-fit: cover; }
  .pb { position: absolute; inset: 0; display: grid; place-items: center; }
  .pb :global(svg) { width: 34px; height: 34px; filter: drop-shadow(0 2px 8px oklch(10% 0.05 276 / 0.8)); }
  .vl { position: absolute; left: 0; right: 0; bottom: 0; padding: 18px 8px 6px; font-size: 0.72rem; font-weight: 700; text-align: left; background: linear-gradient(transparent, oklch(12% 0.04 276 / 0.85)); }
  .frame { width: 100%; max-width: 340px; aspect-ratio: 9 / 16; border: 0; border-radius: 14px; }
  .frame[data-kind='youtube'] { max-width: none; aspect-ratio: 16 / 9; }
  .facts { list-style: none; padding: 0; display: grid; gap: 5px; font-size: 0.84rem; color: var(--washi-2); }
  .facts li::before { content: '✓  '; color: var(--ok); }
  .facts a, .src a { color: var(--lantern); }
  .wish { font-size: 0.82rem; color: var(--washi-2); font-weight: 600; }
  .src, .extra { font-size: 0.8rem; color: var(--washi-3); }

  /* Phone: the half sheet leads with what and when (name, tags, Directions); the photo follows. */
  @media (max-width: 899px) { .hero { order: 1; margin-top: 4px; } .story, .scroll > section, .scroll > .box, .scroll > p, .scroll > dl { order: 2; } .scroll > .warn { order: 0; } }
  @media (min-width: 900px) {
    /* Beside the map, under the top bar (search stays in reach). */
    .sheet { inset: var(--bar-h) 0 0 auto; width: min(460px, 38vw); height: auto; max-height: none; }
    .panel, .panel.full { height: 100%; max-height: none; }
    /* Folded: a small card in the map's top corner, the whole map in view. */
    .sheet.peek { bottom: auto; top: calc(var(--bar-h) + 14px); right: 14px; width: min(400px, 34vw); }
    .sheet.peek .panel { height: auto; max-height: none; border: 1px solid oklch(83% 0.145 76 / 0.35); border-radius: var(--r-l); box-shadow: 0 18px 50px -12px oklch(10% 0.05 276 / 0.85); }
    .sheet.peek .bar { position: absolute; inset: 0 0 auto 0; }
    .sheet.peek .scroll { padding-top: 54px; padding-bottom: 14px; }
    .panel { border-radius: 0; border-top: 0; border-left: 1px solid oklch(83% 0.145 76 / 0.35); animation-name: side; }
    @keyframes side { from { transform: translateX(30%); opacity: 0.4; } }
    .grip { display: none; }
    .bar { cursor: default; }
  }
</style>
