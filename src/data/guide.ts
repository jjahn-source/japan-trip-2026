export type GuideArticle = {
  title: string;
  emoji: string;
  body: string[]; // paragraphs / bullet-ish lines
};

export type GuideSection = {
  id: string;
  title: string;
  emoji: string;
  intro: string;
  articles: GuideArticle[];
};

export const GUIDE: GuideSection[] = [
  {
    id: "transport",
    title: "Getting Around",
    emoji: "🚄",
    intro: "Japan's transit is the best on Earth — once you know the rules. We are NOT buying a Japan Rail Pass (it lost to point-to-point years ago for a Tokyo-Kansai loop). Our system is three things: IC card (Suica/PASMO) for everything local, SmartEX for every shinkansen, and Yamato for the bags. Prices in USD at ¥160 = $1.",
    articles: [
      {
        title: "Why no JR Pass — the math, settled",
        emoji: "🧮",
        body: [
          "The 7-day JR Pass is now ~$340 (¥50,000). Our actual reserved-seat shinkansen spend over the whole trip is roughly $185 (¥29,600) per person: Tokyo→Kyoto + Kyoto/Osaka locals + Osaka⇄Hiroshima + Osaka→Himeji + the Dec 29 exit. The pass loses by ~$155 (¥24,800) each, and it doesn't even cover Nozomi (the fast trains we actually ride).",
          "Point-to-point also means we ride Nozomi (the fastest service), reserve specific seats (Fuji side), and change trains free in-app. The pass forces slower Hikari/Kodama and can't touch the private lines (Odakyu, Kintetsu, Enoden) we use for day trips anyway.",
          "Bottom line: IC card + SmartEX + a few private-line tickets. No pass, no Green Window queue, no validation office. This guide is the full runbook for that system.",
        ],
      },
      {
        title: "IC Cards (Suica / PASMO / ICOCA) — your tap-everything wallet",
        emoji: "💳",
        body: [
          "Add Suica (or PASMO) to Apple Wallet or Google Wallet BEFORE you land (Wallet app → + → Transit Card → Suica). Top up with your credit card in seconds, no Japanese needed. iPhone taps gates even on a near-dead battery (Express Mode is on by default).",
          "Physical alternative if your phone lacks FeliCa: Welcome Suica at Haneda/Narita arrivals counters and machines (valid 28 days, no deposit, no name needed). In Kansai the local card is ICOCA, in Tokyo PASMO — all of them are fully interoperable, so one card rides every train, subway, and bus nationwide.",
          "Tap in AND out of every gate. Balance too low at the exit? Use the orange 'Fare Adjustment' (seisanki) machine inside the gates — never jump them, never panic, staff at the manned gate also fix it in 10 seconds.",
          "It's also money: konbini, vending machines, coin lockers, many restaurants and izakaya. Load $31 (¥5,000) at a time and stop thinking about it. How-to: https://www.jreast.co.jp/multi/en/welcomesuica/",
          "Mobile Suica top-up limit is $125 (¥20,000) stored. You can't transfer mobile Suica balance between phones, so each guy runs his own. PASMO works identically — pick whichever your Wallet offers first.",
        ],
      },
      {
        title: "Shinkansen — the no-pass way, on SmartEX",
        emoji: "🚅",
        body: [
          "Book everything on SmartEX (smart-ex.jp/en) — the official Tokaido/Sanyo online reservation. It covers every intercity leg we take. Register a credit card once, add each guy's IC card number, and your reservation BINDS to the Suica so the gate just opens on a tap. No paper ticket, no machine pickup.",
          "Reserve seats — for 8 people, grab two facing-direction rows of 2+3 or book the moment the window opens for a clean block. Unreserved cars (1–3) exist but splitting 8 across standing room in holiday week is misery.",
          "Seat tip: westbound Tokyo→Kyoto, sit on the RIGHT side (seats D/E) for Mt. Fuji around Shin-Fuji, ~40 min in. Clear December mornings make this a real event — eastbound on the Dec 29 return, Fuji is on the LEFT (A/B/C).",
          "Large suitcases (>160cm combined) legally need the 'oversized baggage' seats at car ends — reservable free on SmartEX, but limited. Better: ship the big bags via Yamato (below) and board with a daypack.",
          "Buy ekiben + drinks INSIDE the station before boarding. Eating on the shinkansen: encouraged and delicious. On local trains: no. Trains leave ON THE SECOND; doors close ~15 seconds early. Be on the platform 5 minutes ahead at your car-number marker.",
        ],
      },
      {
        title: "Tokyo metro & JR without tears",
        emoji: "🗺️",
        body: [
          "Google Maps is genuinely flawless in Japan — exact platform numbers, car positions, exit numbers, fares in yen. Trust it completely; it even tells you which car door lands nearest your exit.",
          "Tokyo has two subway companies (Tokyo Metro + Toei) plus JR plus private lines — your one IC card covers all of them, so you never think about it. Just tap and ride.",
          "Exits matter more than lines. Shinjuku has 200+, Tokyo Station ~100. The gap between Exit A4 and B12 can be a 15-minute underground walk. Read the exit number Google gives you BEFORE surfacing.",
          "Rush hours: 7:30–9:00 and 17:30–19:00. With 8 guys + luggage, just don't — plan moves for 10:00–16:00. Last trains run ~midnight–00:30 and they are FINAL. After that it's taxis (fine split 8 ways across 2 cabs) or karaoke until 5am (a time-honored strategy).",
          "Women-only cars (pink signs) run during morning rush on some lines — gents, check the platform marking before boarding.",
        ],
      },
      {
        title: "Luggage shipping (takkyubin) — the cheat code",
        emoji: "🧳",
        body: [
          "Yamato Transport (kuronekoyamato.co.jp/en) ships a suitcase Airbnb-to-Airbnb overnight for ~$16–18 (¥2,500–2,800). Hand it to any konbini counter or have the host arrange pickup by ~10am; it arrives at the next place that evening or next morning.",
          "Our play: ship the big bags Tokyo→Osaka house on Dec 20–21 and carry a 3-day daypack through Kyoto. Then optionally Osaka→Haneda on Dec 27 so the Dec 29 exit is hands-free.",
          "Konbini accept takkyubin drop-offs including straight to airport counters (give 2 days for airport delivery). Magic phrase: 'takkyubin onegai shimasu' + show the destination address in Japanese from the Airbnb app.",
        ],
      },
      {
        title: "Taxis, GO app & the IC-card bus",
        emoji: "🚕",
        body: [
          "Taxis: clean, honest, doors open themselves (don't touch the door — the driver controls it). Flagfall ~$3–5 (¥500–730). GO (go.goinc.jp) is the local ride-hail app; Uber works in big cities and just dispatches the same taxis.",
          "For 8: two taxis ≈ $9–16 (¥1,500–2,500) per short hop split 8 ways = sometimes cheaper than 8 metro fares when everyone's fried. Use them at night without guilt.",
          "City buses (Kyoto runs on them): board rear, tap IC, exit front, tap again (flat $1.40 / ¥230 in central Kyoto). The 100-series tourist buses get sardine-packed — the regular 205/206 routes hit the same stops emptier.",
          "eSIM is mandatory infrastructure for all of this (GO, Maps, live location) — see Money & Connectivity.",
        ],
      },
    ],
  },
  {
    id: "money",
    title: "Money & Connectivity",
    emoji: "💴",
    intro: "Japan runs on a strange mix of tap-to-pay everything and cash-only holdouts. Here's the system. All prices USD at ¥160 = $1 (June 2026).",
    articles: [
      {
        title: "Cash vs card — the real split",
        emoji: "💳",
        body: [
          "Cards/IC now work at: konbinis, chains, malls, hotels, stations, most restaurants. Cash still rules at: shrines/temples, street stalls, tiny izakaya, some ryokan extras, coin lockers, gachapon.",
          "Budget ~$31/person/day (¥5,000) in cash; refill when under ~$19 (¥3,000). 7-Eleven ATMs (inside every 7-Eleven, 24/7) take all foreign cards at fair rates — they are your bank now. Japan Post ATMs are the backup.",
          "Bring a no-foreign-transaction-fee card. Decline 'pay in USD' if a terminal offers it (dynamic currency conversion = 5–8% scam). Always pay in yen.",
          "$63 notes (¥10,000) break everywhere without drama — don't hoard coins, but keep ¥100s for lockers, vending machines, and ¥5 coins for shrine tosses (considered lucky).",
        ],
      },
      {
        title: "Tax-free shopping, done right",
        emoji: "🧾",
        body: [
          "Spend ~$31+ (¥5,000 pre-tax) in one store in one day → show your physical passport → 10% consumption tax removed at the register or refunded at a tax-free counter.",
          "Don Quijote, Bic Camera, Uniqlo, and depato all have dedicated counters. Consumables (food/cosmetics) get sealed in a bag you're not supposed to open until you leave Japan.",
          "The system is digital — purchases link to your passport electronically, and customs MAY check at the airport. Keep tax-free goods accessible on exit day, not shipped or buried.",
        ],
      },
      {
        title: "Staying connected (eSIM, not pocket WiFi)",
        emoji: "📶",
        body: [
          "eSIM per person (Ubigi ubigi.com, Airalo airalo.com: ~$10–15 for 10–20GB) beats one shared pocket WiFi — the group WILL split up, and the guy without the puck becomes a missing person.",
          "Install and activate at home, test airplane-mode roaming, then it just works on landing. No SIM swap, no airport counter.",
          "Free WiFi exists at stations/konbinis but is flaky — don't depend on it. Download offline Google Maps for each city + the Google Translate Japanese offline pack before flying.",
        ],
      },
      {
        title: "Apps to install before wheels-up",
        emoji: "📱",
        body: [
          "Google Maps (offline areas downloaded) — transit + walking, flawless in Japan.",
          "Google Translate (Japanese offline) — camera mode reads menus and signs in real time.",
          "SmartEX (smart-ex.jp/en) — shinkansen booking, seat selection, board with IC/QR. No JR Pass anywhere.",
          "Visit Japan Web (vjw-lp.digital.go.jp) — immigration + customs QR done before the flight.",
          "Suica/PASMO in Apple Wallet or Google Wallet — set up before you fly.",
          "Splitwise or Settle Up — 16 days of 8-person expenses needs a ledger, not vibes.",
          "GO (taxi), Klook (attraction tickets), Tabelog (restaurant ratings — 3.5+ is excellent; Japanese rate brutally hard).",
        ],
      },
    ],
  },
  {
    id: "etiquette",
    title: "Etiquette & Culture",
    emoji: "🙇",
    intro: "Nobody expects you to be Japanese. They do quietly notice these things.",
    articles: [
      {
        title: "The big ten",
        emoji: "✅",
        body: [
          "1. No tipping. Ever. Anywhere. It causes genuine confusion and someone may chase you down the street to return it.",
          "2. Trains are silent. No calls, phones on manner mode, conversations at murmur volume. Eight loud friends = one trainful of side-eye.",
          "3. Don't eat while walking. Buy street food, stand by the stall, finish, move on. (Festival streets are the exception.)",
          "4. Money goes in the tray by the register, not hand-to-hand. Receive change with both hands if offered.",
          "5. Escalators: stand LEFT in Tokyo, stand RIGHT in Osaka. Yes really. Watch the locals and copy.",
          "6. Shoes off at: ryokan, temples with interiors, izakaya with tatami, fitting rooms, some restaurants, every Airbnb. Genkan step-up = shoes off. This is why we packed good socks.",
          "7. Queue for everything, board trains after letting passengers off, stand behind the platform line.",
          "8. Trash cans don't exist. Carry a small bag; konbinis where you bought stuff will usually take its wrapper.",
          "9. Chopstick taboos: never stick them upright in rice, never pass food chopstick-to-chopstick (both are funeral rites). Rest them on the holder.",
          "10. Bowing: a small head-nod from you covers 99% of situations. They'll bow more; just don't bow-battle them.",
        ],
      },
      {
        title: "Onsen 101 — the full ritual",
        emoji: "♨️",
        body: [
          "Yes, fully naked. Everyone is. Nobody cares. After 90 seconds you won't either, and by night two you'll be an evangelist.",
          "The sequence: strip in the changing room (clothes in basket/locker) → take the small towel only → sit on a stool and WASH THOROUGHLY at the shower stations → rinse off all soap → then enter the bath.",
          "The small towel never touches the water — fold it on your head or set it aside. Don't swim, don't splash, soak and stare at the steam like everyone else.",
          "Hydrate before and after. Alternate hot bath → cold air (rotenburo!) → hot bath. The post-onsen cold milk or coffee milk from the lobby fridge is mandatory tradition.",
          "Tattoos: traditionally banned. Workarounds — book a private kashikiri bath (many places have them, ~$13–25 / ¥2,000–4,000 per 45 min), use cover stickers for small ink, or pick tattoo-friendly baths (check tattoo-friendly.jp).",
        ],
      },
      {
        title: "Temple & shrine protocol",
        emoji: "⛩️",
        body: [
          "Shrine (torii gate, Shinto): bow once at the gate, walk the path's EDGE (center is for gods), purify at the water basin (left hand, right hand, mouth via hand, never touch ladle to lips).",
          "Praying at a shrine: toss coin (¥5 is lucky), bow twice, clap twice, pray, bow once. At a temple (Buddhist): coin, hands together, pray — NO clapping.",
          "Photography: grounds almost always fine; inside halls usually not — look for signs. Never photograph people praying, and never geiko/maiko at close range in Gion (Kyoto fines for harassment are real).",
          "Goshuin (calligraphy stamps, ~$2–3 / ¥300–500): buy a goshuincho book at the first temple and collect them — the single best souvenir of the trip.",
        ],
      },
      {
        title: "Izakaya & drinking culture",
        emoji: "🍻",
        body: [
          "The otoshi (small appetizer you didn't order, ~$2–3 / ¥300–500 per person) is a cover charge, not a scam. It comes with the seat.",
          "Pour for OTHERS, never yourself — keep an eye on neighbors' glasses and they'll keep yours full. First round: everyone orders the same thing (usually beer) for speed — 'toriaezu nama' (draft beer for now) is the magic phrase.",
          "Kanpai before the first sip. Eye contact optional, enthusiasm mandatory.",
          "Drinking outside is legal (konbini beer on the walk between bars: a civil right) but public drunkenness embarrassing your group is deeply noticed. December bonenkai (year-end party) season means salarymen will be worse than you.",
        ],
      },
    ],
  },
  {
    id: "december",
    title: "December Playbook",
    emoji: "❄️",
    intro: "Mid-to-late December is sneaky-elite: dry sunny days, peak Fuji visibility, illuminations everywhere, and you leave Dec 29 — right before the New Year shutdown.",
    articles: [
      {
        title: "Dressing for it (the forecast itself lives on each itinerary day)",
        emoji: "🧥",
        body: [
          "Every day card in the Plan tab carries its own climate line — no separate weather chapter needed. The pattern: dry, blue, 50s°F by day, near-freezing at dawn temple hours, sunset ~16:30.",
          "Indoors is HOT — trains, stores, restaurants run 24°C+. The winning outfit is a heattech base + shirt + packable puffer you can stuff in a daypack, not one giant parka.",
          "Pack gloves and a beanie for the 6:45 Fushimi Inari and dawn-temple starts; your hands hold a cold phone for Maps all day.",
        ],
      },
      {
        title: "Illuminations on our route (all running during our dates)",
        emoji: "✨",
        body: [
          "TOKYO — Shibuya Blue Cave (800m of blue LEDs to Yoyogi), Marunouchi Naka-dori champagne gold, Roppongi Hills Keyakizaka (blue tunnel + Tokyo Tower), Omotesando avenue, Yebisu Garden Place Baccarat chandelier, Tokyo Midtown.",
          "OSAKA — Festival of Lights: the 4km Midosuji Illumination (one of the longest lit streets on Earth) + Hikari Renaissance projection shows at Nakanoshima (through Dec 31). Osaka Castle Illuminage in the park.",
          "KYOTO — subtler by design: Arashiyama park lantern lighting, Kyoto Station's giant stairs light show (free, surprisingly great), ROHM Illumination in the southwest.",
          "USJ + DisneySea both run full Christmas productions through Dec 25–Jan 4. Even Nara does a small candle event some years.",
          "Strategy: illuminations are FREE evening entertainment every single night. Dress warm, grab konbini hot drinks (bottles labeled あたたかい), wander.",
        ],
      },
      {
        title: "Christmas in Japan is delightfully weird",
        emoji: "🎄",
        body: [
          "Christmas = couples' date night + fried chicken. KFC on Christmas Eve is a genuine national tradition (people PRE-ORDER buckets weeks ahead — join in, it's hilarious and the barrel is actually good).",
          "Christmas cake (strawberry shortcake) appears in every konbini — grab one for the house on the 24th after USJ.",
          "Nothing closes. Dec 25 is a normal working day — trains, shops, restaurants all run. Our Hiroshima trip on the 25th has zero holiday complications.",
          "The REAL holiday is New Year (Dec 31–Jan 3) when much of Japan shuts down. We fly out Dec 29 — by Dec 27–28 you'll see New Year prep everywhere: kadomatsu pine decorations, mochi displays, Ameyoko market chaos. Great photos, zero inconvenience.",
        ],
      },
      {
        title: "December-specific wins to exploit",
        emoji: "🏆",
        body: [
          "Fuji visibility peaks Dec–Feb. The Tokyo→Kyoto shinkansen right side (seats D/E) is the best free shot of the trip; the Kamakura coast and Enoshima also frame Fuji over the bay on a clear afternoon.",
          "Crab season (Nov–Mar): kani at Kuromon, Kani Doraku in Dotonbori, crab kaiseki. Oyster season on Miyajima. Fugu season in Osaka if anyone's brave.",
          "Hot vending machine drinks: the red-label rows are HEATED — corn soup in a can, hot lemon, milk tea. ~$0.80 (¥130) hand-warmers that you drink. December's greatest small joy.",
          "Onsen hit different in winter — steam + cold air. Even in Tokyo, hit a sento (~$3 / ¥500 public bath) or Thermae-Yu Shinjuku after a 25,000-step day.",
          "Lower lodging prices and thinner temple crowds than Oct–Nov foliage or Mar–Apr sakura. December 14–29 threads the needle before New Year surge pricing.",
        ],
      },
    ],
  },
  {
    id: "emergency",
    title: "Emergency & Health",
    emoji: "🚑",
    intro: "You won't need this section. Knowing it exists makes the trip more relaxed anyway.",
    articles: [
      {
        title: "The numbers",
        emoji: "📞",
        body: [
          "110 — Police. 119 — Fire & Ambulance. Both free from any phone, English support available in major cities.",
          "Japan Visitor Hotline (JNTO, 24/7, English): 050-3816-2787 — for ANY tourist trouble: medical referrals, disasters, lost-and-found help.",
          "#7119 — non-emergency medical advice line (Tokyo/Osaka): 'should this be a hospital trip?'",
          "US Embassy Tokyo: 03-3224-5000 (1-10-5 Akasaka, Minato-ku). Lost passport → police report at a kōban first, then embassy for an emergency passport (bring photos, takes ~1–2 days).",
        ],
      },
      {
        title: "Kōban — the secret weapon",
        emoji: "🚓",
        body: [
          "Those tiny police boxes on corners? Staffed 24/7, and their #1 actual job is giving directions and handling lost items. Lost your phone/wallet? It is GENUINELY likely to be turned in — file at the nearest kōban.",
          "Japan's lost-and-found return rate is legendary (~80%+ for wallets with cash intact). Check station lost-and-found offices for items lost on trains, with the train line + approximate time.",
        ],
      },
      {
        title: "Pharmacies, clinics, and meds",
        emoji: "💊",
        body: [
          "Drugstores (Matsumoto Kiyoshi, Welcia, Sundrug — everywhere) handle colds, blisters, stomach trouble. Pocket-translate your symptoms; pharmacists are used to it.",
          "Japanese cold medicine is mild; bring your own preferred painkillers/cold meds. NOTE: pseudoephedrine (Sudafed) and Adderall are PROHIBITED imports; codeine is restricted. Check 'Japan customs medication' rules before packing — some need a Yakkan Shōmei import certificate.",
          "Hospitals with English: St. Luke's (Tokyo), Japanese Red Cross (Kyoto/Osaka). Travel insurance with medical coverage is cheap (~$60 for 16 days) — care is excellent and affordable, but insurance makes it free-ish.",
          "Masks when sick are basic courtesy — grab a pack at any konbini if someone catches the December sniffles.",
        ],
      },
      {
        title: "Earthquakes (statistically: a non-event)",
        emoji: "🌏",
        body: [
          "Small tremors happen; Japanese people don't look up from their phones. If one's big enough that things fall: drop under a table, cover your head, wait it out. Buildings are engineered for this better than anywhere on Earth.",
          "Phones auto-blare the J-Alert (terrifying noise, by design) before big shakes. In hotels/houses: don't run outside, don't use elevators, follow staff.",
          "After any quake, trains pause for inspection then resume — build slack into airport-day timing.",
        ],
      },
    ],
  },
  {
    id: "squad",
    title: "8-Man Operations",
    emoji: "🪖",
    intro: "Eight people is a platoon, not a friend group. Platoons need doctrine. This is ours.",
    articles: [
      {
        title: "The squad system",
        emoji: "🎯",
        body: [
          "Default formation: two squads of 4 (or 2-3 man cells at night). Full 8-man formation reserved for: meals with reservations, train boardings, observation decks, and group photos.",
          "Every morning, set TWO things: the day's regroup point (a pinned, named, unmissable landmark — 'the Hachiko statue', never 'the station') and the regroup time. Anyone can free-roam knowing the rendezvous.",
          "Live location sharing in the group chat: ON for all 16 days, no debates. It has ended more arguments than it has started.",
          "Each squad carries: one power bank, one credit card that works, a ~$63 (¥10,000) cash buffer, and the day's house address in Japanese (screenshot from the Airbnb listing).",
          "Train boarding rule: same car, count heads at the door, count again at transfer. The Yamanote line has eaten stragglers before — it departs every 2 minutes, so the rule for a missed train is 'next one, same car, don't move.'",
        ],
      },
      {
        title: "Money ops for a party of 8",
        emoji: "🧾",
        body: [
          "Splitwise group created BEFORE the flight, named, everyone joined. Currency: JPY. Settle in dollars after landing back.",
          "Rotate a daily 'wallet': one guy fronts shared costs that day (lockers, taxis, shared plates, karaoke room) and logs once at night. Eight separate transactions at a register with a queue is an international incident.",
          "Izakaya bills: 'betsu-betsu' (separate) works at chains, fails at tiny places — default to one-pays-logs-all.",
          "ATM strategy: 7-Eleven ATMs (24/7, English, take US cards) in ~$190 (¥30,000) pulls. Notify your bank of travel or enjoy the freeze. Wise/Schwab cards skip foreign transaction fees.",
          "The vending machine fund: everyone throws ~$6 (¥1,000) of coins into a communal pouch on day one. Hot drinks for the squad, dispensed by whoever's closest. Morale infrastructure.",
        ],
      },
      {
        title: "Energy management (the real boss fight)",
        emoji: "🔋",
        body: [
          "The itinerary is a buffet, not a contract. Hitting 80% of it in good spirits beats 100% of it in a death march. The day captain (rotating) holds cut authority.",
          "Jet lag doctrine: Day 1-2, NO NAPS after landing — caffeine, sunlight, walk, sleep at 22:00 local. You'll wake at 5am anyway; that's what dawn temple visits are FOR.",
          "Schedule one 'slow morning' per city (already built in). The guy who needs to sleep in, sleeps in — solo konbini breakfast and a regroup pin beats 8 grumpy men at a shrine.",
          "Walking load: 18-25k steps/day. Feet get one mandatory onsen/sento soak per city. Blister kit (konbini sells them) lives in each squad bag.",
          "The 21:00 audible window (see Play tab rituals): every night, the group votes to continue, pivot, or stand down. No shame in a 22:30 night when tomorrow has a 6:45 alarm for Fushimi Inari.",
        ],
      },
      {
        title: "Airbnb house protocol",
        emoji: "🏠",
        body: [
          "Genkan law: shoes OFF at the entry step, lined up facing the door. House slippers if provided; separate toilet slippers stay IN the toilet room (wearing them out is the classic gaijin speedrun).",
          "Garbage is sorted religiously: burnable / plastics / cans-bottles, per the host's chart. Hosts get fined for guest mistakes — and review us accordingly.",
          "Quiet hours 22:00–07:00 in residential buildings: stairwell voices, door closing, late-night entries. The bar district is where the noise lives; the house is where it dies.",
          "Bath culture applies at home too: the tub is for soaking, washing happens before entering, and one tub of hot water serves multiple soakers — that's the design, not a budget cut.",
          "Day-zero house meeting: bed assignments by random draw (re-draw each city), shower order posted, AC/heater instructions decoded (kanji cheat: 暖房 = heat, 冷房 = cool, 自動 = auto).",
        ],
      },
    ],
  },
  {
    id: "stations",
    title: "Station Mastery",
    emoji: "🚉",
    intro: "Shinjuku Station alone has 200+ exits and 3.6M daily passengers. These are the cheat codes for the labyrinth class.",
    articles: [
      {
        title: "Exit science",
        emoji: "🧭",
        body: [
          "Google Maps tells you the EXIT NUMBER for your destination — read it before surfacing. Surfacing from the wrong exit of a mega-station can put you a 15-minute walk from a place '2 minutes from the station.'",
          "Yellow signs = exits and transfers; follow exit number ranges (E1–E10 style) like highway signage. When lost underground, find any exit sign and surface — GPS works above ground, not below.",
          "Mega-station meeting points that actually work: Shinjuku EAST exit ground level, Shibuya Hachiko statue, Tokyo Station Marunouchi central gate, Kyoto Station central gate under the big screen, Namba's giant Glico man (outside).",
          "Station melodies: every JR platform has its own departure jingle (Shibuya's is famous). The doors close when the melody ENDS — do not start sprinting when it starts; finish strong or wait 3 minutes.",
        ],
      },
      {
        title: "Rush hour, women-only cars & train etiquette",
        emoji: "🚃",
        body: [
          "Rush windows: 07:30–09:00 and 17:30–19:00 weekdays. Eight tourists with daypacks in a 200%-capacity Yamanote car is a war crime against everyone including us — schedule around it (our itinerary already does).",
          "Pink-marked cars are women-only during rush hours (clearly marked on platform and car). Check before boarding in the morning.",
          "On board: phones silent ('manner mode'), no calls, talk at murmur volume, backpacks worn on the front in crowds, don't sit in priority seats unless empty-and-no-one-needs-them.",
          "Escalators: stand LEFT in Tokyo, stand RIGHT in Osaka (Kyoto is contested borderland — follow locals). Walking side is for walkers; blocking it as a group of 8 is how stereotypes are born.",
          "Eating on local trains: no. Shinkansen and limited expresses: yes, encouraged, ekiben culture exists for this exact joy.",
        ],
      },
      {
        title: "Lockers, lost & found, and station services",
        emoji: "🛅",
        body: [
          "Coin lockers: small ~$2.50 (¥400) / medium ~$3 (¥500) / large ~$4.50–5 (¥700–800), IC-card or coin operated. Large lockers fit a carry-on. At mega-stations, lockers near secondary exits are emptier than the main-gate banks.",
          "Left something on a train? Japan's lost & found actually works — note the line, car, and time, go to the station office same-day. Items migrate to central lost & found offices after a day. Phones come back. Wallets come back WITH the cash.",
          "Station staff ('eki-in') at every manned gate solve: wrong tickets, IC card errors, gate rejections, directions. Point, show your phone, look confused — they're professionals at this exact interaction.",
          "We don't use the Green Window (Midori-no-madoguchi) — every shinkansen ticket is on SmartEX and binds to our Suica. If a SmartEX gate tap fails, the manned gate beside it fixes it instantly.",
          "Station food halls (ekinaka) are legitimately good — Tokyo Station's GRANSTA could be a destination itself. Never board a long train hungry; never buy the first bento you see (lap the hall once).",
        ],
      },
    ],
  },
  {
    id: "konbini",
    title: "Konbini Survival",
    emoji: "🏪",
    intro: "7-Eleven, Lawson, FamilyMart — open 24/7, on every corner. You'll walk into one 3+ times a day. Here's how to win every visit.",
    articles: [
      {
        title: "ATMs & paying — cash strategy",
        emoji: "💴",
        body: [
          "7-Eleven ATM is the crew's go-to: accepts all foreign cards, English UI, ¥110 flat fee (~$0.70). Pull ¥20,000–30,000 at a time. Japan Post ATMs are a backup — also English, slightly cheaper fee, but fewer locations.",
          "PAY WITH IC CARD at the register — tap your Suica/PASMO and skip counting coins. Works at all three major chains. The terminal says 'IC card' with a tap symbol.",
          "Decline 'pay in USD' if the screen offers it — that's dynamic currency conversion (5–8% markup). Always pay in yen.",
          "Budget ~¥5,000 ($31) per person per day in cash; refill when you drop under ¥3,000. ¥10,000 notes break everywhere without drama.",
        ],
      },
      {
        title: "Food & drinks — what to actually buy",
        emoji: "🍙",
        body: [
          "BREAKFAST: Onigiri (¥120–180) + hot canned coffee or green tea. Three onigiri = full stomach, ¥500. Pick them up cold; eat immediately — the seaweed wrapper is in a separate film layer, peel from the arrow.",
          "HOT FOOD: Nikuman (steamed pork bun, ¥150) and karaage chicken sit in the warmer by the register. Point at what you want and say 'kore, onegai shimasu.' Ask to heat cold items: 'atatamete moraemasu ka?'",
          "WINTER DRINKS: The drink fridge has a RED label section on the right — those cans are HOT. Corn soup in a can (¥130) is a hand-warmer that you drink. Canned café au lait, hot lemon, milk tea all on the same rack.",
          "DESSERT tier-S: Lawson Uchi Café Purin (custard pudding, ¥300ish) and FamilyMart's chocolate cream puff. Seasonal items change weekly — try anything you haven't seen before.",
          "KONBINI BEER: Outside drinking is legal. Grab a tallboy after temples and stroll. Asahi Super Dry, Sapporo Black Label, Kirin Ichiban are all ¥200–250.",
        ],
      },
      {
        title: "Services & hidden features",
        emoji: "🖨️",
        body: [
          "PRINTING: Konbini printers do PDF tickets, hotel confirmations, boarding passes — use FamilyMart's netprint.ne.jp or 7-Eleven's netprint service (upload from phone, get a code, print at the machine). ~¥20–60 per page.",
          "WASTE BINS: Bins are ONLY at konbini entrances, almost nowhere else outside. Sort your trash into burnable / plastic / cans before you arrive. Ask staff if unsure — they're used to it.",
          "TAKKYUBIN: Any konbini counter accepts Yamato (black cat) luggage shipping. Say 'takkyubin onegai shimasu', show the destination address in Japanese. ~¥2,500 ($16) per bag, next-day delivery.",
          "TIPPING: Zero. Never. Pay the exact price, say arigatō, and leave. They may chase you down the street to return anything extra.",
          "HOURS: Konbini are literally 24/7/365. No Japan holiday closes them. If you need medicine, snacks, cash, or emergency rain gear at 3am, konbini has you.",
        ],
      },
    ],
  },
  {
    id: "runbooks",
    title: "Runbooks — Exact Tutorials",
    emoji: "📋",
    intro: "No 'don't do X' advice here. Just the optimal procedure for every system we touch, step by step, so anyone can execute solo. NO JR Pass — IC card + SmartEX + private-line tickets only. Prices USD at ¥160 = $1.",
    articles: [
      {
        title: "RUNBOOK: Suica/PASMO on your phone (do this before the flight)",
        emoji: "💳",
        body: [
          "iPhone: Wallet app → '+' → Transit Card → scroll to Suica (or PASMO) → add ~$35 → done. It charges your Apple Pay card. Express Mode is on by default — the phone taps gates even with a nearly dead battery.",
          "Android (US Pixels/Samsungs with FeliCa): Google Wallet → '+' → Transit → Suica. If your phone lacks Japan FeliCa support, plan B is a physical Welcome Suica from the machines at Haneda arrivals (28-day card, no deposit). How-to: https://www.jreast.co.jp/multi/en/welcomesuica/",
          "Top up anytime in the Wallet app in ~5 seconds. Load $31 (¥5,000) at a time. It pays for: every train, subway, bus, konbini, vending machine, coin locker, and half the restaurants.",
          "Last day: tap the balance down to ~zero on airport snacks — faster than any refund counter, and mobile Suica balance can't be cashed out cleanly anyway.",
        ],
      },
      {
        title: "RUNBOOK: HND arrivals → Shinjuku house (Dec 14)",
        emoji: "🛬",
        body: [
          "OPTION A — Airport Limousine Bus (the 8-guys-with-bags winner): after customs, follow 'Limousine Bus' signs to the curbside counter at HND T3 arrivals. Buy the Shinjuku ticket (~$9 / ¥1,400, ~45 min, departs every ~15 min) — they load your suitcases under the bus, you sit, it drops at major Shinjuku hotels near the house. Zero stairs, zero transfers. Info: https://www.limousinebus.co.jp/en/",
          "OPTION B — Keikyu + JR (faster, cheaper, more stairs): Keikyu line from HND to Shinagawa (~14 min, ~$2 / ¥330 Suica tap) → transfer to JR Yamanote/Sobu toward Shinjuku (~20 min). ~$4 (¥620) total, ~50 min door-to-platform. Fine with daypacks, rough with 16 suitcases.",
          "Either way: set up mobile Suica and screenshot your Visit Japan Web QR codes BEFORE you land. Tap the Suica through the Keikyu gate; on the bus you just board.",
          "Tokyo Monorail to Hamamatsucho also exists (~13 min, ~$3 / ¥520) but it dumps you at the wrong side of town for Shinjuku — skip it for us.",
        ],
      },
      {
        title: "RUNBOOK: SmartEX setup + our shinkansen bookings (no JR Pass)",
        emoji: "🚅",
        body: [
          "Setup (once, this summer): download SmartEX / register at smart-ex.jp/en → add a credit card → register each guy's Suica/IC number so tickets bind to phones and the gates just open. One account books up to 6 seats per transaction; we run two accounts to cover 8. Reservations open 1 month before departure at 10:00 JST.",
          "BOOKING 1 — opens ~Nov 21, 10:00 JST: Nozomi, Tokyo → Kyoto, Dec 21 ~09:00. Pick a car mid-train, rows together, seats D/E (RIGHT side) for Fuji. ~$89/person ($89 ≈ ¥14,170).",
          "BOOKING 2 — opens ~Nov 26, 10:00 JST: Nozomi, Shin-Osaka ⇄ Hiroshima, Dec 25 out ~07:30 / back ~19:30. ~$68 (¥10,950) each way reserved. (Hiroshima day is the 25th — Christmas is a normal workday, no holiday friction.)",
          "BOOKING 3 — opens ~Nov 28, 10:00 JST: Nozomi, Shin-Osaka → Himeji, Dec 28 ~09:00 (~30 min, ~$24 / ¥3,870 reserved). Book the Himeji→Kobe (Sannomiya) and Kobe→Osaka legs day-of with a plain Suica tap — local JR, no reservation needed.",
          "BOOKING 4 — opens ~Nov 29, 10:00 JST: THE EXIT — Nozomi, Shin-Osaka → Shinagawa, Dec 29 ~09:30. ~$93 (¥14,920). This one is sacred; set two alarms.",
          "Changes are free and unlimited up to departure inside the app — running late means re-booking from the platform, not panicking. There is no pass to validate and no Green Window line, ever.",
        ],
      },
      {
        title: "RUNBOOK: Kyoto ⇄ Osaka the cheap point-to-point way",
        emoji: "🚆",
        body: [
          "Dec 21 arrival is into Kyoto Station on the shinkansen. To reach the Osaka house, the optimal move depends on the day — most days it's the JR Special Rapid (Shin-Kaisoku): Kyoto → Osaka Station, ~29 min, ~$3.60 (¥580), just tap your Suica. No reservation, runs every ~15 min.",
          "If you start near Shin-Osaka with bags, the Tokaido Shinkansen Kyoto↔Shin-Osaka is ~15 min but ~$9 (¥1,450) unreserved — not worth it over the Special Rapid for us. Skip the JR Pass logic entirely; just tap.",
          "Private alternative: Hankyu Kyoto Line (Kawaramachi → Osaka-Umeda, ~45 min, ~$2.70 / ¥430) is scenic and cheap if you're already in downtown Kyoto. Keihan Line serves the Gion/riverside side.",
          "Within both cities, every subway and bus is a Suica tap — never buy a paper ticket for a local ride.",
        ],
      },
      {
        title: "RUNBOOK: Kamakura + Enoshima day trip (point-to-point)",
        emoji: "🗻",
        body: [
          "Best value: buy the Enoshima–Kamakura Freepass from the Odakyu counter/machines at Shinjuku (~$10 / ¥1,640) — it's the round-trip Odakyu fare Shinjuku↔Fujisawa PLUS unlimited Enoden rides all day. Info: https://www.odakyu.jp/english/passes/enoshima_kamakura/",
          "Alternative if starting from Tokyo Station: JR Yokosuka Line direct to Kamakura (~57 min, ~$6 / ¥940 each way, Suica tap), then the Enoden local line (~$1.20–1.80 / ¥190–290 a hop, or a ~$3.60 / ¥580 Enoden day pass).",
          "The loop: Kita-Kamakura temples → Great Buddha (Kotoku-in, ~$2.50 / ¥400 entry) → Hase-dera → ride the Enoden along the coast (Fuji over the sea on a clear December afternoon) → Enoshima island. Coin lockers at Kamakura and Fujisawa stations — dump daypacks, roam free.",
          "This is the Tokyo-day mountain/coast hit. Hakone is NOT on the plan; Kamakura + Enoshima replaces it — easier logistics, no ropeway weather gamble, and a Fuji-over-ocean payoff.",
        ],
      },
      {
        title: "RUNBOOK: Nara + Uji day trip (from Osaka/Kyoto)",
        emoji: "🦌",
        body: [
          "From Osaka: Kintetsu Nara Line, Osaka-Namba → Kintetsu-Nara, ~40 min, ~$4 (¥680) Suica tap — drops you closest to the deer park and Todai-ji. From Kyoto: JR Nara Line to Nara, ~45 min, ~$5 (¥720), or Kintetsu Kyoto→Kintetsu-Nara.",
          "No reservation needed for the local Kintetsu/JR runs — just tap. If anyone wants a guaranteed seat, Kintetsu's reserved Limited Express is ~$8 (¥1,290) and bookable morning-of in the Kintetsu app, but the regular express is fine.",
          "Uji (Byodo-in, the ¥10-coin temple, + matcha everything) sits on the JR Nara Line between Kyoto and Nara — ~$2.40 (¥390) from Kyoto, ~17 min. Easy add-on: Kyoto → Uji → Nara in one chain, all Suica taps.",
          "Coin lockers at Kintetsu-Nara and JR Nara stations. Buy deer crackers (shika senbei, ~$1.20 / ¥200) from the licensed vendors — the deer will bow for them and then mug you. Hold none in your pocket.",
        ],
      },
      {
        title: "RUNBOOK: Hiroshima + Miyajima day (Dec 25)",
        emoji: "⛩️",
        body: [
          "07:30 Nozomi Shin-Osaka → Hiroshima (~1h25, ~$68 / ¥10,950 reserved on SmartEX, booked ~Nov 26). Seats together; eat an ekiben on board.",
          "Hiroshima: streetcar (Hiroden) from Hiroshima Station to Peace Memorial Park, ~$1.50 (¥240), Suica tap. Peace Museum entry ~$1.40 (¥200) — budget 2+ hours, it earns it.",
          "Miyajima: JR Sanyo Line Hiroshima → Miyajimaguchi (~$2.80 / ¥420, ~25 min) → JR ferry to the island (~$1.80 / ¥300 each way, covered by your Suica). NOTE: a separate ~$0.65 (¥100) island 'visitor tax' is collected at the ferry — pay it, it's not a scam. The floating torii at high tide + winter oysters grilled on the dock = top-3 sight of the trip.",
          "Last Nozomi back leaves Hiroshima ~21:00; aim for the ~19:30 to keep Christmas night in Osaka alive. Change it free in SmartEX from the platform if you run long at Miyajima.",
        ],
      },
      {
        title: "RUNBOOK: Himeji + Kobe day (Dec 28)",
        emoji: "🏯",
        body: [
          "09:00 Nozomi Shin-Osaka → Himeji (~30 min, ~$24 / ¥3,870 reserved, booked ~Nov 28). Himeji Castle is a 15-min walk straight up the main avenue from the station — entry ~$6 (¥1,000), the only true original-keep castle in Japan.",
          "Then drop down to Kobe: JR local/Special Rapid Himeji → Sannomiya (~40 min, ~$6 / ¥970 Suica tap, no reservation). Kobe beef lunch, Nankinmachi Chinatown, harbor.",
          "Back to Osaka: JR Special Rapid Sannomiya → Osaka Station (~20 min, ~$2.50 / ¥420 Suica tap). Whole day is one shinkansen reservation + two plain taps. No pass, no fuss.",
          "Coin lockers at Himeji Station; leave daypacks before the castle climb.",
        ],
      },
      {
        title: "RUNBOOK: Visit Japan Web (one evening, the week before)",
        emoji: "🛂",
        body: [
          "Go to the official Visit Japan Web site (https://vjw-lp.digital.go.jp) → create account → register 'Trip to Japan' with the flight number and the Tokyo Airbnb address (copy-paste from the Airbnb booking).",
          "Fill Immigration (disembarkation) + Customs declaration for yourself. Each guy does his own — ~10 minutes.",
          "It issues QR codes for immigration and customs. SCREENSHOT them to your camera roll. Airport WiFi dies at the exact moment 400 people need it.",
          "At HND: QR lane at immigration → grab bags → QR gate at customs. The paper-form line is for people who didn't read this.",
        ],
      },
      {
        title: "RUNBOOK: luggage shipping via Yamato (we do this twice)",
        emoji: "📦",
        body: [
          "SHIP 1 — Dec 20 night / Dec 21 morning, Tokyo → Osaka house: pack the big suitcases, keep a 3-day daypack (Kyoto + Osaka run daypack-only). Arrange Yamato pickup via the Airbnb host or hand bags to ANY konbini counter ('takkyubin onegai shimasu', show the Osaka address in Japanese from the listing). ~$16 (¥2,500) per bag, arrives next day — the Osaka host holds them. Booking/info: https://www.kuronekoyamato.co.jp/en/",
          "Address format matters: use the EXACT Japanese address block from the Airbnb app, plus the host's phone number. Konbini staff fill the form with you.",
          "SHIP 2 (optional) — Dec 27, Osaka → Haneda T3 Yamato counter: souvenir-heavy bags fly ahead (hold-for-pickup, ~$16–19 / ¥2,500–3,000) so the Dec 29 shinkansen sprint is hands-free. Needs ~2 days — ship by the 27th.",
          "Carry-on-only between cities is the difference between gliding through stations and being eight men fighting escalators. No JR Pass means no excuse to lug everything 'because we paid for the train.'",
        ],
      },
      {
        title: "RUNBOOK: tax-free shopping, executed once, perfectly",
        emoji: "🛍️",
        body: [
          "Rule: ~$31+ (¥5,000) spent at one tax-free store in one day = 10% off at the dedicated counter. Passport (physical, not a photo) required.",
          "Strategy: ONE consolidated boss run — Don Quijote Dotonbori, Dec 28 evening, with the trip-long group list (pin a shared note on Day 1; add everything you 'almost bought').",
          "At the counter: passport + purchases; consumables get sealed in a bag you cannot open in Japan; the purchase links to your passport electronically. ",
          "Exit day: keep tax-free items accessible (not shipped, not buried) — Haneda customs scans passports and CAN ask to see them. Takes 30 seconds when you're ready; ruins a morning when you're not.",
        ],
      },
      {
        title: "RUNBOOK: USJ Christmas-season day (the most crowd-sensitive day)",
        emoji: "🎢",
        body: [
          "October: buy 1-Day Studio Pass + Express Pass (the variant including Nintendo World timed entry + Forbidden Journey) for all 8 on the official site — peak-date Express sells out weeks ahead. ~$63 (¥10,000) + ~$125–190 (¥20,000–30,000) respectively. Yes really. It buys back 6+ hours of queues. Official: https://www.usj.co.jp/web/en/us",
          "Night before: download the USJ app, link tickets, charge phones to 100%.",
          "07:30: AT the gates (park 'officially' opens 08:30–09:00 on peak days but historically opens early). Bags ready for inspection, tickets on screens.",
          "Gate-cross: app → Nintendo area timed entry → grab the earliest slot (insurance even with Express). Then walk straight to Mario Kart.",
          "Power-Up Bands (~$28 / ¥4,500) at the first cart inside the area — they make Nintendo World a literal video game and sync to the app scoreboard. 8-man key-challenge race, winner picks lunch.",
        ],
      },
      {
        title: "RUNBOOK: the Dec 29 exit (Shin-Osaka → Shinagawa → Haneda, zero-stress)",
        emoji: "🛫",
        body: [
          "Dec 28, ~24h before departure: EVERYONE checks in on the airline app the minute the window opens — Basic Economy assigns seats then. Calendar reminder set now.",
          "Dec 29, 08:45: leave the house. 09:30 Nozomi from Shin-Osaka (booked ~Nov 29 on SmartEX, ~$93 / ¥14,920). Worst-case buffer: Nozomi run every ~10 min until noon and SmartEX rebooks free.",
          "~11:58 Shinagawa: do NOT ride into Tokyo Station. At Shinagawa, follow Keikyu Airport Line signs (same station, ~5-min transfer, ~$2 / ¥330 Suica tap) → direct to HND T3 by ~12:45. This is the optimal connection — Shinagawa is the shinkansen stop that touches the Haneda line.",
          "Check-in + bag drop + security + immigration ≈ 60–90 min in holiday week. Airside by ~14:30 leaves 2.5 happy hours for Edo-Koji, the rooftop deck, and the gachapon walls. Tap your Suica down to near-zero on airport snacks before the flight.",
        ],
      },
    ],
  },
];
