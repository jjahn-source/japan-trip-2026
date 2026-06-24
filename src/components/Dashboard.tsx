import { ArrowRight, AlertTriangle, PartyPopper, AlertOctagon, Utensils } from "lucide-react";
import { useState, useEffect } from "react";
import { DAYS } from "../data/itinerary";
import { BOOKINGS } from "../data/bookings";
import { useBookingsSync } from "../hooks/useBookingsSync";
import { useCrewSync } from "../hooks/useCrewSync";
import { useCrewChat } from "../hooks/useCrewChat";
import { useJMAAlerts } from "../hooks/useJMAAlerts";
import { useDiningAlerts } from "../hooks/useDiningAlerts";
import { CREW } from "../hooks/useIdentity";
import { FIREBASE_ENABLED } from "../lib/firebase";
import { QuickPoll } from "./QuickPoll";
import { WeatherBadge } from "./WeatherBadge";
import { FlightIntelPanel } from "./FlightIntelPanel";
import { TravelIntelPanel } from "./TravelIntelPanel";
import { CrewBriefingPanel } from "./CrewBriefingPanel";
import { scrollToAnchor } from "../utils/nav";

function todayISO(): string {
  return new Date().toLocaleDateString("en-CA");
}

function daysBetween(aISO: string, bISO: string): number {
  const a = new Date(`${aISO}T00:00:00`).getTime();
  const b = new Date(`${bISO}T00:00:00`).getTime();
  return Math.round((b - a) / 86_400_000);
}

function fmtDeadline(isoDate: string): string {
  return new Date(isoDate + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function openDay(i: number) {
  window.dispatchEvent(new CustomEvent("trip:open-day", { detail: i }));
  scrollToAnchor(`day-${i}`);
}

function timeAgoShort(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  const d = Math.floor(diff / 86400);
  if (d < 7) return `${d}d`;
  return new Date(iso).toLocaleDateString("en-US", { weekday: "short" });
}

function FeedStatusFooter() {
  const [stamps, setStamps] = useState<Record<string, string | null>>({});

  useEffect(() => {
    const feeds = [
      { key: "Flights", url: `${import.meta.env.BASE_URL}flights.json` },
      { key: "Reddit", url: `${import.meta.env.BASE_URL}reddit-alerts.json` },
      { key: "Weather", url: `${import.meta.env.BASE_URL}weather.json` },
      { key: "Intel", url: `${import.meta.env.BASE_URL}travel-intel.json` },
      { key: "Briefing", url: `${import.meta.env.BASE_URL}crew-briefing.json` },
    ];

    Promise.allSettled(
      feeds.map(async (f) => {
        try {
          const r = await fetch(f.url);
          if (!r.ok) return { key: f.key, ts: null };
          const j = await r.json();
          return { key: f.key, ts: j.fetchedAt ?? j.generatedAt ?? null };
        } catch {
          return { key: f.key, ts: null };
        }
      }),
    ).then((results) => {
      const s: Record<string, string | null> = {};
      for (const r of results) {
        if (r.status === "fulfilled" && r.value) {
          s[r.value.key] = r.value.ts;
        }
      }
      setStamps(s);
    });
  }, []);

  const entries = Object.entries(stamps).filter(([, ts]) => ts);
  if (entries.length === 0) return null;

  return (
    <p className="text-[0.55rem] text-slate-600 text-center pt-1">
      {entries.map(([key, ts], i) => (
        <span key={key}>
          {i > 0 && " · "}
          {key} {timeAgoShort(ts!)}
        </span>
      ))}
    </p>
  );
}

function PreTripDashboard() {
  const today = todayISO();
  const d0 = DAYS[0];
  const until = Math.max(0, daysBetween(today, d0.date));
  const { isDone } = useBookingsSync();
  const { crew } = useCrewSync();
  const { alerts: jmaAlerts } = useJMAAlerts();
  const { alerts: diningAlerts } = useDiningAlerts();

  const pendingBookings = BOOKINGS.filter((b) => !isDone(b.id))
    .sort((a, b) => a.deadline.localeCompare(b.deadline))
    .slice(0, 5);

  const onFlight = CREW.filter((n) => crew[n]?.flightBooked).length;
  const passports = CREW.filter((n) => crew[n]?.passportValid).length;

  return (
    <div className="section-pad -mt-8 space-y-3 pb-2">
      {/* Countdown */}
      <div className="glass rounded-2xl border border-accent-500/25 bg-accent-500/5 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-[0.62rem] font-bold uppercase tracking-[0.2em] text-accent-300">
            {until === 0 ? "Wheels up today" : `${until} day${until === 1 ? "" : "s"} until wheels up`}
          </p>
          <h2 className="text-lg sm:text-2xl font-black mt-0.5 truncate">First up: {d0.emoji} {d0.title}</h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-0.5">Dec 14–29, 2026 · Tokyo → Kyoto → Osaka · the Crew of 8</p>
        </div>
        <button
          type="button"
          onClick={() => openDay(0)}
          className="shrink-0 inline-flex items-center gap-1.5 rounded-full bg-accent-500 hover:bg-accent-400 transition-colors px-5 py-2.5 font-bold text-white text-sm"
        >
          Preview Day 1 <ArrowRight size={15} />
        </button>
      </div>

      {/* Compact crew chips */}
      {FIREBASE_ENABLED && (
        <div className="glass rounded-2xl border border-white/10 p-4">
          <p className="text-[0.62rem] font-bold uppercase tracking-wider text-slate-500 mb-3">
            Crew ready · {onFlight}/8 flights · {passports}/8 passports
          </p>
          <div className="flex flex-wrap gap-2">
            {CREW.map((name) => {
              const entry = crew[name] ?? { flightBooked: false, passportValid: false };
              const bothDone = entry.flightBooked && entry.passportValid;
              const noneDone = !entry.flightBooked && !entry.passportValid;
              return (
                <div
                  key={name}
                  title={`${name}: flight ${entry.flightBooked ? "✓" : "✗"} · passport ${entry.passportValid ? "✓" : "✗"}`}
                  className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold border ${
                    bothDone
                      ? "bg-emerald-500/15 text-emerald-200 border-emerald-500/25"
                      : noneDone
                      ? "bg-white/5 text-slate-500 border-white/10"
                      : "bg-amber-500/10 text-amber-200 border-amber-500/20"
                  }`}
                >
                  {name}
                  <span className="text-[0.55rem] ml-0.5">
                    {entry.flightBooked ? "✈" : ""}
                    {entry.passportValid ? "🛂" : ""}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Urgent actions */}
      {pendingBookings.length > 0 && (
        <div className="glass rounded-2xl border border-amber-500/20 p-4">
          <p className="text-[0.62rem] font-bold uppercase tracking-wider text-amber-400 mb-3 flex items-center gap-1.5">
            <AlertTriangle size={11} /> Action needed · {pendingBookings.length} pending
          </p>
          <div className="space-y-2.5">
            {pendingBookings.map((b) => {
              const daysLeft = daysBetween(today, b.deadline);
              return (
                <div key={b.id} className="flex items-start gap-2.5">
                  <span
                    className={`mt-0.5 shrink-0 text-[0.6rem] font-bold px-1.5 py-0.5 rounded-full whitespace-nowrap ${
                      b.priority === "critical"
                        ? "bg-accent-500/20 text-accent-300"
                        : b.priority === "high"
                        ? "bg-amber-500/20 text-amber-300"
                        : "bg-slate-500/20 text-slate-400"
                    }`}
                  >
                    {daysLeft <= 0 ? "NOW" : daysLeft <= 7 ? `${daysLeft}d` : fmtDeadline(b.deadline)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-slate-200 leading-snug">{b.what}</p>
                    {b.url && (
                      <a href={b.url} target="_blank" rel="noreferrer" className="text-[0.6rem] text-sky-400 hover:text-sky-300">
                        Book ↗
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Travel Intel + AI Briefing */}
      {diningAlerts.length > 0 && (
        <div className="bg-emerald-500/20 border border-emerald-500/50 rounded-2xl p-4 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="animate-pulse bg-emerald-500 rounded-full p-1 text-black">
              <Utensils size={16} />
            </div>
            <h3 className="text-emerald-100 font-bold text-sm">Dining Cancellation Found!</h3>
          </div>
          {diningAlerts.map((alert, idx) => (
            <div key={idx} className="bg-black/40 rounded-lg p-3 mt-2 flex justify-between items-center">
              <div>
                <p className="font-bold text-white text-sm">{alert.restaurant}</p>
                <p className="text-emerald-300 text-xs mt-1">Available: {alert.slots.join(", ")}</p>
              </div>
              <a href={alert.url} target="_blank" rel="noopener noreferrer" className="bg-emerald-500 hover:bg-emerald-400 text-black px-3 py-1.5 rounded font-bold text-xs transition-colors">
                Book Now
              </a>
            </div>
          ))}
        </div>
      )}
      {jmaAlerts.length > 0 && (
        <div className="bg-orange-500/20 border border-orange-500/50 rounded-2xl p-4 mb-4 flex items-start gap-3">
          <AlertOctagon className="text-orange-400 shrink-0 mt-0.5" size={20} />
          <div>
            <h3 className="text-orange-100 font-bold text-sm mb-1">JMA Official Weather Advisory</h3>
            <ul className="text-orange-200/80 text-xs list-disc pl-4">
              {jmaAlerts.map((a, i) => (
                <li key={i}>{a.name} active for {a.area}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
      <FlightIntelPanel />
      <TravelIntelPanel />
      <CrewBriefingPanel />

      {/* Quick Poll */}
      <QuickPoll />

      {/* Feed status */}
      <FeedStatusFooter />
    </div>
  );
}

function InTripDashboard({ idx }: { idx: number }) {
  const d = DAYS[idx];
  const { messages } = useCrewChat();
  const lastMsgs = messages.slice(-2);

  const now = new Date();
  const nowMins = now.getHours() * 60 + now.getMinutes();
  const timedActs = d.activities.filter((a) => /^\d{2}:\d{2}$/.test(a.time));

  const currentAct = timedActs.reduce<(typeof timedActs)[0] | null>((acc, a) => {
    const [h, m] = a.time.split(":").map(Number);
    return h * 60 + m <= nowMins ? a : acc;
  }, null);

  const nextAct = timedActs.find((a) => {
    const [h, m] = a.time.split(":").map(Number);
    return h * 60 + m > nowMins;
  });

  return (
    <div className="section-pad -mt-8 space-y-3 pb-2">
      {/* Today card */}
      <div className="glass rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4 sm:p-5">
        <p className="text-[0.62rem] font-bold uppercase tracking-[0.2em] text-emerald-300">
          Today · Day {idx + 1} of {DAYS.length} · {d.dow} Dec {d.date.slice(8)}
        </p>
        <h2 className="text-xl font-black mt-0.5 mb-2">{d.emoji} {d.title}</h2>
        <WeatherBadge city={d.city} dateISO={d.date} wx={d.wx} />

        {(currentAct || nextAct) && (
          <div className="flex gap-2 mt-2">
            {currentAct && (
              <div className="flex-1 rounded-xl bg-white/5 border border-white/10 p-2.5">
                <p className="text-[0.55rem] font-bold uppercase tracking-wider text-emerald-400 mb-0.5">Now</p>
                <p className="text-xs font-semibold text-slate-100 leading-snug">{currentAct.title}</p>
                <p className="text-[0.6rem] text-accent-300 font-bold tabular-nums mt-0.5">{currentAct.time}</p>
              </div>
            )}
            {nextAct && (
              <div className="flex-1 rounded-xl bg-white/5 border border-white/10 p-2.5 opacity-60">
                <p className="text-[0.55rem] font-bold uppercase tracking-wider text-slate-500 mb-0.5">Next</p>
                <p className="text-xs font-semibold text-slate-300 leading-snug">{nextAct.title}</p>
                <p className="text-[0.6rem] text-slate-500 font-bold tabular-nums mt-0.5">{nextAct.time}</p>
              </div>
            )}
          </div>
        )}

        <button
          type="button"
          onClick={() => openDay(idx)}
          className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-emerald-500 hover:bg-emerald-400 transition-colors px-4 py-2 font-bold text-white text-xs"
        >
          Full day plan <ArrowRight size={13} />
        </button>
      </div>

      {/* Chat preview */}
      {FIREBASE_ENABLED && lastMsgs.length > 0 && (
        <div className="glass rounded-2xl border border-white/10 p-4">
          <p className="text-[0.62rem] font-bold uppercase tracking-wider text-slate-500 mb-2.5">Crew chat</p>
          <div className="space-y-1.5">
            {lastMsgs.map((msg) => (
              <div key={msg.id} className="flex gap-2 items-baseline">
                <span className="text-[0.65rem] font-bold text-accent-300 shrink-0">{msg.author}</span>
                <span className="text-xs text-slate-300 leading-snug truncate">{msg.text}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Poll */}
      <QuickPoll />
    </div>
  );
}

function PostTripDashboard() {
  return (
    <div className="section-pad -mt-8 pb-2">
      <div className="glass rounded-2xl border border-amber-500/25 bg-amber-500/5 p-4 sm:p-6 flex items-center gap-4">
        <div className="flex-1">
          <p className="text-[0.62rem] font-bold uppercase tracking-[0.2em] text-amber-300 flex items-center gap-1.5">
            <PartyPopper size={12} /> Okaeri
          </p>
          <h2 className="text-lg sm:text-2xl font-black mt-0.5">16 days, 3 bases, ∞ stories — that's a wrap.</h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
            The 2027 planning thread opens at cruising altitude. Kaishun picks the destination.
          </p>
        </div>
      </div>
    </div>
  );
}

export function Dashboard() {
  const today = todayISO();
  const last = DAYS[DAYS.length - 1].date;
  const idx = DAYS.findIndex((d) => d.date === today);

  if (idx >= 0) return <InTripDashboard idx={idx} />;
  if (today > last) return <PostTripDashboard />;
  return <PreTripDashboard />;
}
