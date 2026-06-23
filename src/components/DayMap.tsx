import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Day } from "../data/itinerary";
import { haversineKm } from "../utils/itineraryTools";

type Activity = Day["activities"][number];

interface DayMapProps {
  activities: Activity[];
  dayTheme: string;
}

// Extract the first `from-*` color from a Tailwind gradient string for pin tinting.
// Falls back to a rose gradient if no match.
function pinGradient(theme: string): string {
  if (theme.includes("accent") || theme.includes("rose") || theme.includes("pink")) return "linear-gradient(135deg,#d42b2b,#e03434)";
  if (theme.includes("orange") || theme.includes("amber")) return "linear-gradient(135deg,#f97316,#f59e0b)";
  if (theme.includes("violet") || theme.includes("purple")) return "linear-gradient(135deg,#8b5cf6,#a855f7)";
  if (theme.includes("fuchsia")) return "linear-gradient(135deg,#d946ef,#a855f7)";
  if (theme.includes("sky") || theme.includes("blue") || theme.includes("cyan")) return "linear-gradient(135deg,#0ea5e9,#06b6d4)";
  if (theme.includes("emerald") || theme.includes("teal") || theme.includes("green")) return "linear-gradient(135deg,#10b981,#14b8a6)";
  if (theme.includes("indigo")) return "linear-gradient(135deg,#6366f1,#8b5cf6)";
  return "linear-gradient(135deg,#d42b2b,#b82020)";
}

export function DayMap({ activities, dayTheme }: DayMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const mapped = activities.filter((a): a is Activity & { coord: [number, number] } => !!a.coord);
    if (mapped.length === 0) return;

    const map = L.map(containerRef.current, {
      zoomControl: true,
      attributionControl: true,
      scrollWheelZoom: false,
    });
    mapRef.current = map;

    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      maxZoom: 19,
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OSM</a> © <a href="https://carto.com/attributions">CARTO</a>',
    }).addTo(map);

    const gradient = pinGradient(dayTheme);

    // Add numbered pins
    mapped.forEach((a, i) => {
      const nextStop = mapped[i + 1];
      const distText = nextStop
        ? `${haversineKm(a.coord, nextStop.coord).toFixed(1)} km to next stop (straight-line)`
        : null;

      const icon = L.divIcon({
        html: `<div style="width:22px;height:22px;border-radius:50%;background:${gradient};border:2px solid rgba(255,255,255,0.35);display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;color:white;box-shadow:0 2px 6px rgba(0,0,0,0.4);">${i + 1}</div>`,
        className: "",
        iconAnchor: [11, 11],
        popupAnchor: [0, -14],
      });

      const popupLines = [`<b>${a.title}</b>`, a.time !== "—" ? a.time : null, distText]
        .filter(Boolean)
        .join("<br>");

      L.marker(a.coord, { icon }).addTo(map).bindPopup(popupLines);
    });

    // Draw route polyline
    if (mapped.length > 1) {
      L.polyline(
        mapped.map((a) => a.coord),
        { color: "#d42b2b", weight: 2.5, opacity: 0.75, dashArray: "8 14", className: "route-flow" },
      ).addTo(map);
    }

    // Fit to bounds, then invalidate so tile seams close after animation
    const bounds = L.latLngBounds(mapped.map((a) => a.coord));
    map.fitBounds(bounds, { padding: [32, 32] });
    requestAnimationFrame(() => map.invalidateSize());

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [activities, dayTheme]);

  return (
    <div
      ref={containerRef}
      className="w-full rounded-xl overflow-hidden border border-white/10"
      style={{ height: "280px" }}
    />
  );
}
