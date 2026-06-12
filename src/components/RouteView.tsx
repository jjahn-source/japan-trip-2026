import { useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { DAYS, BASES } from "../data/itinerary";
import { SectionHeading } from "./SectionHeading";

// ── Live photos via the Wikipedia REST API (CORS-enabled, no key) ──────────
const photoCache = new Map<string, string | null>();

function WikiPhoto({ title }: { title: string }) {
  const [src, setSrc] = useState<string | null>(photoCache.get(title) ?? null);
  const [tried, setTried] = useState(photoCache.has(title));

  useEffect(() => {
    if (photoCache.has(title)) return;
    let alive = true;
    fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        const url = j?.thumbnail?.source?.replace(/\/\d+px-/, "/640px-") ?? null;
        photoCache.set(title, url);
        if (alive) {
          setSrc(url);
          setTried(true);
        }
      })
      .catch(() => {
        photoCache.set(title, null);
        if (alive) setTried(true);
      });
    return () => {
      alive = false;
    };
  }, [title]);

  if (tried && !src) return null;
  return (
    <figure className="relative shrink-0 w-44 h-28 rounded-xl overflow-hidden bg-white/5">
      {src && <img src={src} alt={title} loading="lazy" className="w-full h-full object-cover" />}
      <figcaption className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent px-2 py-1 text-[0.6rem] font-semibold text-white truncate">
        {title}
      </figcaption>
    </figure>
  );
}

// ── Leaflet helpers ─────────────────────────────────────────────────────────
const TILE_URL = "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";
const TILE_ATTR =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>';

function numberIcon(n: number, color: string) {
  return L.divIcon({
    className: "",
    html: `<div style="width:24px;height:24px;border-radius:9999px;background:${color};color:#fff;display:flex;align-items:center;justify-content:center;font:700 11px/1 system-ui;border:2px solid rgba(255,255,255,.85);box-shadow:0 2px 6px rgba(0,0,0,.5)">${n}</div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
}

const DAY_COLOR = "#f43f5e";
const BASE_COLOR = "#8b5cf6";

export function RouteView() {
  const [dayIdx, setDayIdx] = useState<number>(-1); // -1 = whole-trip overview
  const mapEl = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);

  const day = dayIdx >= 0 ? DAYS[dayIdx] : null;
  const stops = useMemo(
    () => (day ? day.activities.filter((a) => a.coord) : []),
    [day],
  );

  // init once
  useEffect(() => {
    if (!mapEl.current || mapRef.current) return;
    const map = L.map(mapEl.current, { scrollWheelZoom: true, zoomControl: true });
    L.tileLayer(TILE_URL, { attribution: TILE_ATTR, maxZoom: 19 }).addTo(map);
    mapRef.current = map;
    layerRef.current = L.layerGroup().addTo(map);
    return () => {
      map.remove();
      mapRef.current = null;
      layerRef.current = null;
    };
  }, []);

  // draw on selection change
  useEffect(() => {
    const map = mapRef.current;
    const layer = layerRef.current;
    if (!map || !layer) return;
    layer.clearLayers();

    if (!day) {
      // OVERVIEW: bases + every day's first/key stop spokes — one westward line, zero zig-zags
      const baseLine: [number, number][] = BASES.map((b) => b.coord);
      L.polyline(baseLine, { color: BASE_COLOR, weight: 4, opacity: 0.9 }).addTo(layer);
      BASES.forEach((b, i) => {
        L.marker(b.coord, { icon: numberIcon(i + 1, BASE_COLOR) })
          .bindPopup(`<b>${b.name}</b><br/>${b.dates}`)
          .addTo(layer);
      });
      // day-trip spokes
      const spokes: { name: string; from: [number, number]; to: [number, number] }[] = [
        { name: "Hakone (Dec 19)", from: BASES[0].coord, to: [35.2326, 139.1056] },
        { name: "Nara (Dec 23)", from: BASES[1].coord, to: [34.685, 135.8399] },
        { name: "Uji (Dec 24)", from: BASES[1].coord, to: [34.8918, 135.8005] },
        { name: "Hiroshima + Miyajima (Dec 26)", from: BASES[2].coord, to: [34.3955, 132.4536] },
        { name: "Himeji + Kobe (Dec 28)", from: BASES[2].coord, to: [34.8394, 134.6939] },
      ];
      spokes.forEach((s) => {
        L.polyline([s.from, s.to], { color: DAY_COLOR, weight: 2, dashArray: "6 8", opacity: 0.8 }).addTo(layer);
        L.circleMarker(s.to, { radius: 6, color: DAY_COLOR, fillColor: DAY_COLOR, fillOpacity: 0.9 })
          .bindPopup(`<b>${s.name}</b><br/>day trip`)
          .addTo(layer);
      });
      map.fitBounds(L.latLngBounds([...baseLine, ...spokes.map((s) => s.to)]).pad(0.15));
      return;
    }

    if (stops.length === 0) return;
    const pts = stops.map((s) => s.coord!) as [number, number][];
    L.polyline(pts, { color: DAY_COLOR, weight: 3, opacity: 0.9 }).addTo(layer);
    stops.forEach((s, i) => {
      L.marker(s.coord!, { icon: numberIcon(i + 1, DAY_COLOR) })
        .bindPopup(`<b>${s.time}</b> — ${s.title}`)
        .addTo(layer);
    });
    map.fitBounds(L.latLngBounds(pts).pad(0.2));
  }, [day, stops]);

  return (
    <div className="section-pad py-24 pt-32">
      <SectionHeading
        kicker="The Geometry Proof"
        title="Route Control"
        sub="Every day plotted in stop order. The overview shows the whole campaign: one clean westward line — Tokyo → Kyoto → Osaka — with day-trip spokes. Zero zig-zags, zero wasted train hours."
      />

      {/* Day selector */}
      <div className="flex flex-wrap gap-1.5 mb-5">
        <button
          onClick={() => setDayIdx(-1)}
          className={`rounded-full px-3.5 py-1.5 text-xs font-bold border transition-colors ${
            dayIdx === -1 ? "bg-violet-500 border-violet-400 text-white" : "glass text-slate-300 hover:bg-white/10"
          }`}
        >
          🗾 Whole trip
        </button>
        {DAYS.map((d, i) => (
          <button
            key={d.date}
            onClick={() => setDayIdx(i)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold border transition-colors ${
              dayIdx === i ? "bg-rose-500 border-rose-400 text-white" : "glass text-slate-300 hover:bg-white/10"
            }`}
          >
            {d.emoji} {d.date.slice(8)}
          </button>
        ))}
      </div>

      {/* Map */}
      <div className="glass rounded-2xl overflow-hidden">
        <div ref={mapEl} style={{ height: "62vh", minHeight: 420 }} />
      </div>

      {/* Selected-day detail */}
      {day ? (
        <div className="mt-6">
          <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
            <h3 className="text-xl sm:text-2xl font-extrabold">
              {day.emoji} {day.title}
            </h3>
            <span className="text-sm font-semibold text-rose-300">
              {day.dow} {day.date.slice(5)} · {day.city}
            </span>
          </div>
          <p className="mt-1 text-sm text-cyan-200/90">{day.wx}</p>
          {day.transport && <p className="mt-2 text-sm text-slate-400 max-w-3xl">{day.transport}</p>}

          {day.wiki && (
            <div className="mt-4 flex gap-3 overflow-x-auto pb-2">
              {day.wiki.map((t) => (
                <WikiPhoto key={t} title={t} />
              ))}
            </div>
          )}

          <ol className="mt-4 grid gap-1.5 sm:grid-cols-2">
            {stops.map((s, i) => (
              <li key={i} className="flex items-center gap-2.5 text-sm text-slate-300">
                <span className="shrink-0 w-6 h-6 rounded-full bg-rose-500 text-white text-[0.65rem] font-bold flex items-center justify-center">
                  {i + 1}
                </span>
                <span className="font-bold text-rose-300/90 tabular-nums w-12">{s.time}</span>
                <span className="truncate">{s.title}</span>
              </li>
            ))}
          </ol>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {BASES.map((b, i) => (
            <div key={b.name} className="glass rounded-2xl p-5">
              <p className="text-xs font-bold text-violet-300 uppercase tracking-wider">Base {i + 1}</p>
              <h3 className="font-bold text-lg mt-0.5">{b.name}</h3>
              <p className="text-sm text-slate-400">{b.dates}</p>
            </div>
          ))}
          <div className="sm:col-span-3 glass rounded-2xl p-5">
            <p className="text-sm text-slate-300 leading-relaxed">
              <span className="font-bold text-rose-300">Why this shape wins:</span> the trip moves
              strictly west then flies home from the east coast's airport via one shinkansen sprint.
              Day trips (dashed) radiate from bases instead of forcing hotel changes — Hakone from
              Tokyo, Nara/Uji from Kyoto, Hiroshima and Himeji/Kobe from Osaka. Luggage moves
              exactly twice (Yamato ships it both times); we ride every train with daypacks.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
