import { Check } from "lucide-react";
import { SPLIT_ITEMS } from "../data/splits";
import { useSplits } from "../hooks/useSplits";
import { CREW, type CrewMember, getIdentityName } from "../hooks/useIdentity";
import { FIREBASE_ENABLED } from "../lib/firebase";
import { SectionHeading } from "./SectionHeading";

const INITIALS: Record<string, string> = {
  JJ: "JJ", Ethan: "ET", Steven: "SV", Alex: "AL",
  Charlie: "CH", Kaishun: "KS", Daniel: "DA", Junha: "JH",
};

const TOTAL_PP = SPLIT_ITEMS.reduce((s, i) => s + i.ppUSD, 0);

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
