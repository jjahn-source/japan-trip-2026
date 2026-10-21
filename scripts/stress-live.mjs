// The live layer at its limits, against the local Worker (npm run live:dev, or `npx wrangler dev`):
// concurrent saves, read costs against D1's free 5M rows a day, a crowd of phones checking at once,
// hostile input, the phone and push caps, and every alert from today to the end of the trip across
// time zones with an irregular cron. A stand-in push service decrypts what the Worker sends.
// Resets the local D1 at the end. Run: npm run stress:live   (LIVE_URL=http://localhost:8787 by default)
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { createECDH } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import ece from 'http_ece';
import { alertsFor, applyPlan, fold } from '../src/lib/live.ts';
import { b64u } from '../worker/push.ts';

const LIVE = process.env.LIVE_URL ?? 'http://localhost:8787';
const sql = (command) => JSON.parse(execFileSync('npx', ['wrangler', 'd1', 'execute', 'japan-plan-c', '--local', '--json', '--command', command], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }))[0].results;
const reset = () => sql(`DELETE FROM changes; DELETE FROM subs; DELETE FROM sent; UPDATE snapshot SET v = 0, state = '{"v":0,"items":{},"log":[]}' WHERE id = 1;`);
const call = async (path, body, init = {}) => {
  const r = await fetch(`${LIVE}/api${path}`, body === undefined ? init : { method: 'POST', headers: { 'content-type': 'application/json' }, body: typeof body === 'string' ? body : JSON.stringify(body), ...init });
  const text = await r.text();
  return { status: r.status, rows: Number(r.headers.get('x-rows-read')), bytes: text.length, j: (() => { try { return JSON.parse(text); } catch { return null; } })() };
};
const pool = async (n, width, job) => { let next = 0; await Promise.all(Array.from({ length: width }, async () => { while (next < n) await job(next++); })); };
const pct = (xs, p) => [...xs].sort((a, b) => a - b)[Math.min(xs.length - 1, Math.floor(xs.length * p))];

// The stand-in push service: /push/<phone> → decrypted with that phone's keys.
const phones = {}, inbox = [];
const server = createServer((req, res) => {
  const chunks = [];
  req.on('data', (c) => chunks.push(c));
  req.on('end', () => {
    const name = req.url.split('/').pop(), p = phones[name];
    const msg = JSON.parse(ece.decrypt(Buffer.concat(chunks), { version: 'aes128gcm', privateKey: p.ecdh, authSecret: p.auth }).toString());
    inbox.push({ phone: name, msg });
    res.writeHead(201).end();
  });
});
await new Promise((r) => server.listen(8798, r));
const subscribe = (name, tz, prefs = {}) => {
  const ecdh = createECDH('prime256v1'); ecdh.generateKeys();
  const auth = Buffer.alloc(16, 7);
  phones[name] = { ecdh, auth };
  return call('/subscribe', { subscription: { endpoint: `http://localhost:8798/push/${name}`, keys: { p256dh: b64u.encode(ecdh.getPublicKey()), auth: b64u.encode(auth) } }, device: `dev-${name}`, name, tz, prefs });
};
after(() => { server.close(); reset(); });

reset();
const plan = await fetch(`${LIVE}/live-plan.json`).then((r) => r.json());
const pick = (xs, i) => xs[(i * 7919) % xs.length];

test('a thousand saves at once all land, and the snapshot equals the whole history folded', async () => {
  const kinds = [
    (i) => ({ kind: 'stop', target: pick(plan.stops, i).id, patch: { note: `note ${i} 🍜 <b>bold</b>` } }),
    (i) => ({ kind: 'stop', target: pick(plan.stops, i).id, patch: { start: `${String(10 + (i % 12)).padStart(2, '0')}:${String((i * 7) % 60).padStart(2, '0')}` } }),
    (i) => ({ kind: 'stop', target: pick(plan.stops, i).id, patch: { cancelled: i % 3 === 0 ? true : null } }),
    (i) => ({ kind: 'todo', target: pick(plan.todos, i).id, patch: { done: i % 2 === 0 } }),
    (i) => ({ kind: 'day', target: String(pick(plan.days, i).n), patch: { lastTrain: i % 5 ? { leave: '23:30', dep: '23:41', arr: '00:20', from: 'Shibuya', line: 'Yamanote' } : null } }),
  ];
  const fails = [], ms = [];
  const t0 = Date.now();
  await pool(1000, 40, async (i) => {
    const s = Date.now();
    const r = await call('/changes', { ...kinds[i % kinds.length](i), author: `P${i % 8}`, device: `d${i % 8}` });
    ms.push(Date.now() - s);
    if (r.status !== 200) fails.push(r);
  });
  console.log(`  1000 saves, 40 at a time: ${Date.now() - t0} ms, p50 ${pct(ms, 0.5)} ms, p95 ${pct(ms, 0.95)} ms`);
  assert.deepEqual(fails, []);
  const rows = sql('SELECT id, kind, target, patch, author, at FROM changes').map((r) => ({ ...r, patch: JSON.parse(r.patch), device: null }));
  assert.equal(rows.length, 1000);
  const truth = fold(rows);
  const { j } = await call('/state');
  assert.equal(j.v, truth.v);
  assert.deepEqual(j.items, truth.items);
  assert.deepEqual(j.log.map((c) => c.id), truth.log.map((c) => c.id));
});

test('a phone check reads at most two rows; an up-to-date one gets a few bytes', async () => {
  const full = await call('/state');
  const same = await call(`/state?v=${full.j.v}`);
  console.log(`  check: ${full.rows} rows read, ${full.bytes} bytes; up to date: ${same.rows} rows, ${same.bytes} bytes`);
  assert.ok(full.rows <= 2 && same.rows <= 2);
  assert.ok(same.bytes < 40);
  assert.equal(same.j.same, true);
  // A day at the limit: 8 phones open 16 hours, checking every 30 s, and the cron every minute.
  const day = 8 * 16 * 120 * full.rows + 1440 * (full.rows + 10);
  console.log(`  worst day: ~${day.toLocaleString()} rows read of 5,000,000 free; ~${(8 * 16 * 120 + 1440).toLocaleString()} requests of 100,000`);
  assert.ok(day < 500_000);
});

test('fifty phones checking at once, two thousand times', async () => {
  const ms = [], bad = [];
  const v = (await call('/state')).j.v;
  const t0 = Date.now();
  await pool(2000, 50, async (i) => { const s = Date.now(); const r = await call(`/state${i % 2 ? `?v=${v}` : ''}`); ms.push(Date.now() - s); if (r.status !== 200) bad.push(r.status); });
  console.log(`  2000 checks, 50 at a time: ${Date.now() - t0} ms, p50 ${pct(ms, 0.5)} ms, p95 ${pct(ms, 0.95)} ms`);
  assert.deepEqual(bad, []);
});

test('hostile input is refused without harm', async () => {
  const stop = plan.stops[0].id;
  const ok = { kind: 'stop', target: stop, author: 'Sam' };
  const cases = [
    ['not JSON', '{nope', 400],
    ['an array', '[1,2]', 400],
    ['9 KB', JSON.stringify({ ...ok, patch: { note: 'x'.repeat(9000) } }), 400],
    ['an unknown field', { ...ok, patch: { name: 'Hacked' } }, 400],
    ['__proto__ in the patch', `{"kind":"stop","target":"${stop}","author":"Sam","patch":{"__proto__":{"admin":true}}}`, 400],
    ['a bad kind', { ...ok, kind: 'user' }, 400],
    ['a 1,000-character target', { ...ok, target: 'x'.repeat(1000), patch: { note: 'x' } }, 400],
    ['a time of 24:00', { ...ok, patch: { start: '24:00' } }, 400],
    ['no author', { kind: 'stop', target: stop, patch: { note: 'x' } }, 400],
    ['a 41-character name', { ...ok, author: 'x'.repeat(41), patch: { note: 'x' } }, 400],
    ['a non-push endpoint', { subscription: { endpoint: 'https://example.com/webhook', keys: { p256dh: 'a', auth: 'b' } } }, 400, '/subscribe'],
  ];
  for (const [what, body, status, path = '/changes'] of cases) assert.equal((await call(path, body)).status, status, what);
  // A body with no declared length (streamed) is refused before it's read.
  const stream = new ReadableStream({ start(c) { c.enqueue(new TextEncoder().encode(JSON.stringify({ ...ok, patch: { note: 'x' } }))); c.close(); } });
  assert.equal((await fetch(`${LIVE}/api/changes`, { method: 'POST', body: stream, duplex: 'half', headers: { 'content-type': 'application/json' } })).status, 400);
  // Markup and emoji are stored as text, not run.
  const r = await call('/changes', { ...ok, patch: { note: '<img src=x onerror=alert(1)> 🍣' } });
  assert.equal(r.j.items[`stop:${stop}`].patch.note, '<img src=x onerror=alert(1)> 🍣');
  assert.equal((await call('/nope')).status, 404);
  assert.equal((await call('/debug/alerts', undefined, { method: 'GET' })).status, 404);
});

test('a burst from one address is slowed down; another address is unaffected', async () => {
  const stop = plan.stops[1].id;
  const send = (ip) => fetch(`${LIVE}/api/changes`, { method: 'POST', headers: { 'content-type': 'application/json', 'x-test-limits': '1', 'x-test-ip': ip }, body: JSON.stringify({ kind: 'stop', target: stop, author: 'Spam', patch: { note: 'x' } }) }).then((r) => r.status);
  const codes = []; for (let i = 0; i < 70; i++) codes.push(await send('203.0.113.9'));
  console.log(`  70 saves in a burst from one address: ${codes.filter((c) => c === 200).length} saved, ${codes.filter((c) => c === 429).length} told to slow down`);
  assert.equal(codes.filter((c) => c === 200).length, 60);
  assert.equal(codes.filter((c) => c === 429).length, 10);
  assert.equal(await send('198.51.100.7'), 200);
});

test('forty phones at most; twenty pushes a run, the rest the next minute', async () => {
  sql('DELETE FROM subs; DELETE FROM sent;');
  for (let i = 0; i < 40; i++) assert.equal((await subscribe(`cap${i}`, 'Asia/Tokyo')).status, 200);
  assert.equal((await subscribe('cap40', 'Asia/Tokyo')).status, 429);
  assert.equal((await subscribe('cap3', 'Asia/Tokyo')).status, 200); // a known phone can still update
  const live = applyPlan(plan, (await call('/state')).j);
  const a = alertsFor(live, 'Asia/Tokyo').find((x) => x.kind === 'leave');
  inbox.length = 0;
  const runs = [];
  for (let k = 1; k <= 3; k++) runs.push((await call('/debug/alerts', { now: a.at + k * 60e3 })).j.sent.filter((s) => s.key === a.key).length);
  await new Promise((r) => setTimeout(r, 800));
  console.log(`  one alert to 40 phones: ${runs.join(' + ')} pushes over three runs`);
  assert.deepEqual(runs, [20, 20, 0]);
  assert.equal(new Set(inbox.filter((m) => m.msg.tag === a.key).map((m) => m.phone)).size, 40);
});

test('every alert from today to the end of the trip goes out once, on time, in three time zones', async () => {
  sql('DELETE FROM subs; DELETE FROM sent;');
  const who = [['tokyo', 'Asia/Tokyo', {}], ['la', 'America/Los_Angeles', {}], ['london', 'Europe/London', { leave: false }]];
  for (const [n, tz, p] of who) assert.equal((await subscribe(n, tz, p)).status, 200);
  const nameOf = new Map(sql('SELECT id, name FROM subs').map((r) => [r.id, r.name]));
  const live = applyPlan(plan, (await call('/state')).j);
  const start = Date.now(), end = Date.parse('2026-12-30T00:00:00+09:00');
  const expected = new Map();
  for (const [n, tz, p] of who) for (const a of alertsFor(live, tz)) if (a.at > start && a.at <= end && p[a.kind] !== false) expected.set(`${n}|${a.key}`, a.at);
  const got = new Map(), wrong = [];
  // An irregular cron: runs 13 minutes apart (as if most were missed), inside the 15-minute window.
  let runs = 0;
  for (let now = start; now <= end + 15 * 60e3; now += 13 * 60e3) {
    const { j } = await call('/debug/alerts', { now });
    runs++;
    for (const s of j.sent) {
      const k = `${nameOf.get(s.sub)}|${s.key}`;
      got.set(k, (got.get(k) ?? 0) + 1);
      const at = expected.get(k);
      if (at === undefined || now < at || now - at >= 15 * 60e3) wrong.push({ k, now, at });
    }
  }
  console.log(`  ${runs} cron runs: ${expected.size} alerts expected, ${got.size} sent`);
  assert.deepEqual(wrong, []);
  assert.deepEqual([...got.values()].filter((c) => c !== 1), []);
  assert.deepEqual([...expected.keys()].filter((k) => !got.has(k)), []);
});
