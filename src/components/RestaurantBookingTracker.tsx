import { Phone, AlertCircle, CheckCircle } from "lucide-react";
import { RESTAURANTS } from "../data/restaurants";
import { DAYS } from "../data/itinerary";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { SectionHeading } from "./SectionHeading";

export function RestaurantBookingTracker() {
  const [bookingStatus, setBookingStatus] = useLocalStorage<Record<string, boolean>>(
    "restaurant-bookings",
    Object.fromEntries(RESTAURANTS.map((r, i) => [i.toString(), r.booked]))
  );

  const toggleBooking = (index: number) => {
    setBookingStatus({
      ...bookingStatus,
      [index.toString()]: !bookingStatus[index.toString()],
    });
  };

  const getDayLabel = (date: string) => {
    const dayIndex = DAYS.findIndex((d) => d.date === date);
    return dayIndex >= 0 ? `Day ${dayIndex + 1}` : "Unknown";
  };

  const groupedByDate = RESTAURANTS.reduce(
    (acc, restaurant, index) => {
      if (!acc[restaurant.date]) {
        acc[restaurant.date] = [];
      }
      acc[restaurant.date].push({ restaurant, index });
      return acc;
    },
    {} as Record<string, Array<{ restaurant: typeof RESTAURANTS[0]; index: number }>>
  );

  const sortedDates = Object.keys(groupedByDate).sort();
  const bookedCount = Object.values(bookingStatus).filter(Boolean).length;

  return (
    <section className="section-pad py-24">
      <SectionHeading
        kicker="Dining"
        title="Restaurant Booking Tracker"
        sub={`${bookedCount}/${RESTAURANTS.length} booked`}
      />

      <div className="space-y-8">
        {sortedDates.map((date) => (
          <div key={date}>
            <div className="mb-4">
              <h2 className="text-lg font-bold text-slate-100">
                {getDayLabel(date)} • {new Date(date + "T00:00:00").toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}
              </h2>
            </div>

            <div className="space-y-3">
              {groupedByDate[date].map(({ restaurant, index }) => {
                const isBooked = bookingStatus[index.toString()] ?? restaurant.booked;
                const daysUntilTrip = Math.ceil(
                  (new Date(date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
                );
                const needsBooking =
                  !isBooked &&
                  restaurant.reminderDaysOut &&
                  daysUntilTrip <= restaurant.reminderDaysOut;

                return (
                  <div
                    key={`${date}-${index}`}
                    onClick={() => toggleBooking(index)}
                    className={`glass rounded-lg border p-4 cursor-pointer transition-all ${
                      isBooked
                        ? "border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10"
                        : needsBooking
                        ? "border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10"
                        : "border-white/10 hover:bg-white/5"
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      {/* Checkbox */}
                      <div className="mt-1">
                        {isBooked ? (
                          <CheckCircle size={20} className="text-emerald-400" />
                        ) : (
                          <div className="w-5 h-5 border-2 border-slate-500 rounded-full" />
                        )}
                      </div>

                      {/* Restaurant Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div>
                            <h3 className="font-bold text-slate-100">{restaurant.name}</h3>
                            <p className="text-xs text-slate-400">{restaurant.cuisine}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-xs font-bold text-slate-300">{restaurant.city}</p>
                            {restaurant.time && (
                              <p className="text-xs text-slate-400">{restaurant.time}</p>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-3 text-xs text-slate-400 mb-3">
                          <span>👥 {restaurant.party} people</span>
                          {restaurant.phone && (
                            <a
                              href={`tel:${restaurant.phone}`}
                              onClick={(e) => e.stopPropagation()}
                              className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300"
                            >
                              <Phone size={12} /> {restaurant.phone}
                            </a>
                          )}
                          {restaurant.link && (
                            <a
                              href={restaurant.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="text-cyan-400 hover:text-cyan-300"
                            >
                              Book online ↗
                            </a>
                          )}
                        </div>

                        {restaurant.notes && (
                          <p className="text-xs text-slate-300 mb-2">{restaurant.notes}</p>
                        )}

                        {needsBooking && (
                          <div className="flex items-center gap-2 p-2 bg-amber-500/10 border border-amber-500/20 rounded text-amber-300 text-xs">
                            <AlertCircle size={14} />
                            <span>Book within {restaurant.reminderDaysOut} days</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Booking Instructions */}
      <div className="mt-8 glass rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-6">
        <h3 className="font-bold text-cyan-300 mb-3">Booking guide:</h3>
        <ul className="space-y-2 text-sm text-slate-300">
          <li>• <strong>Kaiseki</strong>: Book 2–4 weeks ahead (fancy, multi-course)</li>
          <li>• <strong>Popular omakase</strong>: Book 2+ weeks ahead</li>
          <li>• <strong>Regular restaurants</strong>: Book 5–7 days ahead</li>
          <li>• <strong>Walk-ins / casual</strong>: No booking needed</li>
          <li>• <strong>TableCheck & Tabelog</strong>: Use for online bookings (English support)</li>
          <li>• <strong>Phone booking</strong>: Call hotel concierge to translate if needed</li>
        </ul>
      </div>
    </section>
  );
}
