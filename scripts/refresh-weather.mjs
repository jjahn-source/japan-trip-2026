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

// Same three bases the app uses (from src/hooks/useWeather.ts)
const BASES = {
  Tokyo: [35.6896, 139.7006],
  Kyoto: [35.0116, 135.7681],
  Osaka: [34.6661, 135.5013],
};

const names = Object.keys(BASES);
const lat = names.map((n) => BASES[n][0]).join(",");
const lon = names.map((n) => BASES[n][1]).join(",");

// Same params the client-side useWeather hook uses, including Fahrenheit
const url =
  `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
  `&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max` +
  `&timezone=Asia%2FTokyo&temperature_unit=fahrenheit&forecast_days=16`;

console.log("Fetching Open-Meteo forecast for Tokyo/Kyoto/Osaka...");

const res = await fetchWithRetry(url);

if (!res.ok) {
  console.error(`Open-Meteo returned ${res.status}`);
  process.exit(1);
}

const json = await res.json();
const arr = Array.isArray(json) ? json : [json];

const cities = {};
names.forEach((name, i) => {
  const d = arr[i]?.daily;
  if (d?.time) {
    cities[name] = {
      time: d.time,
      code: d.weather_code,
      tmax: d.temperature_2m_max,
      tmin: d.temperature_2m_min,
      precip: d.precipitation_probability_max,
    };
  }
});

if (Object.keys(cities).length === 0) {
  console.error("No valid weather data received");
  process.exit(1);
}

const output = { cities, fetchedAt: new Date().toISOString() };
writeFileSync("public/weather.json", JSON.stringify(output, null, 2));
console.log(`Wrote weather data for ${Object.keys(cities).join(", ")} to public/weather.json`);
