import { useMemo, useState, useCallback } from "react";
import { motion } from "motion/react";
import { Search, MapPin, Clock, Wallet, TrainFront, Snowflake, Star } from "lucide-react";
import { ATTRACTIONS, type City, type Category } from "../data/attractions";
import { NEIGHBORHOODS } from "../data/neighborhoods";
import { DAY_TRIPS } from "../data/daytrips";
import { SectionHeading } from "./SectionHeading";
import { WikiImage } from "./ui/WikiImage";
import { PlaceBadge } from "./ui/PlaceBadge";
import { CrowdTip } from "./ui/CrowdTip";
import { slugify } from "../utils/nav";

type SightsSection = "spots" | "hoods" | "trips";

const TRIP_TIER: Record<number, { label: string; cls: string }> = {
  1: { label: "LOCKED IN THE PLAN", cls: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40" },
  2: { label: "STRONG AUDIBLE", cls: "bg-amber-500/20 text-amber-300 border-amber-500/40" },
  3: { label: "IF A DAY FREES UP", cls: "bg-sky-500/20 text-sky-300 border-sky-500/40" },
};

const CITIES: ("All" | City)[] = ["All", "Tokyo", "Kyoto", "Osaka", "Nara", "Hiroshima", "Day Trips"];
const HOOD_CITIES: ("All" | City)[] = ["All", "Tokyo", "Kyoto", "Osaka", "Nara", "Hiroshima"];
const CATEGORIES: ("All" | Category)[] = [
  "All",
  "Temple & Shrine",
  "Museum & Art",
  "Viewpoint",
  "Park & Nature",
  "Market & Shopping",
  "Entertainment",
  "Nightlife",
  "Landmark",
];

const TIER_LABEL: Record<number, { label: string; cls: string }> = {
  1: { label: "MUST SEE", cls: "bg-accent-500/20 text-accent-300 border-accent-500/40" },
  2: { label: "EXCELLENT", cls: "bg-amber-500/20 text-amber-300 border-amber-500/40" },
  3: { label: "IF TIME", cls: "bg-sky-500/20 text-sky-300 border-sky-500/40" },
};

const SECTION_TABS: { id: SightsSection; label: string; count: number }[] = [
  { id: "spots", label: "Spots",     count: ATTRACTIONS.length },
  { id: "hoods", label: "Hoods",     count: NEIGHBORHOODS.length },
  { id: "trips", label: "Day Trips", count: DAY_TRIPS.length },
];

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-4 py-2 text-sm font-semibold border transition-colors min-h-[40px] ${
        active
          ? "bg-accent-500 border-accent-400 text-white"
          : "glass text-slate-300 hover:bg-white/10"
      }`}
    >
      {children}
    </button>
  );
}

const PAGE_SIZE = 12;

export function Explore() {
  const [query, setQuery] = useState("");
  const [city, setCity] = useState<(typeof CITIES)[number]>("All");
  const [cat, setCat] = useState<(typeof CATEGORIES)[number]>("All");
  const [mustOnly, setMustOnly] = useState(false);
  const [section, setSection] = useState<SightsSection>("spots");
  const [hoodCity, setHoodCity] = useState<(typeof HOOD_CITIES)[number]>("All");
  const [page, setPage] = useState(1);
  const [hoodPage, setHoodPage] = useState(1);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return ATTRACTIONS.filter((a) => {
      if (city !== "All" && a.city !== city) return false;
      if (cat !== "All" && a.category !== cat) return false;
      if (mustOnly && a.tier !== 1) return false;
      if (q && !`${a.name} ${a.jp} ${a.desc} ${a.city} ${a.category}`.toLowerCase().includes(q))
        return false;
      return true;
    }).sort((a, b) => a.tier - b.tier);
  }, [query, city, cat, mustOnly]);

  const visibleResults = results.slice(0, page * PAGE_SIZE);
  const hasMoreResults = visibleResults.length < results.length;

  const hoodResults = useMemo(() => {
    if (hoodCity === "All") return NEIGHBORHOODS;
    return NEIGHBORHOODS.filter((n) => n.city === hoodCity);
  }, [hoodCity]);

  const visibleHoods = hoodResults.slice(0, hoodPage * PAGE_SIZE);
  const hasMoreHoods = visibleHoods.length < hoodResults.length;

  const setFilter = useCallback(<T,>(setter: (v: T) => void, value: T) => {
    setter(value);
    setPage(1);
  }, []);

  const switchSection = (s: SightsSection) => {
    setSection(s);
    setPage(1);
    setHoodPage(1);
    window.scrollTo({ top: 0 });
  };

  return (
    <div className="section-pad pt-32 pb-12 sm:pb-24">
      {/* Section picker */}
      <div className="flex gap-2 mb-8">
        {SECTION_TABS.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => switchSection(s.id)}
            className={`rounded-full px-3.5 py-1.5 text-[0.7rem] font-semibold border transition-colors ${
              s.id === section
                ? "bg-white/15 border-white/25 text-white"
                : "border-white/10 text-slate-400 hover:text-white hover:bg-white/8"
            }`}
          >
            {s.label} <span className="opacity-40">{s.count}</span>
          </button>
        ))}
      </div>

      {/* Spots */}
      {section === "spots" && (
        <>
          <SectionHeading
            kicker="The Encyclopedia"
            title="Explore Everything"
            sub={`${ATTRACTIONS.length} researched sights across our route — searchable, filterable, opinionated. Tier 1 = build the day around it.`}
          />

          <div className="glass rounded-2xl p-4 mb-8 space-y-3">
            <div className="relative">
              <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search temples, neon, monkeys, mochi…"
                className="w-full rounded-xl bg-white/5 border border-white/10 pl-11 pr-4 py-3 outline-none focus:border-accent-400/60 placeholder:text-slate-600"
              />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {CITIES.map((c) => (
                <Chip key={c} active={city === c} onClick={() => setFilter(setCity, c)}>
                  {c}
                </Chip>
              ))}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES.map((c) => (
                <Chip key={c} active={cat === c} onClick={() => setFilter(setCat, c)}>
                  {c}
                </Chip>
              ))}
              <Chip active={mustOnly} onClick={() => setFilter(setMustOnly, !mustOnly)}>
                ★ Must-sees only
              </Chip>
            </div>
          </div>

          <p className="text-sm text-slate-500 mb-4">{results.length} results</p>

          <div className="grid gap-4 sm:grid-cols-2">
            {visibleResults.map((a, i) => {
              const tier = TIER_LABEL[a.tier];
              const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${a.name} ${a.city} Japan`)}`;
              const wikiUrl = a.wiki ? `https://en.wikipedia.org/wiki/${encodeURIComponent(a.wiki)}` : null;
              return (
                <motion.article
                  key={a.id}
                  id={`sight-${a.id}`}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: Math.min(i * 0.02, 0.3) }}
                  className="glass rounded-2xl overflow-hidden flex flex-col scroll-mt-28"
                >
                  <WikiImage wiki={a.wiki} category={a.category} />

                  <div className="p-5 flex flex-col flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                          {a.city} · {a.category}
                        </p>
                        <h3 className="font-bold text-lg leading-tight mt-0.5">
                          {a.name}{" "}
                          <span className="text-slate-500 text-sm font-[Noto_Serif_JP] font-normal">{a.jp}</span>
                        </h3>
                      </div>
                      <span className={`shrink-0 inline-flex items-center gap-1 text-[0.62rem] font-bold border rounded-full px-2 py-1 ${tier.cls}`}>
                        <Star size={9} /> {tier.label}
                      </span>
                    </div>

                    <p className="mt-3 text-sm text-slate-400 leading-relaxed flex-1">{a.desc}</p>

                    {a.googlePlaceId && (
                      <div className="mt-2">
                        <PlaceBadge placeId={a.googlePlaceId} />
                      </div>
                    )}
                    <CrowdTip bestVisitTime={a.bestVisitTime} crowdWarning={a.crowdWarning} />

                    <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs text-slate-400">
                      <span className="flex items-center gap-1.5"><Clock size={12} className="text-slate-500 shrink-0" />{a.hours}</span>
                      <span className="flex items-center gap-1.5"><Wallet size={12} className="text-slate-500 shrink-0" />{a.cost}</span>
                      <span className="flex items-center gap-1.5"><TrainFront size={12} className="text-slate-500 shrink-0" />{a.station}</span>
                      <span className="flex items-center gap-1.5"><MapPin size={12} className="text-slate-500 shrink-0" />{a.duration}</span>
                    </div>

                    {a.decNote && (
                      <p className="mt-3 flex items-start gap-1.5 text-xs text-cyan-200/90 bg-cyan-500/10 border border-cyan-500/20 rounded-lg px-2.5 py-2">
                        <Snowflake size={12} className="mt-0.5 shrink-0" />
                        {a.decNote}
                      </p>
                    )}

                    <div className="mt-3 pt-3 border-t border-white/5 flex gap-3 flex-wrap">
                      <a href={mapsUrl} target="_blank" rel="noreferrer" className="text-xs text-indigo-300/80 hover:text-indigo-200 underline underline-offset-2">
                        Maps ↗
                      </a>
                      {wikiUrl && (
                        <a href={wikiUrl} target="_blank" rel="noreferrer" className="text-xs text-indigo-300/80 hover:text-indigo-200 underline underline-offset-2">
                          Wikipedia ↗
                        </a>
                      )}
                      {a.links?.map((l) => (
                        <a key={l.url} href={l.url} target="_blank" rel="noreferrer" className="text-xs text-indigo-300/80 hover:text-indigo-200 underline underline-offset-2">
                          {l.label} ↗
                        </a>
                      ))}
                    </div>
                  </div>
                </motion.article>
              );
            })}
          </div>

          {hasMoreResults && (
            <div className="mt-8 text-center">
              <button
                type="button"
                onClick={() => setPage((p) => p + 1)}
                className="px-6 py-3 rounded-xl glass text-sm font-semibold text-slate-300 hover:text-white hover:bg-white/10 transition-colors min-h-[48px]"
              >
                Show {Math.min(PAGE_SIZE, results.length - visibleResults.length)} more
              </button>
            </div>
          )}
        </>
      )}

      {/* Hoods */}
      {section === "hoods" && (
        <>
          <SectionHeading
            kicker="Know the Turf"
            title="Neighborhood Field Guide"
            sub="What each district is for, and the tip that saves you an hour."
          />
          <div className="flex flex-wrap gap-1.5 mb-4">
            {HOOD_CITIES.map((c) => (
              <Chip key={c} active={hoodCity === c} onClick={() => { setHoodCity(c); setHoodPage(1); }}>
                {c}
              </Chip>
            ))}
          </div>
          <p className="text-sm text-slate-500 mb-4">{hoodResults.length} neighborhoods</p>
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
            {visibleHoods.map((n, i) => (
              <motion.div
                key={n.name}
                id={`hood-${slugify(n.name)}`}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: Math.min(i * 0.03, 0.3) }}
                className="glass rounded-2xl p-5 scroll-mt-28"
              >
                <p className="text-xs font-semibold text-accent-400 uppercase tracking-wider">{n.city}</p>
                <h3 className="font-bold text-lg mt-0.5">
                  {n.name} <span className="text-slate-500 text-sm font-[Noto_Serif_JP] font-normal">{n.jp}</span>
                </h3>
                <p className="text-sm text-slate-400 italic mt-1">{n.vibe}</p>
                <ul className="mt-3 space-y-1">
                  {n.knownFor.map((k) => (
                    <li key={k} className="text-xs text-slate-300 flex gap-1.5">
                      <span className="text-accent-400">·</span> {k}
                    </li>
                  ))}
                </ul>
                <p className="mt-3 text-xs text-emerald-300/90 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-2.5 py-2">
                  💡 {n.proTip}
                </p>
              </motion.div>
            ))}
          </div>

          {hasMoreHoods && (
            <div className="mt-8 text-center">
              <button
                type="button"
                onClick={() => setHoodPage((p) => p + 1)}
                className="px-6 py-3 rounded-xl glass text-sm font-semibold text-slate-300 hover:text-white hover:bg-white/10 transition-colors min-h-[48px]"
              >
                Show {Math.min(PAGE_SIZE, hoodResults.length - visibleHoods.length)} more
              </button>
            </div>
          )}
        </>
      )}

      {/* Day Trips */}
      {section === "trips" && (
        <>
          <SectionHeading
            kicker="Radiating from the Bases"
            title="Day Trip War Room"
            sub="Ten full dossiers — exact trains, costs, hour-by-hour plays, and official booking links. Tier 1 trips are already in the itinerary; the rest are loaded audibles."
          />
          <div className="space-y-5">
            {DAY_TRIPS.map((t, i) => {
              const tier = TRIP_TIER[t.tier];
              return (
                <motion.article
                  key={t.id}
                  id={`trip-${t.id}`}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: Math.min(i * 0.04, 0.3) }}
                  className="glass rounded-2xl overflow-hidden scroll-mt-28"
                >
                  <WikiImage wiki={t.wiki} category="Park & Nature" />
                  <div className="p-5 sm:p-6">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        from {t.base} base · {t.hours} · {t.cost}
                      </p>
                      <h3 className="font-extrabold text-xl mt-0.5">
                        {t.name}{" "}
                        <span className="text-slate-500 text-sm font-[Noto_Serif_JP] font-normal">{t.jp}</span>
                      </h3>
                    </div>
                    <span className={`shrink-0 text-[0.62rem] font-bold border rounded-full px-2.5 py-1 ${tier.cls}`}>
                      {tier.label}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-slate-300 leading-relaxed max-w-3xl">{t.pitch}</p>
                  <p className="mt-3 text-xs text-indigo-200/90 bg-indigo-500/10 border border-indigo-500/20 rounded-lg px-3 py-2">
                    🚄 {t.travel}
                  </p>
                  <details className="mt-3 group">
                    <summary className="cursor-pointer text-sm font-bold text-accent-300 hover:text-accent-200">
                      ▸ The run of show ({t.play.length} steps)
                    </summary>
                    <ol className="mt-2 space-y-1.5">
                      {t.play.map((p, pi) => (
                        <li key={pi} className="text-sm text-slate-300 leading-relaxed pl-3 border-l-2 border-accent-500/30">
                          {p}
                        </li>
                      ))}
                    </ol>
                  </details>
                  <p className="mt-3 text-xs text-amber-200/90 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
                    🎯 {t.protip}
                  </p>
                  {t.links.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {t.links.map((l) => (
                        <a
                          key={l.url}
                          href={l.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-300 hover:text-indigo-200 underline underline-offset-2"
                        >
                          {l.label} ↗
                        </a>
                      ))}
                    </div>
                  )}
                  </div>
                </motion.article>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
