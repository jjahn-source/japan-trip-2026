import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronDown, MapPin, Tag, Lightbulb } from "lucide-react";
import { SHOP } from "../data/shopping";
import { SectionHeading } from "./SectionHeading";
import { slugify } from "../utils/nav";

function Accordion({
  title,
  emoji,
  children,
  defaultOpen = false,
}: {
  title: string;
  emoji?: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="glass rounded-2xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-3 p-4 sm:p-5 text-left hover:bg-white/[0.03] transition-colors"
      >
        <span className="font-bold sm:text-lg">
          {emoji && <span className="mr-2">{emoji}</span>}
          {title}
        </span>
        <ChevronDown
          size={18}
          className={`shrink-0 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <div className="px-4 sm:px-5 pb-5">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const CITY_STYLE: Record<string, string> = {
  Tokyo: "bg-rose-500/20 text-rose-300 border-rose-500/30",
  Osaka: "bg-violet-500/20 text-violet-300 border-violet-500/30",
  Kyoto: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  All: "bg-slate-500/20 text-slate-300 border-slate-500/30",
};

export function ShopView() {
  return (
    <div className="section-pad py-24 pt-32">
      <SectionHeading
        kicker="What to Buy"
        title="The Shopping Dossier"
        sub="Electronics, anime merch, drugstore hauls, omiyage, and the complete tax-free playbook — everything worth money in Japan."
      />

      <div className="space-y-4">
        {SHOP.map((cat, ci) => (
          <motion.div
            key={cat.id}
            id={`shop-${cat.id}`}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-30px" }}
            transition={{ duration: 0.35, delay: ci * 0.04 }}
            className="scroll-mt-28"
          >
            <Accordion title={cat.title} emoji={cat.emoji} defaultOpen={ci === 0}>
              <p className="text-sm text-slate-400 leading-relaxed mb-5 border-l-2 border-rose-500/30 pl-3">
                {cat.intro}
              </p>

              <div className="space-y-4">
                {cat.items.map((item, ii) => (
                  <motion.div
                    key={ii}
                    id={`shop-item-${slugify(item.name)}`}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: ii * 0.03 }}
                    className="rounded-xl border border-white/10 bg-white/[0.03] p-4 scroll-mt-28"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                      <h3 className="font-bold text-slate-100 leading-tight">{item.name}</h3>
                      <span
                        className={`shrink-0 text-[0.62rem] font-bold border rounded-full px-2 py-0.5 ${CITY_STYLE[item.city] ?? CITY_STYLE.All}`}
                      >
                        {item.city}
                      </span>
                    </div>

                    <p className="text-sm text-slate-400 leading-relaxed mb-3">{item.what}</p>

                    <div className="flex flex-col gap-1.5">
                      <p className="flex items-start gap-1.5 text-xs text-indigo-200/90">
                        <MapPin size={11} className="mt-0.5 shrink-0 text-indigo-400" />
                        {item.where}
                      </p>

                      {item.price && (
                        <p className="flex items-center gap-1.5 text-xs text-amber-200/90">
                          <Tag size={11} className="shrink-0 text-amber-400" />
                          {item.price}
                        </p>
                      )}

                      {item.tip && (
                        <p className="flex items-start gap-1.5 text-xs text-emerald-200/90 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-2.5 py-2 mt-1">
                          <Lightbulb size={11} className="mt-0.5 shrink-0 text-emerald-400" />
                          {item.tip}
                        </p>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </Accordion>
          </motion.div>
        ))}
      </div>

      {/* Tax-free quick-ref */}
      <div className="mt-16 glass rounded-2xl border border-amber-500/20 bg-amber-500/5 p-6">
        <h3 className="font-bold text-amber-300 mb-3">Tax-free quick-ref</h3>
        <div className="grid sm:grid-cols-2 gap-3 text-sm text-slate-300">
          <div className="space-y-1.5">
            <p className="font-semibold text-slate-200">To qualify:</p>
            <ul className="space-y-1 text-slate-400">
              <li>• Spend ¥5,000+ at one store, one day</li>
              <li>• Show your physical passport (not a photo)</li>
              <li>• Look for 「免税」 or "Tax-Free" signage</li>
              <li>• Say: <em className="text-rose-300">Menzei dekimasu ka?</em></li>
            </ul>
          </div>
          <div className="space-y-1.5">
            <p className="font-semibold text-slate-200">At the airport (Dec 29):</p>
            <ul className="space-y-1 text-slate-400">
              <li>• Keep tax-free goods accessible — customs may check</li>
              <li>• US duty-free limit: $800/person</li>
              <li>• Above $800: 3% duty on the next $1,000</li>
              <li>• Declare everything on the CBP form</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
