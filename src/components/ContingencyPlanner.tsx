import { Cloud, Zap, AlertCircle } from "lucide-react";
import { CONTINGENCIES } from "../data/contingencies";
import { DAYS } from "../data/itinerary";
import { SectionHeading } from "./SectionHeading";

export function ContingencyPlanner() {
  const today = new Date().toISOString().split("T")[0];

  const currentDay = DAYS.find((d) => d.date === today);
  const dayIndex = DAYS.findIndex((d) => d.date === today);
  const contingency = CONTINGENCIES.find((c) => c.date === today);

  if (!currentDay || dayIndex < 0 || !contingency) {
    return (
      <section className="section-pad py-24">
        <SectionHeading kicker="Flexibility" title="No contingency plan today" sub="Enjoy!" />
      </section>
    );
  }

  return (
    <section className="section-pad py-24">
      <SectionHeading
        kicker="Flexibility"
        title={`Day ${dayIndex + 1} Pivot Plans`}
        sub={`${contingency.location} — If weather/energy changes, here's Plan B`}
      />

      <div className="space-y-4">
        {/* Rain Plan */}
        <div className="glass rounded-2xl border border-cyan-500/30 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Cloud size={20} className="text-cyan-400" />
            <h3 className="font-bold text-lg">If it rains</h3>
          </div>
          <p className="text-xs text-slate-400 mb-4">
            Switch to these indoor/covered alternatives (no reservations needed):
          </p>
          <ul className="space-y-2">
            {contingency.rainPlan.map((plan, i) => (
              <li key={i} className="flex gap-3 p-3 bg-cyan-500/10 rounded-lg">
                <span className="text-cyan-400 shrink-0">🏠</span>
                <span className="text-sm text-slate-200">{plan}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Energy Slump Plan */}
        <div className="glass rounded-2xl border border-amber-500/30 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Zap size={20} className="text-amber-400" />
            <h3 className="font-bold text-lg">If energy crashes</h3>
          </div>
          <p className="text-xs text-slate-400 mb-4">
            Crew is tired — scale back. These are OK to skip:
          </p>
          <ul className="space-y-2">
            {contingency.energySlumpPlan.map((plan, i) => (
              <li key={i} className="flex gap-3 p-3 bg-amber-500/10 rounded-lg">
                <span className="text-amber-400 shrink-0">😴</span>
                <span className="text-sm text-slate-200">{plan}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Last-Minute Cancellation */}
        <div className="glass rounded-2xl border border-rose-500/30 p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle size={20} className="text-rose-400" />
            <h3 className="font-bold text-lg">If something cancels</h3>
          </div>
          <p className="text-xs text-slate-400 mb-4">
            A reservation falls through — pivot to these:
          </p>
          <ul className="space-y-2">
            {contingency.lastMinuteCancellation.map((plan, i) => (
              <li key={i} className="flex gap-3 p-3 bg-rose-500/10 rounded-lg">
                <span className="text-rose-400 shrink-0">🔄</span>
                <span className="text-sm text-slate-200">{plan}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Key Principle */}
      <div className="mt-8 glass rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-6">
        <p className="text-sm text-emerald-300 leading-relaxed">
          <strong>Contingency philosophy:</strong> The itinerary is a guide, not law. If weather, energy,
          or circumstances change, pivot. The goal is 16 days of actual joy, not 16 days of grinding
          through a checklist. Have this page open when something changes.
        </p>
      </div>
    </section>
  );
}
