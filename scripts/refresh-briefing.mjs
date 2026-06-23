import { readFileSync, writeFileSync, existsSync } from "fs";

let NIM_API_KEY = process.env.NVIDIA_NIM_API_KEY;
if (!NIM_API_KEY && existsSync(".env.local")) {
  const envContent = readFileSync(".env.local", "utf-8");
  const match = envContent.match(/^NVIDIA_NIM_API_KEY=(.*)$/m);
  if (match) NIM_API_KEY = match[1].trim();
}

const NIM_BASE = "https://integrate.api.nvidia.com/v1/chat/completions";
const NIM_MODEL = "z-ai/glm-5.1";
const OUTPUT = "public/crew-briefing.json";
const MIN_AGE_MS = 6 * 24 * 60 * 60 * 1000; // 6 days

// ── Self-throttle: skip if recent briefing exists ────────────────────
if (existsSync(OUTPUT)) {
  try {
    const existing = JSON.parse(readFileSync(OUTPUT, "utf-8"));
    const age = Date.now() - new Date(existing.generatedAt).getTime();
    if (age < MIN_AGE_MS) {
      const daysAgo = Math.floor(age / (24 * 60 * 60 * 1000));
      console.log(`Briefing is ${daysAgo}d old (< 6d) — skipping generation`);
      process.exit(0);
    }
  } catch {}
}

if (!NIM_API_KEY) {
  console.log("No NVIDIA_NIM_API_KEY — skipping briefing generation");
  process.exit(0);
}

// ── Generate weekly briefing via NVIDIA NIM GLM 5.1 ──────────────────
console.log("Generating weekly crew briefing via GLM 5.1...");

const now = new Date();
const weekNumber = Math.ceil(
  ((now - new Date(now.getFullYear(), 0, 1)) / 86400000 + new Date(now.getFullYear(), 0, 1).getDay() + 1) / 7
);

// Calculate days until trip
const tripStart = new Date("2026-12-14T00:00:00");
const daysUntil = Math.max(0, Math.ceil((tripStart - now) / 86400000));

const body = {
  model: NIM_MODEL,
  messages: [
    {
      role: "system",
      content: `You write fun, concise weekly briefings for a group of 8 friends planning a 16-day Japan trip (Dec 14–29, 2026, Tokyo → Kyoto → Osaka).

Today is ${now.toISOString().slice(0, 10)}, which is ${daysUntil} days before the trip.

Give 3–5 bite-sized tips covering any of: seasonal events happening during their Dec dates, December weather prep, food highlights for winter, cultural notes for the holiday season, booking reminders, packing tips, or things to do before flying out.

Keep it punchy and personal — these are friends, not clients. Use casual language, inside-joke energy. Under 200 words total.

Format each tip as a numbered list item with a short bold title, like:
1. **Title** — description
2. **Title** — description

Start with a one-line greeting that references how many days until the trip.`,
    },
    {
      role: "user",
      content: `Write this week's briefing for the crew. Week ${weekNumber} of ${now.getFullYear()}.`,
    },
  ],
  temperature: 0.8,
  max_tokens: 600,
};

try {
  const res = await fetch(NIM_BASE, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${NIM_API_KEY}`,
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(30000),
  });

  if (!res.ok) {
    console.error(`NIM API returned ${res.status}: ${await res.text()}`);
    process.exit(1);
  }

  const json = await res.json();
  const briefing = json.choices?.[0]?.message?.content?.trim();

  if (!briefing) {
    console.error("Empty response from GLM 5.1");
    process.exit(1);
  }

  const output = {
    briefing,
    generatedAt: now.toISOString(),
    weekNumber,
    daysUntilTrip: daysUntil,
  };

  writeFileSync(OUTPUT, JSON.stringify(output, null, 2));
  console.log(`Wrote crew briefing to ${OUTPUT} (week ${weekNumber}, ${daysUntil}d until trip)`);
} catch (err) {
  console.error("Briefing generation failed:", err.message);
  process.exit(1);
}
