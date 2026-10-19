// npm run perf (with npm run serve running): how long taps take to paint on a phone with the CPU slowed 4×, and scroll smoothness.
// Uses Chromium with the Mac's GPU. BASE_URL picks the server (default http://127.0.0.1:4326).
import { chromium } from 'playwright';
const b = await chromium.launch({ channel: 'chromium', args: ['--enable-gpu', '--use-angle=metal', '--ignore-gpu-blocklist'] });
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
const p = await ctx.newPage();
const cdp = await ctx.newCDPSession(p);
await p.goto((process.env.BASE_URL ?? 'http://127.0.0.1:4326') + '/day/3/?v=perf');
await p.locator('#boot').waitFor({ state: 'detached' });
await p.waitForSelector('.mk-stop', { timeout: 30000 }); await p.waitForTimeout(3000);
await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
await p.evaluate(() => {
  window.__ev = []; window.__lt = 0;
  new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__ev.push({ n: e.name, d: Math.round(e.duration), proc: Math.round(e.processingEnd - e.processingStart), delay: Math.round(e.processingStart - e.startTime) }); }).observe({ type: 'event', durationThreshold: 16, buffered: false });
  new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__lt += e.duration; }).observe({ type: 'longtask' });
});
const results = [];
async function measure(label, act, settle = 900) {
  await p.evaluate(() => { window.__ev = []; window.__lt = 0; });
  await act();
  await p.waitForTimeout(settle);
  const r = await p.evaluate(() => ({ ev: window.__ev, lt: Math.round(window.__lt) }));
  const worst = r.ev.filter((e) => /click|pointer|key|input/.test(e.n)).sort((a, c) => c.d - a.d)[0];
  results.push(`${label.padEnd(26)} tap→paint ${worst ? worst.d + 'ms (handler ' + worst.proc + 'ms)' : '<16ms'}  long tasks ${r.lt}ms`);
}
const tap = (sel, i = 0) => async () => { await p.locator(sel).nth(i).tap(); };
await measure('switch day 3→4', tap('nav.days a[href="/day/4/"]'), 1500);
await measure('switch day 4→5', tap('nav.days a[href="/day/5/"]'), 1500);
await measure('switch day 5→3', tap('nav.days a[href="/day/3/"]'), 1500);
await measure('open stop sheet', tap('.stop .hit', 1));
await measure('close sheet (button)', tap('button.close'));
await measure('open stop sheet 2', tap('.stop .hit', 3));
await measure('close sheet (Escape)', async () => p.keyboard.press('Escape'));
await measure('play ride', tap('.strip .play', 0), 600);
await measure('stop ride', tap('.strip .play', 0));
await measure('open search', tap('.find'));
await measure('type "ramen"', async () => p.keyboard.type('ramen', { delay: 60 }), 600);
await measure('close search', async () => p.keyboard.press('Escape'));
await measure('bigger map', tap('.grow'));
await measure('smaller map', tap('.grow'));
await measure('tab: Bookings', tap('.tabs a', 1), 1200);
await measure('tick a booking', async () => p.locator('.grp li .row').first().tap(), 600);
await measure('tab: Budget', tap('.tabs a', 2), 1200);
await measure('home (trip)', tap('.mark'), 1500);
await measure('home → day 8', tap('ol.days a[href="/day/8/"]'), 1500);
// scroll smoothness on a long day
await p.evaluate(() => { window.__frames = []; let last = performance.now(); const f = (t) => { window.__frames.push(t - last); last = t; if (window.__frames.length < 120) requestAnimationFrame(f); }; requestAnimationFrame(f); });
for (let i = 0; i < 8; i++) { await p.mouse.wheel(0, 300); await p.waitForTimeout(60); }
await p.waitForTimeout(800);
const fr = await p.evaluate(() => window.__frames);
const jank = fr.filter((x) => x > 34).length;
results.push(`scroll day 8: ${fr.length} frames, ${jank} over 34ms, worst ${Math.round(Math.max(...fr))}ms`);
await p.evaluate(() => localStorage.removeItem('jt:ticks'));
console.log(results.join('\n'));
await b.close();
