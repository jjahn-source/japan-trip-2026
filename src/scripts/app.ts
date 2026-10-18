// App glue: each page declares a view; the stage flies to it. The panel is a left dock on
// wide screens and a three-snap bottom sheet on phones, and the map's padding always matches
// the part of the screen the panel covers, so every camera move centres in the open map.
import { navigate } from 'astro:transitions/client';
import { bindScrubber, boot, focusLine, focusPoint, focusStop, openTrend, pickStop, setPadding, show, trendsFor, type ViewKind } from './map/stage';
import { adds, exportText, isAdded, removeAdd, walkMin } from './adds';
import { current, now, tripDate, tripPhase, trip } from './live';

const base = import.meta.env.BASE_URL.replace(/\/$/, '');
const wide = matchMedia('(min-width: 900px)');
type Snap = 'peek' | 'half' | 'full';
const DEFAULT_SNAP: Record<ViewKind, Snap> = { overview: 'peek', day: 'half', bookings: 'half', plain: 'full' }; // bookings has a map layer of its own
let firstLoad = true;
let unbindScrubber: (() => void) | null = null;

const panel = () => document.querySelector<HTMLElement>('[data-panel]');
const head = () => document.querySelector<HTMLElement>('[data-panel-head]');

/* ── map padding follows the panel ── */
function padding() {
  const p = panel();
  if (!p) return;
  if (wide.matches) setPadding({ top: 24, right: 72, bottom: 24, left: p.getBoundingClientRect().right + 24 });
  else setPadding({ top: 72, right: 56, bottom: Math.round(p.getBoundingClientRect().height) + 12, left: 24 });
}

/* ── phone sheet ── */
function heights() {
  const vh = window.innerHeight;
  const h = head();
  return { peek: (h?.offsetHeight ?? 200) + 10, half: Math.round(vh * 0.52), full: vh - 52 };
}
function setSnap(snap: Snap, animate = true) {
  const p = panel();
  if (!p) return;
  if (wide.matches) { p.style.height = ''; return; }
  p.dataset.snap = snap;
  p.style.transition = animate ? '' : 'none';
  p.style.height = `${heights()[snap]}px`;
  // Camera moves started during the slide should already frame for where the sheet will settle.
  setPadding({ top: 72, right: 56, bottom: heights()[snap] + 12, left: 24 });
  if (!animate) requestAnimationFrame(() => { p.style.transition = ''; padding(); });
}
function sheet() {
  const p = panel(); const h = head();
  if (!p || !h) return;
  let startY = 0; let startH = 0; let moved = false; let lastY = 0; let lastT = 0; let v = 0;
  const onMove = (e: PointerEvent) => {
    const dy = startY - e.clientY;
    if (!moved && Math.abs(dy) > 6) {
      moved = true;
      // Keep the drag on the sheet even when the finger or cursor runs ahead of it over the map
      // (captured only once it is a drag, so a plain tap still reaches the link under it).
      try { h.setPointerCapture(e.pointerId); } catch { /* pointer already gone */ }
    }
    if (!moved) return;
    const { peek, full } = heights();
    p.style.transition = 'none';
    p.style.height = `${Math.min(full, Math.max(peek, startH + dy))}px`;
    const t = performance.now(); v = (lastY - e.clientY) / Math.max(1, t - lastT); lastY = e.clientY; lastT = t;
  };
  const onUp = () => {
    window.removeEventListener('pointermove', onMove);
    window.removeEventListener('pointerup', onUp);
    window.removeEventListener('pointercancel', onUp);
    if (!moved) return;
    const hs = heights(); const cur = p.getBoundingClientRect().height;
    const order: Snap[] = ['peek', 'half', 'full'];
    let pick = order.reduce((a, b) => (Math.abs(hs[b] - cur) < Math.abs(hs[a] - cur) ? b : a));
    if (Math.abs(v) > 0.6) { const i = order.indexOf(pick); pick = order[Math.max(0, Math.min(2, i + (v > 0 ? 1 : -1)))]; }
    p.style.transition = '';
    setSnap(pick);
  };
  h.onpointerdown = (e) => {
    if (wide.matches || e.button !== 0) return;
    startY = lastY = e.clientY; lastT = performance.now(); startH = p.getBoundingClientRect().height; moved = false; v = 0;
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
  };
  // Links in the header would otherwise start a native drag and cancel the gesture.
  h.addEventListener('dragstart', (e) => e.preventDefault());
  // A drag that moved should not also follow a link inside the header.
  h.addEventListener('click', (e) => { if (moved) { e.preventDefault(); e.stopPropagation(); moved = false; } }, true);
  h.querySelector<HTMLButtonElement>('[data-grab]')?.addEventListener('click', () => {
    const order: Snap[] = ['peek', 'half', 'full'];
    setSnap(order[(order.indexOf((p.dataset.snap as Snap) ?? 'peek') + 1) % 3]);
  });
  p.addEventListener('transitionend', (e) => { if (e.propertyName === 'height') padding(); });
}

/* ── page → view ── */
async function onPage() {
  const v = document.getElementById('view');
  const kind = (v?.dataset.kind ?? 'plain') as ViewKind;
  const day = Number(v?.dataset.day ?? 0);

  // During the trip the site opens on where the group is now.
  if (firstLoad && kind === 'overview' && tripPhase(now()) === 'during') {
    const today = trip.days.find((d) => d.date === tripDate(now()));
    const { cur, next } = current(now());
    if (today) {
      firstLoad = false;
      const anchor = cur?.d === today.n ? `#${cur.id}` : next?.d === today.n ? `#${next.id}` : '';
      navigate(`${base}/day/${today.n}/${location.search}${anchor}`, { history: 'replace' });
      return;
    }
  }
  if (v?.dataset.redirect === 'today') {
    const t = now();
    const today = trip.days.find((d) => d.date === tripDate(t)) ?? (tripDate(t) < trip.days[0].date ? trip.days[1] : trip.days.at(-1)!);
    navigate(`${base}/day/${today.n}/${location.search}`, { history: 'replace' });
    return;
  }

  sheet();
  setSnap(DEFAULT_SNAP[kind], false);
  padding();
  const initial = firstLoad;
  firstLoad = false;
  await show({ kind, day }, { initial });

  unbindScrubber?.(); unbindScrubber = null;
  const scrub = document.querySelector<HTMLElement>('[data-scrub-root]');
  if (kind === 'day' && scrub) unbindScrubber = bindScrubber(scrub, day);

  // Deep link to a stop (#d07-s05): keep the whole day framed, mark the stop and bring its row up.
  const hash = location.hash.slice(1);
  if (kind === 'day' && /^d\d{2}-s\d{2}$/.test(hash)) {
    void pickStop(hash);
    document.dispatchEvent(new CustomEvent('stage:stop', { detail: { id: hash } }));
  }
}

/* ── panel ↔ map ── */
document.addEventListener('click', (e) => {
  const btn = (e.target as HTMLElement).closest<HTMLElement>('[data-focus-stop]');
  if (!btn) return;
  e.preventDefault();
  if (!wide.matches && panel()?.dataset.snap === 'full') setSnap('half');
  void focusStop(btn.dataset.focusStop!);
  history.replaceState(history.state, '', `${location.pathname}${location.search}#${btn.dataset.focusStop}`);
});
document.addEventListener('stage:stop', (e) => {
  const id = (e as CustomEvent<{ id: string }>).detail.id;
  const row = document.getElementById(id);
  if (!row) return;
  if (!wide.matches && panel()?.dataset.snap === 'peek') setSnap('half');
  row.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'center' });
  row.classList.add('picked');
  setTimeout(() => row.classList.remove('picked'), 1800);
});

wide.addEventListener('change', () => { setSnap((panel()?.dataset.snap as Snap) ?? 'peek', false); padding(); });
window.addEventListener('resize', () => { if (!wide.matches) setSnap((panel()?.dataset.snap as Snap) ?? 'peek', false); padding(); });
/* ── Trending nearby + quick adds in the panel ── */
const currentDay = () => Number(document.getElementById('view')?.dataset.day ?? 0);
function renderAdds() {
  const day = currentDay();
  document.querySelectorAll<HTMLElement>('[data-trend-toggle]').forEach((b) => b.setAttribute('aria-pressed', String(isAdded(Number(b.dataset.day), b.dataset.trendToggle!))));
  const all = adds();
  const share = document.querySelector<HTMLButtonElement>('[data-share-adds]');
  if (share) { share.hidden = !all.length; share.querySelector('[data-adds-count]')!.textContent = `Share adds (${all.length})`; }
  // Rows in the timetable, each after the stop it's nearest to.
  document.querySelectorAll('.added-stop').forEach((r) => r.remove());
  const tpl = document.querySelector<HTMLTemplateElement>('[data-add-row]');
  if (!tpl || !day) return;
  for (const a of all.filter((x) => x.day === day).sort((x, y) => y.after - x.after || y.at.localeCompare(x.at))) {
    const anchor = document.getElementById(a.afterId);
    if (!anchor) continue;
    const row = tpl.content.firstElementChild!.cloneNode(true) as HTMLElement;
    row.id = `add-${a.id}`;
    row.dataset.addId = a.id;
    row.querySelector('[data-add-name]')!.textContent = a.name;
    row.querySelector('[data-add-walk]')!.textContent = `${walkMin(a.km)} min walk from stop ${a.after}`;
    row.querySelector<HTMLAnchorElement>('[data-add-dir]')!.href = `https://www.google.com/maps/dir/?api=1&destination=${a.lat},${a.lng}&travelmode=walking`;
    anchor.after(row);
  }
}
document.addEventListener('adds:change', renderAdds);
document.addEventListener('click', async (e) => {
  const el = e.target as HTMLElement;
  const line = el.closest<HTMLElement>('[data-focus-line]');
  if (line) { if (!wide.matches && panel()?.dataset.snap !== 'peek') setSnap('peek'); focusLine(line.dataset.focusLine!.split(',')); return; }
  const open = el.closest<HTMLElement>('[data-open-trend]');
  if (open) {
    if (!wide.matches && panel()?.dataset.snap !== 'peek') setSnap('peek');
    openTrend(Number(open.dataset.day), open.dataset.openTrend!);
    return;
  }
  const row = el.closest<HTMLElement>('.added-stop');
  if (row && el.closest('[data-add-remove]')) { removeAdd(currentDay(), row.dataset.addId!); return; }
  if (row && el.closest('[data-add-focus]')) {
    const a = adds().find((x) => x.day === currentDay() && x.id === row.dataset.addId);
    if (!a) return;
    if (!wide.matches && panel()?.dataset.snap === 'full') setSnap('half');
    if (trendsFor(a.day).some((t) => t.id === a.id)) openTrend(a.day, a.id); else void focusPoint(a.lng, a.lat);
    return;
  }
  const share = el.closest<HTMLButtonElement>('[data-share-adds]');
  if (share) {
    const text = exportText();
    if (!text) return;
    try {
      if (navigator.share) await navigator.share({ title: 'Japan Plan C · our adds', text });
      else { await navigator.clipboard.writeText(text); share.querySelector('[data-adds-count]')!.textContent = 'Copied: paste into TREK'; setTimeout(renderAdds, 2200); }
    } catch { /* share sheet dismissed */ }
  }
});
// Searching on a phone: the sheet steps down so the results and their pins have the screen.
document.addEventListener('search:open', () => { if (!wide.matches && panel()?.dataset.snap !== 'peek') setSnap('peek'); });
document.addEventListener('stage:day', (e) => { navigate(`${base}/day/${(e as CustomEvent<{ day: number }>).detail.day}/${location.search}`); });

document.addEventListener('astro:page-load', () => { void onPage(); renderAdds(); });
// The words paint first; the map engine (the heaviest download) starts once the page is up.
const start = () => { void boot(); };
if ('requestIdleCallback' in window) requestIdleCallback(start, { timeout: 1200 }); else setTimeout(start, 300);
