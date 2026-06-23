import { Star, AlertTriangle, Loader2 } from "lucide-react";
import { useGooglePlaceSearch, isClosedAt } from "../../hooks/useGooglePlaceSearch";

export function PlaceSearchBadge({
  query,
  city,
  time,
  dow,
}: {
  query: string | undefined;
  city?: string;
  time?: string;
  dow?: string;
}) {
  const info = useGooglePlaceSearch(query, city);
  const { status, closesAt, rating, regularOpeningHours, loading } = info;

  if (!query || (!loading && status === "unknown" && rating === null)) return null;

  if (loading) {
    return (
      <span className="inline-flex items-center gap-1 text-[0.62rem] text-slate-500">
        <Loader2 size={9} className="animate-spin" />
        checking...
      </span>
    );
  }

  // Check if scheduled during closed hours
  const isClosedNow = time && dow && regularOpeningHours && isClosedAt(regularOpeningHours, dow, time);

  return (
    <div className="inline-flex items-center gap-2 mt-1 flex-wrap">
      {rating !== null && (
        <span className="inline-flex items-center gap-0.5 text-[0.65rem] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded px-1">
          <Star size={9} className="fill-amber-400 shrink-0" />
          {rating.toFixed(1)}
        </span>
      )}

      {isClosedNow ? (
        <span className="inline-flex items-center gap-1 text-[0.65rem] font-bold text-red-300 bg-red-500/10 border border-red-500/20 rounded px-1">
          <AlertTriangle size={9} className="shrink-0" />
          Closed at {time}
        </span>
      ) : status === "open" ? (
        <span className="inline-flex items-center gap-1 text-[0.65rem] font-semibold text-emerald-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0 animate-pulse" />
          Open{closesAt ? ` · closes ${closesAt}` : ""}
        </span>
      ) : status === "closed" ? (
        <span className="inline-flex items-center gap-1 text-[0.65rem] font-semibold text-slate-500">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-500 shrink-0" />
          Closed
        </span>
      ) : null}
    </div>
  );
}
