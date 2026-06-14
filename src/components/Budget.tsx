import { useMemo } from "react";
import { motion } from "motion/react";
import { RotateCcw, AlertTriangle, PiggyBank } from "lucide-react";
import { BUDGET_ITEMS } from "../data/budget";
import { MONEY_MOVES, PASS_MATH, MONEY_PREAMBLE } from "../data/money";
import { GROUP_SIZE } from "../data/itinerary";
import { SectionHeading } from "./SectionHeading";
import { useLocalStorage } from "../hooks/useLocalStorage";

const PASS_VERDICT: Record<string, string> = {
  SKIP: "bg-red-500/20 text-red-300 border-red-500/40",
  BUY: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
  MAYBE: "bg-amber-500/20 text-amber-300 border-amber-500/40",
};

const REALITY_CHECKS = [
  {
    emoji: "🏪",
    title: "The Don Quijote Problem",
    body: "You budgeted $300 for shopping. There are 4 Don Quijote visits in the itinerary. The alarm goes off Dec 16 when someone drops $80 on anime merch, 14 gachapon capsules, and $1 Kit-Kat assortments 'for omiyage.' It happens again Dec 24 ('Christmas, it doesn't count'). And Dec 27. And the boss-run Dec 28 with the tax-free threshold.",
  },
  {
    emoji: "🎰",
    title: "The Gachapon / Crane Tax",
    body: "Unbudgeted. Untracked. Per-person average on crew trips: $40–80. You cannot walk past a 300-machine gachapon wall and not pull. You can't. We've tried. The pooled crane-game budget is $6/man per arcade night and there are at least 5 arcade nights. That's $240 the budget doesn't see.",
  },
  {
    emoji: "🍜",
    title: "The Ramen Budget Lie",
    body: "$40/day covers food exactly once in December Tokyo — in a world where no one upgrades lunch, splits nothing, skips the depachika sampling floor, and leaves the tsukemen shop before second noodles. This is not that world. Add 20% and call it aggressive optimism.",
  },
  {
    emoji: "🎤",
    title: "The Karaoke Room Tax",
    body: "There are 4+ karaoke nights in the itinerary. Each run: ~$10–15/person/hour + nomihodai at $9–16. A 3-hour session with drinks = ~$40. ×4 sessions ×8 people = $1,280 the budget doesn't contain. 'We'll just do one hour' has never once been true.",
  },
  {
    emoji: "⛩️",
    title: "The 'Free' Temple Trap",
    body: "Temple admission: free–$5. Goshuin stamp (you will buy one at each temple, it's the law): $3–6. Coin lockers for the bags: $3. Hot corn soup vending machine after the dawn hike: $1. Paper fortune omikuji: $1.25. Matcha soft-serve on the way out: $4. The 'free' temple consistently costs $15–25. There are 12 temple/shrine days.",
  },
  {
    emoji: "🛍️",
    title: "The Tax-Free Threshold Trap",
    body: "Purchases over ~$31 (¥5,000) at one store = tax-free with your passport. This is designed to make $28 purchases feel irresponsible. You will hit $31 and then immediately find 3 more things that make it $110. The Japanese retail system understood human psychology 40 years before behavioral economics existed.",
  },
];

const SPEND_PROFILES = [
  {
    label: "The Minimalist",
    color: "text-emerald-300",
    bg: "bg-emerald-500/10 border-emerald-500/30",
    daily: "$85",
    total: "$1,360",
    vibe: "Konbini-core. Coin lockers over checked bags. One 'nice' dinner per city. Passes on the crane games (they're watching though). Brings home: two Kit-Kat boxes and a goshuin book.",
  },
  {
    label: "The Baseline (Budget Lock)",
    color: "text-rose-300",
    bg: "bg-rose-500/10 border-rose-500/30",
    daily: "$130",
    total: "$2,076",
    vibe: "The sliders above. Hits every itinerary item, splits the splurges, calls it responsible. Brings home: one Don Quijote bag, three impulse Pokémon figures, and a moderate sense of self-delusion.",
  },
  {
    label: "The Degenerate",
    color: "text-fuchsia-300",
    bg: "bg-fuchsia-500/10 border-fuchsia-500/30",
    daily: "$200+",
    total: "$3,200+",
    vibe: "Full omakase in Ginza ('only $180, it's fine'). Himeji + Kobe beef the same day without flinching. Three crane rounds per arcade. Checks a suitcase home purely for purchases. Buys the aged Yamazaki at HND duty-free. Zero regrets. Filed under 'investment in memories.' Kaishun-tier.",
  },
];

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
  const max = Math.max(1, ...rows.map((r) => r.value));

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
            ~{fmt(perPerson / 16)}/person/day all-in. Open Splitwise on Dec 14,
            settle in yen at the end of each day, or prepare for forensic accounting at RDU.
          </p>
        </motion.div>
      </div>

      {/* Spending profiles */}
      <div className="mt-10">
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">📊 Know your archetype</p>
        <div className="grid gap-3 sm:grid-cols-3">
          {SPEND_PROFILES.map((p) => (
            <div key={p.label} className={`rounded-2xl border p-4 ${p.bg}`}>
              <div className="flex items-baseline justify-between mb-2">
                <p className={`font-black text-sm ${p.color}`}>{p.label}</p>
                <p className={`text-xl font-black tabular-nums ${p.color}`}>{p.total}</p>
              </div>
              <p className="text-[0.63rem] text-slate-500 uppercase tracking-wider mb-1.5">{p.daily}/day</p>
              <p className="text-xs text-slate-400 leading-relaxed">{p.vibe}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Reality checks */}
      <div className="mt-6">
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle size={14} className="text-amber-400" />
          <p className="text-xs font-bold text-amber-400 uppercase tracking-wider">Degenerate reality checks — things the budget doesn't account for</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {REALITY_CHECKS.map((r) => (
            <div key={r.title} className="glass rounded-2xl p-4 border-amber-500/10">
              <p className="font-bold text-sm text-slate-100 mb-1.5">{r.emoji} {r.title}</p>
              <p className="text-xs text-slate-400 leading-relaxed">{r.body}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Money Doctrine — how not to waste money (researched) */}
      <div id="money" className="mt-16">
        <div className="flex items-center gap-2 mb-2">
          <PiggyBank size={16} className="text-emerald-400" />
          <p className="text-sm font-bold text-emerald-300 uppercase tracking-wider">Money Doctrine — don't waste a yen</p>
        </div>
        <p className="text-sm text-slate-400 leading-relaxed max-w-3xl mb-4">{MONEY_PREAMBLE}</p>

        {/* Pass math — real table on md+, stacked cards on mobile (no horizontal scroll) */}
        <div className="glass rounded-2xl p-5 mb-5">
          <p className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">🎫 Passes & tickets — the verdict for our route</p>
          <table className="hidden md:table w-full text-xs text-left">
            <thead>
              <tr className="border-b border-white/10 text-slate-500 font-semibold">
                <th className="pb-2 pr-4">Pass / ticket</th>
                <th className="pb-2 pr-4">Price</th>
                <th className="pb-2 pr-4">Verdict</th>
                <th className="pb-2">Why</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.05]">
              {PASS_MATH.map((p) => (
                <tr key={p.name}>
                  <td className="py-2.5 pr-4 font-bold text-slate-100">{p.name}</td>
                  <td className="py-2.5 pr-4 text-slate-300 tabular-nums whitespace-nowrap">{p.price}</td>
                  <td className="py-2.5 pr-4">
                    <span className={`text-[0.6rem] font-bold border rounded-full px-2 py-0.5 ${PASS_VERDICT[p.verdict]}`}>{p.verdict}</span>
                  </td>
                  <td className="py-2.5 text-slate-400 leading-relaxed">{p.math}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="md:hidden space-y-2.5">
            {PASS_MATH.map((p) => (
              <div key={p.name} className="rounded-xl bg-white/[0.03] border border-white/5 p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-sm text-slate-100">{p.name}</span>
                  <span className={`shrink-0 text-[0.58rem] font-bold border rounded-full px-2 py-0.5 ${PASS_VERDICT[p.verdict]}`}>{p.verdict}</span>
                </div>
                <p className="text-xs text-slate-300 tabular-nums mt-0.5">{p.price}</p>
                <p className="text-xs text-slate-400 leading-relaxed mt-1.5">{p.math}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Money moves grid */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {MONEY_MOVES.map((m) => (
            <div key={m.title} className="glass rounded-2xl p-4 border-emerald-500/10 flex flex-col">
              <div className="flex items-start justify-between gap-2">
                <p className="font-bold text-sm text-slate-100">{m.emoji} {m.title}</p>
              </div>
              <span className="mt-1.5 self-start text-[0.6rem] font-bold uppercase tracking-wide bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 rounded-full px-2 py-0.5">
                Saves: {m.saving}
              </span>
              <p className="mt-2 text-xs text-slate-400 leading-relaxed flex-1">{m.detail}</p>
              <span className="mt-2.5 self-start text-[0.58rem] font-semibold text-slate-600 uppercase tracking-wider">{m.tag}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
