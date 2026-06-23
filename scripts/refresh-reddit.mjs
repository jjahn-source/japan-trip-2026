import { writeFileSync, existsSync, readFileSync } from "fs";

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

let NIM_API_KEY = process.env.NVIDIA_NIM_API_KEY;
if (!NIM_API_KEY && existsSync(".env.local")) {
  const envContent = readFileSync(".env.local", "utf-8");
  const match = envContent.match(/^NVIDIA_NIM_API_KEY=(.*)$/m);
  if (match) NIM_API_KEY = match[1].trim();
}

const NIM_BASE = "https://integrate.api.nvidia.com/v1/chat/completions";
const NIM_MODEL = "z-ai/glm-5.1";

const SKIP_TITLE_PATTERNS = [
  /weekly.*discussion/i,
  /monthly.*meetup/i,
  /megathread/i,
  /weekly.*thread/i,
  /^\[mod\]/i,
];

// ── Step 1: Fetch Reddit RSS ─────────────────────────────────────────
const res = await fetch("https://www.reddit.com/r/JapanTravel/hot.rss?limit=20", {
  headers: {
    "User-Agent": UA,
    Accept: "application/atom+xml",
    "Accept-Language": "en-US,en;q=0.9",
  },
  signal: AbortSignal.timeout(15000),
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

// ── Step 2: Parse entries ────────────────────────────────────────────
const entries = [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)].map((m) => m[1]);

const allPosts = entries
  .map((e) => {
    const title =
      e
        .match(/<title[^>]*>([\s\S]*?)<\/title>/)?.[1]
        ?.replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .trim() ?? "";
    const url = e.match(/<link[^>]+href="([^"]+)"/)?.[1] ?? "";
    const updated = e.match(/<updated>([\s\S]*?)<\/updated>/)?.[1]?.trim() ?? "";
    return { title, url, flair: null, age: updated ? age(updated) : "", score: 0 };
  })
  .filter((p) => p.title && p.url && !SKIP_TITLE_PATTERNS.some((rx) => rx.test(p.title)));

console.log(`Parsed ${allPosts.length} Reddit posts`);

// ── Step 3: AI curation via NVIDIA NIM GLM 5.1 ──────────────────────
let curatedPosts = allPosts.slice(0, 5); // fallback: first 5 unfiltered
let curatedBy = null;

if (NIM_API_KEY && allPosts.length > 0) {
  try {
    const numbered = allPosts.map((p, i) => `${i + 1}. ${p.title}`).join("\n");

    const body = {
      model: NIM_MODEL,
      messages: [
        {
          role: "system",
          content: `You curate Reddit r/JapanTravel posts for a group trip to Japan, Dec 14–29, 2026 (Tokyo → Kyoto → Osaka).

Given a numbered list of post titles, return ONLY the ones relevant to:
- Winter travel / December weather / cold-weather packing
- Tokyo, Kyoto, or Osaka tips (food, nightlife, transport, attractions)
- General Japan travel advice (booking, etiquette, money, JR pass, etc.)
- Holiday/New Year season tips (illuminations, markets, crowds)

EXCLUDE posts about:
- Trips in clearly different months/seasons (spring cherry blossoms, summer, etc.)
- Regions the crew won't visit (Hokkaido-only, Okinawa-only, rural-only itineraries)
- Meta/mod posts, weekly threads

Return a JSON object: { "selected": [ { "index": 1, "why": "one-line reason" }, ... ] }
Select at most 5 posts. If none are relevant, return { "selected": [] }.`,
        },
        { role: "user", content: numbered },
      ],
      temperature: 0.3,
      max_tokens: 512,
    };

    const nimRes = await fetch(NIM_BASE, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${NIM_API_KEY}`,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(30000),
    });

    if (nimRes.ok) {
      const nimJson = await nimRes.json();
      const content = nimJson.choices?.[0]?.message?.content ?? "";

      // Extract JSON from response (may be wrapped in markdown code fence)
      const jsonStr = content.replace(/```json?\s*/g, "").replace(/```/g, "").trim();
      const parsed = JSON.parse(jsonStr);

      if (Array.isArray(parsed.selected) && parsed.selected.length > 0) {
        curatedPosts = parsed.selected
          .filter((s) => s.index >= 1 && s.index <= allPosts.length)
          .slice(0, 5)
          .map((s) => ({
            ...allPosts[s.index - 1],
            relevance: s.why || null,
          }));
        curatedBy = "glm-5.1";
        console.log(`GLM 5.1 selected ${curatedPosts.length} relevant posts`);
      } else {
        console.log("GLM 5.1 found no relevant posts — using unfiltered fallback");
      }
    } else {
      console.error(`NIM API returned ${nimRes.status}: ${await nimRes.text()}`);
    }
  } catch (err) {
    console.error("NIM curation failed:", err.message);
  }
}

// ── Step 4: Write output ─────────────────────────────────────────────
const output = {
  posts: curatedPosts,
  fetchedAt: new Date().toISOString(),
  ...(curatedBy && { curatedBy }),
};

writeFileSync("public/reddit-alerts.json", JSON.stringify(output, null, 2));
console.log(`Wrote ${curatedPosts.length} posts to public/reddit-alerts.json${curatedBy ? ` (curated by ${curatedBy})` : ""}`);
