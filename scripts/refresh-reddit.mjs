import { writeFileSync } from "fs";

const CLIENT_ID = process.env.REDDIT_CLIENT_ID;
const CLIENT_SECRET = process.env.REDDIT_CLIENT_SECRET;

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error("Missing REDDIT_CLIENT_ID or REDDIT_CLIENT_SECRET — skipping refresh");
  process.exit(0); // exit 0 so workflow doesn't fail
}

const SKIP_FLAIRS = ["Weekly Discussion", "Megathread", "Weekly Thread"];
const UA = "japan-trip-app/1.0 (github.com/jjahn-source/japan-trip-2026)";

// Reddit requires OAuth even for public read-only access
const auth = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64");
const tokenRes = await fetch("https://www.reddit.com/api/v1/access_token", {
  method: "POST",
  headers: {
    Authorization: `Basic ${auth}`,
    "User-Agent": UA,
    "Content-Type": "application/x-www-form-urlencoded",
  },
  body: "grant_type=client_credentials",
});

if (!tokenRes.ok) {
  console.error(`Token fetch failed: ${tokenRes.status}`);
  process.exit(1);
}

const { access_token } = await tokenRes.json();

const res = await fetch("https://oauth.reddit.com/r/JapanTravel/hot?limit=15&raw_json=1", {
  headers: {
    Authorization: `Bearer ${access_token}`,
    "User-Agent": UA,
  },
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
