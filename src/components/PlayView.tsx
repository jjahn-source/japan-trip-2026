import { motion } from "motion/react";
import { Wallet, Lightbulb, Trophy } from "lucide-react";
import { PLAY_SPOTS, CRANE_SCHOOL } from "../data/otaku";
import { FACTION_WARS, TRIP_BINGO, AWARDS_CEREMONY, DAILY_RITUALS } from "../data/challenges";
import { SectionHeading } from "./SectionHeading";
import { useLocalStorage } from "../hooks/useLocalStorage";

export function PlayView() {
  const [bingo, setBingo] = useLocalStorage<Record<number, boolean>>("trip-bingo", {});
  const hit = TRIP_BINGO.filter((_, i) => bingo[i]).length;

  return (
    <div className="section-pad py-24 pt-32">
      <SectionHeading
        kicker="遊び · Asobi"
        title="Games, Arcades & The Standing Competitions"
        sub="The anti-boredom layer: where to play in every city, how to actually beat crane games, and the trip-long wars that keep all 16 days competitive."
      />

      {/* Daily rituals */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-16">
        {DAILY_RITUALS.map((r, i) => (
          <motion.div
            key={r.title}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-30px" }}
            transition={{ duration: 0.3, delay: (i % 3) * 0.05 }}
            className="glass rounded-2xl p-5"
          >
            <div className="text-2xl mb-2">{r.emoji}</div>
            <h3 className="font-bold mb-1.5">{r.title}</h3>
            <p className="text-sm text-slate-400 leading-relaxed">{r.body}</p>
          </motion.div>
        ))}
      </div>

      {/* Trip bingo */}
      <div className="mb-16">
        <SectionHeading
          kicker="The Card"
          title="Trip Bingo"
          sub={`${hit}/${TRIP_BINGO.length} squares claimed — tap to mark. Hard-mode squares glow. Full card = the crew owes you a wagyu dinner in 2027.`}
        />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
          {TRIP_BINGO.map((sq, i) => {
            const done = !!bingo[i];
            return (
              <button
                key={sq.text}
                onClick={() => setBingo({ ...bingo, [i]: !done })}
                className={`rounded-xl p-3 text-left text-xs font-semibold leading-snug border transition-all ${
                  done
                    ? "bg-emerald-500/20 border-emerald-400/50 text-emerald-200 line-through"
                    : sq.hard
                      ? "glass border-fuchsia-500/40 text-fuchsia-200 hover:bg-fuchsia-500/10"
                      : "glass border-transparent text-slate-300 hover:bg-white/10"
                }`}
              >
                {sq.hard && !done && <span className="text-[0.6rem] font-bold text-fuchsia-400 block mb-1">HARD MODE</span>}
                {sq.text}
              </button>
            );
          })}
        </div>
      </div>

      {/* Faction wars */}
      <div className="mb-16">
        <SectionHeading
          kicker="Pick a Side"
          title="The Standing Competitions"
          sub="Six trip-long wars. Scores live in the group chat; honor lives forever."
        />
        <div className="grid gap-4 md:grid-cols-2">
          {FACTION_WARS.map((f) => (
            <div key={f.title} className="glass rounded-2xl p-5">
              <h3 className="font-bold text-lg">
                {f.emoji} {f.title}
              </h3>
              <p className="text-sm font-semibold text-rose-300 mt-1">{f.sides}</p>
              <p className="text-sm text-slate-400 mt-2 leading-relaxed">{f.rules}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Play spots */}
      <div className="mb-16">
        <SectionHeading
          kicker="The Venues"
          title="Arcade & Otaku Atlas"
          sub="Every arcade tower, retro dungeon, gachapon wall and character mothership on our route."
        />
        <div className="grid gap-4 md:grid-cols-2">
          {PLAY_SPOTS.map((s, i) => (
            <motion.article
              key={s.name}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-30px" }}
              transition={{ duration: 0.3, delay: (i % 2) * 0.04 }}
              className="glass rounded-2xl p-5 flex flex-col"
            >
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                {s.city} · {s.area} · {s.kind}
              </p>
              <h3 className="font-bold text-lg leading-tight mt-0.5">
                {s.name}{" "}
                {s.jp && <span className="text-slate-500 text-sm font-[Noto_Serif_JP] font-normal">{s.jp}</span>}
              </h3>
              <p className="mt-2.5 text-sm text-slate-400 leading-relaxed flex-1">{s.why}</p>
              <p className="mt-3 flex items-center gap-1.5 text-xs text-slate-400">
                <Wallet size={12} className="text-slate-500" /> {s.cost}
              </p>
              <p className="mt-2.5 flex items-start gap-1.5 text-xs text-amber-200/90 bg-amber-500/10 border border-amber-500/20 rounded-lg px-2.5 py-2">
                <Lightbulb size={12} className="mt-0.5 shrink-0" />
                {s.protip}
              </p>
            </motion.article>
          ))}
        </div>
      </div>

      {/* Crane game school */}
      <div className="mb-16">
        <SectionHeading
          kicker="UFO Catcher University"
          title="Crane Game School"
          sub="Five lessons that turn ¥1,000 of donations into one (1) legally acquired giant Snorlax."
        />
        <div className="glass rounded-2xl overflow-hidden divide-y divide-white/5">
          {CRANE_SCHOOL.map((t, i) => (
            <div key={t.title} className="p-5 sm:px-6 hover:bg-white/[0.03] transition-colors">
              <h3 className="font-bold">
                <span className="text-rose-400 mr-2">{String(i + 1).padStart(2, "0")}</span>
                {t.title}
              </h3>
              <p className="text-sm text-slate-400 mt-1.5 leading-relaxed">{t.body}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Awards */}
      <div>
        <SectionHeading
          kicker="Dec 28, Farewell Sukiyaki"
          title="The Awards Ceremony"
          sub="Voted over raw-egg-dipped wagyu on the final night. Campaigning is allowed and encouraged."
        />
        <div className="grid gap-4 sm:grid-cols-2">
          {AWARDS_CEREMONY.map((a) => (
            <div key={a.name} className="glass rounded-2xl p-5 flex gap-4">
              <div className="text-3xl shrink-0">{a.emoji}</div>
              <div>
                <h3 className="font-bold flex items-center gap-2">
                  {a.name} <Trophy size={13} className="text-amber-400" />
                </h3>
                <p className="text-sm text-slate-400 mt-1 leading-relaxed">{a.criteria}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
