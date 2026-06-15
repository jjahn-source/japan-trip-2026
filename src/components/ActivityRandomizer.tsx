import { Dices, RefreshCw, Clock, DollarSign, MapPin } from "lucide-react";
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
  // Some itinerary days have compound city labels like "Kamakura + Enoshima (day trip)".
  // Resolve to the base city if it appears as a prefix so activities still match.
  const BASE_CITIES = ["Tokyo", "Kyoto", "Osaka", "Hiroshima"] as const;
  type BaseCity = (typeof BASE_CITIES)[number];
  const rawCity = currentDay?.city ?? null;
  const resolvedCity: BaseCity | null = rawCity
    ? (BASE_CITIES.find((c) => rawCity.startsWith(c)) ?? null)
    : null;

  const ALL_TYPES = ["All", ...Array.from(new Set(RANDOM_ACTIVITIES.map((a) => a.type))).sort()];
  const [selectedActivity, setSelectedActivity] = useState<RandomActivity | null>(null);
  const [usedActivities, setUsedActivities] = useState<Set<string>>(new Set());
  const [typeFilter, setTypeFilter] = useState<string>("All");

  const getPool = () => {
    let pool = resolvedCity
      ? RANDOM_ACTIVITIES.filter((a) => a.cities.includes(resolvedCity))
      : RANDOM_ACTIVITIES;
    if (typeFilter !== "All") pool = pool.filter((a) => a.type === typeFilter);
    return pool.length > 0 ? pool : RANDOM_ACTIVITIES;
  };

  const getRandomActivity = () => {
    const pool = getPool();
    const eligible = pool.filter((a) => !usedActivities.has(a.title));
    const source = eligible.length > 0 ? eligible : pool;
    if (eligible.length === 0) setUsedActivities(new Set());
    const activity = source[Math.floor(Math.random() * source.length)];
    setSelectedActivity(activity);
    setUsedActivities((prev) => new Set([...prev, activity.title]));
  };

  const pool = getPool();

  return (
    <section className="section-pad py-24">
      <SectionHeading
        kicker="Spontaneity"
        title="Activity Randomizer"
        sub={resolvedCity ? `Today in ${resolvedCity} · ${pool.length} options` : `All cities · ${pool.length} options`}
      />

      {/* Type filter pills */}
      <div className="flex flex-wrap gap-2 mb-6">
        {ALL_TYPES.map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => { setTypeFilter(type); setSelectedActivity(null); }}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
              typeFilter === type
                ? "bg-rose-500 text-white"
                : "bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 border border-white/10"
            }`}
          >
            {type}
          </button>
        ))}
      </div>

      {/* Selected activity card */}
      {selectedActivity ? (
        <div className="glass rounded-2xl border border-rose-500/30 bg-rose-500/5 p-6 mb-4">
          <div className="flex items-start gap-5">
            <div className="text-5xl shrink-0">{selectedActivity.emoji}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <h2 className="text-xl font-bold text-slate-100">{selectedActivity.title}</h2>
                <span className="text-xs font-semibold text-rose-300 bg-rose-500/15 border border-rose-500/20 px-2 py-0.5 rounded-full">{selectedActivity.type}</span>
              </div>
              <p className="text-sm text-slate-300 mb-4">{selectedActivity.description}</p>

              <div className="flex flex-wrap gap-3">
                <div className="flex items-center gap-1.5 text-xs text-slate-300">
                  <Clock size={13} className="text-cyan-400" />
                  <span>{selectedActivity.timeSlot}</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-300">
                  <RefreshCw size={13} className="text-emerald-400" />
                  <span>{selectedActivity.duration}</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-300">
                  <DollarSign size={13} className="text-amber-400" />
                  <span>{selectedActivity.costPerPerson || "Varies"}</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-300">
                  <MapPin size={13} className="text-slate-400" />
                  <span>{selectedActivity.cities.join(", ")}</span>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={getRandomActivity}
            className="mt-5 w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-slate-300 hover:bg-white/10 transition-colors font-semibold text-sm flex items-center justify-center gap-2"
          >
            <RefreshCw size={15} /> Roll again
          </button>
        </div>
      ) : (
        <button
          onClick={getRandomActivity}
          className="w-full px-6 py-8 bg-gradient-to-br from-rose-500/20 to-cyan-500/10 border border-rose-500/30 rounded-2xl text-white hover:from-rose-500/30 hover:to-cyan-500/20 transition-all font-bold text-xl flex items-center justify-center gap-3 mb-4"
        >
          <Dices size={28} /> Surprise me
        </button>
      )}

      <p className="text-center text-xs text-slate-500">
        {pool.length} {typeFilter !== "All" ? typeFilter.toLowerCase() : ""} activit{pool.length === 1 ? "y" : "ies"} available{resolvedCity ? ` in ${resolvedCity}` : ""}
      </p>
    </section>
  );
}
