import { CheckCircle2, Circle, Phone, ExternalLink, AlertCircle } from "lucide-react";
import { RESERVATIONS } from "../data/reservations";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { SectionHeading } from "./SectionHeading";

export function ReservationTracker() {
  const [confirmed, setConfirmed] = useLocalStorage<Record<string, boolean>>(
    "reservations-confirmed",
    Object.fromEntries(RESERVATIONS.filter((r) => r.confirmed).map((r) => [r.id, true]))
  );

  const toggleConfirmed = (id: string) => {
    setConfirmed({ ...confirmed, [id]: !confirmed[id] });
  };

  const today = new Date().toISOString().split("T")[0];
  const upcoming = RESERVATIONS.filter((r) => r.date >= today).sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const needsBooking = upcoming.filter((r) => !confirmed[r.id]);
  const needsSoonBooking = needsBooking.filter((r) => {
    const bookBy = new Date(r.bookByDate);
    const daysUntil = Math.ceil((bookBy.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    return daysUntil <= 14; // Book within 2 weeks
  });

  const typeColors: Record<string, string> = {
    restaurant: "bg-amber-500/10 border-amber-500/30 text-amber-200",
    activity: "bg-rose-500/10 border-rose-500/30 text-rose-200",
    hotel: "bg-emerald-500/10 border-emerald-500/30 text-emerald-200",
    transport: "bg-cyan-500/10 border-cyan-500/30 text-cyan-200",
    tour: "bg-violet-500/10 border-violet-500/30 text-violet-200",
  };

  const typeEmojis: Record<string, string> = {
    restaurant: "🍽",
    activity: "🎫",
    hotel: "🏨",
    transport: "🚄",
    tour: "👥",
  };

  return (
    <section className="section-pad py-24">
      <SectionHeading
        kicker="Trip Operations"
        title="Reservation Tracker"
        sub={`${needsSoonBooking.length} to book within 2 weeks · ${needsBooking.length} pending · ${upcoming.filter((r) => confirmed[r.id]).length} confirmed`}
      />

      {needsSoonBooking.length > 0 && (
        <div className="mb-6 glass rounded-2xl border border-red-500/30 bg-red-500/5 p-6">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle size={18} className="text-red-400" />
            <h3 className="font-bold text-red-300">Book immediately (within 14 days)</h3>
          </div>
          <div className="space-y-2">
            {needsSoonBooking.map((r) => (
              <div key={r.id} className="flex items-center justify-between p-2 bg-red-500/10 rounded">
                <div>
                  <p className="text-sm font-bold">{r.name}</p>
                  <p className="text-xs text-slate-400">Book by: {r.bookByDate}</p>
                </div>
                <p className="text-xs text-red-300 font-bold">
                  {Math.ceil(
                    (new Date(r.bookByDate).getTime() - new Date().getTime()) /
                      (1000 * 60 * 60 * 24)
                  )}{" "}
                  days left
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-4">
        {upcoming.map((r) => {
          const isConfirmed = confirmed[r.id];
          const isPast = new Date(r.date) < new Date();

          return (
            <div
              key={r.id}
              className={`glass rounded-2xl border p-5 transition-opacity ${
                typeColors[r.type]
              } ${isPast ? "opacity-50" : ""}`}
            >
              <div className="flex items-start gap-3">
                <button
                  onClick={() => toggleConfirmed(r.id)}
                  className="shrink-0 pt-0.5"
                >
                  {isConfirmed ? (
                    <CheckCircle2 size={20} className="text-emerald-400" />
                  ) : (
                    <Circle size={20} className="text-slate-600 hover:text-slate-400" />
                  )}
                </button>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{typeEmojis[r.type]}</span>
                      <div>
                        <h3 className={`font-bold ${isConfirmed ? "line-through" : ""}`}>
                          {r.name}
                        </h3>
                        <p className="text-xs text-slate-400">{r.city}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs font-bold">{r.date}</p>
                      {r.time && <p className="text-xs text-slate-400">{r.time}</p>}
                    </div>
                  </div>

                  {r.notes && <p className="text-xs text-slate-300 mb-2">{r.notes}</p>}

                  <div className="flex flex-wrap items-center gap-2">
                    {r.bookedVia && (
                      <span className="text-[0.65rem] font-semibold bg-white/10 px-2 py-1 rounded">
                        {r.bookedVia}
                      </span>
                    )}
                    {!isConfirmed && (
                      <span className="text-[0.65rem] font-bold text-amber-300 bg-amber-500/20 px-2 py-1 rounded">
                        Book by {r.bookByDate}
                      </span>
                    )}
                    {r.bookingLink && (
                      <a
                        href={r.bookingLink}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[0.65rem] font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                      >
                        <ExternalLink size={12} /> Book
                      </a>
                    )}
                    {r.phone && (
                      <a
                        href={`tel:${r.phone}`}
                        className="text-[0.65rem] font-bold text-rose-400 hover:text-rose-300 flex items-center gap-1"
                      >
                        <Phone size={12} /> Call
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-8 p-4 bg-white/5 border border-white/10 rounded-xl text-xs text-slate-400">
        <p className="font-bold mb-2">Quick booking calendar:</p>
        <ul className="space-y-1">
          <li>🎫 <strong>Oct 21:</strong> Book Dec 21 shinkansen (Tokyo→Kyoto)</li>
          <li>🎫 <strong>Nov 10:</strong> Ghibli Museum tickets (drops Dec 10)</li>
          <li>🎫 <strong>Nov 21:</strong> Dec 25 shinkansen (Osaka⇄Hiroshima)</li>
          <li>🍽 <strong>Nov 22–Dec 1:</strong> Book Dec dinners 4–6 weeks out</li>
          <li>🎫 <strong>Dec 2:</strong> Sumo stable + teamLab timed entries</li>
        </ul>
      </div>
    </section>
  );
}
