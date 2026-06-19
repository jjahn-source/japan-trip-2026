import { Check } from "lucide-react";
import { SPLIT_ITEMS } from "../data/splits";
import { BUDGET_ITEMS } from "../data/budget";
import { useSplits } from "../hooks/useSplits";
import { CREW, type CrewMember, getIdentityName } from "../hooks/useIdentity";
import { FIREBASE_ENABLED } from "../lib/firebase";
import { SectionHeading } from "./SectionHeading";

const INITIALS: Record<string, string> = {
  JJ: "JJ", Ethan: "ET", Steven: "SV", Alex: "AL",
  Charlie: "CH", Kaishun: "KS", Daniel: "DA", Junha: "JH",
};

const TOTAL_PP = SPLIT_ITEMS.reduce((s, i) => s + i.ppUSD, 0);
const BUDGET_TOTAL = BUDGET_ITEMS.reduce((s, i) => s + i.perPersonUSD, 0);

export function BudgetSplit() {
  const { settled, toggle, settledCount } = useSplits();
  const myName = getIdentityName() as CrewMember | null;

  if (!FIREBASE_ENABLED) return null;

  const allDone = settledCount === CREW.length;

  return (
    <section id="budget-split" className="section-pad py-16">
      <SectionHeading
        kicker="Money"
        title="Settled Up?"
        sub={`~$${TOTAL_PP}/pp total (Airbnbs · teamLab · USJ · Ghibli · Shibuya Sky · Skytree) · tap your name when you've paid JJ back`}
      />

        <div className="mb-5 glass rounded-2xl p-5 flex items-center justify-between gap-4">
        <div>
          <p className="text-[0.65rem] font-bold uppercase tracking-wide text-slate-500 mb-1">Pre-paid share / person</p>
          <p className="text-3xl font-black text-white">${TOTAL_PP}</p>
          <p className="text-xs text-slate-400 mt-1">
            {SPLIT_ITEMS.length} items &middot; {CREW.length - settledCount} of {CREW.length} still owe JJ
          </p>
        </div>
        <div className="text-right shrink-0 border-l border-white/10 pl-5">
          <p className="text-[0.65rem] font-bold uppercase tracking-wide text-slate-500 mb-1">Full trip est.</p>
          <p className="text-2xl font-bold text-slate-300">${BUDGET_TOTAL.toLocaleString()}</p>
          <p className="text-[0.65rem] text-slate-500 mt-1">per person incl. flights</p>
        </div>
      </div>

      <div className={`glass rounded-2xl p-5 border ${allDone ? "border-emerald-500/30" : "border-white/5"}`}>
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-slate-400">
            <span className={`font-bold text-lg ${allDone ? "text-emerald-400" : "text-slate-100"}`}>
              {settledCount}/{CREW.length}
            </span>
            {" "}settled up
          </p>
          {allDone && (
            <span className="text-xs font-bold text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 rounded-full px-3 py-1">
              everyone's paid ✓
            </span>
          )}
        </div>

        <div className="flex flex-wrap gap-2.5">
          {CREW.map((member) => {
            const hasPaid = settled[member] ?? false;
            const isMe = member === myName;
            return (
              <button
                key={member}
                type="button"
                disabled={!isMe}
                onClick={() => isMe && toggle(member)}
                title={isMe ? (hasPaid ? "Mark as unpaid" : "Mark as paid") : `${member}: ${hasPaid ? "paid ✓" : "hasn't paid yet"}`}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-bold transition-all border ${
                  hasPaid
                    ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300"
                    : "bg-white/5 border-white/10 text-slate-500"
                } ${isMe ? "cursor-pointer hover:scale-105 active:scale-95" : "cursor-default"}`}
              >
                {hasPaid && <Check size={12} />}
                {INITIALS[member] ?? member}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
