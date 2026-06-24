/**
 * refresh-stays-search.mjs
 *
 * Scrapes the Airbnb search results page for each leg (Tokyo/Kyoto/Osaka),
 * scores listings by price/rating/reviews, keeps the top 6 per leg,
 * compares against the previous run, and writes public/stays-live.json.
 *
 * Scoring formula (lower is better):
 *   score = price / (rating^2 * log10(reviews + 1) * qualityBonus)
 *   qualityBonus: 1.15 if guestFav or superhost, 1.0 otherwise
 *
 * Hard filters (matching stays.ts requirements):
 *   - entire home (enforced via search URL params)
 *   - 3+ bedrooms
 *   - 2+ bathrooms
 *   - sleeps 8 (beds >= 8 preferred; beds >= 6 allowed since futons fill gaps)
 *
 * Tokyo uses two search URLs (Tokyo--Japan + Toshima--Tokyo--Japan) because
 * Airbnb's geo-index splits some Ikebukuro/Toshima-ku listings out of the
 * main Tokyo result set. Results are merged and deduped before scoring.
 *
 * A Shinjuku-area keyword filter is applied to Tokyo results so only listings
 * near Shinjuku, Ikebukuro, Shibuya, or adjacent neighbourhoods are kept.
 */

import { writeFileSync, readFileSync, existsSync } from "fs";
import { chromium } from "../node_modules/playwright/index.mjs";

const GROUP = 8;

// Keywords that indicate a Tokyo listing is close enough to Shinjuku.
// Matched case-insensitively against the listing name.
const SHINJUKU_AREA_KEYWORDS = [
  "shinjuku", "shin-okubo", "shin okubo", "shinokubo",
  "ikebukuro", "toshima", "shibuya", "harajuku", "yoyogi",
  "nakamuraya", "kabukicho", "okubo",
  "1 stop", "2 stop", "3 stop", "one stop", "two stop", "three stop",
  "10 min", "15 min", "5 min", "walking distance",
];

const LEGS = [
  {
    id: "tokyo",
    city: "Tokyo",
    cityJp: "東京",
    dates: "Dec 15–21",
    nights: 6,
    emoji: "🌃",
    startISO: "2026-12-15",
    endISO: "2026-12-21",
    // Two searches: broad Tokyo + Toshima-ku (Ikebukuro area listings split out by Airbnb's geo-index)
    searchUrls: [
      "https://www.airbnb.com/s/Tokyo--Japan/homes" +
        "?checkin=2026-12-15&checkout=2026-12-21&adults=8" +
        "&room_types[]=Entire+home%2Fapt&min_bedrooms=3&min_bathrooms=2",
      "https://www.airbnb.com/s/Toshima--Tokyo--Japan/homes" +
        "?checkin=2026-12-15&checkout=2026-12-21&adults=8" +
        "&room_types[]=Entire+home%2Fapt&min_bedrooms=3&min_bathrooms=2",
    ],
    // Keep only listings whose name mentions Shinjuku-area neighbourhoods or proximity
    areaKeywords: SHINJUKU_AREA_KEYWORDS,
  },
  {
    id: "kyoto",
    city: "Kyoto",
    cityJp: "京都",
    dates: "Dec 21–24",
    nights: 3,
    emoji: "⛩️",
    startISO: "2026-12-21",
    endISO: "2026-12-24",
    searchUrls: [
      "https://www.airbnb.com/s/Kyoto--Japan/homes" +
        "?checkin=2026-12-21&checkout=2026-12-24&adults=8" +
        "&room_types[]=Entire+home%2Fapt&min_bedrooms=3&min_bathrooms=2",
    ],
  },
  {
    id: "osaka",
    city: "Osaka",
    cityJp: "大阪",
    dates: "Dec 24–29",
    nights: 5,
    emoji: "🐙",
    startISO: "2026-12-24",
    endISO: "2026-12-29",
    searchUrls: [
      "https://www.airbnb.com/s/Namba--Osaka--Japan/homes" +
        "?checkin=2026-12-24&checkout=2026-12-29&adults=8" +
        "&room_types[]=Entire+home%2Fapt&min_bedrooms=3&min_bathrooms=2",
    ],
  },
];

const TOP_N = 12;
const OUT_PATH = "public/stays-live.json";

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

/** Score a listing — lower is better. Returns Infinity if it fails hard filters. */
function score(listing) {
  if (!listing.totalUSD) return Infinity;
  if ((listing.bedrooms ?? 0) < 3) return Infinity;
  if ((listing.baths ?? 0) < 2) return Infinity;
  // Must sleep at least 6 (some houses have futons not counted as beds)
  if (listing.beds !== null && listing.beds < 6) return Infinity;

  const rating = listing.rating ?? 4.5; // treat unrated new places conservatively
  const reviews = listing.reviews ?? 0;
  const qualityBonus =
    listing.guestFav || listing.superhost ? 1.15 : 1.0;

  // log10(1) = 0, so new places with 0 reviews get heavily penalised
  const reviewWeight = Math.log10(reviews + 2); // +2 so log10 >= ~0.3
  const denominator = Math.pow(rating, 2) * reviewWeight * qualityBonus;

  return listing.totalUSD / denominator;
}

/** Parse all listings from one Airbnb search page's raw HTML. */
function parseSearchHtml(html, nights) {
  const results = [];
  const MARKER = 'itemtype="http://schema.org/ListItem"';
  let pos = 0;

  while (true) {
    const start = html.indexOf(MARKER, pos);
    if (start === -1) break;
    const nextStart = html.indexOf(MARKER, start + 1);
    const blockEnd = nextStart === -1 ? Math.min(html.length, start + 8000) : nextStart;
    const block = html.slice(start, blockEnd);
    pos = start + 1;

    // Listing ID from itemprop="url"
    const urlMatch = block.match(/itemprop="url"[^>]*content="\/rooms\/(\d+)/);
    const id = urlMatch?.[1];
    if (!id) continue;

    // Total price "for N nights"
    const priceMatch = block.match(/\$([\d,]+) for \d+ nights?/);
    if (!priceMatch) continue; // skip if no total price visible
    const totalUSD = parseInt(priceMatch[1].replace(/,/g, ""), 10);

    // Rating + reviews from aria-label
    const ratingAriaMatch = block.match(
      /([\d.]+) out of 5 average rating,\s*(\d+) reviews/
    );
    const rating = ratingAriaMatch ? parseFloat(ratingAriaMatch[1]) : null;
    const reviews = ratingAriaMatch ? parseInt(ratingAriaMatch[2], 10) : null;

    // Bedrooms / beds / baths from span text
    const bedroomsMatch = block.match(/(\d+) bedrooms?\b/);
    const bedsMatch = block.match(/(\d+) beds?\b/);
    const bathsMatch = block.match(/([\d.]+) baths?\b/);

    const guestFav = /guest favorite/i.test(block);
    const superhost = /superhost/i.test(block);

    // Name from listing-card-name or itemprop="name"
    const nameMatch =
      block.match(/data-testid="listing-card-name"[^>]*>([^<]+)</) ||
      block.match(/itemprop="name"\s+content="([^"]+)"/);
    const name = nameMatch ? nameMatch[1].trim() : `Listing ${id}`;

    // Extract cover image URL
    const imgMatch = block.match(/https:\/\/a0\.muscache\.com\/im\/pictures\/[^"'\s\\]+/);
    // Remove query params like ?im_w=720 for a cleaner/larger URL if we want, but im_w=720 is a good size
    const imgUrl = imgMatch ? imgMatch[0].replace(/&amp;/g, '&') : null;

    results.push({
      id,
      name,
      totalUSD,
      nights,
      bedrooms: bedroomsMatch ? parseInt(bedroomsMatch[1], 10) : null,
      beds: bedsMatch ? parseInt(bedsMatch[1], 10) : null,
      baths: bathsMatch ? parseFloat(bathsMatch[1]) : null,
      rating,
      reviews,
      guestFav,
      superhost,
      imgUrl,
      url: `https://www.airbnb.com/rooms/${id}?check_in=CHECKIN&check_out=CHECKOUT&adults=8`,
    });
  }

  // Dedupe by id (cards appear in list + map sections)
  const seen = new Set();
  return results.filter((r) => {
    if (seen.has(r.id)) return false;
    seen.add(r.id);
    return true;
  });
}

/** Fetch one search page, wait for cards, return raw HTML. */
async function fetchSearchPage(ctx, url) {
  const page = await ctx.newPage();
  await page.route("**/*.{png,jpg,jpeg,gif,webp,svg,woff,woff2,ttf,mp4}", (r) => r.abort());
  await page.route("**/analytics**", (r) => r.abort());
  await page.route("**/doubleclick**", (r) => r.abort());

  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });

  // Wait for shimmer placeholders to disappear = cards have loaded
  try {
    await page.waitForSelector('[data-testid="shimmer-container"]', {
      state: "detached",
      timeout: 15000,
    });
  } catch {
    // Some runs skip shimmer entirely
  }
  await sleep(2000);

  const html = await page.content();
  await page.close();
  return html;
}

/** Compare current top picks to previous run, build changelog. */
function buildChangelog(legId, current, previous) {
  if (!previous) return [];
  const prevById = Object.fromEntries(previous.map((l) => [l.id, l]));
  const currById = Object.fromEntries(current.map((l) => [l.id, l]));

  const changes = [];

  // New listings that weren't in previous top 6
  for (const l of current) {
    if (!prevById[l.id]) {
      changes.push({ type: "new", id: l.id, name: l.name, totalUSD: l.totalUSD });
    }
  }

  // Dropped listings
  for (const l of previous) {
    if (!currById[l.id]) {
      changes.push({ type: "dropped", id: l.id, name: l.name, totalUSD: l.totalUSD });
    }
  }

  // Price changes on listings that stayed
  for (const l of current) {
    const prev = prevById[l.id];
    if (prev && prev.totalUSD && l.totalUSD) {
      const delta = l.totalUSD - prev.totalUSD;
      const pct = Math.round((delta / prev.totalUSD) * 100);
      if (Math.abs(delta) >= 30) {
        changes.push({
          type: delta < 0 ? "price_drop" : "price_rise",
          id: l.id,
          name: l.name,
          totalUSD: l.totalUSD,
          prevUSD: prev.totalUSD,
          delta,
          pct,
        });
      }
    }
  }

  return changes;
}

async function main() {
  console.log("Launching Airbnb stay search refresh...\n");

  // Load previous output for changelog
  let prevData = null;
  if (existsSync(OUT_PATH)) {
    try {
      prevData = JSON.parse(readFileSync(OUT_PATH, "utf8"));
    } catch {}
  }

  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " +
      "(KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
    locale: "en-US",
    timezoneId: "America/New_York",
  });

  const legs = [];
  let totalNew = 0;
  let totalDropped = 0;

  for (let i = 0; i < LEGS.length; i++) {
    const leg = LEGS[i];
    console.log(`[${i + 1}/3] Searching ${leg.city} (${leg.dates})...`);

    // Fetch all search URLs for this leg, merge, dedupe by id
    const allListings = [];
    let anyFetchSucceeded = false;
    for (let u = 0; u < leg.searchUrls.length; u++) {
      const url = leg.searchUrls[u];
      const label = url.match(/\/s\/([^/]+)\//)?.[1] ?? url;
      try {
        const html = await fetchSearchPage(ctx, url);
        const parsed = parseSearchHtml(html, leg.nights);
        console.log(`  [${u + 1}/${leg.searchUrls.length}] ${label}: ${parsed.length} listings`);
        if (parsed.length > 0) anyFetchSucceeded = true;
        allListings.push(...parsed);
      } catch (err) {
        console.log(`  ERROR fetching ${label}: ${err.message?.slice(0, 80)}`);
      }
      if (u < leg.searchUrls.length - 1) await sleep(3000 + Math.floor(Math.random() * 2000));
    }

    // Dedupe by listing id (same listing can appear in multiple searches)
    const seenIds = new Set();
    const all = allListings.filter((l) => {
      if (seenIds.has(l.id)) return false;
      seenIds.add(l.id);
      return true;
    });
    console.log(`  Total unique listings with prices: ${all.length}`);

    if (!anyFetchSucceeded || all.length === 0) {
      console.warn(`  WARNING: 0 listings parsed for ${leg.city} — possible bot challenge page. Keeping previous data.`);
      const prevLeg = prevData?.legs?.find((l) => l.id === leg.id);
      if (prevLeg) {
        console.log(`  Preserved previous data for ${leg.city} (${prevLeg.options?.length ?? 0} listings)`);
        legs.push(prevLeg);
      }
      if (i < LEGS.length - 1) await sleep(4000);
      continue;
    }

    // Apply area keyword filter if defined (e.g. Shinjuku-area for Tokyo)
    let filtered = all;
    if (leg.areaKeywords?.length) {
      const kws = leg.areaKeywords;
      filtered = all.filter((l) => {
        const nameLower = l.name.toLowerCase();
        return kws.some((kw) => nameLower.includes(kw));
      });
      console.log(`  After Shinjuku-area keyword filter: ${filtered.length} listings`);
      if (filtered.length === 0) {
        console.warn(`  WARNING: keyword filter removed all listings — falling back to unfiltered set`);
        filtered = all;
      }
    }

    // Score and sort
    const scored = filtered
      .map((l) => ({ ...l, _score: score(l) }))
      .filter((l) => l._score < Infinity)
      .sort((a, b) => a._score - b._score);

    const top = scored.slice(0, TOP_N).map(({ _score, ...l }) => ({
      ...l,
      ppCost: Math.round(l.totalUSD / GROUP),
      // Inject correct check-in/out into URL
      url: `https://www.airbnb.com/rooms/${l.id}?check_in=${leg.startISO}&check_out=${leg.endISO}&adults=8`,
    }));

    // Changelog vs previous
    const prevLeg = prevData?.legs?.find((pl) => pl.id === leg.id);
    const changelog = buildChangelog(leg.id, top, prevLeg?.options ?? null);
    const newCount = changelog.filter((c) => c.type === "new").length;
    const droppedCount = changelog.filter((c) => c.type === "dropped").length;
    totalNew += newCount;
    totalDropped += droppedCount;

    changelog.forEach((c) => {
      if (c.type === "new") console.log(`  ✨ New: ${c.name} ($${c.totalUSD.toLocaleString()})`);
      if (c.type === "dropped") console.log(`  ❌ Dropped: ${c.name}`);
      if (c.type === "price_drop") console.log(`  📉 ${c.name}: $${c.prevUSD.toLocaleString()} → $${c.totalUSD.toLocaleString()} (${c.pct}%)`);
      if (c.type === "price_rise") console.log(`  📈 ${c.name}: $${c.prevUSD.toLocaleString()} → $${c.totalUSD.toLocaleString()} (+${c.pct}%)`);
    });

    // Top pick summary
    console.log(`  Top ${top.length} picks:`);
    top.forEach((l, idx) => {
      const badge = l.guestFav ? "⭐" : l.superhost ? "🏅" : "  ";
      const rating = l.rating ? `${l.rating}★(${l.reviews})` : "new";
      console.log(
        `    ${idx + 1}. ${badge} $${l.totalUSD.toLocaleString()} | ${rating} | ` +
        `${l.bedrooms}BR/${l.beds ?? "?"}beds/${l.baths}ba | ${l.name.slice(0, 50)}`
      );
    });

    legs.push({
      id: leg.id,
      city: leg.city,
      cityJp: leg.cityJp,
      dates: leg.dates,
      nights: leg.nights,
      emoji: leg.emoji,
      startISO: leg.startISO,
      endISO: leg.endISO,
      searchUrl: leg.searchUrls[0],
      options: top,
      changelog,
    });

    if (i < LEGS.length - 1) await sleep(4000 + Math.floor(Math.random() * 2000));
  }

  await browser.close();

  const output = {
    fetchedAt: new Date().toISOString(),
    totalNew,
    totalDropped,
    legs,
  };

  const legsWithOptions = legs.filter((l) => l.options?.length > 0);
  if (legsWithOptions.length === 0) {
    console.error("ERROR: All 3 legs have 0 options after scrape — refusing to overwrite stays-live.json. Keeping stale data.");
    process.exit(1);
  }

  writeFileSync(OUT_PATH, JSON.stringify(output, null, 2));
  console.log(`\nWrote ${legs.length} legs to ${OUT_PATH}`);
  console.log(`Summary: ${totalNew} new listings surfaced, ${totalDropped} dropped`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
