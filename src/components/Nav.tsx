import { Search } from "lucide-react";
import type { View } from "../hooks/useHashView";

const TABS: { view: View; label: string; emoji: string }[] = [
  { view: "plan", label: "Plan", emoji: "🗓️" },
  { view: "mission", label: "Mission", emoji: "🚀" },
  { view: "route", label: "Route", emoji: "🗾" },
  { view: "stay", label: "Stay", emoji: "🏠" },
  { view: "explore", label: "Explore", emoji: "⛩️" },
  { view: "eat", label: "Eat", emoji: "🍜" },
  { view: "night", label: "Night", emoji: "🌙" },
  { view: "play", label: "Play", emoji: "🕹️" },
  { view: "guide", label: "Guide", emoji: "🧭" },
];

export function Nav({ view, setView, onOpenSearch }: { view: View; setView: (v: View) => void; onOpenSearch: () => void }) {
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

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onOpenSearch}
            className="inline-flex items-center gap-2 rounded-lg px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-slate-300 bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
            aria-label="Search everything"
            title="Search everything (⌘K)"
          >
            <Search size={14} />
            <span className="hidden md:inline text-slate-400">Search</span>
            <kbd className="hidden lg:inline text-[0.6rem] font-sans text-slate-500 border border-white/15 rounded px-1">⌘K</kbd>
          </button>
          <span className="hidden lg:inline-flex shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
            DEC 14–29 · 8人
          </span>
        </div>
      </nav>
    </header>
  );
}
