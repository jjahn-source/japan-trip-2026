import { useMemo } from "react";
import { motion } from "motion/react";
import { RotateCcw } from "lucide-react";
import { BUDGET_ITEMS } from "../data/budget";
import { GROUP_SIZE } from "../data/itinerary";
import { SectionHeading } from "./SectionHeading";
import { useLocalStorage } from "../hooks/useLocalStorage";

const fmt = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

export function Budget() {
  const [amounts, setAmounts] = useLocalStorage<Record<string, number>>("budget-amounts", {});

  const rows = useMemo(
    () =>
      BUDGET_ITEMS.map((it) => ({
        ...it,
        value: amounts[it.id] ?? it.perPersonUSD,
      })),
    [amounts],
  );

  const perPerson = rows.reduce((s, r) => s + r.value, 0);
  const max = Math.max(...rows.map((r) => r.value));

  return (
    <section id="budget" className="section-pad py-24">
      <SectionHeading
        kicker="The Damage"
        title="Budget Estimator"
        sub="Per-person baseline at ¥150/$. Drag the sliders to match your style — edits save automatically."
      />

      <div className="grid lg:grid-cols-[1fr_20rem] gap-6 items-start">
        <div className="glass rounded-2xl p-5 sm:p-6 space-y-5">
          {rows.map((r) => (
            <div key={r.id}>
              <div className="flex items-baseline justify-between gap-3 mb-1.5">
                <span className="font-semibold text-sm sm:text-base">
                  {r.emoji} {r.label}
                </span>
                <span className="font-bold tabular-nums text-rose-300">{fmt(r.value)}</span>
              </div>
              <input
                type="range"
                min={0}
                max={Math.max(2000, r.perPersonUSD * 2)}
                step={10}
                value={r.value}
                onChange={(e) =>
                  setAmounts({ ...amounts, [r.id]: Number(e.target.value) })
                }
                className="w-full accent-rose-500"
                aria-label={r.label}
              />
              <div className="flex justify-between items-center mt-1">
                <p className="text-xs text-slate-500 pr-4">{r.note}</p>
                <div className="h-1 rounded-full bg-gradient-to-r from-rose-500 to-fuchsia-500 shrink-0" style={{ width: `${(r.value / max) * 60}px` }} />
              </div>
            </div>
          ))}
          <button
            onClick={() => setAmounts({})}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
          >
            <RotateCcw size={12} /> Reset to baseline
          </button>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45 }}
          className="glass rounded-2xl p-6 lg:sticky lg:top-24 text-center"
        >
          <p className="text-xs uppercase tracking-[0.25em] text-slate-400 font-semibold">
            Per person
          </p>
          <p className="mt-2 text-5xl font-black bg-gradient-to-r from-rose-400 to-fuchsia-400 bg-clip-text text-transparent tabular-nums">
            {fmt(perPerson)}
          </p>
          <div className="my-5 h-px bg-white/10" />
          <p className="text-xs uppercase tracking-[0.25em] text-slate-400 font-semibold">
            Whole crew ({GROUP_SIZE})
          </p>
          <p className="mt-2 text-3xl font-extrabold tabular-nums">{fmt(perPerson * GROUP_SIZE)}</p>
          <p className="mt-5 text-xs text-slate-500 leading-relaxed">
            ~{fmt(perPerson / 16)}/person/day all-in. Pro tip: open a shared
            Splitwise group on day one and settle in yen.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
