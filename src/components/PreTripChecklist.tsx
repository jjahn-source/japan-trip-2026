import { CheckCircle, Circle, AlertCircle } from "lucide-react";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { SectionHeading } from "./SectionHeading";

type ChecklistItem = {
  id: string;
  category: string;
  task: string;
  daysBeforeTrip: number;
  critical: boolean;
  completed: boolean;
};

const CHECKLIST: ChecklistItem[] = [
  // Critical (do these!)
  {
    id: "passport",
    category: "Documents",
    task: "Verify passports valid for 6+ months past return date",
    daysBeforeTrip: 30,
    critical: true,
    completed: false,
  },
  {
    id: "visa",
    category: "Documents",
    task: "Check visa requirements for all 8 crew members",
    daysBeforeTrip: 30,
    critical: true,
    completed: false,
  },
  {
    id: "insurance",
    category: "Insurance",
    task: "Purchase trip/travel insurance (medical + baggage)",
    daysBeforeTrip: 21,
    critical: true,
    completed: false,
  },
  {
    id: "notify-bank",
    category: "Financial",
    task: "Notify credit card + bank of Japan travel dates",
    daysBeforeTrip: 7,
    critical: true,
    completed: false,
  },
  {
    id: "exchange-rate",
    category: "Financial",
    task: "Check exchange rates + plan cash/card strategy",
    daysBeforeTrip: 7,
    critical: true,
    completed: false,
  },

  // Very Important
  {
    id: "book-flights",
    category: "Flights",
    task: "Confirm all flight bookings + download e-tickets",
    daysBeforeTrip: 14,
    critical: false,
    completed: false,
  },
  {
    id: "book-hotels",
    category: "Lodging",
    task: "Confirm all hotel/Airbnb bookings",
    daysBeforeTrip: 14,
    critical: false,
    completed: false,
  },
  {
    id: "jr-pass",
    category: "Transport",
    task: "Book JR Rail Pass (if planning) — order online now",
    daysBeforeTrip: 21,
    critical: false,
    completed: false,
  },
  {
    id: "suica",
    category: "Transport",
    task: "Research Suica card — buy at airport or pre-order",
    daysBeforeTrip: 7,
    critical: false,
    completed: false,
  },
  {
    id: "vaccinations",
    category: "Health",
    task: "Check vaccination requirements + visit doctor if needed",
    daysBeforeTrip: 30,
    critical: false,
    completed: false,
  },
  {
    id: "prescriptions",
    category: "Health",
    task: "Get copies of prescriptions in Japanese (from doctor)",
    daysBeforeTrip: 14,
    critical: false,
    completed: false,
  },
  {
    id: "phone-plan",
    category: "Communication",
    task: "Arrange Japan SIM card or international phone plan",
    daysBeforeTrip: 14,
    critical: false,
    completed: false,
  },
  {
    id: "power-adapter",
    category: "Gear",
    task: "Buy Type A power adapters for everyone (100V, 50/60Hz)",
    daysBeforeTrip: 14,
    critical: false,
    completed: false,
  },

  // Nice to Have
  {
    id: "luggage-labels",
    category: "Packing",
    task: "Print luggage labels with names + phone numbers",
    daysBeforeTrip: 3,
    critical: false,
    completed: false,
  },
  {
    id: "currency",
    category: "Financial",
    task: "Pick up yen at bank (or withdraw from ATM in Japan)",
    daysBeforeTrip: 3,
    critical: false,
    completed: false,
  },
  {
    id: "weather-check",
    category: "Planning",
    task: "Check 10-day forecast + plan weather-dependent activities",
    daysBeforeTrip: 2,
    critical: false,
    completed: false,
  },
  {
    id: "restaurant-confirm",
    category: "Dining",
    task: "Confirm all restaurant reservations",
    daysBeforeTrip: 2,
    critical: false,
    completed: false,
  },
  {
    id: "activity-confirm",
    category: "Activities",
    task: "Confirm all activity bookings (tours, tickets, etc.)",
    daysBeforeTrip: 2,
    critical: false,
    completed: false,
  },
  {
    id: "luggage-pack",
    category: "Packing",
    task: "Pack luggage + weigh to avoid overages",
    daysBeforeTrip: 1,
    critical: false,
    completed: false,
  },
  {
    id: "itinerary-print",
    category: "Planning",
    task: "Print copies of itinerary + hotel addresses for backup",
    daysBeforeTrip: 1,
    critical: false,
    completed: false,
  },
  {
    id: "airport-transport",
    category: "Logistics",
    task: "Arrange airport transfers (Uber/taxi coordination)",
    daysBeforeTrip: 3,
    critical: false,
    completed: false,
  },
];

export function PreTripChecklist() {
  const [completed, setCompleted] = useLocalStorage<Record<string, boolean>>(
    "pretip-checklist",
    Object.fromEntries(CHECKLIST.map((item) => [item.id, item.completed]))
  );

  const toggleComplete = (id: string) => {
    setCompleted({
      ...completed,
      [id]: !completed[id],
    });
  };

  const groupedByCategory = CHECKLIST.reduce(
    (acc, item) => {
      if (!acc[item.category]) acc[item.category] = [];
      acc[item.category].push(item);
      return acc;
    },
    {} as Record<string, ChecklistItem[]>
  );

  const categoryOrder = [
    "Documents",
    "Insurance",
    "Financial",
    "Flights",
    "Lodging",
    "Transport",
    "Health",
    "Communication",
    "Gear",
    "Dining",
    "Activities",
    "Logistics",
    "Planning",
    "Packing",
  ];

  const criticalItems = CHECKLIST.filter((i) => i.critical);
  const criticalCompleted = criticalItems.filter((i) => completed[i.id]).length;
  const allCompleted = CHECKLIST.filter((i) => completed[i.id]).length;

  return (
    <section className="section-pad py-24">
      <SectionHeading
        kicker="Before Departure"
        title="Pre-Trip Checklist"
        sub={`${criticalCompleted}/${criticalItems.length} critical items done`}
      />

      {/* Progress */}
      <div className="glass rounded-2xl border border-cyan-500/30 p-6 mb-8">
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-bold text-slate-300">Overall Progress</span>
            <span className="text-sm font-bold text-cyan-300">
              {allCompleted}/{CHECKLIST.length}
            </span>
          </div>
          <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 transition-all"
              style={{ width: `${(allCompleted / CHECKLIST.length) * 100}%` }}
            />
          </div>
        </div>

        {criticalCompleted < criticalItems.length && (
          <div className="flex items-start gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded">
            <AlertCircle size={16} className="text-amber-400 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-300 font-bold">
              {criticalItems.length - criticalCompleted} critical items remaining
            </p>
          </div>
        )}
      </div>

      {/* Checklist by Category */}
      <div className="space-y-6">
        {categoryOrder.map((category) => {
          const items = groupedByCategory[category];
          if (!items) return null;

          const categoryCompleted = items.filter((i) => completed[i.id]).length;

          return (
            <div key={category}>
              <h2 className="font-bold text-slate-100 mb-3 flex items-center gap-2">
                {category}
                <span className="text-xs text-slate-400">
                  ({categoryCompleted}/{items.length})
                </span>
              </h2>

              <div className="space-y-2">
                {items.map((item) => {
                  const isCompleted = completed[item.id];
                  return (
                    <div
                      key={item.id}
                      onClick={() => toggleComplete(item.id)}
                      className={`glass rounded-lg border p-4 cursor-pointer transition-all ${
                        isCompleted
                          ? "border-emerald-500/30 bg-emerald-500/5"
                          : item.critical
                          ? "border-red-500/30 bg-red-500/5 hover:bg-red-500/10"
                          : "border-white/10 hover:bg-white/5"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {isCompleted ? (
                          <CheckCircle size={20} className="text-emerald-400 shrink-0 mt-0.5" />
                        ) : (
                          <Circle size={20} className="text-slate-400 shrink-0 mt-0.5" />
                        )}

                        <div className="flex-1 min-w-0">
                          <p
                            className={`text-sm ${
                              isCompleted
                                ? "text-slate-400 line-through"
                                : "text-slate-200 font-medium"
                            }`}
                          >
                            {item.task}
                          </p>
                          <p className="text-xs text-slate-500 mt-1">
                            {item.daysBeforeTrip === 0
                              ? "Day of trip"
                              : item.daysBeforeTrip === 1
                              ? "1 day before"
                              : `${item.daysBeforeTrip} days before`}
                            {item.critical && (
                              <span className="ml-2 text-red-400 font-bold">🚨 CRITICAL</span>
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Final Tips */}
      <div className="mt-8 glass rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-6">
        <h3 className="font-bold text-cyan-300 mb-3">Pro Tips:</h3>
        <ul className="space-y-1 text-sm text-slate-300">
          <li>• <strong>Passports:</strong> Make 2 color copies + store separately from original</li>
          <li>• <strong>Insurance:</strong> Take a photo of your policy number + policy document</li>
          <li>• <strong>Cards:</strong> Write down 24/7 fraud numbers for all credit cards</li>
          <li>• <strong>Cash:</strong> Don't exchange all at bank — ATMs in Japan often have better rates</li>
          <li>• <strong>Pocket WiFi:</strong> Rent from airport or pre-order for arrival at Haneda</li>
          <li>• <strong>Luggage:</strong> Plan to use Yamato (takkyūbin) to ship between cities — lighter bags in train</li>
          <li>• <strong>Last-minute:</strong> Confirm flights 24h before, restaurants 24h before</li>
        </ul>
      </div>
    </section>
  );
}
