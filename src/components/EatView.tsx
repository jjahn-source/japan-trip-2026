import { useState } from "react";
import { motion } from "motion/react";
import { ChevronDown, ClipboardCopy } from "lucide-react";
import { Food } from "./Food";
import { SectionHeading } from "./SectionHeading";
import { DISH_ENCYCLOPEDIA, CHAINS, KONBINI_HALL_OF_FAME, REGIONAL_EATS } from "../data/eat";
import { PHRASES, type PhraseGroup, type Phrase } from "../data/phrases";
import { slugify } from "../utils/nav";

const RESTAURANT_PHRASES: PhraseGroup | undefined = PHRASES.find((g) => g.group === "Restaurant");

function RestaurantPhrasesCard() {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState<number | null>(null);

  if (!RESTAURANT_PHRASES) return null;

  function copy(jp: string, idx: number) {
    navigator.clipboard.writeText(jp).then(() => {
      setCopied(idx);
      setTimeout(() => setCopied(null), 1400);
    });
  }

  return (
    <div className="mx-4 sm:mx-0 mb-6 rounded-2xl bg-rose-500/[0.06] border border-rose-500/20 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left"
      >
        <span className="text-sm font-bold text-rose-300 flex items-center gap-2">
          🍜 Order like a local
          <span className="text-[0.65rem] font-normal text-slate-500">{RESTAURANT_PHRASES.phrases.length} phrases · tap to copy</span>
        </span>
        <ChevronDown
          size={16}
          className={`text-slate-500 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div className="border-t border-rose-500/15 px-2 pb-2 grid gap-0.5">
          {RESTAURANT_PHRASES.phrases.map((p: Phrase, i: number) => (
            <button
              key={i}
              type="button"
              onClick={() => copy(p.jp, i)}
              className="text-left rounded-xl px-3 py-2.5 hover:bg-white/5 transition-colors group flex items-start justify-between gap-2"
            >
              <div>
                <p className="text-xs font-semibold text-slate-200 group-hover:text-white">{p.en}</p>
                <p className="text-[0.75rem] text-rose-300/80 font-[Noto_Serif_JP] mt-0.5">{p.jp}</p>
                <p className="text-[0.65rem] text-slate-500 italic">{p.romaji}</p>
              </div>
              <ClipboardCopy
                size={13}
                className={`shrink-0 mt-1 transition-colors ${copied === i ? "text-emerald-400" : "text-slate-600 group-hover:text-slate-400"}`}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export type EatTab = "spots" | "dishes" | "regional" | "chains";

function DishSection() {
  return (
    <section className="section-pad pt-32 pb-16 sm:pb-24">
      <SectionHeading
        kicker="Order Like You Live There"
        title="Dish Encyclopedia"
        sub="Every major food genre: what it is, how to order it, what it costs."
      />
      <div className="grid gap-4 md:grid-cols-2">
        {DISH_ENCYCLOPEDIA.map((d, i) => (
          <motion.div
            key={d.name}
            id={`dish-${slugify(d.name)}`}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-30px" }}
            transition={{ duration: 0.3, delay: (i % 2) * 0.05 }}
            className="glass rounded-2xl p-5 scroll-mt-28"
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
  );
}

function RegionalSection() {
  return (
    <section className="section-pad pt-32 pb-16 sm:pb-24">
      <SectionHeading
        kicker="City by City"
        title="The Regional Must-Eat Ledger"
        sub="What each stop on the route does better than anywhere else on Earth — with the exact stall, street, or counter."
      />
      <div className="space-y-8">
        {REGIONAL_EATS.map((r, ri) => (
          <motion.div
            key={r.city}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-30px" }}
            transition={{ duration: 0.35, delay: (ri % 2) * 0.05 }}
            className="glass rounded-2xl p-5 sm:p-6"
          >
            <h3 className="font-extrabold text-xl mb-3">
              {r.emoji} {r.city}
            </h3>
            <div className="grid gap-3 md:grid-cols-2">
              {r.items.map((it) => (
                <div key={it.name} className="rounded-xl bg-white/[0.03] border border-white/5 p-3.5">
                  <div className="flex items-baseline justify-between gap-2">
                    <h4 className="font-bold text-sm">{it.name}</h4>
                    <span className="shrink-0 text-[0.65rem] font-bold uppercase tracking-wide text-rose-300">{it.where}</span>
                  </div>
                  <p className="mt-1.5 text-xs text-slate-400 leading-relaxed">{it.note}</p>
                </div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function ChainsSection() {
  return (
    <div className="section-pad pt-32 pb-16 sm:pb-24 space-y-16">
      <div>
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
      </div>

      <div>
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
      </div>
    </div>
  );
}

export function EatView({ tab }: { tab: EatTab }) {
  if (tab === "spots") return <div className="pt-8"><RestaurantPhrasesCard /><Food /></div>;
  if (tab === "dishes") return <DishSection />;
  if (tab === "regional") return <RegionalSection />;
  return <ChainsSection />;
}
