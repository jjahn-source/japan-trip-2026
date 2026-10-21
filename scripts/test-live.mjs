// The live layer's rules (src/lib/live.ts) and its Web Push (worker/push.ts), on synthetic plans.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createECDH } from 'node:crypto';
import ece from 'http_ece';
import { alertsFor, applyPlan, clean, describe, fold, isoNear, nineAm } from '../src/lib/live.ts';
import { b64u, encrypt, generateVapid, vapidAuth } from '../worker/push.ts';

const row = (id, kind, target, patch, author = 'Sam') => ({ id, kind, target, patch, author, device: null, at: id * 1000 });
const plan = () => ({
  generated: '', todos: [{ id: 't1', due: '2026-11-20', text: 'Book the dinner cruise' }],
  days: [{ n: 2, date: '2026-12-16', lastTrain: { leave: '23:30', dep: '23:39', arr: '00:08', from: 'Shibuya', line: 'JR Yamanote Line' } }],
  stops: [
    { id: 'a', d: 2, name: 'Ramen', cat: 'restaurant', s: '2026-12-16T19:00:00+09:00', e: '2026-12-16T20:00:00+09:00' },
    { id: 'b', d: 2, name: 'Karaoke', cat: 'activity', s: '2026-12-16T20:30:00+09:00', e: '2026-12-16T23:40:00+09:00' },
    { id: 'c', d: 2, name: 'Bed', cat: 'stay', s: '2026-12-17T00:20:00+09:00', e: '2026-12-17T00:30:00+09:00' },
  ],
  legs: [
    { from: 'a', to: 'b', minutes: 20, mode: 'rail', text: 'Ginza Line Ueno → Shibuya' },
    { from: 'b', to: 'c', minutes: 8, mode: 'walk', text: '' },
  ],
});

test('a change is checked before it is saved', () => {
  assert.deepEqual(clean('stop', { start: '20:30', note: '  late  ' }), { start: '20:30', note: 'late' });
  assert.match(clean('stop', { start: '25:00' }), /HH:MM/);
  assert.match(clean('stop', { name: 'x' }), /can't be changed/);
  assert.match(clean('todo', {}), /nothing/);
  assert.deepEqual(clean('stop', { note: '   ' }), { note: null }); // an emptied note clears it
  assert.equal(clean('day', { lastTrain: { leave: '23:30', dep: '23:39', arr: '00:08', from: 'Shibuya', line: 'Yamanote', extra: 1 } }).lastTrain.extra, undefined);
});

test('changes fold in order; null puts a field back to the plan', () => {
  const s = fold([row(2, 'stop', 'a', { note: 'late' }), row(1, 'stop', 'a', { start: '19:30' }), row(3, 'stop', 'a', { start: null }, 'Kai')]);
  assert.deepEqual(s.items['stop:a'], { patch: { note: 'late' }, by: 'Kai', at: 3000 });
  assert.equal(s.v, 3);
  assert.equal(s.log[0].id, 3);
  assert.equal(fold([row(1, 'todo', 't1', { done: true }), row(2, 'todo', 't1', { done: null })]).items['todo:t1'], undefined);
});

test('times land on the right night', () => {
  assert.equal(isoNear('00:30', '2026-12-16T23:00:00+09:00'), '2026-12-17T00:30:00+09:00');
  assert.equal(isoNear('05:00', '2026-12-26T05:00:00+09:00'), '2026-12-26T05:00:00+09:00'); // an all-nighter's morning
  assert.equal(isoNear('19:30', '2026-12-16T19:00:00+09:00'), '2026-12-16T19:30:00+09:00');
  // With the stop's day: a late stop moved to the morning stays on its day (nearest would be the next).
  assert.equal(isoNear('10:00', '2026-12-16T23:00:00+09:00', '2026-12-16'), '2026-12-16T10:00:00+09:00');
  assert.equal(isoNear('00:30', '2026-12-16T23:00:00+09:00', '2026-12-16'), '2026-12-17T00:30:00+09:00');
  assert.equal(isoNear('04:30', '2026-12-16T09:00:00+09:00', '2026-12-16'), '2026-12-17T04:30:00+09:00');
  // A stop outside its day (the ramen at 05:00 after an all-nighter on day 11) keeps the nearest.
  assert.equal(isoNear('05:30', '2026-12-26T05:00:00+09:00', '2026-12-25'), '2026-12-26T05:30:00+09:00');
});

test('leave-now alerts: 10 min before each ride, none for a short walk or a cancelled stop', () => {
  const a = alertsFor(plan(), 'Asia/Tokyo');
  const leave = a.filter((x) => x.kind === 'leave');
  assert.equal(leave.length, 1);
  assert.equal(new Date(leave[0].at).toISOString(), '2026-12-16T11:00:00.000Z'); // leaves 20:10 JST, alert 20:00
  assert.match(leave[0].title, /Leave at 20:10 for Karaoke/);
  const cancelled = applyPlan(plan(), fold([row(1, 'stop', 'b', { cancelled: true })]));
  assert.equal(alertsFor(cancelled, 'Asia/Tokyo').filter((x) => x.kind === 'leave').length, 0);
  // Moving the next stop moves the alert, under a new key so it's sent again.
  const moved = alertsFor(applyPlan(plan(), fold([row(1, 'stop', 'b', { start: '21:00' })])), 'Asia/Tokyo').find((x) => x.kind === 'leave');
  assert.match(moved.title, /20:40/);
  assert.notEqual(moved.key, leave[0].key);
});

test('last-train alert: 20 min before leaving, unless everyone is home well before', () => {
  const last = alertsFor(plan(), 'Asia/Tokyo').find((x) => x.kind === 'last');
  assert.equal(new Date(last.at).toISOString(), '2026-12-16T14:10:00.000Z'); // 23:10 JST
  assert.match(last.title, /23:39 from Shibuya/);
  const early = applyPlan(plan(), fold([row(1, 'stop', 'b', { end: '21:00' })]));
  assert.equal(alertsFor(early, 'Asia/Tokyo').find((x) => x.kind === 'last'), undefined);
});

test('deadline reminders at 9am where the phone is, and none once ticked', () => {
  const due = alertsFor(plan(), 'America/Los_Angeles').filter((x) => x.kind === 'due');
  assert.deepEqual(due.map((x) => new Date(x.at).toISOString()), ['2026-11-17T17:00:00.000Z', '2026-11-20T17:00:00.000Z']);
  assert.equal(nineAm('2026-12-16', 'Asia/Tokyo'), Date.parse('2026-12-16T09:00:00+09:00'));
  const done = applyPlan(plan(), fold([row(1, 'todo', 't1', { done: true })]));
  assert.equal(alertsFor(done, 'Asia/Tokyo').filter((x) => x.kind === 'due').length, 0);
});

test('a change reads as a sentence', () => {
  const p = plan();
  assert.equal(describe(row(1, 'stop', 'b', { start: '21:00', end: '23:50' }), p).title, 'Karaoke: now 21:00–23:50');
  assert.equal(describe(row(1, 'stop', 'b', { cancelled: true, note: 'closed' }), p).body, '“closed” · by Sam');
  assert.equal(describe(row(1, 'stop', 'b', { start: null, end: null, note: null, cancelled: null }), p).title, 'Karaoke: back to the plan');
  assert.equal(describe(row(1, 'todo', 't1', { done: true }), p).title, 'Done: Book the dinner cruise');
});

test('saved last trains are consistent: leave, then the train, then bed, from a stop that night', async () => {
  const { readFile } = await import('node:fs/promises');
  const lt = JSON.parse(await readFile(new URL('../data/last-trains.json', import.meta.url), 'utf8'));
  const trip = JSON.parse(await readFile(new URL('../dist/trip-data.json', import.meta.url), 'utf8'));
  const night = (hm) => { const [h, m] = hm.split(':').map(Number); return (h < 12 ? h + 24 : h) * 60 + m; };
  assert.ok(Object.keys(lt.days).length > 0);
  for (const [n, t] of Object.entries(lt.days)) {
    assert.ok(trip.stops.some((s) => s.id === t.origin && s.d === Number(n)), `day ${n}: origin ${t.origin} is that day's stop`);
    assert.ok(night(t.leave) < night(t.dep) && night(t.dep) < night(t.arr), `day ${n}: ${t.leave} < ${t.dep} < ${t.arr}`);
    assert.ok(night(t.dep) >= night('22:00') && night(t.dep) <= night('01:30'), `day ${n}: ${t.dep} is a last-train time`);
    assert.match(t.url, /^https:\/\/transit\.yahoo\.co\.jp\/search\/result\?.*type=2/);
    assert.doesNotMatch(t.line, /[぀-ヿ㐀-鿿]/, `day ${n}: line names in English (${t.line})`);
  }
});

test('push messages decrypt with an independent implementation (RFC 8291)', async () => {
  const phone = createECDH('prime256v1');
  phone.generateKeys();
  const auth = new Uint8Array(16).fill(7);
  const sub = { p256dh: b64u.encode(phone.getPublicKey()), auth: b64u.encode(auth) };
  const msg = JSON.stringify({ title: 'Leave at 20:10 for Karaoke', body: 'Ginza Line · 20 min', url: '/day/2/#b' });
  const body = await encrypt(new TextEncoder().encode(msg), sub);
  const plain = ece.decrypt(Buffer.from(body), { version: 'aes128gcm', privateKey: phone, authSecret: Buffer.from(auth) });
  assert.equal(plain.toString(), msg);
});

test('the VAPID header is a valid ES256 JWT for the push service', async () => {
  const k = await generateVapid();
  const h = await vapidAuth('https://web.push.apple.com/abc', { ...k, subject: 'https://example.workers.dev' }, Date.parse('2026-12-16T00:00:00Z'));
  const [, jwt, key] = h.match(/^vapid t=([^,]+), k=(.+)$/);
  assert.equal(key, k.publicKey);
  const [head, claims, sig] = jwt.split('.');
  const c = JSON.parse(new TextDecoder().decode(b64u.decode(claims)));
  assert.equal(c.aud, 'https://web.push.apple.com');
  assert.equal(c.exp, Date.parse('2026-12-16T12:00:00Z') / 1000);
  const pub = await crypto.subtle.importKey('raw', b64u.decode(k.publicKey), { name: 'ECDSA', namedCurve: 'P-256' }, false, ['verify']);
  assert.ok(await crypto.subtle.verify({ name: 'ECDSA', hash: 'SHA-256' }, pub, b64u.decode(sig), new TextEncoder().encode(`${head}.${claims}`)));
});
