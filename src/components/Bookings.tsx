import { useMemo } from "react";
import { motion } from "motion/react";
import { ExternalLink, CheckCircle2, Circle, AlarmClock, CalendarPlus, AlertTriangle } from "lucide-react";
import { BOOKINGS } from "../data/bookings";
import { SectionHeading } from "./SectionHeading";
import { useBookingsSync } from "../hooks/useBookingsSync";
import { FIREBASE_ENABLED } from "../lib/firebase";
import { buildBookingsICS, downloadICS } from "../utils/itineraryTools";

const PRIORITY_STYLES: Record<string, string> = {
  critical: "bg-red-500/20 text-red-300 border-red-500/40",
  high: "bg-amber-500/20 text-amber-300 border-amber-500/40",
  medium: "bg-sky-500/20 text-sky-300 border-sky-500/40",
};

function daysUntil(iso: string) {
  return Math.ceil((new Date(iso + "T00:00:00").getTime() - Date.now()) / 86_400_000);
}

function bucket(d: number, done: boolean): { border: string; label: string } {
  if (done) return { border: "border-l-emerald-500/40", label: "" };
  if (d < 0) return { border: "border-l-red-500", label: "OVERDUE" };
  if (d <= 7) return { border: "border-l-amber-400", label: "THIS WEEK" };
  if (d <= 30) return { border: "border-l-sky-400", label: "THIS MONTH" };
  return { border: "border-l-white/15", label: "" };
}

function fmtAt(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function Bookings() {
  const { isDone, whoBy, whenAt, toggle } = useBookingsSync();

  const completed = BOOKINGS.filter((b) => isDone(b.id)).length;
  const dueSoon = BOOKINGS.filter((b) => !isDone(b.id) && daysUntil(b.deadline) <= 14).length;

  const ordered = useMemo(
    () =>
      [...BOOKINGS].sort((a, b) => {
        const ad = isDone(a.id), bd = isDone(b.id);
        if (ad !== bd) return ad ? 1 : -1;
        return daysUntil(a.deadline) - daysUntil(b.deadline);
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isDone],
  );

  const overdueCount = ordered.filter((b) => !isDone(b.id) && daysUntil(b.deadline) < 0).length;
  const nextUp = ordered.find((b) => !isDone(b.id));

  return (
    <section id="bookings" className="section-pad py-24">
      <SectionHeading
        kicker="Mission Critical"
        title="Booking War Room"
        sub={`Japan in December rewards the prepared. ${completed}/${BOOKINGS.length} locked in · ${dueSoon} due within 14 days — soonest deadline first${FIREBASE_ENABLED ? ", synced live" : ", saves locally"}.`}
      />

      <div className="glass rounded-2xl p-3 mb-6 flex items-center gap-2">
        <button
          type="button"
          onClick={() => downloadICS("japan-2026-deadlines.ics", buildBookingsICS(BOOKINGS))}
          className="inline-flex items-center gap-1.5 rounded-full bg-accent-500/15 border border-accent-500/30 px-3.5 py-1.5 text-xs font-semibold text-accent-300 hover:bg-accent-500/25 transition-colors"
        >
          <CalendarPlus size={13} /> Add all deadlines to calendar
        </button>
      </div>

      {(overdueCount > 0 || (nextUp && daysUntil(nextUp.deadline) <= 14)) && (
        <div className="mb-6 flex items-center gap-3 rounded-xl bg-red-500/10 border border-red-500/30 px-4 py-3">
          <AlertTriangle size={16} className="text-red-400 shrink-0" />
          <div className="min-w-0">
            {overdueCount > 0 && (
              <p className="text-sm font-bold text-red-300">{overdueCount} booking{overdueCount > 1 ? "s" : ""} overdue</p>
            )}
            {nextUp && daysUntil(nextUp.deadline) >= 0 && daysUntil(nextUp.deadline) <= 14 && (
              <p className="text-xs text-slate-400 mt-0.5">
                Next deadline: <span className="font-semibold text-amber-300">{nextUp.what}</span> in {daysUntil(nextUp.deadline)}d
              </p>
            )}
          </div>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {ordered.map((b, i) => {
          const done = isDone(b.id);
          const by = whoBy(b.id);
          const at = whenAt(b.id);
          const d = daysUntil(b.deadline);
          const bk = bucket(d, done);
          const criticalOverdue = !done && d < 0 && b.priority === "critical";
          return (
            <motion.div
              key={b.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.35, delay: (i % 2) * 0.06 }}
              className={`glass rounded-2xl p-5 border-l-4 ${bk.border} transition-opacity ${done ? "opacity-50" : ""} ${criticalOverdue ? "ring-1 ring-red-500/40 animate-pulse" : ""}`}
            >
              <div className="flex items-start justify-between gap-3">
                <button
                  type="button"
                  onClick={() => toggle(b.id)}
                  className="flex items-start gap-3 text-left group"
                >
                  {done ? (
                    <CheckCircle2 size={22} className="text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <Circle size={22} className="text-slate-500 group-hover:text-slate-300 shrink-0 mt-0.5" />
                  )}
                  <span className={`font-bold leading-snug ${done ? "line-through" : ""}`}>{b.what}</span>
                </button>
                <span className={`shrink-0 text-[0.65rem] font-bold uppercase tracking-wide border rounded-full px-2.5 py-1 ${PRIORITY_STYLES[b.priority]}`}>
                  {b.priority}
                </span>
              </div>

              {done && by && (
                <p className="mt-2 text-xs text-emerald-400/80">
                  ✓ {by}{at ? ` · ${fmtAt(at)}` : ""}
                </p>
              )}

              {!done && bk.label && (
                <div className="mt-3">
                  <span className="text-[0.62rem] font-bold text-slate-400">{bk.label}</span>
                </div>
              )}

              <div className="mt-2 flex items-center gap-2 text-sm font-semibold text-accent-300">
                <AlarmClock size={15} />
                <span>{b.when}</span>
                {!done && d >= 0 && <span className="text-slate-500 font-normal">· {d} days left</span>}
                {!done && d < 0 && <span className="text-red-400 font-normal">· {Math.abs(d)} days overdue</span>}
              </div>
              <p className="mt-2 text-sm text-slate-400 leading-relaxed">{b.detail}</p>
              {b.url && (
                <a
                  href={b.url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-300 hover:text-indigo-200"
                >
                  Official site <ExternalLink size={13} />
                </a>
              )}
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
