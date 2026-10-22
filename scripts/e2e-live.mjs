// End to end against the live layer running locally (npm run live:dev, or `npx wrangler dev`):
// a stand-in push service on localhost receives the Worker's real pushes and decrypts them with the
// "phone's" keys, so this covers saving changes, pushing them to everyone else, the cron alerts (sent
// once), forgetting dead subscriptions and refusing bad input. Clears its rows from the local D1 after.
// Run: npm run e2e:live   (LIVE_URL=http://localhost:8787 by default)
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { createECDH } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import ece from 'http_ece';
import { alertsFor } from '../src/lib/live.ts';
import { b64u } from '../worker/push.ts';

const LIVE = process.env.LIVE_URL ?? 'http://localhost:8787';
const api = async (path, body) => {
  const r = await fetch(`${LIVE}/api${path}`, body ? { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) } : {});
  return { status: r.status, j: await r.json() };
};

// The stand-in push service: /push/<phone> → decrypt with that phone's keys.
const phones = {}, inbox = {};
let gone = new Set();
const server = createServer((req, res) => {
  const chunks = [];
  req.on('data', (c) => chunks.push(c));
  req.on('end', () => {
    const name = req.url.split('/').pop();
    if (gone.has(name)) { res.writeHead(410).end(); return; }
    const p = phones[name];
    const msg = JSON.parse(ece.decrypt(Buffer.concat(chunks), { version: 'aes128gcm', privateKey: p.ecdh, authSecret: p.auth }).toString());
    (inbox[name] ??= []).push({ msg, auth: req.headers.authorization, ttl: req.headers.ttl });
    res.writeHead(201).end();
  });
});
await new Promise((r) => server.listen(8799, r));
const phone = async (name, device) => {
  const ecdh = createECDH('prime256v1'); ecdh.generateKeys();
  const auth = Buffer.alloc(16, name.charCodeAt(0));
  phones[name] = { ecdh, auth };
  const subscription = { endpoint: `http://localhost:8799/push/${name}`, keys: { p256dh: b64u.encode(ecdh.getPublicKey()), auth: b64u.encode(auth) } };
  return api('/subscribe', { subscription, device, name, tz: 'America/Los_Angeles', prefs: {} });
};
const settle = () => new Promise((r) => setTimeout(r, 600));
after(() => {
  server.close();
  execFileSync('npx', ['wrangler', 'd1', 'execute', 'japan-plan-c', '--local', '--command', `DELETE FROM changes; DELETE FROM subs; DELETE FROM sent; DELETE FROM gchecks; DELETE FROM gquota; DELETE FROM gcache; UPDATE snapshot SET v = 0, state = '{"v":0,"items":{},"log":[]}' WHERE id = 1;`], { stdio: 'ignore' });
});

const plan = await fetch(`${LIVE}/live-plan.json`).then((r) => r.json());
const stop = plan.stops.find((s) => s.cat === 'restaurant');

test('bad changes are refused with a reason', async () => {
  assert.equal((await api('/changes', { kind: 'stop', target: 'nope', patch: { note: 'x' }, author: 'Sam' })).status, 404);
  assert.match((await api('/changes', { kind: 'stop', target: stop.id, patch: { note: 'x' } })).j.error, /name/);
  assert.match((await api('/changes', { kind: 'stop', target: stop.id, patch: { start: '9pm' }, author: 'Sam' })).j.error, /HH:MM/);
  assert.equal((await api('/subscribe', { subscription: { endpoint: 'https://evil.example/hook', keys: { p256dh: 'x', auth: 'y' } } })).status, 400);
});

test('a change is saved, shown to everyone and pushed to the other phones only', async () => {
  assert.equal((await phone('ann', 'dev-ann')).status, 200);
  assert.equal((await phone('ben', 'dev-ben')).status, 200);
  const r = await api('/changes', { kind: 'stop', target: stop.id, patch: { start: '20:30', note: 'Table at 20:30 now' }, author: 'Ben', device: 'dev-ben' });
  assert.equal(r.status, 200);
  assert.deepEqual(r.j.items[`stop:${stop.id}`].patch, { start: '20:30', note: 'Table at 20:30 now' });
  assert.equal(r.j.log[0].device ?? null, null); // device ids stay on the server
  await settle();
  assert.equal(inbox.ben, undefined);
  assert.equal(inbox.ann.length, 1);
  assert.equal(inbox.ann[0].msg.title, `${stop.name}: now 20:30`);
  assert.equal(inbox.ann[0].msg.body, '“Table at 20:30 now” · by Ben');
  // Signed for this push service with the key the phones subscribed with.
  const { key } = (await api('/push-key')).j;
  const [, jwt, k] = inbox.ann[0].auth.match(/^vapid t=([^,]+), k=(.+)$/);
  assert.equal(k, key);
  assert.equal(JSON.parse(Buffer.from(jwt.split('.')[1], 'base64url')).aud, 'http://localhost:8799');
  assert.equal((await api('/state')).j.items[`stop:${stop.id}`].patch.start, '20:30');
});

test('the cron run sends a due alert once to each phone, then never again', async () => {
  const leave = alertsFor(plan, 'Asia/Tokyo').find((a) => a.kind === 'leave' && !a.key.includes(stop.id));
  inbox.ann = []; inbox.ben = [];
  const first = (await api('/debug/alerts', { now: leave.at + 60e3 })).j.sent;
  assert.equal(first.filter((s) => s.key === leave.key).length, 2);
  await settle();
  assert.ok(inbox.ann.some((m) => m.msg.title === leave.title));
  assert.ok(inbox.ben.some((m) => m.msg.title === leave.title && m.ttl === '900'));
  const again = (await api('/debug/alerts', { now: leave.at + 120e3 })).j.sent;
  assert.equal(again.filter((s) => s.key === leave.key).length, 0);
});

test('the morning hours check pushes a closure Google shows for the day, once, and asks each stop once a day', async () => {
  // A stop with a Google place, and 07:05 in Japan the day before it.
  const target = plan.stops.find((s) => s.g && s.id !== stop.id && +s.s.slice(11, 13) >= 10);
  const day = new Date(Date.parse(target.s.slice(0, 10) + 'T00:00:00Z') - 864e5).toISOString().slice(0, 10);
  const now = Date.parse(`${day}T07:05:00+09:00`);
  // Google's answers: every other place says nothing about hours; the target is open all week but has
  // no hours on any date of the coming week (a holiday closure).
  const google = Object.fromEntries(plan.stops.filter((s) => s.g).map((s) => [s.g, {}]));
  google[target.g] = { regularOpeningHours: { periods: [{ open: { day: 0, hour: 0, minute: 0 } }] }, currentOpeningHours: { periods: [] } };
  inbox.ann = []; inbox.ben = [];
  // Ten stops a run: a few runs cover the next 48 hours.
  const checked = [];
  for (let m = 0; m < 6; m++) checked.push(...(await api('/debug/google', { now: now + m * 60e3, google })).j.checked);
  const mine = checked.filter((c) => c.stop === target.id);
  assert.deepEqual(mine, [{ stop: target.id, news: 'closed' }]);
  assert.equal(new Set(checked.map((c) => c.stop)).size, checked.length); // each stop asked once
  await settle();
  for (const who of ['ann', 'ben']) {
    const m = inbox[who].filter((x) => x.msg.title.startsWith(target.name));
    assert.equal(m.length, 1, who);
    assert.match(m[0].msg.title, /looks closed on/);
    assert.equal(m[0].msg.url, `/day/${target.d}/#${target.id}`);
  }
  // Later the same morning: nothing new is asked or sent; outside 07:00 nothing runs at all.
  assert.deepEqual((await api('/debug/google', { now: now + 40 * 60e3, google })).j.checked, []);
  assert.deepEqual((await api('/debug/google', { now: now + 3 * 3600e3, google })).j.checked, []);
  await settle();
  assert.equal(inbox.ann.filter((x) => x.msg.title.startsWith(target.name)).length, 1);
});

test('the calendar feed has the group\'s change: the moved stop at its new time', async () => {
  const r = await fetch(`${LIVE}/api/calendar.ics`);
  assert.equal(r.status, 200);
  assert.match(r.headers.get('content-type'), /text\/calendar/);
  const ics = (await r.text()).replace(/\r\n /g, '');
  const ev = ics.split('BEGIN:VEVENT').find((e) => e.includes(`UID:${stop.id}@`));
  const moved = new Date(Date.parse(`${stop.s.slice(0, 10)}T20:30:00+09:00`)).toISOString().replace(/[-:]/g, '').replace('.000', '');
  assert.match(ev, new RegExp(`DTSTART:${moved}`));
  assert.match(ev, /Note: Table at 20:30 now/);
});

test('weather warnings for where the group is go out once, at 7am; routine notices never', async () => {
  const day = plan.days.find((d) => d.at);
  const now = Date.parse(`${day.date}T07:10:00+09:00`);
  const alerts = [{ alertId: 'e2e-snow', alertTitle: { text: 'Heavy snow warning' }, areaName: '箱根町' }, { alertId: 'e2e-info', alertTitle: { text: 'General typhoon information' } }];
  inbox.ann = []; inbox.ben = [];
  const first = (await api('/debug/weather', { now, alerts })).j.checked;
  assert.ok(first.length >= 1 && first[0].warnings === 1);
  await settle();
  for (const who of ['ann', 'ben']) assert.deepEqual(inbox[who].map((m) => m.msg.title), [`Heavy snow warning for ${day.city} today`]);
  assert.deepEqual((await api('/debug/weather', { now: now + 60e3, alerts })).j.checked, []);
  assert.deepEqual((await api('/debug/weather', { now: now + 5 * 3600e3, alerts })).j.checked, []);
});

test('open-now search refuses bad input and says when Google is off', async () => {
  const r = await api('/nearby?q=ramen&lat=40.7&lng=-74');
  assert.ok([400, 503].includes(r.status));
  const ok = await api('/nearby?q=ramen&lat=35.694&lng=139.705');
  assert.ok(ok.status === 200 ? Array.isArray(ok.j.rows) : ok.status === 503, JSON.stringify(ok.j));
});

test('ask refuses bad input and says when Gemini is off', async () => {
  const bad = await api('/ask', { q: 'ramen?', lat: 40.7, lng: -74 });
  assert.ok([400, 503].includes(bad.status));
  const r = await api('/ask', { q: 'late ramen for 8 near here?', lat: 35.694, lng: 139.705 });
  assert.ok(r.status === 200 ? typeof r.j.text === 'string' : r.status === 503, JSON.stringify(r.j));
});

test('a ticked booking is shared, and a phone that has gone is forgotten', async () => {
  const todo = plan.todos[0];
  const r = await api('/changes', { kind: 'todo', target: todo.id, patch: { done: true }, author: 'Ann', device: 'dev-ann' });
  assert.equal(r.j.items[`todo:${todo.id}`].patch.done, true);
  await settle();
  assert.match(inbox.ben.at(-1).msg.title, /^Done: /);
  gone = new Set(['ben']);
  await api('/changes', { kind: 'todo', target: todo.id, patch: { done: null }, author: 'Ann', device: 'dev-ann' });
  await settle();
  assert.equal((await api('/push-test', { endpoint: 'http://localhost:8799/push/ben' })).status, 404);
  assert.equal((await api('/push-test', { endpoint: 'http://localhost:8799/push/ann' })).status, 200);
});
