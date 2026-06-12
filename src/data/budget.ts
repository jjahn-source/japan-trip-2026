export type BudgetItem = {
  id: string;
  label: string;
  perPersonUSD: number; // editable baseline
  note: string;
  emoji: string;
};

// Baseline per-person estimates in USD (¥150 = $1 assumption)
export const BUDGET_ITEMS: BudgetItem[] = [
  { id: "flight", label: "Round-trip flight", perPersonUSD: 1300, note: "US → Tokyo, December holiday pricing; book early to beat this", emoji: "✈️" },
  { id: "hotels", label: "Hotels — 14 nights", perPersonUSD: 980, note: "~$70/pp/night sharing twins; ryokan night is pricier, business hotels cheaper", emoji: "🏨" },
  { id: "ryokan", label: "Hakone ryokan night (kaiseki + onsen)", perPersonUSD: 220, note: "Dinner + breakfast included; the splurge night", emoji: "♨️" },
  { id: "trains", label: "Trains & transit", perPersonUSD: 290, note: "All shinkansen legs + Hakone pass + metro (~¥43,000). Cheaper than the ¥50,000 JR Pass", emoji: "🚄" },
  { id: "food", label: "Food — 16 days", perPersonUSD: 640, note: "~$40/day: konbini breakfast, casual lunch, one nicer dinner; splurge meals included", emoji: "🍜" },
  { id: "attractions", label: "Attractions & tickets", perPersonUSD: 280, note: "USJ + Express (~$130), teamLab ($25), Shibuya Sky ($23), temples, towers, museums", emoji: "🎟️" },
  { id: "shopping", label: "Shopping & souvenirs", perPersonUSD: 300, note: "Don Quijote runs, Pokémon Center, omiyage — adjust to your weakness level", emoji: "🛍️" },
  { id: "misc", label: "eSIM, insurance, luggage shipping", perPersonUSD: 90, note: "Ubigi eSIM, travel insurance, Yamato takkyubin bag transfers", emoji: "📱" },
];
