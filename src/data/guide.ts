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
    intro: "Japan's transit is the best on Earth — once you know the five rules. Here's everything from airport to last train.",
    articles: [
      {
        title: "IC Cards (Suica/ICOCA) — your tap-everything wallet",
        emoji: "💳",
        body: [
          "Add Suica to Apple Wallet or Google Wallet BEFORE you land (Wallet app → + → Transit Card → Suica). Top up with your credit card in seconds, no Japanese needed. iPhone works even with a dead-ish battery (Express Mode).",
          "Physical alternative: Welcome Suica at Narita/Haneda counters and machines (valid 28 days, no deposit). In Kansai the local card is ICOCA — but any IC card works everywhere; they're fully interoperable.",
          "Tap in AND out of every gate. Balance too low at exit? Use the orange 'Fare Adjustment' machine inside the gates — never jump them.",
          "It's also money: konbini, vending machines, coin lockers, many restaurants. Load ¥5,000 at a time and stop thinking about it.",
        ],
      },
      {
        title: "Shinkansen — how to actually ride it",
        emoji: "🚅",
        body: [
          "Book on the SmartEX app (Tokaido/Sanyo line — covers every leg we take). Pick reserved seats; for 8 people grab two rows of 2+3 or book early for a whole block. Unreserved cars exist but splitting 8 across standing room is misery.",
          "Seat tip: Tokyo→Kyoto, sit on the RIGHT side (seats D/E) for Mt. Fuji around Shin-Fuji station, ~40 min in. Clear December days make this a real event.",
          "Large suitcases (>160cm combined) legally need the 'oversized baggage' seats at car ends — book them, they're free but limited. Or better: ship luggage ahead (see below) and board with a daypack.",
          "Buy ekiben (bento) + drinks INSIDE the station before boarding. Eating on shinkansen: encouraged and delicious. On local trains: no.",
          "Trains leave ON THE SECOND. Doors close 15 seconds before departure time. Be on the platform 10 minutes early, lined up at your car number marker.",
        ],
      },
      {
        title: "Tokyo metro without tears",
        emoji: "🗺️",
        body: [
          "Google Maps is genuinely excellent in Japan — exact platform numbers, car positions, exit numbers, fares. Trust it completely.",
          "Exits matter more than lines. Shinjuku has 200+, Tokyo Station ~100. The difference between Exit A4 and B12 can be a 15-minute underground walk. Google Maps tells you the exit — read it.",
          "Rush hours: 7:30–9:00 and 17:30–19:00. With 8 people + luggage, just don't. Plan moves for 10:00–16:00.",
          "Last trains run ~midnight–00:30 and they are FINAL. After that it's taxis (fine split 8 ways across 2 cabs) or karaoke until 5am (a time-honored strategy).",
          "Women-only cars (pink signs) operate during morning rush on some lines — gents, check before boarding.",
        ],
      },
      {
        title: "Airport transfers",
        emoji: "🛬",
        body: [
          "NARITA → city: Skyliner to Ueno (41 min, ¥2,580) or N'EX to Tokyo/Shinjuku (~60–90 min, ~¥3,070). With 8 people + 16 bags, the Airport Limousine Bus direct to your hotel (~¥3,200) wins on sanity.",
          "HANEDA → city: Monorail to Hamamatsucho (13 min, ¥520) or Keikyu line to Shinagawa. Easy either way — Haneda is blessedly close.",
          "Departure day: leave the hotel 3.5–4 hours before an international flight. December 29 is peak holiday exodus — trains will be packed with suitcases; reserve N'EX/Skyliner seats a few days ahead.",
        ],
      },
      {
        title: "Luggage shipping (takkyubin) — the cheat code",
        emoji: "🧳",
        body: [
          "Yamato Transport ships a suitcase hotel-to-hotel overnight for ~¥2,000–2,800. Hand it to any hotel front desk by ~10am; it's at the next hotel that evening or next morning.",
          "Our play: ship big bags Tokyo→Kyoto on Dec 18 morning, carry one overnight bag to Hakone. Then Osaka→Tokyo on Dec 26 so the shinkansen ride back is luggage-free.",
          "Konbinis also accept takkyubin drop-offs, including straight to airports (give 2 days for airport delivery).",
        ],
      },
      {
        title: "Taxis, Ubers & the IC-card bus",
        emoji: "🚕",
        body: [
          "Taxis: clean, honest, doors open themselves (don't touch the door — the driver controls it). ~¥500–730 flagfall. GO is the local ride-hail app; Uber works in big cities and calls the same taxis.",
          "For 8: two taxis ≈ ¥1,500–2,500 per short hop split 8 ways = sometimes cheaper than 8 metro fares when tired. Use them at night without guilt.",
          "City buses (Kyoto runs on them): board rear, tap IC, exit front, tap again. Flat ¥230 in Kyoto. The 100-series 'tourist' buses get sardine-packed — regular 205/206 routes hit the same stops emptier.",
        ],
      },
    ],
  },
  {
    id: "money",
    title: "Money & Connectivity",
    emoji: "💴",
    intro: "Japan runs on a strange mix of tap-to-pay everything and cash-only holdouts. Here's the system.",
    articles: [
      {
        title: "Cash vs card — the real split",
        emoji: "💳",
        body: [
          "Cards/IC now work at: konbinis, chains, malls, hotels, stations, most restaurants. Cash still rules at: shrines/temples, street food stalls, tiny izakaya, some ryokan extras, coin lockers, gachapon.",
          "Budget ~¥5,000/person/day in cash; refill when under ¥3,000. 7-Eleven ATMs (inside every 7-Eleven, 24/7) take all foreign cards with fair rates — they are your bank now. Japan Post ATMs are the backup.",
          "Bring a no-foreign-transaction-fee credit card. Decline 'pay in USD' if a terminal offers it (dynamic currency conversion = 5–8% scam). Always pay in yen.",
          "¥10,000 notes break everywhere without drama — don't hoard coins, but keep ¥100s for lockers, vending machines, and temple offerings (¥5 coins are considered lucky for shrine tosses).",
        ],
      },
      {
        title: "Tax-free shopping, done right",
        emoji: "🧾",
        body: [
          "Spend ¥5,000+ (pre-tax) in one store in one day → show your physical passport → 10% consumption tax removed at the register or refunded at a tax-free counter.",
          "Don Quijote, Bic Camera, Uniqlo, and depato all have dedicated counters. Consumables (food/cosmetics) get sealed in a bag you're not supposed to open in Japan.",
          "The system is digital now — purchases link to your passport, and customs MAY check on exit. Keep it roughly honest.",
        ],
      },
      {
        title: "Staying connected",
        emoji: "📶",
        body: [
          "eSIM per person (Ubigi, Airalo: ~$10–15 for 10–20GB) beats one shared pocket WiFi — the group WILL split up, and the person without the WiFi puck becomes a missing person.",
          "Install and activate the eSIM at home, test airplane-mode roaming, then it just works on landing.",
          "Free WiFi exists at stations/konbinis but is flaky — don't depend on it. Download offline Google Maps for each city + Google Translate Japanese offline pack before flying.",
        ],
      },
      {
        title: "Apps to install before wheels-up",
        emoji: "📱",
        body: [
          "Google Maps (offline areas downloaded) — transit + walking, flawless in Japan.",
          "Google Translate (Japanese offline) — the camera mode reads menus and signs in real time.",
          "SmartEX — shinkansen booking, seat selection, board with QR/IC.",
          "Visit Japan Web (browser) — immigration + customs QR done before the flight.",
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
    intro: "Nobody expects you to be Japanese. They do quietly notice these ten things.",
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
          "6. Shoes off at: ryokan, temples with interiors, izakaya with tatami, fitting rooms, some restaurants. Genkan step-up = shoes off. This is why we packed good socks.",
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
          "Tattoos: traditionally banned. Workarounds — book a private kashikiri bath (many ryokan have them, ~¥2–4k/45min), use cover stickers for small ink, or pick tattoo-friendly baths (check tattoo-friendly.jp).",
        ],
      },
      {
        title: "Temple & shrine protocol",
        emoji: "⛩️",
        body: [
          "Shrine (torii gate, Shinto): bow once at the gate, walk the path's EDGE (center is for gods), purify at the water basin (left hand, right hand, mouth via hand, never touch ladle to lips).",
          "Praying at a shrine: toss coin (¥5 is lucky), bow twice, clap twice, pray, bow once. At a temple (Buddhist): coin, hands together, pray — NO clapping.",
          "Photography: grounds almost always fine; inside halls usually not — look for signs. Never photograph people praying, and never geiko/maiko at close range in Gion (Kyoto fines for harassment are real).",
          "Goshuin (calligraphy stamps, ¥300–500): buy a goshuincho book at the first temple and collect them — the single best souvenir of the trip.",
        ],
      },
      {
        title: "Izakaya & drinking culture",
        emoji: "🍻",
        body: [
          "The otoshi (small appetizer you didn't order, ¥300–500/person) is a cover charge, not a scam. It comes with the seat.",
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
    intro: "Mid-to-late December is sneaky-elite: dry sunny days, peak Fuji visibility, illuminations everywhere, and you leave right before the New Year shutdown.",
    articles: [
      {
        title: "Weather: what 16 days actually feels like",
        emoji: "🌡️",
        body: [
          "Tokyo/Kyoto/Osaka December: highs 10–13°C (50–55°F), lows 2–5°C (36–41°F), and it's the DRIEST month — rain is rare, skies are blue, air is crystal.",
          "Hakone sits higher: expect 0–8°C and possible snow dustings. Hiroshima/Miyajima: similar to Osaka, breezier on the water.",
          "Sunrise ~6:50, sunset ~16:30. Short days reshape the schedule: outdoor sights 8:00–16:00, observation decks at golden hour, illuminations + food after dark. Nothing about evenings is wasted.",
          "Indoors is HOT — trains, stores, restaurants run 24°C+. The winning outfit is a heattech base + shirt + packable puffer you can stuff in a bag, not one giant parka.",
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
          "Strategy: illuminations are FREE evening entertainment every single night. Dress warm, grab konbini hot drinks (the bottle warmers say あたたかい), wander.",
        ],
      },
      {
        title: "Christmas in Japan is delightfully weird",
        emoji: "🎄",
        body: [
          "Christmas = couples' date night + fried chicken. KFC on Christmas Eve is a genuine national tradition (people PRE-ORDER buckets weeks ahead — join in, it's hilarious and the barrel is actually good).",
          "Christmas cake (strawberry shortcake) appears in every konbini — grab one for the hotel on the 24th after USJ.",
          "Nothing closes. Dec 25 is a normal working day — trains, shops, restaurants all run. Our Hiroshima trip on the 25th has zero holiday complications.",
          "The REAL holiday is New Year (Dec 31–Jan 3) when much of Japan shuts down. We fly out Dec 29 — by Dec 27–28 you'll see New Year prep everywhere: kadomatsu pine decorations, mochi displays, Ameyoko market chaos. Great photos, zero inconvenience.",
        ],
      },
      {
        title: "December-specific wins to exploit",
        emoji: "🏆",
        body: [
          "Fuji visibility peaks Dec–Feb. Our Hakone day has the year's best odds; the Tokyo→Kyoto shinkansen right side is a free second chance.",
          "Crab season (Nov–Mar): kani at Kuromon, Kani Doraku in Dotonbori, crab kaiseki. Oyster season on Miyajima. Fugu season in Osaka if anyone's brave.",
          "Hot vending machine drinks: the red-label rows are HEATED — corn soup in a can, hot lemon, milk tea. ¥130 hand-warmers that you drink. December's greatest small joy.",
          "Onsen hit different in winter — steam + cold air. Even in Tokyo, hit a sento (¥500 public bath) or Thermae-Yu Shinjuku after a 25,000-step day.",
          "Lower hotel prices and thinner temple crowds than Oct–Nov foliage or Mar–Apr sakura. December 14–29 threads the needle before New Year surge pricing.",
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
          "Phones auto-blare the J-Alert (terrifying noise, by design) before big shakes. In hotels: don't run outside, don't use elevators, follow staff.",
          "After any quake, trains pause for inspection then resume — build slack into airport-day timing.",
        ],
      },
    ],
  },
];
