import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { Airport, FlightSearchFilters, FlightSegment, SearchFlights, SeatType } from "fli-js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_FILE = path.join(__dirname, "../public/flights.json");

async function fetchRoute(origin, dest, dateStr, label) {
  const filters = new FlightSearchFilters({
    passenger_info: { adults: 8, children: 0, infants_in_seat: 0, infants_on_lap: 0 },
    flight_segments: [
      new FlightSegment({
        departure_airport: [[[origin, 0]]],
        arrival_airport: [[[dest, 0]]],
        travel_date: dateStr,
      }),
    ],
    seat_type: SeatType.ECONOMY,
  });

  const search = new SearchFlights();
  try {
    const results = await search.search(filters, { currency: "USD", topN: 3 });
    return {
      route: label,
      date: dateStr,
      flights: (results || []).slice(0, 3).map(f => {
        const leg = f.legs[0];
        return {
          airline: leg.airline,
          flightNumber: leg.flight_number,
          departs: leg.departure_datetime.toISOString(),
          arrives: leg.arrival_datetime.toISOString(),
          price: f.price,
          duration: f.duration,
          bookingUrl: search.buildFlightBookingUrl(f, { currency: "USD" })
        };
      })
    };
  } catch (err) {
    console.error(`Failed to fetch ${label}:`, err);
    return { route: label, date: dateStr, flights: [], error: err.message };
  }
}

async function main() {
  console.log("Fetching flight prices...");
  const data = {
    fetchedAt: new Date().toISOString(),
    routes: []
  };

  // HND -> CTS (Dec 20)
  data.routes.push(await fetchRoute(Airport.HND, Airport.CTS, "2026-12-20", "Tokyo → Sapporo"));
  
  // CTS -> ITM (Dec 23)
  data.routes.push(await fetchRoute(Airport.CTS, Airport.ITM, "2026-12-23", "Sapporo → Osaka/Kyoto"));

  await fs.writeFile(OUT_FILE, JSON.stringify(data, null, 2));
  console.log(`Wrote ${data.routes.length} routes to flights.json`);
}

main().catch(console.error);
