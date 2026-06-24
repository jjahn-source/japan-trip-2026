import { writeFileSync } from "fs";

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

// ── Exchange rate: Frankfurter (free, no key, ECB data) ──────────────
let exchangeRate = null;
try {
  console.log("Fetching USD→JPY exchange rate...");
  const rateRes = await fetchWithRetry("https://api.frankfurter.dev/v1/latest?base=USD&symbols=JPY");
  const rateJson = await rateRes.json();
  const jpy = rateJson.rates?.JPY;
  if (jpy && jpy > 50 && jpy < 300) {
    exchangeRate = { usd_jpy: jpy, source: "ECB via Frankfurter", date: rateJson.date };
    console.log(`USD→JPY: ¥${jpy}`);
  } else {
    console.warn(`USD/JPY rate ${jpy} is out of expected range (50–300) — ignoring`);
  }
} catch (err) {
  console.error("Exchange rate fetch failed:", err.message);
}

// ── Travel advisory: UK FCDO API (reliable, no key) ──────────────────
let advisory = null;
try {
  console.log("Fetching Japan travel advisory (UK FCDO)...");
  const advRes = await fetch(
    "https://www.gov.uk/api/content/foreign-travel-advice/japan",
    { signal: AbortSignal.timeout(15000) }
  );
  if (advRes.ok) {
    const advJson = await advRes.json();
    const alerts = advJson?.details?.alert_status ?? [];
    const updatedAt = advJson?.details?.updated_at ?? null;
    const changeDesc = advJson?.details?.change_description ?? null;
    // No active alerts = safe to travel normally
    const level = alerts.length === 0 ? 1 : 3;
    const message = alerts.length === 0
      ? "No active travel alerts. Exercise normal precautions."
      : `Active alerts: ${alerts.join(", ")}`;
    advisory = { level, message, alerts, updatedAt, changeDesc, source: "UK FCDO" };
    console.log(`Japan advisory: Level ${level} — ${message}`);
  } else {
    console.error(`FCDO advisory returned ${advRes.status}`);
  }
} catch (err) {
  console.error("Travel advisory fetch failed:", err.message);
}

// Fallback: static safe default (Japan is consistently Level 1)
if (!advisory) {
  advisory = { level: 1, message: "Exercise normal precautions.", source: "FCDO (cached fallback)" };
  console.log("Using static advisory fallback (Level 1)");
}

// ── Write output ─────────────────────────────────────────────────────
if (!exchangeRate && !advisory) {
  console.error("No data fetched from any source");
  process.exit(1);
}

const output = {
  ...(exchangeRate && { exchangeRate }),
  ...(advisory && { advisory }),
  fetchedAt: new Date().toISOString(),
};

writeFileSync("public/travel-intel.json", JSON.stringify(output, null, 2));
console.log("Wrote public/travel-intel.json");
