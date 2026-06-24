// Live Airbnb research — RE-PULLED June 14, 2026 via the Airbnb MCP for the 3-base
// route (no Hakone): 8 adults, entire home, 3+ bedrooms & 2+ bathrooms on every listing.
// Airbnb quoted whole-stay totals in GBP (taxes/fees/discounts included); converted to
// USD at $1.34/£. December is peak — re-quote before booking. A static site can't price
// in real time, so each leg carries a `searchUrl` to check current Airbnb prices live.

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
  startISO: string; // check-in date "YYYY-MM-DD"
  endISO: string;   // checkout date "YYYY-MM-DD" (exclusive)
  defaultPick: string; // option id in the Budget Lock combo
  searchUrl: string; // live Airbnb search for these dates (the static-site "live prices" link)
  coord?: [number, number]; // [lat, lng] for RouteMap base camp pin
  options: StayOption[];
};

export const GROUP = 8;
export const BUDGET_CAP_PP = 525; // realistic Dec-peak target: total accommodations < $525/person
export const FX_NOTE =
  "Re-pulled June 14, 2026 via Airbnb MCP for Dec 15–21 / 21–24 / 24–29 · whole-stay totals incl. fees, USD at $1.34/£ · every option is 3+ BR / 2+ bath · December peak pricing. Tap “Check live prices” on any leg before booking.";

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
    startISO: "2026-12-15",
    endISO: "2026-12-21",
    coord: [35.6896, 139.6917],
    defaultPick: "1081600201241889397",
    searchUrl:
      "https://www.airbnb.com/s/Tokyo--Japan/homes?checkin=2026-12-15&checkout=2026-12-21&adults=8&room_types%5B%5D=Entire+home%2Fapt&min_bedrooms=3&min_bathrooms=2",
    options: [
      {
        id: "1081600201241889397",
        name: "10 guests, 4 bedrooms, 7 beds, 2 baths",
        area: "Toshima-ku (Ikebukuro)",
        url: "https://www.airbnb.com/rooms/1081600201241889397?check_in=2026-12-15&check_out=2026-12-21&adults=8",
        beds: "4BR · 7 beds · 2 baths",
        rating: "New",
        totalUSD: 1600,
        walk: "Quiet neighborhood in Toshima-ku, near Ikebukuro",
        tags: ["TOSHIMA-KU", "7 BEDS"],
        note: "Cheaper house that sleeps 10 with 4 bedrooms. It is located further out in Toshima-ku, but great for a group."
      },
      {
        id: "11981272",
        name: "4 Rooms / 3.5 Baths · 1 Stop to Shinjuku",
        area: "Nakano edge (1 stop to Shinjuku)",
        url: "https://www.airbnb.com/rooms/11981272?check_in=2026-12-15&check_out=2026-12-21&adults=8",
        beds: "4BR · 4 double beds · 3.5 baths",
        rating: "4.86★ (231) · Guest Favorite",
        totalUSD: 1668,
        walk: "One stop to Shinjuku; four double beds so the crew pairs off cleanly",
        tags: ["BUDGET LOCK PICK", "3.5 BATHS", "$209/GUY"],
        note: "Cheapest proven Tokyo whole-house for the dates: $209/guy for SIX nights, 231 reviews, and 3.5 baths kills the morning queue. Four double beds = four pairs share.",
      },
      {
        id: "1536111087299633272",
        name: "Shinjuku Entire 3-Story Home · 2 Stations",
        area: "Higashi-Shinjuku",
        url: "https://www.airbnb.com/rooms/1536111087299633272?check_in=2026-12-15&check_out=2026-12-21&adults=8",
        beds: "3BR · 6 beds · 2 baths (sleeps 9)",
        rating: "4.94★ (17) · Guest Favorite",
        totalUSD: 2027,
        walk: "Walk home from Kabukicho/Golden Gai; two stations on the doorstep",
        tags: ["WALK TO THE ACTION", "$253/GUY"],
        note: "Stumble home from Golden Gai every night — two stations at the door. $253/guy; 6 beds for 8 means two pairs share.",
      },
      {
        id: "1281683561054021099",
        name: "Newly Built Whole House · 2 min to Akihabara",
        area: "Tram one-ride to Shinjuku",
        url: "https://www.airbnb.com/rooms/1281683561054021099?check_in=2026-12-15&check_out=2026-12-21&adults=8",
        beds: "4BR · 8 beds · 2 baths",
        rating: "5.0★ (14) · Guest Favorite",
        totalUSD: 1912,
        walk: "Tram direct to Shinjuku, 2 min to Akihabara — Den-Den/arcade heaven",
        tags: ["8 BEDS", "AKIBA-ADJACENT", "$239/GUY"],
        note: "Brand-new build, eight real beds so nobody shares, and Akihabara is a 2-minute walk. $239/guy.",
      },
      {
        id: "989371479641705339",
        name: "Shinjuku 120㎡ · 10 Beds · 3-min Walk",
        area: "Ochiai (Shinjuku-ku)",
        url: "https://www.airbnb.com/rooms/989371479641705339?check_in=2026-12-15&check_out=2026-12-21&adults=8",
        beds: "3BR · 10 beds · 2 baths",
        rating: "4.97★ (110) · Guest Favorite",
        totalUSD: 2265,
        walk: "3-min walk to the metro, ~8 min into Shinjuku proper; 2 parking spots",
        tags: ["EVERYONE A BED", "110 REVIEWS"],
        note: "Ten real beds, 4.97★ across 110 stays. The 'nobody shares, nobody gambles' anchor at $283/guy.",
      },
      {
        id: "835920303549871358",
        name: "L48 Modern Whole House · Near Shinjuku",
        area: "West Shinjuku",
        url: "https://www.airbnb.com/rooms/835920303549871358?check_in=2026-12-15&check_out=2026-12-21&adults=8",
        beds: "4BR · 5 beds · 2 baths",
        rating: "4.81★ (95) · Free Wi-Fi",
        totalUSD: 2712,
        walk: "Short walk to Shinjuku; modern interior",
        tags: ["MODERN", "95 REVIEWS"],
        note: "Big modern 4BR with an early-booking discount applied, $339/guy. 5 beds = a few on futons.",
      },
      {
        id: "1097341728294996082",
        name: "Shinjuku Center Japanese-Style · 4 min Okubo",
        area: "Central Shinjuku",
        url: "https://www.airbnb.com/rooms/1097341728294996082?check_in=2026-12-15&check_out=2026-12-21&adults=8",
        beds: "4BR · 6 beds · 2 baths",
        rating: "4.93★ (106) · Guest Favorite",
        totalUSD: 3205,
        walk: "4 min to Okubo Stn, walking distance to Kabukicho — dead-center base",
        tags: ["CENTER OF IT ALL", "PREMIUM"],
        note: "Tatami-styled rooms in the literal center of Shinjuku, 4.93★ over 106 stays. $401/guy — the splurge that walks everywhere.",
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
    startISO: "2026-12-21",
    endISO: "2026-12-24",
    coord: [35.0116, 135.7681],
    defaultPick: "1573827469869098967",
    searchUrl:
      "https://www.airbnb.com/s/Kyoto--Japan/homes?checkin=2026-12-21&checkout=2026-12-24&adults=8&room_types%5B%5D=Entire+home%2Fapt&min_bedrooms=3&min_bathrooms=2",
    options: [
      {
        id: "1573827469869098967",
        name: "Toru · 5BR / 9 Beds Near Kyoto Station",
        area: "South Kyoto (near Kyoto Stn)",
        url: "https://www.airbnb.com/rooms/1573827469869098967?check_in=2026-12-21&check_out=2026-12-24&adults=8",
        beds: "5BR · 9 beds · 2.5 baths",
        rating: "4.82★ (28)",
        totalUSD: 1009,
        walk: "Excellent group house near Kyoto Station",
        tags: ["BUDGET PICK", "9 BEDS", "$126/GUY"],
        note: "Cheapest whole house with this much space in Kyoto. $126/guy."
      },
      {
        id: "40359294",
        name: "Tofukuji Traditional 2-Story Machiya",
        area: "Tofukuji (4 min to station)",
        url: "https://www.airbnb.com/rooms/40359294?check_in=2026-12-21&check_out=2026-12-24&adults=8",
        beds: "3BR · 5 double beds · 2 baths",
        rating: "4.96★ (251) · Guest Favorite",
        totalUSD: 1048,
        walk: "4 min to the station; steps from Tofukuji + one stop from Fushimi Inari",
        tags: ["BUDGET LOCK PICK", "251 REVIEWS", "$131/GUY"],
        note: "Most-reviewed Kyoto pick (251), genuine machiya, and one stop from the Dec 22 dawn Fushimi Inari raid. $131/guy — station-adjacent for the Nara/Uji launches.",
      },
      {
        id: "1573827469869098967",
        name: "Toru · 5BR / 9 Beds Near Kyoto Station",
        area: "South Kyoto (near Kyoto Stn)",
        url: "https://www.airbnb.com/rooms/1573827469869098967?check_in=2026-12-21&check_out=2026-12-24&adults=8",
        beds: "5BR · 9 beds · 2.5 baths",
        rating: "4.82★ (28) · Superhost",
        totalUSD: 1017,
        walk: "Near Kyoto Stn; five bedrooms so the squad spreads out",
        tags: ["CHEAPEST", "9 BEDS", "$127/GUY"],
        note: "Five bedrooms, nine beds, 2.5 baths and it's the cheapest of the set at $127/guy. Perfect for the Dec 24 Osaka move.",
      },
      {
        id: "1675937752566323038",
        name: "Matsu Kyoto · 4BR, Up to 9",
        area: "South Kyoto (near Kyoto Stn)",
        url: "https://www.airbnb.com/rooms/1675937752566323038?check_in=2026-12-21&check_out=2026-12-24&adults=8",
        beds: "4BR · 9 single beds · 2 baths",
        rating: "4.92★ (12) · Guest Favorite",
        totalUSD: 1168,
        walk: "Kyoto-Station side; AEON mall nearby for supplies",
        tags: ["9 SINGLE BEDS", "$146/GUY"],
        note: "Nine single beds means nobody shares and nobody fights over the double. Early-booking discount applied, $146/guy.",
      },
      {
        id: "1488154226865992298",
        name: "Toki Machiya · 3BR with Garden",
        area: "Central Kyoto",
        url: "https://www.airbnb.com/rooms/1488154226865992298?check_in=2026-12-21&check_out=2026-12-24&adults=8",
        beds: "3BR · 4 beds · 2 baths",
        rating: "5.0★ (40) · Guest Favorite",
        totalUSD: 1240,
        walk: "Central grid; private garden and two showers",
        tags: ["PRIVATE GARDEN", "5.0★"],
        note: "A perfect-5.0 machiya with its own garden — the photogenic, quiet base. $155/guy; 4 beds means futons for the rest.",
      },
      {
        id: "1014148265747662533",
        name: "Shijo 9-min · 70㎡, Up to 8",
        area: "Central (near Shijo)",
        url: "https://www.airbnb.com/rooms/1014148265747662533?check_in=2026-12-21&check_out=2026-12-24&adults=8",
        beds: "3BR · futons · 2.5 baths",
        rating: "4.92★ (153) · Guest Favorite",
        totalUSD: 1498,
        walk: "9 min to Shijo — Nishiki Market and Pontocho on foot",
        tags: ["2.5 BATHS", "153 REVIEWS"],
        note: "Walk to Nishiki and the Pontocho dinner; 2.5 baths for the morning rush. $187/guy, 153 reviews.",
      },
      {
        id: "10818914",
        name: "Ochaya Hasu · 5BR / 10 Beds Teahouse",
        area: "Central Kyoto",
        url: "https://www.airbnb.com/rooms/10818914?check_in=2026-12-21&check_out=2026-12-24&adults=8",
        beds: "5BR · 10 beds · 4 baths",
        rating: "4.96★ (292) · Guest Favorite",
        totalUSD: 1757,
        walk: "Central; a converted former teahouse with serious character",
        tags: ["292 REVIEWS", "4 BATHS", "10 BEDS"],
        note: "The most-proven Kyoto house (292 reviews): a converted ochaya with 10 beds and 4 baths. $220/guy — character maxx.",
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
    startISO: "2026-12-24",
    endISO: "2026-12-29",
    coord: [34.6684, 135.5023],
    defaultPick: "1646871133354989220",
    searchUrl:
      "https://www.airbnb.com/s/Namba--Osaka--Japan/homes?checkin=2026-12-24&checkout=2026-12-29&adults=8&room_types%5B%5D=Entire+home%2Fapt&min_bedrooms=3&min_bathrooms=2",
    options: [
      {
        id: "1646871133354989220",
        name: "Extra-large, 170㎡ villa · 7 beds",
        area: "Osaka (Namba area)",
        url: "https://www.airbnb.com/rooms/1646871133354989220?check_in=2026-12-24&check_out=2026-12-29&adults=8",
        beds: "3BR · 7 beds · 2 baths",
        rating: "5.0★ (4) · Guest Favorite",
        totalUSD: 960,
        walk: "Jacuzzi, spacious, convenient transportation",
        tags: ["BUDGET PICK", "JACUZZI", "$120/GUY"],
        note: "Stupidly cheap for a massive 170sqm house. Just $120/guy for 5 nights."
      },
      {
        id: "1334423068782122936",
        name: "Namba Whole Building · Up to 10",
        area: "Namba (5 min to JR + subway)",
        url: "https://www.airbnb.com/rooms/1334423068782122936?check_in=2026-12-24&check_out=2026-12-29&adults=8",
        beds: "3BR · 7 beds · 2 baths",
        rating: "4.89★ (37) · Superhost",
        totalUSD: 1240,
        walk: "5-min walk to both JR and subway; the whole building is yours",
        tags: ["BUDGET LOCK PICK", "WHOLE BUILDING", "$155/GUY"],
        note: "A whole building for the crew, dead central, $155/guy for 5 nights — Superhost, 37 reviews. The math engine of the plan.",
      },
      {
        id: "1473843697378876893",
        name: "Shinsaibashi 3-Story Villa",
        area: "Shinsaibashi / Namba",
        url: "https://www.airbnb.com/rooms/1473843697378876893?check_in=2026-12-24&check_out=2026-12-29&adults=8",
        beds: "4BR · 4 beds · 2.5 baths",
        rating: "4.91★ (23) · Guest Favorite",
        totalUSD: 1341,
        walk: "1 min to a Nankai station (direct to Kansai Airport); free dryer",
        tags: ["KIX DIRECT", "$168/GUY"],
        note: "Three-story villa one minute from a direct Kansai-Airport line — clean Dec 29 logistics if rail melts down. $168/guy.",
      },
      {
        id: "1461605325831572226",
        name: "Quiet 105㎡ · Namba / Sakuragawa",
        area: "Namba (Sakuragawa)",
        url: "https://www.airbnb.com/rooms/1461605325831572226?check_in=2026-12-24&check_out=2026-12-29&adults=8",
        beds: "4BR · 7 beds · 2 baths",
        rating: "5.0★ (49) · Guest Favorite",
        totalUSD: 1439,
        walk: "Quiet residential pocket one station from Namba; parking",
        tags: ["PERFECT 5.0★", "QUIET"],
        note: "A perfect-5.0 over 49 stays, quiet street, sleep-well base after Dotonbori benders. $180/guy.",
      },
      {
        id: "1142002948356768781",
        name: "In Front of Tsutenkaku · 93㎡",
        area: "Shinsekai (Ebisucho)",
        url: "https://www.airbnb.com/rooms/1142002948356768781?check_in=2026-12-24&check_out=2026-12-29&adults=8",
        beds: "4BR · 9 beds · 2 baths",
        rating: "4.97★ (119) · Guest Favorite",
        totalUSD: 1524,
        walk: "3 min to Ebisucho; Tsutenkaku + kushikatsu alley out the door",
        tags: ["9 BEDS", "SHINSEKAI", "119 REVIEWS"],
        note: "Nine beds under the Tsutenkaku tower, Janjan Yokocho kushikatsu downstairs. $191/guy, 4.97★.",
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
        note: "Most-proven Osaka house (222 reviews), 8 beds, 3 baths, the Kuromon breakfast crawl on the doorstep. $234/guy — buy peace of mind.",
      },
      {
        id: "1289483923807916387",
        name: "Walk to Dotonbori · Private Open-Air Bath",
        area: "Dotonbori-adjacent",
        url: "https://www.airbnb.com/rooms/1289483923807916387?check_in=2026-12-24&check_out=2026-12-29&adults=8",
        beds: "4BR · 9 beds · 3 baths (sleeps 13)",
        rating: "5.0★ (54) · Guest Favorite",
        totalUSD: 2958,
        walk: "Walk to Dotonbori; private open-air bath on site",
        tags: ["PRIVATE ONSEN", "5.0★", "SPLURGE"],
        note: "Your own open-air bath after a 25,000-step day, walking distance to Dotonbori, perfect-5.0 over 54 stays. $370/guy — the victory-lap splurge.",
      },
    ],
  },
];

// Budget Lock combo (the default picks above):
// $1,668 + $1,048 + $1,240 = $3,956 → ~$495/person for all 14 nights — under the $525 Dec-peak cap.
export const COMBO_NOTES = [
  "🔒 BUDGET LOCK (default picks): $3,956 total → ~$495/guy for all 14 nights — under the $525 December-peak cap, every leg a proven Guest-Favorite/Superhost with early-booking & long-stay discounts already applied.",
  "🛏️ EVERYONE-A-BED build: swap Tokyo to the 10-bed 4.97★ house + Kyoto to the 9-single-bed home + Osaka's 9-bed Tsutenkaku villa (~+$90/guy) → ~$585/guy. Nobody shares a futon the whole trip.",
  "🏮 LOCATION MAXX: Higashi-Shinjuku walk-home + Shijo/Nishiki Kyoto + Kuromon-2-min Osaka = ~$615/guy. The 'never take a late train' build.",
  "💴 Prices are live Airbnb MCP quotes (Jun 14, 2026), USD at $1.34/£, December peak. A static site can't refresh them — tap “Check live prices” on any leg to see today's Airbnb numbers before you book.",
];
