import { useMemo } from "react";
import { motion } from "motion/react";
import { ExternalLink, BedDouble, Star, MapPin, CheckCircle2 } from "lucide-react";
import { STAY_LEGS, COMBO_NOTES, BUDGET_CAP_PP, FX_NOTE, GROUP, type StayOption } from "../data/stays";
import { SectionHeading } from "./SectionHeading";
import { useLocalStorage } from "../hooks/useLocalStorage";

const fmt = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

function OptionCard({
  opt,
  nights,
  picked,
  onPick,
}: {
  opt: StayOption;
  nights: number;
  picked: boolean;
  onPick: () => void;
}) {
  return (
    <div
      className={`glass rounded-2xl p-5 flex flex-col transition-all cursor-pointer border ${
        picked
          ? "border-emerald-400/60 bg-emerald-500/[0.06] shadow-lg shadow-emerald-500/10"
          : "border-transparent hover:bg-white/[0.06]"
      }`}
      onClick={onPick}
      role="button"
      aria-pressed={picked}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap gap-1.5 mb-2">
            {opt.tags.map((t) => (
              <span
                key={t}
                className={`text-[0.6rem] font-bold uppercase tracking-wide border rounded-full px-2 py-0.5 ${
                  t.includes("BUDGET LOCK")
                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                    : t.includes("CLOSEST")
                      ? "bg-rose-500/20 text-rose-300 border-rose-500/40"
                      : "bg-sky-500/15 text-sky-300 border-sky-500/30"
                }`}
              >
                {t}
              </span>
            ))}
          </div>
          <h3 className="font-bold leading-tight">{opt.name}</h3>
          <p className="text-xs text-slate-500 mt-0.5">{opt.area}</p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-xl font-black text-rose-300 tabular-nums">{fmt(opt.totalUSD)}</p>
          <p className="text-[0.65rem] text-slate-500">
            {fmt(opt.totalUSD / GROUP)}/guy · {nights}n
          </p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400">
        <span className="flex items-center gap-1.5">
          <BedDouble size={12} className="text-slate-500" />
          {opt.beds}
        </span>
        <span className="flex items-center gap-1.5">
          <Star size={12} className="text-amber-400" />
          {opt.rating}
        </span>
      </div>
      <p className="mt-2 flex items-start gap-1.5 text-xs text-slate-400">
        <MapPin size={12} className="mt-0.5 shrink-0 text-slate-500" />
        {opt.walk}
      </p>
      <p className="mt-2.5 text-sm text-slate-300 leading-relaxed flex-1">{opt.note}</p>

      <div className="mt-3 flex items-center justify-between">
        <span
          className={`inline-flex items-center gap-1.5 text-xs font-bold ${
            picked ? "text-emerald-300" : "text-slate-500"
          }`}
        >
          <CheckCircle2 size={14} />
          {picked ? "PICKED for this leg" : "Tap to pick"}
        </span>
        <a
          href={opt.url}
          target="_blank"
          rel="noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-300 hover:text-indigo-200"
        >
          View on Airbnb <ExternalLink size={12} />
        </a>
      </div>
    </div>
  );
}

export function StayView() {
  const defaults = Object.fromEntries(STAY_LEGS.map((l) => [l.id, l.defaultPick]));
  const [picks, setPicks] = useLocalStorage<Record<string, string>>("stay-picks", defaults);

  const total = useMemo(
    () =>
      STAY_LEGS.reduce((sum, leg) => {
        const opt =
          leg.options.find((o) => o.id === (picks[leg.id] ?? leg.defaultPick)) ?? leg.options[0];
        return sum + opt.totalUSD;
      }, 0),
    [picks],
  );
  const perPerson = total / GROUP;
  const underCap = perPerson < BUDGET_CAP_PP;

  return (
    <div className="section-pad py-24 pt-32">
      <SectionHeading
        kicker="Where We Sleep"
        title="The Airbnb Draft Board"
        sub={`Whole houses only, 2+ bathrooms mandatory, ${GROUP} guys, 14 nights, 5 legs. Tap any card to draft it — the meter tracks the $${BUDGET_CAP_PP}/person cap live.`}
      />

      {/* Running total meter */}
      <div className="glass rounded-2xl p-5 sm:p-6 mb-10 sticky top-20 z-40 backdrop-blur-xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-slate-400 font-semibold">
              Your combo · all 14 nights
            </p>
            <p className="mt-1 text-4xl font-black tabular-nums">
              <span className={underCap ? "text-emerald-400" : "text-red-400"}>
                {fmt(perPerson)}
              </span>
              <span className="text-lg font-bold text-slate-500">/guy</span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-slate-400">
              Crew total: <span className="font-bold text-white tabular-nums">{fmt(total)}</span>
            </p>
            <p
              className={`mt-1 text-xs font-bold uppercase tracking-wide ${
                underCap ? "text-emerald-400" : "text-red-400"
              }`}
            >
              {underCap
                ? `✓ under the $${BUDGET_CAP_PP} cap by ${fmt(BUDGET_CAP_PP - perPerson)}`
                : `✗ over the $${BUDGET_CAP_PP} cap by ${fmt(perPerson - BUDGET_CAP_PP)}`}
            </p>
          </div>
        </div>
        <div className="mt-3 h-2 rounded-full bg-white/10 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              underCap
                ? "bg-gradient-to-r from-emerald-500 to-teal-400"
                : "bg-gradient-to-r from-rose-500 to-red-500"
            }`}
            style={{ width: `${Math.min(100, (perPerson / BUDGET_CAP_PP) * 100)}%` }}
          />
        </div>
        <button
          onClick={() => setPicks(defaults)}
          className="mt-3 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          ↺ Reset to Budget Lock combo (~$495/guy)
        </button>
      </div>

      {/* Combos cheat sheet */}
      <div className="glass rounded-2xl p-5 mb-12">
        <h3 className="font-bold mb-3">📋 Pre-built combos</h3>
        <ul className="space-y-2">
          {COMBO_NOTES.map((c) => (
            <li key={c} className="text-sm text-slate-300 leading-relaxed pl-3 border-l-2 border-emerald-500/30">
              {c}
            </li>
          ))}
        </ul>
        <p className="mt-4 text-[0.7rem] text-slate-500 leading-relaxed">{FX_NOTE}</p>
      </div>

      {/* Legs */}
      <div className="space-y-14">
        {STAY_LEGS.map((leg, li) => {
          const pickedId = picks[leg.id] ?? leg.defaultPick;
          return (
            <motion.section
              key={leg.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.4, delay: (li % 2) * 0.05 }}
            >
              <div className="mb-4">
                <h3 className="text-xl sm:text-2xl font-extrabold">
                  {leg.emoji} {leg.city}{" "}
                  <span className="text-slate-500 font-[Noto_Serif_JP] text-lg font-normal">
                    {leg.cityJp}
                  </span>{" "}
                  <span className="text-rose-300 text-base font-bold">
                    · {leg.dates} · {leg.nights} night{leg.nights > 1 ? "s" : ""}
                  </span>
                </h3>
                <p className="text-sm text-slate-400 mt-1 max-w-3xl">{leg.brief}</p>
                <a
                  href={leg.searchUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-rose-500/15 border border-rose-500/30 px-3 py-1.5 text-xs font-semibold text-rose-300 hover:bg-rose-500/25 transition-colors"
                >
                  🔄 Check live {leg.city} prices on Airbnb ↗
                </a>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {leg.options.map((opt) => (
                  <OptionCard
                    key={opt.id}
                    opt={opt}
                    nights={leg.nights}
                    picked={pickedId === opt.id}
                    onPick={() => setPicks({ ...picks, [leg.id]: opt.id })}
                  />
                ))}
              </div>
            </motion.section>
          );
        })}
      </div>
    </div>
  );
}
