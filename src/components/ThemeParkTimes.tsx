import { useThemeParkTimes } from "../hooks/useThemeParkTimes";
import { Clock, AlertTriangle } from "lucide-react";

export function ThemeParkTimes({ parkId, parkName }: { parkId: string; parkName: string }) {
  const { waitTimes, loading, error } = useThemeParkTimes(parkId);

  if (loading) return <div className="text-sm text-white/50 animate-pulse mt-2 flex items-center gap-2"><Clock size={14} /> Loading live {parkName} wait times...</div>;
  if (error || waitTimes.length === 0) return null;

  return (
    <div className="mt-4 bg-white/5 border border-white/10 rounded-xl p-4">
      <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
        <span className="bg-blue-500/20 text-blue-300 p-1 rounded-md"><Clock size={14} /></span>
        Live Wait Times
      </h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
        {waitTimes.slice(0, 10).map((ride) => (
          <div key={ride.id} className="flex items-center justify-between bg-black/20 rounded-md p-2 text-xs">
            <span className="text-white/80 truncate pr-2" title={ride.name}>{ride.name}</span>
            {ride.status === "OPERATING" && ride.waitTime !== null ? (
              <span className={`font-mono font-bold whitespace-nowrap ${ride.waitTime > 60 ? "text-red-400" : ride.waitTime > 30 ? "text-amber-400" : "text-emerald-400"}`}>
                {ride.waitTime}m
              </span>
            ) : (
              <span className="text-white/40 flex items-center gap-1 whitespace-nowrap">
                <AlertTriangle size={10} /> {ride.status}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
