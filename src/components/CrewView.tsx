import { motion } from "motion/react";
import { FACTION_WARS, TRIP_BINGO, AWARDS_CEREMONY, DAILY_RITUALS } from "../data/challenges";
import { SectionHeading } from "./SectionHeading";
import { Collapse } from "./ui/Collapse";
import { useLocalStorage } from "../hooks/useLocalStorage";

export type CrewTab = "wars" | "bingo" | "awards" | "rituals";

function WarsSection() {
  return (
    <section className="section-pad pt-32 pb-16 sm:pb-24">
      <SectionHeading
        kicker="Standing Competitions"
        title="The Faction Wars"
        sub={`${FACTION_WARS.length} running contests across 16 days. Some are scored, some are logged, all are serious.`}
      />
      <div className="grid gap-4 md:grid-cols-2">
        {FACTION_WARS.map((f, i) => (
          <motion.div
            key={f.title}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: Math.min(i * 0.03, 0.4) }}
            className="glass rounded-2xl p-5 flex flex-col gap-3"
          >
            <div className="flex items-start gap-3">
              <span className="text-3xl shrink-0 leading-none mt-0.5">{f.emoji}</span>
              <div>
                <h3 className="font-bold text-base leading-tight">{f.title}</h3>
                <p className="text-xs text-violet-300/80 font-semibold mt-1">{f.sides}</p>
              </div>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">{f.rules}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function BingoSection() {
  const [checked, setChecked] = useLocalStorage<Record<number, boolean>>("bingo-state", {});
  const total = TRIP_BINGO.length;
  const count = Object.values(checked).filter(Boolean).length;
  const toggle = (i: number) => setChecked({ ...checked, [i]: !checked[i] });

  return (
    <section className="section-pad pt-32 pb-16 sm:pb-24">
      <SectionHeading
        kicker="Check 'em Off"
        title="Trip Bingo"
        sub="Complete these over 16 days. ⭐ = hard mode. Persists on your device."
      />
      <div className="flex items-center justify-between mb-5 -mt-4">
        <span className="text-sm font-bold text-violet-300">{count} / {total}</span>
        <button
          onClick={() => setChecked({})}
          className="text-xs text-slate-500 hover:text-rose-300 transition-colors"
        >
          Reset all
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {TRIP_BINGO.map((sq, i) => (
          <button
            key={i}
            onClick={() => toggle(i)}
            className={`flex items-start gap-3 rounded-xl px-3.5 py-3 text-left border transition-colors ${
              checked[i]
                ? "bg-violet-500/15 border-violet-500/30"
                : "glass border-white/8 hover:bg-white/8"
            }`}
          >
            <span className={`shrink-0 mt-0.5 w-4 h-4 rounded border flex items-center justify-center transition-colors ${
              checked[i]
                ? "bg-violet-500 border-violet-400"
                : "border-white/20 bg-white/5"
            }`}>
              {checked[i] && <span className="text-white text-[0.6rem] font-bold leading-none">✓</span>}
            </span>
            <span className={`text-sm leading-snug flex-1 ${checked[i] ? "line-through text-slate-500" : ""}`}>
              {sq.text}
            </span>
            {sq.hard && <span className="shrink-0 text-xs leading-relaxed">⭐</span>}
          </button>
        ))}
      </div>
    </section>
  );
}

function AwardsSection() {
  return (
    <section className="section-pad pt-32 pb-16 sm:pb-24">
      <SectionHeading
        kicker="Farewell Yakiniku · Dec 28"
        title="Awards Ceremony"
        sub={`${AWARDS_CEREMONY.length} awards. Voted at the farewell yakiniku in Osaka. Prepare your speech.`}
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {AWARDS_CEREMONY.map((a, i) => (
          <motion.div
            key={a.name}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: Math.min(i * 0.03, 0.4) }}
            className="glass rounded-2xl p-5 flex flex-col gap-2"
          >
            <span className="text-3xl leading-none">{a.emoji}</span>
            <h3 className="font-bold leading-tight">{a.name}</h3>
            <p className="text-sm text-slate-400 leading-relaxed flex-1">{a.criteria}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function RitualsSection() {
  return (
    <section className="section-pad pt-32 pb-16 sm:pb-24">
      <SectionHeading
        kicker="Every Single Day"
        title="Daily Rituals"
        sub={`${DAILY_RITUALS.length} standing crew protocols. Not optional — they're the trip infrastructure.`}
      />
      <div className="space-y-2">
        {DAILY_RITUALS.map((r) => (
          <Collapse
            key={r.title}
            className="glass rounded-2xl overflow-hidden"
            headerClassName="px-4 sm:px-5 py-4 hover:bg-white/[0.03] transition-colors"
            bodyClassName="px-4 sm:px-5 pb-4"
            title={
              <span className="font-bold">
                <span className="mr-2">{r.emoji}</span>{r.title}
              </span>
            }
          >
            <p className="text-sm text-slate-400 leading-relaxed">{r.body}</p>
          </Collapse>
        ))}
      </div>
    </section>
  );
}

export function CrewView({ tab }: { tab: CrewTab }) {
  if (tab === "wars")   return <WarsSection />;
  if (tab === "bingo")  return <BingoSection />;
  if (tab === "awards") return <AwardsSection />;
  return <RitualsSection />;
}
