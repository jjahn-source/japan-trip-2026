import { Nav } from "./components/Nav";
import { Hero } from "./components/Hero";
import { Itinerary } from "./components/Itinerary";
import { Bookings } from "./components/Bookings";
import { Budget } from "./components/Budget";
import { Food } from "./components/Food";
import { Packing } from "./components/Packing";
import { Tips } from "./components/Tips";
import { Footer } from "./components/Footer";

export default function App() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <Itinerary />
        <Bookings />
        <Budget />
        <Food />
        <Packing />
        <Tips />
      </main>
      <Footer />
    </>
  );
}
