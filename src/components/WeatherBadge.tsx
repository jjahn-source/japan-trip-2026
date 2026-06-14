import { CloudSun } from "lucide-react";
import { useWeather, cityToBase, wmo } from "../hooks/useWeather";

/**
 * Shows the LIVE Open-Meteo forecast for a day when it's within the ~16-day
 * window (cached, offline-safe); otherwise falls back to the curated `wx` text.
 * The "live forecast ↗" Google link stays as a tertiary fallback.
 */
export function WeatherBadge({ city, dateISO, wx }: { city: string; dateISO: string; wx: string }) {
  const byBase = useWeather();
  const base = cityToBase(city);
  const fc = byBase[base];

  let live: string | null = null;
  if (fc) {
    const i = fc.time.indexOf(dateISO);
    if (i >= 0) {
      const w = wmo(fc.code[i]);
      const hi = Math.round(fc.tmax[i]);
      const lo = Math.round(fc.tmin[i]);
      const p = fc.precip?.[i];
      live = `${w.icon} ${hi}°/${lo}°F · ${w.label}${typeof p === "number" ? ` · ${p}% precip` : ""}`;
    }
  }

  const forecastUrl = `https://www.google.com/search?q=${encodeURIComponent(
    city.replace(/\s*\(.*\)/, "").replace(/\s*→.*/, "") + " 14 day weather forecast December",
  )}`;

  return (
    <p className="mb-3 flex items-center gap-2 flex-wrap text-xs font-semibold text-cyan-200/90">
      <CloudSun size={14} className="shrink-0" />
      {live ? (
        <>
          <span className="text-cyan-100">{live}</span>
          <span className="text-[0.6rem] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full px-1.5 py-0.5">live</span>
          <span className="text-slate-500">· {wx}</span>
        </>
      ) : (
        <>
          <span>{wx}</span>
          <a
            href={forecastUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-0.5 text-cyan-300/80 hover:text-cyan-200 underline decoration-dotted whitespace-nowrap"
          >
            live forecast ↗
          </a>
        </>
      )}
    </p>
  );
}
