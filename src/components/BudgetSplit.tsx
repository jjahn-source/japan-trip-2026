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

export function BudgetSplit() {
  const { splits, toggle, paidCount } = useSplits();
  const myName = getIdentityName() as CrewMember | null;

  if (!FIREBASE_ENABLED) return null;

  const totalPP = SPLIT_ITEMS.reduce((s, item) => s + item.ppUSD, 0);

  return (
    <section id="budget-split" className="section-pad py-16">
      <SectionHeading
        kicker="Money"
        title="Who's Paid JJ Back"
        sub={`~$${totalPP}/person across ${SPLIT_ITEMS.length} group expenses · tap your name when you've settled up`}
      />
      <div className="space-y-3">
        {SPLIT_ITEMS.map((item) => {
          const paid = paidCount(item.id);
          const allPaid = paid === CREW.length;
          return (
            <div key={item.id} className={`glass rounded-2xl p-4 border ${allPaid ? "border-emerald-500/30" : "border-white/5"}`}>
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <p className="font-semibold text-sm">{item.label}</p>
                  {item.note && <p className="text-xs text-slate-500 mt-0.5">{item.note}</p>}
                </div>
                <div className="text-right shrink-0">
                  <p className="text-emerald-400 font-bold text-sm">${item.ppUSD}/pp</p>
                  <p className={`text-xs font-semibold tabular-nums mt-0.5 ${allPaid ? "text-emerald-400" : "text-slate-500"}`}>
                    {paid}/{CREW.length} paid
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {CREW.map((member) => {
                  const hasPaid = splits[item.id]?.[member] ?? false;
                  const isMe = member === myName;
                  return (
                    <button
                      key={member}
                      type="button"
                      disabled={!isMe}
                      onClick={() => isMe && toggle(item.id, member)}
                      title={
                        isMe
                          ? hasPaid ? "Mark as unpaid" : "Mark as paid"
                          : `${member}: ${hasPaid ? "paid ✓" : "not yet"}`
                      }
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold transition-colors border ${
                        hasPaid
                          ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300"
                          : "bg-white/5 border-white/10 text-slate-500"
                      } ${isMe ? "cursor-pointer hover:opacity-80" : "cursor-default"}`}
                    >
                      {hasPaid && <Check size={10} />}
                      {INITIALS[member] ?? member}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
