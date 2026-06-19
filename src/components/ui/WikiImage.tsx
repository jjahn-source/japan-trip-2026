import { useEffect, useState } from "react";
import type { Category } from "../../data/attractions";

const CATEGORY_STYLE: Record<Category, { gradient: string; emoji: string }> = {
  "Temple & Shrine":   { gradient: "from-rose-900/60 to-rose-700/30",      emoji: "⛩️" },
  "Museum & Art":      { gradient: "from-violet-900/60 to-violet-700/30",   emoji: "🎨" },
  "Viewpoint":         { gradient: "from-sky-900/60 to-sky-700/30",         emoji: "🏙️" },
  "Park & Nature":     { gradient: "from-emerald-900/60 to-emerald-700/30", emoji: "🌿" },
  "Market & Shopping": { gradient: "from-amber-900/60 to-amber-700/30",     emoji: "🏮" },
  "Entertainment":     { gradient: "from-fuchsia-900/60 to-fuchsia-700/30", emoji: "🎭" },
  "Nightlife":         { gradient: "from-indigo-900/60 to-indigo-700/30",   emoji: "🌙" },
  "Landmark":          { gradient: "from-orange-900/60 to-orange-700/30",   emoji: "🏯" },
};

export function WikiImage({ wiki, category }: { wiki?: string; category: Category }) {
  const [src, setSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState(!!wiki);

  useEffect(() => {
    if (!wiki) { setLoading(false); return; }
    const ac = new AbortController();
    fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(wiki)}`,
      { signal: ac.signal }
    )
      .then((r) => r.json())
      .then((d) => { setSrc(d.thumbnail?.source ?? null); setLoading(false); })
      .catch(() => setLoading(false));
    return () => ac.abort();
  }, [wiki]);

  const { gradient, emoji } = CATEGORY_STYLE[category];

  if (loading) return <div className="w-full aspect-video bg-white/5 animate-pulse" />;

  if (src) {
    return (
      <img
        src={src}
        alt=""
        className="w-full aspect-video object-cover"
        loading="lazy"
      />
    );
  }

  return (
    <div className={`w-full aspect-video bg-gradient-to-br ${gradient} flex items-center justify-center`}>
      <span className="text-4xl opacity-25">{emoji}</span>
    </div>
  );
}
