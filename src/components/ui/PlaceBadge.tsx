import { useGooglePlace } from "../../hooks/useGooglePlace";

export function PlaceBadge({ placeId }: { placeId: string | undefined }) {
  const { status, closesAt } = useGooglePlace(placeId);
  if (!placeId || status === "unknown") return null;

  if (status === "open") {
    return (
      <span className="inline-flex items-center gap-1 text-[0.65rem] font-semibold text-emerald-400">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
        Open{closesAt ? ` · closes ${closesAt}` : ""}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 text-[0.65rem] font-semibold text-red-400">
      <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
      Closed
    </span>
  );
}
