import { useMemo, useState } from "react";
import { motion } from "motion/react";
import { Search, MapPin, Clock, Wallet, TrainFront, Snowflake, Star } from "lucide-react";
import { ATTRACTIONS, type City, type Category } from "../data/attractions";
import { NEIGHBORHOODS } from "../data/neighborhoods";
import { SectionHeading } from "./SectionHeading";

const CITIES: ("All" | City)[] = ["All", "Tokyo", "Kyoto", "Osaka", "Nara", "Hakone", "Hiroshima", "Day Trips"];
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
  1: { label: "MUST SEE", cls: "bg-rose-500/20 text-rose-300 border-rose-500/40" },
  2: { label: "EXCELLENT", cls: "bg-amber-500/20 text-amber-300 border-amber-500/40" },
  3: { label: "IF TIME", cls: "bg-sky-500/20 text-sky-300 border-sky-500/40" },
};

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
      onClick={onClick}
      className={`rounded-full px-3.5 py-1.5 text-xs font-semibold border transition-colors ${
        active
          ? "bg-rose-500 border-rose-400 text-white"
          : "glass text-slate-300 hover:bg-white/10"
      }`}
    >
      {children}
    </button>
  );
}

export function Explore() {
  const [query, setQuery] = useState("");
  const [city, setCity] = useState<(typeof CITIES)[number]>("All");
  const [cat, setCat] = useState<(typeof CATEGORIES)[number]>("All");
  const [mustOnly, setMustOnly] = useState(false);

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

  return (
    <div className="section-pad py-24 pt-32">
      <SectionHeading
        kicker="The Encyclopedia"
        title="Explore Everything"
        sub={`${ATTRACTIONS.length} researched sights across our route — searchable, filterable, opinionated. Tier 1 = build the day around it.`}
      />

      {/* Search + filters */}
      <div className="glass rounded-2xl p-4 mb-8 space-y-3">
        <div className="relative">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search temples, neon, monkeys, mochi…"
            className="w-full rounded-xl bg-white/5 border border-white/10 pl-11 pr-4 py-3 outline-none focus:border-rose-400/60 placeholder:text-slate-600"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {CITIES.map((c) => (
            <Chip key={c} active={city === c} onClick={() => setCity(c)}>
              {c}
            </Chip>
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {CATEGORIES.map((c) => (
            <Chip key={c} active={cat === c} onClick={() => setCat(c)}>
              {c}
            </Chip>
          ))}
          <Chip active={mustOnly} onClick={() => setMustOnly(!mustOnly)}>
            ★ Must-sees only
          </Chip>
        </div>
      </div>

      <p className="text-sm text-slate-500 mb-4">{results.length} results</p>

      <div className="grid gap-4 md:grid-cols-2">
        {results.map((a, i) => {
          const tier = TIER_LABEL[a.tier];
          return (
            <motion.article
              key={a.id}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: Math.min(i * 0.02, 0.3) }}
              className="glass rounded-2xl p-5 flex flex-col"
            >
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
            </motion.article>
          );
        })}
      </div>

      {/* Neighborhoods */}
      <div className="mt-24">
        <SectionHeading
          kicker="Know the Turf"
          title="Neighborhood Field Guide"
          sub="What each district is for, and the tip that saves you an hour."
        />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {NEIGHBORHOODS.map((n, i) => (
            <motion.div
              key={n.name}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-30px" }}
              transition={{ duration: 0.35, delay: (i % 3) * 0.05 }}
              className="glass rounded-2xl p-5"
            >
              <p className="text-xs font-semibold text-rose-400 uppercase tracking-wider">{n.city}</p>
              <h3 className="font-bold text-lg mt-0.5">
                {n.name} <span className="text-slate-500 text-sm font-[Noto_Serif_JP] font-normal">{n.jp}</span>
              </h3>
              <p className="text-sm text-slate-400 italic mt-1">{n.vibe}</p>
              <ul className="mt-3 space-y-1">
                {n.knownFor.map((k) => (
                  <li key={k} className="text-xs text-slate-300 flex gap-1.5">
                    <span className="text-rose-400">·</span> {k}
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-xs text-emerald-300/90 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-2.5 py-2">
                💡 {n.proTip}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
