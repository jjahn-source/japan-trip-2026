// npm test: how the itinerary agent's output becomes the site's trip.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { itineraryToTrip, stopTimes } from '../src/lib/itinerary.ts';
import { compact } from '../planner/lib.ts';
import { nameMatch } from '../planner/sources.ts';

test('a night out rolls past midnight, and keeps counting', () => {
  const t = stopTimes('2026-12-16', [{ start: '21:30', end: '23:30' }, { start: '23:45', end: '01:00' }, { start: '01:15', end: '02:00' }]);
  assert.equal(t[1].endISO, '2026-12-17T01:00:00+09:00');
  assert.equal(t[2].startISO, '2026-12-17T01:15:00+09:00');
  assert.equal(t[0].startISO, '2026-12-16T21:30:00+09:00');
});

const stop = (id, start, end, extra = {}) => ({ id, start, end, name: 'Uoshin', nameJa: '魚真', category: 'restaurant', categoryLabel: 'Restaurant', price: '¥5,000 pp', summary: null, plan: 'Seafood izakaya', address: null, lat: 35.66, lng: 139.7, website: null, phone: null, map: null, transport: 'Walk 4 min', guide: null, ...extra });
const it = {
  version: 1, generated: '2026-10-18T00:00:00Z', title: 'T', dates: 'D', people: 8, brief: 'b', stays: [],
  days: [{ n: 1, date: '2026-12-16', city: 'Tokyo', title: 'Day', stamp: { kanji: '渋', reading: 'Shibuya', place: 'SHIBUYA' }, notes: [{ kind: 'BRING', text: 'cash' }], stops: [stop('d01-s01', '18:50', '21:15'), stop('d01-s02', '21:30', '01:00', { price: null })] }],
  todos: [{ due: '2026-12-01', text: 'Book Uoshin', detail: null, stops: ['d01-s01'] }], budget: [], budgetTotals: [], coverage: [], sources: [], warnings: [],
};

test('the itinerary becomes the site trip', () => {
  const t = itineraryToTrip(it);
  const [a, b] = t.days[0].stops;
  assert.equal(t.days[0].label, 'Wed Dec 16');
  assert.equal(a.name, 'Uoshin (魚真)');
  assert.equal(a.plan, 'Seafood izakaya');
  assert.equal(a.transport, 'Walk 4 min'); // scripts/legs.mjs reads it from data/itinerary.json
  assert.equal(b.endISO, '2026-12-17T01:00:00+09:00');
  assert.equal(b.free, true);
  assert.equal(a.map, 'https://www.google.com/maps/search/?api=1&query=35.66,139.7');
  assert.deepEqual(t.todos[0].stops, ['d01-s01']);
  assert.equal(t.todos[0].dueLabel, 'Tue Dec 1');
  assert.deepEqual(t.days[0].stamp, it.days[0].stamp);
});

test('compact keeps what a model needs from any API reply', () => {
  const raw = { data: { items: [{ aweme_id: '1', desc: 'ramen in Shibuya', statistics: { play_count: 1200, irrelevant: 'x' }, video: { bit_rate: [1, 2] }, poi_info: { poi_name: '一蘭 渋谷' } }] } };
  assert.deepEqual(compact(raw), { data: { items: [{ aweme_id: '1', desc: 'ramen in Shibuya', statistics: { play_count: 1200 }, poi_info: { poi_name: '一蘭 渋谷' } }] } });
});

test('a place match needs the place\'s own name, not its neighbourhood or a station named after it', () => {
  assert.equal(nameMatch('Uoshin Shibuya', 'TACO FANATICO Shibuya'), false);
  assert.equal(nameMatch('Round1 Stadium Sennichimae', 'Business Inn Sennichimae Hotel'), false);
  assert.equal(nameMatch('Round1 Stadium Sennichimae', 'ROUND1 Stadium Sennichimae'), true);
  assert.equal(nameMatch('Meiji Jingu', 'Harajuku station temporary entrance (Meiji Jingu Exit)'), false);
  assert.equal(nameMatch('Meiji Jingu', 'Meiji jingu (Harajuku Eki)'), false);
  assert.equal(nameMatch('Meiji Jingu', 'Meiji Jingu'), true);
  assert.equal(nameMatch('Shinjuku Station', 'Shinjuku Station'), true);
  assert.equal(nameMatch('Ichiran', 'Ichiran Shibuya'), true);
});

import { validate, claims, allowedFrom, unsupported, stripUnsupported, factProblem, htmlText, quoteOn, EMPTY } from '../planner/facts.ts';

const page = [{ url: 'https://www.hakoneyuryo.jp/price/', text: '日帰り温泉 大人 1,700円（土日祝 2,000円）\n営業時間 10:00～20:00（最終受付 19:00）\n毎週火曜日 休館' }];
test('a fact survives only when its quote is on the page and holds the value', () => {
  const sheet = { ...EMPTY,
    prices: [{ what: 'Adult, weekends', yen: 2000, quote: '土日祝 2,000円', url: page[0].url }, { what: 'Adult', yen: 1500, quote: '大人 1,500円', url: page[0].url }, { what: 'Adult', yen: 1800, quote: '大人 1,700円', url: page[0].url }],
    open: [{ dates: ['2026-12-19'], open: '10:00', close: '20:00', quote: '営業時間 10:00～20:00', url: page[0].url }],
    last_entry: { time: '19:00', quote: '最終受付 19:00', url: 'https://elsewhere.example/' },
  };
  const { sheet: v, dropped } = validate(sheet, page);
  assert.deepEqual(v.prices.map((p) => p.yen), [2000]); // invented quote and mismatched value both dropped
  assert.equal(v.open.length, 1);
  assert.equal(v.last_entry, null); // quote is real but not on the page it cites
  assert.equal(dropped.length, 3);
});

test('a correction\'s quote counts only when it is really on the page, ignoring width, spaces and commas', () => {
  const text = '営業時間 10:00～20:00\n大人 1,700円';
  assert.equal(quoteOn(text, '大人　１７００円'), true); // full-width and no comma still match
  assert.equal(quoteOn(text, '大人 1,500円'), false);
  assert.equal(quoteOn(text, ''), false); // an empty quote proves nothing
  assert.equal(quoteOn(text, '10:00'), false); // too short to prove anything
});

test('the audit finds unbacked prices, times and minutes, and allows group totals of backed prices', () => {
  assert.deepEqual(claims('About ¥2,000 pp, open 10:00, a 16-minute walk, 2 hours').map((c) => [c.kind, c.value]), [['yen', 2000], ['time', 600], ['minutes', 16], ['minutes', 120]]);
  const a = allowedFrom(['Adult, weekends: ¥2,000', '10:00 12:00', 'walk 9 min'], 8);
  assert.deepEqual(unsupported('¥16,000 for all eight, from 10:00, 9 minutes on foot, stay 2 hours', a), []);
  assert.deepEqual(unsupported('Allow 16 minutes and ¥2,900 each.', a).map((c) => c.raw).sort(), ['16 minutes', '¥2,900'].sort());
  assert.equal(stripUnsupported('Entry is ¥2,000. It takes 25 min to walk. Go early.', a), 'Entry is ¥2,000. Go early.');
});

test('verified facts catch closures, hours on the date, last entry and fixed ride lengths', () => {
  const f = { ...EMPTY, closed: [{ dates: ['2026-12-22'], why: 'Tuesdays', what: 'the museum', whole_place: true, quote: 'q', url: 'u' }, { dates: ['2026-12-19'], why: 'maintenance', what: 'only the upper section', whole_place: false, quote: 'q', url: 'u' }], open: [{ dates: ['2026-12-19'], open: '10:00', close: '20:00', quote: 'q', url: 'u' }], last_entry: { time: '19:00', quote: 'q', url: 'u' }, fixed_minutes: { minutes: 40, what: 'Togendai → Motohakone', quote: 'q', url: 'u' } };
  assert.match(factProblem(f, '2026-12-22', 600, 700), /closed/);
  assert.match(factProblem(f, '2026-12-19', 540, 600), /open only 10:00–20:00/);
  assert.match(factProblem(f, '2026-12-19', 1150, 1190), /last entry/);
  assert.match(factProblem(f, '2026-12-19', 660, 685), /takes 40 min/);
  assert.equal(factProblem(f, '2026-12-19', 660, 705), null);
  assert.match(factProblem({ ...EMPTY, time_limit: { minutes: 120, quote: 'q', url: 'u' } }, '2026-12-19', 1280, 1410), /120-min time limit/);
  assert.equal(factProblem({ ...EMPTY, closed: [{ dates: ['2026-12-20'], why: 'maintenance', what: 'only one section', whole_place: false, quote: 'q', url: 'u' }] }, '2026-12-20', 540, 600), null);
});

test('pages become plain text', () => {
  assert.equal(htmlText('<p>営業時間&nbsp;10:00</p><script>x()</script><td>大人</td><td>&yen;2,000</td>'), '営業時間 10:00\n大人\n¥2,000');
});

import { solveDay, estimateHop, hhmm } from '../planner/solver.ts';

// A straight street: stop k sits k km east of the start. Fixed hops: 10 min per km, walking.
const at = (k) => ({ lat: 35.0, lng: 139.0 + k * 0.011 });
const line = (a, b) => { const d = Math.round(Math.abs(a.lng - b.lng) / 0.011); return { minutes: d * 10, mode: 'walk', yen: 0 }; };
const S = (id, k, extra = {}) => ({ id, name: id, ...at(k), minutes: 60, priority: 5, ...extra });
const base = { start: { id: 'home', name: 'home', ...at(0), time: 9 * 60 }, people: 8 };

test('the solver orders stops along the way, with a group buffer between them', () => {
  const r = solveDay({ ...base, stops: [S('c', 3), S('a', 1), S('b', 2)] }, line);
  assert.deepEqual(r.order.map((o) => o.id), ['a', 'b', 'c']);
  assert.equal(hhmm(r.order[0].start), '09:15'); // 10 min walk + 3 min group buffer, rounded up to 5
  assert.ok(r.complete);
});

test('the solver respects opening hours, last entry and fixed show times', () => {
  const r = solveDay({ ...base, stops: [
    S('museum', 1, { windows: [{ open: 10 * 60, close: 17 * 60 }] }),
    S('show', 2, { fixedStart: 13 * 60, minutes: 90 }),
    S('late', 3, { lastEntry: 9 * 60 + 30, priority: 9 }),
  ] }, line);
  const by = Object.fromEntries(r.order.map((o) => [o.id, o]));
  assert.ok(by.museum.start >= 600 && by.museum.end <= 1020);
  assert.equal(hhmm(by.show.start), '13:00');
  assert.ok(!by.late, 'a place whose last entry has passed is dropped');
  assert.match(r.dropped.find((d) => d.id === 'late').why, /last entry/);
});

test('the solver spaces meals and never books two dinners', () => {
  const r = solveDay({ ...base, start: { ...base.start, time: 11 * 60 }, stops: [
    S('lunch', 1, { meal: 'lunch' }), S('dinner1', 2, { meal: 'dinner', priority: 8 }), S('dinner2', 3, { meal: 'dinner', priority: 6 }), S('sight', 2, { minutes: 120 }),
  ] }, line);
  const meals = r.order.filter((o) => /lunch|dinner/.test(o.id));
  assert.equal(meals.filter((m) => m.id.startsWith('dinner')).length, 1);
  for (let i = 1; i < meals.length; i++) assert.ok(meals[i].start - meals[i - 1].end >= 150);
});

test('the solver keeps must-do anchors and stays inside the taxi budget', () => {
  const taxi = (_, to) => (to.id === 'booked' ? { minutes: 10, mode: 'walk', yen: 0 } : { minutes: 15, mode: 'taxi', yen: 8000 });
  const r = solveDay({ ...base, taxiCapPerPerson: 900, stops: [S('booked', 1, { must: true, priority: 1 }), S('far', 5, { priority: 10 })] }, taxi);
  assert.deepEqual(r.order.map((o) => o.id), ['booked']);
  assert.match(r.dropped[0].why, /taxi budget/);
});

test('a ride that ends elsewhere continues from where it lands', () => {
  const r = solveDay({ ...base, stops: [S('ropeway', 1, { endAt: { id: 'top', name: 'top', ...at(4) }, minutes: 30 }), S('summit', 4, { priority: 4 })] }, line);
  const sum = r.order.find((o) => o.id === 'summit');
  assert.equal(sum.hop.minutes, 0); // already there
});

test('travel estimates: short walks, trains in town, taxis after the last train', () => {
  const a = { lat: 35.69, lng: 139.70 }, b = { lat: 35.66, lng: 139.70 };
  assert.equal(estimateHop(a, { lat: 35.693, lng: 139.70 }, 600, { people: 8 }).mode, 'walk');
  assert.equal(estimateHop(a, b, 600, { people: 8 }).mode, 'transit');
  assert.equal(estimateHop(a, b, 25 * 60, { people: 8 }).mode, 'taxi');
});

test('group rules and year-end hours survive only with their quote on the page', () => {
  const src = [{ url: 'https://izakaya.example/', text: '年末年始 12月29日～1月3日 休業\n7名様以上はお電話にてご予約ください' }];
  const { sheet } = validate({ ...EMPTY, group: { text: 'Groups of 7+ must phone', quote: '7名様以上はお電話にてご予約ください', url: src[0].url }, closed: [{ dates: ['2026-12-29'], why: 'year-end', what: 'the restaurant', whole_place: true, quote: '年末年始 12月29日～1月3日 休業', url: src[0].url }] }, src);
  assert.equal(sheet.group?.text, 'Groups of 7+ must phone');
  assert.match(factProblem(sheet, '2026-12-29', 1140, 1260), /closed on 2026-12-29/);
});
