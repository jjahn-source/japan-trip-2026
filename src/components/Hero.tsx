import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { TRIP_START, CREW } from "../data/itinerary";

const ROUTE = ["Tokyo ×6", "Kyoto ×3", "Osaka ×5"];
const SPOKES = "+ day raids: Kamakura · Enoshima · Nara · Uji · Hiroshima · Miyajima · Himeji · Kobe";

function useCountdown(target: string) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const diff = Math.max(0, new Date(target).getTime() - now);
  return {
    days: Math.floor(diff / 86_400_000),
    hours: Math.floor(diff / 3_600_000) % 24,
    mins: Math.floor(diff / 60_000) % 60,
    secs: Math.floor(diff / 1_000) % 60,
  };
}

const CREW_MANIFEST = [
  { name: "JJ",      role: "The Architect",         threat: "Built this app. Will still miss a train." },
  { name: "Ethan",   role: "The Wild Card",          threat: "The trip ends differently because of him." },
  { name: "Steven",  role: "Photo Director",         threat: "Has opinions about the Fuji composition." },
  { name: "Alex",    role: "The Logistics Anchor",   threat: "Splitwise every night. We don't deserve him." },
  { name: "Charlie", role: "The Iron Stomach",       threat: "Eats the mystery skewer first. Every time." },
  { name: "Kaishun", role: "The Restaurant Oracle",  threat: "Picks 2027 destination. Power unchecked." },
  { name: "Daniel",  role: "The Deer Magnet",        threat: "Nara has been notified. They're ready." },
  { name: "Junha",   role: "The Culture Vulture",    threat: "Shrine knowledge AND karaoke setlist. Terrifying." },
];

export function Hero() {
  const { days, hours, mins, secs } = useCountdown(TRIP_START);
  const units = [
    { v: days, l: "days" },
    { v: hours, l: "hrs" },
    { v: mins, l: "min" },
    { v: secs, l: "sec" },
  ];

  return (
    <section id="top" className="relative min-h-screen flex flex-col items-center justify-center text-center px-4 pt-24 pb-16 overflow-hidden">
      <div
        aria-hidden
        className="absolute inset-0 -z-10 opacity-[0.06] font-[Noto_Serif_JP] text-[22rem] leading-none select-none flex items-center justify-center"
      >
        日本
      </div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="text-rose-400 tracking-[0.4em] uppercase text-sm font-semibold mb-4"
      >
        Dec 14 – 29, 2026 · RDU → HND · The Crew of Eight
      </motion.p>

      <motion.h1
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.1 }}
        className="text-5xl sm:text-7xl md:text-8xl font-black tracking-tighter"
      >
        JAPAN,
        <br />
        <span className="bg-gradient-to-r from-rose-400 via-fuchsia-400 to-indigo-400 bg-clip-text text-transparent">
          ALL OF IT.
        </span>
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.25 }}
        className="mt-6 max-w-2xl text-slate-400 text-lg"
      >
        14 nights on the ground. 6 cities. Winter illuminations, bullet trains, onsen
        nights, nomihodai, and approximately one million bowls of ramen. This is the
        master plan.
      </motion.p>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.35 }}
        className="mt-6 flex flex-wrap items-center justify-center gap-2"
      >
        {CREW.map((name) => (
          <span
            key={name}
            className="glass rounded-full px-3.5 py-1 text-xs font-bold text-slate-200"
          >
            {name}
          </span>
        ))}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.5 }}
        className="mt-6 w-full max-w-3xl grid grid-cols-2 sm:grid-cols-4 gap-2 text-left"
      >
        {CREW_MANIFEST.map((m) => (
          <div key={m.name} className="glass rounded-xl px-3 py-2.5">
            <p className="text-xs font-black text-slate-100">{m.name}</p>
            <p className="text-[0.65rem] font-bold text-rose-400 mt-0.5">{m.role}</p>
            <p className="text-[0.6rem] text-slate-500 mt-0.5 leading-relaxed">{m.threat}</p>
          </div>
        ))}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, delay: 0.4 }}
        className="mt-10 flex gap-3 sm:gap-5"
      >
        {units.map((u) => (
          <div key={u.l} className="glass rounded-2xl px-4 sm:px-7 py-4 min-w-[5rem] sm:min-w-[6.5rem]">
            <div className="text-3xl sm:text-5xl font-extrabold tabular-nums">{u.v}</div>
            <div className="text-[0.65rem] sm:text-xs uppercase tracking-widest text-slate-400 mt-1">{u.l}</div>
          </div>
        ))}
      </motion.div>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-3 text-xs uppercase tracking-[0.25em] text-slate-500 font-semibold"
      >
        until DL 2538 departs RDU
      </motion.p>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 0.6 }}
        className="mt-12 flex flex-wrap items-center justify-center gap-2 text-sm font-semibold"
      >
        {ROUTE.map((c, i) => (
          <span key={i} className="flex items-center gap-2">
            <span className="glass rounded-full px-4 py-1.5">{c}</span>
            {i < ROUTE.length - 1 && <span className="text-rose-400">→</span>}
          </span>
        ))}
        <span className="w-full text-center text-xs text-slate-400 font-semibold mt-1">{SPOKES}</span>
      </motion.div>

      <motion.a
        href="#itinerary"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="mt-12 inline-flex items-center gap-2 rounded-full bg-rose-500 hover:bg-rose-400 transition-colors px-8 py-3.5 font-bold text-white shadow-lg shadow-rose-500/30"
      >
        See the plan ↓
      </motion.a>
    </section>
  );
}
