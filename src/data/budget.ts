export type BudgetItem = {
  id: string;
  label: string;
  perPersonUSD: number; // editable baseline
  note: string;
  emoji: string;
};

// Baseline per-person estimates in USD (¥160 = $1, June 2026 rate)
export const BUDGET_ITEMS: BudgetItem[] = [
  { id: "flight", label: "Round-trip flight", perPersonUSD: 1300, note: "US → Tokyo, December holiday pricing; book early to beat this", emoji: "✈️" },
  { id: "stays", label: "Airbnbs — 14 nights, 3 whole houses", perPersonUSD: 342, note: "Budget Lock combo from the Stay tab: 2+ baths everywhere, under the $360/guy cap", emoji: "🏠" },
  { id: "onsen", label: "Onsen & sento days", perPersonUSD: 22, note: "Funaoka electric bath (Kyoto) + Thermae-Yu Shinjuku + an Enoshima bay soak — all pay-at-door", emoji: "♨️" },
  { id: "trains", label: "Trains & transit", perPersonUSD: 470, note: "Point-to-point, NO rail pass: Tokyo→Kyoto→Osaka + Hiroshima & Himeji/Kobe shinkansen on SmartEX, plus Suica metro/bus (~$470 ≈ ¥75,000). The Kamakura day is a few Suica taps", emoji: "🚄" },
  { id: "food", label: "Food — 16 days", perPersonUSD: 640, note: "~$40/day: konbini breakfast, casual lunch, one nicer dinner; splurge meals included", emoji: "🍜" },
  { id: "attractions", label: "Attractions & tickets", perPersonUSD: 280, note: "USJ + Express (~$130), teamLab ($25), Shibuya Sky ($23), temples, towers, museums", emoji: "🎟️" },
  { id: "shopping", label: "Shopping & souvenirs", perPersonUSD: 300, note: "Don Quijote runs, Pokémon Center, omiyage — adjust to your weakness level", emoji: "🛍️" },
  { id: "misc", label: "eSIM, insurance, luggage shipping", perPersonUSD: 90, note: "Ubigi eSIM, travel insurance, Yamato takkyubin bag transfers", emoji: "📱" },
];
