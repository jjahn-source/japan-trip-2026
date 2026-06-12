import { motion } from "motion/react";
import { Plane, AlertTriangle } from "lucide-react";
import { FLIGHTS, CONFIRMATION, AIRLINE, FARE_WARNINGS } from "../data/flight";
import { SectionHeading } from "./SectionHeading";

export function FlightCard() {
  return (
    <section id="flights" className="section-pad py-24">
      <SectionHeading
        kicker="Locked In"
        title="The Flights"
        sub={`${AIRLINE} · Confirmation ${CONFIRMATION}`}
      />
      <div className="grid gap-4 lg:grid-cols-2">
        {FLIGHTS.map((bound) => (
          <motion.div
            key={bound.label}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.4 }}
            className="glass rounded-2xl p-5 sm:p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="font-extrabold text-lg flex items-center gap-2">
                <Plane size={18} className="text-rose-400" />
                {bound.label}
              </span>
              <span className="text-xs text-slate-400 font-semibold">
                {bound.duration} · {bound.stop}
              </span>
            </div>
            <div className="space-y-4">
              {bound.legs.map((leg) => (
                <div key={leg.flightNo} className="flex items-center gap-4">
                  <div className="text-center shrink-0 w-16">
                    <p className="text-2xl font-black tabular-nums">{leg.dep.time}</p>
                    <p className="text-xs font-bold text-rose-300">{leg.dep.code}</p>
                    <p className="text-[0.6rem] text-slate-500">{leg.dep.date}</p>
                  </div>
                  <div className="flex-1 relative">
                    <div className="h-px bg-gradient-to-r from-rose-500/60 via-white/20 to-rose-500/60" />
                    <p className="text-center text-[0.65rem] text-slate-400 mt-1.5 font-semibold">
                      {leg.flightNo} · {leg.aircraft}
                    </p>
                  </div>
                  <div className="text-center shrink-0 w-16">
                    <p className="text-2xl font-black tabular-nums">{leg.arr.time}</p>
                    <p className="text-xs font-bold text-rose-300">{leg.arr.code}</p>
                    <p className="text-[0.6rem] text-slate-500">{leg.arr.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
      <div className="mt-4 glass rounded-2xl p-5">
        <p className="font-bold text-amber-300 flex items-center gap-2 text-sm mb-2">
          <AlertTriangle size={15} /> Basic Economy fine print
        </p>
        <ul className="grid sm:grid-cols-2 gap-x-6 gap-y-1.5">
          {FARE_WARNINGS.map((w) => (
            <li key={w} className="text-xs text-slate-400 flex gap-1.5">
              <span className="text-amber-400 shrink-0">·</span> {w}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
