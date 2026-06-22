import { writeFileSync } from "fs";

const SKIP_FLAIRS = ["Weekly Discussion", "Megathread", "Weekly Thread"];
const UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36";

// Reddit RSS/Atom feed — public, no OAuth required
const res = await fetch("https://www.reddit.com/r/JapanTravel/hot/.rss?limit=15", {
  headers: { "User-Agent": UA },
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
    const title = e.match(/<title[^>]*>([\s\S]*?)<\/title>/)?.[1]?.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").trim() ?? "";
    const url = e.match(/<link[^>]+href="([^"]+)"/)?.[1] ?? "";
    const updated = e.match(/<updated>([\s\S]*?)<\/updated>/)?.[1]?.trim() ?? "";
    const flair = e.match(/<category[^>]+term="([^"]+)"/)?.[1] ?? null;
    return { title, url, flair: flair || null, age: updated ? age(updated) : "", score: 0 };
  })
  .filter((p) => p.title && !SKIP_FLAIRS.includes(p.flair ?? ""))
  .slice(0, 5);

writeFileSync("public/reddit-alerts.json", JSON.stringify({ posts, fetchedAt: new Date().toISOString() }, null, 2));
console.log(`Wrote ${posts.length} posts to public/reddit-alerts.json`);
