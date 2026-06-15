import { CheckCircle, Circle, ExternalLink, AlertTriangle } from "lucide-react";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { SectionHeading } from "./SectionHeading";

type Item = {
  id: string;
  label: string;
  note: string;
  critical: boolean;
  link?: { label: string; url: string };
};

const CHECKLIST: Item[] = [
  {
    id: "passport",
    label: "Passports valid 6+ months past Dec 29",
    note: "Check all 8 crew passports — expiry must be June 2026 or later",
    critical: true,
    link: { label: "Renew at travel.state.gov", url: "https://travel.state.gov/content/travel/en/passports.html" },
  },
  {
    id: "visa",
    label: "Japan visa — US citizens no visa needed <90 days",
    note: "Non-US crew members should confirm their country's requirements",
    critical: true,
    link: { label: "Check MOFA visa list", url: "https://www.mofa.go.jp/j_info/visit/visa/short/novisa.html" },
  },
  {
    id: "insurance",
    label: "Travel insurance purchased (medical + cancellation)",
    note: "Cover medical emergencies, lost bags, and trip interruption",
    critical: true,
    link: { label: "World Nomads", url: "https://www.worldnomads.com/" },
  },
  {
    id: "notify-bank",
    label: "Bank + credit cards notified of Japan travel dates",
    note: "Set travel notice online or call — prevents fraud blocks on arrival",
    critical: true,
  },
  {
    id: "jr-pass",
    label: "JR Pass ordered and arriving before departure",
    note: "14-day pass covers all Shinkansen between cities — must order online",
    critical: false,
    link: { label: "Order at jrpass.com", url: "https://www.jrpass.com/" },
  },
  {
    id: "sim",
    label: "Japan SIM or eSIM arranged",
    note: "Pick up at Haneda Airport or pre-activate an eSIM before flying",
    critical: false,
    link: { label: "IIJ Tourist SIM", url: "https://www.iijmio.jp/en/tourist/" },
  },
  {
    id: "suica",
    label: "Suica card set up (mobile or physical)",
    note: "Tap to ride trains, buses, and pay at convenience stores and vending machines",
    critical: false,
    link: { label: "Mobile Suica on iPhone", url: "https://www.jreast.co.jp/e/guide/suica.html" },
  },
  {
    id: "cash",
    label: "Cash strategy sorted — 7-Eleven ATMs work best",
    note: "Many restaurants and shrines are cash-only — carry ¥20,000+ at all times",
    critical: false,
  },
  {
    id: "offline-maps",
    label: "Offline maps downloaded for Tokyo, Kyoto, Osaka, Hiroshima",
    note: "Save Google Maps areas before flying — lifesaver when data is spotty",
    critical: false,
    link: { label: "How to save offline maps", url: "https://support.google.com/maps/answer/6291838" },
  },
  {
    id: "luggage",
    label: "Bags packed and weighed (<23 kg checked, <7 kg carry-on)",
    note: "Tip: use Yamato to ship bags between cities ≈ ¥2,000–¥3,000 per bag",
    critical: false,
  },
];

export function PreTripChecklist() {
  const [completed, setCompleted] = useLocalStorage<Record<string, boolean>>(
    "pretip-checklist-v2",
    {}
  );

  const toggle = (id: string) => setCompleted({ ...completed, [id]: !completed[id] });

  const critical = CHECKLIST.filter((i) => i.critical);
  const criticalDone = critical.filter((i) => completed[i.id]).length;
  const totalDone = CHECKLIST.filter((i) => completed[i.id]).length;

  return (
    <section className="section-pad py-24">
      <SectionHeading
        kicker="Before Departure"
        title="Pre-Trip Checklist"
        sub={`${totalDone}/${CHECKLIST.length} done · ${criticalDone}/${critical.length} critical`}
      />

      {/* Progress bar */}
      <div className="glass rounded-2xl border border-white/10 p-5 mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Progress</span>
          <span className="text-sm font-bold text-slate-200">{totalDone} / {CHECKLIST.length}</span>
        </div>
        <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-500 rounded-full transition-all duration-300"
            style={{ width: `${(totalDone / CHECKLIST.length) * 100}%` }}
          />
        </div>
        {criticalDone < critical.length && (
          <div className="flex items-center gap-2 mt-3 text-xs text-amber-300 font-semibold">
            <AlertTriangle size={13} className="shrink-0" />
            {critical.length - criticalDone} critical item{critical.length - criticalDone > 1 ? "s" : ""} still open
          </div>
        )}
      </div>

      {/* Items */}
      <div className="space-y-2">
        {CHECKLIST.map((item) => {
          const done = !!completed[item.id];
          return (
            <div
              key={item.id}
              className={`glass rounded-xl border p-4 transition-all ${
                done
                  ? "border-emerald-500/20 bg-emerald-500/5"
                  : item.critical
                  ? "border-amber-500/20 bg-amber-500/5"
                  : "border-white/10"
              }`}
            >
              <div className="flex items-start gap-3">
                <button
                  type="button"
                  onClick={() => toggle(item.id)}
                  className="mt-0.5 shrink-0"
                  aria-label={done ? "Mark incomplete" : "Mark complete"}
                >
                  {done
                    ? <CheckCircle size={20} className="text-emerald-400" />
                    : <Circle size={20} className="text-slate-500 hover:text-slate-300 transition-colors" />
                  }
                </button>

                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold leading-snug ${done ? "line-through text-slate-500" : "text-slate-100"}`}>
                    {item.label}
                    {item.critical && !done && (
                      <span className="ml-2 text-[0.6rem] font-bold uppercase tracking-wider text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded">Required</span>
                    )}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{item.note}</p>
                  {item.link && !done && (
                    <a
                      href={item.link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1 mt-1.5 text-xs text-cyan-400 hover:text-cyan-300 transition-colors font-medium"
                    >
                      <ExternalLink size={11} />
                      {item.link.label}
                    </a>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
