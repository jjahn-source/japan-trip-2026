// The live layer: knows the time in Japan and paints the panel accordingly (now/next,
// stamps, ticks, timetable states). Runs on every page swap; static HTML is complete without it.
import type { ClientTrip, ClientStop } from '../lib/client';

const trip: ClientTrip = JSON.parse(document.getElementById('trip-data')!.textContent!);
const HOUR = 3600000;
const DAY = 24 * HOUR;
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const base = import.meta.env.BASE_URL.replace(/\/$/, '');

const store = {
  get(key: string) { try { return localStorage.getItem(`jpc:${key}`); } catch { return null; } },
  set(key: string, value: string) { try { localStorage.setItem(`jpc:${key}`, value); } catch { /* private mode */ } },
};

/* ── time (?now=2026-12-20T16:00 previews any moment, read as Japan time) ── */
const preview = () => new URLSearchParams(location.search).get('now');
export const now = () => {
  const o = preview();
  const t = o ? Date.parse(/[+Z]/.test(o.slice(10)) ? o : `${o}${o.length <= 16 ? ':00' : ''}+09:00`) : NaN;
  return Number.isFinite(t) ? t : Date.now();
};
const jstDate = (t: number) => new Date(t + 9 * HOUR).toISOString().slice(0, 10);
/** The group's day runs until 5am: 2am karaoke still belongs to the night before. */
export const tripDate = (t: number) => jstDate(t - 5 * HOUR);
const ms = (iso: string) => Date.parse(iso);
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));
function until(target: number, from: number) {
  const mins = Math.round((target - from) / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `in ${mins} min`;
  const h = Math.floor(mins / 60); const m = mins % 60;
  if (h < 24) return `in ${h} h${m ? ` ${m} min` : ''}`;
  return `in ${Math.round(mins / 1440)} days`;
}

export function current(t: number) {
  const live = trip.stops.filter((s) => ms(s.s) <= t && t < ms(s.e));
  const cur = live.at(-1) ?? null;
  const next = trip.stops.find((s) => ms(s.s) > t && s !== cur) ?? null;
  return { cur, next };
}
export const tripPhase = (t: number) =>
  t < Date.parse(`${trip.days[0].date}T00:00:00+09:00`) ? 'before'
  : t < ms(trip.stops[0].s) ? 'flight'
  : t >= ms(trip.stops.at(-1)!.e) ? 'after' : 'during';

/* ── booking ticks ── */
const todoDone = (id: string) => {
  const v = store.get(`todo:${id}`);
  return v === null ? trip.todos.find((x) => x.id === id)?.done ?? false : v === '1';
};
function paintTodos() {
  document.querySelectorAll<HTMLElement>('[data-todo-mark]').forEach((el) => {
    el.dataset.done = String(todoDone(el.dataset.todoMark!));
    const label = el.querySelector<HTMLElement>('[data-mark-label]');
    if (label && el.dataset.mark === 'tobook') label.textContent = todoDone(el.dataset.todoMark!) ? 'Booked' : 'To book';
  });
  const t = now();
  document.querySelectorAll<HTMLElement>('[data-todo-item]').forEach((item) => {
    if (!item.querySelector('[data-due]')) item.dataset.state = todoDone(item.dataset.todoItem!) ? 'done' : 'later';
  });
  document.querySelectorAll<HTMLElement>('[data-due]').forEach((el) => {
    const due = Date.parse(`${el.dataset.due}T23:59:59+09:00`);
    const item = el.closest<HTMLElement>('[data-todo-item]');
    const done = item ? todoDone(item.dataset.todoItem!) : false;
    const days = Math.floor((due - t) / DAY);
    let state = 'later'; let text: string;
    if (done) { state = 'done'; text = 'Done'; }
    else if (due < t) { state = 'overdue'; const n = Math.ceil((t - due) / DAY); text = `Overdue ${n} day${n > 1 ? 's' : ''}`; }
    else if (days < 1) { state = 'soon'; text = 'Due today'; }
    else if (days < 14) { state = 'soon'; text = `Due in ${days + 1} days`; }
    else text = `In ${days + 1} days`;
    el.dataset.state = state; el.textContent = text;
    if (item) item.dataset.state = state;
  });
}

/* ── stamps (rail and opener) ── */
function paintStamps() {
  const today = tripDate(now());
  const seen = new Set<number>(JSON.parse(store.get('stamped') ?? '[]'));
  let delay = 0;
  document.querySelectorAll<SVGElement>('.stamp[data-day]').forEach((el) => {
    const day = trip.days[Number(el.dataset.day) - 1];
    const state = day.date < today ? 'stamped' : day.date === today ? 'today' : 'ahead';
    const was = el.dataset.state;
    el.dataset.state = state;
    const link = el.closest<HTMLElement>('[data-day-link]');
    if (link) link.dataset.state = state;
    // The press lands once per day, on the rail, the first time it is seen inked.
    if (state === 'stamped' && was !== 'stamped' && el.closest('[data-stamp-card]') && !seen.has(day.n)) {
      seen.add(day.n);
      if (!reduceMotion) {
        el.style.animationDelay = `${delay}ms`; delay += 120;
        el.classList.add('pressing');
        el.addEventListener('animationend', () => el.classList.remove('pressing'), { once: true });
      }
    }
  });
  store.set('stamped', JSON.stringify([...seen]));
  const count = trip.days.filter((d) => d.date < today).length;
  document.querySelectorAll<HTMLElement>('[data-stamp-count]').forEach((el) => { el.textContent = String(count); });
}

/* ── timetable rows ── */
function paintRows() {
  const t = now();
  const { cur, next } = current(t);
  document.querySelectorAll<HTMLElement>('[data-stop]').forEach((row) => {
    const s = trip.stops.find((x) => x.id === row.dataset.stop);
    if (!s) return;
    row.dataset.state = s === cur ? 'now' : s === next ? 'next' : ms(s.e) <= t ? 'past' : 'ahead';
  });
}

/* ── the Now/Next line in the panel header ── */
const stopHref = (s: ClientStop) => `${base}/day/${s.d}/#${s.id}`;
function paintNow() {
  const strip = document.querySelector<HTMLElement>('[data-now-strip]');
  if (!strip) return;
  const t = now();
  const phase = tripPhase(t);
  const first = trip.stops[0];
  let html = '';
  if (phase === 'before') {
    const days = Math.ceil((ms(first.s) - t) / DAY);
    const open = trip.todos.filter((x) => x.due && !todoDone(x.id)).sort((a, b) => a.due!.localeCompare(b.due!));
    const overdue = open.filter((x) => Date.parse(`${x.due}T23:59:59+09:00`) < t).length;
    const upcoming = open.find((x) => Date.parse(`${x.due}T23:59:59+09:00`) >= t);
    html = `<p class="nl"><b class="time big">${days}</b> days until wheels-down at Haneda</p>`
      + `<p class="nl sub">${overdue ? `<a href="${base}/bookings/#overdue" class="warn"><i class="ring"></i>${overdue} booking${overdue > 1 ? 's' : ''} overdue</a>` : ''}`
      + `${upcoming ? `${overdue ? ' · ' : ''}<a href="${base}/bookings/#${upcoming.id}">Next: <b class="time">${upcoming.due!.slice(5).replace('-', '.')}</b> ${esc(upcoming.text.split(' — ')[0])}</a>` : ''}</p>`;
  } else if (phase === 'flight') {
    html = `<p class="nl"><b class="display">Flight day</b> · land at Haneda ${until(ms(first.s), t)}</p><p class="nl sub"><a href="${base}/day/${first.d}/">Day ${first.d} night-before list</a></p>`;
  } else if (phase === 'after') {
    html = `<p class="nl"><b class="display">Okaeri</b> · ${trip.days.length} of ${trip.days.length} stamped</p><p class="nl sub" lang="ja">お帰り</p>`;
  } else {
    const { cur, next } = current(t);
    const today = trip.days.find((d) => d.date === tripDate(t));
    html = cur
      ? `<a class="nl now" href="${stopHref(cur)}"><i class="flag"></i><span class="lbl">Now</span><b class="time">${cur.start}–${cur.end}</b> <span class="nm">${esc(cur.name)}</span></a>`
      : `<p class="nl now"><span class="lbl">Now</span>Free time${next ? ` until <b class="time">${next.start}</b>` : ''}</p>`;
    if (next) {
      const when = next.d !== today?.n ? `${next.d === (today?.n ?? 0) + 1 ? 'Tomorrow' : esc(trip.days[next.d - 1].label)} · ` : '';
      html += `<a class="nl sub" href="${stopHref(next)}"><span class="lbl">Next</span>${when}<b class="time">${next.start}</b> <span class="nm">${esc(next.name)}</span> <span class="in">${until(ms(next.s), t)}</span></a>`;
    }
  }
  strip.dataset.mode = phase;
  strip.innerHTML = html;
}

function paintPhase() {
  const started = tripPhase(now()) !== 'before';
  document.querySelectorAll<HTMLElement>('[data-pre-trip]').forEach((el) => { el.hidden = started; });
}

/* ── per-page wiring ── */
function bind() {
  document.querySelectorAll<HTMLInputElement>('input[data-todo]').forEach((box) => {
    box.checked = todoDone(box.dataset.todo!);
    box.onchange = () => { store.set(`todo:${box.dataset.todo}`, box.checked ? '1' : '0'); paintTodos(); paintNow(); };
  });
  document.querySelectorAll<HTMLInputElement>('input[data-check]').forEach((box) => {
    box.checked = store.get(`check:${box.dataset.check}`) === '1';
    box.onchange = () => store.set(`check:${box.dataset.check}`, box.checked ? '1' : '0');
  });
  document.querySelectorAll<HTMLButtonElement>('[data-copy]').forEach((btn) => {
    btn.onclick = async () => {
      try { await navigator.clipboard.writeText(btn.dataset.copy!); btn.dataset.copied = 'true'; setTimeout(() => delete btn.dataset.copied, 1600); }
      catch { /* clipboard blocked: the text is visible beside the button */ }
    };
  });
  const o = preview();
  const note = document.querySelector<HTMLElement>('.preview-note');
  if (note) {
    note.hidden = !o;
    if (o) note.querySelector('span')!.textContent = `Previewing ${o.replace('T', ' ')} Japan time.`;
  }
  // Keep a preview time while moving around the site.
  if (o) document.querySelectorAll<HTMLAnchorElement>('a[href^="/"]').forEach((a) => {
    const u = new URL(a.href, location.href);
    if (u.origin === location.origin && !u.searchParams.has('now')) { u.searchParams.set('now', o); a.href = u.pathname + u.search + u.hash; }
  });
}

export function paint() { paintPhase(); paintTodos(); paintStamps(); paintRows(); paintNow(); }

document.addEventListener('astro:page-load', () => { bind(); paint(); });
setInterval(() => { paintRows(); paintNow(); }, 30000);
document.addEventListener('visibilitychange', () => { if (!document.hidden) paint(); });

export { trip };
