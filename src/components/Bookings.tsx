import { motion } from "motion/react";
import { ExternalLink, CheckCircle2, Circle, AlarmClock } from "lucide-react";
import { BOOKINGS } from "../data/bookings";
import { SectionHeading } from "./SectionHeading";
import { useLocalStorage } from "../hooks/useLocalStorage";

const PRIORITY_STYLES: Record<string, string> = {
  critical: "bg-red-500/20 text-red-300 border-red-500/40",
  high: "bg-amber-500/20 text-amber-300 border-amber-500/40",
  medium: "bg-sky-500/20 text-sky-300 border-sky-500/40",
};

function daysUntil(iso: string) {
  return Math.ceil((new Date(iso + "T00:00:00").getTime() - Date.now()) / 86_400_000);
}

export function Bookings() {
  const [done, setDone] = useLocalStorage<Record<string, boolean>>("bookings-done", {});
  const completed = BOOKINGS.filter((b) => done[b.id]).length;

  return (
    <section id="bookings" className="section-pad py-24">
      <SectionHeading
        kicker="Mission Critical"
        title="Booking War Room"
        sub={`Japan in December rewards the prepared. ${completed}/${BOOKINGS.length} locked in — checkmarks save automatically.`}
      />
      <div className="grid gap-4 md:grid-cols-2">
        {BOOKINGS.map((b, i) => {
          const isDone = !!done[b.id];
          const d = daysUntil(b.deadline);
          return (
            <motion.div
              key={b.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.35, delay: (i % 2) * 0.06 }}
              className={`glass rounded-2xl p-5 transition-opacity ${isDone ? "opacity-50" : ""}`}
            >
              <div className="flex items-start justify-between gap-3">
                <button
                  onClick={() => setDone({ ...done, [b.id]: !isDone })}
                  className="flex items-start gap-3 text-left group"
                >
                  {isDone ? (
                    <CheckCircle2 size={22} className="text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <Circle size={22} className="text-slate-500 group-hover:text-slate-300 shrink-0 mt-0.5" />
                  )}
                  <span className={`font-bold leading-snug ${isDone ? "line-through" : ""}`}>
                    {b.what}
                  </span>
                </button>
                <span
                  className={`shrink-0 text-[0.65rem] font-bold uppercase tracking-wide border rounded-full px-2.5 py-1 ${PRIORITY_STYLES[b.priority]}`}
                >
                  {b.priority}
                </span>
              </div>
              <div className="mt-3 flex items-center gap-2 text-sm font-semibold text-rose-300">
                <AlarmClock size={15} />
                <span>{b.when}</span>
                {!isDone && d > 0 && (
                  <span className="text-slate-500 font-normal">· {d} days left</span>
                )}
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
