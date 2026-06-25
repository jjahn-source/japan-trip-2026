import { useEffect, useRef, useState } from "react";
import { RefreshCw } from "lucide-react";
import { SectionHeading } from "./SectionHeading";
import { useTravelIntel } from "../hooks/useTravelIntel";

const FALLBACK_RATE = 160;

const PRICE_REF = [
  { label: "Konbini onigiri", jpy: 140 },
  { label: "Konbini bento", jpy: 550 },
  { label: "Karaage-kun (Lawson)", jpy: 250 },
  { label: "Canned Strong Zero", jpy: 150 },
  { label: "Konbini beer (350ml)", jpy: 220 },
  { label: "Vending machine drink", jpy: 160 },
  { label: "Metro / subway ride", jpy: 200 },
  { label: "Izakaya draft beer", jpy: 500 },
  { label: "Ramen bowl (local)", jpy: 1_200 },
  { label: "Ramen (upscale)", jpy: 1_800 },
  { label: "Taxi flagfall", jpy: 730 },
  { label: "Salonpas patch pack", jpy: 330 },
  { label: "Biore UV sunscreen", jpy: 990 },
  { label: "Konbini KitKat bag", jpy: 380 },
  { label: "Shinkansen Tokyo→Kyoto", jpy: 14_720 },
  { label: "Yamato bag delivery", jpy: 2_600 },
  { label: "Karaoke (per person/hour)", jpy: 900 },
  { label: "Onsen entry", jpy: 800 },
  { label: "TeamLab Planets ticket", jpy: 3_200 },
  { label: "USJ 1-day ticket", jpy: 10_400 },
];

export function CurrencyCalc() {
  const [rate, setRate] = useState(FALLBACK_RATE);
  const [rateStatus, setRateStatus] = useState<"loading" | "live" | "fallback">("loading");
  const [jpy, setJpy] = useState("");
  const [usd, setUsd] = useState("");
  const lastEdited = useRef<"jpy" | "usd">("jpy");

  // The live USD→JPY rate comes from the static travel-intel feed (fetched
  // server-side in scripts/refresh-travel-intel.mjs). Calling the FX API
  // directly from the browser is blocked by CORS.
  const { intel, loading: intelLoading } = useTravelIntel();

  useEffect(() => {
    const live = intel.exchangeRate?.usd_jpy;
    if (live && live > 0) {
      setRate(Math.round(live));
      setRateStatus("live");
    } else if (!intelLoading) {
      setRateStatus("fallback");
    }
  }, [intel.exchangeRate, intelLoading]);

  useEffect(() => {
    if (lastEdited.current === "jpy" && jpy) {
      const n = parseFloat(jpy);
      if (!isNaN(n)) setUsd((n / rate).toFixed(2));
    } else if (usd) {
      const n = parseFloat(usd);
      if (!isNaN(n)) setJpy(Math.round(n * rate).toString());
    }
    // re-sync inputs when the live rate arrives or rate is reset; jpy/usd are
    // intentionally read-not-tracked to avoid clobbering active typing.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rate]);

  const handleJpy = (val: string) => {
    lastEdited.current = "jpy";
    setJpy(val);
    const n = parseFloat(val);
    setUsd(isNaN(n) ? "" : (n / rate).toFixed(2));
  };

  const handleUsd = (val: string) => {
    lastEdited.current = "usd";
    setUsd(val);
    const n = parseFloat(val);
    setJpy(isNaN(n) ? "" : Math.round(n * rate).toString());
  };

  const resetRate = () => {
    setRate(FALLBACK_RATE);
    setRateStatus("fallback");
    if (lastEdited.current === "jpy" && jpy) {
      const n = parseFloat(jpy);
      setUsd(isNaN(n) ? "" : (n / FALLBACK_RATE).toFixed(2));
    } else if (usd) {
      const n = parseFloat(usd);
      setJpy(isNaN(n) ? "" : Math.round(n * FALLBACK_RATE).toString());
    }
  };

  return (
    <section className="section-pad py-24">
      <SectionHeading
        kicker="Quick Math"
        title="Yen Calculator"
        sub="Type any amount in either field — converts instantly."
      />

      <div className="glass rounded-2xl p-6 mb-6 max-w-lg mx-auto">
        {/* Rate badge */}
        <div className="flex items-center justify-between mb-5 text-xs text-slate-500">
          <span>
            {rateStatus === "loading" && "Fetching live rate…"}
            {rateStatus === "live" && (
              <span className="text-emerald-400">
                ● Live rate · ¥{rate} = $1
              </span>
            )}
            {rateStatus === "fallback" && `Using ¥${rate} = $1 (app default)`}
          </span>
          {rateStatus !== "loading" && rate !== FALLBACK_RATE && (
            <button
              type="button"
              onClick={resetRate}
              className="flex items-center gap-1 text-slate-500 hover:text-white transition-colors"
              title={`Reset to ¥${FALLBACK_RATE}`}
            >
              <RefreshCw size={11} /> ¥{FALLBACK_RATE}
            </button>
          )}
        </div>

        {/* Inputs */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="flex-1 w-full">
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">
              Japanese Yen ¥
            </label>
            <input
              type="number"
              inputMode="decimal"
              value={jpy}
              onChange={(e) => handleJpy(e.target.value)}
              placeholder="0"
              className="w-full bg-white/10 border border-white/15 rounded-xl px-4 py-3 text-xl font-bold text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-accent-400/60 focus:bg-white/[0.12] transition-colors"
            />
          </div>

          <div className="text-slate-500 text-lg font-bold sm:mt-5 select-none">=</div>

          <div className="flex-1 w-full">
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">
              US Dollars $
            </label>
            <input
              type="number"
              inputMode="decimal"
              value={usd}
              onChange={(e) => handleUsd(e.target.value)}
              placeholder="0.00"
              className="w-full bg-white/10 border border-white/15 rounded-xl px-4 py-3 text-xl font-bold text-emerald-300 placeholder:text-slate-600 focus:outline-none focus:border-emerald-400/60 focus:bg-white/[0.12] transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Price reference table */}
      <div className="glass rounded-2xl p-5 max-w-lg mx-auto">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
          Price Reference
        </h3>
        <div className="divide-y divide-white/5">
          {PRICE_REF.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => handleJpy(item.jpy.toString())}
              className="w-full flex items-center justify-between py-2 text-left hover:bg-white/5 rounded px-1 transition-colors group"
              title="Click to convert"
            >
              <span className="text-sm text-slate-300 group-hover:text-white transition-colors">
                {item.label}
              </span>
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-xs text-slate-500">¥{item.jpy.toLocaleString()}</span>
                <span className="text-xs font-semibold text-emerald-400 w-14 text-right">
                  ${(item.jpy / rate).toFixed(2)}
                </span>
              </div>
            </button>
          ))}
        </div>
        <p className="text-[0.6rem] text-slate-600 mt-3 text-center">
          Tap any row to load into the calculator
        </p>
      </div>
    </section>
  );
}
