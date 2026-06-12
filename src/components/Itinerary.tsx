import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronDown, Train, Ticket } from "lucide-react";
import { DAYS, type Day } from "../data/itinerary";
import { SectionHeading } from "./SectionHeading";

function fmtDate(iso: string) {
  return new Date(iso + "T00:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function DayCard({ day, index }: { day: Day; index: number }) {
  const [open, setOpen] = useState(index === 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.4 }}
      className="glass rounded-2xl overflow-hidden"
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-4 p-4 sm:p-5 text-left hover:bg-white/[0.03] transition-colors"
      >
        <div
          className={`shrink-0 w-14 h-14 rounded-xl bg-gradient-to-br ${day.theme} flex flex-col items-center justify-center font-bold shadow-lg`}
        >
          <span className="text-[0.6rem] uppercase opacity-90">{day.dow}</span>
          <span className="text-sm leading-tight">{fmtDate(day.date)}</span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-xs text-slate-400 font-semibold uppercase tracking-wider">
            <span>Day {index + 1}</span>
            <span>·</span>
            <span>
              {day.city} <span className="font-[Noto_Serif_JP]">{day.cityJp}</span>
            </span>
          </div>
          <h3 className="font-bold text-lg sm:text-xl truncate">
            {day.emoji} {day.title}
          </h3>
        </div>
        <ChevronDown
          size={20}
          className={`shrink-0 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="px-4 sm:px-5 pb-5 pt-1">
              {day.transport && (
                <div className="mb-4 flex items-start gap-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 p-3 text-sm text-indigo-200">
                  <Train size={16} className="mt-0.5 shrink-0" />
                  <span>{day.transport}</span>
                </div>
              )}
              <ul className="space-y-3">
                {day.activities.map((a, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="shrink-0 w-16 text-right text-xs font-bold text-rose-300/90 pt-0.5 tabular-nums">
                      {a.time}
                    </span>
                    <div className="relative pl-4 border-l border-white/10 pb-0.5">
                      <span className="absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full bg-gradient-to-br from-rose-400 to-fuchsia-500" />
                      <p className="font-semibold leading-snug flex items-center gap-2 flex-wrap">
                        {a.title}
                        {a.booking && (
                          <span className="inline-flex items-center gap-1 text-[0.65rem] font-bold uppercase tracking-wide bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full px-2 py-0.5">
                            <Ticket size={10} /> book ahead
                          </span>
                        )}
                      </p>
                      {a.note && <p className="text-sm text-slate-400 mt-0.5">{a.note}</p>}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export function Itinerary() {
  return (
    <section id="itinerary" className="section-pad py-24">
      <SectionHeading
        kicker="The Master Plan"
        title="16 Days, Day by Day"
        sub="Tokyo lights → Hakone onsen → Kyoto temples → Nara deer → Osaka chaos → Hiroshima reflection → one last Tokyo lap. Tap any day to expand."
      />
      <div className="space-y-3">
        {DAYS.map((d, i) => (
          <DayCard key={d.date} day={d} index={i} />
        ))}
      </div>
    </section>
  );
}
