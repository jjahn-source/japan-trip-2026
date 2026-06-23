import { useState, useEffect, useRef } from "react";
import { Search, ExternalLink, MapPin, Clock, Loader2 } from "lucide-react";
import { useGurunavi, GURUNAVI_AREAS } from "../hooks/useGurunavi";
import { SectionHeading } from "./SectionHeading";

function RestaurantCard({ r }: { r: ReturnType<typeof useGurunavi>["results"][number] }) {
  return (
    <div className="glass rounded-2xl overflow-hidden flex flex-col">
      {r.imageUrl && (
        <div className="h-36 overflow-hidden shrink-0">
          <img
            src={r.imageUrl}
            alt={r.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
      )}
      <div className="p-4 flex flex-col gap-1.5 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h4 className="font-bold text-sm leading-snug truncate">{r.name}</h4>
            {r.nameKana && (
              <p className="text-[0.65rem] text-slate-500 font-[Noto_Serif_JP] truncate">{r.nameKana}</p>
            )}
          </div>
          <a
            href={r.url}
            target="_blank"
            rel="noreferrer"
            className="shrink-0 mt-0.5 text-accent-400 hover:text-accent-300 transition-colors"
            aria-label="Open on Gurunavi"
          >
            <ExternalLink size={13} />
          </a>
        </div>

        <p className="text-[0.7rem] font-semibold text-amber-300/80 bg-amber-500/10 border border-amber-500/15 rounded px-1.5 py-0.5 self-start">
          {r.category}
        </p>

        {r.pr && (
          <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">{r.pr}</p>
        )}

        <div className="mt-auto pt-2 space-y-1">
          {r.address && (
            <p className="flex items-start gap-1 text-[0.65rem] text-slate-500">
              <MapPin size={10} className="shrink-0 mt-0.5" />
              <span className="line-clamp-1">{r.address}</span>
            </p>
          )}
          {r.opentime && (
            <p className="flex items-start gap-1 text-[0.65rem] text-slate-500">
              <Clock size={10} className="shrink-0 mt-0.5" />
              <span className="line-clamp-1">{r.opentime}</span>
            </p>
          )}
          {(r.budgetLunch || r.budgetDinner) && (
            <p className="text-[0.65rem] text-emerald-400/80">
              {[r.budgetLunch && `Lunch ¥${r.budgetLunch}`, r.budgetDinner && `Dinner ¥${r.budgetDinner}`]
                .filter(Boolean)
                .join(" · ")}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function GurunaviPanel({ areaCode, keyword }: { areaCode: string; keyword: string }) {
  const { results, status } = useGurunavi(areaCode, keyword);

  if (status === "no-key") {
    return (
      <div className="rounded-xl bg-white/[0.03] border border-white/10 px-4 py-6 text-center text-sm text-slate-500">
        Add <code className="text-xs text-accent-300 bg-accent-500/10 rounded px-1">VITE_GURUNAVI_KEY</code> to your{" "}
        <code className="text-xs text-slate-400">.env.local</code> to enable live restaurant search.
      </div>
    );
  }

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center gap-2 py-12 text-slate-500 text-sm">
        <Loader2 size={16} className="animate-spin" />
        Searching Gurunavi…
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-4 text-sm text-red-300">
        Gurunavi search failed — check your API key or try again.
      </div>
    );
  }

  if (status === "ok" && results.length === 0) {
    return (
      <p className="text-sm text-slate-500 py-8 text-center">No results found. Try a different keyword.</p>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {results.map((r) => (
        <RestaurantCard key={r.id} r={r} />
      ))}
    </div>
  );
}

export function GurunaviSpots() {
  const [areaIdx, setAreaIdx] = useState(0);
  const [inputValue, setInputValue] = useState("");
  const [keyword, setKeyword] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const area = GURUNAVI_AREAS[areaIdx];

  function handleInput(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setInputValue(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setKeyword(val.trim()), 500);
  }

  useEffect(() => {
    // Reset keyword when switching cities so the search is city-contextual
    setInputValue("");
    setKeyword("");
  }, [areaIdx]);

  return (
    <section className="section-pad py-12">
      <SectionHeading
        kicker="Live from Gurunavi"
        title="Restaurant Search"
        sub="Japan's largest restaurant database — 600k+ listings, live hours and budget data."
      />

      {/* City tabs */}
      <div className="flex flex-wrap gap-2 mb-5">
        {GURUNAVI_AREAS.map((a, i) => (
          <button
            key={a.areaCode}
            type="button"
            onClick={() => setAreaIdx(i)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${
              i === areaIdx
                ? "bg-amber-500/15 border-amber-500/30 text-amber-300"
                : "bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 hover:text-slate-200"
            }`}
          >
            {a.emoji} {a.label}
          </button>
        ))}
      </div>

      {/* Keyword search */}
      <div className="relative mb-6 max-w-sm">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
        <input
          type="text"
          value={inputValue}
          onChange={handleInput}
          placeholder={`Search ${area.label} restaurants…`}
          className="w-full pl-9 pr-3 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-amber-500/40 focus:bg-white/8 transition-colors"
        />
      </div>

      <GurunaviPanel areaCode={area.areaCode} keyword={keyword} />
    </section>
  );
}
