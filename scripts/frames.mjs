// npm run frames (with npm run serve running): how smooth the motion is on a phone with the CPU slowed
// 4×: frame times while a ride plays, while the camera flies to a new day, while a stop's sheet opens
// and closes, and while the day scrolls. Uses Chromium with the Mac's GPU. BASE_URL picks the server.
import { chromium } from 'playwright';
const BASE = process.env.BASE_URL ?? 'http://127.0.0.1:4326';
const RATE = Number(process.env.CPU ?? 4);
const b = await chromium.launch({ channel: 'chromium', args: ['--enable-gpu', '--use-angle=metal', '--ignore-gpu-blocklist'] });
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
const p = await ctx.newPage();
const cdp = await ctx.newCDPSession(p);
await p.goto(`${BASE}/day/3/?v=frames`);
await p.locator('#boot').waitFor({ state: 'detached' });
await p.waitForSelector('.mk-stop', { timeout: 30000 }); await p.waitForTimeout(4000);
await cdp.send('Emulation.setCPUThrottlingRate', { rate: RATE });
const rec = () => p.evaluate(() => { window.__f = []; window.__lt = 0; let last = performance.now(); window.__on = true; const f = (t) => { window.__f.push(t - last); last = t; if (window.__on) requestAnimationFrame(f); }; requestAnimationFrame(f); new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__lt += e.duration; }).observe({ type: 'longtask' }); });
const stop = () => p.evaluate(() => { window.__on = false; const f = window.__f.slice(1).sort((a, b) => a - b); const q = (x) => Math.round(f[Math.min(f.length - 1, Math.floor(x * f.length))]); return { frames: f.length, p50: q(0.5), p95: q(0.95), max: Math.round(f.at(-1) ?? 0), dropped: f.filter((x) => x > 25).length, longTasks: Math.round(window.__lt) }; });
const out = [];
async function run(label, act, ms) { await rec(); await act(); await p.waitForTimeout(ms); out.push({ label, ...(await stop()) }); await p.waitForTimeout(400); }
await run('ride playing (full)', async () => { const x = p.locator('.strip .play').first(); await x.scrollIntoViewIfNeeded(); await x.tap(); }, 5200);
await run('fly to another day', async () => { await p.evaluate(() => scrollTo(0, 0)); await p.locator('nav.days a[href="/day/4/"]').tap(); }, 2000);
await run('open a stop sheet', async () => p.locator('.stop .hit').nth(1).tap(), 700);
await run('close the sheet', async () => p.locator('button.close').tap(), 600);
await run('scroll the day', async () => { for (let i = 0; i < 10; i++) { await p.mouse.wheel(0, 260); await p.waitForTimeout(50); } }, 600);
await run('back to the trip map', async () => { await p.evaluate(() => scrollTo(0, 0)); await p.locator('.mark').tap(); }, 2000);
console.table(out);
await b.close();
