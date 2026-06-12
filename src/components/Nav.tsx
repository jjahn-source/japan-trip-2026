import type { View } from "../hooks/useHashView";

const TABS: { view: View; label: string; emoji: string }[] = [
  { view: "plan", label: "Plan", emoji: "🗓️" },
  { view: "explore", label: "Explore", emoji: "⛩️" },
  { view: "eat", label: "Eat", emoji: "🍜" },
  { view: "guide", label: "Guide", emoji: "🧭" },
];

export function Nav({ view, setView }: { view: View; setView: (v: View) => void }) {
  return (
    <header className="fixed top-0 inset-x-0 z-50 px-3">
      <nav className="glass mx-auto mt-3 max-w-6xl rounded-2xl px-4 sm:px-5 py-3 flex items-center justify-between gap-3">
        <button
          onClick={() => setView("plan")}
          className="flex items-center gap-2 font-extrabold tracking-tight shrink-0"
        >
          <span className="text-xl">⛩️</span>
          <span className="hidden sm:inline">
            Japan <span className="text-rose-400">’26</span>
          </span>
        </button>

        <div className="flex items-center gap-1 overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t.view}
              onClick={() => setView(t.view)}
              className={`px-3 sm:px-4 py-1.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-colors ${
                view === t.view
                  ? "bg-rose-500 text-white shadow-lg shadow-rose-500/25"
                  : "text-slate-300 hover:text-white hover:bg-white/10"
              }`}
            >
              <span className="mr-1">{t.emoji}</span>
              {t.label}
            </button>
          ))}
        </div>

        <span className="hidden lg:inline-flex shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
          DEC 14–29 · 8人
        </span>
      </nav>
    </header>
  );
}
