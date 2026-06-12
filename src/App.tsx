import { Nav } from "./components/Nav";
import { Hero } from "./components/Hero";
import { FlightCard } from "./components/FlightCard";
import { Itinerary } from "./components/Itinerary";
import { Bookings } from "./components/Bookings";
import { Budget } from "./components/Budget";
import { Packing } from "./components/Packing";
import { Explore } from "./components/Explore";
import { EatView } from "./components/EatView";
import { GuideView } from "./components/GuideView";
import { StayView } from "./components/StayView";
import { NightView } from "./components/NightView";
import { PlayView } from "./components/PlayView";
import { RouteView } from "./components/RouteView";
import { Footer } from "./components/Footer";
import { useHashView } from "./hooks/useHashView";

export default function App() {
  const [view, setView] = useHashView();

  return (
    <>
      <Nav view={view} setView={setView} />
      <main>
        {view === "plan" && (
          <>
            <Hero />
            <FlightCard />
            <Itinerary />
            <Bookings />
            <Budget />
            <Packing />
          </>
        )}
        {view === "route" && <RouteView />}
        {view === "stay" && <StayView />}
        {view === "explore" && <Explore />}
        {view === "eat" && <EatView />}
        {view === "night" && <NightView />}
        {view === "play" && <PlayView />}
        {view === "guide" && <GuideView />}
      </main>
      <Footer />
    </>
  );
}
