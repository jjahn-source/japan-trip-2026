import { motion } from "motion/react";
import { CheckCircle2, Circle } from "lucide-react";
import { PACKING } from "../data/packing";
import { SectionHeading } from "./SectionHeading";
import { useLocalStorage } from "../hooks/useLocalStorage";

export function Packing() {
  const [checked, setChecked] = useLocalStorage<Record<string, boolean>>("packing-checked", {});
  const total = PACKING.reduce((s, g) => s + g.items.length, 0);
  const done = PACKING.reduce((s, g) => s + g.items.filter((i) => checked[i.id]).length, 0);
  const pct = Math.round((done / total) * 100);

  return (
    <section id="packing" className="section-pad py-24">
      <SectionHeading
        kicker="December-Proof"
        title="Packing Checklist"
        sub="Cold days, hot trains, naked onsen. Tick items off — progress saves on this device."
      />

      <div className="glass rounded-2xl p-4 mb-6 flex items-center gap-4">
        <div className="flex-1 h-3 rounded-full bg-white/10 overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-rose-500 to-fuchsia-500"
            animate={{ width: `${pct}%` }}
            transition={{ type: "spring", stiffness: 80, damping: 20 }}
          />
        </div>
        <span className="font-bold tabular-nums text-sm">
          {done}/{total} · {pct}%
        </span>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {PACKING.map((g, gi) => (
          <motion.div
            key={g.group}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.35, delay: (gi % 2) * 0.07 }}
            className="glass rounded-2xl p-5"
          >
            <h3 className="font-extrabold text-lg mb-3">
              {g.emoji} {g.group}
            </h3>
            <ul className="space-y-1">
              {g.items.map((it) => {
                const isOn = !!checked[it.id];
                return (
                  <li key={it.id}>
                    <button
                      onClick={() => setChecked({ ...checked, [it.id]: !isOn })}
                      className="w-full flex items-start gap-2.5 text-left rounded-lg px-2 py-2 hover:bg-white/[0.05] transition-colors"
                    >
                      {isOn ? (
                        <CheckCircle2 size={18} className="text-emerald-400 shrink-0 mt-0.5" />
                      ) : (
                        <Circle size={18} className="text-slate-500 shrink-0 mt-0.5" />
                      )}
                      <span>
                        <span className={`font-medium text-sm ${isOn ? "line-through text-slate-500" : ""}`}>
                          {it.label}
                        </span>
                        {it.note && (
                          <span className="block text-xs text-slate-500 mt-0.5">{it.note}</span>
                        )}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
