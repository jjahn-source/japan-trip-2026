// "Don't waste a yen" — researched money moves for THIS trip (Jun 2026 sources).
// Rate: ¥160 = $1. Verdicts are specific to our Dec 14–29 2026 route.

export const YEN_RATE = 160; // ¥ per $1, working rate for Dec 2026

export type MoveTag = "Transport" | "Food" | "Shopping" | "Sightseeing" | "Logistics";

export type MoneyMove = {
  emoji: string;
  title: string;
  saving: string; // headline savings
  detail: string;
  tag: MoveTag;
};

export const MONEY_PREAMBLE =
  "Eight people compounding small leaks is a real budget. These are the researched, route-specific moves that keep money in the konbini-beer fund — ranked by how much they actually save.";

export const MONEY_MOVES: MoneyMove[] = [
  {
    emoji: "🚄",
    title: "Skip the JR Pass — it's a trap for our route",
    saving: "≈ $140 / person",
    detail:
      "The 7-day JR Pass jumped to ¥50,000 ($313) after the 2023 hike. Our Tokyo→Kyoto→Osaka spine is ≈¥27,700 ($173) point-to-point, and even adding the Hiroshima and Himeji day-trip round-trips stays cheaper than the pass. The pass only breaks even on a Tokyo–Hiroshima round trip inside 7 days — which our spread-out schedule never does. Buy individual seats on SmartEX.",
    tag: "Transport",
  },
  {
    emoji: "🛍️",
    title: "NEW tax-free rules (from Nov 1, 2026): pay tax, refund at the airport",
    saving: "the 10% back — done right",
    detail:
      "BIG CHANGE for our dates: Japan switched to a refund-based system on Nov 1, 2026. You now pay the full 10% consumption tax in-store, then claim the refund at the airport BEFORE departure (within 90 days). Threshold is still ¥5,000 ($31) pre-tax per store per day, but ALL goods now combine and the sealed-bag rule is gone. Keep receipts + passport accessible for the Dec 29 HND refund desk — budget the buffer time.",
    tag: "Shopping",
  },
  {
    emoji: "🎟️",
    title: "Osaka Amazing Pass on Dec 27 — pays for itself by lunch",
    saving: "≈ $20 / person that day",
    detail:
      "¥3,500 ($22) buys unlimited subway + free entry to 40+ spots. Our Dec 27 victory lap alone: Osaka Castle keep (¥600) + Umeda Sky Floating Garden (¥2,000) + a Dotonbori river cruise (¥1,000) + 4–5 subway hops — already past ¥3,500 before the crab dinner. Only worth it on the heavy-Osaka-sightseeing day, not the USJ or day-trip days.",
    tag: "Sightseeing",
  },
  {
    emoji: "🏯",
    title: "Osaka→Himeji on the JR Special Rapid, not the Nozomi",
    saving: "≈ $11 / person each way",
    detail:
      "The shinkansen is ¥3,280 ($21) and 29 min; the JR Special Rapid is ≈¥1,520 ($9.50) and about 60 min — only ~30 min slower for less than half the price, and it's covered by your ICOCA tap (no SmartEX booking). For a relaxed Dec 28 day-trip start, take the Special Rapid and bank the difference toward Kobe beef.",
    tag: "Transport",
  },
  {
    emoji: "🍱",
    title: "Depachika raid in the last 30 minutes before close",
    saving: "20–50% off premium food",
    detail:
      "Department-store food halls (Isetan, Mitsukoshi, Daimaru, Takashimaya) slash bento, sushi, and prepared dishes 20–50% in the final 30–60 min before closing (~19:30–20:00). A ¥2,000 jewel-box bento becomes a ¥1,000 dinner. Perfect for a cheap, elite Airbnb-floor feast on a low-key night.",
    tag: "Food",
  },
  {
    emoji: "🏪",
    title: "Konbini 'waribiki' discount stickers after ~8pm",
    saving: "20–30% off bento & onigiri",
    detail:
      "Convenience stores sticker down same-day bento, onigiri, and sandwiches after roughly 20:00 to clear stock. The late-night konbini run is already doctrine — time it after 8pm and the nightcap food is a third off.",
    tag: "Food",
  },
  {
    emoji: "🍜",
    title: "Eat the big meals at LUNCH",
    saving: "≈ half the dinner price",
    detail:
      "Restaurants that charge ¥3,000–5,000 at dinner serve the same kitchen as a ¥800–1,200 lunch teishoku. This is exactly why our Kobe beef stop is a LUNCH (A5 sets run ~half the dinner price). Apply it everywhere — sushi, unagi, tempura, kaiseki all have lunch deals.",
    tag: "Food",
  },
  {
    emoji: "🗼",
    title: "Free observation decks over paid ones",
    saving: "$15–25 / person / view",
    detail:
      "The Tokyo Metropolitan Gov't Building decks (Shinjuku, 202m) are FREE — a no-cost Fuji-at-dusk alternative to a paid tower. Umeda Sky's lower level is free, KITTE and Shibuya Hikarie Sky Lobby are free. Pay only for the one view you really want (Shibuya Sky); freeload the rest.",
    tag: "Sightseeing",
  },
  {
    emoji: "🍺",
    title: "Nomihodai math + 'toriaezu nama'",
    saving: "breaks even at drink #3",
    detail:
      "All-you-can-drink (2h, ~¥1,500–2,500 added to a course) beats à la carte the moment you hit your third drink — which, be honest, you will. For 8 people it's almost always the move. Last call sneaks in 30 min before time; pace accordingly.",
    tag: "Food",
  },
  {
    emoji: "📲",
    title: "IC card for everything, eSIM not pocket-wifi",
    saving: "$5–10 / person / day",
    detail:
      "Suica/PASMO/ICOCA taps every metro, bus, konbini, and vending machine — no paper tickets, no rail pass. Each guy runs his own eSIM (~$10–15 for the trip) instead of renting a pocket-wifi nobody wants to babysit. Top the card up so an 11:55pm gate never strands anyone.",
    tag: "Transport",
  },
  {
    emoji: "🧳",
    title: "Coin lockers + Yamato, never drag bags",
    saving: "time, sanity, taxi fares",
    detail:
      "Station coin lockers (¥400–700) hold daypacks during day trips; Yamato forwards the big suitcases Tokyo→Osaka (~¥2,500/bag, twice all trip) so Kyoto is daypack-only. Dragging luggage onto rush-hour trains is how a group ends up splitting an expensive taxi.",
    tag: "Logistics",
  },
  {
    emoji: "💴",
    title: "No tipping, no FX fees, pull yen at 7-Bank",
    saving: "3% FX + zero awkward tips",
    detail:
      "Tipping isn't a thing — never do it. Use a no-foreign-transaction-fee card for big spends, pull cash from 7-Eleven (7-Bank) or JP Post ATMs which take foreign cards 24/7, and settle the group nightly on Splitwise in yen. Carry ~¥10,000 cash for the cash-only alleys (Golden Gai, yokocho, sento).",
    tag: "Logistics",
  },
  {
    emoji: "⛩️",
    title: "Stack the FREE December stuff",
    saving: "most nights cost $0",
    detail:
      "Shrines are free, temples are ¥300–600, and December's best shows are free: Marunouchi/Midosuji illuminations, Shibuya Blue Cave, the Hagoita-ichi and Toji markets, harbor light-ups. Build evenings around free illuminations and spend only on the one ticketed thing per day.",
    tag: "Sightseeing",
  },
  {
    emoji: "🎫",
    title: "Book shinkansen seats early on SmartEX",
    saving: "early-bird fare buckets",
    detail:
      "SmartEX/EX opens seat sales ~1 month out, and early-bird buckets (EX早特 / Tokuda) on some departures undercut the standard fare. Two SmartEX accounts cover all 8 seats; tickets bind to your IC card for tap-through gates — no ticket-office line, ever.",
    tag: "Transport",
  },
];

export type PassRow = {
  name: string;
  price: string;
  verdict: "SKIP" | "BUY" | "MAYBE";
  math: string;
};

export const PASS_MATH: PassRow[] = [
  { name: "7-Day JR Pass", price: "¥50,000 ($313)", verdict: "SKIP", math: "Golden Route point-to-point is ≈¥27,700. You'd need a Tokyo–Hiroshima round trip inside one 7-day window to break even — our schedule never clusters like that." },
  { name: "Point-to-point on SmartEX + IC", price: "pay per leg", verdict: "BUY", math: "Tokyo→Kyoto ¥14,170, Kyoto/Osaka legs, + Hiroshima & Himeji day-trip round-trips — every leg is cheaper than a pass and you can ride Nozomi." },
  { name: "Osaka Amazing Pass (1-day)", price: "¥3,500 ($22)", verdict: "BUY", math: "ONLY on Dec 27: Castle ¥600 + Umeda Sky ¥2,000 + Dotonbori cruise ¥1,000 + unlimited subway clears the price before dinner." },
  { name: "Kansai Thru Pass (2-day)", price: "≈¥5,600 ($35)", verdict: "MAYBE", math: "Covers non-JR subway/bus/private rail across Kyoto, Nara, Kobe, Osaka. Pencil it against your actual Kyoto/Nara transit tally — it wins on heavy-bus Kyoto days." },
  { name: "Welcome Suica / ICOCA", price: "load ¥5,000", verdict: "BUY", math: "The backbone: one tap for every metro, bus, konbini, vending machine. No deposit on Welcome Suica; ICOCA works identically in Kansai. This replaces the rail pass entirely." },
];
