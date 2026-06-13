export type Tip = {
  title: string;
  emoji: string;
  body: string;
};

export const TIPS: Tip[] = [
  {
    title: "Moving 8 people is a sport",
    emoji: "🧭",
    body: "Default to 'split squads, sync points': pick a meeting spot + time, let pairs roam. Share live locations in a group chat. On trains, board the same car number. One person buys group tickets to avoid 8 separate transactions.",
  },
  {
    title: "No JR Pass — and that's the smart move",
    emoji: "🧮",
    body: "The 7-day pass is ~$340 (¥50,000) and doesn't cover Nozomi. Our actual point-to-point shinkansen spend is ~$185 (¥29,600) each, all on Nozomi, all reservable in-app. Skip the pass: IC card for local, SmartEX for shinkansen, a few private-line tickets for day trips.",
  },
  {
    title: "How we buy every train (the whole tutorial)",
    emoji: "🚄",
    body: "Three systems, no pass. (1) Suica/PASMO in your phone wallet — tap every subway, bus, and local train. (2) SmartEX app for all shinkansen (Tokyo→Kyoto Dec 21, Hiroshima r/t Dec 25, Himeji Dec 28, Shin-Osaka→Shinagawa Dec 29) — book each 8-seat block the day its 1-month window opens, tickets bind to your Suica for tap-through. (3) Private-line tickets morning-of: Odakyu Enoshima–Kamakura Freepass, Kintetsu/JR Nara, JR Special Rapid Kyoto↔Osaka. Full runbook in the Guide tab.",
  },
  {
    title: "Suica is life",
    emoji: "💳",
    body: "Add Suica (or PASMO) to Apple/Google Wallet before landing — tap onto every metro, bus, and konbini purchase. Top up with a credit card in the wallet app, ~$31 (¥5,000) at a time. Physical Welcome Suica from the airport works too (28-day validity, no deposit).",
  },
  {
    title: "HND → Shinjuku: bus beats train for the squad",
    emoji: "🛬",
    body: "With 16 suitcases, take the Airport Limousine Bus from Haneda T3 toward Shinjuku (~$9 / ¥1,400, ~45 min) — bags ride underneath, zero stairs. The Keikyu→JR route is faster and cheaper (~$2 / ¥330 + ~$4 / ¥620) but stair-heavy with big bags. limousinebus.co.jp/en",
  },
  {
    title: "Reservations or starvation (for 8)",
    emoji: "🍽️",
    body: "Parties of 8 cannot walk in. Book dinner spots 4–6 weeks out via TableCheck/hotel concierge, or split into two tables of 4 and double your options. Lunch is way easier — do the famous spots at noon.",
  },
  {
    title: "December darkness is a feature",
    emoji: "🌆",
    body: "Sunset is ~16:30. Plan temples/markets in the morning, observation decks at 16:00, illuminations after 17:00. Every city on our route has a major light festival running — evenings are automatically epic.",
  },
  {
    title: "Ship your luggage, travel free",
    emoji: "🧳",
    body: "Yamato 'takkyubin' (~$16 / ¥2,500 per bag) ships suitcases Airbnb-to-Airbnb overnight. Send big bags Tokyo→Osaka on Dec 20–21 and carry a 3-day daypack through Kyoto. Any konbini counter arranges it. Shinkansen oversized luggage needs reserved space otherwise. kuronekoyamato.co.jp/en",
  },
  {
    title: "Cash etiquette quickies",
    emoji: "🙇",
    body: "No tipping — ever. Put money in the tray, not hands. Don't eat while walking (stand by the stall). Escalators: stand left in Tokyo, RIGHT in Osaka. Quiet voices on trains, phones on silent.",
  },
  {
    title: "Konbini = secret weapon",
    emoji: "🍙",
    body: "7-Eleven ATMs accept foreign cards (24/7). Breakfast for 8 in five minutes: egg sandos, onigiri, hot coffee (~$0.75 / ¥120). Lawson's karaage-kun and Famichiki settle any late-night debate.",
  },
  {
    title: "Tax-free shopping",
    emoji: "🛍️",
    body: "Spend ~$31+ (¥5,000) in one store, show your physical passport, skip the 10% tax. Don Quijote and Bic Camera have dedicated counters. Keep tax-free goods accessible (not shipped) until you clear airport customs.",
  },
  {
    title: "December 25 is a normal day",
    emoji: "🎄",
    body: "Christmas in Japan = date night + KFC (seriously — pre-order if you want the bucket). Nothing closes; trains run normally — our Hiroshima day IS the 25th and has zero friction. New Year (Dec 31–Jan 3) is the big shutdown and we leave Dec 29, just before it — great timing.",
  },
  {
    title: "Coin locker doctrine",
    emoji: "🔐",
    body: "Every major station has IC-card lockers (~$2.50–5 / ¥400–800). Day-trip move: dump daypacks at the destination station, roam free, collect on return. Nara, Miyajima, Himeji, Uji, Kamakura and Fujisawa all have them at the station — nobody carries a bag up a mountain.",
  },
  {
    title: "Kamakura + Enoshima > a ropeway gamble",
    emoji: "🗻",
    body: "Our Tokyo day trip is Kamakura + Enoshima, not Hakone. Buy the Odakyu Enoshima–Kamakura Freepass at Shinjuku (~$10 / ¥1,640): round-trip Odakyu + unlimited Enoden. Great Buddha, Hase-dera, the coastal Enoden ride, and Fuji over the bay on a clear December afternoon. Easier logistics, no weather roulette.",
  },
  {
    title: "Queue culture is a skill",
    emoji: "🚶",
    body: "Lines form at painted marks on platforms and at ramen doors. The system: one person can NOT hold a table/spot for 7 missing guys — be physically present. For famous food queues, send the whole squad or pick somewhere else.",
  },
  {
    title: "Buy your sunset spot",
    emoji: "🌇",
    body: "Sunset is 16:30; observation decks 'sell' the good hour. Shibuya Sky and Umeda's roof both reward arriving 45 min before golden hour. Free alternatives: Tokyo Metropolitan Gov't Building (Shinjuku, free 45F deck) and any river bridge at dusk.",
  },
  {
    title: "Goshuin: the collectible save file",
    emoji: "🖌️",
    body: "Buy a goshuincho stamp book (~$9 / ¥1,500) at Senso-ji or Meiji Shrine on day 2-3. Every temple/shrine hand-brushes a calligraphy page (~$2–3 / ¥300–500). By Dec 29 it's the best object anyone brings home. Speedrunners note: windows close ~16:00.",
  },
  {
    title: "Shoes: the silent boss",
    emoji: "👟",
    body: "20,000+ steps/day, every day, on hard city pavement. Broken-in cushioned sneakers ONLY — and slip-on-able ones, because temples, izakaya tatami rooms, and the Airbnbs all demand shoes-off. Laces you have to retie 9 times a day are a 16-day tax.",
  },
  {
    title: "Phone battery is group infrastructure",
    emoji: "🔋",
    body: "Suica, tickets, maps, translation and the group chat all live on phones that die by 19:00 in cold weather. Two 10,000mAh banks per squad minimum. Konbini sell emergency chargers but at pride-wounding prices.",
  },
  {
    title: "The 16:00 konbini coffee rule",
    emoji: "☕",
    body: "Afternoon slump at temple #3 is real. The fix is institutional: 16:00, nearest konbini, hot coffee or royal milk tea, 10-minute regroup. Costs ~$0.90 (¥150) and saves every evening plan from mutiny.",
  },
  {
    title: "Don Quijote is a trap (a beloved trap)",
    emoji: "🐧",
    body: "Donki at midnight sells everything from Wagyu jerky to knockoff katanas. Strategy: night-one walk-through with wallets CLOSED, final-night tax-free boss run with a list. Inverting this order has bankrupted better men.",
  },
  {
    title: "SmartEX is your only shinkansen tool",
    emoji: "📲",
    body: "Register at smart-ex.jp/en this summer, add a credit card, and link each guy's Suica number so tickets bind to the phone and gates just open. Reservations open exactly 1 month out at 10:00 JST — set calendar alarms for each of our four legs. Changes are free up to departure; re-book from the platform if you're late.",
  },
  {
    title: "Hot vending machines are December's gift",
    emoji: "🥫",
    body: "The red-label rows in vending machines are HEATED — corn soup, hot lemon, royal milk tea, café au lait, ~$0.80 (¥130) hand-warmers you can drink. Pay with Suica. Look for あたたかい (atatakai = warm). Stock the squad pouch and dispense on temple stairs.",
  },
  {
    title: "Eat on the shinkansen, not the local train",
    emoji: "🍱",
    body: "Buy an ekiben + a beer INSIDE the station before boarding any shinkansen — eating is encouraged and the bento are excellent (Tokyo Station's GRANSTA hall is a destination). On local trains and subways: don't eat. Lap the food hall once before buying; never grab the first bento you see.",
  },
  {
    title: "Visit Japan Web before you fly",
    emoji: "🛂",
    body: "Each guy fills Immigration + Customs at vjw-lp.digital.go.jp the week before (~10 min), then SCREENSHOTS the QR codes. At HND you walk the QR fast lane while the paper-form crowd waits. Airport WiFi dies right when 400 people need it — screenshots, not live load.",
  },
  {
    title: "The Dec 29 exit is sacred: Shinagawa, not Tokyo Station",
    emoji: "🛫",
    body: "Leave the Osaka house ~08:45 for the 09:30 Nozomi to SHINAGAWA (not Tokyo Station — Shinagawa touches the Haneda line). At Shinagawa, ~5-min walk to Keikyu Airport Line, tap Suica (~$2 / ¥330), HND T3 in ~12 min. Set two alarms for the Nov 29 SmartEX booking window.",
  },
  {
    title: "Decline 'pay in USD' at every terminal",
    emoji: "💴",
    body: "When a card reader asks USD or JPY, always choose JPY. 'Pay in your home currency' (dynamic currency conversion) skims 5–8%. Bring a no-foreign-transaction-fee card (Wise, Schwab, most travel cards) and you never think about it.",
  },
  {
    title: "Onsen/sento soak once per city",
    emoji: "♨️",
    body: "Feet take 20k+ steps daily — schedule one bath per city. A neighborhood sento is ~$3 (¥500); a fancy super-sento like Thermae-Yu Shinjuku is more. Wash THEN soak, small towel never in the water, drink the cold milk after. Tattooed crew: cover stickers or a private kashikiri room (~$31/h / ¥5,000, splits 4 ways).",
  },
  {
    title: "Kyoto buses: flat fare, regular routes",
    emoji: "🚌",
    body: "Central Kyoto buses are a flat ~$1.40 (¥230) — board rear, tap IC, tap again exiting front. Skip the sardine-packed 100-series tourist buses; the regular 205/206 hit the same stops emptier. Or just walk/subway — Kyoto's grid is friendlier on foot than its bus map suggests.",
  },
  {
    title: "Lost something? It comes back.",
    emoji: "🚓",
    body: "Left a phone on the train or dropped a wallet? File at the nearest kōban (police box) or the station office same-day with the line/car/time. Japan's return rate is legendary — wallets come back with the cash. Don't spiral; report it and keep moving.",
  },
];
