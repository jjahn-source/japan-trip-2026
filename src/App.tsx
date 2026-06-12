import { Nav } from "./components/Nav";
import { Hero } from "./components/Hero";
import { Itinerary } from "./components/Itinerary";
import { Bookings } from "./components/Bookings";
import { Budget } from "./components/Budget";
import { Packing } from "./components/Packing";
import { Explore } from "./components/Explore";
import { EatView } from "./components/EatView";
import { GuideView } from "./components/GuideView";
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
            <Itinerary />
            <Bookings />
            <Budget />
            <Packing />
          </>
        )}
        {view === "explore" && <Explore />}
        {view === "eat" && <EatView />}
        {view === "guide" && <GuideView />}
      </main>
      <Footer />
    </>
  );
}
