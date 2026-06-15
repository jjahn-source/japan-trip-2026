import { Nav } from "./components/Nav";
import { Hero } from "./components/Hero";
import { TodayBanner } from "./components/TodayBanner";
import { DailyHuddle } from "./components/DailyHuddle";
import { BackToTop } from "./components/BackToTop";
import { FlightCard } from "./components/FlightCard";
import { Itinerary } from "./components/Itinerary";
import { Bookings } from "./components/Bookings";
import { Budget } from "./components/Budget";
import { Packing } from "./components/Packing";
import { ReservationTracker } from "./components/ReservationTracker";
import { PackingChecklist } from "./components/PackingChecklist";
import { EmergencyInfo } from "./components/EmergencyInfo";
import { ContingencyPlanner } from "./components/ContingencyPlanner";
import { CrewCoordinator } from "./components/CrewCoordinator";
import { PhraseTranslator } from "./components/PhraseTranslator";
import { RestaurantBookingTracker } from "./components/RestaurantBookingTracker";
import { Footer } from "./components/Footer";
import { useHashView, type View } from "./hooks/useHashView";
import { scrollToAnchor } from "./utils/nav";
import { lazy, Suspense, useEffect, useState } from "react";

// Each secondary tab pulls in a big data file (and Leaflet, for the map).
// Lazy-load them so the initial bundle is just the landing "Plan" view.
const MissionControl = lazy(() => import("./components/MissionControl").then((m) => ({ default: m.MissionControl })));
const RouteView = lazy(() => import("./components/RouteView").then((m) => ({ default: m.RouteView })));
const StayView = lazy(() => import("./components/StayView").then((m) => ({ default: m.StayView })));
const Explore = lazy(() => import("./components/Explore").then((m) => ({ default: m.Explore })));
const EatView = lazy(() => import("./components/EatView").then((m) => ({ default: m.EatView })));
const NightView = lazy(() => import("./components/NightView").then((m) => ({ default: m.NightView })));
const PlayView = lazy(() => import("./components/PlayView").then((m) => ({ default: m.PlayView })));
const GuideView = lazy(() => import("./components/GuideView").then((m) => ({ default: m.GuideView })));
const SearchOverlay = lazy(() => import("./components/SearchOverlay").then((m) => ({ default: m.SearchOverlay })));

export default function App() {
  const [view, setView] = useHashView();
  const [searchOpen, setSearchOpen] = useState(false);

  // Cmd/Ctrl+K toggles global search anywhere in the app.
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

  // Search result → switch tab, then deep-scroll to the exact card. Itinerary
  // days also get expanded via a custom event the Itinerary listens for.
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
            <Hero />
            <TodayBanner />
            <DailyHuddle />
            <ContingencyPlanner />
            <CrewCoordinator />
            <ReservationTracker />
            <RestaurantBookingTracker />
            <PackingChecklist />
            <EmergencyInfo />
            <PhraseTranslator />
            <FlightCard />
            <Itinerary />
            <Bookings />
            <Budget />
            <Packing />
          </>
        )}
        {view !== "plan" && (
          <Suspense
            fallback={
              <div className="section-pad py-24 pt-32 text-center text-slate-400">Loading…</div>
            }
          >
            {view === "mission" && <MissionControl />}
            {view === "route" && <RouteView />}
            {view === "stay" && <StayView />}
            {view === "explore" && <Explore />}
            {view === "eat" && <EatView />}
            {view === "night" && <NightView />}
            {view === "play" && <PlayView />}
            {view === "guide" && <GuideView />}
          </Suspense>
        )}
      </main>
      <Footer />
      <BackToTop />
    </>
  );
}
