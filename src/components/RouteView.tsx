import { useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { DAYS, BASES, CREW } from "../data/itinerary";
import { SectionHeading } from "./SectionHeading";

// ── Wikipedia live photos ────────────────────────────────────────────────────
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
        if (alive) { setSrc(url); setTried(true); }
      })
      .catch(() => { photoCache.set(title, null); if (alive) setTried(true); });
    return () => { alive = false; };
  }, [title]);

  if (tried && !src) return null;
  return (
    <figure className="relative shrink-0 w-48 h-32 rounded-xl overflow-hidden bg-white/5">
      {src && <img src={src} alt={title} loading="lazy" className="w-full h-full object-cover" />}
      <figcaption className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent px-2 py-1.5 text-[0.6rem] font-semibold text-white truncate">
        {title}
      </figcaption>
    </figure>
  );
}

// ── Haversine + zig-zag detector ─────────────────────────────────────────────
function haversineKm(a: [number, number], b: [number, number]): number {
  const R = 6371;
  const dLat = ((b[0] - a[0]) * Math.PI) / 180;
  const dLng = ((b[1] - a[1]) * Math.PI) / 180;
  const la1 = (a[0] * Math.PI) / 180;
  const la2 = (b[0] * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

type RouteDNA = { stops: number; totalKm: number; longestKm: number; spanKm: number; backtracks: number };

function analyze(pts: [number, number][]): RouteDNA | null {
  if (pts.length < 2) return null;
  const legs = pts.slice(1).map((p, i) => haversineKm(pts[i], p));
  const totalKm = legs.reduce((s, x) => s + x, 0);
  const longestKm = Math.max(...legs);
  const spanKm = haversineKm(pts[0], pts[pts.length - 1]);
  const ax = pts[pts.length - 1][1] - pts[0][1];
  const ay = pts[pts.length - 1][0] - pts[0][0];
  const axisLen = Math.hypot(ax, ay) || 1;
  const ux = ax / axisLen, uy = ay / axisLen;
  let backtracks = 0;
  for (let i = 1; i < pts.length; i++) {
    const vx = pts[i][1] - pts[i - 1][1];
    const vy = pts[i][0] - pts[i - 1][0];
    if ((vx * ux + vy * uy) / 0.0089 < -0.4) backtracks++;
  }
  return { stops: pts.length, totalKm, longestKm, spanKm, backtracks };
}

// ── Campaign stats (computed once at module load) ────────────────────────────
const DAY_STATS = DAYS.map((d, i) => {
  const coordStops = d.activities.filter((a) => a.coord);
  const pts = coordStops.map((s) => s.coord!) as [number, number][];
  const dna = analyze(pts);
  return {
    dayIdx: i,
    day: d,
    coordStops,
    totalActivities: d.activities.length,
    altsCount: d.alts?.length ?? 0,
    linksCount: d.links?.length ?? 0,
    bookingsCount: d.activities.filter((a) => a.booking).length,
    pathKm: dna?.totalKm ?? 0,
    backtracks: dna?.backtracks ?? 0,
  };
});

const TOTAL_MAPPED     = DAY_STATS.reduce((s, d) => s + d.coordStops.length, 0);
const TOTAL_ACTIVITIES = DAY_STATS.reduce((s, d) => s + d.totalActivities, 0);
const TOTAL_ALTS       = DAY_STATS.reduce((s, d) => s + d.altsCount, 0);
const TOTAL_LINKS      = DAY_STATS.reduce((s, d) => s + d.linksCount, 0);
const TOTAL_BOOKINGS   = DAY_STATS.reduce((s, d) => s + d.bookingsCount, 0);
const BUSIEST          = [...DAY_STATS].sort((a, b) => b.coordStops.length - a.coordStops.length)[0];
const SPINE_KM         = Math.round(
  haversineKm(BASES[0].coord, BASES[1].coord) + haversineKm(BASES[1].coord, BASES[2].coord),
);

// ── Leaflet setup ────────────────────────────────────────────────────────────
const TILE_URL = "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";
const TILE_ATTR = '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>';

function numIcon(n: number, color: string) {
  return L.divIcon({
    className: "",
    html: `<div style="width:26px;height:26px;border-radius:50%;background:${color};color:#fff;display:flex;align-items:center;justify-content:center;font:700 11px/1 system-ui;border:2.5px solid rgba(255,255,255,.9);box-shadow:0 2px 8px rgba(0,0,0,.7)">${n}</div>`,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
  });
}

const C_DAY   = "#f43f5e";
const C_BASE  = "#8b5cf6";
const C_SPOKE = "#38bdf8";

const SPOKES: { name: string; from: number; to: [number, number] }[] = [
  { name: "Kamakura + Enoshima (Dec 19)", from: 0, to: [35.3192, 139.5503] },
  { name: "Nara (Dec 23)",                from: 1, to: [34.685,  135.8399] },
  { name: "Uji · Nintendo Museum (Dec 24)", from: 1, to: [34.8918, 135.8005] },
  { name: "Hiroshima + Miyajima (Dec 26)", from: 2, to: [34.3955, 132.4536] },
  { name: "Himeji + Kobe (Dec 28)",        from: 2, to: [34.8394, 134.6939] },
];

// ── Sub-components ───────────────────────────────────────────────────────────
const COLOR_TOKENS: Record<string, { card: string; val: string }> = {
  rose:    { card: "border-rose-500/30 bg-rose-500/5",     val: "text-rose-300" },
  violet:  { card: "border-violet-500/30 bg-violet-500/5", val: "text-violet-300" },
  cyan:    { card: "border-cyan-500/30 bg-cyan-500/5",     val: "text-cyan-300" },
  amber:   { card: "border-amber-500/30 bg-amber-500/5",   val: "text-amber-300" },
  emerald: { card: "border-emerald-500/30 bg-emerald-500/5", val: "text-emerald-300" },
  sky:     { card: "border-sky-500/30 bg-sky-500/5",       val: "text-sky-300" },
};

function StatCard({ label, value, sub, color = "rose" }: { label: string; value: string; sub?: string; color?: string }) {
  const c = COLOR_TOKENS[color] ?? COLOR_TOKENS.rose;
  return (
    <div className={`rounded-2xl border p-4 flex flex-col gap-1 ${c.card}`}>
      <p className="text-[0.63rem] font-bold text-slate-500 uppercase tracking-wider">{label}</p>
      <p className={`text-2xl font-black tabular-nums leading-none ${c.val}`}>{value}</p>
      {sub && <p className="text-[0.7rem] text-slate-500 leading-relaxed mt-0.5">{sub}</p>}
    </div>
  );
}

function DNAStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[0.63rem] font-semibold text-slate-500 uppercase tracking-wider">{label}</p>
      <p className="text-sm font-bold text-slate-100 tabular-nums">{value}</p>
    </div>
  );
}

// ── Day city color helper ────────────────────────────────────────────────────
function cityColor(cityStr: string): string {
  const c = cityStr.split(/[→+\(,]/)[0].trim().toLowerCase();
  if (c.includes("osak") || c.includes("hiroshima") || c.includes("himeji") || c.includes("kobe")) return "text-sky-300";
  if (c.includes("kyoto") || c.includes("nara") || c.includes("uji")) return "text-amber-300";
  return "text-rose-300"; // Tokyo + In the Air + travel days
}

// ── Main component ───────────────────────────────────────────────────────────
export function RouteView() {
  const [dayIdx, setDayIdx] = useState<number>(-1);
  const mapEl    = useRef<HTMLDivElement>(null);
  const mapRef   = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);

  const day   = dayIdx >= 0 ? DAYS[dayIdx] : null;
  const stops = useMemo(() => (day ? day.activities.filter((a) => a.coord) : []), [day]);
  const pts   = useMemo(() => stops.map((s) => s.coord!) as [number, number][], [stops]);
  const dna   = useMemo(() => analyze(pts), [pts]);

  // Init map once
  useEffect(() => {
    if (!mapEl.current || mapRef.current) return;
    const map = L.map(mapEl.current, { scrollWheelZoom: true, zoomControl: true });
    L.tileLayer(TILE_URL, { attribution: TILE_ATTR, maxZoom: 19 }).addTo(map);
    mapRef.current  = map;
    layerRef.current = L.layerGroup().addTo(map);
    return () => { map.remove(); mapRef.current = null; layerRef.current = null; };
  }, []);

  // Redraw on selection
  useEffect(() => {
    const map = mapRef.current, layer = layerRef.current;
    if (!map || !layer) return;
    layer.clearLayers();

    if (!day) {
      const spine: [number, number][] = BASES.map((b) => b.coord);
      L.polyline(spine, { color: C_BASE, weight: 6, opacity: 0.95, className: "route-flow" }).addTo(layer);
      L.polyline(spine, { color: C_BASE, weight: 2, opacity: 0.2 }).addTo(layer);
      BASES.forEach((b, i) =>
        L.marker(b.coord, { icon: numIcon(i + 1, C_BASE) })
          .bindPopup(`<b>${b.name}</b><br/>${b.dates}`)
          .addTo(layer),
      );
      SPOKES.forEach((s) => {
        L.polyline([BASES[s.from].coord, s.to], { color: C_SPOKE, weight: 2, dashArray: "6 10", opacity: 0.9 }).addTo(layer);
        L.circleMarker(s.to, { radius: 7, color: C_SPOKE, fillColor: C_SPOKE, fillOpacity: 0.9, weight: 2 })
          .bindPopup(`<b>${s.name}</b><br/>day trip — out &amp; back, zero hotel change`)
          .addTo(layer);
      });
      map.fitBounds(L.latLngBounds([...spine, ...SPOKES.map((s) => s.to)]).pad(0.12));
      return;
    }

    if (pts.length === 0) {
      map.setView([36.2048, 138.2529], 6);
      return;
    }

    L.polyline(pts, { color: C_DAY, weight: 6, opacity: 0.95, className: "route-flow" }).addTo(layer);
    L.polyline(pts, { color: C_DAY, weight: 2, opacity: 0.2 }).addTo(layer);
    stops.forEach((s, i) =>
      L.marker(s.coord!, { icon: numIcon(i + 1, C_DAY) })
        .bindPopup(`<b>${s.time}</b> — ${s.title}`)
        .addTo(layer),
    );
    map.fitBounds(L.latLngBounds(pts).pad(0.25));
  }, [day, stops, pts]);

  return (
    <div className="section-pad py-24 pt-32">
      <SectionHeading
        kicker="The Geometry Proof"
        title="Route Control"
        sub="Every day plotted stop-by-stop with an animated flow-line showing direction of travel. Overview = the whole campaign: one clean westward spine with day-trip spokes that go out-and-back. Click any date chip to drill into the full schedule, Route DNA, audibles, and all official links."
      />

      {/* Day selector */}
      <div className="flex flex-wrap gap-1.5 mb-5">
        <button
          onClick={() => setDayIdx(-1)}
          className={`rounded-full px-3.5 py-1.5 text-xs font-bold border transition-colors ${dayIdx === -1 ? "bg-violet-500 border-violet-400 text-white" : "glass text-slate-300 hover:bg-white/10"}`}
        >
          🗾 Whole trip
        </button>
        {DAYS.map((d, i) => (
          <button
            key={d.date}
            onClick={() => setDayIdx(i)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold border transition-colors ${dayIdx === i ? "bg-rose-500 border-rose-400 text-white" : "glass text-slate-300 hover:bg-white/10"}`}
          >
            {d.emoji} {d.date.slice(8)}
          </button>
        ))}
      </div>

      {/* Map */}
      <div className="glass rounded-2xl overflow-hidden">
        <div ref={mapEl} style={{ height: "62vh", minHeight: 420 }} />
      </div>

      {/* Route DNA — day mode, 2+ mapped stops only */}
      {dna && (
        <div className="mt-4 glass rounded-2xl p-4 sm:p-5">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
            <p className="text-xs font-bold text-violet-300 uppercase tracking-wider">🧬 Route DNA</p>
            <DNAStat label="Mapped stops" value={`${dna.stops}`} />
            <DNAStat label="Total path" value={`≈ ${dna.totalKm.toFixed(1)} km`} />
            <DNAStat label="Longest leg" value={`≈ ${dna.longestKm.toFixed(1)} km`} />
            <DNAStat label="End-to-end span" value={`≈ ${dna.spanKm.toFixed(1)} km`} />
            <div className={`ml-auto shrink-0 rounded-full px-3 py-1 text-xs font-bold border ${dna.backtracks === 0 ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/40" : "bg-amber-500/15 text-amber-300 border-amber-500/40"}`}>
              {dna.backtracks === 0
                ? "✓ Clean sweep — zero backtracking"
                : `⚠ ${dna.backtracks} against-the-grain ${dna.backtracks === 1 ? "leg" : "legs"}`}
            </div>
          </div>
        </div>
      )}

      {/* ── DAY MODE ── */}
      {day ? (
        <div className="mt-6 space-y-5">
          {/* Header */}
          <div>
            <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
              <h3 className="text-xl sm:text-2xl font-extrabold">{day.emoji} {day.title}</h3>
              <span className="text-sm font-semibold text-rose-300">{day.dow} Dec {day.date.slice(8)} · {day.city}</span>
            </div>
            <p className="mt-1.5 text-sm text-cyan-200/90">{day.wx}</p>
            {day.transport && (
              <p className="mt-2.5 text-sm text-slate-400 max-w-3xl leading-relaxed pl-3 border-l-2 border-violet-500/50">
                🚄 {day.transport}
              </p>
            )}
          </div>

          {/* Wiki photos */}
          {day.wiki && day.wiki.length > 0 && (
            <div className="flex gap-3 overflow-x-auto pb-1">
              {day.wiki.map((t) => <WikiPhoto key={t} title={t} />)}
            </div>
          )}

          {/* Full schedule timeline */}
          <div className="glass rounded-2xl p-5">
            <p className="text-xs font-bold text-rose-300 uppercase tracking-wider mb-4">
              📋 Full Schedule — {day.activities.length} activities{stops.length > 0 && ` · ${stops.length} plotted on map`}
            </p>
            <ol className="space-y-0">
              {day.activities.map((a, i) => {
                const mapped  = !!a.coord;
                const mapNum  = mapped ? stops.indexOf(a) + 1 : 0;
                const isLast  = i === day.activities.length - 1;
                return (
                  <li key={i} className="flex gap-3">
                    <div className="flex flex-col items-center shrink-0">
                      {mapped ? (
                        <span className="w-6 h-6 rounded-full bg-rose-500 text-white text-[0.6rem] font-bold flex items-center justify-center border border-rose-300/50 shrink-0">
                          {mapNum}
                        </span>
                      ) : (
                        <span className="w-6 h-6 rounded-full bg-white/5 border border-white/10 text-slate-600 text-[0.55rem] flex items-center justify-center shrink-0">
                          ·
                        </span>
                      )}
                      {!isLast && <div className="w-px flex-1 bg-white/10 min-h-[10px]" />}
                    </div>
                    <div className="pb-3 flex-1 min-w-0">
                      <div className="flex items-start gap-2 flex-wrap">
                        <span className="text-rose-300/80 font-bold tabular-nums text-xs shrink-0 mt-0.5 w-14">{a.time}</span>
                        <span className={`text-sm font-semibold leading-snug ${mapped ? "text-slate-100" : "text-slate-300"}`}>{a.title}</span>
                        {a.booking && (
                          <span className="shrink-0 text-[0.58rem] font-bold bg-amber-500/20 border border-amber-500/40 text-amber-300 rounded-full px-1.5 py-0.5 mt-0.5">BOOK</span>
                        )}
                      </div>
                      {a.note && <p className="mt-0.5 text-xs text-slate-400 leading-relaxed">{a.note}</p>}
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>

          {/* Audibles */}
          {day.alts && day.alts.length > 0 && (
            <div className="glass rounded-2xl p-5">
              <p className="text-xs font-bold text-amber-300 uppercase tracking-wider mb-3">
                🎲 Audibles — {day.alts.length} contingency plays
              </p>
              <ul className="space-y-2.5">
                {day.alts.map((alt, i) => (
                  <li key={i} className="flex gap-2.5 text-sm text-slate-300 leading-relaxed">
                    <span className="text-amber-400 shrink-0 font-bold text-xs mt-0.5">{i + 1}.</span>
                    <span>{alt}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Links */}
          {day.links && day.links.length > 0 && (
            <div className="glass rounded-2xl p-5">
              <p className="text-xs font-bold text-sky-300 uppercase tracking-wider mb-3">
                🔗 Official links — {day.links.length} resources
              </p>
              <div className="flex flex-wrap gap-2">
                {day.links.map((l) => (
                  <a
                    key={l.url}
                    href={l.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-300 hover:text-sky-200 bg-sky-500/10 border border-sky-500/30 hover:border-sky-400/50 rounded-full px-3 py-1.5 transition-colors"
                  >
                    {l.label} ↗
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* ── OVERVIEW MODE ── */
        <div className="mt-6 space-y-6">

          {/* Campaign stats */}
          <div>
            <p className="text-xs font-bold text-violet-300 uppercase tracking-wider mb-3">📊 Campaign Intelligence</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <StatCard label="Total days" value="16" sub="Dec 14–29, 2026" color="violet" />
              <StatCard label="Bases" value="3" sub="Tokyo · Kyoto · Osaka" color="rose" />
              <StatCard label="Day trips" value="5" sub="zero extra hotel nights" color="cyan" />
              <StatCard label="Mapped stops" value={`${TOTAL_MAPPED}`} sub={`${(TOTAL_MAPPED / DAYS.length).toFixed(1)} avg / day`} color="emerald" />
              <StatCard label="Pre-bookings" value={`${TOTAL_BOOKINGS}`} sub={`${TOTAL_ALTS} audibles · ${TOTAL_LINKS} links`} color="amber" />
              <StatCard label="Spine distance" value={`${SPINE_KM} km`} sub="Tokyo → Osaka direct" color="sky" />
            </div>
          </div>

          {/* Crew */}
          <div className="glass rounded-2xl p-5">
            <p className="text-xs font-bold text-rose-300 uppercase tracking-wider mb-3">🎌 Strike Force — {CREW.length} strong</p>
            <div className="flex flex-wrap gap-2 mb-3">
              {CREW.map((name) => (
                <span key={name} className="text-sm font-bold bg-rose-500/15 border border-rose-500/30 text-rose-200 rounded-full px-3 py-1">
                  {name}
                </span>
              ))}
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              8 people. 3 Airbnbs. {TOTAL_ACTIVITIES} planned activities + {TOTAL_ALTS} audible contingencies.
              Avg {(TOTAL_ACTIVITIES / DAYS.length).toFixed(1)} activities/day. {TOTAL_BOOKINGS} things that need advance booking — don't sleep.
              Busiest day on the map: <span className="text-amber-300 font-bold">{BUSIEST.day.emoji} Dec {BUSIEST.day.date.slice(8)} — {BUSIEST.day.title}</span> with {BUSIEST.coordStops.length} mapped stops.
            </p>
          </div>

          {/* 3 bases */}
          <div className="grid gap-4 sm:grid-cols-3">
            {BASES.map((b, i) => {
              const spokes = SPOKES.filter((s) => s.from === i);
              return (
                <div key={b.name} className="glass rounded-2xl p-5">
                  <p className="text-xs font-bold text-violet-300 uppercase tracking-wider">Base {i + 1}</p>
                  <h3 className="font-extrabold text-lg mt-0.5">{b.name}</h3>
                  <p className="text-sm text-slate-400 mb-3">{b.dates}</p>
                  {spokes.length > 0 && (
                    <div className="space-y-1.5 border-t border-white/10 pt-3">
                      <p className="text-[0.63rem] font-bold text-cyan-400 uppercase tracking-wider">Day trips from here</p>
                      {spokes.map((s) => (
                        <p key={s.name} className="text-xs text-cyan-300 flex gap-1.5">
                          <span className="text-cyan-600 shrink-0">↳</span> {s.name}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Route intelligence */}
          <div className="glass rounded-2xl p-5">
            <p className="text-xs font-bold text-emerald-300 uppercase tracking-wider mb-4">✅ Route Intelligence — why this shape wins</p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {[
                { icon: "🧭", title: "Strictly westward spine", body: "Tokyo → Kyoto → Osaka follows the Tokaido corridor. The trip never backtracks east after leaving Tokyo. One direction, maximum coverage, zero wasted shinkansen legs." },
                { icon: "🔄", title: "Spoke model kills hotel chaos", body: "All 5 day trips (Kamakura, Nara, Uji, Hiroshima, Himeji+Kobe) are out-and-back from the base city. Bags never move for a day trip. We sleep in the same bed we woke up in." },
                { icon: "🧳", title: "Luggage moves exactly twice", body: "Yamato ships the big suitcases: Tokyo → Osaka on Dec 20 (arrives Dec 22). Kyoto = daypack-only. We board every train like free people. Second ship is the Dec 28 farewell run." },
                { icon: "🚫", title: "No JR Pass — it's cheaper", body: "SmartEX + Suica beats the 14-day rail pass on this exact route by ≈$200/person. The pass only wins if you also go to Hokkaido. We do not." },
                { icon: "🎄", title: "December logic built in", body: "Illumination season in all three cities. Kamakura's winter Fuji sightlines. Miyajima oyster peak. Osaka crab season. USJ Christmas spectacular. Every leg is calendar-optimal." },
                { icon: "✈️", title: "Haneda > Narita, always", body: "HND is inside Tokyo — 20 min from Shinagawa on the Keikyu. Narita is an hour+ away. We fly in and out of HND and never think about it again." },
              ].map((item) => (
                <div key={item.title} className="bg-white/[0.02] rounded-xl border border-white/5 p-4">
                  <p className="font-bold text-slate-100 text-sm mb-1.5">{item.icon} {item.title}</p>
                  <p className="text-xs text-slate-400 leading-relaxed">{item.body}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Day-by-day breakdown table */}
          <div className="glass rounded-2xl p-5 overflow-x-auto">
            <p className="text-xs font-bold text-rose-300 uppercase tracking-wider mb-4">
              📅 All 16 Days — click any row to drill in
            </p>
            <table className="w-full text-xs text-left min-w-[600px]">
              <thead>
                <tr className="border-b border-white/10 text-slate-500 font-semibold">
                  <th className="pb-2 pr-4">Date</th>
                  <th className="pb-2 pr-4">Day</th>
                  <th className="pb-2 pr-4">City</th>
                  <th className="pb-2 pr-3 text-right">Map stops</th>
                  <th className="pb-2 pr-3 text-right">Activities</th>
                  <th className="pb-2 pr-3 text-right">Audibles</th>
                  <th className="pb-2 pr-3 text-right">Links</th>
                  <th className="pb-2 text-right">Pre-books</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.05]">
                {DAY_STATS.map((ds) => {
                  const isBusiest = ds.dayIdx === BUSIEST.dayIdx;
                  const cc = cityColor(ds.day.city);
                  return (
                    <tr
                      key={ds.day.date}
                      className="hover:bg-white/5 cursor-pointer transition-colors"
                      onClick={() => setDayIdx(ds.dayIdx)}
                    >
                      <td className="py-2 pr-4 text-slate-400 font-mono">{ds.day.date.slice(5)}</td>
                      <td className="py-2 pr-4 text-slate-500">{ds.day.dow}</td>
                      <td className={`py-2 pr-4 font-semibold ${cc}`}>{ds.day.emoji} {ds.day.city}</td>
                      <td className="py-2 pr-3 text-right">
                        <span className={`font-bold tabular-nums ${isBusiest ? "text-amber-300" : ds.coordStops.length >= 9 ? "text-rose-300" : "text-slate-300"}`}>
                          {ds.coordStops.length}
                        </span>
                        {isBusiest && <span className="ml-1 text-amber-400">★</span>}
                      </td>
                      <td className="py-2 pr-3 text-right text-slate-300 tabular-nums">{ds.totalActivities}</td>
                      <td className="py-2 pr-3 text-right text-slate-400 tabular-nums">{ds.altsCount}</td>
                      <td className="py-2 pr-3 text-right text-slate-400 tabular-nums">{ds.linksCount}</td>
                      <td className="py-2 text-right">
                        {ds.bookingsCount > 0 ? (
                          <span className="text-amber-400 font-bold tabular-nums">{ds.bookingsCount}</span>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="border-t border-white/10 text-slate-400 font-bold">
                <tr>
                  <td colSpan={3} className="pt-2 pr-4 text-slate-500 uppercase tracking-wider text-[0.63rem]">Totals</td>
                  <td className="pt-2 pr-3 text-right tabular-nums">{TOTAL_MAPPED}</td>
                  <td className="pt-2 pr-3 text-right tabular-nums">{TOTAL_ACTIVITIES}</td>
                  <td className="pt-2 pr-3 text-right tabular-nums">{TOTAL_ALTS}</td>
                  <td className="pt-2 pr-3 text-right tabular-nums">{TOTAL_LINKS}</td>
                  <td className="pt-2 text-right tabular-nums text-amber-400">{TOTAL_BOOKINGS}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
