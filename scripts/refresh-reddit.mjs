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

// Helper to decode HTML entities and strip tags/boilerplates
function extractSnippet(rawHtml, maxLength = 400) {
  if (!rawHtml) return "";

  // Decode basic HTML entities first
  let text = rawHtml
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#x2F;/g, "/");

  // Remove the boilerplate layout table at the beginning of Reddit entries
  text = text.replace(/<table[^>]*>[\s\S]*?<\/table>/gi, "");

  // Remove HTML comments
  text = text.replace(/<!--[\s\S]*?-->/g, "");

  // Strip all remaining HTML tags
  text = text.replace(/<[^>]*>/g, " ");

  // Normalize multiple spaces/newlines into a single space
  text = text.replace(/\s+/g, " ").trim();

  // Truncate to the requested length
  if (text.length > maxLength) {
    text = text.substring(0, maxLength) + "...";
  }

  return text;
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// ── Step 1: Fetch Reddit RSS ─────────────────────────────────────────
const subreddits = ["JapanTravel", "JapanTravelTips"];
const allEntries = [];

for (const sub of subreddits) {
  const url = `https://www.reddit.com/r/${sub}/hot.rss?limit=25`;
  console.log(`Fetching r/${sub}...`);
  let fetched = false;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(url, {
        headers: {
          "User-Agent": UA,
          Accept: "application/atom+xml",
          "Accept-Language": "en-US,en;q=0.9",
        },
        signal: AbortSignal.timeout(15000),
      });

      if (res.status === 429) {
        const retryAfter = parseInt(res.headers.get("retry-after") || "10", 10);
        const wait = retryAfter * 1000 || attempt * 5000;
        console.warn(`Reddit rate-limited r/${sub} (attempt ${attempt}) — waiting ${wait / 1000}s`);
        await sleep(wait);
        continue;
      }

      if (!res.ok) {
        console.error(`Reddit RSS for r/${sub} returned ${res.status}`);
        break;
      }

      const xml = await res.text();
      const entries = [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)].map((m) => m[1]);
      for (const entryXml of entries) {
        allEntries.push({ entryXml, subreddit: sub });
      }
      console.log(`Fetched ${entries.length} posts from r/${sub}`);
      fetched = true;
      break;
    } catch (err) {
      console.error(`Failed to fetch r/${sub} (attempt ${attempt}):`, err.message);
    }
  }

  if (!fetched) {
    console.warn(`Skipping r/${sub} after failed attempts`);
  }

  // Delay between subreddit fetches — Reddit rate-limits CI IPs aggressively
  await sleep(4000);
}

if (allEntries.length === 0) {
  console.error("Failed to fetch any posts from Reddit");
  process.exit(1);
}

const now = Date.now();

function age(isoDate) {
  const diff = Math.floor((now - new Date(isoDate).getTime()) / 1000);
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

// ── Step 2: Parse entries ────────────────────────────────────────────
const allPosts = allEntries
  .map(({ entryXml, subreddit }) => {
    const title =
      entryXml
        .match(/<title[^>]*>([\s\S]*?)<\/title>/)?.[1]
        ?.replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .trim() ?? "";
    const url = entryXml.match(/<link[^>]+href="([^"]+)"/)?.[1] ?? "";
    const updated = entryXml.match(/<updated>([\s\S]*?)<\/updated>/)?.[1]?.trim() ?? "";
    const rawContent = entryXml.match(/<content[^>]*>([\s\S]*?)<\/content>/)?.[1] ?? "";
    const snippet = extractSnippet(rawContent, 400);

    return {
      title,
      url,
      subreddit,
      flair: null,
      age: updated ? age(updated) : "",
      score: 0,
      snippet,
    };
  })
  .filter((p) => p.title && p.url && !SKIP_TITLE_PATTERNS.some((rx) => rx.test(p.title)));

console.log(`Parsed ${allPosts.length} Reddit posts from both subreddits`);

// ── Step 3: AI curation via NVIDIA NIM GLM 5.1 ──────────────────────
let curatedPosts = allPosts.slice(0, 5); // fallback: first 5 unfiltered
let curatedBy = null;

if (NIM_API_KEY && allPosts.length > 0) {
  try {
    const numbered = allPosts
      .map((p, i) => `${i + 1}. [r/${p.subreddit}] ${p.title}\n   Snippet: ${p.snippet || "(No body text)"}\n`)
      .join("\n");

    const body = {
      model: NIM_MODEL,
      messages: [
        {
          role: "system",
          content: `You curate Reddit posts for a group trip to Japan, Dec 14–29, 2026 (Tokyo → Kyoto → Osaka).

Given a numbered list of posts with titles and body snippets, filter and select the ones relevant to this specific winter trip.

CRITICAL DATE FILTERING RULE:
- The trip is from Dec 14 to Dec 29, 2026 (Winter).
- You MUST reject posts that mention or are about travel in other months/seasons (e.g. spring, summer, autumn, June, July, August, September, October, cherry blossoms, heatwaves).
- Be extremely strict: even if a title sounds general (e.g., "Itinerary review"), if the body snippet reveals a travel plan in another month (like June or July), you MUST reject it.
- Prioritize posts that are explicitly about December, winter, Christmas/New Year, winter illuminations, cold-weather packing, or winter tactics.
- Allow general non-seasonal advice posts (e.g., about eSIMs, JR Pass, tax-free shopping, luggage forwarding, customs/VJW, money/SUICA) as secondary choices. When selecting a general advice post, identify its specific topic in the "matchedDates" field.

Return a JSON object with this exact structure:
{
  "selected": [
    {
      "index": 1,
      "subreddit": "JapanTravel",
      "matchedDates": "December 2026" or "Winter" or "General Advice (eSIM)" or "General Advice (JR Pass)" or "None (General)",
      "why": "one-line reason why this post is relevant to the trip or is useful general advice"
    }
  ]
}

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
      signal: AbortSignal.timeout(90000),
    });

    if (nimRes.ok) {
      const nimJson = await nimRes.json();
      const content = nimJson.choices?.[0]?.message?.content ?? "";

      // Extract JSON from response robustly
      const firstCurly = content.indexOf("{");
      const lastCurly = content.lastIndexOf("}");
      if (firstCurly !== -1 && lastCurly !== -1) {
        const jsonStr = content.substring(firstCurly, lastCurly + 1);
        const parsed = JSON.parse(jsonStr);

        if (Array.isArray(parsed.selected)) {
          curatedPosts = parsed.selected
            .filter((s) => s.index >= 1 && s.index <= allPosts.length)
            .slice(0, 5)
            .map((s) => {
              const originalPost = allPosts[s.index - 1];
              return {
                title: originalPost.title,
                url: originalPost.url,
                subreddit: originalPost.subreddit,
                flair: originalPost.flair,
                age: originalPost.age,
                score: originalPost.score,
                snippet: originalPost.snippet || null,
                matchedDates: s.matchedDates || null,
                relevance: s.why || null,
              };
            });
          curatedBy = "glm-5.1";
          console.log(`GLM 5.1 selected ${curatedPosts.length} relevant posts`);
        } else {
          console.log("GLM 5.1 returned invalid format — using unfiltered fallback");
        }
      } else {
        console.log("GLM 5.1 response contained no JSON object — using unfiltered fallback");
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
