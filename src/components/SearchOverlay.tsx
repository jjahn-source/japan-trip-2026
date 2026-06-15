import { useEffect, useMemo, useRef, useState } from "react";
import { Search, X, CornerDownLeft } from "lucide-react";
import type { View } from "../hooks/useHashView";
import { slugify } from "../utils/nav";
import { ATTRACTIONS } from "../data/attractions";
import { DAY_TRIPS } from "../data/daytrips";
import { NEIGHBORHOODS } from "../data/neighborhoods";
import { NIGHT_SPOTS } from "../data/nightlife";
import { DISH_ENCYCLOPEDIA } from "../data/eat";
import { FOOD } from "../data/food";
import { GUIDE } from "../data/guide";
import { FAQS } from "../data/faq";
import { DAYS } from "../data/itinerary";
import { SHOP } from "../data/shopping";

type Hit = { title: string; sub: string; kind: string; tab: View; text: string; anchor: string };

// Build the flat index once per module load (this whole file is lazy-loaded).
// `anchor` matches an id rendered in the target view → search jumps to the exact
// card (graceful: if the id isn't found, you just land at the top of the tab).
const INDEX: Hit[] = [
  ...ATTRACTIONS.map((a) => ({ title: a.name, sub: `${a.city} · ${a.category}`, kind: "Sight", tab: "explore" as View, anchor: `sight-${a.id}`, text: `${a.name} ${a.jp} ${a.desc} ${a.city} ${a.category}`.toLowerCase() })),
  ...DAY_TRIPS.map((t) => ({ title: t.name, sub: `Day trip · from ${t.base}`, kind: "Day Trip", tab: "explore" as View, anchor: `trip-${t.id}`, text: `${t.name} ${t.jp} ${t.pitch}`.toLowerCase() })),
  ...NEIGHBORHOODS.map((n) => ({ title: n.name, sub: `${n.city} · neighborhood`, kind: "Area", tab: "explore" as View, anchor: `hood-${slugify(n.name)}`, text: `${n.name} ${n.jp} ${n.vibe} ${n.knownFor.join(" ")}`.toLowerCase() })),
  ...NIGHT_SPOTS.map((s) => ({ title: s.name, sub: `${s.city} · ${s.kind}`, kind: "Night", tab: "explore" as View, anchor: `night-${slugify(s.name)}`, text: `${s.name} ${s.jp ?? ""} ${s.area} ${s.why}`.toLowerCase() })),
  ...DISH_ENCYCLOPEDIA.map((d) => ({ title: d.name, sub: "Dish", kind: "Eat", tab: "eat" as View, anchor: `dish-${slugify(d.name)}`, text: `${d.name} ${d.jp} ${d.what}`.toLowerCase() })),
  ...FOOD.flatMap((c) => c.items.map((i) => ({ title: i.dish, sub: `${c.city} · food`, kind: "Eat", tab: "eat" as View, anchor: "", text: `${i.dish} ${i.jp} ${i.where} ${i.why}`.toLowerCase() }))),
  ...GUIDE.flatMap((sec) => sec.articles.map((ar) => ({ title: ar.title, sub: `Guide · ${sec.title}`, kind: "Guide", tab: "guide" as View, anchor: sec.id, text: `${ar.title} ${ar.body.join(" ")}`.toLowerCase() }))),
  ...FAQS.map((f) => ({ title: f.q, sub: "FAQ", kind: "FAQ", tab: "guide" as View, anchor: "", text: `${f.q} ${f.a}`.toLowerCase() })),
  ...DAYS.map((d, i) => ({ title: d.title, sub: `Dec ${d.date.slice(8)} · ${d.city}`, kind: "Day", tab: "plan" as View, anchor: `day-${i}`, text: `${d.title} ${d.city} ${d.activities.map((a) => a.title).join(" ")}`.toLowerCase() })),
  ...SHOP.flatMap((cat) => cat.items.map((item) => ({ title: item.name, sub: `Shop · ${cat.title} · ${item.city}`, kind: "Shop", tab: "explore" as View, anchor: `shop-${cat.id}`, text: `${item.name} ${item.where} ${item.what} ${item.tip ?? ""}`.toLowerCase() }))),
];

const KIND_STYLE: Record<string, string> = {
  Sight: "bg-rose-500/20 text-rose-300",
  "Day Trip": "bg-indigo-500/20 text-indigo-300",
  Area: "bg-emerald-500/20 text-emerald-300",
  Night: "bg-fuchsia-500/20 text-fuchsia-300",
  Eat: "bg-amber-500/20 text-amber-300",
  Guide: "bg-violet-500/20 text-violet-300",
  FAQ: "bg-slate-500/20 text-slate-300",
  Day: "bg-cyan-500/20 text-cyan-300",
  Shop: "bg-amber-500/20 text-amber-300",
};

export function SearchOverlay({ onClose, onNavigate }: { onClose: () => void; onNavigate: (v: View, anchor?: string) => void }) {
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const results = useMemo(() => {
    const terms = q.trim().toLowerCase().split(/\s+/).filter(Boolean);
    if (!terms.length) return [];
    const scored = INDEX
      .filter((h) => terms.every((t) => h.text.includes(t)))
      .map((h) => {
        const tl = h.title.toLowerCase();
        let score = 0;
        if (tl.startsWith(terms[0])) score += 3;
        if (tl.includes(terms[0])) score += 1;
        return { h, score };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 40)
      .map((x) => x.h);
    return scored;
  }, [q]);

  useEffect(() => { setActive(0); }, [q]);

  const go = (h: Hit) => { onNavigate(h.tab, h.anchor); onClose(); };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") { onClose(); return; }
    if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(a + 1, results.length - 1)); }
    if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
    if (e.key === "Enter" && results[active]) { e.preventDefault(); go(results[active]); }
  };

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-start justify-center p-3 sm:p-4 pt-[8vh] sm:pt-[12vh]"
      onClick={onClose}
    >
      <div
        className="glass w-full max-w-xl rounded-2xl overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={onKeyDown}
      >
        <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10">
          <Search size={18} className="text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search ramen, Fuji, tax-free, onsen, Day 5…"
            className="flex-1 bg-transparent outline-none text-base sm:text-sm placeholder:text-slate-600 min-w-0"
          />
          <button type="button" onClick={onClose} className="text-slate-500 hover:text-white shrink-0" aria-label="Close search">
            <X size={18} />
          </button>
        </div>

        <div className="max-h-[55vh] overflow-y-auto">
          {q.trim() && results.length === 0 && (
            <p className="px-4 py-8 text-center text-sm text-slate-500">No matches for "{q}".</p>
          )}
          {!q.trim() && (
            <p className="px-4 py-8 text-center text-sm text-slate-600">
              Search {INDEX.length}+ sights, eats, bars, day trips, guide articles, FAQs and itinerary days.
            </p>
          )}
          {results.map((h, i) => (
            <button
              type="button"
              key={`${h.kind}-${h.title}-${i}`}
              onClick={() => go(h)}
              onMouseEnter={() => setActive(i)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${i === active ? "bg-white/10" : "hover:bg-white/[0.04]"}`}
            >
              <span className={`shrink-0 text-[0.58rem] font-bold uppercase tracking-wide rounded-full px-2 py-0.5 ${KIND_STYLE[h.kind] ?? "bg-white/10 text-slate-300"}`}>
                {h.kind}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-slate-100 truncate">{h.title}</span>
                <span className="block text-xs text-slate-500 truncate">{h.sub}</span>
              </span>
              {i === active && <CornerDownLeft size={13} className="text-slate-500 shrink-0" />}
            </button>
          ))}
        </div>

        <div className="px-4 py-2 border-t border-white/10 flex items-center gap-3 text-[0.65rem] text-slate-600">
          <span><kbd className="font-sans">↑↓</kbd> navigate</span>
          <span><kbd className="font-sans">↵</kbd> open</span>
          <span><kbd className="font-sans">esc</kbd> close</span>
          <span className="ml-auto">{results.length ? `${results.length} result${results.length === 1 ? "" : "s"}` : ""}</span>
        </div>
      </div>
    </div>
  );
}
