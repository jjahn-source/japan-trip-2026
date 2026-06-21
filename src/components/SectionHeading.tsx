import { motion } from "motion/react";

export function SectionHeading({
  kicker,
  title,
  sub,
}: {
  kicker: string;
  title: string;
  sub?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.5 }}
      className="mb-10"
    >
      <p className="text-accent-400 font-semibold tracking-[0.25em] uppercase text-xs mb-2">
        {kicker}
      </p>
      <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight">{title}</h2>
      {sub && <p className="text-slate-400 mt-3 max-w-2xl text-base sm:text-lg">{sub}</p>}
    </motion.div>
  );
}
