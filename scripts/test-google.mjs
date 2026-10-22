// Google Maps on each stop: reading Place Details (scripts/google-places.mjs) and checking a visit against
// Google's hours (src/lib/google-hours.ts). Run: npm test
import test from 'node:test';
import assert from 'node:assert/strict';
import { doorOf, entryOf, payment, swapsOf } from './google-places.mjs';
import { carsFor, fareOf, regionOf } from './taxis.mjs';
import { nearbyQuery, nearbyRows } from '../src/lib/nearby.ts';
import { isWarning, weatherNews } from '../src/lib/jma.ts';
import { calendar } from '../src/lib/ics.ts';
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

test('find the door: the building as on its sign, the floor, a landmark worth steering by', () => {
  const d = {
    addressComponents: [{ longText: '1-4F', types: ['subpremise'] }, { longText: '雀のおじさんビル', types: ['premise'] }, { longText: '13', types: ['premise'] }],
    addressDescriptor: { landmarks: [
      { displayName: { text: 'Times Parking Shinjuku' }, spatialRelationship: 'BESIDE', travelDistanceMeters: 10 },
      { displayName: { text: 'Books Kinokuniya' }, spatialRelationship: 'BESIDE', travelDistanceMeters: 33 },
      { displayName: { text: 'City Office' }, spatialRelationship: 'NEAR', travelDistanceMeters: 136 },
    ] },
  };
  assert.deepEqual(doorOf(d), { building: '雀のおじさんビル', floor: '1-4F', near: 'beside Books Kinokuniya' });
  assert.equal(doorOf({ addressComponents: [{ longText: '13', types: ['premise'] }] }), null);
  assert.deepEqual(doorOf({ addressComponents: [{ longText: 'B1F', types: ['subpremise'] }] }), { building: null, floor: 'B1F', near: null });
});

test('Plan B: well-liked, close, open for business, not the stop, not bad for groups; best first', () => {
  const at = { lat: 35.69, lng: 139.70 };
  const P = (id, rating, n, dLat, extra = {}) => ({ id, displayName: { text: id }, rating, userRatingCount: n, location: { latitude: at.lat + dLat, longitude: at.lng }, ...extra });
  const out = swapsOf([
    P('self', 4.8, 9000, 0), P('great', 4.6, 3000, 0.002), P('ok', 4.1, 400, 0.003), P('few', 4.9, 20, 0.001),
    P('far', 4.9, 9000, 0.02), P('low', 3.6, 5000, 0.001), P('solo', 4.7, 5000, 0.001, { goodForGroups: false }),
    P('shut', 4.7, 5000, 0.001, { businessStatus: 'CLOSED_PERMANENTLY' }),
  ], at, 'self');
  assert.deepEqual(out.map((x) => x.id), ['great', 'ok']);
  assert.equal(out[0].m, 222);
});

test('taxi fare: the meter by distance, 20% more at night, a range; two cars for eight', () => {
  assert.deepEqual(fareOf(1000, 14, 'tokyo'), [500, 600]);
  const day = fareOf(5000, 14, 'tokyo'), night = fareOf(5000, 1, 'tokyo');
  assert.ok(night[0] > day[0] && night[1] / day[1] > 1.15);
  assert.ok(fareOf(5000, 1, 'osaka')[0] > fareOf(5000, 1, 'tokyo')[0] - 200);
  assert.equal(regionOf(135.5), 'osaka');
  assert.equal(regionOf(139.1), 'hakone');
  assert.equal(regionOf(139.7), 'tokyo');
  assert.equal(carsFor(8), 2);
  assert.equal(carsFor(9), 3);
  assert.equal(carsFor(1), 1);
});

test('open now near us: walkable, group-friendly rows with when it closes; only Japan, only words', () => {
  const at = { lat: 35.694, lng: 139.705 };
  const rows = nearbyRows([
    { id: 'a', displayName: { text: 'Ramen A' }, location: { latitude: 35.695, longitude: 139.705 }, rating: 4.2, userRatingCount: 900, currentOpeningHours: { nextCloseTime: '2026-12-18T17:00:00Z' }, paymentOptions: { acceptsCashOnly: true } },
    { id: 'b', displayName: { text: 'Booths' }, location: { latitude: 35.694, longitude: 139.706 }, goodForGroups: false },
    { id: 'c', displayName: { text: 'Far' }, location: { latitude: 35.72, longitude: 139.705 } },
  ], at, true);
  assert.deepEqual(rows.map((r) => r.id), ['a']);
  assert.equal(rows[0].closes, '02:00');
  assert.equal(rows[0].cash, true);
  assert.equal(rows[0].walk, 2);
  assert.equal(nearbyRows([{ id: 'b', location: { latitude: 35.694, longitude: 139.706 }, goodForGroups: false }], at, false).length, 1);
  assert.deepEqual(nearbyQuery('ramen open now near me', 35.69431, 139.70468), { q: 'ramen', lat: 35.694, lng: 139.705 });
  assert.equal(nearbyQuery('open now', 35.69, 139.7).q, 'restaurant');
  assert.equal(nearbyQuery('ramen', 40.7, -74), null);
  assert.equal(nearbyQuery('x'.repeat(200), 35.69, 139.7).q.length, 60);
});

test('weather: warnings are pushed, routine information and advisories are not', () => {
  const alerts = [
    { alertId: '1', alertTitle: { text: 'General typhoon information' } },
    { alertId: '2', alertTitle: { text: 'Heavy snow advisory' } },
    { alertId: '3', alertTitle: { text: 'Heavy snow warning' }, areaName: '箱根町' },
  ];
  assert.deepEqual(alerts.filter(isWarning).map((a) => a.alertId), ['3']);
  assert.deepEqual(weatherNews(alerts, 'Hakone today', '/day/6/'), [{ key: 'wx:3', title: 'Heavy snow warning for Hakone today', body: 'From the Japan Meteorological Agency (箱根町). Check the plan for outdoor stops and trains.', url: '/day/6/' }]);
});

test('the calendar feed: one event a stop at its (moved) time, cancelled and stays left out, valid lines', () => {
  const ics = calendar([
    { id: 'd01-s01', d: 1, name: 'Mutekiya, the ramen; late', cat: 'restaurant', s: '2026-12-15T23:20:00+09:00', e: '2026-12-16T00:00:00+09:00', a: '1-chōme-17-1 Minamiikebukuro, Toshima City, Tokyo 171-0022, a long address for folding', note: 'Cash only' },
    { id: 'd01-s02', d: 1, name: 'Cancelled', cat: 'bar', s: '2026-12-15T23:20:00+09:00', e: '2026-12-16T00:00:00+09:00', cancelled: true },
    { id: 'd01-s03', d: 1, name: 'Ninja House', cat: 'stay', s: '2026-12-15T17:30:00+09:00', e: '2026-12-15T17:55:00+09:00' },
  ], 'https://trip.example', Date.parse('2026-10-22T00:00:00Z'));
  assert.equal(ics.match(/BEGIN:VEVENT/g).length, 1);
  assert.match(ics, /DTSTART:20261215T142000Z\r\n/);
  assert.match(ics, /DTEND:20261215T150000Z\r\n/);
  assert.match(ics, /SUMMARY:Mutekiya\\, the ramen\\; late\r\n/);
  assert.match(ics, /URL:https:\/\/trip.example\/day\/1\/#d01-s01/);
  for (const line of ics.split('\r\n')) assert.ok(new TextEncoder().encode(line).length <= 75, line);
  assert.match(ics.replace(/\r\n /g, ''), /LOCATION:1-chōme-17-1 Minamiikebukuro\\, Toshima City/);
  assert.ok(ics.endsWith('END:VCALENDAR\r\n'));
});
