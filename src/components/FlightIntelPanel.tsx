import { useState, useEffect } from "react";
import { Plane, ExternalLink, AlertTriangle, Clock } from "lucide-react";

type Flight = {
  airline: string;
  flightNumber: string;
  departs: string;
  arrives: string;
  price: number;
  duration: number;
  bookingUrl: string;
};

type RouteData = {
  route: string;
  date: string;
  flights: Flight[];
  error?: string;
};

export function FlightIntelPanel() {
  const [data, setData] = useState<{ fetchedAt: string; routes: RouteData[] } | null>(null);

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}flights.json`)
      .then(r => r.ok ? r.json() : null)
      .then(setData)
      .catch(() => {});
  }, []);

  if (!data || !data.routes || data.routes.length === 0) return null;

  return (
    <div className="glass rounded-2xl border border-sky-500/20 p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-sky-300 flex items-center gap-2">
          <Plane size={14} className="text-sky-400" /> Domestic Flight Intel
        </h3>
        <span className="text-[0.6rem] text-slate-500">
          Live prices (8 pax)
        </span>
      </div>

      <div className="space-y-4">
        {data.routes.map((r, i) => (
          <div key={i} className="bg-black/30 rounded-xl p-3 border border-white/5">
            <h4 className="text-xs font-bold text-white mb-2">{r.route} <span className="text-slate-400 font-normal ml-1">· Dec {r.date.split("-")[2]}</span></h4>
            {r.error && (
              <p className="text-xs text-amber-400 flex items-center gap-1"><AlertTriangle size={12}/> Search failed</p>
            )}
            {r.flights.length === 0 && !r.error && (
              <p className="text-xs text-slate-400">No flights found.</p>
            )}
            <div className="space-y-2">
              {r.flights.map((f, j) => {
                const dep = new Date(f.departs).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
                const arr = new Date(f.arrives).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
                return (
                  <div key={j} className="flex items-center justify-between bg-white/5 rounded-lg p-2 hover:bg-white/10 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="text-[0.65rem] font-bold bg-sky-500/20 text-sky-200 px-1.5 py-0.5 rounded">{f.airline.replace(/^_/, "")}</div>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-white">{dep} – {arr}</span>
                        <span className="text-[0.6rem] text-slate-400 flex items-center gap-1"><Clock size={10} /> {Math.floor(f.duration/60)}h {f.duration%60}m</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="block text-xs font-bold text-emerald-400">${f.price}</span>
                        <span className="block text-[0.55rem] text-slate-500">per person</span>
                      </div>
                      <a href={f.bookingUrl} target="_blank" rel="noreferrer" className="bg-sky-500 hover:bg-sky-400 text-black p-1.5 rounded-md transition-colors">
                        <ExternalLink size={14} />
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
