import { useMemo, useState } from "react";
import { motion } from "motion/react";
import { MapPin, Wallet, Star } from "lucide-react";
import { NIGHT_SPOTS, NIGHT_RULES, DRINK_MENU } from "../data/nightlife";
import { SectionHeading } from "./SectionHeading";

const CITIES = ["All", "Tokyo", "Kyoto", "Osaka", "Hakone"] as const;
const KINDS = [
  "All",
  "Bar Alley",
  "Izakaya",
  "Standing Bar",
  "Karaoke",
  "Beer Hall",
  "Cocktail / Whisky",
  "Sake Bar",
  "Club",
  "Late-Night Food",
  "Sento / Onsen",
] as const;

const TIER_LABEL: Record<number, { label: string; cls: string }> = {
  1: { label: "BUILD THE NIGHT AROUND IT", cls: "bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/40" },
  2: { label: "STRONG STOP", cls: "bg-amber-500/20 text-amber-300 border-amber-500/40" },
  3: { label: "SIDE QUEST", cls: "bg-sky-500/20 text-sky-300 border-sky-500/40" },
};

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-3.5 py-1.5 text-xs font-semibold border transition-colors ${
        active ? "bg-fuchsia-500 border-fuchsia-400 text-white" : "glass text-slate-300 hover:bg-white/10"
      }`}
    >
      {children}
    </button>
  );
}

export function NightView() {
  const [city, setCity] = useState<(typeof CITIES)[number]>("All");
  const [kind, setKind] = useState<(typeof KINDS)[number]>("All");

  const results = useMemo(
    () =>
      NIGHT_SPOTS.filter(
        (s) => (city === "All" || s.city === city) && (kind === "All" || s.kind === kind),
      ).sort((a, b) => a.tier - b.tier),
    [city, kind],
  );

  return (
    <div className="section-pad py-24 pt-32">
      <SectionHeading
        kicker="夜 · After Dark"
        title="The Night Operations Manual"
        sub={`${NIGHT_SPOTS.length} bars, alleys, karaoke towers, late-night baths and 2am ramen counters — plus the rules that keep eight guys alive until the last train (or sunrise).`}
      />

      {/* Rules of engagement */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-14">
        {NIGHT_RULES.map((r, i) => (
          <motion.div
            key={r.title}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-30px" }}
            transition={{ duration: 0.3, delay: (i % 4) * 0.05 }}
            className="glass rounded-2xl p-5"
          >
            <div className="text-2xl mb-2">{r.emoji}</div>
            <h3 className="font-bold text-sm mb-1.5">{r.title}</h3>
            <p className="text-xs text-slate-400 leading-relaxed">{r.body}</p>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <div className="glass rounded-2xl p-4 mb-8 space-y-3">
        <div className="flex flex-wrap gap-1.5">
          {CITIES.map((c) => (
            <Chip key={c} active={city === c} onClick={() => setCity(c)}>
              {c}
            </Chip>
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {KINDS.map((k) => (
            <Chip key={k} active={kind === k} onClick={() => setKind(k)}>
              {k}
            </Chip>
          ))}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {results.map((s, i) => {
          const tier = TIER_LABEL[s.tier];
          return (
            <motion.article
              key={s.name}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: Math.min(i * 0.02, 0.3) }}
              className="glass rounded-2xl p-5 flex flex-col"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    {s.city} · {s.area} · {s.kind}
                  </p>
                  <h3 className="font-bold text-lg leading-tight mt-0.5">
                    {s.name}{" "}
                    {s.jp && <span className="text-slate-500 text-sm font-[Noto_Serif_JP] font-normal">{s.jp}</span>}
                  </h3>
                </div>
                <span className={`shrink-0 inline-flex items-center gap-1 text-[0.6rem] font-bold border rounded-full px-2 py-1 ${tier.cls}`}>
                  <Star size={9} /> {tier.label}
                </span>
              </div>
              <p className="mt-3 text-sm text-slate-400 leading-relaxed flex-1">{s.why}</p>
              <p className="mt-3 flex items-center gap-1.5 text-xs text-slate-400">
                <Wallet size={12} className="text-slate-500" /> {s.cost}
              </p>
              <p className="mt-2.5 flex items-start gap-1.5 text-xs text-fuchsia-200/90 bg-fuchsia-500/10 border border-fuchsia-500/20 rounded-lg px-2.5 py-2">
                <MapPin size={12} className="mt-0.5 shrink-0" />
                {s.protip}
              </p>
            </motion.article>
          );
        })}
      </div>

      {/* Drink menu decoder */}
      <div className="mt-24">
        <SectionHeading
          kicker="Order Without Pointing"
          title="The Drink Menu, Decoded"
          sub="Everything on an izakaya drink menu, what it actually is, and what it costs."
        />
        <div className="grid gap-4 md:grid-cols-2">
          {DRINK_MENU.map((d) => (
            <div key={d.name} className="glass rounded-2xl p-5">
              <div className="flex items-baseline justify-between gap-3">
                <h3 className="font-bold">
                  {d.name}{" "}
                  <span className="text-slate-500 text-sm font-[Noto_Serif_JP] font-normal">{d.jp}</span>
                </h3>
                <span className="shrink-0 text-xs font-bold text-fuchsia-300">{d.price}</span>
              </div>
              <p className="mt-2 text-sm text-slate-400 leading-relaxed">{d.what}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
