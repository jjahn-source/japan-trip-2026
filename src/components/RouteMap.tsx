import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { DAYS } from "../data/itinerary";
import { STAY_LEGS } from "../data/stays";

function dayColor(theme: string): string {
  if (theme.includes("rose") || theme.includes("pink")) return "#f43f5e";
  if (theme.includes("orange") || theme.includes("amber")) return "#f97316";
  if (theme.includes("violet") || theme.includes("purple")) return "#8b5cf6";
  if (theme.includes("sky") || theme.includes("blue") || theme.includes("cyan")) return "#0ea5e9";
  if (theme.includes("emerald") || theme.includes("teal") || theme.includes("green")) return "#10b981";
  if (theme.includes("indigo")) return "#6366f1";
  if (theme.includes("slate")) return "#64748b";
  return "#f43f5e";
}

export function RouteMap() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const map = L.map(containerRef.current, {
      center: [35.5, 137.0],
      zoom: 7,
      zoomControl: true,
      attributionControl: false,
      scrollWheelZoom: false,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 18,
    }).addTo(map);

    // Draw each day's route as a colored polyline + activity markers
    let prevLastCoord: [number, number] | null = null;

    for (const day of DAYS) {
      const mapped = day.activities.filter(
        (a): a is typeof a & { coord: [number, number] } => !!a.coord,
      );
      if (mapped.length === 0) continue;

      const color = dayColor(day.theme ?? "");

      // Dashed grey connector from previous day's last stop to this day's first
      if (prevLastCoord) {
        L.polyline([prevLastCoord, mapped[0].coord], {
          color: "#475569",
          weight: 1,
          opacity: 0.4,
          dashArray: "4 8",
        }).addTo(map);
      }

      // Colored polyline for this day
      if (mapped.length > 1) {
        L.polyline(
          mapped.map((a) => a.coord),
          { color, weight: 2.5, opacity: 0.8 },
        ).addTo(map);
      }

      // Small circle markers per activity
      for (const a of mapped) {
        const circle = L.circleMarker(a.coord, {
          radius: 5,
          color,
          weight: 2,
          fillColor: color,
          fillOpacity: 0.9,
        });
        circle.bindPopup(
          `<b style="font-size:12px">${day.emoji} ${day.title}</b><br><span style="font-size:11px">${a.title}</span>${a.time && a.time !== "—" ? `<br><span style="font-size:10px;color:#f43f5e">${a.time}</span>` : ""}`,
        );
        circle.addTo(map);
      }

      prevLastCoord = mapped[mapped.length - 1].coord;
    }

    // Base camp markers for the 3 stays
    for (const leg of STAY_LEGS) {
      if (!leg.coord) continue;
      const icon = L.divIcon({
        html: `<div style="width:30px;height:30px;border-radius:50%;background:linear-gradient(135deg,#1e293b,#334155);border:2px solid rgba(255,255,255,0.5);display:flex;align-items:center;justify-content:center;font-size:14px;box-shadow:0 3px 8px rgba(0,0,0,0.5);">${leg.emoji}</div>`,
        className: "",
        iconAnchor: [15, 15],
        popupAnchor: [0, -18],
      });
      L.marker(leg.coord, { icon })
        .addTo(map)
        .bindPopup(
          `<b style="font-size:12px">${leg.emoji} ${leg.city} base camp</b><br><span style="font-size:11px">${leg.dates} · ${leg.nights} nights</span>`,
        );
    }

    requestAnimationFrame(() => map.invalidateSize());

    return () => {
      map.remove();
    };
  }, []);

  return (
    <div className="section-pad pb-0 pt-6">
      <p className="text-[0.62rem] font-bold uppercase tracking-[0.2em] text-rose-300 mb-0.5">The Route</p>
      <h2 className="text-xl sm:text-2xl font-black">16 Days Across Japan</h2>
      <p className="text-xs text-slate-400 mt-0.5 mb-3">Tokyo → Kyoto → Osaka · tap any stop to see what's there</p>
      <div
        ref={containerRef}
        className="w-full rounded-2xl overflow-hidden border border-white/10"
        style={{ height: "420px" }}
      />
    </div>
  );
}
