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
