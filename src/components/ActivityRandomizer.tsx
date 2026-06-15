import { Dices, RefreshCw, Clock, DollarSign } from "lucide-react";
import { useState } from "react";
import { SectionHeading } from "./SectionHeading";
import { DAYS } from "../data/itinerary";

type RandomActivity = {
  title: string;
  description: string;
  cities: string[];
  timeSlot: string;
  costPerPerson?: string;
  type: string;
  emoji: string;
  duration: string;
};

const RANDOM_ACTIVITIES: RandomActivity[] = [
  {
    title: "Konbini Roulette",
    description: "Pick a random item from the convenience store you've never tried before. The mystery meal challenge.",
    cities: ["Tokyo", "Kyoto", "Hiroshima", "Osaka"],
    timeSlot: "Any",
    costPerPerson: "¥500–¥2,000",
    type: "Food",
    emoji: "🏪",
    duration: "30 min",
  },
  {
    title: "Shrine Climb Race",
    description: "Find the nearest shrine or temple with stairs. Race to the top as a crew.",
    cities: ["Kyoto", "Tokyo", "Hiroshima"],
    timeSlot: "Morning/Afternoon",
    costPerPerson: "Free",
    type: "Activity",
    emoji: "⛩️",
    duration: "1–2 hours",
  },
  {
    title: "Karaoke Karaoke",
    description: "Pick the most embarrassing song and sing it. Everyone participates.",
    cities: ["Tokyo", "Kyoto", "Osaka"],
    timeSlot: "Evening",
    costPerPerson: "¥1,000–¥3,000",
    type: "Social",
    emoji: "🎤",
    duration: "2–3 hours",
  },
  {
    title: "Street Food Crawl",
    description: "Pick a neighborhood (Shibuya, Takeshita, Gion, etc). Hit every food stall in one block.",
    cities: ["Tokyo", "Kyoto", "Osaka"],
    timeSlot: "Evening",
    costPerPerson: "¥2,000–¥4,000",
    type: "Food",
    emoji: "🍡",
    duration: "1–2 hours",
  },
  {
    title: "Vending Machine Taste Test",
    description: "Buy the weirdest drinks from a vending machine. Rate them as a group.",
    cities: ["Tokyo", "Kyoto", "Hiroshima", "Osaka"],
    timeSlot: "Any",
    costPerPerson: "¥500–¥1,500",
    type: "Fun",
    emoji: "🥤",
    duration: "30 min",
  },
  {
    title: "Random Train Escape",
    description: "Pick a random train. Ride it for 2 stops. Get off and explore whatever's there.",
    cities: ["Tokyo", "Kyoto", "Osaka"],
    timeSlot: "Afternoon",
    costPerPerson: "¥200–¥500",
    type: "Adventure",
    emoji: "🚇",
    duration: "2–4 hours",
  },
  {
    title: "Photo Treasure Hunt",
    description: "Create a list of 10 silly poses/shots. Hunt for the best backgrounds in the city. Crew decides the winner.",
    cities: ["Tokyo", "Kyoto", "Hiroshima", "Osaka"],
    timeSlot: "Afternoon",
    costPerPerson: "Free",
    type: "Activity",
    emoji: "📸",
    duration: "2–3 hours",
  },
  {
    title: "Onsen Hopping",
    description: "Visit 2–3 different onsens in the same day. Compare, rate, relax.",
    cities: ["Kyoto", "Hiroshima"],
    timeSlot: "Afternoon/Evening",
    costPerPerson: "¥1,500–¥3,000",
    type: "Wellness",
    emoji: "♨️",
    duration: "3–4 hours",
  },
  {
    title: "Arcade Tournament",
    description: "Hit the 8-floor arcade. Pick 3 games. Compete for the crown.",
    cities: ["Tokyo", "Osaka"],
    timeSlot: "Evening",
    costPerPerson: "¥2,000–¥4,000",
    type: "Fun",
    emoji: "🕹️",
    duration: "2–3 hours",
  },
  {
    title: "Sunrise/Sunset Chase",
    description: "Find the highest point in the city before sunrise/sunset. Bring coffee. Watch together.",
    cities: ["Tokyo", "Kyoto", "Hiroshima", "Osaka"],
    timeSlot: "Early Morning/Late Afternoon",
    costPerPerson: "Free",
    type: "Moment",
    emoji: "🌅",
    duration: "1 hour",
  },
  {
    title: "Thrift Store Makeover",
    description: "Each person gets ¥3,000. Buy the weirdest outfit from a thrift store. Model them.",
    cities: ["Tokyo", "Kyoto", "Osaka"],
    timeSlot: "Afternoon",
    costPerPerson: "¥3,000",
    type: "Fun",
    emoji: "👔",
    duration: "2 hours",
  },
  {
    title: "Ramen Shop Roulette",
    description: "Find the smallest, most local ramen shop (no English menu). Order without knowing. Try it anyway.",
    cities: ["Tokyo", "Kyoto", "Hiroshima", "Osaka"],
    timeSlot: "Lunch/Dinner",
    costPerPerson: "¥1,000–¥1,500",
    type: "Food",
    emoji: "🍜",
    duration: "1 hour",
  },
  {
    title: "Midnight Convenience Store Run",
    description: "Late night snack run. Pick the funniest items. Eating adventure begins.",
    cities: ["Tokyo", "Kyoto", "Osaka"],
    timeSlot: "Late Night",
    costPerPerson: "¥1,000–¥2,000",
    type: "Food",
    emoji: "🌙",
    duration: "45 min",
  },
  {
    title: "Weird Museum Challenge",
    description: "Find a quirky museum (robot, cup noodles, toilets, anything weird). Spend 1h there.",
    cities: ["Tokyo", "Osaka"],
    timeSlot: "Afternoon",
    costPerPerson: "¥1,000–¥2,000",
    type: "Culture",
    emoji: "🤖",
    duration: "2 hours",
  },
  {
    title: "Neighborhood Potluck",
    description: "Buy ingredients from local shops. Cook/assemble a meal back at the Airbnb. Crew collaboration.",
    cities: ["Tokyo", "Kyoto", "Hiroshima", "Osaka"],
    timeSlot: "Evening",
    costPerPerson: "¥2,000–¥3,500",
    type: "Social",
    emoji: "🍱",
    duration: "2–3 hours",
  },
];

export function ActivityRandomizer() {
  const today = new Date().toISOString().split("T")[0];
  const currentDay = DAYS.find((d) => d.date === today);
  const currentCity = currentDay?.city || "Unknown";

  const [selectedActivity, setSelectedActivity] = useState<RandomActivity | null>(null);
  const [usedActivities, setUsedActivities] = useState<Set<string>>(new Set());

  const getRandomActivity = () => {
    const eligible = RANDOM_ACTIVITIES.filter(
      (a) =>
        (a.cities.includes(currentCity) || a.cities.includes("All")) &&
        !usedActivities.has(a.title)
    );

    if (eligible.length === 0) {
      // Reset if all activities used
      setUsedActivities(new Set());
      const activity = RANDOM_ACTIVITIES[Math.floor(Math.random() * RANDOM_ACTIVITIES.length)];
      setSelectedActivity(activity);
      setUsedActivities(new Set([activity.title]));
    } else {
      const activity = eligible[Math.floor(Math.random() * eligible.length)];
      setSelectedActivity(activity);
      setUsedActivities(new Set([...usedActivities, activity.title]));
    }
  };

  const allActivities = RANDOM_ACTIVITIES.filter(
    (a) => a.cities.includes(currentCity) || a.cities.includes("All")
  );

  return (
    <section className="section-pad py-24">
      <SectionHeading
        kicker="Spontaneity"
        title="Activity Randomizer"
        sub={`Today: ${currentCity} — Let serendipity decide`}
      />

      {selectedActivity ? (
        <div className="glass rounded-2xl border border-rose-500/30 bg-rose-500/5 p-8 mb-8">
          <div className="text-center mb-6">
            <div className="text-6xl mb-4">{selectedActivity.emoji}</div>
            <h2 className="text-3xl font-bold text-slate-100 mb-2">{selectedActivity.title}</h2>
            <p className="text-lg text-slate-300">{selectedActivity.description}</p>
          </div>

          <div className="grid md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white/5 border border-white/10 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock size={16} className="text-cyan-400" />
                <p className="text-xs text-slate-400">When</p>
              </div>
              <p className="font-bold text-slate-200">{selectedActivity.timeSlot}</p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Dices size={16} className="text-amber-400" />
                <p className="text-xs text-slate-400">Type</p>
              </div>
              <p className="font-bold text-slate-200">{selectedActivity.type}</p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock size={16} className="text-emerald-400" />
                <p className="text-xs text-slate-400">Duration</p>
              </div>
              <p className="font-bold text-slate-200">{selectedActivity.duration}</p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign size={16} className="text-rose-400" />
                <p className="text-xs text-slate-400">Cost</p>
              </div>
              <p className="font-bold text-slate-200">
                {selectedActivity.costPerPerson || "Varies"}
              </p>
            </div>
          </div>

          <button
            onClick={getRandomActivity}
            className="w-full px-6 py-3 bg-rose-500/20 border border-rose-500/30 rounded-lg text-rose-300 hover:bg-rose-500/30 transition-colors font-bold flex items-center justify-center gap-2"
          >
            <RefreshCw size={18} /> Get another suggestion
          </button>
        </div>
      ) : (
        <button
          onClick={getRandomActivity}
          className="w-full px-6 py-6 bg-cyan-500/20 border border-cyan-500/30 rounded-lg text-cyan-300 hover:bg-cyan-500/30 transition-colors font-bold text-lg flex items-center justify-center gap-3 mb-8"
        >
          <Dices size={24} /> Surprise me! What should we do today?
        </button>
      )}

      {/* All available activities */}
      <div className="mb-8">
        <h2 className="font-bold text-slate-100 mb-4">
          All activities in {currentCity} ({allActivities.length})
        </h2>
        <div className="grid md:grid-cols-2 gap-3">
          {allActivities.map((activity, i) => (
            <div
              key={i}
              onClick={() => setSelectedActivity(activity)}
              className="glass rounded-lg border border-white/10 p-4 cursor-pointer hover:bg-white/5 transition-colors"
            >
              <div className="flex items-start gap-3">
                <span className="text-3xl">{activity.emoji}</span>
                <div>
                  <h3 className="font-bold text-slate-100">{activity.title}</h3>
                  <p className="text-xs text-slate-400">{activity.type}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Philosophy */}
      <div className="glass rounded-2xl border border-purple-500/20 bg-purple-500/5 p-6">
        <h3 className="font-bold text-purple-300 mb-3">The serendipity principle:</h3>
        <p className="text-sm text-slate-300 mb-3">
          You planned 16 days meticulously. But the best moments often come from "what if we just...?"
        </p>
        <ul className="space-y-1 text-sm text-slate-300">
          <li>• <strong>Random doesn't mean reckless</strong> — all suggestions are safe, budget-aware, real</li>
          <li>• <strong>Not mandatory</strong> — these are ideas for high-energy moments or rainy-day pivots</li>
          <li>• <strong>Crew vote</strong> — tap an activity to pick it, or hit "surprise me" for pure chaos</li>
          <li>• <strong>Memory-making</strong> — some of your best stories will come from these unplanned moments</li>
        </ul>
      </div>
    </section>
  );
}
