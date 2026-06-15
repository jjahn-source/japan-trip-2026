import { CheckCircle2, Circle, DollarSign, Footprints, Users, MessageSquare } from "lucide-react";
import { DAYS } from "../data/itinerary";
import { CREW } from "../data/dailyProgress";
import { SectionHeading } from "./SectionHeading";
import { useLocalStorage } from "../hooks/useLocalStorage";

type DailyProgress = {
  activitiesDone: number;
  spentToday: number;
  steps: number;
  notes: string;
  crewStatus: Record<string, "ready" | "tired" | "hungry" | "lost">;
};

export function DailyHuddle() {
  const today = new Date().toISOString().split("T")[0];
  const [progress, setProgress] = useLocalStorage<Record<string, DailyProgress>>(
    "daily-huddle",
    {}
  );

  const currentDay = DAYS.find((d) => d.date === today);
  const dayIndex = DAYS.findIndex((d) => d.date === today);
  const todayProgress = progress[today] || {
    activitiesDone: 0,
    spentToday: 0,
    steps: 0,
    notes: "",
    crewStatus: Object.fromEntries(CREW.map((m) => [m.name, "ready"])),
  };

  const updateProgress = (field: string, value: unknown) => {
    setProgress({
      ...progress,
      [today]: { ...todayProgress, [field]: value },
    });
  };

  const updateCrewStatus = (name: string, status: "ready" | "tired" | "hungry" | "lost") => {
    setProgress({
      ...progress,
      [today]: {
        ...todayProgress,
        crewStatus: { ...todayProgress.crewStatus, [name]: status },
      },
    });
  };

  if (!currentDay || dayIndex < 0) {
    return (
      <section className="section-pad py-24">
        <SectionHeading kicker="Today" title="No trip today" sub="Enjoy the downtime!" />
      </section>
    );
  }

  const pct = currentDay.activities.length
    ? Math.round((todayProgress.activitiesDone / currentDay.activities.length) * 100)
    : 0;

  return (
    <section className="section-pad py-24">
      <SectionHeading
        kicker="Day Status"
        title={`${currentDay.emoji} ${currentDay.title}`}
        sub={`${currentDay.city} — ${new Date(today).toLocaleDateString("en-US", {
          weekday: "long",
          month: "short",
          day: "numeric",
        })}`}
      />

      <div className="grid gap-4 md:grid-cols-2 mb-6">
        {/* Activities Progress */}
        <div className="glass rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-lg">Activities</h3>
            <span className="text-xs font-bold text-slate-400">
              {todayProgress.activitiesDone}/{currentDay.activities.length}
            </span>
          </div>
          <div className="mb-4">
            <div className="flex-1 h-2 rounded-full bg-white/10 overflow-hidden mb-2">
              <div
                className="h-full rounded-full bg-gradient-to-r from-rose-500 to-fuchsia-500"
                style={{ width: `${pct}%` }}
              />
            </div>
            <p className="text-xs text-slate-400">{pct}% complete</p>
          </div>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {currentDay.activities.map((a, i) => (
              <button
                key={i}
                onClick={() =>
                  updateProgress(
                    "activitiesDone",
                    todayProgress.activitiesDone === i + 1 ? i : i + 1
                  )
                }
                className="w-full flex items-start gap-2 text-left p-2 rounded hover:bg-white/5 transition-colors"
              >
                {todayProgress.activitiesDone > i ? (
                  <CheckCircle2 size={16} className="text-emerald-400 mt-0.5 shrink-0" />
                ) : (
                  <Circle size={16} className="text-slate-600 mt-0.5 shrink-0" />
                )}
                <span className={`text-xs ${todayProgress.activitiesDone > i ? "line-through text-slate-600" : "text-slate-200"}`}>
                  {a.time} — {a.title}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Budget & Logistics */}
        <div className="space-y-4">
          {/* Spending */}
          <div className="glass rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <DollarSign size={16} className="text-amber-400" />
              <h3 className="font-bold">Spending Today</h3>
            </div>
            <input
              type="number"
              value={todayProgress.spentToday}
              onChange={(e) => updateProgress("spentToday", parseFloat(e.target.value) || 0)}
              placeholder="$0"
              className="w-full bg-white/10 border border-white/10 rounded px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-rose-400"
            />
            <p className="text-xs text-slate-400 mt-2">Budget: ~$63/person/day</p>
          </div>

          {/* Steps */}
          <div className="glass rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Footprints size={16} className="text-cyan-400" />
              <h3 className="font-bold">Steps Today</h3>
            </div>
            <input
              type="number"
              value={todayProgress.steps}
              onChange={(e) => updateProgress("steps", parseFloat(e.target.value) || 0)}
              placeholder="0"
              className="w-full bg-white/10 border border-white/10 rounded px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
            />
            <p className="text-xs text-slate-400 mt-2">Average: 20k–25k/day</p>
          </div>
        </div>
      </div>

      {/* Crew Status */}
      <div className="glass rounded-2xl p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Users size={16} className="text-violet-400" />
          <h3 className="font-bold">Crew Status</h3>
        </div>
        <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-4">
          {CREW.map((member) => (
            <div key={member.name} className="flex flex-col gap-2">
              <p className="text-xs font-bold text-slate-300">{member.name}</p>
              <div className="flex gap-1">
                {(["ready", "tired", "hungry", "lost"] as const).map((status) => (
                  <button
                    key={status}
                    onClick={() => updateCrewStatus(member.name, status)}
                    className={`flex-1 px-2 py-1 rounded text-[0.65rem] font-semibold transition-colors ${
                      todayProgress.crewStatus[member.name] === status
                        ? "bg-rose-500 text-white"
                        : "bg-white/5 text-slate-400 hover:bg-white/10"
                    }`}
                  >
                    {status === "ready"
                      ? "✓"
                      : status === "tired"
                        ? "😴"
                        : status === "hungry"
                          ? "🍽"
                          : "🗺"}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Notes */}
      <div className="glass rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <MessageSquare size={16} className="text-indigo-400" />
          <h3 className="font-bold">Day Notes</h3>
        </div>
        <textarea
          value={todayProgress.notes}
          onChange={(e) => updateProgress("notes", e.target.value)}
          placeholder="What happened today? Any wins, learnings, pivots?"
          rows={3}
          className="w-full bg-white/10 border border-white/10 rounded px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-400 resize-none"
        />
      </div>
    </section>
  );
}
