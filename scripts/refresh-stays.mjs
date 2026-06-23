/**
 * Refresh Airbnb stay prices via headless Playwright.
 * Airbnb prices are rendered client-side; raw HTML always returns null for price fields.
 * Writes to public/stays-prices.json for the UI to overlay on top of stays.ts baselines.
 */

import { writeFileSync } from "fs";
import { chromium } from "../node_modules/playwright/index.mjs";

const LISTINGS = [
  // Tokyo Dec 15–21 (6 nights)
  { id: "11981272",             url: "https://www.airbnb.com/rooms/11981272?check_in=2026-12-15&check_out=2026-12-21&adults=8",             nights: 6 },
  { id: "1536111087299633272",  url: "https://www.airbnb.com/rooms/1536111087299633272?check_in=2026-12-15&check_out=2026-12-21&adults=8",  nights: 6 },
  { id: "1281683561054021099",  url: "https://www.airbnb.com/rooms/1281683561054021099?check_in=2026-12-15&check_out=2026-12-21&adults=8",  nights: 6 },
  { id: "989371479641705339",   url: "https://www.airbnb.com/rooms/989371479641705339?check_in=2026-12-15&check_out=2026-12-21&adults=8",   nights: 6 },
  { id: "835920303549871358",   url: "https://www.airbnb.com/rooms/835920303549871358?check_in=2026-12-15&check_out=2026-12-21&adults=8",   nights: 6 },
  { id: "1097341728294996082",  url: "https://www.airbnb.com/rooms/1097341728294996082?check_in=2026-12-15&check_out=2026-12-21&adults=8",  nights: 6 },
  // Kyoto Dec 21–24 (3 nights)
  { id: "40359294",             url: "https://www.airbnb.com/rooms/40359294?check_in=2026-12-21&check_out=2026-12-24&adults=8",             nights: 3 },
  { id: "1573827469869098967",  url: "https://www.airbnb.com/rooms/1573827469869098967?check_in=2026-12-21&check_out=2026-12-24&adults=8",  nights: 3 },
  { id: "1675937752566323038",  url: "https://www.airbnb.com/rooms/1675937752566323038?check_in=2026-12-21&check_out=2026-12-24&adults=8",  nights: 3 },
  { id: "1488154226865992298",  url: "https://www.airbnb.com/rooms/1488154226865992298?check_in=2026-12-21&check_out=2026-12-24&adults=8",  nights: 3 },
  { id: "1014148265747662533",  url: "https://www.airbnb.com/rooms/1014148265747662533?check_in=2026-12-21&check_out=2026-12-24&adults=8",  nights: 3 },
  { id: "10818914",             url: "https://www.airbnb.com/rooms/10818914?check_in=2026-12-21&check_out=2026-12-24&adults=8",             nights: 3 },
  // Osaka Dec 24–29 (5 nights)
  { id: "1334423068782122936",  url: "https://www.airbnb.com/rooms/1334423068782122936?check_in=2026-12-24&check_out=2026-12-29&adults=8",  nights: 5 },
  { id: "1473843697378876893",  url: "https://www.airbnb.com/rooms/1473843697378876893?check_in=2026-12-24&check_out=2026-12-29&adults=8",  nights: 5 },
  { id: "1461605325831572226",  url: "https://www.airbnb.com/rooms/1461605325831572226?check_in=2026-12-24&check_out=2026-12-29&adults=8",  nights: 5 },
  { id: "1142002948356768781",  url: "https://www.airbnb.com/rooms/1142002948356768781?check_in=2026-12-24&check_out=2026-12-29&adults=8",  nights: 5 },
  { id: "34764282",             url: "https://www.airbnb.com/rooms/34764282?check_in=2026-12-24&check_out=2026-12-29&adults=8",             nights: 5 },
  { id: "1289483923807916387",  url: "https://www.airbnb.com/rooms/1289483923807916387?check_in=2026-12-24&check_out=2026-12-29&adults=8",  nights: 5 },
];

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

/** Extract total price from a rendered Airbnb listing page.
 *  Returns { totalUSD, raw } on success, { unavailable: true } if the dates are blocked,
 *  or null if we couldn't determine either. */
async function extractPrice(page, listing) {
  await page.route("**/*.{png,jpg,jpeg,gif,webp,svg,woff,woff2,ttf,mp4}", (r) => r.abort());
  await page.route("**/analytics**", (r) => r.abort());
  await page.route("**/doubleclick**", (r) => r.abort());

  await page.goto(listing.url, { waitUntil: "domcontentloaded", timeout: 30000 });

  // Wait for book-it widget to hydrate (price is inside it)
  try {
    await page.waitForSelector('[data-section-id="BOOK_IT_SIDEBAR"]', { timeout: 10000 });
  } catch {
    // Some listings show inline booking; continue and try text extraction anyway
  }

  // Poll until the book-it widget is no longer "loading" (max 15s)
  const deadline = Date.now() + 15000;
  while (Date.now() < deadline) {
    const bookItText = await page.evaluate(() => {
      const el = document.querySelector('[data-section-id="BOOK_IT_SIDEBAR"]');
      return el?.innerText ?? "";
    });

    if (/not available|unavailable/i.test(bookItText)) {
      return { unavailable: true };
    }

    // Check for price in the sidebar text already
    const priceInSidebar = bookItText.match(/\$([\d,]+) for \d+ night/);
    if (priceInSidebar) {
      const totalUSD = parseInt(priceInSidebar[1].replace(/,/g, ""), 10);
      return { totalUSD, raw: priceInSidebar[0] };
    }

    // Still loading — wait and retry
    if (/\bloading\b/i.test(bookItText) || bookItText.trim() === "") {
      await sleep(1500);
      continue;
    }

    // Sidebar has content but no price — might be a different layout
    break;
  }

  // Fallback: scan all text nodes in the body for the "for N nights" pattern
  const nightsTexts = await page.evaluate((n) => {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const results = [];
    let node;
    while ((node = walker.nextNode())) {
      const t = node.textContent?.trim();
      if (t && new RegExp(`\\$[\\d,]+ for ${n} night`).test(t)) results.push(t);
    }
    return results;
  }, listing.nights);

  // Last fallback: any standalone dollar amount (e.g. total shown outside sidebar)
  const dollarTexts = await page.evaluate(() => {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const results = [];
    let node;
    while ((node = walker.nextNode())) {
      const t = node.textContent?.trim();
      if (t && /^\$[\d,]+$/.test(t)) results.push(t);
    }
    return results;
  });

  const sourceText = nightsTexts[0] ?? dollarTexts[0];
  if (!sourceText) return null;

  const match = sourceText.match(/\$([\d,]+)/);
  if (!match) return null;

  const totalUSD = parseInt(match[1].replace(/,/g, ""), 10);
  return { totalUSD, raw: sourceText };
}

async function main() {
  console.log(`Fetching live Airbnb prices for ${LISTINGS.length} listings via Playwright...`);
  console.log("This takes ~3 minutes (18 pages × ~10s each + rate-limiting).\n");

  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
    locale: "en-US",
    timezoneId: "America/New_York",
  });

  const prices = {};
  let successCount = 0;

  for (let i = 0; i < LISTINGS.length; i++) {
    const listing = LISTINGS[i];
    const page = await ctx.newPage();

    process.stdout.write(`[${i + 1}/${LISTINGS.length}] ${listing.id} ... `);
    try {
      const result = await extractPrice(page, listing);
      if (result?.unavailable) {
        prices[listing.id] = { unavailable: true };
        console.log("UNAVAILABLE for these dates");
        successCount++;
      } else if (result?.totalUSD) {
        prices[listing.id] = result;
        console.log(`$${result.totalUSD.toLocaleString()} ✓`);
        successCount++;
      } else {
        console.log("no price found");
      }
    } catch (err) {
      console.log(`ERROR: ${err.message?.slice(0, 60)}`);
    } finally {
      await page.close();
    }

    // Rate limit: 3–6s between requests to avoid bot challenges
    if (i < LISTINGS.length - 1) await sleep(3000 + Math.floor(Math.random() * 3000));
  }

  await browser.close();

  if (successCount === 0) {
    console.error("\nNo prices extracted — Airbnb may be blocking the bot. Not writing output.");
    process.exit(1);
  }

  const output = { prices, fetchedAt: new Date().toISOString(), successCount, total: LISTINGS.length };
  writeFileSync("public/stays-prices.json", JSON.stringify(output, null, 2));
  console.log(
    `\nWrote ${successCount}/${LISTINGS.length} prices to public/stays-prices.json`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
