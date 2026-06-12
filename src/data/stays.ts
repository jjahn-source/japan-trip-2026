// Live Airbnb research — re-searched June 12, 2026 for the v2 route (3 bases, no Hakone
// overnight): 8 adults, entire home, 2+ bathrooms required on every listing.
// Prices are WHOLE-STAY totals (taxes/fees/discounts included), converted at $1.34/£
// from Airbnb's quoted totals. Re-quote before booking.

export type StayOption = {
  id: string; // Airbnb listing id
  name: string;
  area: string;
  url: string;
  beds: string; // bedrooms · beds · baths
  rating: string;
  totalUSD: number; // whole house, whole stay
  walk: string; // location reality check
  tags: string[];
  note: string;
};

export type StayLeg = {
  id: string;
  city: string;
  cityJp: string;
  dates: string;
  nights: number;
  emoji: string;
  brief: string;
  defaultPick: string; // option id in the Budget Lock combo
  options: StayOption[];
};

export const GROUP = 8;
export const BUDGET_CAP_PP = 360; // hard target: total accommodations < $360/person
export const FX_NOTE =
  "Quotes pulled June 12, 2026 for Dec 15–21 / 21–24 / 24–29 · whole-stay totals incl. fees · $1.34/£ · every option has 2+ bathrooms · prices move, re-quote before booking";

export const STAY_LEGS: StayLeg[] = [
  {
    id: "tokyo",
    city: "Tokyo",
    cityJp: "東京",
    dates: "Dec 15–21",
    nights: 6,
    emoji: "🌃",
    brief:
      "Six nights, one base, Shinjuku orbit. Day trips (Hakone) launch from here. Longer stay = long-stay discounts kick in.",
    defaultPick: "11981272",
    options: [
      {
        id: "11981272",
        name: "4 Baths / 4 Rooms, 1 Stop from Shinjuku",
        area: "Hatsudai (Keio New Line)",
        url: "https://www.airbnb.com/rooms/11981272?check_in=2026-12-15&check_out=2026-12-21&adults=8",
        beds: "4BR · 4 double beds · 3.5 baths",
        rating: "4.86★ (229)",
        totalUSD: 1668,
        walk: "Literally one stop (2 min) to Shinjuku Stn — or a 20-min walk",
        tags: ["BUDGET LOCK PICK", "229 REVIEWS", "3.5 BATHS"],
        note: "The anchor of the whole plan: $209/guy for SIX nights, 3.5 bathrooms for 8 dudes, proven across 229 reviews. Catch: 4 double beds = pairing up.",
      },
      {
        id: "1536111087299633272",
        name: "Shinjuku Entire 3-Story Home",
        area: "Higashi-Shinjuku",
        url: "https://www.airbnb.com/rooms/1536111087299633272?check_in=2026-12-15&check_out=2026-12-21&adults=8",
        beds: "3BR · 6 beds · 2 baths",
        rating: "4.94★ (17)",
        totalUSD: 2027,
        walk: "Walking distance to Kabukicho/Golden Gai — two stations covered",
        tags: ["CLOSEST TO THE ACTION"],
        note: "Stumble home from Golden Gai every single night. $253/guy for 6 nights — the proximity tax is real but small.",
      },
      {
        id: "989371479641705339",
        name: "Shinjuku 120㎡ · 8 Beds · 3-min Walk to Station",
        area: "Ochiai (Shinjuku-ku)",
        url: "https://www.airbnb.com/rooms/989371479641705339?check_in=2026-12-15&check_out=2026-12-21&adults=8",
        beds: "3BR · 10 beds · 2 baths",
        rating: "4.97★ (109) · Guest Favorite",
        totalUSD: 2264,
        walk: "3-min walk to the metro, ~8 min into Shinjuku proper; 2 parking spots",
        tags: ["BEST REVIEWS", "REAL BED FOR EVERYONE"],
        note: "10 actual beds, 4.97★ across 109 stays. The 'nobody shares' option at $283/guy.",
      },
      {
        id: "1281683561054021099",
        name: "Newly Built House — Tram Direct to Shinjuku",
        area: "West Shinjuku-ku",
        url: "https://www.airbnb.com/rooms/1281683561054021099?check_in=2026-12-15&check_out=2026-12-21&adults=8",
        beds: "4BR · 8 beds · 2 baths",
        rating: "5.0★ (13)",
        totalUSD: 1913,
        walk: "One tram direct to Shinjuku; new-build everything",
        tags: ["BRAND NEW", "8 REAL BEDS"],
        note: "Fresh construction, perfect score so far, 8 singles. $239/guy.",
      },
      {
        id: "1649745054647737772",
        name: "ZLH34F Shinjuku Business District Apt",
        area: "Ochiai (Shinjuku-ku)",
        url: "https://www.airbnb.com/rooms/1649745054647737772?check_in=2026-12-15&check_out=2026-12-21&adults=8",
        beds: "3BR · 6 beds · 2 baths",
        rating: "New listing — no reviews yet",
        totalUSD: 1522,
        walk: "Near the metro, ~10 min into Shinjuku Stn",
        tags: ["CHEAP + CENTRAL", "NO REVIEWS = RISK"],
        note: "$190/guy in Shinjuku-ku — but zero reviews. Free-cancellation gamble only.",
      },
      {
        id: "1081600201241889397",
        name: "Ninja House",
        area: "Ikebukuro side (NOT Shinjuku)",
        url: "https://www.airbnb.com/rooms/1081600201241889397?check_in=2026-12-15&check_out=2026-12-21&adults=8",
        beds: "4BR · 7 beds · 2 baths",
        rating: "4.78★ (54) · Superhost",
        totalUSD: 1399,
        walk: "Ikebukuro orbit — 10–15 min by train to Shinjuku",
        tags: ["ABSOLUTE CHEAPEST", "IT'S A NINJA HOUSE"],
        note: "$175/guy and it is literally ninja-themed. Bends the Shinjuku rule; saves $34/guy vs the anchor.",
      },
    ],
  },
  {
    id: "kyoto",
    city: "Kyoto",
    cityJp: "京都",
    dates: "Dec 21–24",
    nights: 3,
    emoji: "⛩️",
    brief:
      "Three packed nights. Kyoto is compact — anywhere inside the grid works; Shijo/Gion proximity is the premium. Nara + Uji day trips launch from here.",
    defaultPick: "28919086",
    options: [
      {
        id: "28919086",
        name: "[BI] Lovely Kyoto House",
        area: "Nijo (12 min to the castle)",
        url: "https://www.airbnb.com/rooms/28919086?check_in=2026-12-21&check_out=2026-12-24&adults=8",
        beds: "3BR · 5 beds · 2 baths (sleeps 9)",
        rating: "4.80★ (320)",
        totalUSD: 403,
        walk: "Quiet machiya lane; buses + 15-min walks to everything central",
        tags: ["BUDGET LOCK PICK", "320 REVIEWS", "$50/GUY"],
        note: "Three Kyoto nights for $50 a man with 320 reviews of receipts. 5 beds + futons — Japan-style for a few.",
      },
      {
        id: "32674149",
        name: "[CKA] Lovely House — 2 min to Shijo Station",
        area: "Shijo-Karasuma (dead center)",
        url: "https://www.airbnb.com/rooms/32674149?check_in=2026-12-21&check_out=2026-12-24&adults=8",
        beds: "2BR · 4 beds · 2 baths (sleeps 9)",
        rating: "4.76★ (348) · Superhost",
        totalUSD: 491,
        walk: "2 min to Shijo Stn — Nishiki Market and Pontocho are a stroll",
        tags: ["MOST CENTRAL", "348 REVIEWS"],
        note: "The location play: wake up inside the Kyoto grid. Futon-heavy sleeping, $61/guy.",
      },
      {
        id: "877054887556595789",
        name: "Traditional Shōwa-Style House",
        area: "Kyoto center (west of Horikawa)",
        url: "https://www.airbnb.com/rooms/877054887556595789?check_in=2026-12-21&check_out=2026-12-24&adults=8",
        beds: "4BR · 7 beds · 2 baths",
        rating: "4.79★ (87) · Superhost",
        totalUSD: 709,
        walk: "Central grid; 15 min to Nishiki by bus/walk",
        tags: ["RETRO JAPAN", "30% OFF NOW"],
        note: "Actual old-Japan interior without old-Japan plumbing. $89/guy.",
      },
      {
        id: "13437163",
        name: "Kyoto Tatami House — 4 Japanese Rooms",
        area: "South of Kyoto Station",
        url: "https://www.airbnb.com/rooms/13437163?check_in=2026-12-21&check_out=2026-12-24&adults=8",
        beds: "4BR · 8 beds · 3 baths",
        rating: "4.82★ (314) · Superhost",
        totalUSD: 820,
        walk: "Near Kyoto Stn — perfect for the Dec 24 Uji→Osaka launch",
        tags: ["3 BATHS", "314 REVIEWS"],
        note: "Full tatami immersion + station logistics. $102/guy.",
      },
      {
        id: "26892566",
        name: "GION Renovated House for 9",
        area: "Gion",
        url: "https://www.airbnb.com/rooms/26892566?check_in=2026-12-21&check_out=2026-12-24&adults=8",
        beds: "3BR · 8 beds · 3 baths",
        rating: "4.60★ (42) · Superhost",
        totalUSD: 773,
        walk: "IN Gion — lantern-light commute to dinner",
        tags: ["GION ADDRESS"],
        note: "Sleep in the geisha district itself. Lowest rating of the set (4.6) but the address does heavy lifting. $97/guy.",
      },
    ],
  },
  {
    id: "osaka",
    city: "Osaka",
    cityJp: "大阪",
    dates: "Dec 24–29",
    nights: 5,
    emoji: "🐙",
    brief:
      "Five nights in the Namba blast radius: Christmas Eve Dotonbori, USJ, Hiroshima day trip, victory lap, Himeji/Kobe day trip, then the Dec 29 shinkansen sprint to Haneda.",
    defaultPick: "1002551612839197497",
    options: [
      {
        id: "1002551612839197497",
        name: "(Yuji) Renovated House",
        area: "Daikokucho — 1 stop south of Namba",
        url: "https://www.airbnb.com/rooms/1002551612839197497?check_in=2026-12-24&check_out=2026-12-29&adults=8",
        beds: "3BR · 7 beds · 2 shower rooms",
        rating: "4.79★ (77)",
        totalUSD: 665,
        walk: "1 metro stop (or 15-min walk) to Namba/Dotonbori",
        tags: ["BUDGET LOCK PICK", "$83/GUY FOR 5 NIGHTS"],
        note: "Christmas week in Osaka for $83 a man. The math engine of the whole plan, again.",
      },
      {
        id: "1655686458120297026",
        name: "89m² · 3 Showers · 3 Toilets",
        area: "Nihonbashi / Kuromon",
        url: "https://www.airbnb.com/rooms/1655686458120297026?check_in=2026-12-24&check_out=2026-12-29&adults=8",
        beds: "3BR · 7 beds · 3 baths",
        rating: "5.0★ (4 — brand new)",
        totalUSD: 841,
        walk: "5 min to Nihonbashi Stn; 7–12 min WALK to Dotonbori + Kuromon Market",
        tags: ["WALK TO DOTONBORI", "3 SHOWERS"],
        note: "Kuromon breakfast crawl = downstairs. Only 4 reviews so far, all 5★. $105/guy.",
      },
      {
        id: "1448271653775689226",
        name: "Brand-New Japanese House, Tengachaya",
        area: "Tengachaya (direct airport line)",
        url: "https://www.airbnb.com/rooms/1448271653775689226?check_in=2026-12-24&check_out=2026-12-29&adults=8",
        beds: "3BR · 6 beds · 2 baths, 2 toilets (sleeps 9)",
        rating: "5.0★ (15)",
        totalUSD: 858,
        walk: "4-min walk to the station; one line to Namba/Dotonbori/USJ transfers",
        tags: ["PERFECT SCORE", "NEW BUILD"],
        note: "Fresh build, 15 straight 5★ stays. $107/guy.",
      },
      {
        id: "849001426367537375",
        name: "4BR · 8 Double Beds · Namba South",
        area: "Imamiya / Namba south",
        url: "https://www.airbnb.com/rooms/849001426367537375?check_in=2026-12-24&check_out=2026-12-29&adults=8",
        beds: "4BR · 8 double beds · 2 baths, 2 toilets",
        rating: "4.86★ (103)",
        totalUSD: 1072,
        walk: "Walkable to Shinsekai AND Namba — between the two food worlds",
        tags: ["A DOUBLE BED EACH", "103 REVIEWS"],
        note: "Eight men, eight double beds, zero negotiations. $134/guy.",
      },
      {
        id: "1274391266396404632",
        name: "Stylish Japanese House — KIX/Namba Direct",
        area: "South Osaka (Nankai line)",
        url: "https://www.airbnb.com/rooms/1274391266396404632?check_in=2026-12-24&check_out=2026-12-29&adults=8",
        beds: "4BR · 9 beds",
        rating: "4.97★ (72) · Guest Favorite",
        totalUSD: 1156,
        walk: "Direct lines to Namba; designed-magazine interior",
        tags: ["PREMIUM", "4.97★"],
        note: "The best-reviewed of the Osaka set and it photographs like a ryokan ad. $145/guy.",
      },
    ],
  },
];

// Budget Lock combo (the defaults above):
// $1,668 + $403 + $665 = $2,736 → ~$342/person for all 14 nights. UNDER CAP, all proven listings.
export const COMBO_NOTES = [
  "🔒 BUDGET LOCK (default picks): $2,736 total → ~$342/guy for all 14 nights — $18/guy under the cap, and every pick has 77–320 reviews. No gambles required this time.",
  "🛏️ REAL-BEDS UPGRADE: swap Tokyo to the 10-bed 4.97★ house (+$75/guy) → ~$417/guy. Over cap — crew vote on whether bed-sharing is worth $75.",
  "🏮 LOCATION MAXX: Higashi-Shinjuku walk-home house + Shijo-central Kyoto + Kuromon-walkable Osaka = ~$420/guy. The 'never take a late train' build.",
  "📌 All options are free-cancellation-era bookable NOW. Lock Budget Lock today; upgrade individual legs later if December prices dip.",
];
