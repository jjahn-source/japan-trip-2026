import { motion } from "motion/react";
import { CheckCircle2 } from "lucide-react";

type Phase = {
  id: string;
  label: string;
  window: string;
  start: string;
  end: string;
  emoji: string;
  actions: string[];
  color: "rose" | "amber" | "sky" | "indigo" | "emerald";
};

const PHASES: Phase[] = [
  {
    id: "now",
    label: "Now · 6 months",
    window: "Jun – Jul 2026",
    start: "2026-06-01",
    end: "2026-07-31",
    emoji: "🔥",
    color: "rose",
    actions: [
      "Lock all 3 Airbnbs before December inventory vanishes",
      "Get remaining 6 people on DL 2538/121 (Dec 14)",
      "Share this app with the crew",
    ],
  },
  {
    id: "four-mo",
    label: "4 months",
    window: "Aug – Sep 2026",
    start: "2026-08-01",
    end: "2026-09-30",
    emoji: "🎫",
    color: "amber",
    actions: [
      "teamLab Planets × 8 drops Sept 18 (alarm required)",
      "Enter Nintendo Museum lottery around Sept 24",
      "USJ tickets + Express Pass — Christmas Day is mobbed",
    ],
  },
  {
    id: "two-mo",
    label: "2 months",
    window: "Oct – Nov 13",
    start: "2026-10-01",
    end: "2026-11-13",
    emoji: "🚄",
    color: "sky",
    actions: [
      "Ghibli Museum tickets drop Nov 10 at 10:00 JST sharp",
      "Restaurant reservations open (TableCheck, party of 8)",
      "Set SmartEX alarms — shinkansen opens 1 month out",
    ],
  },
  {
    id: "one-mo",
    label: "1 month",
    window: "Nov 14 – Dec 6",
    start: "2026-11-14",
    end: "2026-12-06",
    emoji: "💴",
    color: "indigo",
    actions: [
      "Shibuya Sky midnight ticket drop Nov 18 (sells in minutes)",
      "Travel insurance × 8 + yen loaded on Suica",
      "KFC Christmas bucket pre-order (not a joke)",
    ],
  },
  {
    id: "one-wk",
    label: "1 week",
    window: "Dec 7–14",
    start: "2026-12-07",
    end: "2026-12-14",
    emoji: "🛫",
    color: "emerald",
    actions: [
      "eSIM activated + Suica topped up on every device",
      "Visit Japan Web QR codes screenshotted offline",
      "T-24h check-in war: Dec 13 @ 6:00 AM EST, all 8",
    ],
  },
];

const COLOR_STYLES: Record<Phase["color"], { border: string; kicker: string; dot: string; card: string }> = {
  rose:    { border: "border-accent-500/50",    kicker: "text-accent-300",    dot: "bg-accent-500",    card: "bg-accent-500/8"    },
  amber:   { border: "border-amber-500/40",   kicker: "text-amber-300",   dot: "bg-amber-500",   card: "bg-amber-500/5"   },
  sky:     { border: "border-sky-500/40",     kicker: "text-sky-300",     dot: "bg-sky-500",     card: "bg-sky-500/5"     },
  indigo:  { border: "border-indigo-500/40",  kicker: "text-indigo-300",  dot: "bg-indigo-500",  card: "bg-indigo-500/5"  },
  emerald: { border: "border-emerald-500/40", kicker: "text-emerald-300", dot: "bg-emerald-500", card: "bg-emerald-500/5" },
};

function todayISO(): string {
  return new Date().toLocaleDateString("en-CA");
}

function phaseStatus(phase: Phase, today: string): "past" | "current" | "upcoming" {
  if (today > phase.end) return "past";
  if (today >= phase.start) return "current";
  return "upcoming";
}

export function PreTripPhases() {
  const today = todayISO();

  return (
    <section className="section-pad py-16">
      <div className="mb-8">
        <p className="text-accent-400 font-semibold tracking-[0.25em] uppercase text-xs mb-2">Countdown</p>
        <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Pre-Trip Phases</h2>
        <p className="text-slate-400 mt-2 text-sm sm:text-base">What the crew needs to do, when.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-5">
        {PHASES.map((phase, i) => {
          const status = phaseStatus(phase, today);
          const s = COLOR_STYLES[phase.color];
          return (
            <motion.div
              key={phase.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.35, delay: i * 0.07 }}
              className={`glass rounded-2xl p-4 border ${
                status === "current"
                  ? `${s.border} ${s.card}`
                  : status === "past"
                  ? "border-white/5 opacity-50"
                  : "border-white/8"
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-3">
                <div>
                  <p className={`text-[0.6rem] font-bold uppercase tracking-[0.2em] mb-0.5 ${
                    status === "current" ? s.kicker : "text-slate-500"
                  }`}>
                    {status === "current" ? "● NOW" : status === "past" ? "DONE" : phase.label}
                  </p>
                  <p className="text-xs text-slate-400">{phase.window}</p>
                </div>
                <span className="text-xl leading-none">{phase.emoji}</span>
              </div>

              <ul className="space-y-1.5">
                {phase.actions.map((action, j) => (
                  <li key={j} className="flex items-start gap-1.5 text-xs text-slate-400 leading-snug">
                    {status === "past" ? (
                      <CheckCircle2 size={12} className="shrink-0 mt-0.5 text-slate-600" />
                    ) : (
                      <span className={`shrink-0 mt-1.5 w-1 h-1 rounded-full ${
                        status === "current" ? s.dot : "bg-slate-700"
                      }`} />
                    )}
                    {action}
                  </li>
                ))}
              </ul>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
