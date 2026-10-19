// npm test: the app's pure pieces (money, line colours, the map's light).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { budgetOf, hhmm, legTimes, minutesOf, splitJa, yen } from '../src/app/types.ts';
import { colourOf, inkOn, phaseAt, sunHeight } from '../src/app/lines.ts';

test('the budget uses the sheet total and drops empty categories', () => {
  const b = budgetOf([
    { category: 'Stays', perPerson: '¥0' }, { category: 'Food', perPerson: '¥69,000' },
    { category: 'Transport', perPerson: '¥48,040' }, { category: 'Total', perPerson: '¥209,000' },
  ]);
  assert.equal(b.total, 209000);
  assert.deepEqual(b.cats.map((c) => c.category), ['Food', 'Transport']);
});

test('without a total row the budget sums the categories', () => {
  assert.equal(budgetOf([{ category: 'Food', perPerson: '¥1,000' }, { category: 'Fun', perPerson: 'about ¥500' }]).total, 1500);
});

test('yen, Japanese names and trip-day minutes', () => {
  assert.equal(yen('about ¥26,700'), 26700);
  assert.equal(yen('free'), null);
  assert.deepEqual(splitJa('Uoshin (魚真)'), { name: 'Uoshin', ja: '魚真' });
  assert.deepEqual(splitJa('Shibuya Sky (sunset slot)'), { name: 'Shibuya Sky (sunset slot)', ja: null });
  assert.equal(minutesOf('2026-12-17T07:55:00+09:00', '2026-12-17'), 475);
  assert.equal(minutesOf('2026-12-18T01:10:00+09:00', '2026-12-17'), 1510); // after midnight keeps counting
});

test('line pills get text that reads on their colour', () => {
  assert.equal(inkOn('#b6007a'), '#ffffff'); // Ōedo magenta
  assert.equal(inkOn('#00389e'), '#ffffff'); // dark blue
  assert.equal(inkOn('#fcc70d'), '#14122a'); // Ginza yellow
  assert.equal(inkOn('#b1cb39'), '#14122a'); // Yamanote green
  assert.equal(inkOn('not a colour'), '#14122a');
  assert.equal(colourOf('rail', '#123456'), '#123456');
  assert.equal(colourOf('bus'), '#7fc8a9');
});

test('the light follows the day’s own sunrise and sunset', () => {
  const sun = { sunrise: '06:45', sunset: '16:30' };
  assert.equal(phaseAt(3 * 60, sun), 'night');
  assert.equal(phaseAt(6 * 60 + 40, sun), 'dawn');
  assert.equal(phaseAt(12 * 60, sun), 'day');
  assert.equal(phaseAt(16 * 60 + 30, sun), 'dusk');
  assert.equal(phaseAt(19 * 60, sun), 'night');
  assert.equal(phaseAt(25 * 60, sun), 'night'); // 01:00 the next morning
});

test('a ride leaves its length before the next stop, never before the last one ends', () => {
  const at = (t) => ({ startISO: `2026-12-17T${t}:00+09:00`, endISO: `2026-12-17T${t}:00+09:00` });
  const from = { ...at('06:50'), endISO: '2026-12-17T06:50:00+09:00' }, to = at('08:00');
  assert.deepEqual(legTimes(from, to, { minutes: 25 }, '2026-12-17'), { depart: 455, arrive: 480 });
  assert.equal(hhmm(455), '07:35');
  // A tight hop: the ride takes longer than the gap, so it leaves when the stop ends.
  assert.deepEqual(legTimes(at('07:50'), to, { minutes: 25 }, '2026-12-17'), { depart: 470, arrive: 480 });
  assert.equal(hhmm(1510), '01:10'); // after midnight
});

test('the sun sinks through the horizon at sunset', () => {
  const sun = { sunrise: '06:45', sunset: '16:30' };
  assert.ok(sunHeight(11 * 60 + 37, sun) > 0.99); // solar noon of the day
  assert.ok(Math.abs(sunHeight(16 * 60 + 30, sun)) < 0.01);
  assert.ok(sunHeight(16 * 60, sun) > 0 && sunHeight(17 * 60, sun) < 0);
  assert.equal(sunHeight(20 * 60, sun), -1);
});
