import { writeFileSync, readFileSync, existsSync, unlinkSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let NIM_API_KEY = process.env.NVIDIA_NIM_API_KEY;
if (!NIM_API_KEY && existsSync(".env.local")) {
  const envContent = readFileSync(".env.local", "utf-8");
  const match = envContent.match(/^NVIDIA_NIM_API_KEY=(.*)$/m);
  if (match) NIM_API_KEY = match[1].trim();
}

const NIM_BASE = "https://integrate.api.nvidia.com/v1/chat/completions";
const NIM_MODEL = "z-ai/glm-5.1";
const OUTPUT = "public/itinerary-optimizations.json";

if (!NIM_API_KEY) {
  console.log("No NVIDIA_NIM_API_KEY — skipping itinerary optimization generation");
  process.exit(0);
}

// ── Step 1: Load static itinerary DAYS ────────────────────────────────
console.log("Loading static itinerary days...");
let DAYS = [];
try {
  const module = await import("../src/data/itinerary.ts");
  DAYS = module.DAYS;
} catch (err) {
  console.error("Failed to dynamically import static itinerary:", err.message);
  process.exit(1);
}

// ── Step 2: Load travel intel ────────────────────────────────────────
let travelIntelData = null;
const travelIntelPath = join(__dirname, "../public/travel-intel.json");
if (existsSync(travelIntelPath)) {
  try {
    travelIntelData = JSON.parse(readFileSync(travelIntelPath, "utf-8"));
    console.log("Loaded travel intel data");
  } catch (err) {
    console.error("Failed to parse travel-intel.json:", err.message);
  }
}

// ── Step 4: Run last30days.py ────────────────────────────────────────
let last30DaysPath = "/Users/jjahn/.claude/plugins/marketplaces/last30days-skill/scripts/last30days.py";
if (process.env.LAST30DAYS_PATH) {
  last30DaysPath = process.env.LAST30DAYS_PATH;
}

const topic = "Tokyo Kyoto Osaka winter events crowd alerts transit delays";
let searchData = null;

if (existsSync(last30DaysPath)) {
  console.log(`Running last30days.py for topic: "${topic}"...`);
  try {
    const cmd = `python3 "${last30DaysPath}" "${topic}" --emit=json --quick`;
    const stdout = execSync(cmd, { encoding: "utf-8", maxBuffer: 10 * 1024 * 1024, timeout: 60000 });
    const firstCurly = stdout.indexOf("{");
    const lastCurly = stdout.lastIndexOf("}");
    if (firstCurly !== -1 && lastCurly !== -1) {
      searchData = JSON.parse(stdout.substring(firstCurly, lastCurly + 1));
      console.log("Loaded social media search findings");
    } else {
      console.error("Failed to parse last30days.py output as JSON");
    }
  } catch (err) {
    console.error("last30days.py execution failed:", err.message);
  }
} else {
  console.log(`last30days.py not found at ${last30DaysPath} — proceeding without search findings`);
}

// ── Step 5: Construct Prompt and Call GLM 5.1 ───────────────────────
const daysContext = DAYS.map((d) => ({
  date: d.date,
  city: d.city,
  title: d.title,
  activities: d.activities.map((a) => ({ time: a.time, title: a.title })),
  alts: d.alts || [],
}));

const systemPrompt = `You are a travel assistant optimizing a 16-day Japan trip (Dec 14–29, 2026, Tokyo → Kyoto → Osaka) for a group of 8 friends.
You are given:
1. Static itinerary days containing the planned activities and optional rain/energy alternatives (alts).
2. Travel intelligence (USD/JPY exchange rate and advisory risk).
3. Social/web search results from the last 30 days containing recent winter event announcements, crowd alerts (e.g. popular spot booking warnings, tickets sold out), or transit delays.

Use your knowledge of typical December weather in Tokyo, Kyoto, and Osaka (cold, dry, occasional rain) to generate weatherAlert fields where relevant (e.g. outdoor-heavy days, early December cold snaps, rain risk on day trips).

Your goal is to output a JSON object containing day-by-day optimizations and alerts, and a list of global tips.

CRITICAL INSTRUCTIONS:
- You must suggest swaps with alternatives ONLY if there's a reason (e.g. typical December rain risk for an outdoor-heavy day, or social alerts indicate that an activity will be closed/overcrowded).
- The suggested swap's originalActivity must exist in that day's activities.
- The suggestedAlt must be selected from that day's alts or general contingencies.
- Only suggest a swap if it is highly relevant. Do not force swaps.
- If December weather poses a real risk for a day's outdoor activities (e.g. Arashiyama bamboo grove in rain, outdoor markets), specify it in "weatherAlert".
- If social searches show crowd alerts or transit issues, specify them in "crowdAlert" or "transitAlert".
- Identify any newly discovered winter events or popups that coincide with the day's city/date in "newEvents" based on the search findings.
- Write 1-2 practical, bite-sized daily tips for the day in "tips".
- In "globalTips", include 2-3 general tips (e.g., commenting on the USD/JPY rate and how that affects spending/exchanging cash).

You MUST output a single JSON object with the following exact structure:
{
  "optimizations": {
    "YYYY-MM-DD": {
      "weatherAlert": "...",
      "crowdAlert": "...",
      "transitAlert": "...",
      "suggestedSwap": {
        "originalActivity": "...",
        "suggestedAlt": "...",
        "reason": "..."
      },
      "newEvents": [
        {
          "name": "...",
          "note": "...",
          "station": "..."
        }
      ],
      "tips": ["..."]
    }
  },
  "globalTips": ["..."]
}

Rule: If a day has no alerts, swaps, or new events, you can omit those optional fields or provide empty arrays/omit the day, but always ensure the output is valid, parsing-friendly JSON. Do not include any explanation or markdown wrappers other than the JSON itself.`;

const userContent = JSON.stringify({
  days: daysContext,
  travelIntel: travelIntelData ? { exchangeRate: travelIntelData.exchangeRate, advisory: travelIntelData.advisory } : null,
  searchFindings: searchData ? { summary: searchData.context_snippet_md, reddit: searchData.reddit?.slice(0, 10), x: searchData.x?.slice(0, 10), web: searchData.web?.slice(0, 10) } : null
});

console.log("Calling GLM 5.1 for itinerary optimizations...");
const body = {
  model: NIM_MODEL,
  messages: [
    { role: "system", content: systemPrompt },
    { role: "user", content: userContent }
  ],
  temperature: 0.3,
  max_tokens: 4096,
};

try {
  const res = await fetch(NIM_BASE, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${NIM_API_KEY}`,
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(120000),
  });

  if (!res.ok) {
    if (res.status === 401 || res.status === 403) {
      console.error(`FATAL: NVIDIA_NIM_API_KEY is expired or invalid (HTTP ${res.status}). Update the secret at GitHub > Settings > Secrets and variables > Actions.`);
    } else {
      console.error(`NIM API returned ${res.status}: ${await res.text()}`);
    }
    process.exit(1);
  }

  const json = await res.json();
  const rawText = json.choices?.[0]?.message?.content?.trim();
  if (!rawText) {
    console.error("Empty response from GLM 5.1");
    process.exit(1);
  }

  const firstCurly = rawText.indexOf("{");
  const lastCurly = rawText.lastIndexOf("}");
  if (firstCurly === -1 || lastCurly === -1) {
    console.error("GLM 5.1 response contained no JSON object");
    process.exit(1);
  }

  const jsonStr = rawText.substring(firstCurly, lastCurly + 1);
  const parsed = JSON.parse(jsonStr);

  const coveredDays = Object.keys(parsed.optimizations || {}).length;
  const expectedDays = DAYS.length;
  if (coveredDays < expectedDays * 0.75) {
    console.warn(`WARNING: GLM only covered ${coveredDays}/${expectedDays} days — output may be truncated`);
  }
  const daysWithOnlyTips = Object.values(parsed.optimizations || {}).filter(
    (v) => Object.keys(v).every((k) => k === "tips")
  ).length;
  if (daysWithOnlyTips > 0) {
    console.warn(`WARNING: ${daysWithOnlyTips} days have only tips (no alerts/swaps/events)`);
  }

  const finalOutput = {
    ...parsed,
    generatedAt: new Date().toISOString()
  };

  writeFileSync(OUTPUT, JSON.stringify(finalOutput, null, 2));
  console.log(`Wrote itinerary optimizations to ${OUTPUT} (${coveredDays}/${expectedDays} days covered)`);
} catch (err) {
  console.error("Generation failed:", err.message);
  process.exit(1);
}
