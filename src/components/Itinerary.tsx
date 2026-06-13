import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ChevronDown, Train, Ticket, Dices, ExternalLink, CloudSun,
  CalendarPlus, Map, MapPin, ListChecks, ChevronsDownUp, ChevronsUpDown, CheckCircle2, Circle,
  Sparkles, AlertTriangle, Target,
} from "lucide-react";
import { DAYS, type Day } from "../data/itinerary";
import { SectionHeading } from "./SectionHeading";
import { useLocalStorage } from "../hooks/useLocalStorage";
import {
  daySpan, mapsPinUrl, mapsRouteUrl, buildDayICS, buildTripICS, downloadICS,
} from "../utils/itineraryTools";

function fmtDate(iso: string) {
  return new Date(iso + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// Aggregate trip stats (module-load, cheap)
const TRIP = {
  days: DAYS.length,
  activities: DAYS.reduce((s, d) => s + d.activities.length, 0),
  bookings: DAYS.reduce((s, d) => s + d.activities.filter((a) => a.booking).length, 0),
  mapped: DAYS.reduce((s, d) => s + d.activities.filter((a) => a.coord).length, 0),
  links: DAYS.reduce((s, d) => s + (d.links?.length ?? 0), 0),
  audibles: DAYS.reduce((s, d) => s + (d.alts?.length ?? 0), 0),
  events: DAYS.reduce((s, d) => s + (d.events?.length ?? 0), 0),
  dares: DAYS.reduce((s, d) => s + (d.dares?.length ?? 0), 0),
};

function TopButton({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-full glass border border-white/10 hover:bg-white/10 px-3.5 py-1.5 text-xs font-semibold text-slate-200 transition-colors"
    >
      {children}
    </button>
  );
}

function DayCard({
  day, index, open, onToggle, trackMode, done, setDone,
}: {
  day: Day;
  index: number;
  open: boolean;
  onToggle: () => void;
  trackMode: boolean;
  done: Record<string, boolean>;
  setDone: (next: Record<string, boolean>) => void;
}) {
  const span = daySpan(day);
  const mappedCount = day.activities.filter((a) => a.coord).length;
  const bookCount = day.activities.filter((a) => a.booking).length;
  const routeUrl = mapsRouteUrl(day);

  const doneCount = day.activities.filter((_, i) => done[`${day.date}-${i}`]).length;
  const pct = Math.round((doneCount / day.activities.length) * 100);

  return (
    <motion.div
      id={`day-${index}`}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.4 }}
      className="glass rounded-2xl overflow-hidden scroll-mt-24"
    >
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-4 p-4 sm:p-5 text-left hover:bg-white/[0.03] transition-colors"
      >
        <div className={`shrink-0 w-14 h-14 rounded-xl bg-gradient-to-br ${day.theme} flex flex-col items-center justify-center font-bold shadow-lg`}>
          <span className="text-[0.6rem] uppercase opacity-90">{day.dow}</span>
          <span className="text-sm leading-tight">{fmtDate(day.date)}</span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-xs text-slate-400 font-semibold uppercase tracking-wider">
            <span>Day {index + 1}</span>
            <span>·</span>
            <span>{day.city} <span className="font-[Noto_Serif_JP]">{day.cityJp}</span></span>
          </div>
          <h3 className="font-bold text-lg sm:text-xl truncate">{day.emoji} {day.title}</h3>
          {/* at-a-glance stat strip */}
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[0.68rem] font-semibold text-slate-500">
            <span>{day.activities.length} stops</span>
            {span && <><span>·</span><span>{span.first}–{span.last} ({span.label})</span></>}
            {mappedCount > 0 && <><span>·</span><span className="text-rose-400/80">{mappedCount} mapped</span></>}
            {bookCount > 0 && <><span>·</span><span className="text-amber-400/90">{bookCount} to book</span></>}
            {day.events && day.events.length > 0 && <><span>·</span><span className="text-violet-300">✨ {day.events.length} live</span></>}
            {trackMode && doneCount > 0 && <><span>·</span><span className="text-emerald-400">{doneCount}/{day.activities.length} done</span></>}
          </div>
        </div>
        <ChevronDown size={20} className={`shrink-0 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="px-4 sm:px-5 pb-5 pt-1">
              {/* weather + tools */}
              <p className="mb-3 flex items-center gap-2 flex-wrap text-xs font-semibold text-cyan-200/90">
                <CloudSun size={14} className="shrink-0" />
                <span>{day.wx}</span>
                <a
                  href={`https://www.google.com/search?q=${encodeURIComponent(
                    day.city.replace(/\s*\(.*\)/, "").replace(/\s*→.*/, "") + " 14 day weather forecast December",
                  )}`}
                  target="_blank" rel="noreferrer"
                  className="inline-flex items-center gap-0.5 text-cyan-300/80 hover:text-cyan-200 underline decoration-dotted whitespace-nowrap"
                >
                  live forecast ↗
                </a>
              </p>

              <div className="mb-4 flex flex-wrap gap-2">
                <button
                  onClick={() => downloadICS(`japan-2026-dec-${day.date.slice(8)}.ics`, buildDayICS(day))}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-1.5 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/25 transition-colors"
                >
                  <CalendarPlus size={12} /> Add day to calendar
                </button>
                {routeUrl && (
                  <a
                    href={routeUrl} target="_blank" rel="noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg bg-rose-500/15 border border-rose-500/30 px-2.5 py-1.5 text-xs font-semibold text-rose-300 hover:bg-rose-500/25 transition-colors"
                  >
                    <Map size={12} /> Route this day in Maps
                  </a>
                )}
              </div>

              {/* trip-mode progress */}
              {trackMode && (
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex-1 h-2 rounded-full bg-white/10 overflow-hidden">
                    <motion.div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400" animate={{ width: `${pct}%` }} transition={{ type: "spring", stiffness: 80, damping: 20 }} />
                  </div>
                  <span className="text-xs font-bold tabular-nums text-emerald-300">{doneCount}/{day.activities.length}</span>
                </div>
              )}

              {/* limited-time events verified ON during our visit */}
              {day.events && day.events.length > 0 && (
                <div className="mb-4 space-y-2">
                  <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-300">
                    <Sparkles size={13} /> Happening during our visit — limited-time & date-specific
                  </p>
                  {day.events.map((ev) => {
                    const isWarn = ev.kind === "closure";
                    const style = isWarn
                      ? "bg-red-500/10 border-red-500/30"
                      : ev.kind === "illumination"
                        ? "bg-violet-500/10 border-violet-500/25"
                        : ev.kind === "market"
                          ? "bg-emerald-500/10 border-emerald-500/25"
                          : ev.kind === "seasonal"
                            ? "bg-cyan-500/10 border-cyan-500/25"
                            : "bg-amber-500/10 border-amber-500/25";
                    return (
                      <div key={ev.name} className={`rounded-xl border p-3 ${style}`}>
                        <div className="flex items-start gap-2 flex-wrap">
                          {isWarn
                            ? <AlertTriangle size={14} className="text-red-400 mt-0.5 shrink-0" />
                            : <Sparkles size={14} className="text-amber-400 mt-0.5 shrink-0" />}
                          <span className="font-bold text-sm leading-snug text-slate-100">{ev.name}</span>
                          <span className="text-[0.65rem] font-bold uppercase tracking-wide bg-white/10 text-slate-300 rounded-full px-2 py-0.5">{ev.window}</span>
                        </div>
                        <p className="mt-1.5 text-xs text-slate-300 leading-relaxed">{ev.note}</p>
                        <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[0.68rem] text-slate-500 font-semibold">
                          <span>💴 {ev.cost}</span>
                          <span>🚉 {ev.station}</span>
                          {ev.url && (
                            <a href={ev.url} target="_blank" rel="noreferrer" className="text-sky-400/80 hover:text-sky-300 underline decoration-dotted">
                              official ↗
                            </a>
                          )}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}

              {day.transport && (
                <div className="mb-4 flex items-start gap-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 p-3 text-sm text-indigo-200">
                  <Train size={16} className="mt-0.5 shrink-0" />
                  <span>{day.transport}</span>
                </div>
              )}

              <ul className="space-y-3">
                {day.activities.map((a, i) => {
                  const key = `${day.date}-${i}`;
                  const isDone = !!done[key];
                  return (
                    <li key={i} className="flex gap-3">
                      {trackMode ? (
                        <button
                          onClick={() => setDone({ ...done, [key]: !isDone })}
                          className="shrink-0 w-16 flex items-center justify-end gap-1 pt-0.5"
                          aria-label="toggle done"
                        >
                          {isDone
                            ? <CheckCircle2 size={15} className="text-emerald-400" />
                            : <Circle size={15} className="text-slate-600 hover:text-slate-400" />}
                          <span className={`text-xs font-bold tabular-nums ${isDone ? "text-emerald-400/70 line-through" : "text-rose-300/90"}`}>{a.time}</span>
                        </button>
                      ) : (
                        <span className="shrink-0 w-16 text-right text-xs font-bold text-rose-300/90 pt-0.5 tabular-nums">{a.time}</span>
                      )}
                      <div className="relative pl-4 border-l border-white/10 pb-0.5 min-w-0">
                        <span className="absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full bg-gradient-to-br from-rose-400 to-fuchsia-500" />
                        <p className={`font-semibold leading-snug flex items-center gap-2 flex-wrap ${isDone ? "text-slate-500 line-through" : ""}`}>
                          {a.title}
                          {a.booking && (
                            <span className="inline-flex items-center gap-1 text-[0.65rem] font-bold uppercase tracking-wide bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full px-2 py-0.5">
                              <Ticket size={10} /> book ahead
                            </span>
                          )}
                          {a.coord && (
                            <a
                              href={mapsPinUrl(a.coord)} target="_blank" rel="noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex items-center gap-0.5 text-[0.65rem] font-semibold text-sky-400/80 hover:text-sky-300"
                            >
                              <MapPin size={10} /> map
                            </a>
                          )}
                        </p>
                        {a.note && <p className={`text-sm mt-0.5 ${isDone ? "text-slate-600" : "text-slate-400"}`}>{a.note}</p>}
                      </div>
                    </li>
                  );
                })}
              </ul>

              {/* Daily Dares — degenerate mission checklist, always checkable */}
              {day.dares && day.dares.length > 0 && (
                <div className="mt-5 rounded-xl bg-rose-500/10 border border-rose-500/25 p-4">
                  <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-rose-300 mb-2.5">
                    <Target size={13} /> Daily Dares — tap to claim ({day.dares.filter((_, i) => done[`${day.date}-dare-${i}`]).length}/{day.dares.length})
                  </p>
                  <ul className="space-y-1">
                    {day.dares.map((dare, i) => {
                      const key = `${day.date}-dare-${i}`;
                      const claimed = !!done[key];
                      return (
                        <li key={i}>
                          <button
                            onClick={() => setDone({ ...done, [key]: !claimed })}
                            className="w-full flex items-start gap-2.5 text-left rounded-lg px-2 py-1.5 hover:bg-white/[0.05] transition-colors"
                          >
                            {claimed
                              ? <CheckCircle2 size={16} className="text-rose-400 shrink-0 mt-0.5" />
                              : <Circle size={16} className="text-slate-600 group-hover:text-slate-400 shrink-0 mt-0.5" />}
                            <span className={`text-sm leading-snug ${claimed ? "line-through text-slate-500" : "text-slate-200"}`}>{dare}</span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}

              {day.alts && day.alts.length > 0 && (
                <div className="mt-5 rounded-xl bg-fuchsia-500/10 border border-fuchsia-500/20 p-4">
                  <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-fuchsia-300 mb-2">
                    <Dices size={13} /> Audibles — rain plans, split-squad quests & overtime missions
                  </p>
                  <ul className="space-y-1.5">
                    {day.alts.map((a, i) => (
                      <li key={i} className="text-sm text-slate-300 leading-relaxed flex gap-2">
                        <span className="text-fuchsia-400 shrink-0">▸</span><span>{a}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {day.links && day.links.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {day.links.map((l) => (
                    <a
                      key={l.url} href={l.url} target="_blank" rel="noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-500/15 border border-indigo-500/30 px-2.5 py-1.5 text-xs font-semibold text-indigo-300 hover:text-indigo-100 hover:bg-indigo-500/25 transition-colors"
                    >
                      <ExternalLink size={11} />{l.label}
                    </a>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export function Itinerary() {
  const [openMap, setOpenMap] = useState<Record<number, boolean>>({ 0: true });
  const [trackMode, setTrackMode] = useLocalStorage("itinerary-track-mode", false);
  const [done, setDone] = useLocalStorage<Record<string, boolean>>("itinerary-done", {});

  const totalDone = useMemo(() => Object.values(done).filter(Boolean).length, [done]);

  const expandAll = () => setOpenMap(Object.fromEntries(DAYS.map((_, i) => [i, true])));
  const collapseAll = () => setOpenMap({});
  const jumpTo = (i: number) => {
    setOpenMap((m) => ({ ...m, [i]: true }));
    requestAnimationFrame(() =>
      document.getElementById(`day-${i}`)?.scrollIntoView({ behavior: "smooth", block: "start" }),
    );
  };

  return (
    <section id="itinerary" className="section-pad py-24">
      <SectionHeading
        kicker="The Master Plan"
        title="16 Days, Day by Day"
        sub="Tokyo neon → Kamakura coast → Kyoto temples → Nara deer → Osaka chaos → Hiroshima reflection → one last Tokyo lap. Every day carries its December forecast (live link), the limited-time events actually ON during our visit, a degenerate Daily Dares checklist, calendar export, and one-tap Google Maps routing. Flip on Trip Mode and tick off the adventure as it happens."
      />

      {/* Toolbar */}
      <div className="glass rounded-2xl p-4 mb-6 space-y-3">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs font-semibold text-slate-400">
          <span><span className="text-slate-100 font-bold tabular-nums">{TRIP.days}</span> days</span>
          <span><span className="text-slate-100 font-bold tabular-nums">{TRIP.activities}</span> activities</span>
          <span><span className="text-amber-300 font-bold tabular-nums">{TRIP.bookings}</span> to pre-book</span>
          <span><span className="text-rose-300 font-bold tabular-nums">{TRIP.mapped}</span> mapped stops</span>
          <span><span className="text-fuchsia-300 font-bold tabular-nums">{TRIP.audibles}</span> audibles</span>
          <span><span className="text-amber-300 font-bold tabular-nums">{TRIP.events}</span> live events</span>
          <span><span className="text-rose-300 font-bold tabular-nums">{TRIP.dares}</span> daily dares</span>
          <span><span className="text-indigo-300 font-bold tabular-nums">{TRIP.links}</span> official links</span>
          {trackMode && totalDone > 0 && (
            <span className="text-emerald-300"><span className="font-bold tabular-nums">{totalDone}</span> done</span>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <TopButton onClick={expandAll}><ChevronsUpDown size={13} /> Expand all</TopButton>
          <TopButton onClick={collapseAll}><ChevronsDownUp size={13} /> Collapse all</TopButton>
          <TopButton onClick={() => downloadICS("japan-trip-2026.ics", buildTripICS(DAYS))}>
            <CalendarPlus size={13} /> Add whole trip to calendar
          </TopButton>
          <button
            onClick={() => setTrackMode(!trackMode)}
            className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold border transition-colors ${
              trackMode
                ? "bg-emerald-500 border-emerald-400 text-white"
                : "glass border-white/10 text-slate-200 hover:bg-white/10"
            }`}
          >
            <ListChecks size={13} /> Trip Mode {trackMode ? "ON" : "OFF"}
          </button>
        </div>
        {/* jump-to-day chips */}
        <div className="flex flex-wrap gap-1.5 pt-1 border-t border-white/5">
          {DAYS.map((d, i) => (
            <button
              key={d.date}
              onClick={() => jumpTo(i)}
              className="rounded-md glass border border-white/5 hover:bg-white/10 px-2 py-1 text-[0.68rem] font-semibold text-slate-400 hover:text-slate-100 transition-colors"
              title={d.title}
            >
              {d.emoji} {d.date.slice(8)}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {DAYS.map((d, i) => (
          <DayCard
            key={d.date}
            day={d}
            index={i}
            open={!!openMap[i]}
            onToggle={() => setOpenMap((m) => ({ ...m, [i]: !m[i] }))}
            trackMode={trackMode}
            done={done}
            setDone={setDone}
          />
        ))}
      </div>
    </section>
  );
}
