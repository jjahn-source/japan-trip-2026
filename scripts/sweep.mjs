// npm run sweep (with npm run serve running): every stop sheet, every ride, search, back/forward and resizing, at phone and desktop sizes; prints anything wrong.
// Uses Chromium with the Mac's GPU, or Safari's engine with BROWSER=webkit (npx playwright install webkit).
// BASE_URL picks the server (default http://127.0.0.1:4326).
import { chromium, webkit } from 'playwright';
const b = process.env.BROWSER === 'webkit' ? await webkit.launch() : await chromium.launch({ channel: 'chromium', args: ['--enable-gpu', '--use-angle=metal', '--ignore-gpu-blocklist'] });
const issues = [];
for (const [w, h] of [[390, 844], [1440, 900]]) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, hasTouch: w < 900, isMobile: w < 900 });
  const p = await ctx.newPage();
  p.on('pageerror', (e) => issues.push(`[${w}] pageerror: ${e.message}`));
  p.on('console', (m) => { if (m.type() === 'error' && !/serviceworker|favicon|net::ERR|Failed to load resource/i.test(m.text())) issues.push(`[${w}] console: ${m.text().slice(0, 200)}`); if (m.type() === 'warning' && /svelte|hydrat|state_|effect/i.test(m.text())) issues.push(`[${w}] warn: ${m.text().slice(0, 200)}`); });
  await p.goto((process.env.BASE_URL ?? 'http://127.0.0.1:4326') + '/?v=sweep');
  await p.locator('#boot').waitFor({ state: 'detached' });
  for (let n = 1; n <= 15; n++) {
    await p.evaluate((n) => document.querySelector(`nav.days a[href="/day/${n}/"], ol.days a[href="/day/${n}/"]`)?.click(), n);
    await p.waitForURL(`**/day/${n}/**`).catch(() => issues.push(`[${w}] day ${n}: URL did not change`));
    const title = await p.locator('#day-title').innerText().catch(() => '');
    if (!title) issues.push(`[${w}] day ${n}: no title`);
    const rows = await p.locator('.stop .hit').count();
    for (let i = 0; i < rows; i++) {
      await p.locator('.stop .hit').nth(i).evaluate((el) => el.click());
      const ok = await p.locator('dialog.sheet[open]').waitFor({ timeout: 3000 }).then(() => true, () => false);
      if (!ok) { issues.push(`[${w}] day ${n} stop ${i + 1}: sheet did not open`); continue; }
      const t = await p.locator('#sheet-title').innerText();
      if (!t) issues.push(`[${w}] day ${n} stop ${i + 1}: empty sheet title`);
      await p.keyboard.press('Escape');
      const closed = await p.locator('dialog.sheet').waitFor({ state: 'detached', timeout: 3000 }).then(() => true, () => false);
      if (!closed) issues.push(`[${w}] day ${n} stop ${i + 1}: sheet did not close`);
    }
    const plays = await p.locator('.strip .play').count();
    for (let i = 0; i < plays; i++) {
      await p.locator('.strip .play').nth(i).evaluate((el) => el.click());
      await p.waitForTimeout(250);
      const pressed = await p.locator('.strip .play').nth(i).getAttribute('aria-pressed');
      if (pressed !== 'true') issues.push(`[${w}] day ${n} leg ${i + 1}: did not start playing`);
      await p.locator('.strip .play').nth(i).evaluate((el) => el.click());
      await p.waitForTimeout(80);
      if (await p.locator('.play[aria-pressed="true"]').count()) issues.push(`[${w}] day ${n} leg ${i + 1}: did not stop`);
    }
    if (await p.evaluate(() => document.documentElement.scrollWidth > innerWidth)) issues.push(`[${w}] day ${n}: horizontal overflow`);
  }
  // back/forward stress
  for (let i = 0; i < 6; i++) await p.goBack();
  for (let i = 0; i < 3; i++) await p.goForward();
  await p.waitForTimeout(500);
  const url = p.url(), title = await p.locator('#day-title').innerText().catch(() => 'home');
  issues.push(`[${w}] after back/forward: ${url.replace((process.env.BASE_URL ?? 'http://127.0.0.1:4326') + '', '')} shows "${title.slice(0, 30)}"`);
  // search
  for (const q of ['ramen', 'izakaya open now', 'konbini', 'tsukiji', 'xyzzy', 'ラーメン', 'shibuya sky']) {
    await p.evaluate(() => document.querySelector('.find')?.click());
    await p.getByRole('searchbox').fill(q);
    await p.waitForTimeout(250);
    const n = await p.locator('.res').count();
    issues.push(`[${w}] search "${q}": ${n} results`);
    await p.keyboard.press('Escape');
    await p.waitForTimeout(150);
  }
  // big map toggle on phone: does the canvas follow the box?
  if (w < 900) {
    await p.evaluate(() => document.querySelector('.grow')?.click());
    await p.waitForTimeout(800);
    const r = await p.evaluate(() => ({ box: document.querySelector('.map').getBoundingClientRect().height, canvas: document.querySelector('.mapboxgl-canvas')?.getBoundingClientRect().height }));
    if (Math.abs(r.box - (r.canvas ?? 0)) > 2) issues.push(`[${w}] big map: box ${Math.round(r.box)}px but canvas ${Math.round(r.canvas ?? 0)}px`);
  } else {
    await p.setViewportSize({ width: 1100, height: 800 }); await p.waitForTimeout(600);
    const r = await p.evaluate(() => ({ box: document.querySelector('.map').getBoundingClientRect().width, canvas: document.querySelector('.mapboxgl-canvas')?.getBoundingClientRect().width }));
    if (Math.abs(r.box - (r.canvas ?? 0)) > 2) issues.push(`[${w}] resize: box ${Math.round(r.box)}px but canvas ${Math.round(r.canvas ?? 0)}px`);
  }
  await ctx.close();
}
console.log(issues.join('\n'));
await b.close();
