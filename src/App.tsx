import { Nav } from "./components/Nav";
import { TodayBanner } from "./components/TodayBanner";
import { BackToTop } from "./components/BackToTop";
import { Itinerary } from "./components/Itinerary";
import { Bookings } from "./components/Bookings";
import { CurrencyCalc } from "./components/CurrencyCalc";
import { Footer } from "./components/Footer";
import { useHashView, type View } from "./hooks/useHashView";
import { scrollToAnchor } from "./utils/nav";
import { lazy, Suspense, useEffect, useState } from "react";

const Explore = lazy(() => import("./components/Explore").then((m) => ({ default: m.Explore })));
const EatView = lazy(() => import("./components/EatView").then((m) => ({ default: m.EatView })));
const NightView = lazy(() => import("./components/NightView").then((m) => ({ default: m.NightView })));
const GuideView = lazy(() => import("./components/GuideView").then((m) => ({ default: m.GuideView })));
const ShopView = lazy(() => import("./components/ShopView").then((m) => ({ default: m.ShopView })));
const SearchOverlay = lazy(() => import("./components/SearchOverlay").then((m) => ({ default: m.SearchOverlay })));

export default function App() {
  const [view, setView] = useHashView();
  const [searchOpen, setSearchOpen] = useState(false);

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

  return (
    <>
      <Nav view={view} setView={setView} onOpenSearch={() => setSearchOpen(true)} />
      {searchOpen && (
        <Suspense fallback={null}>
          <SearchOverlay onClose={() => setSearchOpen(false)} onNavigate={navigateTo} />
        </Suspense>
      )}
      <main>
        {view === "plan" && (
          <>
            <TodayBanner />
            <Itinerary />
            <Bookings />
            <CurrencyCalc />
          </>
        )}
        {view !== "plan" && (
          <Suspense
            fallback={
              <div className="section-pad py-24 pt-32 text-center text-slate-400">Loading…</div>
            }
          >
            {view === "explore" && (
              <>
                <Explore />
                <NightView />
                <ShopView />
              </>
            )}
            {view === "eat" && <EatView />}
            {view === "guide" && <GuideView />}
          </Suspense>
        )}
      </main>
      <Footer />
      <BackToTop />
    </>
  );
}
