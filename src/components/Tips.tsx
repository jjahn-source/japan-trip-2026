import { motion } from "motion/react";
import { TIPS } from "../data/tips";
import { SectionHeading } from "./SectionHeading";

export function Tips() {
  return (
    <section id="tips" className="section-pad py-24">
      <SectionHeading
        kicker="Travel Like a Local"
        title="Field Notes & Tactics"
        sub="The stuff that separates a smooth trip from eight people standing confused in Shinjuku Station."
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {TIPS.map((t, i) => (
          <motion.div
            key={t.title}
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-30px" }}
            transition={{ duration: 0.35, delay: (i % 3) * 0.06 }}
            className="glass rounded-2xl p-5 hover:bg-white/[0.07] transition-colors"
          >
            <div className="text-2xl mb-2">{t.emoji}</div>
            <h3 className="font-bold mb-1.5">{t.title}</h3>
            <p className="text-sm text-slate-400 leading-relaxed">{t.body}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
