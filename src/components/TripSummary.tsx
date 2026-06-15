import { Calendar, TrendingUp, Award } from "lucide-react";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { useMemo } from "react";
import { SectionHeading } from "./SectionHeading";
import { DAYS } from "../data/itinerary";

type DayRecap = {
  date: string;
  highlight: string;
  best_meal: string;
  crew_mood: "energized" | "tired" | "mixed";
  mood_notes?: string;
  photo_moment?: string;
  something_unexpected?: string;
  rating: number;
};

export function TripSummary() {
  const [recaps] = useLocalStorage<Record<string, DayRecap>>("day-recaps", {});
  const [spending] = useLocalStorage<Array<{ date: string; category: string; amount: number }>>(
    "trip-spending",
    []
  );

  const stats = useMemo(() => {
    const sortedRecaps = Object.values(recaps).sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    const totalDays = sortedRecaps.length;
    const avgRating = totalDays > 0 ? sortedRecaps.reduce((sum, r) => sum + r.rating, 0) / totalDays : 0;
    const totalSpent = spending.reduce((sum, s) => sum + s.amount, 0);
    const mealCount = sortedRecaps.filter((r) => r.best_meal).length;
    const photoMoments = sortedRecaps.filter((r) => r.photo_moment).length;
    const surprises = sortedRecaps.filter((r) => r.something_unexpected).length;
    const energizedDays = sortedRecaps.filter((r) => r.crew_mood === "energized").length;
    const bestDay = sortedRecaps.reduce((best, current) =>
      current.rating > best.rating ? current : best
    );

    return {
      totalDays,
      avgRating,
      totalSpent,
      mealCount,
      photoMoments,
      surprises,
      energizedDays,
      bestDay: bestDay.rating > 0 ? bestDay : null,
      sortedRecaps,
    };
  }, [recaps, spending]);

  const getDayLabel = (date: string) => {
    const dayIndex = DAYS.findIndex((d) => d.date === date);
    return dayIndex >= 0 ? `Day ${dayIndex + 1}` : "Unknown";
  };

  if (stats.totalDays === 0) {
    return (
      <section className="section-pad py-24">
        <SectionHeading
          kicker="Memories"
          title="Trip Summary"
          sub="Daily recaps will appear here as you capture them"
        />
        <div className="text-center py-12 text-slate-400">
          <p>Start adding daily recaps to build your trip narrative.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="section-pad py-24">
      <SectionHeading
        kicker="Memories"
        title="Trip Summary"
        sub={`${stats.totalDays} days, ${stats.totalSpent.toFixed(0)} spent, countless memories`}
      />

      {/* Highlights Stats */}
      <div className="grid md:grid-cols-4 gap-4 mb-8">
        <div className="glass rounded-lg border border-white/10 p-4">
          <p className="text-xs text-slate-400 mb-2">Days Captured</p>
          <p className="text-3xl font-bold text-slate-100">{stats.totalDays}</p>
        </div>
        <div className="glass rounded-lg border border-cyan-500/30 p-4">
          <p className="text-xs text-slate-400 mb-2">Avg Day Rating</p>
          <p className="text-3xl font-bold text-cyan-300">
            {stats.avgRating.toFixed(1)} <span className="text-lg">⭐</span>
          </p>
        </div>
        <div className="glass rounded-lg border border-amber-500/30 p-4">
          <p className="text-xs text-slate-400 mb-2">Memorable Meals</p>
          <p className="text-3xl font-bold text-amber-300">{stats.mealCount}</p>
        </div>
        <div className="glass rounded-lg border border-emerald-500/30 p-4">
          <p className="text-xs text-slate-400 mb-2">Energized Days</p>
          <p className="text-3xl font-bold text-emerald-300">{stats.energizedDays}</p>
        </div>
      </div>

      {/* Best Day */}
      {stats.bestDay && (
        <div className="glass rounded-2xl border border-rose-500/30 bg-rose-500/5 p-6 mb-8">
          <div className="flex items-start gap-3">
            <Award size={24} className="text-rose-400 shrink-0" />
            <div>
              <h3 className="font-bold text-rose-300 mb-2">
                Best Day: {getDayLabel(stats.bestDay.date)}
              </h3>
              <p className="text-slate-200 mb-3">
                <strong className="text-rose-300">Highlight:</strong> {stats.bestDay.highlight}
              </p>
              <p className="text-slate-200">
                <strong className="text-rose-300">Meal:</strong> {stats.bestDay.best_meal}
              </p>
              {stats.bestDay.something_unexpected && (
                <p className="text-slate-300 italic mt-2">
                  🎲 {stats.bestDay.something_unexpected}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Key Moments */}
      <div className="mb-8">
        <h2 className="font-bold text-slate-100 mb-4">Key Numbers</h2>
        <div className="grid grid-cols-2 gap-3">
          <div className="glass rounded-lg border border-white/10 p-4 text-sm">
            <p className="text-slate-400 mb-1">📸 Photo Moments</p>
            <p className="font-bold text-slate-100">{stats.photoMoments}</p>
          </div>
          <div className="glass rounded-lg border border-white/10 p-4 text-sm">
            <p className="text-slate-400 mb-1">🎲 Surprises</p>
            <p className="font-bold text-slate-100">{stats.surprises}</p>
          </div>
          <div className="glass rounded-lg border border-white/10 p-4 text-sm">
            <p className="text-slate-400 mb-1">💰 Total Spent</p>
            <p className="font-bold text-slate-100">${stats.totalSpent.toFixed(0)}</p>
          </div>
          <div className="glass rounded-lg border border-white/10 p-4 text-sm">
            <p className="text-slate-400 mb-1">Per Day Avg</p>
            <p className="font-bold text-slate-100">
              ${(stats.totalSpent / Math.max(stats.totalDays, 1)).toFixed(0)}
            </p>
          </div>
        </div>
      </div>

      {/* Daily Recap Cards */}
      <h2 className="font-bold text-slate-100 mb-4">Day by Day</h2>
      <div className="space-y-4">
        {stats.sortedRecaps.map((recap) => (
          <div key={recap.date} className="glass rounded-lg border border-white/10 p-4">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-bold text-slate-100">{getDayLabel(recap.date)}</h3>
                <p className="text-xs text-slate-400">{recap.date}</p>
              </div>
              <div className="text-right">
                <div className="flex gap-0.5 justify-end">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span key={star}>{star <= recap.rating ? "⭐" : "☆"}</span>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-2 text-sm text-slate-300">
              <p>
                <strong className="text-cyan-300">Highlight:</strong> {recap.highlight}
              </p>
              <p>
                <strong className="text-amber-300">Meal:</strong> {recap.best_meal}
              </p>
              <div className="flex gap-3 text-xs text-slate-400 flex-wrap">
                <span>
                  ⚡{" "}
                  {recap.crew_mood === "energized"
                    ? "Energized"
                    : recap.crew_mood === "tired"
                    ? "Tired"
                    : "Mixed"}
                </span>
                {recap.photo_moment && <span>📸 {recap.photo_moment}</span>}
              </div>
              {recap.something_unexpected && (
                <p className="text-slate-400 italic">🎲 {recap.something_unexpected}</p>
              )}
              {recap.mood_notes && (
                <p className="text-slate-400">💭 {recap.mood_notes}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Export reminder */}
      <div className="mt-8 glass rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-6">
        <h3 className="font-bold text-cyan-300 mb-3">Preserve your memories:</h3>
        <ul className="space-y-1 text-sm text-slate-300">
          <li>
            • <strong>Screenshot this summary</strong> — your daily recaps live in local storage
          </li>
          <li>• <strong>Export to Google Docs</strong> — turn it into a trip journal</li>
          <li>• <strong>Share with the crew</strong> — reminisce together after the trip</li>
          <li>• <strong>Photo album</strong> — pair your daily recaps with the photo moments you noted</li>
        </ul>
      </div>
    </section>
  );
}
