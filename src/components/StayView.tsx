import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ExternalLink, ChevronDown, ChevronUp } from "lucide-react";
import { STAY_LEGS, COMBO_NOTES, GROUP, BUDGET_CAP_PP, FX_NOTE } from "../data/stays";
import { SectionHeading } from "./SectionHeading";
import type { StayOption } from "../data/stays";

function OptionCard({ opt, isDefault }: { opt: StayOption; isDefault: boolean }) {
  const ppCost = Math.round(opt.totalUSD / GROUP);
  return (
    <div
      className={`glass rounded-xl p-4 border ${
        isDefault ? "border-amber-400/40 bg-amber-500/5" : "border-white/10"
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0">
          <span className="font-bold text-sm leading-snug">{opt.name}</span>
          <p className="text-slate-400 text-xs mt-0.5">{opt.area}</p>
        </div>
        {isDefault && (
          <span className="shrink-0 text-[0.62rem] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300">
            Budget Lock
          </span>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-300 mb-2">
        <span>{opt.rating}</span>
        <span className="text-slate-600">·</span>
        <span>{opt.beds}</span>
        <span className="text-slate-600">·</span>
        <span className="text-emerald-400 font-semibold">${ppCost}/pp</span>
      </div>

      <p className="text-xs text-slate-400 mb-2">{opt.walk}</p>

      <div className="flex flex-wrap gap-1.5 mb-3">
        {opt.tags.map((tag) => (
          <span
            key={tag}
            className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-slate-300 font-medium"
          >
            {tag}
          </span>
        ))}
      </div>

      <p className="text-xs text-slate-500 italic mb-3">{opt.note}</p>

      <a
        href={opt.url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-300 hover:text-indigo-200 transition-colors"
      >
        View on Airbnb <ExternalLink size={12} />
      </a>
    </div>
  );
}

export function StayView() {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  return (
    <section id="stays" className="section-pad py-24">
      <SectionHeading
        kicker="Accommodations"
        title="Where We're Staying"
        sub={`${GROUP} people · 3 bases · 14 nights · ≤$${BUDGET_CAP_PP}/person target`}
      />

      <div className="space-y-8 mb-12">
        {STAY_LEGS.map((leg, li) => {
          const defaultOpt = leg.options.find((o) => o.id === leg.defaultPick)!;
          const otherOpts = leg.options.filter((o) => o.id !== leg.defaultPick);
          const isOpen = !!expanded[leg.id];

          return (
            <motion.div
              key={leg.id}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.4, delay: li * 0.08 }}
              className="glass rounded-2xl p-6"
            >
              <div className="flex items-start justify-between gap-4 mb-1">
                <div>
                  <h3 className="text-xl font-extrabold">
                    {leg.emoji} {leg.city}
                    <span className="text-slate-500 font-normal text-base ml-2">{leg.cityJp}</span>
                  </h3>
                  <p className="text-sm text-slate-400 mt-0.5">
                    {leg.dates} · {leg.nights} nights
                  </p>
                </div>
                <a
                  href={leg.searchUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 inline-flex items-center gap-1.5 text-xs font-semibold text-rose-300 hover:text-rose-200 transition-colors border border-rose-500/30 rounded-full px-3 py-1.5"
                >
                  Check live prices <ExternalLink size={11} />
                </a>
              </div>
              <p className="text-sm text-slate-400 mb-5 max-w-2xl">{leg.brief}</p>

              <OptionCard opt={defaultOpt} isDefault />

              <button
                type="button"
                onClick={() => setExpanded((prev) => ({ ...prev, [leg.id]: !isOpen }))}
                className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors"
              >
                {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                {isOpen ? "Hide alternatives" : `Show ${otherOpts.length} more options`}
              </button>

              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="grid gap-3 mt-3 sm:grid-cols-2">
                      {otherOpts.map((opt) => (
                        <OptionCard key={opt.id} opt={opt} isDefault={false} />
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {COMBO_NOTES.map((note, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-20px" }}
            transition={{ duration: 0.35, delay: i * 0.06 }}
            className="glass rounded-xl p-4 text-sm text-slate-400 leading-relaxed"
          >
            {note}
          </motion.div>
        ))}
      </div>

      <p className="mt-4 text-xs text-slate-600 leading-relaxed max-w-3xl">{FX_NOTE}</p>
    </section>
  );
}
