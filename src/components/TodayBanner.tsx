import { CalendarDays, ArrowRight, PartyPopper } from "lucide-react";
import { DAYS } from "../data/itinerary";
import { scrollToAnchor } from "../utils/nav";

// Local calendar date as YYYY-MM-DD (en-CA renders ISO-style, in the user's TZ).
function todayISO(): string {
  return new Date().toLocaleDateString("en-CA");
}

function daysBetween(aISO: string, bISO: string): number {
  const a = new Date(`${aISO}T00:00:00`).getTime();
  const b = new Date(`${bISO}T00:00:00`).getTime();
  return Math.round((b - a) / 86_400_000);
}

function openDay(i: number) {
  window.dispatchEvent(new CustomEvent("trip:open-day", { detail: i }));
  scrollToAnchor(`day-${i}`);
}

export function TodayBanner() {
  const today = todayISO();
  const first = DAYS[0].date;
  const last = DAYS[DAYS.length - 1].date;
  const idx = DAYS.findIndex((d) => d.date === today);

  // ── During the trip ──────────────────────────────────────────────
  if (idx >= 0) {
    const d = DAYS[idx];
    const dares = d.dares?.length ?? 0;
    const events = d.events?.length ?? 0;
    return (
      <Shell tone="live">
        <div className="flex-1 min-w-0">
          <p className="text-[0.62rem] font-bold uppercase tracking-[0.2em] text-emerald-300">
            Today · Day {idx + 1} of {DAYS.length} · {d.dow} Dec {d.date.slice(8)}
          </p>
          <h2 className="text-lg sm:text-2xl font-black mt-0.5 truncate">{d.emoji} {d.title}</h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-0.5">{d.city} · {d.activities.length} stops · {dares} dares{events ? ` · ${events} live events` : ""}</p>
          <p className="text-xs text-cyan-200/90 mt-1">{d.wx}</p>
        </div>
        <button type="button" onClick={() => openDay(idx)} className="shrink-0 inline-flex items-center gap-1.5 rounded-full bg-emerald-500 hover:bg-emerald-400 transition-colors px-5 py-2.5 font-bold text-white text-sm">
          Open today <ArrowRight size={15} />
        </button>
      </Shell>
    );
  }

  // ── After the trip ───────────────────────────────────────────────
  if (today > last) {
    return (
      <Shell tone="done">
        <div className="flex-1">
          <p className="text-[0.62rem] font-bold uppercase tracking-[0.2em] text-amber-300 flex items-center gap-1.5"><PartyPopper size={12} /> Okaeri</p>
          <h2 className="text-lg sm:text-2xl font-black mt-0.5">16 days, 3 bases, ∞ stories — that's a wrap.</h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-0.5">The 2027 planning thread opens at cruising altitude. Kaishun picks the destination.</p>
        </div>
      </Shell>
    );
  }

  // ── Before the trip (countdown) ──────────────────────────────────
  const until = Math.max(0, daysBetween(today, first));
  const d0 = DAYS[0];
  return (
    <Shell tone="soon">
      <div className="flex-1 min-w-0">
        <p className="text-[0.62rem] font-bold uppercase tracking-[0.2em] text-rose-300 flex items-center gap-1.5">
          <CalendarDays size={12} /> {until === 0 ? "Wheels up today" : `${until} day${until === 1 ? "" : "s"} until wheels up`}
        </p>
        <h2 className="text-lg sm:text-2xl font-black mt-0.5 truncate">First up: {d0.emoji} {d0.title}</h2>
        <p className="text-xs sm:text-sm text-slate-300 mt-0.5">Dec 14–29, 2026 · Tokyo → Kyoto → Osaka · the Crew of 8</p>
      </div>
      <button type="button" onClick={() => openDay(0)} className="shrink-0 inline-flex items-center gap-1.5 rounded-full bg-rose-500 hover:bg-rose-400 transition-colors px-5 py-2.5 font-bold text-white text-sm">
        Preview Day 1 <ArrowRight size={15} />
      </button>
    </Shell>
  );
}

const TONE: Record<string, string> = {
  live: "border-emerald-500/30 bg-emerald-500/5",
  soon: "border-rose-500/25 bg-rose-500/5",
  done: "border-amber-500/25 bg-amber-500/5",
};

function Shell({ tone, children }: { tone: keyof typeof TONE; children: React.ReactNode }) {
  return (
    <div className="section-pad -mt-8">
      <div className={`glass rounded-2xl border p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4 ${TONE[tone]}`}>
        {children}
      </div>
    </div>
  );
}
