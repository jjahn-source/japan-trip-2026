import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { Rocket, ArrowRight, Trophy } from "lucide-react";
import { DAYS, TRIP_START } from "../data/itinerary";
import { BOOKINGS } from "../data/bookings";
import { PACKING } from "../data/packing";
import { TRIP_BINGO } from "../data/challenges";
import { SectionHeading } from "./SectionHeading";
import { useLocalStorage } from "../hooks/useLocalStorage";
import type { View } from "../hooks/useHashView";

// Totals computed once from the data
const TOTAL_ACTIVITIES = DAYS.reduce((s, d) => s + d.activities.length, 0);
const TOTAL_DARES = DAYS.reduce((s, d) => s + (d.dares?.length ?? 0), 0);
const TOTAL_PACKING = PACKING.reduce((s, g) => s + g.items.length, 0);

const RANKS: { min: number; title: string; sub: string }[] = [
  { min: 100, title: "Mayor of the Group Chat", sub: "Pricing Tokyo apartments 'as a joke.'" },
  { min: 85, title: "Honorary Local", sub: "Bows to vending machines reflexively." },
  { min: 65, title: "Seasoned Veteran", sub: "Orders the whole table's yakiniku in Japanese." },
  { min: 45, title: "Confident Regular", sub: "Taps Suica without breaking stride." },
  { min: 25, title: "Adjusting Visitor", sub: "Finally found the right station exit." },
  { min: 1, title: "Fresh Tourist", sub: "Lost in Shinjuku Station, but trying." },
  { min: 0, title: "Pre-Boarding", sub: "Hasn't ticked a single box. The journey awaits." },
];

function countTrue(rec: Record<string, boolean>): number {
  return Object.values(rec).filter(Boolean).length;
}

function useCountdown(target: string) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const diff = Math.max(0, new Date(target).getTime() - now);
  return {
    days: Math.floor(diff / 86_400_000),
    hours: Math.floor(diff / 3_600_000) % 24,
    mins: Math.floor(diff / 60_000) % 60,
    secs: Math.floor(diff / 1_000) % 60,
  };
}

function Ring({ pct }: { pct: number }) {
  const r = 52;
  const c = 2 * Math.PI * r;
  return (
    <svg viewBox="0 0 120 120" className="w-32 h-32 -rotate-90">
      <circle cx="60" cy="60" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="10" />
      <motion.circle
        cx="60" cy="60" r={r} fill="none" stroke="url(#mcgrad)" strokeWidth="10" strokeLinecap="round"
        strokeDasharray={c}
        initial={{ strokeDashoffset: c }}
        animate={{ strokeDashoffset: c - (c * pct) / 100 }}
        transition={{ type: "spring", stiffness: 60, damping: 18 }}
      />
      <defs>
        <linearGradient id="mcgrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fb7185" />
          <stop offset="100%" stopColor="#818cf8" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function CategoryCard({
  emoji, label, done, total, blurb, onGo,
}: {
  emoji: string; label: string; done: number; total: number; blurb: string; onGo: () => void;
}) {
  const pct = total ? Math.round((done / total) * 100) : 0;
  const complete = done >= total && total > 0;
  return (
    <div className="glass rounded-2xl p-5 flex flex-col">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-2xl">{emoji}</p>
          <h3 className="font-bold mt-1">{label}</h3>
        </div>
        <span className={`text-xs font-black tabular-nums ${complete ? "text-emerald-300" : "text-slate-300"}`}>
          {done}/{total}
        </span>
      </div>
      <div className="mt-3 h-2 rounded-full bg-white/10 overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${complete ? "bg-gradient-to-r from-emerald-500 to-teal-400" : "bg-gradient-to-r from-rose-500 to-fuchsia-500"}`}
          initial={{ width: 0 }}
          whileInView={{ width: `${pct}%` }}
          viewport={{ once: true }}
          transition={{ type: "spring", stiffness: 70, damping: 18 }}
        />
      </div>
      <p className="mt-2 text-xs text-slate-500 leading-relaxed flex-1">{blurb}</p>
      <button
        onClick={onGo}
        className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-rose-300 hover:text-rose-200 self-start"
      >
        {complete ? "Review" : "Go work on it"} <ArrowRight size={12} />
      </button>
    </div>
  );
}

export function MissionControl() {
  const [bookingsDone] = useLocalStorage<Record<string, boolean>>("bookings-done", {});
  const [packingChecked] = useLocalStorage<Record<string, boolean>>("packing-checked", {});
  const [bingo] = useLocalStorage<Record<number, boolean>>("trip-bingo", {});
  const [itinDone] = useLocalStorage<Record<string, boolean>>("itinerary-done", {});
  const { days, hours, mins, secs } = useCountdown(TRIP_START);

  // itinerary-done holds BOTH activity keys (date-N) and dare keys (date-dare-N)
  const { actDone, dareDone } = useMemo(() => {
    let actDone = 0, dareDone = 0;
    for (const [k, v] of Object.entries(itinDone)) {
      if (!v) continue;
      if (k.includes("-dare-")) dareDone++;
      else actDone++;
    }
    return { actDone, dareDone };
  }, [itinDone]);

  // Navigate to the right tab AND land on the relevant section (not the top).
  // Set the hash directly (the hashchange listener updates the view WITHOUT a
  // scroll-to-top), then poll on a wall-clock deadline so even a cold-cache lazy
  // chunk (e.g. the Play view) has time to mount before we scroll to the anchor.
  const go = (view: View, anchor: string) => {
    window.location.hash = `/${view}`;
    const start = Date.now();
    const tick = () => {
      const el = document.getElementById(anchor);
      if (el) { el.scrollIntoView({ behavior: "smooth", block: "start" }); return; }
      if (Date.now() - start < 8000) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  const cats = [
    { emoji: "✅", label: "Pre-Trip Bookings", done: countTrue(bookingsDone as Record<string, boolean>), total: BOOKINGS.length, blurb: "The mission-critical reservations: flights, Airbnbs, teamLab, Ghibli, USJ, shinkansen, restaurants.", view: "plan" as View, anchor: "bookings" },
    { emoji: "🎒", label: "Packing", done: countTrue(packingChecked), total: TOTAL_PACKING, blurb: "December layers, tech, documents, and the Degenerate Prerequisites (dignity, antacids, shame floor).", view: "plan" as View, anchor: "packing" },
    { emoji: "📋", label: "Itinerary Check-Off", done: actDone, total: TOTAL_ACTIVITIES, blurb: "Every scheduled moment across 16 days. Flip on Trip Mode in the Plan tab and tick as you go.", view: "plan" as View, anchor: "itinerary" },
    { emoji: "🎯", label: "Daily Dares", done: dareDone, total: TOTAL_DARES, blurb: "The degenerate per-day mission checklist. Claim them live — glory is non-refundable.", view: "plan" as View, anchor: "itinerary" },
    { emoji: "🎲", label: "Trip Bingo", done: countTrue(bingo as Record<string, boolean>), total: TRIP_BINGO.length, blurb: "Fuji with no clouds, the electric bath, ordering for the table — the full card.", view: "play" as View, anchor: "bingo" },
  ];

  const totalDone = cats.reduce((s, c) => s + c.done, 0);
  const totalAll = cats.reduce((s, c) => s + c.total, 0);
  const pct = totalAll ? Math.round((totalDone / totalAll) * 100) : 0;
  const rank = RANKS.find((r) => pct >= r.min)!;
  const tripLive = days === 0 && hours === 0 && mins === 0 && secs === 0;

  return (
    <div className="section-pad py-24 pt-32">
      <SectionHeading
        kicker="The War Room"
        title="Mission Control"
        sub="One dashboard for the entire campaign — every checklist, every tracker, one progress bar. Tick things off across the app and watch your rank climb. Everything saves on this device."
      />

      {/* Hero readiness */}
      <div className="glass rounded-3xl p-6 sm:p-8 mb-8 flex flex-col sm:flex-row items-center gap-6 sm:gap-10">
        <div className="relative shrink-0 grid place-items-center">
          <Ring pct={pct} />
          <div className="absolute inset-0 grid place-items-center">
            <span className="text-3xl font-black tabular-nums bg-gradient-to-br from-rose-300 to-indigo-300 bg-clip-text text-transparent">{pct}%</span>
          </div>
        </div>
        <div className="flex-1 text-center sm:text-left">
          <p className="text-xs font-bold uppercase tracking-wider text-rose-400 flex items-center justify-center sm:justify-start gap-1.5">
            <Trophy size={13} /> Current Rank
          </p>
          <h3 className="text-2xl sm:text-3xl font-black mt-1">{rank.title}</h3>
          <p className="text-sm text-slate-400 mt-1">{rank.sub}</p>
          <p className="mt-3 text-sm text-slate-300">
            <span className="font-bold text-emerald-300 tabular-nums">{totalDone}</span> of{" "}
            <span className="font-bold tabular-nums">{totalAll}</span> total boxes ticked across the whole app.
          </p>
        </div>
        <div className="shrink-0 text-center glass rounded-2xl px-5 py-4">
          <p className="text-[0.62rem] font-bold uppercase tracking-wider text-slate-500 flex items-center justify-center gap-1">
            <Rocket size={11} /> {tripLive ? "Status" : "Wheels up in"}
          </p>
          {tripLive ? (
            <p className="mt-2 text-xl font-black text-emerald-300">IN JAPAN 🎌</p>
          ) : (
            <div className="mt-2 flex gap-2 justify-center tabular-nums">
              {[{ v: days, l: "d" }, { v: hours, l: "h" }, { v: mins, l: "m" }, { v: secs, l: "s" }].map((u) => (
                <div key={u.l}>
                  <span className="text-xl font-black">{u.v}</span>
                  <span className="text-xs text-slate-500">{u.l}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Category grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cats.map((c) => (
          <CategoryCard
            key={c.label}
            emoji={c.emoji} label={c.label} done={c.done} total={c.total} blurb={c.blurb}
            onGo={() => go(c.view, c.anchor)}
          />
        ))}
      </div>

      <p className="mt-8 text-center text-xs text-slate-600">
        Progress is stored locally per device — there's no account, no cloud, no one judging your shame floor but you.
      </p>
    </div>
  );
}
