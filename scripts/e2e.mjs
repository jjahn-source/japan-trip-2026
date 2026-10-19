// npm run e2e (after npm run build): the built app in a real browser, at phone and desktop sizes.
// Serves dist/ itself, so it needs nothing else running. The map needs the network and WebGL; every
// check here holds with or without it, since the app must work when the map can't load.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const DIST = fileURLToPath(new URL('../dist/', import.meta.url));
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2', '.webmanifest': 'application/manifest+json' };
let server, base, browser;

before(async () => {
  server = createServer(async (req, res) => {
    const path = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^(\.\.[/\\])+/, '');
    let file = join(DIST, path);
    try { if ((await stat(file)).isDirectory()) file = join(file, 'index.html'); } catch { /* 404 below */ }
    try {
      const body = await readFile(file);
      res.writeHead(200, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream', 'cache-control': 'no-store' });
      res.end(body);
    } catch { res.writeHead(404); res.end('not found'); }
  });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  base = `http://127.0.0.1:${server.address().port}`;
  browser = await chromium.launch();
});
after(async () => { await browser?.close(); server?.close(); });

const SIZES = { phone: { width: 390, height: 844, isMobile: true, hasTouch: true }, desktop: { width: 1440, height: 900 } };

/** A page that fails the test on any uncaught error (the map being unavailable is not one). */
async function open(size, path) {
  const { width, height, ...rest } = SIZES[size];
  const ctx = await browser.newContext({ viewport: { width, height }, ...rest, serviceWorkers: 'block' });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(base + path);
  // The pre-rendered copy is replaced by the live app once the trip data is in.
  await page.locator('#boot').waitFor({ state: 'detached' });
  await page.locator('.shell').waitFor();
  return { page, ctx, errors };
}

for (const size of ['phone', 'desktop']) {
  test(`${size}: the trip home lists every day and links into them`, async () => {
    const { page, ctx, errors } = await open(size, '/');
    assert.equal(await page.locator('.days li').count(), 15);
    await page.locator('.days a').nth(2).click();
    await page.waitForURL('**/day/3/');
    assert.match(await page.locator('#day-title').innerText(), /teamLab/);
    await page.goBack();
    await page.waitForURL(base + '/');
    await page.locator('ol.days').waitFor();
    assert.deepEqual(errors, []);
    await ctx.close();
  });

  test(`${size}: a stop's sheet opens and closes by button, Escape and Back`, async () => {
    const { page, ctx, errors } = await open(size, '/day/3/');
    const sheet = page.locator('dialog.sheet');
    const row = page.locator('.stop .hit').nth(1);
    await row.click();
    await sheet.waitFor({ state: 'visible' });
    assert.match(page.url(), /#d03-s02$/);
    await page.getByRole('button', { name: 'Close', exact: true }).click();
    await sheet.waitFor({ state: 'detached' });
    assert.doesNotMatch(page.url(), /#/);
    await row.click();
    await sheet.waitFor({ state: 'visible' });
    await page.keyboard.press('Escape');
    await sheet.waitFor({ state: 'detached' });
    await row.click();
    await sheet.waitFor({ state: 'visible' });
    await page.goBack();
    await sheet.waitFor({ state: 'detached' });
    assert.match(page.url(), /\/day\/3\/$/);
    assert.deepEqual(errors, []);
    await ctx.close();
  });

  test(`${size}: a deep link opens the day with its stop`, async () => {
    const { page, ctx, errors } = await open(size, '/day/3/#d03-s02');
    await page.locator('dialog.sheet').waitFor({ state: 'visible' });
    assert.match(await page.locator('#sheet-title').innerText(), /Tsukiji/);
    assert.deepEqual(errors, []);
    await ctx.close();
  });

  test(`${size}: switching days keeps the URL, the header and the timeline in step`, async () => {
    const { page, ctx, errors } = await open(size, '/day/3/');
    await page.locator('nav.days a[href="/day/8/"]').click();
    await page.waitForURL('**/day/8/');
    assert.match(await page.locator('#day-title').innerText(), /USJ/);
    assert.ok(await page.locator('.stop').count() > 3);
    assert.deepEqual(errors, []);
    await ctx.close();
  });

  test(`${size}: a leg plays to its arrival and can be stopped`, async () => {
    const { page, ctx, errors } = await open(size, '/day/3/');
    const play = page.locator('.strip .play').first();
    await play.click();
    await page.locator('.play[aria-pressed="true"]').first().waitFor();
    // Stop it mid-way…
    await play.click();
    await page.waitForFunction(() => !document.querySelector('.play[aria-pressed="true"]'));
    // …then let it run to the end: the button turns back into play.
    await play.click();
    await page.locator('.play[aria-pressed="true"]').first().waitFor();
    await page.waitForFunction(() => !document.querySelector('.play[aria-pressed="true"]'), null, { timeout: 15000 });
    assert.deepEqual(errors, []);
    await ctx.close();
  });

  test(`${size}: search finds a stop and opens it`, async () => {
    const { page, ctx, errors } = await open(size, '/');
    await page.getByRole('button', { name: 'Search stops and nearby places' }).click();
    const input = page.getByRole('searchbox', { name: 'Search the trip and nearby places' });
    await input.fill('teamlab');
    await page.getByRole('option').first().waitFor();
    await input.press('Enter');
    await page.waitForURL(/\/day\/3\/#d03-s03$/);
    await page.locator('dialog.sheet').waitFor({ state: 'visible' });
    assert.deepEqual(errors, []);
    await ctx.close();
  });

  test(`${size}: search finds places near the day and pins one`, async () => {
    const { page, ctx, errors } = await open(size, '/day/8/');
    await page.keyboard.press('/');
    const input = page.getByRole('searchbox', { name: 'Search the trip and nearby places' });
    await input.fill('ramen');
    const place = page.locator('.res', { has: page.locator('.badge svg') }).first();
    await place.waitFor();
    await place.click();
    await page.locator('.pincard').waitFor();
    await page.getByRole('button', { name: 'Remove the pin' }).click();
    await page.locator('.pincard').waitFor({ state: 'detached' });
    assert.deepEqual(errors, []);
    await ctx.close();
  });
}

test('phone: a booking tick survives a reload', async () => {
  const { page, ctx, errors } = await open('phone', '/bookings/');
  await page.locator('.grp li input[type=checkbox]').first().check({ force: true });
  await page.reload();
  await page.locator('.grp[data-k="done"]').waitFor();
  assert.deepEqual(errors, []);
  await ctx.close();
});

test('phone: the budget shows the plan’s own total', async () => {
  const { page, ctx, errors } = await open('phone', '/budget/');
  assert.match(await page.locator('.total').innerText(), /¥209,000/);
  assert.equal(await page.locator('.bars li', { hasText: 'Total' }).count(), 0);
  assert.deepEqual(errors, []);
  await ctx.close();
});

test('phone: the page reads before any script runs', async () => {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, javaScriptEnabled: false });
  const page = await ctx.newPage();
  await page.goto(base + '/day/3/');
  assert.match(await page.locator('#day-title').innerText(), /teamLab/);
  assert.ok(await page.locator('.stop').count() > 5);
  await page.locator('nav.days a[href="/day/4/"]').click();
  await page.waitForURL('**/day/4/');
  await ctx.close();
});

test('phone: nothing scrolls sideways', async () => {
  for (const path of ['/', '/day/3/', '/day/8/', '/bookings/', '/budget/']) {
    const { page, ctx } = await open('phone', path);
    const over = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    assert.ok(over <= 0, `${path} overflows by ${over}px`);
    await ctx.close();
  }
});
