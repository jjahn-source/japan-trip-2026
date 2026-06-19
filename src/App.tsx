import { Nav } from "./components/Nav";
import { TodayBanner } from "./components/TodayBanner";
import { BackToTop } from "./components/BackToTop";
import { Itinerary } from "./components/Itinerary";
import { Bookings } from "./components/Bookings";
import { StayView } from "./components/StayView";
import { CurrencyCalc } from "./components/CurrencyCalc";
import { Footer } from "./components/Footer";
import { PreTripPhases } from "./components/PreTripPhases";
import { CrewBoard } from "./components/CrewBoard";
import { CrewChat } from "./components/CrewChat";
import { BudgetSplit } from "./components/BudgetSplit";
import { IdentityModal } from "./components/IdentityModal";
import { useHashView, type View } from "./hooks/useHashView";
import { useIdentity } from "./hooks/useIdentity";
import { initTripDoc, FIREBASE_ENABLED } from "./lib/firebase";
import { scrollToAnchor } from "./utils/nav";
import { lazy, Suspense, useEffect, useState } from "react";

const Explore = lazy(() => import("./components/Explore").then((m) => ({ default: m.Explore })));
const EatView = lazy(() => import("./components/EatView").then((m) => ({ default: m.EatView })));
const NightView = lazy(() => import("./components/NightView").then((m) => ({ default: m.NightView })));
const PlayView = lazy(() => import("./components/PlayView").then((m) => ({ default: m.PlayView })));
const GuideView = lazy(() => import("./components/GuideView").then((m) => ({ default: m.GuideView })));
const ShopView = lazy(() => import("./components/ShopView").then((m) => ({ default: m.ShopView })));
const CrewView = lazy(() => import("./components/CrewView").then((m) => ({ default: m.CrewView })));
const SearchOverlay = lazy(() => import("./components/SearchOverlay").then((m) => ({ default: m.SearchOverlay })));

type ExploreTab = "sights" | "night" | "play" | "shop";
type EatTab = "spots" | "dishes" | "regional" | "chains";
type GuideTab = "survival" | "packing";
type CrewTab = "wars" | "bingo" | "awards" | "rituals";

const EXPLORE_TABS: { id: ExploreTab; label: string; emoji: string }[] = [
  { id: "sights", label: "Sights", emoji: "⛩️" },
  { id: "night",  label: "Night",  emoji: "🌙" },
  { id: "play",   label: "Play",   emoji: "🕹️" },
  { id: "shop",   label: "Shop",   emoji: "🛍️" },
];

const EAT_TABS: { id: EatTab; label: string; emoji: string }[] = [
  { id: "spots",    label: "Spots",    emoji: "🍱" },
  { id: "dishes",   label: "Dishes",   emoji: "🍜" },
  { id: "regional", label: "Regional", emoji: "🗺️" },
  { id: "chains",   label: "Chains",   emoji: "🏪" },
];

const GUIDE_TABS: { id: GuideTab; label: string; emoji: string }[] = [
  { id: "survival", label: "Survival", emoji: "🧭" },
  { id: "packing",  label: "Packing",  emoji: "🎒" },
];

const CREW_TABS: { id: CrewTab; label: string; emoji: string }[] = [
  { id: "wars",    label: "Wars",    emoji: "🎖️" },
  { id: "bingo",   label: "Bingo",   emoji: "🎰" },
  { id: "awards",  label: "Awards",  emoji: "🏆" },
  { id: "rituals", label: "Rituals", emoji: "🌅" },
];

export default function App() {
  const [view, setView] = useHashView();
  const [exploreTab, setExploreTab] = useState<ExploreTab>("sights");
  const [eatTab, setEatTab] = useState<EatTab>("spots");
  const [guideTab, setGuideTab] = useState<GuideTab>("survival");
  const [crewTab, setCrewTab] = useState<CrewTab>("wars");
  const [searchOpen, setSearchOpen] = useState(false);
  const [resetIdentity, setResetIdentity] = useState(false);
  const { name, chooseName } = useIdentity();

  useEffect(() => {
    if (FIREBASE_ENABLED) initTripDoc();
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const navigateTo = (v: View, anchor?: string) => {
    setView(v);
    if (!anchor) return;
    const dayMatch = /^day-(\d+)$/.exec(anchor);
    if (dayMatch) {
      window.dispatchEvent(new CustomEvent("trip:open-day", { detail: Number(dayMatch[1]) }));
    }
    scrollToAnchor(anchor);
  };

  const handleChooseName = (n: Parameters<typeof chooseName>[0]) => {
    chooseName(n);
    setResetIdentity(false);
  };

  const switchExploreTab = (tab: ExploreTab) => {
    setExploreTab(tab);
    window.scrollTo({ top: 0 });
  };

  const switchEatTab = (tab: EatTab) => {
    setEatTab(tab);
    window.scrollTo({ top: 0 });
  };

  const switchGuideTab = (tab: GuideTab) => {
    setGuideTab(tab);
    window.scrollTo({ top: 0 });
  };

  const switchCrewTab = (tab: CrewTab) => {
    setCrewTab(tab);
    window.scrollTo({ top: 0 });
  };

  return (
    <>
      <IdentityModal
        open={FIREBASE_ENABLED && (name === null || resetIdentity)}
        onChoose={handleChooseName}
      />
      <Nav
        view={view}
        setView={setView}
        onOpenSearch={() => setSearchOpen(true)}
        identityName={name}
        onChangeIdentity={() => setResetIdentity(true)}
      />
      {searchOpen && (
        <Suspense fallback={null}>
          <SearchOverlay onClose={() => setSearchOpen(false)} onNavigate={navigateTo} />
        </Suspense>
      )}
      <main>
        {view === "plan" && (
          <>
            <TodayBanner />
            <PreTripPhases />
            <CrewBoard myName={name} />
            <Itinerary />
            <BudgetSplit />
            <CrewChat />
            <Bookings />
            <StayView />
            <CurrencyCalc />
          </>
        )}
        {view === "explore" && (
          <>
            <div className="sticky top-[68px] z-40 bg-[#09090f]/90 backdrop-blur-xl border-b border-white/8">
              <div className="section-pad flex gap-1 py-2">
                {EXPLORE_TABS.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => switchExploreTab(t.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap ${
                      exploreTab === t.id
                        ? "bg-rose-500 text-white shadow-sm shadow-rose-500/30"
                        : "text-slate-400 hover:text-white hover:bg-white/10"
                    }`}
                  >
                    <span>{t.emoji}</span>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
            <Suspense fallback={<div className="section-pad py-24 pt-32 text-center text-slate-400">Loading…</div>}>
              {exploreTab === "sights" && <Explore />}
              {exploreTab === "night" && <NightView />}
              {exploreTab === "play" && <PlayView />}
              {exploreTab === "shop" && <ShopView />}
            </Suspense>
          </>
        )}
        {view === "eat" && (
          <>
            <div className="sticky top-[68px] z-40 bg-[#09090f]/90 backdrop-blur-xl border-b border-white/8">
              <div className="section-pad flex gap-1 py-2">
                {EAT_TABS.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => switchEatTab(t.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap ${
                      eatTab === t.id
                        ? "bg-amber-500 text-white shadow-sm shadow-amber-500/30"
                        : "text-slate-400 hover:text-white hover:bg-white/10"
                    }`}
                  >
                    <span>{t.emoji}</span>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
            <Suspense fallback={<div className="section-pad py-24 pt-32 text-center text-slate-400">Loading…</div>}>
              <EatView tab={eatTab} />
            </Suspense>
          </>
        )}
        {view === "guide" && (
          <>
            <div className="sticky top-[68px] z-40 bg-[#09090f]/90 backdrop-blur-xl border-b border-white/8">
              <div className="section-pad flex gap-1 py-2">
                {GUIDE_TABS.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => switchGuideTab(t.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap ${
                      guideTab === t.id
                        ? "bg-teal-500 text-white shadow-sm shadow-teal-500/30"
                        : "text-slate-400 hover:text-white hover:bg-white/10"
                    }`}
                  >
                    <span>{t.emoji}</span>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
            <Suspense fallback={<div className="section-pad py-24 pt-32 text-center text-slate-400">Loading…</div>}>
              <GuideView tab={guideTab} />
            </Suspense>
          </>
        )}
        {view === "crew" && (
          <>
            <div className="sticky top-[68px] z-40 bg-[#09090f]/90 backdrop-blur-xl border-b border-white/8">
              <div className="section-pad flex gap-1 py-2">
                {CREW_TABS.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => switchCrewTab(t.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap ${
                      crewTab === t.id
                        ? "bg-violet-500 text-white shadow-sm shadow-violet-500/30"
                        : "text-slate-400 hover:text-white hover:bg-white/10"
                    }`}
                  >
                    <span>{t.emoji}</span>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
            <Suspense fallback={<div className="section-pad py-24 pt-32 text-center text-slate-400">Loading…</div>}>
              <CrewView tab={crewTab} />
            </Suspense>
          </>
        )}
      </main>
      <Footer />
      <BackToTop />
    </>
  );
}
