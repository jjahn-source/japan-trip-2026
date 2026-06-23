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

// ── Travel advisory: travel-advisories.info (free, no key) ───────────
let advisory = null;
try {
  console.log("Fetching Japan travel advisory...");
  const advRes = await fetch("https://www.travel-advisories.info/api?countrycode=JP", {
    signal: AbortSignal.timeout(10000),
  });
  if (advRes.ok) {
    const advJson = await advRes.json();
    const jpData = advJson.data?.JP;
    if (jpData) {
      // Score is 0-5 (0=safe, 5=do not travel). Extract overall + individual sources.
      const score = jpData.advisory?.score ?? null;
      const sources = {};
      if (jpData.advisory?.sources_active) {
        // sources_active is number of reporting countries
        // Individual source advisories are in jpData.advisory.message
      }
      // Map score to human-readable level
      let level = "Unknown";
      if (score !== null) {
        if (score <= 1.5) level = "Low risk";
        else if (score <= 2.5) level = "Exercise normal caution";
        else if (score <= 3.5) level = "Exercise increased caution";
        else if (score <= 4.5) level = "Reconsider travel";
        else level = "Do not travel";
      }
      advisory = { score, level, continent: jpData.continent, name: jpData.name };
      console.log(`Japan advisory: ${level} (score: ${score})`);
    }
  } else {
    console.error(`Travel advisory API returned ${advRes.status}`);
  }
} catch (err) {
  console.error("Travel advisory fetch failed:", err.message);
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
