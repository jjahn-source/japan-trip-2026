import { AlertCircle } from "lucide-react";
import { DAYS } from "../data/itinerary";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { useMemo } from "react";
import { SectionHeading } from "./SectionHeading";

type Spending = {
  date: string;
  category: string;
  amount: number;
  note?: string;
};

const CATEGORIES = [
  { name: "Food & Dining", color: "from-amber-500 to-orange-500", emoji: "🍜" },
  { name: "Transport", color: "from-blue-500 to-cyan-500", emoji: "🚄" },
  { name: "Activities & Entry Fees", color: "from-purple-500 to-pink-500", emoji: "🎫" },
  { name: "Lodging", color: "from-green-500 to-emerald-500", emoji: "🏨" },
  { name: "Shopping & Gifts", color: "from-rose-500 to-pink-500", emoji: "🛍️" },
  { name: "Nightlife & Drinks", color: "from-violet-500 to-purple-500", emoji: "🍻" },
  { name: "Other", color: "from-slate-500 to-gray-500", emoji: "📌" },
];

const DAILY_BUDGET = 300; // USD per person per day
const TOTAL_BUDGET = 16 * DAILY_BUDGET * 8; // 16 days, 8 people

export function BudgetAnalyzer() {
  const [spending] = useLocalStorage<Spending[]>("trip-spending", []);

  const stats = useMemo(() => {
    const byCategory = CATEGORIES.map((cat) => ({
      ...cat,
      total: spending
        .filter((s) => s.category === cat.name)
        .reduce((sum, s) => sum + s.amount, 0),
      count: spending.filter((s) => s.category === cat.name).length,
    }));

    const total = spending.reduce((sum, s) => sum + s.amount, 0);
    const byDay = DAYS.map((day) => {
      const daySpending = spending
        .filter((s) => s.date === day.date)
        .reduce((sum, s) => sum + s.amount, 0);
      return { date: day.date, amount: daySpending };
    });

    const avgDaily = byDay.filter((d) => d.amount > 0).length > 0
      ? total / byDay.filter((d) => d.amount > 0).length
      : 0;
    const remainingBudget = TOTAL_BUDGET - total;
    const daysRemaining = DAYS.filter((d) => new Date(d.date) > new Date()).length;
    const availablePerDayRemaining = daysRemaining > 0 ? remainingBudget / daysRemaining : 0;

    return {
      byCategory,
      total,
      avgDaily,
      remainingBudget,
      daysRemaining,
      availablePerDayRemaining,
      progress: (total / TOTAL_BUDGET) * 100,
    };
  }, [spending]);

  const sortedByAmount = [...stats.byCategory].sort((a, b) => b.total - a.total);

  return (
    <section className="section-pad py-24">
      <SectionHeading
        kicker="Finance"
        title="Budget Analyzer"
        sub={`$${stats.total.toFixed(0)} spent of $${TOTAL_BUDGET.toFixed(0)} budget`}
      />

      {/* Overall Progress */}
      <div className="glass rounded-2xl border border-cyan-500/30 p-6 mb-8">
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-bold text-slate-300">Budget Used</span>
            <span className="text-sm font-bold text-cyan-300">{stats.progress.toFixed(1)}%</span>
          </div>
          <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all ${
                stats.progress > 80 ? "bg-red-500" : stats.progress > 60 ? "bg-amber-500" : "bg-emerald-500"
              }`}
              style={{ width: `${Math.min(stats.progress, 100)}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 text-xs">
          <div>
            <p className="text-slate-400 mb-1">Total Spent</p>
            <p className="font-bold text-lg text-slate-100">${stats.total.toFixed(0)}</p>
          </div>
          <div>
            <p className="text-slate-400 mb-1">Remaining</p>
            <p className={`font-bold text-lg ${stats.remainingBudget > 0 ? "text-emerald-300" : "text-red-300"}`}>
              ${stats.remainingBudget.toFixed(0)}
            </p>
          </div>
          <div>
            <p className="text-slate-400 mb-1">Avg/Day</p>
            <p className="font-bold text-lg text-slate-100">${stats.avgDaily.toFixed(0)}</p>
          </div>
        </div>
      </div>

      {/* Warning if over budget */}
      {stats.remainingBudget < 0 && (
        <div className="glass rounded-2xl border border-red-500/30 bg-red-500/5 p-6 mb-8">
          <div className="flex items-start gap-3">
            <AlertCircle size={20} className="text-red-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-red-300 mb-1">Over budget by ${Math.abs(stats.remainingBudget).toFixed(0)}</p>
              <p className="text-sm text-slate-300">
                Adjust spending, reduce activities, or pool more funds to stay on track.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Spending by Category */}
      <div className="mb-8">
        <h2 className="font-bold text-slate-100 mb-4">Spending by Category</h2>
        <div className="space-y-3">
          {sortedByAmount.map((cat) => (
            <div key={cat.name} className="glass rounded-lg border border-white/10 p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{cat.emoji}</span>
                  <h3 className="font-bold text-slate-100">{cat.name}</h3>
                  <span className="text-xs text-slate-400">({cat.count} entries)</span>
                </div>
                <div className="text-right">
                  <p className="font-bold text-slate-100">${cat.total.toFixed(0)}</p>
                  <p className="text-xs text-slate-400">
                    {((cat.total / stats.total) * 100).toFixed(0)}% of total
                  </p>
                </div>
              </div>
              <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div
                  className={`h-full bg-gradient-to-r ${cat.color}`}
                  style={{ width: `${(cat.total / Math.max(...sortedByAmount.map((c) => c.total), 1)) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Remaining Budget Info */}
      <div className="glass rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-6">
        <h3 className="font-bold text-cyan-300 mb-3">Budget Status</h3>
        <div className="space-y-2 text-sm text-slate-300">
          <p>
            <strong>Days remaining:</strong> {stats.daysRemaining}
          </p>
          <p>
            <strong>Available per day:</strong> $
            {stats.availablePerDayRemaining.toFixed(0)} (for 8 people combined)
          </p>
          {stats.daysRemaining > 0 && (
            <p>
              <strong>Per person per day:</strong> ${(stats.availablePerDayRemaining / 8).toFixed(0)}
            </p>
          )}
          <p className="text-xs text-slate-400 mt-3">
            💡 Budget covers all 8 people collectively. The CFO tracks this + logs daily in Daily Huddle.
          </p>
        </div>
      </div>
    </section>
  );
}
