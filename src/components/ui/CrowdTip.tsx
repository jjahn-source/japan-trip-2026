import { Clock } from "lucide-react";

export function CrowdTip({
  bestVisitTime,
  crowdWarning,
}: {
  bestVisitTime?: string;
  crowdWarning?: string;
}) {
  if (!bestVisitTime && !crowdWarning) return null;

  return (
    <div className="mt-2.5 flex items-start gap-1.5 text-xs text-sky-200/80 bg-sky-500/10 border border-sky-500/20 rounded-lg px-2.5 py-2">
      <Clock size={11} className="mt-0.5 shrink-0 text-sky-400" />
      <span>
        {bestVisitTime && <span className="font-semibold">Best: {bestVisitTime}</span>}
        {bestVisitTime && crowdWarning && " · "}
        {crowdWarning && crowdWarning}
      </span>
    </div>
  );
}
