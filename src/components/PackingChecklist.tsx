import { CheckCircle2, Circle } from "lucide-react";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { SectionHeading } from "./SectionHeading";

type PackingCategory = {
  name: string;
  emoji: string;
  items: string[];
};

const PACKING_ITEMS: PackingCategory[] = [
  {
    name: "Documents",
    emoji: "🛂",
    items: [
      "Passport + photo copies",
      "Travel insurance policy",
      "Flight confirmations",
      "Hotel/Airbnb confirmations",
      "Vaccination records (if needed)",
      "Credit card + 2 backups",
      "Backup cash ($200+)",
    ],
  },
  {
    name: "Clothing (Dec in Japan: 5–10°C)",
    emoji: "🧥",
    items: [
      "Base layers (Heattech)",
      "Long-sleeve shirts (5–6)",
      "Sweater/fleece",
      "Packable down jacket",
      "Jeans/pants (2–3)",
      "Socks WITHOUT holes (12+)",
      "Underwear (8–10 pairs)",
      "Walking shoes (broken-in, slip-on friendly)",
      "Casual shoes (easy on/off)",
      "Hat/gloves",
      "Scarf",
      "One nicer outfit (dinner out)",
    ],
  },
  {
    name: "Toiletries",
    emoji: "🧼",
    items: [
      "Medications (prescription + OTC)",
      "Toothbrush + toothpaste",
      "Deodorant",
      "Sunscreen",
      "Lip balm",
      "Contact lenses + solution (or glasses)",
      "Shampoo (travel size; hotels provide)",
      "Moisturizer",
      "Feminine hygiene (if needed; hard to find in Japan)",
      "Nail clippers",
      "Melatonin (jet lag)",
    ],
  },
  {
    name: "Tech",
    emoji: "📱",
    items: [
      "Phone + charger (USB-C recommended)",
      "Portable battery (10,000mAh+)",
      "Camera (optional)",
      "Adapter: Japan uses Type A (US-style)",
      "Headphones",
      "eSIM or SIM card (pre-order)",
    ],
  },
  {
    name: "Practical",
    emoji: "🎒",
    items: [
      "Daypack (20–30L)",
      "Small umbrella or rain jacket",
      "Compression packing cubes",
      "Ziplock bags (electronics, wet items)",
      "Notebook + pen",
      "Phrasebook or translation app downloaded",
      "Offline maps (Google Maps download)",
      "TSA-approved locks for luggage",
    ],
  },
  {
    name: "Japan-Specific",
    emoji: "🇯🇵",
    items: [
      "Empty suitcase (for souvenirs)",
      "Comfortable slip-on shoes (for temples)",
      "Coin purse (you'll get ¥1, ¥5, ¥10 coins)",
      "Small towel (many onsen provide, but bring backup)",
      "Athletic compression socks (flight)",
    ],
  },
  {
    name: "Optional Luxuries",
    emoji: "✨",
    items: [
      "Moisturizing face masks (dry cabin air)",
      "Earplugs + sleep mask",
      "Neck pillow (14-hour flight)",
      "Extra phone charger (gift for crew if they forget)",
    ],
  },
];

export function PackingChecklist() {
  const [packed, setPacked] = useLocalStorage<Record<string, boolean>>("packing-checklist", {});

  const togglePacked = (item: string) => {
    setPacked({ ...packed, [item]: !packed[item] });
  };

  const allItems = PACKING_ITEMS.flatMap((cat) => cat.items);
  const packedCount = allItems.filter((item) => packed[item]).length;
  const pct = Math.round((packedCount / allItems.length) * 100);

  return (
    <section className="section-pad py-24">
      <SectionHeading
        kicker="Pre-Trip"
        title="Packing Checklist"
        sub={`${packedCount}/${allItems.length} items packed (${pct}%)`}
      />

      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex-1 h-3 rounded-full bg-white/10 overflow-hidden mb-2">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="text-xs text-slate-400">
          {pct === 100 ? "✓ Ready to pack!" : `${100 - pct}% to go`}
        </p>
      </div>

      {/* Categories */}
      <div className="space-y-6">
        {PACKING_ITEMS.map((category) => {
          const catPacked = category.items.filter((item) => packed[item]).length;
          const catPct = Math.round((catPacked / category.items.length) * 100);

          return (
            <div key={category.name} className="glass rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{category.emoji}</span>
                  <h3 className="font-bold text-lg">{category.name}</h3>
                </div>
                <span className="text-xs font-bold text-slate-400">
                  {catPacked}/{category.items.length}
                </span>
              </div>

              <div className="h-1 rounded-full bg-white/10 overflow-hidden mb-4">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all"
                  style={{ width: `${catPct}%` }}
                />
              </div>

              <div className="space-y-2">
                {category.items.map((item) => (
                  <button
                    key={item}
                    onClick={() => togglePacked(item)}
                    className="w-full flex items-start gap-3 p-2 rounded hover:bg-white/5 transition-colors text-left"
                  >
                    {packed[item] ? (
                      <CheckCircle2 size={18} className="text-emerald-400 shrink-0 mt-0.5" />
                    ) : (
                      <Circle size={18} className="text-slate-600 shrink-0 mt-0.5" />
                    )}
                    <span
                      className={`text-sm ${
                        packed[item]
                          ? "line-through text-slate-500"
                          : "text-slate-200"
                      }`}
                    >
                      {item}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Tips */}
      <div className="mt-8 glass rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-6">
        <h3 className="font-bold text-cyan-300 mb-3">Packing strategy:</h3>
        <ul className="space-y-1 text-sm text-slate-300">
          <li>• <strong>Lay it out</strong>: spread everything on the bed before packing</li>
          <li>• <strong>Compression cubes</strong>: roll clothes, use cubes for 40% more space</li>
          <li>• <strong>Shoes at bottom</strong> of suitcase (outside perimeter edges)</li>
          <li>• <strong>Heavier items</strong> closer to wheels (pull handle end)</li>
          <li>• <strong>Socks inside shoes</strong>: saves space + prevents wrinkles</li>
          <li>• <strong>Toiletries in a ziploc</strong>: prevents leaks on clothes</li>
          <li>• <strong>Leave 20% empty</strong> for souvenirs + pickups</li>
        </ul>
      </div>
    </section>
  );
}
