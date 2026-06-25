import { writeFileSync } from "fs";

// Lines we actually care about for this trip (kept in sync with src/hooks/useTrainDelays.ts)
const CRITICAL_LINES = [
  "山手線",
  "東海道新幹線",
  "中央線",
  "大阪環状線",
  "御堂筋線",
  "銀座線",
  "丸ノ内線",
];

async function fetchWithRetry(url, opts = {}, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(15000), ...opts });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res;
    } catch (err) {
      if (attempt === retries) throw err;
      const wait = attempt * 1500;
      console.warn(`Fetch attempt ${attempt} failed: ${err.message} — retrying in ${wait}ms`);
      await new Promise((r) => setTimeout(r, wait));
    }
  }
}

// ── Train delays: rti-giken (free, no key; blocked by CORS in the browser, ──
//    so we fetch it here at build/cron time and ship a static JSON) ─────────
let delayedLines = [];
let hasMajorDelays = false;

try {
  console.log("Fetching Japan train delays...");
  const res = await fetchWithRetry("https://rti-giken.jp/fhc/api/train_tetsudo/delay.json");
  const data = await res.json();

  if (Array.isArray(data)) {
    delayedLines = data
      .filter((item) => item && typeof item.name === "string")
      .map((item) => ({
        name: item.name,
        company: item.company ?? "",
        source: item.source ?? "",
      }));
    hasMajorDelays = delayedLines.some((d) => CRITICAL_LINES.some((cl) => d.name.includes(cl)));
    console.log(`${delayedLines.length} lines delayed; major (critical) delays: ${hasMajorDelays}`);
  } else {
    console.warn("Unexpected train-delay payload shape — treating as no delays");
  }
} catch (err) {
  console.warn(`Train-delay fetch failed: ${err.message} — writing empty feed`);
}

const payload = {
  delayedLines,
  hasMajorDelays,
  fetchedAt: new Date().toISOString(),
};

writeFileSync("public/train-delays.json", JSON.stringify(payload, null, 2) + "\n");
console.log("Wrote public/train-delays.json");
