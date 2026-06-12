import { motion } from "motion/react";
import { Users } from "lucide-react";
import { FOOD } from "../data/food";
import { SectionHeading } from "./SectionHeading";

export function Food() {
  return (
    <section id="food" className="section-pad py-24">
      <SectionHeading
        kicker="Eat Everything"
        title="The Food Hit List"
        sub="Every city has a specialty and we're not skipping any of them. Group-of-8 tactics included."
      />
      <div className="space-y-10">
        {FOOD.map((cf) => (
          <div key={cf.city}>
            <motion.h3
              initial={{ opacity: 0, x: -16 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4 }}
              className="text-xl sm:text-2xl font-extrabold mb-4 flex items-center gap-2"
            >
              <span>{cf.emoji}</span>
              <span className={`bg-gradient-to-r ${cf.accent} bg-clip-text text-transparent`}>
                {cf.city}
              </span>
            </motion.h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {cf.items.map((f, i) => (
                <motion.div
                  key={f.dish}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-30px" }}
                  transition={{ duration: 0.35, delay: (i % 3) * 0.06 }}
                  className="glass rounded-2xl p-5 hover:bg-white/[0.07] transition-colors"
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <h4 className="font-bold">{f.dish}</h4>
                    <span className="text-slate-500 text-sm font-[Noto_Serif_JP]">{f.jp}</span>
                  </div>
                  <p className="mt-1 text-xs font-semibold text-rose-300">{f.where}</p>
                  <p className="mt-2 text-sm text-slate-400">{f.why}</p>
                  {f.groupTip && (
                    <p className="mt-3 flex items-start gap-1.5 text-xs text-emerald-300/90 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-2.5 py-1.5">
                      <Users size={12} className="mt-0.5 shrink-0" />
                      {f.groupTip}
                    </p>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
