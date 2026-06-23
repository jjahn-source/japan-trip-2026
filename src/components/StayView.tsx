import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ExternalLink, ChevronDown, ChevronUp, ThumbsUp } from "lucide-react";
import { STAY_LEGS, COMBO_NOTES, GROUP, BUDGET_CAP_PP, FX_NOTE } from "../data/stays";
import { SectionHeading } from "./SectionHeading";
import { useStayVotes } from "../hooks/useStayVotes";
import { useStayPrices } from "../hooks/useStayPrices";
import { getIdentityName } from "../hooks/useIdentity";
import { FIREBASE_ENABLED } from "../lib/firebase";
import type { StayOption } from "../data/stays";

const CREW_INITIALS: Record<string, string> = {
  JJ: "JJ", Ethan: "ET", Steven: "SV", Alex: "AL",
  Charlie: "CH", Kaishun: "KS", Daniel: "DA", Junha: "JH",
};

function OptionCard({
  opt,
  isDefault,
  votes,
  myName,
  onVote,
  livePrice,
  unavailable,
}: {
  opt: StayOption;
  isDefault: boolean;
  votes: string[];
  myName: string | null;
  onVote: () => void;
  livePrice: number | null;
  unavailable?: boolean;
}) {
  const totalUSD = livePrice ?? opt.totalUSD;
  const ppCost = Math.round(totalUSD / GROUP);
  const voted = myName ? votes.includes(myName) : false;

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
        {unavailable && (
          <span className="shrink-0 text-[0.62rem] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-red-500/20 border border-red-400/40 text-red-400">
            Dates unavailable
          </span>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-300 mb-2">
        <span>{opt.rating}</span>
        <span className="text-slate-600">·</span>
        <span>{opt.beds}</span>
        <span className="text-slate-600">·</span>
        <span className="text-emerald-400 font-semibold">${ppCost}/pp</span>
        {livePrice !== null && (
          <span className="text-[0.6rem] text-emerald-600 font-medium">live</span>
        )}
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

      <div className="flex items-center justify-between gap-3">
        <a
          href={opt.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-300 hover:text-indigo-200 transition-colors"
        >
          View on Airbnb <ExternalLink size={12} />
        </a>

        {FIREBASE_ENABLED && (
          <div className="flex items-center gap-2">
            {votes.length > 0 && (
              <div className="flex items-center gap-0.5">
                {votes.slice(0, 4).map((v) => (
                  <span
                    key={v}
                    className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[0.5rem] font-bold text-slate-300"
                    title={v}
                  >
                    {CREW_INITIALS[v] ?? v.slice(0, 2)}
                  </span>
                ))}
                {votes.length > 4 && (
                  <span className="text-[0.6rem] text-slate-500 ml-0.5">+{votes.length - 4}</span>
                )}
              </div>
            )}
            {myName && (
              <button
                type="button"
                onClick={onVote}
                className={`inline-flex items-center gap-1 text-[0.65rem] font-semibold rounded-full px-2 py-1 border transition-colors ${
                  voted
                    ? "bg-accent-500/20 border-accent-500/40 text-accent-300"
                    : "bg-white/5 border-white/10 text-slate-400 hover:bg-accent-500/10 hover:border-accent-500/20 hover:text-accent-400"
                }`}
                aria-label={voted ? "Remove vote" : "Vote for this place"}
              >
                <ThumbsUp size={10} />
                {voted ? "Voted" : "Vote"}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export function StayView() {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const { getVotes, toggle } = useStayVotes();
  const myName = getIdentityName();
  const { getPrice, isUnavailable, fetchedAt } = useStayPrices();

  return (
    <section id="stays" className="section-pad py-24">
      <SectionHeading
        kicker="Accommodations"
        title="Where We're Staying"
        sub={`${GROUP} people · 3 bases · 14 nights · ≤$${BUDGET_CAP_PP}/person target${fetchedAt ? ` · prices live as of ${new Date(fetchedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}` : ""}`}
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
                  className="shrink-0 inline-flex items-center gap-1.5 text-xs font-semibold text-accent-300 hover:text-accent-200 transition-colors border border-accent-500/30 rounded-full px-3 py-1.5"
                >
                  Check live prices <ExternalLink size={11} />
                </a>
              </div>
              <p className="text-sm text-slate-400 mb-5 max-w-2xl">{leg.brief}</p>

              <OptionCard
                opt={defaultOpt}
                isDefault
                votes={getVotes(leg.id, defaultOpt.id)}
                myName={myName}
                onVote={() => myName && toggle(leg.id, defaultOpt.id, myName)}
                livePrice={getPrice(defaultOpt.id)}
                unavailable={isUnavailable(defaultOpt.id)}
              />

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
                        <OptionCard
                          key={opt.id}
                          opt={opt}
                          isDefault={false}
                          votes={getVotes(leg.id, opt.id)}
                          myName={myName}
                          onVote={() => myName && toggle(leg.id, opt.id, myName)}
                          livePrice={getPrice(opt.id)}
                          unavailable={isUnavailable(opt.id)}
                        />
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
