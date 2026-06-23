import { useMemo, useState } from "react";
import { motion } from "motion/react";
import { Wallet } from "lucide-react";
import { PLAY_SPOTS, CRANE_SCHOOL } from "../data/otaku";
import { SectionHeading } from "./SectionHeading";

const CITIES = ["All", "Tokyo", "Kyoto", "Osaka"] as const;
const KINDS = [
  "All",
  "Arcade",
  "Retro Games",
  "Gachapon",
  "Anime & Manga",
  "Character Store",
  "Cards & Figures",
  "Mega Store",
  "Purikura",
] as const;

const KIND_EMOJI: Record<string, string> = {
  "Arcade": "🕹️",
  "Retro Games": "👾",
  "Gachapon": "🎰",
  "Anime & Manga": "📚",
  "Character Store": "🧸",
  "Cards & Figures": "🃏",
  "Mega Store": "🏬",
  "Purikura": "📸",
};

const PAGE_SIZE = 12;

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-4 py-2 text-sm font-semibold border transition-colors min-h-[40px] ${
        active ? "bg-violet-500 border-violet-400 text-white" : "glass text-slate-300 hover:bg-white/10"
      }`}
    >
      {children}
    </button>
  );
}

export function PlayView() {
  const [city, setCity] = useState<(typeof CITIES)[number]>("All");
  const [kind, setKind] = useState<(typeof KINDS)[number]>("All");
  const [page, setPage] = useState(1);

  const results = useMemo(
    () =>
      PLAY_SPOTS.filter(
        (s) => (city === "All" || s.city === city) && (kind === "All" || s.kind === kind),
      ),
    [city, kind],
  );

  const visible = results.slice(0, page * PAGE_SIZE);
  const hasMore = visible.length < results.length;

  const setFilter = <T,>(setter: (v: T) => void, value: T) => {
    setter(value);
    setPage(1);
  };

  return (
    <div className="section-pad py-24 pt-32">
      <SectionHeading
        kicker="🕹️ Play"
        title="Arcades, Gachapon & Otaku"
        sub={`${PLAY_SPOTS.length} arcades, retro-game shops, character stores, and capsule-machine arsenals. Eight guys with no supervision and ¥100 coins.`}
      />

      {/* Filters */}
      <div className="glass rounded-2xl p-4 mb-8 space-y-3">
        <div className="flex flex-wrap gap-1.5">
          {CITIES.map((c) => (
            <Chip key={c} active={city === c} onClick={() => setFilter(setCity, c)}>{c}</Chip>
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5 pt-2 border-t border-white/5">
          {KINDS.map((k) => (
            <Chip key={k} active={kind === k} onClick={() => setFilter(setKind, k)}>
              {k !== "All" ? `${KIND_EMOJI[k] ?? ""} ` : ""}{k}
            </Chip>
          ))}
        </div>
      </div>

      <p className="text-sm text-slate-500 mb-5 tabular-nums">{results.length} spot{results.length !== 1 ? "s" : ""}</p>

      {/* Spot cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-4">
        {visible.map((s, i) => (
          <motion.div
            key={`${s.name}-${s.city}`}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.3, delay: (i % 9) * 0.04 }}
            className="glass rounded-2xl p-5 flex flex-col gap-3"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-bold text-base leading-snug">{s.name}</p>
                {s.jp && <p className="text-xs text-slate-500 font-[Noto_Serif_JP] mt-0.5">{s.jp}</p>}
              </div>
              <span className="shrink-0 text-xl leading-none">{KIND_EMOJI[s.kind] ?? "🎮"}</span>
            </div>

            <div className="flex flex-wrap gap-1.5 text-[0.65rem]">
              <span className="bg-violet-500/15 text-violet-300 border border-violet-500/25 rounded-full px-2 py-0.5 font-semibold">
                {s.kind}
              </span>
              <span className="bg-white/8 text-slate-400 border border-white/10 rounded-full px-2 py-0.5 font-semibold">
                📍 {s.city} · {s.area}
              </span>
            </div>

            <p className="text-sm text-slate-300 leading-relaxed flex-1">{s.why}</p>

            <div className="flex items-start gap-1.5 text-xs text-slate-500">
              <Wallet size={11} className="mt-0.5 shrink-0 text-emerald-400/70" />
              <span>{s.cost}</span>
            </div>

            <div className="rounded-xl bg-violet-500/[0.07] border border-violet-500/15 px-3 py-2">
              <p className="text-[0.68rem] font-bold text-violet-300 uppercase tracking-wide mb-1">Pro tip</p>
              <p className="text-xs text-slate-400 leading-relaxed">{s.protip}</p>
            </div>
          </motion.div>
        ))}
        {results.length === 0 && (
          <div className="col-span-full text-center py-16 text-slate-500 text-sm">
            No spots match — try a different filter.
          </div>
        )}
      </div>

      {hasMore && (
        <div className="mb-12 text-center">
          <button
            type="button"
            onClick={() => setPage((p) => p + 1)}
            className="px-6 py-3 rounded-xl glass text-sm font-semibold text-slate-300 hover:text-white hover:bg-white/10 transition-colors min-h-[48px]"
          >
            Show {Math.min(PAGE_SIZE, results.length - visible.length)} more spots
          </button>
        </div>
      )}

      {!hasMore && results.length > 0 && <div className="mb-12" />}

      {/* Crane School */}
      <div className="mb-4">
        <p className="text-violet-400 font-semibold tracking-[0.25em] uppercase text-xs mb-2">Field Manual</p>
        <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Crane Game School</h2>
        <p className="text-slate-400 mt-2 text-sm">Win the Snorlax. Earn the right to carry it for 14 days.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {CRANE_SCHOOL.map((tip, i) => (
          <motion.div
            key={tip.title}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.3, delay: (i % 9) * 0.04 }}
            className="glass rounded-2xl p-4 border border-white/5"
          >
            <p className="font-bold text-sm leading-snug mb-1.5 text-slate-100">{tip.title}</p>
            <p className="text-xs text-slate-400 leading-relaxed">{tip.body}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
