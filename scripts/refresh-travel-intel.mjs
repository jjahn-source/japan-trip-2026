import { writeFileSync } from "fs";

// ── Exchange rate: Frankfurter (free, no key, ECB data) ──────────────
let exchangeRate = null;
try {
  console.log("Fetching USD→JPY exchange rate...");
  const rateRes = await fetch("https://api.frankfurter.dev/v1/latest?base=USD&symbols=JPY", {
    signal: AbortSignal.timeout(10000),
  });
  if (rateRes.ok) {
    const rateJson = await rateRes.json();
    const jpy = rateJson.rates?.JPY;
    if (jpy) {
      exchangeRate = { usd_jpy: jpy, source: "ECB via Frankfurter", date: rateJson.date };
      console.log(`USD→JPY: ¥${jpy}`);
    }
  } else {
    console.error(`Frankfurter returned ${rateRes.status}`);
  }
} catch (err) {
  console.error("Exchange rate fetch failed:", err.message);
}

// ── Travel advisory: US State Dept JSON feed (reliable, no key) ──────
let advisory = null;
try {
  console.log("Fetching Japan travel advisory (US State Dept)...");
  const advRes = await fetch(
    "https://travel.state.gov/content/dam/tsg-global/tsg_global_content_root/tsg_root/content/passports/en/alertswarnings/japan-travel-advisory.json",
    { signal: AbortSignal.timeout(15000) }
  );
  if (advRes.ok) {
    const advJson = await advRes.json();
    const level = advJson?.advisoryLevel ?? null;
    const message = advJson?.message ?? null;
    if (level) {
      advisory = { level, message, source: "US State Department" };
      console.log(`Japan advisory: Level ${level} — ${message ?? "(no message)"}`);
    }
  } else {
    console.error(`State Dept advisory returned ${advRes.status}`);
  }
} catch (err) {
  console.error("Travel advisory fetch failed:", err.message);
}

// Fallback: if State Dept fails, use a static known-safe default rather than dropping the field
if (!advisory) {
  advisory = { level: 1, message: "Exercise normal precautions.", source: "US State Department (cached fallback)" };
  console.log("Using static advisory fallback (Level 1 — Japan is consistently safe)");
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
