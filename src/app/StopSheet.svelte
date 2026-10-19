<script lang="ts">
  // Everything about one stop, in a native dialog: Back, Escape, the backdrop, the close button and a
  // swipe down all close it, and nothing can leave it half open.
  import { icon } from '../lib/icons';
  import { BASE, closeSheet } from './state.svelte';
  import type { AppDay, AppStop } from './types';

  let { stop, day }: { stop: AppStop; day: AppDay } = $props();
  let dlg = $state<HTMLDialogElement>();
  let body = $state<HTMLElement>();
  let copied = $state('');
  let playing = $state<string | null>(null);

  $effect(() => {
    const d = dlg;
    if (!d) return;
    if (!d.open) d.showModal();
    return () => { if (d.open) d.close(); };
  });
  $effect(() => { void stop.id; body?.scrollTo({ top: 0 }); playing = null; });

  const g = $derived(stop.guide);
  const photo = $derived(g?.media.find((m) => m.kind === 'image') ?? null);
  const videos = $derived(g?.media.filter((m) => m.kind !== 'image' && m.embed) ?? []);
  const host = (u: string) => { try { return new URL(u).hostname.replace(/^www\./, ''); } catch { return 'source'; } };
  const directions = (s: AppStop) => `https://www.google.com/maps/dir/?api=1&destination=${s.lat},${s.lng}&travelmode=transit`;

  // Yen at today's rate, once per session.
  let rate = $state<number | null>(null);
  $effect(() => {
    let live = true;
    const cached = (() => { try { return Number(sessionStorage.getItem('jt:fx')) || null; } catch { return null; } })();
    if (cached) { rate = cached; return; }
    fetch('https://api.frankfurter.dev/v1/latest?from=USD&to=JPY').then((r) => r.json()).then((j) => { if (!live) return; rate = j.rates.JPY; try { sessionStorage.setItem('jt:fx', String(rate)); } catch { /* fine */ } }).catch(() => {});
    return () => { live = false; };
  });
  const usd = (s: string | null) => { const m = s?.match(/¥\s?([\d,]+)/); if (!m || !rate) return null; const v = Number(m[1].replace(/,/g, '')) / rate; return v < 10 ? v.toFixed(1) : Math.round(v).toLocaleString('en-US'); };

  async function copy(text: string, what: string) {
    try { await navigator.clipboard.writeText(text); copied = what; setTimeout(() => (copied = ''), 1600); } catch { /* the text is on screen to select */ }
  }
  // Swipe down on the handle to close.
  let startY = 0;
  let dy = $state(0);
  const down = (e: PointerEvent) => { startY = e.clientY; (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); };
  const move = (e: PointerEvent) => { if (startY) dy = Math.max(0, e.clientY - startY); };
  const up = () => { if (dy > 90) closeSheet(); startY = 0; dy = 0; };
</script>

<dialog bind:this={dlg} class="sheet" aria-labelledby="sheet-title" oncancel={(e) => { e.preventDefault(); closeSheet(); }} onclick={(e) => { if (e.target === dlg) closeSheet(); }} style:--drag="{dy}px">
  <div class="panel">
    <div class="grip" onpointerdown={down} onpointermove={move} onpointerup={up} onpointercancel={up} aria-hidden="true"><span></span></div>
    <button class="close" type="button" onclick={closeSheet} aria-label="Close">{@html icon('x')}</button>
    <div class="scroll" bind:this={body}>
      {#if photo}
        <figure class="hero"><img src={photo.large ? BASE + photo.large : photo.url} alt="" decoding="async" referrerpolicy="no-referrer" onerror={(e) => (e.currentTarget as HTMLElement).closest('figure')?.remove()} />{#if photo.credit}<figcaption>{photo.credit}</figcaption>{/if}</figure>
      {/if}
      <header class="top">
        <p class="when num"><b>{stop.start}</b>–{stop.end} · Day {day.n} · stop {stop.i}</p>
        <h2 id="sheet-title">{stop.name}</h2>
        {#if stop.ja}<p class="ja" lang="ja">{stop.ja}</p>{/if}
        <p class="tags">
          <span>{stop.catLabel}</span>
          {#if stop.price}<span class="num">{stop.price}{#if usd(stop.price)} <small>≈ ${usd(stop.price)}</small>{/if}</span>{/if}
          {#if stop.mark === 'tobook'}<span class="book">To book</span>{:else if stop.mark === 'tocheck'}<span class="check">Check before</span>{/if}
        </p>
        {#if stop.hook ?? stop.plan}<p class="hook">{stop.hook ?? stop.plan}</p>{/if}
      </header>

      <div class="actions">
        {#if stop.lat != null}<a class="act primary" href={directions(stop)} target="_blank" rel="noopener">{@html icon('navigation')}<span>Directions</span></a>{/if}
        {#if stop.website && !/google\.com\/maps/.test(stop.website)}<a class="act" href={stop.website} target="_blank" rel="noopener">{@html icon('globe')}<span>Website</span></a>{/if}
        {#if stop.phone}<a class="act" href={`tel:${stop.phone.replace(/[^\d+]/g, '')}`}>{@html icon('phone')}<span>{stop.phone}</span></a>{/if}
      </div>

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
          <section><h3>Checked facts</h3><ul class="facts">{#each g.facts as f}<li>{f.text} <a href={f.url} target="_blank" rel="noopener">{host(f.url)}</a></li>{/each}</ul></section>
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
  .sheet { position: fixed; inset: auto 0 0 0; margin: 0; width: 100%; max-width: 100%; max-height: 92svh; height: auto; padding: 0; border: 0; background: transparent; color: var(--washi); overflow: visible; }
  .sheet::backdrop { background: oklch(12% 0.04 276 / 0.55); animation: fade var(--t-med) var(--ease); }
  .panel { position: relative; height: auto; max-height: 92svh; display: flex; flex-direction: column; background: var(--night-2); border-radius: var(--r-l) var(--r-l) 0 0; border-top: 1px solid oklch(83% 0.145 76 / 0.5); box-shadow: 0 -18px 50px -12px oklch(10% 0.05 276 / 0.8); transform: translateY(var(--drag, 0)); animation: up var(--t-slow) var(--ease); }
  @keyframes up { from { transform: translateY(40%); opacity: 0.4; } }
  @keyframes fade { from { opacity: 0; } }
  .grip { flex: none; height: 26px; display: grid; place-items: center; cursor: grab; touch-action: none; }
  .grip span { width: 42px; height: 5px; border-radius: 99px; background: var(--night-4); }
  .close { position: absolute; z-index: 2; top: 12px; right: 12px; width: 40px; height: 40px; display: grid; place-items: center; border-radius: 50%; border: 1px solid var(--rule); background: oklch(23.5% 0.058 278 / 0.9); color: var(--washi); cursor: pointer; }
  .close :global(svg) { width: 18px; height: 18px; }
  .scroll { overflow-y: auto; overscroll-behavior: contain; padding: 0 max(18px, env(safe-area-inset-right, 0px)) calc(28px + env(safe-area-inset-bottom, 0px)) max(18px, env(safe-area-inset-left, 0px)); display: grid; gap: 16px; align-content: start; }
  .hero { margin: 0 calc(-1 * max(18px, env(safe-area-inset-left, 0px))); }
  .hero img { width: 100%; aspect-ratio: 16 / 9; object-fit: cover; }
  .hero figcaption { font-size: 0.72rem; color: var(--washi-3); padding: 4px 18px 0; }
  .top { display: grid; gap: 5px; padding-right: 44px; }
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
  .wish { font-size: 0.82rem; color: oklch(82% 0.11 35); font-weight: 600; }
  .src, .extra { font-size: 0.8rem; color: var(--washi-3); }

  @media (min-width: 900px) {
    .sheet { inset: 0 0 0 auto; width: min(480px, 42vw); height: 100%; max-height: 100%; }
    .panel { height: 100%; max-height: none; }
    .panel { border-radius: 0; border-top: 0; border-left: 1px solid oklch(83% 0.145 76 / 0.35); animation-name: side; }
    @keyframes side { from { transform: translateX(30%); opacity: 0.4; } }
    .grip { display: none; }
    .scroll { padding-top: 16px; }
    .hero { margin-top: -16px; }
  }
</style>
