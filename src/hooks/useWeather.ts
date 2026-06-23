import { useEffect } from "react";
import { useLocalStorage } from "./useLocalStorage";

// Three home bases (reused from BASES in itinerary data, inlined to avoid a
// heavy import on the landing path).
export const WEATHER_BASES = {
  Tokyo: [35.6896, 139.7006],
  Kyoto: [35.0116, 135.7681],
  Osaka: [34.6661, 135.5013],
} as const;

export type BaseName = keyof typeof WEATHER_BASES;

export type DailyForecast = {
  time: string[];
  code: number[];
  tmax: number[];
  tmin: number[];
  precip: number[];
};

type Cache = { fetchedAt: number; byBase: Partial<Record<BaseName, DailyForecast>> };

const STALE_MS = 3 * 60 * 60 * 1000; // 3h
let inFlight = false; // module-level guard so many badges don't each fetch

// Static pre-fetched weather data URL (written by scripts/refresh-weather.mjs)
const STATIC_URL = `${import.meta.env.BASE_URL}weather.json`;

/** Map a messy day.city string to one of the three bases. */
export function cityToBase(city: string): BaseName {
  const c = city.toLowerCase();
  if (c.includes("kyoto") || c.includes("nara") || c.includes("uji")) return "Kyoto";
  if (c.includes("osaka") || c.includes("hiroshima") || c.includes("himeji") || c.includes("kobe") || c.includes("miyajima")) return "Osaka";
  return "Tokyo"; // Tokyo, Kamakura/Enoshima, in-the-air, travel days
}

// WMO weather code → emoji + short label.
export function wmo(code: number): { icon: string; label: string } {
  if (code === 0) return { icon: "☀️", label: "Clear" };
  if (code <= 2) return { icon: "🌤", label: "Mostly sunny" };
  if (code === 3) return { icon: "☁️", label: "Cloudy" };
  if (code <= 48) return { icon: "🌫", label: "Fog" };
  if (code <= 57) return { icon: "🌦", label: "Drizzle" };
  if (code <= 65) return { icon: "🌧", label: "Rain" };
  if (code <= 67) return { icon: "🌧", label: "Freezing rain" };
  if (code <= 77) return { icon: "❄️", label: "Snow" };
  if (code <= 82) return { icon: "🌦", label: "Showers" };
  if (code <= 86) return { icon: "🌨", label: "Snow showers" };
  return { icon: "⛈", label: "Thunderstorm" };
}

export function useWeather(): Cache["byBase"] {
  const [cache, setCache] = useLocalStorage<Cache>("weather-cache", { fetchedAt: 0, byBase: {} });

  useEffect(() => {
    const fresh = Date.now() - cache.fetchedAt < STALE_MS && Object.keys(cache.byBase).length > 0;
    if (fresh || inFlight || !navigator.onLine) return;
    inFlight = true;

    // Try static pre-fetched data first, fall back to live API
    const tryStaticFirst = async (): Promise<Cache["byBase"] | null> => {
      try {
        const r = await fetch(STATIC_URL);
        if (!r.ok) return null;
        const j = await r.json();
        if (!j?.cities) return null;
        const byBase: Cache["byBase"] = {};
        const names = Object.keys(WEATHER_BASES) as BaseName[];
        for (const n of names) {
          const d = j.cities[n];
          if (d?.time) {
            byBase[n] = { time: d.time, code: d.code, tmax: d.tmax, tmin: d.tmin, precip: d.precip };
          }
        }
        return Object.keys(byBase).length > 0 ? byBase : null;
      } catch {
        return null;
      }
    };

    const fetchLiveAPI = async (): Promise<Cache["byBase"] | null> => {
      const names = Object.keys(WEATHER_BASES) as BaseName[];
      const lat = names.map((n) => WEATHER_BASES[n][0]).join(",");
      const lon = names.map((n) => WEATHER_BASES[n][1]).join(",");
      const url =
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
        `&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max` +
        `&timezone=Asia%2FTokyo&temperature_unit=fahrenheit&forecast_days=16`;

      const r = await fetch(url);
      if (!r.ok) return null;
      const j = await r.json();
      const arr = Array.isArray(j) ? j : [j];
      const byBase: Cache["byBase"] = {};
      names.forEach((n, i) => {
        const d = arr[i]?.daily;
        if (d?.time) {
          byBase[n] = {
            time: d.time,
            code: d.weather_code,
            tmax: d.temperature_2m_max,
            tmin: d.temperature_2m_min,
            precip: d.precipitation_probability_max,
          };
        }
      });
      return Object.keys(byBase).length > 0 ? byBase : null;
    };

    (async () => {
      const byBase = (await tryStaticFirst()) ?? (await fetchLiveAPI().catch(() => null));
      if (byBase) setCache({ fetchedAt: Date.now(), byBase });
      inFlight = false;
    })();
  }, [cache.fetchedAt, cache.byBase, setCache]);

  return cache.byBase;
}
