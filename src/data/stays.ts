// Live Airbnb research — re-pulled June 13, 2026 via the Airbnb MCP for the 3-base
// route (no Hakone): 8 adults, entire home, 3+ bedrooms & 2+ bathrooms on every listing.
// Airbnb quoted whole-stay totals in GBP (taxes/fees/discounts included); converted to
// USD at $1.34/£. December is peak — the old sub-$1,700 Tokyo bargain is gone, so these
// reflect real current pricing. Re-quote before booking; free-cancellation picks noted.

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
export const BUDGET_CAP_PP = 525; // realistic Dec-peak target: total accommodations < $525/person
export const FX_NOTE =
  "Quotes pulled June 13, 2026 via Airbnb MCP for Dec 15–21 / 21–24 / 24–29 · whole-stay totals incl. fees, USD-first at $1.34/£ · every option is 3+ BR / 2+ bath · December peak pricing, re-quote before booking";

export const STAY_LEGS: StayLeg[] = [
  {
    id: "tokyo",
    city: "Tokyo",
    cityJp: "東京",
    dates: "Dec 15–21",
    nights: 6,
    emoji: "🌃",
    brief:
      "Six nights, one Shinjuku base. The Kamakura + Enoshima day trip launches from here on Suica. Six nights triggers long-stay + early-booking discounts (baked into these totals).",
    defaultPick: "1536111087299633272",
    options: [
      {
        id: "1536111087299633272",
        name: "Shinjuku Entire 3-Story Home · 2 Stations",
        area: "Higashi-Shinjuku",
        url: "https://www.airbnb.com/rooms/1536111087299633272?check_in=2026-12-15&check_out=2026-12-21&adults=8",
        beds: "3BR · 6 beds · 2 baths (sleeps 9)",
        rating: "4.94★ (17) · Guest Favorite",
        totalUSD: 2029,
        walk: "Walk home from Kabukicho/Golden Gai; two stations on the doorstep",
        tags: ["BUDGET LOCK PICK", "WALK TO THE ACTION", "$254/GUY"],
        note: "Cheapest solid Tokyo whole-house for the dates: $254/guy for SIX nights, and you stumble home from Golden Gai every night. Catch: 6 beds for 8 = two pairs share.",
      },
      {
        id: "989371479641705339",
        name: "Shinjuku 120㎡ · 10 Beds · 3-min Walk",
        area: "Ochiai (Shinjuku-ku)",
        url: "https://www.airbnb.com/rooms/989371479641705339?check_in=2026-12-15&check_out=2026-12-21&adults=8",
        beds: "3BR · 10 beds · 2 baths",
        rating: "4.97★ (109) · Guest Favorite",
        totalUSD: 2265,
        walk: "3-min walk to the metro, ~8 min into Shinjuku proper; 2 parking spots",
        tags: ["EVERYONE A BED", "109 REVIEWS"],
        note: "10 real beds, 4.97★ across 109 stays, early-booking discount already applied. The 'nobody shares, nobody gambles' anchor at $283/guy.",
      },
      {
        id: "27313513",
        name: "Full-Reno 120㎡ · 4BR / 10 Beds",
        area: "West Shinjuku (7 min to station)",
        url: "https://www.airbnb.com/rooms/27313513?check_in=2026-12-15&check_out=2026-12-21&adults=8",
        beds: "4BR · 10 beds · 2 baths",
        rating: "4.66★ (148) · Superhost",
        totalUSD: 2439,
        walk: "7-min walk to Shinjuku Stn; fully renovated",
        tags: ["10 BEDS", "ROOM TO SPREAD OUT"],
        note: "Four bedrooms, ten beds, $305/guy. Rating's the lowest here (4.66) but it's a big, proven Superhost space for a rowdy 8.",
      },
      {
        id: "1256924680766263244",
        name: "Shinjuku Entire House, Up to 9",
        area: "West Shinjuku-ku",
        url: "https://www.airbnb.com/rooms/1256924680766263244?check_in=2026-12-15&check_out=2026-12-21&adults=8",
        beds: "4BR · 6 beds · 2 baths",
        rating: "4.97★ (62) · Guest Favorite",
        totalUSD: 2952,
        walk: "~10 min to Shinjuku; quiet residential street",
        tags: ["4.97★", "QUIET STREET"],
        note: "Higher-end finish, near-perfect reviews, $369/guy. The 'sleep well between benders' option.",
      },
      {
        id: "909834219389134686",
        name: "Shinjuku 1 Sta · 4BR Upscale 98㎡",
        area: "Upscale west Shinjuku",
        url: "https://www.airbnb.com/rooms/909834219389134686?check_in=2026-12-15&check_out=2026-12-21&adults=8",
        beds: "4BR · 6 beds · 2 baths",
        rating: "4.99★ (190) · Guest Favorite",
        totalUSD: 3946,
        walk: "One station to Shinjuku; upscale residential pocket",
        tags: ["BEST REVIEWS (190)", "PREMIUM"],
        note: "The bulletproof one: 4.99★ over 190 stays. $493/guy — the splurge that never has a surprise.",
      },
      {
        id: "1645306819614363751",
        name: "New 91㎡ 4BR · 4 Stops to Shibuya",
        area: "Shinjuku/Okubo edge",
        url: "https://www.airbnb.com/rooms/1645306819614363751?check_in=2026-12-15&check_out=2026-12-21&adults=8",
        beds: "4BR · 6 beds · 2 baths",
        rating: "5.0★ (11) · Guest Favorite",
        totalUSD: 3695,
        walk: "4 stops to Shibuya; brand-new build",
        tags: ["BRAND NEW", "5.0★"],
        note: "Fresh construction, long-stay discount applied, $462/guy. Newest interior of the set.",
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
      "Three packed nights. Kyoto is compact — anywhere in the grid works; Kyoto-Station-area is best for the Dec 24 Uji→Osaka launch. Nara + Uji day trips run from here.",
    defaultPick: "41220461",
    options: [
      {
        id: "41220461",
        name: "New House · 5 min to Kyoto Station",
        area: "South Kyoto (near Kyoto Stn)",
        url: "https://www.airbnb.com/rooms/41220461?check_in=2026-12-21&check_out=2026-12-24&adults=8",
        beds: "3BR · 5 beds · 2 baths",
        rating: "4.97★ (127) · Guest Favorite",
        totalUSD: 838,
        walk: "5 min to Kyoto Stn — perfect for the Nara/Uji launches + Dec 24 move to Osaka",
        tags: ["BUDGET LOCK PICK", "$105/GUY", "STATION-SIDE"],
        note: "Three Kyoto nights for $105 a guy, 4.97★ over 127 stays, long-stay discount applied. Station-adjacent = day trips and the Osaka move are frictionless. 5 beds + futons for the rest.",
      },
      {
        id: "1369453788527640419",
        name: "Heated Home · Easy Arashiyama / Gion",
        area: "West-central Kyoto",
        url: "https://www.airbnb.com/rooms/1369453788527640419?check_in=2026-12-21&check_out=2026-12-24&adults=8",
        beds: "4BR · 8 beds · 2.5 baths",
        rating: "4.98★ (40) · Guest Favorite",
        totalUSD: 1009,
        walk: "Easy to Arashiyama AND Gion; floor heating (December clutch)",
        tags: ["8 BEDS", "HEATED", "2.5 BATHS"],
        note: "Eight beds, 2.5 baths, central, 4.98★. $126/guy and nobody shares — the value upgrade over the default.",
      },
      {
        id: "40359294",
        name: "Tofukuji Traditional 2-Story Machiya",
        area: "Tofukuji (4 min to station)",
        url: "https://www.airbnb.com/rooms/40359294?check_in=2026-12-21&check_out=2026-12-24&adults=8",
        beds: "3BR · 5 double beds · 2 baths",
        rating: "4.96★ (251) · Guest Favorite",
        totalUSD: 1048,
        walk: "4 min to the station; steps from Tofukuji + a stop from Fushimi Inari",
        tags: ["251 REVIEWS", "INARI-ADJACENT"],
        note: "Most-reviewed Kyoto pick (251), genuine machiya, and it's one stop from the Dec 22 dawn Fushimi Inari raid. $131/guy.",
      },
      {
        id: "38015810",
        name: "Nijo Castle 99㎡ · 3 Baths",
        area: "Nijo (central)",
        url: "https://www.airbnb.com/rooms/38015810?check_in=2026-12-21&check_out=2026-12-24&adults=8",
        beds: "3BR · 7 beds · 3 baths",
        rating: "4.93★ (107) · Guest Favorite",
        totalUSD: 1140,
        walk: "By Nijo Castle; central grid, buses everywhere",
        tags: ["3 BATHS FOR 8", "CENTRAL"],
        note: "Three bathrooms is the morning-rush cheat code for 8 guys. $143/guy, central, proven.",
      },
      {
        id: "1317101540104556001",
        name: "Nijo Castle Art Machiya · Courtyard",
        area: "Nijo (central)",
        url: "https://www.airbnb.com/rooms/1317101540104556001?check_in=2026-12-21&check_out=2026-12-24&adults=8",
        beds: "3BR · 7 beds · 2 baths",
        rating: "4.98★ (64) · Guest Favorite",
        totalUSD: 1554,
        walk: "1-min walk to a bus stop; private courtyard",
        tags: ["PRIVATE COURTYARD", "4.98★"],
        note: "Design-forward machiya with its own courtyard. $194/guy — the photogenic splurge.",
      },
      {
        id: "14956154",
        name: "Best Traditional Luxury House · 5 min to Gion",
        area: "Higashiyama / Gion edge",
        url: "https://www.airbnb.com/rooms/14956154?check_in=2026-12-21&check_out=2026-12-24&adults=8",
        beds: "4BR · 8 beds · 2 baths",
        rating: "4.94★ (307) · Guest Favorite",
        totalUSD: 2289,
        walk: "5 min to Gion — lantern-lit commute to Pontocho dinner",
        tags: ["GION ADDRESS", "307 REVIEWS"],
        note: "Sleep beside Gion with 307 reviews backing it. $286/guy — location maxx.",
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
      "Five nights in the Namba/Nihonbashi blast radius: Christmas Eve Dotonbori, USJ, the Hiroshima and Himeji/Kobe day trips, the victory lap, then the Dec 29 shinkansen sprint to Haneda.",
    defaultPick: "849001426367537375",
    options: [
      {
        id: "849001426367537375",
        name: "4BR · 8 Double Beds · Namba South",
        area: "Imamiya / Namba south",
        url: "https://www.airbnb.com/rooms/849001426367537375?check_in=2026-12-24&check_out=2026-12-29&adults=8",
        beds: "4BR · 8 double beds · 3 baths",
        rating: "4.86★ (103) · Guest Favorite",
        totalUSD: 1073,
        walk: "Walkable to Shinsekai AND Namba — between the two food worlds",
        tags: ["BUDGET LOCK PICK", "A DOUBLE BED EACH", "3 BATHS"],
        note: "Eight men, eight double beds, three baths, $134/guy for 5 nights. The math engine of the whole plan — long-stay discount baked in.",
      },
      {
        id: "1655686458120297026",
        name: "89㎡ · 3 Showers · Walk to Dotonbori",
        area: "Nihonbashi / Kuromon",
        url: "https://www.airbnb.com/rooms/1655686458120297026?check_in=2026-12-24&check_out=2026-12-29&adults=8",
        beds: "3BR · 7 beds · 3 baths",
        rating: "5.0★ (4 — newer listing)",
        totalUSD: 842,
        walk: "5 min to Nihonbashi Stn; 7–12 min WALK to Dotonbori + Kuromon Market",
        tags: ["CHEAPEST", "WALK TO KUROMON", "$105/GUY"],
        note: "Kuromon breakfast crawl is downstairs and it's the cheapest of the set at $105/guy. Only 4 reviews (all 5★) — free-cancellation gamble.",
      },
      {
        id: "989467227242358786",
        name: "Taisho Detached House · 3-min Walk",
        area: "Taisho (one line to Namba/USJ)",
        url: "https://www.airbnb.com/rooms/989467227242358786?check_in=2026-12-24&check_out=2026-12-29&adults=8",
        beds: "4BR · 5 beds · 2 baths",
        rating: "4.96★ (78) · Guest Favorite",
        totalUSD: 1258,
        walk: "3-min walk to the station; clean run to Namba and the USJ transfer",
        tags: ["USJ-FRIENDLY", "4.96★"],
        note: "Smooth Christmas-Day USJ logistics and a quiet base, $157/guy. 5 beds = a few on futons.",
      },
      {
        id: "1334423068782122936",
        name: "Namba Whole Building · Up to 10",
        area: "Namba (5 min to JR + subway)",
        url: "https://www.airbnb.com/rooms/1334423068782122936?check_in=2026-12-24&check_out=2026-12-29&adults=8",
        beds: "3BR · 7 beds · 2 baths",
        rating: "4.89★ (37) · Superhost",
        totalUSD: 1239,
        walk: "5-min walk to both JR and subway; whole building to yourselves",
        tags: ["WHOLE BUILDING", "$155/GUY"],
        note: "A whole building for the crew, dead central, $155/guy. Superhost, 37 reviews.",
      },
      {
        id: "34764282",
        name: "Kuromon Market 2-min · 3 Baths",
        area: "Nihonbashi / Kuromon",
        url: "https://www.airbnb.com/rooms/34764282?check_in=2026-12-24&check_out=2026-12-29&adults=8",
        beds: "3BR · 8 beds · 3 baths",
        rating: "4.98★ (222) · Guest Favorite",
        totalUSD: 1868,
        walk: "2 min to Kuromon Market, 3 min to Nipponbashi Stn",
        tags: ["222 REVIEWS", "8 BEDS", "3 BATHS"],
        note: "The most-proven Osaka house (222 reviews), 8 beds, 3 baths, market on the doorstep. $234/guy — buy peace of mind.",
      },
      {
        id: "1059787813315972929",
        name: "Namba Villa · 1 min to Yasaka Shrine",
        area: "Namba (5 min to Takashimaya)",
        url: "https://www.airbnb.com/rooms/1059787813315972929?check_in=2026-12-24&check_out=2026-12-29&adults=8",
        beds: "4BR · 9 beds · 3.5 baths",
        rating: "4.88★ (129) · Superhost",
        totalUSD: 1829,
        walk: "5-min walk to Namba/Takashimaya; direct line to Kansai Airport",
        tags: ["9 BEDS", "3.5 BATHS", "NAMBA CORE"],
        note: "Nine beds, three-and-a-half baths, one minute from Namba Yasaka Shrine's giant lion head. $229/guy.",
      },
    ],
  },
];

// Budget Lock combo (the default picks above):
// $2,029 + $838 + $1,073 = $3,940 → ~$493/person for all 14 nights — under the $525 Dec-peak cap.
export const COMBO_NOTES = [
  "🔒 BUDGET LOCK (default picks): $3,940 total → ~$493/guy for all 14 nights — under the $525 December-peak cap, every leg a proven Guest-Favorite with early-booking/long-stay discounts already applied.",
  "🛏️ EVERYONE-A-BED build: swap Tokyo to the 10-bed 4.97★ house + Kyoto to the 8-bed heated home (+~$55/guy) → ~$548/guy. Nobody shares a futon the whole trip.",
  "🏮 LOCATION MAXX: Higashi-Shinjuku walk-home + 5-min-to-Gion Kyoto + Kuromon-walkable Osaka = ~$595/guy. The 'never take a late train' build.",
  "💴 Why no cheaper? December is peak and the old sub-$1,700 Tokyo bargain is gone for these dates. These are live Airbnb MCP quotes (Jun 13, 2026), USD at $1.34/£ — all free-cancellation-era bookable now, re-quote if December prices dip.",
];
