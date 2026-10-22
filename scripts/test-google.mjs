// Google Maps on each stop: reading Place Details (scripts/google-places.mjs) and checking a visit against
// Google's hours (src/lib/google-hours.ts). Run: npm test
import test from 'node:test';
import assert from 'node:assert/strict';
import { entryOf, payment } from './google-places.mjs';
import { closedNews, datedHours, hoursClash, weeklyOn } from '../src/lib/google-hours.ts';

// Google's weekly periods: day 0 = Sunday. 11:00–22:00 every day but Monday; Friday runs to 02:00.
const P = (d, oh, ch, cd = d) => ({ open: { day: d, hour: oh, minute: 0 }, close: { day: cd, hour: ch, minute: 0 } });
const weekly = [0, 2, 3, 4, 6].map((d) => P(d, 11, 22)).concat([P(5, 11, 2, 6)]);
const h = { weekly, dated: null };
// 2026-12-14 is a Monday, 12-17 a Thursday, 12-18 a Friday, 12-19 a Saturday.

test('weekly hours on a date: closed days are empty, a close after midnight runs past 1440', () => {
  assert.deepEqual(weeklyOn(weekly, '2026-12-14'), []);
  assert.deepEqual(weeklyOn(weekly, '2026-12-17'), [{ open: 660, close: 1320 }]);
  assert.deepEqual(weeklyOn(weekly, '2026-12-18'), [{ open: 660, close: 1560 }]);
  assert.equal(weeklyOn(null, '2026-12-17'), null);
  assert.deepEqual(weeklyOn([{ open: { day: 0, hour: 0, minute: 0 } }], '2026-12-17'), [{ open: 0, close: 2880 }]);
});

test('a visit inside the hours is fine; ten minutes of queueing is fine', () => {
  assert.equal(hoursClash(h, '2026-12-17T12:00:00+09:00', '2026-12-17T13:00:00+09:00'), null);
  assert.equal(hoursClash(h, '2026-12-17T10:50:00+09:00', '2026-12-17T12:00:00+09:00'), null);
  assert.equal(hoursClash(null, '2026-12-17T12:00:00+09:00', '2026-12-17T13:00:00+09:00'), null);
});

test('a closed day, a visit outside the hours, a late opening and an early close', () => {
  assert.deepEqual(hoursClash(h, '2026-12-14T12:00:00+09:00', '2026-12-14T13:00:00+09:00'), { kind: 'closed', text: 'Google Maps lists it closed on Mondays.' });
  assert.equal(hoursClash(h, '2026-12-17T23:00:00+09:00', '2026-12-17T23:45:00+09:00').kind, 'closed');
  assert.match(hoursClash(h, '2026-12-17T23:00:00+09:00', '2026-12-17T23:45:00+09:00').text, /11:00–22:00/);
  assert.deepEqual(hoursClash(h, '2026-12-17T10:00:00+09:00', '2026-12-17T12:00:00+09:00'), { kind: 'opens', text: 'Opens at 11:00 on Thursdays (Google Maps).' });
  assert.deepEqual(hoursClash(h, '2026-12-17T21:00:00+09:00', '2026-12-17T23:00:00+09:00'), { kind: 'closes', text: 'Closes at 22:00 on Thursdays (Google Maps).' });
});

test('after midnight: Friday night\'s hours carry into Saturday 01:00', () => {
  assert.equal(hoursClash(h, '2026-12-19T01:00:00+09:00', '2026-12-19T01:45:00+09:00'), null);
  assert.equal(hoursClash(h, '2026-12-18T23:30:00+09:00', '2026-12-19T01:30:00+09:00'), null);
  assert.equal(hoursClash(h, '2026-12-18T23:30:00+09:00', '2026-12-19T03:00:00+09:00').kind, 'closes');
});

test('Google\'s dated hours for the week beat the weekly ones: a holiday closure shows', () => {
  const current = {
    periods: [{ open: { date: { year: 2026, month: 12, day: 18 }, hour: 11, minute: 0 }, close: { date: { year: 2026, month: 12, day: 18 }, hour: 15, minute: 0 } }],
    specialDays: [{ date: { year: 2026, month: 12, day: 18 } }],
  };
  const dated = datedHours(current, '2026-12-15');
  assert.deepEqual(dated.days['2026-12-17'], []);
  assert.deepEqual(dated.days['2026-12-18'], [{ open: 660, close: 900 }]);
  assert.deepEqual(dated.special, ['2026-12-18']);
  const hd = { weekly, dated };
  assert.deepEqual(hoursClash(hd, '2026-12-17T12:00:00+09:00', '2026-12-17T13:00:00+09:00'), { kind: 'closed', text: 'Google Maps lists it closed on Dec 17.' });
  assert.deepEqual(hoursClash(hd, '2026-12-18T14:00:00+09:00', '2026-12-18T16:00:00+09:00'), { kind: 'closes', text: 'Closes at 15:00 on Dec 18 (holiday hours) (Google Maps).' });
  // Outside the week Google covered: back to the weekly hours.
  assert.equal(hoursClash(hd, '2026-12-24T12:00:00+09:00', '2026-12-24T13:00:00+09:00'), null);
  assert.equal(datedHours(undefined, '2026-12-15'), null);
});

test('cards, cash only, or unknown; the entry keeps the review summary\'s link', () => {
  assert.equal(payment({ acceptsCashOnly: true }), 'cash');
  assert.equal(payment({ acceptsCreditCards: true }), 'cards');
  assert.equal(payment({ acceptsNfc: true }), 'cards');
  assert.equal(payment({ acceptsCreditCards: false }), 'cash');
  assert.equal(payment({}), null);
  assert.equal(payment(undefined), null);
  const e = entryOf({ id: 'abc', googleMapsUri: 'https://maps.google.com/?cid=1', rating: 4.4, userRatingCount: 120, businessStatus: 'OPERATIONAL', reviewSummary: { text: { text: 'People like it.' }, reviewsUri: 'https://maps.google.com/reviews' } }, '2026-12-08');
  assert.deepEqual(e.summary, { text: 'People like it.', uri: 'https://maps.google.com/reviews' });
  assert.equal(e.rating, 4.4);
  assert.equal(e.pay, null);
  assert.equal(e.fetched, '2026-12-08');
});

test('the morning check pushes only news: gone, closed or closing early on the day, not the usual week', () => {
  const stop = { name: 'Gyoza Center', s: '2026-12-18T12:00:00+09:00', e: '2026-12-18T13:00:00+09:00' };
  const at = (day, oh, ch) => ({ open: { date: { year: 2026, month: 12, day }, hour: oh, minute: 0 }, close: { date: { year: 2026, month: 12, day }, hour: ch, minute: 0 } });
  const week = { periods: weekly };
  // Friday Dec 18 is usually 11:00–02:00; Google's week says closed that day (a holiday): news.
  const closed = closedNews(stop, { regularOpeningHours: week, currentOpeningHours: { periods: [at(17, 11, 22)], specialDays: [{ date: { year: 2026, month: 12, day: 18 } }] } }, '2026-12-17');
  assert.equal(closed.kind, 'closed');
  assert.equal(closed.title, 'Gyoza Center looks closed on Dec 18');
  assert.match(closed.body, /holiday hours.*You're there 12:00–13:00/);
  // Closing at 12:30 that day: news too.
  const half = { ...at(18, 11, 12), close: { date: { year: 2026, month: 12, day: 18 }, hour: 12, minute: 30 } };
  assert.equal(closedNews(stop, { regularOpeningHours: week, currentOpeningHours: { periods: [half] } }, '2026-12-17')?.kind, 'closes');
  // Open as usual: nothing.
  assert.equal(closedNews(stop, { regularOpeningHours: week, currentOpeningHours: { periods: [at(18, 11, 22)] } }, '2026-12-17'), null);
  // Closed on a day it's always closed (the site already says so): nothing.
  const monday = { ...stop, s: '2026-12-14T12:00:00+09:00', e: '2026-12-14T13:00:00+09:00' };
  assert.equal(closedNews(monday, { regularOpeningHours: week, currentOpeningHours: { periods: [] } }, '2026-12-14'), null);
  // Out of business beats everything.
  assert.equal(closedNews(stop, { businessStatus: 'CLOSED_PERMANENTLY' }, '2026-12-17').title, 'Gyoza Center has closed for good');
  assert.equal(closedNews(stop, { businessStatus: 'CLOSED_TEMPORARILY' }, '2026-12-17').kind, 'gone');
  // Google knows no dated hours: nothing to say.
  assert.equal(closedNews(stop, { regularOpeningHours: week }, '2026-12-17'), null);
});
