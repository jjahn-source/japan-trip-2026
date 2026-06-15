import { Save, X } from "lucide-react";
import { DAYS } from "../data/itinerary";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { useState } from "react";
import { SectionHeading } from "./SectionHeading";

type Recap = {
  date: string;
  highlight: string;
  best_meal: string;
  crew_mood: "energized" | "tired" | "mixed";
  mood_notes?: string;
  photo_moment?: string;
  something_unexpected?: string;
  rating: number;
};

export function DayRecapCapture() {
  const today = new Date().toISOString().split("T")[0];
  const [recaps, setRecaps] = useLocalStorage<Record<string, Recap>>("day-recaps", {});
  const [editingDate, setEditingDate] = useState<string | null>(today);
  const [form, setForm] = useState<Partial<Recap>>({
    date: today,
    crew_mood: "mixed",
    rating: 4,
  });

  const handleSave = () => {
    if (!form.date || !form.highlight || !form.best_meal) {
      alert("Please fill in all required fields");
      return;
    }
    setRecaps({
      ...recaps,
      [form.date]: {
        date: form.date,
        highlight: form.highlight,
        best_meal: form.best_meal,
        crew_mood: form.crew_mood || "mixed",
        mood_notes: form.mood_notes,
        photo_moment: form.photo_moment,
        something_unexpected: form.something_unexpected,
        rating: form.rating || 4,
      },
    });
    setEditingDate(null);
    setForm({ date: today, crew_mood: "mixed", rating: 4 });
  };

  const handleEdit = (date: string) => {
    const recap = recaps[date];
    if (recap) {
      setForm(recap);
      setEditingDate(date);
    }
  };

  const startNew = () => {
    setForm({ date: today, crew_mood: "mixed", rating: 4 });
    setEditingDate(today);
  };

  const getDayLabel = (date: string) => {
    const dayIndex = DAYS.findIndex((d) => d.date === date);
    return dayIndex >= 0 ? `Day ${dayIndex + 1}` : "Unknown";
  };

  const sortedRecaps = Object.values(recaps).sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <section className="section-pad py-24">
      <SectionHeading
        kicker="Memories"
        title="Day Recap"
        sub={`${sortedRecaps.length}/${DAYS.length} days captured`}
      />

      {editingDate ? (
        // Form
        <div className="glass rounded-2xl border border-cyan-500/30 p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-100">
              Recap for {getDayLabel(form.date || today)} ({form.date})
            </h2>
            <button
              onClick={() => setEditingDate(null)}
              className="p-1 hover:bg-white/10 rounded transition-colors"
            >
              <X size={20} className="text-slate-400" />
            </button>
          </div>

          <div className="space-y-4 mb-6">
            {/* Date picker */}
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-2">Date</label>
              <select
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded text-sm text-slate-200 focus:border-cyan-400/50 focus:outline-none"
              >
                {DAYS.map((day) => (
                  <option key={day.date} value={day.date}>
                    {getDayLabel(day.date)} — {day.date}
                  </option>
                ))}
              </select>
            </div>

            {/* Highlight */}
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-2">
                🌟 Best moment of the day
              </label>
              <input
                type="text"
                placeholder="The one thing we'll remember from today..."
                value={form.highlight || ""}
                onChange={(e) => setForm({ ...form, highlight: e.target.value })}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded text-sm text-slate-200 placeholder-slate-500 focus:border-cyan-400/50 focus:outline-none"
              />
            </div>

            {/* Best meal */}
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-2">
                🍜 Most memorable meal
              </label>
              <input
                type="text"
                placeholder="Restaurant name + dish that blew our minds"
                value={form.best_meal || ""}
                onChange={(e) => setForm({ ...form, best_meal: e.target.value })}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded text-sm text-slate-200 placeholder-slate-500 focus:border-cyan-400/50 focus:outline-none"
              />
            </div>

            {/* Crew mood */}
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-2">
                ⚡ Crew energy by end of day
              </label>
              <div className="flex gap-2">
                {(["energized", "mixed", "tired"] as const).map((mood) => (
                  <button
                    key={mood}
                    onClick={() => setForm({ ...form, crew_mood: mood })}
                    className={`flex-1 px-3 py-2 rounded text-xs font-bold transition-colors ${
                      form.crew_mood === mood
                        ? "bg-rose-500 text-white"
                        : "bg-white/5 text-slate-300 hover:bg-white/10"
                    }`}
                  >
                    {mood === "energized" && "⚡ Ready for more"}
                    {mood === "mixed" && "➡️ Balanced"}
                    {mood === "tired" && "😴 Need rest"}
                  </button>
                ))}
              </div>
            </div>

            {form.crew_mood && (
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-2">
                  Notes on mood (optional)
                </label>
                <input
                  type="text"
                  placeholder="Context: jets lag, amazing meal, rough transit, etc."
                  value={form.mood_notes || ""}
                  onChange={(e) => setForm({ ...form, mood_notes: e.target.value })}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded text-sm text-slate-200 placeholder-slate-500 focus:border-cyan-400/50 focus:outline-none"
                />
              </div>
            )}

            {/* Photo moment */}
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-2">
                📸 Best photo moment (optional)
              </label>
              <input
                type="text"
                placeholder="Where + what was in the photo"
                value={form.photo_moment || ""}
                onChange={(e) => setForm({ ...form, photo_moment: e.target.value })}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded text-sm text-slate-200 placeholder-slate-500 focus:border-cyan-400/50 focus:outline-none"
              />
            </div>

            {/* Something unexpected */}
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-2">
                🎲 Something unexpected (optional)
              </label>
              <input
                type="text"
                placeholder="Funny moment, unplanned adventure, random encounter..."
                value={form.something_unexpected || ""}
                onChange={(e) => setForm({ ...form, something_unexpected: e.target.value })}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded text-sm text-slate-200 placeholder-slate-500 focus:border-cyan-400/50 focus:outline-none"
              />
            </div>

            {/* Rating */}
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-2">
                Overall day rating
              </label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setForm({ ...form, rating: star })}
                    className="text-2xl hover:scale-110 transition-transform"
                  >
                    {star <= (form.rating || 0) ? "⭐" : "☆"}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleSave}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-emerald-500/20 border border-emerald-500/30 rounded text-emerald-300 hover:bg-emerald-500/30 transition-colors font-bold text-sm"
            >
              <Save size={16} /> Save recap
            </button>
            <button
              onClick={() => setEditingDate(null)}
              className="px-4 py-2 bg-white/5 border border-white/10 rounded text-slate-300 hover:bg-white/10 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        // List of existing recaps
        <div className="space-y-4 mb-8">
          {sortedRecaps.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <p>No recaps yet. Capture the best moments of your days!</p>
            </div>
          ) : (
            sortedRecaps.map((recap) => (
              <div
                key={recap.date}
                className="glass rounded-lg border border-white/10 p-4 hover:bg-white/5 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-slate-100">{getDayLabel(recap.date)}</h3>
                    <p className="text-xs text-slate-400">{recap.date}</p>
                  </div>
                  <div className="text-right">
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span key={star}>{star <= recap.rating ? "⭐" : "☆"}</span>
                      ))}
                    </div>
                    <button
                      onClick={() => handleEdit(recap.date)}
                      className="text-xs text-cyan-400 hover:text-cyan-300 mt-1"
                    >
                      Edit
                    </button>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <p className="text-slate-300">
                    <strong>🌟 Highlight:</strong> {recap.highlight}
                  </p>
                  <p className="text-slate-300">
                    <strong>🍜 Meal:</strong> {recap.best_meal}
                  </p>
                  <div className="flex gap-3 text-xs">
                    <span className="text-slate-400">
                      ⚡{" "}
                      {recap.crew_mood === "energized"
                        ? "Energized"
                        : recap.crew_mood === "tired"
                        ? "Tired"
                        : "Mixed"}
                    </span>
                    {recap.photo_moment && (
                      <span className="text-slate-400">📸 {recap.photo_moment}</span>
                    )}
                  </div>
                  {recap.something_unexpected && (
                    <p className="text-slate-400 italic">
                      🎲 Unexpected: {recap.something_unexpected}
                    </p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {!editingDate && (
        <button
          onClick={startNew}
          className="w-full px-4 py-3 bg-cyan-500/20 border border-cyan-500/30 rounded-lg text-cyan-300 hover:bg-cyan-500/30 transition-colors font-bold"
        >
          + Add today's recap
        </button>
      )}

      {/* Guide */}
      <div className="mt-8 glass rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-6">
        <h3 className="font-bold text-emerald-300 mb-3">Why recap each day:</h3>
        <ul className="space-y-1 text-sm text-slate-300">
          <li>
            • <strong>Highlight:</strong> The one memory we'll talk about for years
          </li>
          <li>
            • <strong>Best meal:</strong> Food is the heart of the trip — remember the magic
          </li>
          <li>
            • <strong>Crew energy:</strong> Informs tomorrow's schedule — rest if needed
          </li>
          <li>
            • <strong>Photo moment:</strong> Helps Photo Lead know which shots to prioritize</li>
          <li>
            • <strong>Rating + notes:</strong> Trip archive — relive the journey when you're home
          </li>
        </ul>
      </div>
    </section>
  );
}
