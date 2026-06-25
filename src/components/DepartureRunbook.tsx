import { CheckCircle2, Circle, Clock, MapPin, Plane } from "lucide-react";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { SectionHeading } from "./SectionHeading";

const DEPARTURE_DATE = "2026-12-14";

type CheckItem = { id: string; text: string };
type CheckSection = { id: string; title: string; emoji: string; when: string; items: CheckItem[] };

const SECTIONS: CheckSection[] = [
  {
    id: "night-before",
    title: "Night Before (Dec 13)",
    emoji: "🌙",
    when: "Evening of Dec 13",
    items: [
      { id: "bags-packed", text: "Bags packed & weighed — checked max 23 kg, carry-on max 10 kg" },
      { id: "charge-devices", text: "All devices at 100% — phone, tablet, earbuds, watch, power bank" },
      { id: "boarding-passes", text: "Boarding passes saved to Apple/Google Wallet: DL 2538 (RDU→MSP) + DL 121 (MSP→HND)" },
      { id: "offline-maps", text: "Offline Tokyo map downloaded — Google Maps → your profile → Offline areas" },
      { id: "cash-plan", text: "¥20,000–30,000 cash in hand, OR confirmed plan to hit HND arrivals ATM on landing" },
      { id: "group-chat", text: "Drop pickup timing + rideshare ETA in group chat" },
      { id: "two-alarms", text: "Two alarms set: 03:30 and 03:45" },
    ],
  },
  {
    id: "morning-of",
    title: "Morning of Dec 14",
    emoji: "☀️",
    when: "03:30 wake-up",
    items: [
      { id: "passport-bag", text: "Passport in carry-on front pocket — not buried, not checked" },
      { id: "charger-carry-on", text: "Phone charger + any power banks in carry-on (not checked bag — airline rule)" },
      { id: "confirm-flights", text: "Delta app open — both flight legs show status CONFIRMED" },
      { id: "travel-insurance", text: "Travel insurance policy screenshotted to Camera Roll" },
      { id: "lock-up", text: "House locked, thermostat set, someone has a spare key" },
      { id: "rideshare", text: "Rideshare en route — target RDU arrival by 04:15" },
    ],
  },
  {
    id: "at-airport",
    title: "At RDU (04:15 arrival)",
    emoji: "✈️",
    when: "Arrive by 04:15",
    items: [
      { id: "delta-counter", text: "Check in at Delta counter — Terminal 2, Delta wing (not United side)" },
      { id: "checked-bag", text: "Checked bag: $35 each on DL, free with Delta card — pay before the line moves" },
      { id: "tsa", text: "TSA PreCheck lane if you have it; otherwise allow 25–30 min" },
      { id: "crew-headcount", text: "Headcount at the gate before boarding — all 8 accounted for" },
      { id: "airport-snacks", text: "Grab food at RDU if you need it — MSP layover is tight (~2 h) with limited options" },
    ],
  },
];

export function DepartureRunbook() {
  const [checked, setChecked] = useLocalStorage<Record<string, boolean>>("departure-runbook", {});

  const today = new Date().toISOString().split("T")[0];
  if (today >= DEPARTURE_DATE) return null;

  const toggle = (id: string) => setChecked({ ...checked, [id]: !checked[id] });

  const allItems = SECTIONS.flatMap((s) => s.items);
  const doneCount = allItems.filter((item) => checked[item.id]).length;
  const pct = allItems.length > 0 ? Math.round((doneCount / allItems.length) * 100) : 0;
  const daysOut = Math.max(
    0,
    Math.ceil((new Date(DEPARTURE_DATE + "T04:30:00").getTime() - Date.now()) / 86_400_000),
  );

  return (
    <section id="departure-runbook" className="section-pad py-24">
      <SectionHeading
        kicker="Dec 14 · 06:00 RDU"
        title="Departure Day Runbook"
        sub="Morning-of checklist. Every box checked = no one left behind."
      />

      {/* Summary bar */}
      <div className="mb-8 glass rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center gap-5">
        <div className="flex-1">
          <div className="flex justify-between text-xs text-slate-400 mb-1.5">
            <span>{doneCount} / {allItems.length} steps ready</span>
            <span>{pct}%</span>
          </div>
          <div className="h-2 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-sky-400 transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="text-xs text-slate-500 mt-1.5">
            {pct === 100 ? "All clear. See you in Japan." : `${daysOut} day${daysOut === 1 ? "" : "s"} until wheels up.`}
          </p>
        </div>
        <div className="flex items-center gap-3 text-sm text-slate-300 shrink-0">
          <Plane size={18} className="text-sky-400" />
          <div>
            <p className="font-bold text-white">DL 2538 RDU → MSP · DL 121 MSP → HND</p>
            <p className="text-xs text-slate-400">Departs 06:00 · conf <span className="font-mono text-sky-300">HLL6GI</span></p>
          </div>
        </div>
      </div>

      {/* Meetup card */}
      <div className="mb-8 glass rounded-2xl p-5 border border-amber-500/20 flex items-start gap-3">
        <MapPin size={18} className="text-amber-400 mt-0.5 shrink-0" />
        <div>
          <p className="font-bold text-amber-300 text-sm">Group Meetup Point</p>
          <p className="text-sm text-slate-300 mt-0.5">
            RDU Terminal 2 — Delta check-in counter · <span className="font-bold text-white">04:30 sharp</span>
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Late = not our problem. Share your rideshare ETA in the group chat before you leave home.
          </p>
        </div>
      </div>

      {/* Checklist sections */}
      <div className="space-y-6">
        {SECTIONS.map((section) => {
          const secDone = section.items.filter((i) => checked[i.id]).length;
          const secPct = Math.round((secDone / section.items.length) * 100);
          return (
            <div key={section.id} className="glass rounded-2xl p-5 sm:p-6">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2.5">
                  <span className="text-xl">{section.emoji}</span>
                  <h3 className="font-bold text-base sm:text-lg">{section.title}</h3>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <Clock size={11} className="text-slate-500" />
                  <span>{section.when}</span>
                  <span className="text-slate-600">·</span>
                  <span className={secPct === 100 ? "text-emerald-400 font-bold" : ""}>
                    {secDone}/{section.items.length}
                  </span>
                </div>
              </div>
              <div className="h-0.5 rounded-full bg-white/5 overflow-hidden mb-4">
                <div
                  className="h-full rounded-full bg-emerald-500/60 transition-all duration-300"
                  style={{ width: `${secPct}%` }}
                />
              </div>
              <ul className="space-y-1.5">
                {section.items.map((item) => {
                  const done = !!checked[item.id];
                  return (
                    <li key={item.id}>
                      <button
                        onClick={() => toggle(item.id)}
                        className="w-full flex items-start gap-3 rounded-lg px-2 py-1.5 text-left hover:bg-white/[0.04] transition-colors group"
                      >
                        {done ? (
                          <CheckCircle2 size={18} className="text-emerald-400 mt-0.5 shrink-0" />
                        ) : (
                          <Circle size={18} className="text-slate-600 mt-0.5 shrink-0 group-hover:text-slate-400 transition-colors" />
                        )}
                        <span className={`text-sm leading-relaxed ${done ? "line-through text-slate-500" : "text-slate-200"}`}>
                          {item.text}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>
    </section>
  );
}
