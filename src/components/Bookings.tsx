import { useMemo } from "react";
import { motion } from "motion/react";
import { ExternalLink, CheckCircle2, Circle, AlarmClock, CalendarPlus } from "lucide-react";
import { BOOKINGS } from "../data/bookings";
import { SectionHeading } from "./SectionHeading";
import { useLocalStorage } from "../hooks/useLocalStorage";
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

export function Bookings() {
  const [done, setDone] = useLocalStorage<Record<string, boolean>>("bookings-done", {});

  const completed = BOOKINGS.filter((b) => done[b.id]).length;
  const dueSoon = BOOKINGS.filter((b) => !done[b.id] && daysUntil(b.deadline) <= 14).length;

  const ordered = useMemo(
    () =>
      [...BOOKINGS].sort((a, b) => {
        const ad = !!done[a.id], bd = !!done[b.id];
        if (ad !== bd) return ad ? 1 : -1;
        return daysUntil(a.deadline) - daysUntil(b.deadline);
      }),
    [done],
  );

  return (
    <section id="bookings" className="section-pad py-24">
      <SectionHeading
        kicker="Mission Critical"
        title="Booking War Room"
        sub={`Japan in December rewards the prepared. ${completed}/${BOOKINGS.length} locked in · ${dueSoon} due within 14 days — soonest deadline first, checkmarks save automatically.`}
      />

      <div className="glass rounded-2xl p-3 mb-6 flex items-center gap-2">
        <button
          type="button"
          onClick={() => downloadICS("japan-2026-deadlines.ics", buildBookingsICS(BOOKINGS))}
          className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/15 border border-rose-500/30 px-3.5 py-1.5 text-xs font-semibold text-rose-300 hover:bg-rose-500/25 transition-colors"
        >
          <CalendarPlus size={13} /> Add all deadlines to calendar
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {ordered.map((b, i) => {
          const isDone = !!done[b.id];
          const d = daysUntil(b.deadline);
          const bk = bucket(d, isDone);
          return (
            <motion.div
              key={b.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.35, delay: (i % 2) * 0.06 }}
              className={`glass rounded-2xl p-5 border-l-4 ${bk.border} transition-opacity ${isDone ? "opacity-50" : ""}`}
            >
              <div className="flex items-start justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setDone({ ...done, [b.id]: !isDone })}
                  className="flex items-start gap-3 text-left group"
                >
                  {isDone ? (
                    <CheckCircle2 size={22} className="text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <Circle size={22} className="text-slate-500 group-hover:text-slate-300 shrink-0 mt-0.5" />
                  )}
                  <span className={`font-bold leading-snug ${isDone ? "line-through" : ""}`}>{b.what}</span>
                </button>
                <span className={`shrink-0 text-[0.65rem] font-bold uppercase tracking-wide border rounded-full px-2.5 py-1 ${PRIORITY_STYLES[b.priority]}`}>
                  {b.priority}
                </span>
              </div>

              {!isDone && bk.label && (
                <div className="mt-3">
                  <span className="text-[0.62rem] font-bold text-slate-400">{bk.label}</span>
                </div>
              )}

              <div className="mt-2 flex items-center gap-2 text-sm font-semibold text-rose-300">
                <AlarmClock size={15} />
                <span>{b.when}</span>
                {!isDone && d >= 0 && <span className="text-slate-500 font-normal">· {d} days left</span>}
                {!isDone && d < 0 && <span className="text-red-400 font-normal">· {Math.abs(d)} days overdue</span>}
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
