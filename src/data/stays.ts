// Live Airbnb research — searched June 12, 2026 for our exact dates, 8 adults,
// entire home, 2+ bathrooms required on every listing.
// All prices are the WHOLE-STAY total for the house (taxes/fees/discounts included),
// converted to USD at $1.34/£ from Airbnb's quoted totals. Re-quote before booking.

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
  brief: string; // what matters for this leg
  defaultPick: string; // option id in the Budget Lock combo
  options: StayOption[];
};

export const GROUP = 8;
export const BUDGET_CAP_PP = 360; // hard target: total accommodations < $360/person
export const FX_NOTE =
  "Quotes pulled June 12, 2026 · whole-stay totals incl. fees · converted at $1.34/£ · every option has 2+ bathrooms · prices move, re-quote before booking";

export const STAY_LEGS: StayLeg[] = [
  {
    id: "tokyo1",
    city: "Tokyo",
    cityJp: "東京",
    dates: "Dec 15–19",
    nights: 4,
    emoji: "🌃",
    brief:
      "The big one — 4 nights, Shinjuku orbit. Every option below is in or touching Shinjuku-ku. Pick your fighter: closest vs cheapest.",
    defaultPick: "1649745054647737772",
    options: [
      {
        id: "1395033610971735241",
        name: "Shinjuku Center 85㎡ House",
        area: "Shin-Okubo (Shinjuku-ku)",
        url: "https://www.airbnb.com/rooms/1395033610971735241?check_in=2026-12-15&check_out=2026-12-19&adults=8",
        beds: "3BR · 6 beds · 2 baths, 2 toilets",
        rating: "4.98★ (58)",
        totalUSD: 1920,
        walk: "2-min walk to Shin-Okubo Stn — one Yamanote stop / 15-min walk to Kabukicho",
        tags: ["CLOSEST", "GUEST FAVORITE"],
        note: "Private elevator, bathtubs in both baths. The 'stumble home from Golden Gai' option. Costs the budget crown.",
      },
      {
        id: "1649745054647737772",
        name: "ZLH34F Shinjuku Business District Apt",
        area: "Ochiai (Shinjuku-ku)",
        url: "https://www.airbnb.com/rooms/1649745054647737772?check_in=2026-12-15&check_out=2026-12-19&adults=8",
        beds: "3BR · 6 beds · 2 baths",
        rating: "New listing — no reviews yet",
        totalUSD: 1036,
        walk: "Near metro, ~10 min into Shinjuku Stn — still Shinjuku-ku",
        tags: ["BUDGET LOCK PICK", "CHEAPEST IN SHINJUKU-KU"],
        note: "The price that makes the whole $360 math work. Risk: zero reviews. Free cancellation = book it, watch it, bail if reviews go sideways.",
      },
      {
        id: "11981272",
        name: "4 Baths / 4 Rooms, 1 Stop from Shinjuku",
        area: "Hatsudai (Shibuya-ku border)",
        url: "https://www.airbnb.com/rooms/11981272?check_in=2026-12-15&check_out=2026-12-19&adults=8",
        beds: "4BR · 4 double beds · 3.5 baths",
        rating: "4.86★ (229)",
        totalUSD: 1151,
        walk: "Keio New Line: literally one stop (2 min) to Shinjuku Stn",
        tags: ["SAFEST BET", "3.5 BATHS"],
        note: "229 reviews, 3.5 bathrooms for 8 dudes = zero morning queue. Catch: 4 double beds means pairing up.",
      },
      {
        id: "1281006715790331949",
        name: "Shinjuku 3-min · 100m² · 2 Showers",
        area: "Hatagaya",
        url: "https://www.airbnb.com/rooms/1281006715790331949?check_in=2026-12-15&check_out=2026-12-19&adults=8",
        beds: "3BR · 7 beds · 2.5 baths",
        rating: "4.88★ (97) · Superhost",
        totalUSD: 1290,
        walk: "3 min by train to Shinjuku, parking if anyone rents a van",
        tags: ["SUPERHOST"],
        note: "Big proven house with real beds for 7 + a futon. The all-rounder.",
      },
      {
        id: "1205708928645536818",
        name: "110㎡ Home-Theater House",
        area: "Nakai / Ochiai",
        url: "https://www.airbnb.com/rooms/1205708928645536818?check_in=2026-12-15&check_out=2026-12-19&adults=8",
        beds: "2BR · 6 beds · 2 baths (sleeps 12)",
        rating: "4.98★ (52)",
        totalUSD: 1337,
        walk: "3-min walk to station, 6 min to Shinjuku by train, konbini 2 min",
        tags: ["HOME THEATER"],
        note: "Movie wall + 110㎡ of hangout space. The 'one quiet night in' insurance policy.",
      },
      {
        id: "1081600201241889397",
        name: "Ninja House",
        area: "Ikebukuro side (NOT Shinjuku)",
        url: "https://www.airbnb.com/rooms/1081600201241889397?check_in=2026-12-15&check_out=2026-12-19&adults=8",
        beds: "4BR · 7 beds · 2 baths (sleeps 10)",
        rating: "4.78★ (54) · Superhost",
        totalUSD: 913,
        walk: "Ikebukuro orbit — 10–15 min by train to Shinjuku",
        tags: ["ABSOLUTE CHEAPEST", "IT'S A NINJA HOUSE"],
        note: "Breaks the 'nearest Shinjuku' rule but saves another $15/guy and it is literally ninja-themed. Filed under: tempting.",
      },
    ],
  },
  {
    id: "hakone",
    city: "Hakone",
    cityJp: "箱根",
    dates: "Dec 19–20",
    nights: 1,
    emoji: "🗻",
    brief:
      "Ryokan night → villa night. We trade the $220/head kaiseki ryokan for a whole mountain house + the Guide tab's sento/day-onsen plan. Onsen still happens — Hakone Yumoto day baths are ¥1,000–2,000.",
    defaultPick: "52940144",
    options: [
      {
        id: "52940144",
        name: "Miyanoshita Large Villa",
        area: "Miyanoshita (mid Tozan line)",
        url: "https://www.airbnb.com/rooms/52940144?check_in=2026-12-19&check_out=2026-12-20&adults=8",
        beds: "2BR · 10 beds · 3 baths",
        rating: "4.71★ (107) · Superhost",
        totalUSD: 389,
        walk: "7 min from Miyanoshita Stn, right on the Hakone loop, near a hot spring",
        tags: ["BUDGET LOCK PICK", "CHEAPEST"],
        note: "$49/guy to sleep ON the Hakone Tozan railway line. Day-use onsen nearby covers the soak.",
      },
      {
        id: "47223994",
        name: "Hakone-Yumoto Villa (10P)",
        area: "Hakone-Yumoto",
        url: "https://www.airbnb.com/rooms/47223994?check_in=2026-12-19&check_out=2026-12-20&adults=8",
        beds: "3BR · 8 beds · 2 baths",
        rating: "4.82★ (200) · Superhost",
        totalUSD: 442,
        walk: "Yumoto village — onsen street, Romancecar terminus, easiest logistics",
        tags: ["SAFEST BET", "200 REVIEWS"],
        note: "Walk to Hakone Yuryo / Tenzan day-onsen, stumble home. $55/guy.",
      },
      {
        id: "1296256753423749209",
        name: "Villa with PRIVATE Hot Spring",
        area: "Sengokuhara",
        url: "https://www.airbnb.com/rooms/1296256753423749209?check_in=2026-12-19&check_out=2026-12-20&adults=8",
        beds: "3BR · 8 futons · 3 baths",
        rating: "4.94★ (88)",
        totalUSD: 705,
        walk: "Sengokuhara plateau — needs the bus, rewards you with your own onsen",
        tags: ["PRIVATE ONSEN", "TATTOO-PROOF"],
        note: "Our own hot spring = no tattoo rules, no quiet hours, 8-man soak summit. +$40/guy over the budget pick.",
      },
      {
        id: "1385888976541278210",
        name: "Private Sauna + Fuji View House",
        area: "Hakone highlands",
        url: "https://www.airbnb.com/rooms/1385888976541278210?check_in=2026-12-19&check_out=2026-12-20&adults=8",
        beds: "4BR · 8 beds · 2 baths · max 8",
        rating: "4.95★ (64)",
        totalUSD: 773,
        walk: "Built for exactly 8 people, Fuji from the window, private sauna",
        tags: ["SAUNA", "FUJI VIEW"],
        note: "The vibes-maximalist option: sauna → cold December air → repeat. $97/guy.",
      },
    ],
  },
  {
    id: "kyoto",
    city: "Kyoto",
    cityJp: "京都",
    dates: "Dec 20–24",
    nights: 4,
    emoji: "⛩️",
    brief:
      "4 nights. Kyoto is compact — anywhere inside the grid works; Higashiyama/Kawaramachi proximity is the premium.",
    defaultPick: "28919086",
    options: [
      {
        id: "28919086",
        name: "[BI] Lovely Kyoto House",
        area: "Nijo (12 min to castle)",
        url: "https://www.airbnb.com/rooms/28919086?check_in=2026-12-20&check_out=2026-12-24&adults=8",
        beds: "3BR · 5 beds · 2 baths (sleeps 9)",
        rating: "4.80★ (320)",
        totalUSD: 571,
        walk: "Quiet machiya lane, 12 min to Nijo Stn, bus lines to everything",
        tags: ["BUDGET LOCK PICK", "CHEAPEST", "320 REVIEWS"],
        note: "$71/guy for 4 Kyoto nights is absurd. Catch: 5 beds + futons — Japan-style sleeping for a few.",
      },
      {
        id: "877054887556595789",
        name: "Traditional Shōwa-Style House",
        area: "Kyoto center (west of Horikawa)",
        url: "https://www.airbnb.com/rooms/877054887556595789?check_in=2026-12-20&check_out=2026-12-24&adults=8",
        beds: "4BR · 7 beds · 2 baths",
        rating: "4.79★ (87) · Superhost",
        totalUSD: 908,
        walk: "Central grid — walk/bus to Nishiki in ~15",
        tags: ["RETRO JAPAN", "30% OFF NOW"],
        note: "Actual old-Japan interior without old-Japan plumbing. $114/guy.",
      },
      {
        id: "25694193",
        name: "Kiyomizu Gate House",
        area: "Higashiyama (1 min from Kiyomizu-dera!)",
        url: "https://www.airbnb.com/rooms/25694193?check_in=2026-12-20&check_out=2026-12-24&adults=8",
        beds: "4BR · 10 beds · 4.5 baths",
        rating: "4.62★ (165)",
        totalUSD: 1281,
        walk: "Wake up INSIDE the postcard — Sannenzaka before the tour buses exist",
        tags: ["LOCATION CHEAT CODE", "4.5 BATHS"],
        note: "Lowest rating of the set (4.62) but the location is a genuine itinerary upgrade. $160/guy.",
      },
      {
        id: "1573827469869098967",
        name: "(Toru) Kyoto Station House",
        area: "South of Kyoto Stn",
        url: "https://www.airbnb.com/rooms/1573827469869098967?check_in=2026-12-20&check_out=2026-12-24&adults=8",
        beds: "5BR · 9 beds · 2.5 baths, 3 toilets",
        rating: "4.82★ (28) · Superhost",
        totalUSD: 1297,
        walk: "Built for groups — 9 real beds. Near the shinkansen for the Osaka hop",
        tags: ["9 REAL BEDS"],
        note: "Everyone gets a bed and a luggage launchpad by the station. $162/guy.",
      },
    ],
  },
  {
    id: "osaka",
    city: "Osaka",
    cityJp: "大阪",
    dates: "Dec 24–28",
    nights: 4,
    emoji: "🐙",
    brief:
      "4 nights in the Namba blast radius — Christmas Eve on Dotonbori, USJ day, Hiroshima day trip, crab finale.",
    defaultPick: "1002551612839197497",
    options: [
      {
        id: "1002551612839197497",
        name: "(Yuji) Renovated House",
        area: "Daikokucho — 1 stop south of Namba",
        url: "https://www.airbnb.com/rooms/1002551612839197497?check_in=2026-12-24&check_out=2026-12-28&adults=8",
        beds: "3BR · 7 beds · 2 shower rooms",
        rating: "4.79★ (77)",
        totalUSD: 568,
        walk: "1 metro stop (or 15-min walk) to Namba/Dotonbori",
        tags: ["BUDGET LOCK PICK", "CHEAPEST"],
        note: "Fully renovated, $71/guy for Christmas week in Osaka. The math engine of the whole plan.",
      },
      {
        id: "1655686458120297026",
        name: "89m² · 3 Showers · 3 Toilets",
        area: "Nihonbashi / Kuromon",
        url: "https://www.airbnb.com/rooms/1655686458120297026?check_in=2026-12-24&check_out=2026-12-28&adults=8",
        beds: "3BR · 7 beds · 3 baths",
        rating: "5.0★ (4 — brand new)",
        totalUSD: 694,
        walk: "5 min to Nihonbashi Stn, 7–12 min WALK to Dotonbori + Kuromon Market",
        tags: ["WALK TO DOTONBORI", "3 SHOWERS"],
        note: "Kuromon breakfast crawl = downstairs. Only 4 reviews so far, all 5★. $87/guy.",
      },
      {
        id: "1462940833260665958",
        name: "110㎡ House, Sleeps 12",
        area: "South Namba",
        url: "https://www.airbnb.com/rooms/1462940833260665958?check_in=2026-12-24&check_out=2026-12-28&adults=8",
        beds: "4BR · 7 beds · 3 baths",
        rating: "4.92★ (61)",
        totalUSD: 757,
        walk: "Near Namba + direct airport line",
        tags: ["SPACE FOR DAYS"],
        note: "Room to spread out the Don Quijote haul before repacking. $95/guy.",
      },
      {
        id: "34764282",
        name: "Ruo Ye Xi House 'Room 401'",
        area: "Kuromon Market — 2 min",
        url: "https://www.airbnb.com/rooms/34764282?check_in=2026-12-24&check_out=2026-12-28&adults=8",
        beds: "3BR · 8 beds · 2 baths, 2 toilets · 101m²",
        rating: "4.98★ (222)",
        totalUSD: 1506,
        walk: "Kuromon 2 min, Nihonbashi Stn 3 min — premium location, premium reviews",
        tags: ["PREMIUM", "222 REVIEWS AT 4.98"],
        note: "The best-reviewed big house in the Namba zone. $188/guy — the splurge.",
      },
    ],
  },
  {
    id: "tokyo2",
    city: "Tokyo",
    cityJp: "東京",
    dates: "Dec 28–29",
    nights: 1,
    emoji: "🎤",
    brief:
      "One final night. Finale day is Shinjuku (Don Quijote boss run, Thermae-Yu, farewell sukiyaki, Golden Gai encore) — sleep close or sleep cheap.",
    defaultPick: "1370273045237216420",
    options: [
      {
        id: "1370273045237216420",
        name: "2025-Built Detached Villa",
        area: "North Tokyo (JR 5 min)",
        url: "https://www.airbnb.com/rooms/1370273045237216420?check_in=2026-12-28&check_out=2026-12-29&adults=8",
        beds: "3BR · 8 beds · 2 baths",
        rating: "4.83★ (29) · Superhost",
        totalUSD: 295,
        walk: "~15 min by JR into Shinjuku — brand-new build",
        tags: ["BUDGET LOCK PICK", "CHEAPEST", "$37/GUY"],
        note: "Last-night logic: we're out by 11am for Haneda anyway. $37/guy keeps the total under the cap.",
      },
      {
        id: "1259741081828484036",
        name: "Shinjuku-Area House, 5 min to Shinjuku",
        area: "East Nakano",
        url: "https://www.airbnb.com/rooms/1259741081828484036?check_in=2026-12-28&check_out=2026-12-29&adults=8",
        beds: "2BR · 6 beds · 2 baths",
        rating: "4.85★ (60) · Superhost",
        totalUSD: 449,
        walk: "5 min by train to Shinjuku — the comfortable middle",
        tags: ["SAFEST BET"],
        note: "Superhost, close, painless. $56/guy.",
      },
      {
        id: "918426752241708524",
        name: "Shin-Okubo Luxury 4BR Apartment",
        area: "Shin-Okubo (Shinjuku-ku)",
        url: "https://www.airbnb.com/rooms/918426752241708524?check_in=2026-12-28&check_out=2026-12-29&adults=8",
        beds: "4BR · 7 beds · 2 baths",
        rating: "4.74★ (38) · Superhost",
        totalUSD: 610,
        walk: "2 min from Shin-Okubo — stagger home from the Golden Gai encore",
        tags: ["CLOSEST"],
        note: "Maximum proximity for the last dance. $76/guy.",
      },
      {
        id: "1660844423024702206",
        name: "Shinjuku 9-min House, 3 Baths",
        area: "West Shinjuku orbit",
        url: "https://www.airbnb.com/rooms/1660844423024702206?check_in=2026-12-28&check_out=2026-12-29&adults=8",
        beds: "3BR · 6 beds · 3 baths",
        rating: "New listing · Superhost",
        totalUSD: 465,
        walk: "9 min to Shinjuku, 3 bathrooms for the final-morning shower rush",
        tags: ["3 BATHS"],
        note: "Pre-flight shower logistics for 8 actually matter. $58/guy.",
      },
    ],
  },
];

// Budget Lock combo (the defaults above):
// $1,036 + $389 + $571 + $568 + $295 = $2,859 → $357/person for all 14 nights. UNDER CAP.
export const COMBO_NOTES = [
  "🔒 BUDGET LOCK (default picks): $2,859 total → ~$357/guy. Under the $360 cap with whole houses + 2 baths everywhere.",
  "🛡️ SAFEST BET swap: trade Tokyo for the 229-review Hatsudai house (+$14/guy) → ~$372/guy. $12 over cap — crew vote.",
  "🥷 DEGENERATE swap: Ninja House Tokyo (−$15/guy) → ~$342/guy and you live in a ninja house. Rule bent: it's Ikebukuro.",
  "📌 Every option is free-cancellation-era bookable NOW. Lock the Budget Lock set today, upgrade legs later if December prices dip.",
];
