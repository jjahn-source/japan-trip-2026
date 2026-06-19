import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  DndContext, DragOverlay, PointerSensor, closestCenter, useDroppable, useSensor, useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Train, Ticket, GripVertical,
  CalendarPlus, Map, MapPin, ListChecks, ChevronsDownUp, ChevronsUpDown,
  CheckCircle2, Circle, Sparkles, AlertTriangle, Dices,
  Eye, EyeOff, Pencil, Send, MessageCircle,
} from "lucide-react";
import { DAYS, type Day } from "../data/itinerary";
import { CONTINGENCIES } from "../data/contingencies";
import { SectionHeading } from "./SectionHeading";
import { WeatherBadge } from "./WeatherBadge";
import { Collapse } from "./ui/Collapse";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { useDayComments, type DayComment } from "../hooks/useDayComments";
import { useItineraryOverrides, type DayOverride } from "../hooks/useItineraryOverrides";
import { useActivityVotes } from "../hooks/useActivityVotes";
import { getIdentityName } from "../hooks/useIdentity";
import { FIREBASE_ENABLED } from "../lib/firebase";
import {
  daySpan, activityMapUrl, mapsRouteUrl, buildDayICS, buildTripICS, downloadICS,
} from "../utils/itineraryTools";

type Activity = Day["activities"][number];

function resolveActivity(key: string): { activity: Activity; srcDate: string } | null {
  const i = key.lastIndexOf(":");
  if (i < 0) return null;
  const date = key.slice(0, i);
  const idx = Number(key.slice(i + 1));
  const src = DAYS.find((d) => d.date === date);
  if (!src || !src.activities[idx]) return null;
  return { activity: src.activities[idx], srcDate: date };
}

function fmtDate(iso: string) {
  return new Date(iso + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function fmtCommentAt(iso: string) {
  const d = new Date(iso);
  return (
    d.toLocaleDateString("en-US", { month: "short", day: "numeric" }) +
    " · " +
    d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
  );
}

function SecTitle({ icon, label, count, colorClass }: { icon: React.ReactNode; label: string; count: number; colorClass: string }) {
  return (
    <span className={`flex items-center gap-2 text-xs font-bold uppercase tracking-wider ${colorClass}`}>
      {icon} {label}
      <span className="text-[0.62rem] font-bold bg-white/10 text-slate-200 rounded-full px-1.5 py-0.5 tabular-nums">{count}</span>
    </span>
  );
}

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

function ActivityRow({
  activityKey, activity, srcDate, isSkipped, isImported, trackMode, isDone, onToggleDone,
  voters, myVoted, myName, onVoteToggle, editMode, onSkipToggle,
  canMoveUp, canMoveDown, onMoveUp, onMoveDown,
  canMovePrevDay, canMoveNextDay, onMovePrevDay, onMoveNextDay,
}: {
  activityKey: string;
  activity: Activity;
  srcDate: string;
  isSkipped: boolean;
  isImported: boolean;
  trackMode: boolean;
  isDone: boolean;
  onToggleDone: () => void;
  voters: string[];
  myVoted: boolean;
  myName: string | null;
  onVoteToggle: () => void;
  editMode: boolean;
  onSkipToggle: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  canMovePrevDay: boolean;
  canMoveNextDay: boolean;
  onMovePrevDay: () => void;
  onMoveNextDay: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: activityKey });
  const mapUrl = activityMapUrl(activity);

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.3 : 1 }}
      className={`flex gap-3 items-start ${isSkipped ? "opacity-40" : ""}`}
    >
      {/* Track / time column */}
      {trackMode && !isSkipped ? (
        <button
          onClick={onToggleDone}
          className="shrink-0 w-16 flex items-center justify-end gap-1 pt-0.5"
          aria-label="toggle done"
        >
          {isDone
            ? <CheckCircle2 size={15} className="text-emerald-400" />
            : <Circle size={15} className="text-slate-600 hover:text-slate-400" />}
          <span className={`text-xs font-bold tabular-nums ${isDone ? "text-emerald-400/70 line-through" : "text-rose-300/90"}`}>{activity.time}</span>
        </button>
      ) : (
        <span className="shrink-0 w-16 text-right text-xs font-bold text-rose-300/90 pt-0.5 tabular-nums">{activity.time}</span>
      )}

      {/* Activity content */}
      <div className="relative pl-4 border-l border-white/10 pb-0.5 min-w-0 flex-1">
        <span className="absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full bg-gradient-to-br from-rose-400 to-fuchsia-500" />
        <p className={`font-semibold leading-snug flex items-center gap-2 flex-wrap ${isDone ? "text-slate-500 line-through" : isSkipped ? "line-through text-slate-500" : ""}`}>
          {activity.title}
          {isImported && (
            <span className="text-[0.6rem] font-bold bg-violet-500/20 text-violet-300 border border-violet-500/30 rounded-full px-1.5 py-0.5">
              from {fmtDate(srcDate)}
            </span>
          )}
          {activity.booking && !isSkipped && (
            <span className="inline-flex items-center gap-1 text-[0.65rem] font-bold uppercase tracking-wide bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full px-2 py-0.5">
              <Ticket size={10} /> book ahead
            </span>
          )}
          {mapUrl && !isSkipped && (
            <a
              href={mapUrl} target="_blank" rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-0.5 text-[0.65rem] font-semibold text-sky-400/80 hover:text-sky-300"
              title={activity.place ?? "Open in Google Maps"}
            >
              <MapPin size={10} /> map
            </a>
          )}
        </p>
        {activity.note && <p className={`text-sm mt-0.5 ${isDone || isSkipped ? "text-slate-600" : "text-slate-400"}`}>{activity.note}</p>}
      </div>

      {/* Activity vote */}
      {FIREBASE_ENABLED && !isSkipped && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onVoteToggle(); }}
          disabled={!myName}
          title={voters.length ? voters.join(", ") : myName ? "Tap to join" : "Pick a name to vote"}
          className={`shrink-0 flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[0.6rem] font-bold border transition-colors disabled:cursor-not-allowed mt-0.5 ${
            myVoted
              ? "bg-rose-500/20 border-rose-500/30 text-rose-300 hover:bg-rose-500/30"
              : voters.length > 0
                ? "bg-white/8 border-white/12 text-slate-400 hover:bg-white/12"
                : "border-transparent text-slate-700 hover:border-white/10 hover:text-slate-500"
          }`}
        >
          👍{voters.length > 0 && <span>{voters.length}</span>}
        </button>
      )}

      {/* Reorder / move controls in edit mode */}
      {editMode && (
        <div className="shrink-0 flex items-center gap-0.5 mt-0.5">
          <div className="flex flex-col">
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onMoveUp(); }}
              disabled={!canMoveUp}
              title="Move up"
              className="w-5 h-3.5 flex items-center justify-center rounded-t bg-white/5 border border-white/10 border-b-0 text-slate-500 hover:bg-white/10 hover:text-slate-200 disabled:opacity-20"
            >
              <ChevronUp size={10} />
            </button>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onMoveDown(); }}
              disabled={!canMoveDown}
              title="Move down"
              className="w-5 h-3.5 flex items-center justify-center rounded-b bg-white/5 border border-white/10 text-slate-500 hover:bg-white/10 hover:text-slate-200 disabled:opacity-20"
            >
              <ChevronDown size={10} />
            </button>
          </div>
          {canMovePrevDay && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onMovePrevDay(); }}
              title="Move to previous day"
              className="w-5 h-7 flex items-center justify-center rounded bg-white/5 border border-white/10 text-slate-500 hover:bg-indigo-500/15 hover:border-indigo-500/30 hover:text-indigo-300"
            >
              <ChevronLeft size={12} />
            </button>
          )}
          {canMoveNextDay && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onMoveNextDay(); }}
              title="Move to next day"
              className="w-5 h-7 flex items-center justify-center rounded bg-white/5 border border-white/10 text-slate-500 hover:bg-indigo-500/15 hover:border-indigo-500/30 hover:text-indigo-300"
            >
              <ChevronRight size={12} />
            </button>
          )}
          <button
            type="button"
            {...attributes}
            {...listeners}
            title="Drag to reorder or move to another day"
            className="w-5 h-7 flex items-center justify-center rounded bg-white/5 border border-white/10 text-slate-500 hover:bg-white/10 hover:text-slate-200 cursor-grab active:cursor-grabbing touch-none"
          >
            <GripVertical size={12} />
          </button>
        </div>
      )}

      {/* Skip toggle in edit mode */}
      {editMode && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onSkipToggle(); }}
          className={`shrink-0 w-7 h-7 rounded-lg flex items-center justify-center border transition-colors ${
            isSkipped
              ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25"
              : "bg-white/5 border-white/10 text-slate-500 hover:bg-rose-500/10 hover:border-rose-500/20 hover:text-rose-400"
          }`}
          title={isSkipped ? "Restore activity" : "Skip this activity"}
        >
          {isSkipped ? <Eye size={12} /> : <EyeOff size={12} />}
        </button>
      )}
    </li>
  );
}

function DayCard({
  day, index, open, onToggle, trackMode, done, setDone,
  override, comments, myName, prevDate, nextDate,
  onSkip, onAddComment, getVoters, onVoteToggle, onMove,
}: {
  day: Day;
  index: number;
  open: boolean;
  onToggle: () => void;
  trackMode: boolean;
  done: Record<string, boolean>;
  setDone: (next: Record<string, boolean>) => void;
  override?: DayOverride;
  comments: DayComment[];
  myName: string | null;
  prevDate?: string;
  nextDate?: string;
  onSkip: (key: string, val: boolean) => void;
  onAddComment: (text: string) => void;
  getVoters: (key: string) => string[];
  onVoteToggle: (key: string) => void;
  onMove: (key: string, fromDate: string, toDate: string, beforeKey: string | null) => void;
}) {
  const [editMode, setEditMode] = useState(false);
  const [commentDraft, setCommentDraft] = useState("");
  const { setNodeRef: setListRef } = useDroppable({ id: `daydrop:${day.date}` });

  const span = daySpan(day);
  const mappedCount = day.activities.filter((a) => a.coord).length;
  const bookCount = day.activities.filter((a) => a.booking).length;
  const routeUrl = mapsRouteUrl(day);

  // Activity keys and ordering
  const defaultKeys = day.activities.map((_, i) => `${day.date}:${i}`);
  const effectiveKeys: string[] = override?.order?.length ? override.order : defaultKeys;
  const skippedSet = new Set<string>(override?.skipped ?? []);

  // In view mode hide skipped; in edit mode show all so they can be restored
  const displayKeys = editMode ? effectiveKeys : effectiveKeys.filter((k) => !skippedSet.has(k));

  const doneKey = (key: string) => key.replace(":", "-");
  const doneCount = displayKeys.filter((k) => !skippedSet.has(k) && done[doneKey(k)]).length;
  const visibleCount = displayKeys.filter((k) => !skippedSet.has(k)).length;
  const pct = visibleCount ? Math.round((doneCount / visibleCount) * 100) : 0;

  const submitComment = () => {
    const text = commentDraft.trim();
    if (!text) return;
    setCommentDraft("");
    onAddComment(text);
  };

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
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[0.68rem] font-semibold text-slate-500">
            <span>{day.activities.length} stops</span>
            {span && <><span>·</span><span>{span.first}–{span.last} ({span.label})</span></>}
            {mappedCount > 0 && <><span>·</span><span className="text-rose-400/80">{mappedCount} mapped</span></>}
            {bookCount > 0 && <><span>·</span><span className="text-amber-400/90">{bookCount} to book</span></>}
            {day.events && day.events.length > 0 && <><span>·</span><span className="text-violet-300">✨ {day.events.length} live</span></>}
            {trackMode && doneCount > 0 && <><span>·</span><span className="text-emerald-400">{doneCount}/{visibleCount} done</span></>}
            {comments.length > 0 && <><span>·</span><span className="text-indigo-400/80"><MessageCircle size={10} className="inline mr-0.5" />{comments.length}</span></>}
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
              <WeatherBadge city={day.city} dateISO={day.date} wx={day.wx} />

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
                {FIREBASE_ENABLED && (
                  <button
                    onClick={() => setEditMode((e) => !e)}
                    className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold border transition-colors ${
                      editMode
                        ? "bg-indigo-500/20 border-indigo-500/40 text-indigo-300"
                        : "bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 hover:text-slate-200"
                    }`}
                  >
                    <Pencil size={12} /> {editMode ? "Done editing" : "Edit plan"}
                  </button>
                )}
              </div>

              {trackMode && (
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex-1 h-2 rounded-full bg-white/10 overflow-hidden">
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400"
                      animate={{ width: `${pct}%` }}
                      transition={{ type: "spring", stiffness: 80, damping: 20 }}
                    />
                  </div>
                  <span className="text-xs font-bold tabular-nums text-emerald-300">{doneCount}/{visibleCount}</span>
                </div>
              )}

              {day.transport && (
                <div className="mb-4 flex items-start gap-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 p-3 text-sm text-indigo-200">
                  <Train size={16} className="mt-0.5 shrink-0" />
                  <span>{day.transport}</span>
                </div>
              )}

              <SortableContext items={displayKeys} strategy={verticalListSortingStrategy}>
                <ul ref={setListRef} className="space-y-3 min-h-2">
                  {displayKeys.map((key, idx) => {
                    const resolved = resolveActivity(key);
                    if (!resolved) return null;
                    const { activity: a, srcDate } = resolved;
                    const isSkipped = skippedSet.has(key);
                    const isImported = srcDate !== day.date;
                    const dk = doneKey(key);
                    const isDone = !!done[dk];
                    const voters = getVoters(key);
                    const myVoted = myName ? voters.includes(myName) : false;

                    return (
                      <ActivityRow
                        key={key}
                        activityKey={key}
                        activity={a}
                        srcDate={srcDate}
                        isSkipped={isSkipped}
                        isImported={isImported}
                        trackMode={trackMode}
                        isDone={isDone}
                        onToggleDone={() => setDone({ ...done, [dk]: !isDone })}
                        voters={voters}
                        myVoted={myVoted}
                        myName={myName}
                        onVoteToggle={() => onVoteToggle(key)}
                        editMode={editMode}
                        onSkipToggle={() => onSkip(key, !isSkipped)}
                        canMoveUp={idx > 0}
                        canMoveDown={idx < displayKeys.length - 1}
                        onMoveUp={() => onMove(key, day.date, day.date, displayKeys[idx - 1] ?? null)}
                        onMoveDown={() => onMove(key, day.date, day.date, displayKeys[idx + 2] ?? null)}
                        canMovePrevDay={!!prevDate}
                        canMoveNextDay={!!nextDate}
                        onMovePrevDay={() => prevDate && onMove(key, day.date, prevDate, null)}
                        onMoveNextDay={() => nextDate && onMove(key, day.date, nextDate, null)}
                      />
                    );
                  })}
                </ul>
              </SortableContext>

              <div className="mt-5 space-y-2.5">
                {day.events && day.events.length > 0 && (
                  <Collapse
                    className="rounded-xl bg-amber-500/[0.07] border border-amber-500/20 px-4 py-3"
                    defaultOpen={day.events.some((e) => e.kind === "closure")}
                    title={<SecTitle icon={<Sparkles size={13} />} label="Happening during our visit" count={day.events.length} colorClass="text-amber-300" />}
                  >
                    <div className="mt-3 space-y-2">
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
                  </Collapse>
                )}

                {day.intel && day.intel.length > 0 && (
                  <Collapse
                    className="rounded-xl bg-cyan-500/[0.07] border border-cyan-500/20 px-4 py-3"
                    title={<SecTitle icon={<span>🧠</span>} label="Local Intel" count={day.intel.length} colorClass="text-cyan-300" />}
                  >
                    <ul className="mt-3 space-y-1.5">
                      {day.intel.map((tip, i) => (
                        <li key={i} className="text-sm text-slate-300 leading-relaxed flex gap-2">
                          <span className="text-cyan-400 shrink-0">▸</span><span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </Collapse>
                )}

                {day.alts && day.alts.length > 0 && (
                  <Collapse
                    className="rounded-xl bg-fuchsia-500/[0.07] border border-fuchsia-500/20 px-4 py-3"
                    title={<SecTitle icon={<Dices size={13} />} label="Audibles & rain plans" count={day.alts.length} colorClass="text-fuchsia-300" />}
                  >
                    <ul className="mt-3 space-y-1.5">
                      {day.alts.map((a, i) => (
                        <li key={i} className="text-sm text-slate-300 leading-relaxed flex gap-2">
                          <span className="text-fuchsia-400 shrink-0">▸</span><span>{a}</span>
                        </li>
                      ))}
                    </ul>
                  </Collapse>
                )}

                {(() => {
                  const cont = CONTINGENCIES.find((c) => c.date === day.date);
                  if (!cont) return null;
                  return (
                    <Collapse
                      className="rounded-xl bg-sky-500/[0.07] border border-sky-500/20 px-4 py-3"
                      title={<SecTitle icon={<span>☂️</span>} label="Contingency Plans" count={cont.rainPlan.length + cont.energySlumpPlan.length + cont.lastMinuteCancellation.length} colorClass="text-sky-300" />}
                    >
                      <div className="mt-3 space-y-4">
                        <div>
                          <p className="text-[0.65rem] font-bold uppercase tracking-wider text-sky-400 mb-1.5">If it rains</p>
                          <ul className="space-y-1">
                            {cont.rainPlan.map((item, i) => (
                              <li key={i} className="text-sm text-slate-300 leading-relaxed flex gap-2">
                                <span className="text-sky-400 shrink-0">▸</span><span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <p className="text-[0.65rem] font-bold uppercase tracking-wider text-amber-400 mb-1.5">Energy slump</p>
                          <ul className="space-y-1">
                            {cont.energySlumpPlan.map((item, i) => (
                              <li key={i} className="text-sm text-slate-300 leading-relaxed flex gap-2">
                                <span className="text-amber-400 shrink-0">▸</span><span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <p className="text-[0.65rem] font-bold uppercase tracking-wider text-rose-400 mb-1.5">Last-minute cancellation</p>
                          <ul className="space-y-1">
                            {cont.lastMinuteCancellation.map((item, i) => (
                              <li key={i} className="text-sm text-slate-300 leading-relaxed flex gap-2">
                                <span className="text-rose-400 shrink-0">▸</span><span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </Collapse>
                  );
                })()}

                {/* Day comments */}
                {FIREBASE_ENABLED && (
                  <div className="rounded-xl bg-indigo-500/[0.07] border border-indigo-500/20 px-4 py-3">
                    <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-300 mb-3">
                      <MessageCircle size={13} />
                      Day notes
                      {comments.length > 0 && (
                        <span className="text-[0.62rem] font-bold bg-white/10 text-slate-200 rounded-full px-1.5 py-0.5 tabular-nums">{comments.length}</span>
                      )}
                    </p>
                    {comments.length > 0 && (
                      <div className="mb-3 space-y-2">
                        {comments.map((c) => (
                          <div key={c.id} className="flex gap-2.5 items-start">
                            <div className="w-5 h-5 rounded-full shrink-0 bg-white/10 flex items-center justify-center text-[0.5rem] font-bold text-slate-400">
                              {c.author.slice(0, 2).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <span className="text-xs font-bold text-slate-400">{c.author}</span>
                              <span className="text-[0.6rem] text-slate-600 ml-2">{fmtCommentAt(c.at)}</span>
                              <p className="text-sm text-slate-300 mt-0.5 leading-snug">{c.text}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={commentDraft}
                        onChange={(e) => setCommentDraft(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submitComment(); } }}
                        placeholder={myName ? "Add a note for this day…" : "Pick a name to comment"}
                        disabled={!myName}
                        className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500/40 disabled:opacity-40 min-w-0"
                      />
                      <button
                        type="button"
                        onClick={submitComment}
                        disabled={!commentDraft.trim() || !myName}
                        aria-label="Post note"
                        className="shrink-0 w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/30 transition-colors flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <Send size={13} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
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

  const { forDate, add: addComment } = useDayComments();
  const { overrides, skip, setOrder } = useItineraryOverrides();
  const { getVoters, toggle: toggleVote } = useActivityVotes();
  const myName = getIdentityName();
  const [activeDragKey, setActiveDragKey] = useState<string | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const totalDone = useMemo(() => Object.values(done).filter(Boolean).length, [done]);

  const expandAll = () => setOpenMap(Object.fromEntries(DAYS.map((_, i) => [i, true])));
  const collapseAll = () => setOpenMap({});
  const jumpTo = (i: number) => {
    setOpenMap((m) => ({ ...m, [i]: true }));
    requestAnimationFrame(() =>
      document.getElementById(`day-${i}`)?.scrollIntoView({ behavior: "smooth", block: "start" }),
    );
  };

  // Current effective activity order for a day, given live overrides
  const getOrder = (date: string): string[] => {
    const d = DAYS.find((x) => x.date === date);
    if (!d) return [];
    const defaultKeys = d.activities.map((_, i) => `${date}:${i}`);
    return overrides[date]?.order?.length ? [...overrides[date].order] : defaultKeys;
  };
  const keyToDate = (key: string): string | undefined => DAYS.find((d) => getOrder(d.date).includes(key))?.date;

  // Moves `key` so it lands just before `beforeKey` in `toDate` (or at the end if null),
  // skipping it at its origin day if it's leaving that day, restoring it if it's coming back.
  const moveActivity = (key: string, fromDate: string, toDate: string, beforeKey: string | null) => {
    const originDate = key.slice(0, key.lastIndexOf(":"));
    if (fromDate !== toDate) setOrder(fromDate, getOrder(fromDate).filter((k) => k !== key));
    skip(originDate, key, originDate !== toDate);
    const toOrder = getOrder(toDate).filter((k) => k !== key);
    const insertAt = beforeKey ? toOrder.indexOf(beforeKey) : -1;
    if (insertAt < 0) toOrder.push(key); else toOrder.splice(insertAt, 0, key);
    setOrder(toDate, toOrder);
  };

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    setActiveDragKey(null);
    if (!over) return;
    const draggedKey = String(active.id);
    const overId = String(over.id);
    if (overId === draggedKey) return;
    const fromDate = keyToDate(draggedKey);
    if (!fromDate) return;
    if (overId.startsWith("daydrop:")) {
      moveActivity(draggedKey, fromDate, overId.slice("daydrop:".length), null);
      return;
    }
    const toDate = keyToDate(overId);
    if (!toDate) return;
    moveActivity(draggedKey, fromDate, toDate, overId);
  };

  useEffect(() => {
    const onOpenDay = (e: Event) => {
      const i = (e as CustomEvent<number>).detail;
      if (typeof i === "number") setOpenMap((m) => ({ ...m, [i]: true }));
    };
    window.addEventListener("trip:open-day", onOpenDay);
    return () => window.removeEventListener("trip:open-day", onOpenDay);
  }, []);

  return (
    <section id="itinerary" className="section-pad py-24">
      <SectionHeading
        kicker="The Master Plan"
        title="16 Days, Day by Day"
        sub="Every day: activities, live December events, local intel, and backup plans. Flip Trip Mode to tick off the adventure as it happens."
      />

      <div className="glass rounded-2xl p-4 mb-6 space-y-3">
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
            {trackMode && totalDone > 0 && <span className="ml-1 tabular-nums">· {totalDone} done</span>}
          </button>
        </div>
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

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={({ active }) => setActiveDragKey(String(active.id))}
        onDragEnd={handleDragEnd}
        onDragCancel={() => setActiveDragKey(null)}
      >
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
              override={overrides[d.date]}
              comments={forDate(d.date)}
              myName={myName}
              prevDate={DAYS[i - 1]?.date}
              nextDate={DAYS[i + 1]?.date}
              onSkip={(key, val) => skip(d.date, key, val)}
              onAddComment={(text) => { if (myName) addComment(d.date, myName, text); }}
              getVoters={getVoters}
              onVoteToggle={(key) => { if (myName) toggleVote(key, myName); }}
              onMove={moveActivity}
            />
          ))}
        </div>
        <DragOverlay>
          {activeDragKey && (() => {
            const resolved = resolveActivity(activeDragKey);
            return resolved ? (
              <div className="flex items-center gap-2 rounded-lg bg-slate-800 border border-indigo-400/50 shadow-xl px-3 py-2 text-sm font-semibold text-slate-100">
                <GripVertical size={14} className="text-slate-500 shrink-0" />
                {resolved.activity.title}
              </div>
            ) : null;
          })()}
        </DragOverlay>
      </DndContext>
    </section>
  );
}
