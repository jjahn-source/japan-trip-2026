import { useMemo, useState } from "react";
import { motion } from "motion/react";
import { ExternalLink, CheckCircle2, Circle, AlarmClock, CalendarPlus, Share2, ClipboardPaste } from "lucide-react";
import { BOOKINGS } from "../data/bookings";
import { SectionHeading } from "./SectionHeading";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { buildBookingsICS, downloadICS } from "../utils/itineraryTools";
import { encodeState, decodeState, mergeBoolMap } from "../utils/shareState";

const PRIORITY_STYLES: Record<string, string> = {
  critical: "bg-red-500/20 text-red-300 border-red-500/40",
  high: "bg-amber-500/20 text-amber-300 border-amber-500/40",
  medium: "bg-sky-500/20 text-sky-300 border-sky-500/40",
};

function daysUntil(iso: string) {
  return Math.ceil((new Date(iso + "T00:00:00").getTime() - Date.now()) / 86_400_000);
}

// Urgency bucket → the left-border accent.
function bucket(d: number, done: boolean): { border: string; label: string } {
  if (done) return { border: "border-l-emerald-500/40", label: "" };
  if (d < 0) return { border: "border-l-red-500", label: "OVERDUE" };
  if (d <= 7) return { border: "border-l-amber-400", label: "THIS WEEK" };
  if (d <= 30) return { border: "border-l-sky-400", label: "THIS MONTH" };
  return { border: "border-l-white/15", label: "" };
}

export function Bookings() {
  const [done, setDone] = useLocalStorage<Record<string, boolean>>("bookings-done", {});
  const [shareMsg, setShareMsg] = useState("");

  const completed = BOOKINGS.filter((b) => done[b.id]).length;
  const dueSoon = BOOKINGS.filter((b) => !done[b.id] && daysUntil(b.deadline) <= 14).length;

  // Soonest deadline first; done items sink to the bottom.
  const ordered = useMemo(
    () =>
      [...BOOKINGS].sort((a, b) => {
        const ad = !!done[a.id], bd = !!done[b.id];
        if (ad !== bd) return ad ? 1 : -1;
        return daysUntil(a.deadline) - daysUntil(b.deadline);
      }),
    [done],
  );

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(encodeState(done));
      setShareMsg("Progress code copied — paste it to a crewmate.");
    } catch {
      setShareMsg("Couldn't access clipboard.");
    }
    setTimeout(() => setShareMsg(""), 3500);
  };

  const pasteCode = async () => {
    try {
      const code = await navigator.clipboard.readText();
      const incoming = decodeState<Record<string, boolean>>(code.trim());
      if (!incoming) { setShareMsg("That clipboard text isn't a valid progress code."); }
      else { setDone(mergeBoolMap(done, incoming)); setShareMsg("Merged a crewmate's progress in."); }
    } catch {
      setShareMsg("Couldn't read the clipboard.");
    }
    setTimeout(() => setShareMsg(""), 3500);
  };

  return (
    <section id="bookings" className="section-pad py-24">
      <SectionHeading
        kicker="Mission Critical"
        title="Booking War Room"
        sub={`Japan in December rewards the prepared. ${completed}/${BOOKINGS.length} locked in · ${dueSoon} due within 14 days — soonest deadline first, checkmarks save automatically.`}
      />

      {/* Toolbar */}
      <div className="glass rounded-2xl p-3 mb-6 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => downloadICS("japan-2026-deadlines.ics", buildBookingsICS(BOOKINGS))}
          className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/15 border border-rose-500/30 px-3.5 py-1.5 text-xs font-semibold text-rose-300 hover:bg-rose-500/25 transition-colors"
        >
          <CalendarPlus size={13} /> Add all deadlines to calendar
        </button>
        <button
          type="button"
          onClick={copyCode}
          className="inline-flex items-center gap-1.5 rounded-full glass border border-white/10 px-3.5 py-1.5 text-xs font-semibold text-slate-200 hover:bg-white/10 transition-colors"
        >
          <Share2 size={13} /> Copy progress code
        </button>
        <button
          type="button"
          onClick={pasteCode}
          className="inline-flex items-center gap-1.5 rounded-full glass border border-white/10 px-3.5 py-1.5 text-xs font-semibold text-slate-200 hover:bg-white/10 transition-colors"
        >
          <ClipboardPaste size={13} /> Paste to merge
        </button>
        {shareMsg && <span className="text-xs text-emerald-300 font-semibold">{shareMsg}</span>}
        <span className="ml-auto text-[0.68rem] text-slate-500">Progress is per-device — share a code to combine the crew's.</span>
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

              {/* owner + bucket row */}
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {b.owner && (
                  <span className="inline-flex items-center gap-1 text-[0.65rem] font-bold bg-violet-500/20 text-violet-200 border border-violet-500/40 rounded-full pl-1 pr-2.5 py-0.5">
                    <span className="grid place-items-center w-4 h-4 rounded-full bg-violet-400 text-[0.55rem] text-violet-950 font-black">{b.owner[0]}</span>
                    {b.owner}
                  </span>
                )}
                {b.backups && b.backups.length > 0 && (
                  <span className="text-[0.62rem] font-semibold text-slate-500">+{b.backups.length} racing</span>
                )}
                {!isDone && bk.label && (
                  <span className="text-[0.62rem] font-bold text-slate-400">{bk.label}</span>
                )}
              </div>

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
