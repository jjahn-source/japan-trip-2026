export type FAQ = {
  q: string;
  a: string;
};

export const FAQS: FAQ[] = [
  {
    q: "Do we need visas?",
    a: "US passport holders get 90 days visa-free. Passport must be valid for the stay (6 months validity recommended). Fill out Visit Japan Web (vjw-lp.digital.go.jp) before flying for fast-track QR immigration + customs.",
  },
  {
    q: "Are we buying a Japan Rail Pass?",
    a: "No — and that's deliberate. The 7-day JR Pass is now ~$340 (¥50,000) and doesn't even cover the Nozomi trains we ride. Our actual point-to-point shinkansen spend is roughly $185 (¥29,600) each over the whole trip. We use an IC card (Suica/PASMO) for everything local, SmartEX for every shinkansen, and a couple of private-line tickets for day trips. No pass, no validation office, no Green Window queue.",
  },
  {
    q: "How exactly do we buy our train tickets?",
    a: "No JR Pass. Three systems: (1) IC card (Suica/PASMO in Apple/Google Wallet) — tap for every subway, local train, and bus, nationwide. (2) SmartEX app (smart-ex.jp/en) — every shinkansen: Nozomi Tokyo→Kyoto Dec 21, Shin-Osaka⇄Hiroshima Dec 25, Shin-Osaka→Himeji Dec 28, Shin-Osaka→Shinagawa Dec 29; each opens 1 month out, book the 8-seat block at 10:00 JST on opening day and bind tickets to Suica for gate tap-through. (3) Private-line tickets bought morning-of with a Suica tap or app: Odakyu Enoshima–Kamakura Freepass (~$10 / ¥1,640), Kintetsu/JR for Nara, JR Special Rapid Kyoto↔Osaka. Step-by-step in the Guide tab Runbooks.",
  },
  {
    q: "How much cash should I carry?",
    a: "~$125–190 (¥20,000–30,000) walking around, refill at 7-Eleven ATMs (24/7, take US cards). Cards and Suica handle 80% of purchases now; cash covers shrines, street stalls, tiny izakaya, and coin lockers.",
  },
  {
    q: "Is Japan expensive?",
    a: "The yen is weak (¥160 = $1) — Japan is currently CHEAPER than a comparable US trip. A great ramen is ~$7–10 (¥1,000–1,500), metro rides ~$1.10 (¥180), konbini breakfast ~$4 (¥600). The splurges (kaiseki, wagyu, ryokan) are worth their price.",
  },
  {
    q: "Will language be a problem?",
    a: "No. Train signage is bilingual, Google Translate's camera reads menus, and major-city staff handle tourist English daily. Learn 'sumimasen' (excuse me) and 'arigatō gozaimasu' (thank you) and you're at 80% effectiveness.",
  },
  {
    q: "How bad are crowds in December?",
    a: "Mid-December is one of the LIGHTER tourist windows — after autumn leaves, before New Year. Expect crowds only at: USJ on Christmas Eve (hence Express Pass), illumination spots on weekend nights, and Fushimi Inari midday (hence dawn).",
  },
  {
    q: "Can 8 people just walk into restaurants?",
    a: "Mostly no — Tokyo/Kyoto restaurants are small. Strategies: book dinners 4–6 weeks ahead (TableCheck, hotel concierge), split into two 4-tops and double your options, do famous spots at lunch (walk-ins viable), or go to izakaya chains (Torikizoku) and food halls that absorb groups.",
  },
  {
    q: "Tattoos and onsen — dealbreaker?",
    a: "Manageable. Options: private kashikiri baths (book ahead, ~$13–25 / ¥2,000–4,000), tattoo cover stickers for small pieces, dedicated tattoo-friendly baths (tattoo-friendly.jp), or Airbnb in-house tubs. Most of our soaks are at the houses or at tattoo-tolerant sento, so nobody's locked out.",
  },
  {
    q: "What about luggage on trains?",
    a: "Ship it. Yamato takkyubin (kuronekoyamato.co.jp/en) moves bags Airbnb-to-Airbnb overnight for ~$16 (¥2,500). Shinkansen oversized-luggage seats are limited and group seat blocks fill up. Travel between cities with a daypack like a genius. Big bags go Tokyo→Osaka on Dec 20–21.",
  },
  {
    q: "Is Japan safe? Like, really?",
    a: "Safest big-country tourism on Earth. Violent crime is nearly nonexistent; a lost wallet usually comes back with the cash. Actual risks: drinking-district touts (never follow one), bicycle traffic on sidewalks, and overconfidence at all-you-can-drink izakaya.",
  },
  {
    q: "Can we drink in public / what's the drinking age?",
    a: "Drinking age is 20 (bring ID for izakaya, rarely checked). Public drinking is legal — konbini chu-hai on an illumination walk is a Japanese pastime. Smoking is the opposite: illegal on most streets except marked zones.",
  },
  {
    q: "How does tipping work?",
    a: "It doesn't. Not taxis, not restaurants, not hotels, not guides. Price on the menu is the price (some izakaya add a ~$2–3 / ¥300–500 otoshi seat charge). Trying to tip causes polite panic.",
  },
  {
    q: "What power adapters do we need?",
    a: "Japan uses US-style Type A two-prong plugs at 100V. US devices plug straight in and work (chargers don't care about 100 vs 120V). Three-prong US plugs need a cheap adapter — the Airbnb hosts usually have a couple.",
  },
  {
    q: "Best way to handle 8 people's expenses?",
    a: "One Splitwise group, day one. Designate a 'group wallet' person per day for shared stuff (lockers, taxis, snack runs), log it nightly, settle in yen at the end. Never do per-item math at a register with a queue behind you.",
  },
  {
    q: "Are there laundromats?",
    a: "Coin laundries are everywhere (~$2–3 / ¥300–500 wash, ~$0.65/10min / ¥100 dry) and all our Airbnbs have washers. With 16 days, pack 8 days of clothes and do laundry twice — Kyoto-area and Osaka stops are natural laundry nights.",
  },
  {
    q: "What if someone gets separated from the group?",
    a: "Everyone has an eSIM (so: live location sharing in the group chat), everyone knows the day's house name/address in Japanese (screenshot it), and the standing rule is 'go to the day's meeting point or back to the house.' Station staff and kōban police will help anyone lost.",
  },
  {
    q: "Can we use Google Maps for everything?",
    a: "Yes — it's flawless for Japanese transit: platforms, exits, fares, even which train car puts you closest to your exit. Download offline maps for each city as backup. For walking, follow the blue dot, not your instincts, in station labyrinths.",
  },
  {
    q: "Konbini — what's the hype?",
    a: "7-Eleven, Lawson, FamilyMart are nothing like US convenience stores: restaurant-grade egg sandos, onigiri, fried chicken (Famichiki vs Karaage-kun is a real debate), ~$0.75 (¥120) coffee, ATMs, luggage shipping, concert tickets. You will average 2+ visits a day and you will be happy.",
  },
  {
    q: "Do we need to book temples in advance?",
    a: "No — temples and shrines are walk-up (a few special gardens like Saiho-ji moss temple need applications, not on our route). The advance-booking list is: teamLab, Ghibli, Nintendo Museum, USJ/Express, Shibuya Sky, SmartEX shinkansen blocks, and dinner for 8.",
  },
  {
    q: "Is the Hiroshima day trip worth 3+ hours of trains?",
    a: "Unanimously yes from everyone who's done it. The Peace Museum is one of the most important museums on Earth, and Miyajima's floating torii at sunset is a top-3 Japan sight. The Nozomi makes it painless: ~85 min each way from Shin-Osaka, ~$68 (¥10,950) reserved on SmartEX.",
  },
  {
    q: "What's open on December 25?",
    a: "Everything. Christmas isn't a public holiday in Japan — trains, museums, restaurants, shops all run normal hours. Our Hiroshima day IS Dec 25 and has zero holiday friction. Our only real holiday consideration is leaving Dec 29 before the Dec 31–Jan 3 New Year shutdown.",
  },
  {
    q: "How early should we get to the airport on Dec 29?",
    a: "Leave the Osaka house ~08:45 for the 09:30 Nozomi to Shinagawa, then transfer to the Keikyu Airport Line straight to Haneda T3 (~$2 / ¥330 tap). Aim to be airside ~3 hours before the flight — peak year-end week means longer security/immigration. Ship souvenir-heavy bags to the Haneda Yamato counter via takkyubin 2 days ahead to skip the schlep. Full runbook in the Guide tab.",
  },
  {
    q: "What should we absolutely NOT do?",
    a: "Follow a street tout into a bar (the one real tourist scam), stick chopsticks upright in rice, take photos of geiko up close, talk loudly on trains, walk and eat, jump a ticket gate when confused (ask staff — they'll wave you through), or schedule anything before 9am after a Golden Gai night.",
  },
  {
    q: "Day trip we should add if a day frees up?",
    a: "From Tokyo: Kamakura + Enoshima (Great Buddha + Enoden coast ride + Fuji over the bay) or Nikko (gilded mountain shrines, possible snow). From Osaka: Himeji Castle (the one real original castle, ~30 min by Nozomi) or Kobe (beef pilgrimage, ~20 min). Uji (Byodo-in + matcha) chains neatly onto a Nara day. All are in the Explore tab.",
  },
  {
    q: "Wait — what happened to Hakone?",
    a: "Cut. Hakone's a great trip but it's a full-day ropeway-and-weather gamble that eats a Tokyo day. We replaced it with Kamakura + Enoshima: easier point-to-point logistics on the Odakyu Enoshima–Kamakura Freepass (~$10 / ¥1,640), the Great Buddha and Hase-dera, an Enoden ride along the coast, and — on a clear December afternoon — Mt. Fuji floating over the bay. Onsen cravings get handled at the Airbnbs and city sento instead.",
  },
  {
    q: "Are any of our medications illegal in Japan? (Read this one.)",
    a: "YES, potentially. Adderall and other amphetamine-based ADHD meds are STRICTLY ILLEGAL in Japan — no import permit exists; do not bring them (Vyvanse is allowed only with an advance 'Yakkan Shomei' permit). Pseudoephedrine decongestants (regular Sudafed) over 10% are banned too. Most other prescriptions are fine up to a 1-month supply. Anyone on ADHD meds needs to talk to their doctor about a Japan-legal plan months ahead. This is the single most important line in this FAQ.",
  },
  {
    q: "Can someone with a tattoo do ANY onsen?",
    a: "Plenty. Tattoo-friendly on our route: Funaoka Onsen Kyoto (explicitly welcoming), private kashikiri rooms at day-spas (~$31 / ¥5,000 per hour, splits 4 ways), and the Airbnb private baths. Cover stickers handle small pieces at strict places. The Stay tab picks were chosen with this in mind.",
  },
  {
    q: "What happens if we miss a reserved shinkansen?",
    a: "Nothing terrible. SmartEX lets you change reservations FREE up to departure — change it from the platform the moment you know you're late, and grab the next Nozomi (they run every ~10 min until midday). No JR Pass means no validation hassle; the new seat just re-binds to your Suica.",
  },
  {
    q: "How does Suica run out / top up, and what about refunds?",
    a: "Phone Suica/PASMO tops up from Apple Pay/Google Pay in seconds, anywhere. Physical Welcome Suica can be topped up at any station machine (cash). Leftover balance: spend it down at a konbini on departure day — airport snack sweep solves the 'stranded ¥1,837' problem better than refund counters (mobile balance can't be cashed out cleanly).",
  },
  {
    q: "Suica vs PASMO vs ICOCA — does it matter which?",
    a: "No. They're all interoperable — any IC card rides every train, subway, and bus in Tokyo, Kyoto, Osaka, Hiroshima, everywhere we go, and pays at konbini. Add whichever your phone's Wallet offers first (usually Suica on iPhone, Suica or PASMO on Android). ICOCA is just the Kansai-branded version; you don't need a separate one.",
  },
  {
    q: "How do we get from Haneda to the Tokyo house on Dec 14?",
    a: "Two good options. (A) Airport Limousine Bus from HND T3 straight toward Shinjuku (~$9 / ¥1,400, ~45 min, bags loaded under the bus) — the winner for 8 guys with 16 suitcases, zero stairs. (B) Keikyu line to Shinagawa (~$2 / ¥330 tap) then JR to Shinjuku — faster and cheaper but stair-heavy with big bags. Full runbook in the Guide tab. limousinebus.co.jp/en",
  },
  {
    q: "Where do we do laundry, specifically?",
    a: "All the Airbnb picks have washers (it's a whole-house perk — one more reason over hotels). Detergent is usually provided or auto-dosing; if not, konbini sell single-use packets. Dryers are weak — start loads at night, hang the technical fabrics.",
  },
  {
    q: "Is 8 guys in one Airbnb going to annoy the neighbors?",
    a: "Only if we're loud. Japanese residential walls and patience are both thinner than ours. House rules: inside voices after 22:00, no genkan shoes past the entry step, garbage sorted exactly as the host's chart says (this is taken seriously), and the party happens OUT (that's what Ura-Namba is for). Hosts review guests — keep it clean for the next trip's account standing.",
  },
  {
    q: "Do I need cash for temples and shrines?",
    a: "Yes — ¥100 coins specifically. Omikuji fortunes (~$0.65–2 / ¥100–300), ema plaques (~$3–6 / ¥500–1,000), saisen offering toss (¥5 coin is lucky — 'go-en' puns on 'good fate'), and goshuin temple stamps (~$2–3 / ¥300–500, bring a goshuincho book if collecting — the coolest near-free souvenir of the trip).",
  },
  {
    q: "What's the deal with garbage cans? There are none.",
    a: "Correct — Japan removed most public bins decades ago, yet the streets are spotless. The rule: your trash goes home in your bag (carry a konbini bag in your daypack), or into bins AT konbini/vending machines where you bought the thing. Sorting: burnable / plastic / bottles-cans. You'll be weirdly into it by Day 3.",
  },
  {
    q: "Can we see sumo, baseball or any sports in December?",
    a: "Sumo's grand tournaments don't run mid-December (Kyushu ends in Nov), but morning practice (asageiko) viewing at Tokyo stables can be booked through tour services — genuinely awesome if the crew wants a 7am flex on Dec 16/17. Baseball is off-season. December's spectator sport is the Emperor's-Cup soccer rounds and the illuminations arms race.",
  },
  {
    q: "Should we rent pocket WiFi instead of eSIMs?",
    a: "No — 8 people tethered to one battery-powered puck that lives in someone's pocket is a leash. eSIMs (~$10–15 each for 10–20GB via Ubigi or Airalo) mean every squad can split freely, which our whole itinerary depends on. Physical-SIM phones can grab a SIM at the airport instead.",
  },
  {
    q: "What if it snows?",
    a: "Win condition. Tokyo/Osaka snow is rare (and melts fast); Kyoto gets a dusting some Decembers — if it happens, IMMEDIATELY reroute to Kinkaku-ji (gold + snow = the rarest photo in Japan) and Fushimi Inari. Trains barely notice snow; only buses suffer. The Kamakura/Enoshima coast stays mild — Fuji just looks better with a fresh cap.",
  },
  {
    q: "How do we split 8 guys across taxis?",
    a: "Tokyo/Osaka taxis legally seat 4 passengers. Two cabs, split by squad, same destination pinned in both phones (show the driver the pin — pronunciation optional). GO app is Japan's Uber. ~$9–16 (¥1,500–2,500) for typical cross-neighborhood night hops, so ~$1.50–2 (¥250–400) per guy — cheaper than American Ubers, only worth it after last train.",
  },
  {
    q: "Is the Visit Japan Web thing actually required?",
    a: "It replaces the paper immigration/customs forms — technically you can still do paper, but the QR path is the fast lane, and at HND with three widebodies landing together, fast lane matters. Do it the week before, screenshot the QRs (airport WiFi is flaky at the exact moment 400 people need it). vjw-lp.digital.go.jp",
  },
  {
    q: "Why Shinagawa and not Tokyo Station on the way to the airport Dec 29?",
    a: "Because Shinagawa is the shinkansen stop that directly touches the Keikyu Airport Line to Haneda. Ride the Nozomi only as far as Shinagawa, walk ~5 minutes to the Keikyu platform, tap your Suica (~$2 / ¥330), and you're at HND T3 in ~12 minutes. Riding all the way to Tokyo Station then backtracking wastes 30+ minutes. The Guide tab runbook has the timing.",
  },
  {
    q: "What's the cheapest way Kyoto to Osaka?",
    a: "JR Special Rapid (Shin-Kaisoku), Kyoto Station → Osaka Station, ~29 min, ~$3.60 (¥580), just tap your Suica — runs every ~15 min. The Tokaido Shinkansen Kyoto↔Shin-Osaka is faster (~15 min) but ~$9 (¥1,450) and not worth it for us. Hankyu and Keihan private lines are even cheaper (~$2.70 / ¥430) if you're already in downtown Kyoto. No JR Pass needed for any of it.",
  },
  {
    q: "Do we tip the Airbnb host or hotel cleaners?",
    a: "No — same no-tipping rule as everywhere. The way to 'tip' is a glowing review, leaving the place clean and sorted, and following the garbage chart. That's what protects the group's booking reputation for next time.",
  },
  {
    q: "Can we eat on the train?",
    a: "On the shinkansen and limited expresses: yes, gloriously — buy an ekiben (station bento) and a beer inside the station before boarding; that's the whole point of ekiben culture. On local trains and subways: no, don't. Drinks with a lid are tolerated; a full meal is not.",
  },
  {
    q: "What's the move for Nara — train and tickets?",
    a: "From Osaka: Kintetsu Nara Line, Osaka-Namba → Kintetsu-Nara, ~40 min, ~$4 (¥680) Suica tap, no reservation. From Kyoto: JR Nara Line, ~45 min, ~$5 (¥720). Chain Uji (Byodo-in + matcha) on the JR line between Kyoto and Nara if you want a double. Buy deer crackers (~$1.20 / ¥200) from licensed vendors; the deer bow, then mug you. Coin lockers at both Nara stations.",
  },
];
