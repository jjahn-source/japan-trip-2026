import { Search } from "lucide-react";
import type { View } from "../hooks/useHashView";
import { useTrainDelays, CRITICAL_LINES } from "../hooks/useTrainDelays";
import { AlertTriangle } from "lucide-react";

const TABS: { view: View; label: string; emoji: string }[] = [
  { view: "plan",    label: "Plan",    emoji: "🗓️" },
  { view: "explore", label: "Explore", emoji: "⛩️" },
  { view: "eat",     label: "Eat",     emoji: "🍜" },
  { view: "guide",   label: "Guide",   emoji: "🧭" },
  { view: "crew",    label: "Crew",    emoji: "🎮" },
];

const INITIALS: Record<string, string> = {
  JJ: "JJ", Ethan: "ET", Steven: "SV", Alex: "AL",
  Charlie: "CH", Kaishun: "KS", Daniel: "DA", Junha: "JH",
};

export function Nav({
  view,
  setView,
  onOpenSearch,
  identityName,
  onChangeIdentity,
}: {
  view: View;
  setView: (v: View) => void;
  onOpenSearch: () => void;
  identityName?: string | null;
  onChangeIdentity?: () => void;
}) {
  const { hasMajorDelays, delayedLines } = useTrainDelays();

  return (
    <>
      <div className="fixed top-0 inset-x-0 z-50 flex flex-col pt-[env(safe-area-inset-top)]">
        {hasMajorDelays && (
          <div className="bg-red-500/90 text-white px-4 py-2 text-xs sm:text-sm font-medium flex items-center justify-center gap-2 shadow-md">
            <AlertTriangle size={16} className="shrink-0" />
            <span>
              <strong>Transit Alert:</strong> Delays reported on major lines
              ({delayedLines.filter(d => CRITICAL_LINES.includes(d.name)).map(d => d.name).join(", ") || "Multiple"}).
              Check Google Maps before departing.
            </span>
          </div>
        )}
        {/* ── Top header ─────────────────────────────────────────────── */}
        <header className="px-3 pt-3">
          <nav className="glass-nav mx-auto max-w-6xl rounded-2xl px-3 sm:px-5 py-2.5 sm:py-3 flex items-center justify-between gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => setView("plan")}
            className="flex items-center gap-2 font-extrabold tracking-tight shrink-0"
          >
            <span className="text-xl sm:hidden">⛩️</span>
            <span className="hidden sm:inline text-[#E2EAF4] tracking-[-0.02em]">
              JAPAN <span className="text-accent-500">'26</span>
            </span>
          </button>

          {/* Tab row — hidden on mobile (bottom nav takes over) */}
          <div className="hidden sm:flex items-center gap-0.5 overflow-x-auto no-scrollbar -mx-1 px-1">
            {TABS.map((t) => (
              <button
                type="button"
                key={t.view}
                onClick={() => setView(t.view)}
                className={`relative px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm font-semibold whitespace-nowrap transition-colors ${
                  view === t.view
                    ? "text-white"
                    : "text-[#7A90AE] hover:text-[#C8D4E4]"
                }`}
              >
                {t.label}
                {view === t.view && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-full bg-accent-500" />
                )}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onOpenSearch}
              className="inline-flex items-center gap-2 rounded-lg px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-[#7A90AE] bg-white/5 border border-[#1C2E47] hover:bg-white/10 hover:text-[#E2EAF4] transition-colors"
              aria-label="Search everything"
              title="Search everything (⌘K)"
            >
              <Search size={14} />
              <span className="hidden md:inline">Search</span>
              <kbd className="hidden lg:inline text-[0.6rem] font-mono text-[#5A7090] border border-[#1C2E47] rounded px-1">⌘K</kbd>
            </button>

            {identityName ? (
              <button
                type="button"
                onClick={onChangeIdentity}
                title="Change identity"
                className="w-7 h-7 rounded-full bg-accent-500/20 border border-accent-500/40 flex items-center justify-center text-[0.6rem] font-bold text-accent-300 hover:bg-accent-500/35 transition-colors"
              >
                {INITIALS[identityName] ?? identityName.slice(0, 2).toUpperCase()}
              </button>
            ) : (
              <span className="hidden xl:inline-flex shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold bg-accent-500/15 text-accent-300 border border-accent-500/25">
                DEC 14–29 · 8人
              </span>
            )}
          </div>
        </nav>
      </header>
      </div>

      {/* ── Bottom nav — mobile only ────────────────────────────────── */}
      <nav
        aria-label="Main navigation"
        className="sm:hidden fixed bottom-0 inset-x-0 z-50 bg-[#08111f]/95 backdrop-blur-xl border-t border-white/8"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="flex">
          {TABS.map((t) => (
            <button
              type="button"
              key={t.view}
              onClick={() => setView(t.view)}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 text-[0.62rem] font-semibold transition-colors min-h-[56px] ${
                view === t.view
                  ? "text-accent-400"
                  : "text-slate-500 hover:text-slate-300"
              }`}
            >
              <span className="text-lg leading-none">{t.emoji}</span>
              {t.label}
            </button>
          ))}
        </div>
      </nav>
    </>
  );
}
