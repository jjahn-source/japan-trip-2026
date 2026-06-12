import { motion } from "motion/react";
import { Food } from "./Food";
import { SectionHeading } from "./SectionHeading";
import { DISH_ENCYCLOPEDIA, CHAINS, KONBINI_HALL_OF_FAME } from "../data/eat";

export function EatView() {
  return (
    <div className="pt-8">
      <Food />

      <section className="section-pad pb-24">
        <SectionHeading
          kicker="Order Like You Live There"
          title="Dish Encyclopedia"
          sub="Every major food genre: what it is, how to order it, what it costs."
        />
        <div className="grid gap-4 md:grid-cols-2">
          {DISH_ENCYCLOPEDIA.map((d, i) => (
            <motion.div
              key={d.name}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-30px" }}
              transition={{ duration: 0.3, delay: (i % 2) * 0.05 }}
              className="glass rounded-2xl p-5"
            >
              <div className="flex items-baseline justify-between gap-3">
                <h3 className="font-bold text-lg">
                  {d.name}{" "}
                  <span className="text-slate-500 text-sm font-[Noto_Serif_JP] font-normal">{d.jp}</span>
                </h3>
                <span className="shrink-0 text-xs font-bold text-rose-300">{d.price}</span>
              </div>
              <p className="mt-2 text-sm text-slate-400 leading-relaxed">{d.what}</p>
              <p className="mt-2.5 text-xs text-amber-200/90 bg-amber-500/10 border border-amber-500/20 rounded-lg px-2.5 py-2">
                🎯 {d.order}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="section-pad pb-24">
        <SectionHeading
          kicker="No Shame, Only Strategy"
          title="Chains Worth Your Time"
          sub="Japanese chains are good. Some are great. These earn a spot on a 16-day trip — especially with 8 mouths."
        />
        <div className="glass rounded-2xl overflow-hidden divide-y divide-white/5">
          {CHAINS.map((c) => (
            <div key={c.name} className="p-4 sm:px-6 sm:grid sm:grid-cols-[11rem_1fr] gap-4 hover:bg-white/[0.03] transition-colors">
              <div>
                <h3 className="font-bold">{c.name}</h3>
                <p className="text-xs text-slate-500">{c.what}</p>
              </div>
              <p className="text-sm text-slate-300 mt-1 sm:mt-0">{c.verdict}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="section-pad pb-24">
        <SectionHeading
          kicker="The Daily Pilgrimage"
          title="Konbini Hall of Fame"
          sub="You'll visit a convenience store 30+ times this trip. Spend those visits wisely."
        />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {KONBINI_HALL_OF_FAME.map((k, i) => (
            <motion.div
              key={k.name}
              initial={{ opacity: 0, scale: 0.97 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: "-30px" }}
              transition={{ duration: 0.3, delay: (i % 3) * 0.04 }}
              className="glass rounded-xl p-4"
            >
              <div className="flex items-baseline justify-between gap-2">
                <h3 className="font-bold text-sm">{k.name}</h3>
                <span className="text-[0.65rem] font-bold uppercase tracking-wide text-emerald-300">{k.where}</span>
              </div>
              <p className="mt-1.5 text-xs text-slate-400">{k.note}</p>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}
