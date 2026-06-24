import { TrendingUp, Shield } from "lucide-react";
import { useTravelIntel } from "../hooks/useTravelIntel";

function timeAgo(iso: string | null): string {
  if (!iso) return "";
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

const LEVEL_STYLE: Record<string, string> = {
  "Low risk": "bg-emerald-500/15 text-emerald-300 border-emerald-500/25",
  "Exercise normal caution": "bg-emerald-500/15 text-emerald-300 border-emerald-500/25",
  "Exercise increased caution": "bg-amber-500/15 text-amber-300 border-amber-500/25",
  "Reconsider travel": "bg-orange-500/15 text-orange-300 border-orange-500/25",
  "Do not travel": "bg-red-500/15 text-red-300 border-red-500/25",
};

export function TravelIntelPanel() {
  const { intel, loading, error } = useTravelIntel();

  if (loading || error || (!intel.exchangeRate && !intel.advisory)) return null;

  const rate = intel.exchangeRate;
  const adv = intel.advisory;
  const ago = timeAgo(intel.fetchedAt);

  return (
    <div className="glass rounded-2xl border border-white/10 p-4">
      <p className="text-[0.62rem] font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
        Travel intel
        {ago && <span className="font-normal text-slate-600">· updated {ago}</span>}
      </p>
      <div className="flex flex-wrap gap-3">
        {rate && (
          <div className="flex items-center gap-2 rounded-xl bg-white/5 border border-white/10 px-3 py-2">
            <TrendingUp size={14} className="text-emerald-400 shrink-0" />
            <div>
              <p className="text-sm font-bold text-slate-100 tabular-nums">
                ¥{Math.round(rate.usd_jpy).toLocaleString()} <span className="text-slate-500 font-normal text-xs">/ $1</span>
              </p>
              <p className="text-[0.55rem] text-slate-600">
                {rate.source} · {rate.date}
              </p>
            </div>
          </div>
        )}
        {adv && adv.score !== null && (
          <div className="flex items-center gap-2 rounded-xl bg-white/5 border border-white/10 px-3 py-2">
            <Shield size={14} className="text-sky-400 shrink-0" />
            <div>
              <span
                className={`inline-block text-[0.6rem] font-bold px-1.5 py-0.5 rounded-full border ${
                  LEVEL_STYLE[adv.level] ?? "bg-slate-500/15 text-slate-300 border-slate-500/25"
                }`}
              >
                {adv.level}
              </span>
              {adv.score != null && (
                <p className="text-[0.55rem] text-slate-600 mt-0.5">
                  Advisory score: {adv.score.toFixed(1)} / 5
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
