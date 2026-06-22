import { writeFileSync } from "fs";

const SKIP_FLAIRS = ["Weekly Discussion", "Megathread", "Weekly Thread"];

const res = await fetch("https://www.reddit.com/r/JapanTravel/hot.json?limit=15&raw_json=1", {
  headers: { "User-Agent": "japan-trip-app/1.0 (github.com/jjahn-source/japan-trip-2026)" },
});

if (!res.ok) {
  console.error(`Reddit returned ${res.status}`);
  process.exit(1);
}

const json = await res.json();
const now = Math.floor(Date.now() / 1000);

function age(utc) {
  const diff = now - utc;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

const posts = (json?.data?.children ?? [])
  .map((c) => c.data)
  .filter((d) => !d.stickied && !SKIP_FLAIRS.includes(d.link_flair_text ?? ""))
  .slice(0, 5)
  .map((d) => ({
    title: d.title,
    url: `https://reddit.com${d.permalink}`,
    flair: d.link_flair_text ?? null,
    age: age(d.created_utc),
    score: d.score,
  }));

writeFileSync("public/reddit-alerts.json", JSON.stringify({ posts, fetchedAt: new Date().toISOString() }, null, 2));
console.log(`Wrote ${posts.length} posts to public/reddit-alerts.json`);
