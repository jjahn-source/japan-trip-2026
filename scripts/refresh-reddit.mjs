import { writeFileSync } from "fs";

// Exact UA that last30days uses — Reddit allows residential IPs with this UA.
// GitHub Actions / cloud IPs are blocked by Reddit regardless of UA.
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

const SKIP_TITLE_PATTERNS = [
  /weekly.*discussion/i,
  /monthly.*meetup/i,
  /megathread/i,
  /weekly.*thread/i,
  /^\[mod\]/i,
];

// Reddit RSS/Atom — public, works from residential IPs with browser UA (same as last30days).
const res = await fetch("https://www.reddit.com/r/JapanTravel/hot.rss?limit=20", {
  headers: {
    "User-Agent": UA,
    "Accept": "application/atom+xml",
    "Accept-Language": "en-US,en;q=0.9",
  },
});

if (!res.ok) {
  console.error(`Reddit RSS returned ${res.status}`);
  process.exit(1);
}

const xml = await res.text();
const now = Date.now();

function age(isoDate) {
  const diff = Math.floor((now - new Date(isoDate).getTime()) / 1000);
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

// Parse Atom entries with regex — no xml dep needed for this predictable format
const entries = [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)].map((m) => m[1]);

const posts = entries
  .map((e) => {
    const title = e.match(/<title[^>]*>([\s\S]*?)<\/title>/)?.[1]
      ?.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").trim() ?? "";
    const url = e.match(/<link[^>]+href="([^"]+)"/)?.[1] ?? "";
    const updated = e.match(/<updated>([\s\S]*?)<\/updated>/)?.[1]?.trim() ?? "";
    return { title, url, flair: null, age: updated ? age(updated) : "", score: 0 };
  })
  .filter((p) => p.title && p.url && !SKIP_TITLE_PATTERNS.some((rx) => rx.test(p.title)))
  .slice(0, 5);

writeFileSync("public/reddit-alerts.json", JSON.stringify({ posts, fetchedAt: new Date().toISOString() }, null, 2));
console.log(`Wrote ${posts.length} posts to public/reddit-alerts.json`);
