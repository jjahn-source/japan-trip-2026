export type DayTrip = {
  id: string;
  name: string;
  jp: string;
  base: "Tokyo" | "Kansai"; // which home base it runs from
  travel: string; // exact route + time + cost, e.g. "Odakyu Romancecar Shinjuku→Hakone-Yumoto, 85 min, ¥2,470 (~$16) each way — book seats at..."
  cost: string; // realistic all-in per person USD for the day
  hours: string; // door-to-door, e.g. "07:30–19:30"
  tier: 1 | 2 | 3; // 1 = locked into the itinerary, 2 = strong audible, 3 = if a day frees up
  pitch: string; // 2-3 sentence sell
  play: string[]; // 6-10 step hour-by-hour run of show, each step "HH:MM — thing (detail)"
  protip: string;
  links: { label: string; url: string }[]; // 1-3 REAL official links (transport pass page, attraction official site)
  wiki: string; // exact English Wikipedia article title for the hero photo, e.g. "Hakone" or "Itsukushima Shrine"
};

export const DAY_TRIPS: DayTrip[] = [
  // ───────────────────────── FROM TOKYO BASE ─────────────────────────
  {
    id: "hakone-loop",
    name: "Hakone Fuji Loop",
    jp: "箱根",
    base: "Tokyo",
    travel:
      "Odakyu Romancecar Shinjuku→Hakone-Yumoto, 85 min, ¥2,470 (~$16) each way — but buy the Hakone Freepass from Shinjuku (¥6,100, 2-day) which covers the Odakyu round trip PLUS every mountain leg (Tozan railway, cablecar, ropeway, pirate ship, buses); add the ¥1,200 Romancecar seat surcharge each way for the comfy reserved train.",
    cost: "~$90/person (¥6,100 pass + ¥2,400 Romancecar seats + ¥1,800 onsen + black eggs + lunch)",
    hours: "07:00–20:30",
    tier: 1,
    pitch:
      "THE Dec 19 plan: one ticket chains five forms of transport into a clockwise loop around a volcano, with Mt. Fuji photobombing the whole day. Switchback railway → cablecar → ropeway over a steaming crater → pirate galleon across a caldera lake → lakeside torii — then a forest onsen before the train home. December has the year's highest Fuji-visibility odds; this is the day the group chat was made for.",
    play: [
      "07:00 — Romancecar departs Shinjuku (book on the Odakyu e-Romancecar site the day seats open — the front-window saloon seats on the GSE are the trophy)",
      "08:30 — Hakone-Yumoto: konbini coffee + snacks, commit to the clockwise loop",
      "08:50 — Hakone Tozan railway to Gora (40 min of forested switchbacks — the train reverses direction three times, that's the feature not a bug)",
      "09:45 — Cablecar Gora→Sounzan (10 min), walk straight onto the ropeway",
      "10:10 — Owakudani: sulfur steam vents, Fuji dead ahead, and kuro-tamago black eggs (¥500 for 4 — each adds 7 years of life, we don't make the rules)",
      "11:15 — Ropeway down to Togendai, then the Lake Ashi pirate galleon to Moto-Hakone (~35 min, Fuji off the stern)",
      "12:30 — Lunch in Moto-Hakone (lakeside soba or katsu — nothing fancy required)",
      "13:45 — Hakone Shrine: cedar-lined stone staircase, then the floating Peace Torii photo line at the water (it moves fast)",
      "15:00 — Hakone Tozan bus (line H) back down to Hakone-Yumoto, ~40 min, covered by the pass",
      "16:00 — Hakone Yuryo day-use onsen (free shuttle from Yumoto station): rotenburo steam in December mountain air, then the ~18:50 Romancecar home",
    ],
    protip:
      "Check the Owakudani live webcam at 6:30am before committing — if Fuji is socked in, flip the day. The ropeway closes early in winter (~16:15) and occasionally shuts for volcanic gas, in which case replacement buses run the same leg. Tattooed crew: Hakone Yuryo rents private kashikiri bath rooms (~¥5,000/h, splits to pocket change).",
    links: [
      { label: "Hakone Freepass — Odakyu", url: "https://www.odakyu.jp/english/passes/hakone/" },
      { label: "Hakone Navi (official area guide)", url: "https://www.hakonenavi.jp/international/en/" },
      { label: "Hakone Yuryo onsen", url: "https://www.hakoneyuryo.jp/" },
    ],
    wiki: "Hakone",
  },
  {
    id: "kamakura-enoshima",
    name: "Kamakura + Enoshima",
    jp: "鎌倉・江の島",
    base: "Tokyo",
    travel:
      "JR Shonan-Shinjuku line Shinjuku→Kamakura direct, ~60 min, ¥960 (~$6.40); inside the area the Enoden tram hops temple-to-temple (¥800 day pass 'Noriorikun'); return from Enoshima on the Odakyu line to Shinjuku (~70 min, ¥660).",
    cost: "~$45/person (trains ~¥2,400 + temples ¥800 + shirasu lunch + Enoshima)",
    hours: "08:00–19:30",
    tier: 2,
    pitch:
      "The samurai capital by the sea, one hour south: a 13-meter open-air bronze Buddha you can stand inside, a hillside temple staring at the Pacific, and a rattling 1902 tram running between beach houses. Cap it on Enoshima island, where a crisp December evening gives you the best Fuji-over-the-ocean sunset anywhere near Tokyo. This is the strongest audible in the Tokyo deck.",
    play: [
      "08:00 — Shonan-Shinjuku line from Shinjuku (grab egg sandos for the ride)",
      "09:05 — Kamakura station: walk Komachi-dori as the snack shops open (sweet-potato soft serve at 9am is legal here)",
      "09:45 — Tsurugaoka Hachimangu, the shogunate's great shrine at the top of the avenue",
      "10:45 — Enoden tram to Hase (3 stops — the tiny green tram threading backyards is half the trip)",
      "11:00 — The Great Buddha at Kotoku-in (¥300, +¥50 to go INSIDE the 1252 casting)",
      "12:00 — Hase-dera (¥400): golden Kannon, thousands of tiny jizo statues, ocean-view terrace",
      "13:00 — Shirasu-don lunch (whitebait over rice — the Shonan coast specialty) near Hase",
      "14:15 — Enoden the rest of the way down the coast to Enoshima — December-clear days put Fuji over the water out the right-hand windows",
      "15:00 — Cross the causeway: Enoshima Shrine, the Sea Candle lighthouse garden (~¥1,100 island combo)",
      "16:30 — Sunset Fuji silhouette from the island's west side, Sea Candle winter illumination after dark, then Odakyu home from Katase-Enoshima",
    ],
    protip:
      "Sunset is ~16:35 in mid-December — build the day backwards from being on Enoshima by 16:00. Hawks (tonbi) divebomb street food along this whole coast; eat with your back to a wall. Weekday > weekend by a mile.",
    links: [
      { label: "Kotoku-in (Great Buddha) official", url: "https://www.kotoku-in.jp/" },
      { label: "Hase-dera official", url: "https://www.hasedera.jp/" },
      { label: "Enoden railway", url: "https://www.enoden.co.jp/en/" },
    ],
    wiki: "Kōtoku-in",
  },
  {
    id: "nikko",
    name: "Nikko — Toshogu in Winter",
    jp: "日光",
    base: "Tokyo",
    travel:
      "Tobu limited express (Revaty Kegon) Asakusa→Tobu-Nikko, ~1h50, ~¥3,050 (~$20) each way with reserved seat; or the Tobu Nikko World Heritage Area Pass (~¥2,120, covers the round trip on local trains + area buses — add the limited express seat fee each way to skip the slow ride).",
    cost: "~$70/person (trains ~¥6,100 + Toshogu ¥1,600 + yuba lunch + buses)",
    hours: "07:00–19:00",
    tier: 3,
    pitch:
      "Tokugawa Ieyasu's mausoleum is the most extravagant thing ever built in Japan — a mountain forest of giant cedars wrapped around shrines dripping in gold leaf and carving. In late December there's a real chance the whole complex is dusted in snow, which turns the gold up to eleven and the crowds down to nothing. The longest haul in the Tokyo deck, and it earns it.",
    play: [
      "07:00 — Revaty limited express from Asakusa (reserve seats in advance; sleep or stare at the Kanto plain)",
      "09:00 — Tobu-Nikko station: bus up the hill to the Shinkyo sacred bridge",
      "09:30 — Toshogu (¥1,600): the Yomeimon 'sunset gate' (so detailed people stare till dusk), the original see-no-evil monkeys, the sleeping cat, then 207 stone steps to Ieyasu's surprisingly quiet tomb",
      "11:30 — Futarasan Shrine and Taiyuin (the grandson's deliberately humbler mausoleum — many people's secret favorite)",
      "12:45 — Yuba lunch (tofu skin in every form — Nikko's monk-food specialty, weirdly great)",
      "14:00 — Kanmangafuchi Abyss: a gorge-side row of ~70 jizo statues in red caps, dead quiet in winter",
      "15:30 — Shinkyo bridge photo, sweet shops, and castella cake for the train",
      "16:30 — Limited express home; Asakusa by ~18:30",
    ],
    protip:
      "It runs 5–8°C colder than Tokyo — this is the day for every layer you packed. Skip the Lake Chuzenji extension in December (the Irohazaka switchback road can ice over and it eats 2+ hours); the World Heritage cluster is the show. Buy limited express seats both ways in advance — winter trains are short.",
    links: [
      { label: "Nikko Toshogu official", url: "https://www.toshogu.jp/" },
      { label: "Tobu Railway passes", url: "https://www.tobu.co.jp/en/" },
    ],
    wiki: "Nikkō Tōshō-gū",
  },
  {
    id: "kawaguchiko",
    name: "Kawaguchiko — Closest Fuji Day",
    jp: "河口湖",
    base: "Tokyo",
    travel:
      "Highway bus from Busta Shinjuku (the terminal above Shinjuku station, gate 4F)→Kawaguchiko Station, ~1h45, ~¥2,200 (~$15) each way — reserve seats online up to a month out; first departures ~6:45 sell the best Fuji light.",
    cost: "~$60/person (bus ¥4,400 + local trains/ropeway ~¥2,800 + hoto lunch)",
    hours: "06:45–19:00",
    tier: 3,
    pitch:
      "The Fuji Five Lakes put you at the mountain's feet: Chureito Pagoda's five-story-pagoda-plus-Fuji postcard, the lake panorama from the ropeway, and the volcano filling your entire windshield. December is statistically the best month of the year to actually SEE Fuji — cold, dry, ruthless clarity. This is the all-in photo day, and it only runs on a clear forecast.",
    play: [
      "06:45 — Highway bus from Busta Shinjuku (left side seats for the Fuji reveal on the expressway)",
      "08:45 — Kawaguchiko Station: Fuji status check, lockers for anything heavy",
      "09:15 — Fujikyu line two stops to Shimoyoshida → climb the 398 steps to Chureito Pagoda (THE postcard: red pagoda, town below, Fuji behind)",
      "11:15 — Back to Kawaguchiko; hoto lunch (flat udon in pumpkin miso stew served in an iron pot — Yamanashi's winter weapon)",
      "12:45 — Mt. Fuji Panoramic Ropeway up Mt. Tenjo (~¥1,800 round trip) for the lake-and-Fuji panorama",
      "14:15 — Bus or rental cycle to Oishi Park on the north shore — the calendar-photo angle across the water",
      "15:45 — Lakeside coffee and Fujiyama Cookie back near the station",
      "16:30 — Watch the December alpenglow turn Fuji pink (~16:30), then the bus home",
    ],
    protip:
      "Book a CANCELLABLE bus and decide the night before off the forecast and live webcams — Fuji hidden = day wasted, Fuji out = best photos of the trip. It's a high-altitude basin: noticeably colder than Tokyo, and the pagoda steps are icy in the morning shade. Buses back to Shinjuku sell out Sunday evenings; reserve the return too.",
    links: [
      { label: "Highway Bus reservations (Keio)", url: "https://www.highwaybus.com/" },
      { label: "Mt. Fuji Panoramic Ropeway", url: "https://www.mtfujiropeway.jp/" },
    ],
    wiki: "Lake Kawaguchi",
  },
  {
    id: "yokohama",
    name: "Yokohama — Ramen, Chinatown & Harbor Lights",
    jp: "横浜",
    base: "Tokyo",
    travel:
      "Tokyu Shin-Yokohama line Shibuya→Shin-Yokohama direct, ~25 min, ~¥470 (~$3) to start at the Ramen Museum; then local trains/Minatomirai line between districts (¥200–300 a hop); Tokyu Toyoko line back to Shibuya from Motomachi-Chukagai, ~40 min, ¥550.",
    cost: "~$45/person (trains ~¥1,500 + museums ~¥1,500 + ramen grazing + Christmas market beers)",
    hours: "10:30–21:00",
    tier: 3,
    pitch:
      "Japan's second city is 30 minutes away and built for a low-effort, high-calorie day: a retro-streetscape museum where you crawl nine regional ramen styles in mini-bowls, the country's biggest Chinatown, and a harbor skyline that does December better than almost anywhere — Christmas market, skating rink, full illumination. The best bad-weather or tired-legs card in the deck.",
    play: [
      "10:30 — Tokyu direct from Shibuya to Shin-Yokohama",
      "11:00 — Shin-Yokohama Ramen Museum (~¥450 entry): a 1958 Tokyo streetscape underground with nine legendary regional shops — order mini-bowls and hit three minimum",
      "13:00 — Train to Motomachi-Chukagai: Yokohama Chinatown, 600+ shops — steamed buns and peking duck wraps as dessert-after-ramen",
      "14:30 — Yamashita Park stroll along the water past the Hikawa Maru liner",
      "15:00 — Cup Noodles Museum (¥500): design and seal your own custom Cup Noodle (~¥500) — the dumbest great souvenir in Japan",
      "16:30 — Red Brick Warehouse: German-style Christmas Market in December (mulled wine, sausages, skating rink) as the lights come on",
      "18:00 — Minato Mirai illumination walk + Landmark Tower Sky Garden observatory (¥1,000, 273m) for the harbor-and-Fuji dusk view",
      "19:30 — Dinner-and-a-beer in Noge, the old-school izakaya quarter, then Toyoko line home",
    ],
    protip:
      "The Ramen Museum shops post their wait times at the door — split into pairs and divide-and-conquer different bowls, then compare notes. The Christmas market at the Red Brick Warehouse charges a small entry on December weekends and queues after 17:00; weekday evening is the cheat code.",
    links: [
      { label: "Shin-Yokohama Ramen Museum", url: "https://www.raumen.co.jp/english/" },
      { label: "Cup Noodles Museum Yokohama", url: "https://www.cupnoodles-museum.jp/" },
    ],
    wiki: "Minato Mirai 21",
  },

  // ───────────────────────── FROM KANSAI BASE ─────────────────────────
  {
    id: "nara",
    name: "Nara — Deer, the Great Buddha & Mochi Violence",
    jp: "奈良",
    base: "Kansai",
    travel:
      "Kintetsu limited express Kyoto→Kintetsu-Nara, 35 min, ¥1,280 (~$8.50) each way (¥760 fare + ¥520 reserved seat) — drops you a 5-min walk from the park; the ordinary express on the same line is ¥760 and only 10 min slower. Skip JR Nara; it's a 20-min walk further out.",
    cost: "~$35/person (trains ¥2,560 + Todai-ji ¥800 + deer crackers, mochi, sake tasting)",
    hours: "12:30–19:30",
    tier: 1,
    pitch:
      "Locked for the Dec 23 afternoon: 1,200 sacred deer that bow for crackers, a 500-ton bronze Buddha from 752 AD inside one of the largest wooden buildings on Earth, and the viral mochi-pounding shop — all within one walkable park. December means fluffy winter deer, thin crowds, and more bowing per cracker. An afternoon is genuinely enough.",
    play: [
      "12:30 — Kintetsu limited express from Kyoto (buy reserved seats at the machine — all 8 together, big windows)",
      "13:10 — Kintetsu-Nara station: straight up the Higashimuki arcade",
      "13:20 — Nakatanidou: catch the high-speed mochi pounding if the hammers are flying, eat one warm yomogi mochi regardless (¥200 — best ¥200 in Kansai)",
      "13:45 — Into Nara Park: buy shika senbei (¥200), get politely mobbed, hold a cracker high and collect a bow",
      "14:30 — Todai-ji Daibutsuden (¥800): the 15m Great Buddha — and the pillar with a hole the size of his nostril (crawl through = enlightenment, limber members only)",
      "15:30 — Walk the stone-lantern path through the forest to Kasuga Taisha (grounds free; deer included)",
      "16:30 — Naramachi old quarter: machiya lanes + Harushika brewery sake tasting (5 pours, ¥500)",
      "17:45 — Snacks/dinner near Higashimuki, then the limited express back — Kyoto by ~19:30",
    ],
    protip:
      "The deer bow first and headbutt second — hide every piece of paper (maps, tickets, rail passes smell like food, apparently). Hold senbei behind your back between feedings or you become the buffet. Todai-ji last entry is 16:30 in winter: do the Buddha before the shrine, not after.",
    links: [
      { label: "Kintetsu Railway (English)", url: "https://www.kintetsu.co.jp/foreign/english/" },
      { label: "Todai-ji official", url: "https://www.todaiji.or.jp/" },
    ],
    wiki: "Nara Park",
  },
  {
    id: "uji-nintendo",
    name: "Uji + Nintendo Museum",
    jp: "宇治・ニンテンドーミュージアム",
    base: "Kansai",
    travel:
      "JR Nara line rapid Kyoto→Uji, 17 min, ¥240 (~$1.60). The Nintendo Museum sits beside Kintetsu Ogura station, a ~20-min walk (or short cab) west of the Byodo-in area — then ride Kintetsu south from Ogura via Yamato-Saidaiji straight into Osaka-Namba (~60 min, ~¥900), luggage already forwarded.",
    cost: "~$45/person (museum ¥3,300 + Byodo-in ¥700 + trains ~¥1,200 + matcha + Hatena Burger)",
    hours: "08:45–16:30",
    tier: 1,
    pitch:
      "Locked for Dec 24 morning, engineered as the Kyoto→Osaka moving day: Japan's matcha capital plus the temple on the ¥10 coin in the morning, then the Nintendo Museum — every console the company ever made, back to the 1889 hanafuda cards, with giant-controller games you burn digital coins on. It's lottery-entry only, so the whole squad applies three months out and we pool the wins.",
    play: [
      "08:45 — Send luggage Kyoto→Osaka by Yamato takkyubin (or coin-locker it at Kyoto station), then JR rapid to Uji",
      "09:15 — Byodo-in (¥700): the Phoenix Hall floating on its pond — the building on the ¥10 coin, in clean December morning light",
      "10:15 — Matcha on the temple approach: Nakamura Tokichi for the parfait, or Tsuen by the bridge — pouring tea since 1160, the oldest tea house on Earth",
      "11:00 — Cross the Uji river for a quick Ujigami Shrine hit (free; oldest original shrine building in Japan) if the timing's loose",
      "11:30 — Walk or cab ~20 min west to the Nintendo Museum by Kintetsu Ogura",
      "12:00 — Museum entry slot (¥3,300; LOTTERY at museum-tickets.nintendo.com ~3 months ahead — all 8 apply for the same date/slot separately): upstairs is the full hardware timeline, no photos of half of it, pure nostalgia damage",
      "13:00 — Burn your 10 coins downstairs: two-person giant NES controllers, Ultra Machine batting, zapper duels — winner of giant Mario claims bragging rights through Osaka",
      "14:30 — Late lunch at the museum's Hatena Burger (build-your-own; reserve when you book entry)",
      "15:15 — Kintetsu from Ogura→change Yamato-Saidaiji→Osaka-Namba: walk into the Namba apartment by ~16:30, Christmas Eve in Dotonbori ahead",
    ],
    protip:
      "The lottery is the whole ballgame: applications open ~3 months before the visit month — set a calendar alarm for late September 2026, everyone applies, duplicate wins get released. If the lottery shuts us out entirely, the Uji half still works as a 3-hour matcha-and-temple stop and we're in Osaka by 13:00.",
    links: [
      { label: "Nintendo Museum tickets", url: "https://museum-tickets.nintendo.com/" },
      { label: "Byodo-in official", url: "https://www.byodoin.or.jp/" },
    ],
    wiki: "Byōdō-in",
  },
  {
    id: "hiroshima-miyajima",
    name: "Hiroshima + Miyajima",
    jp: "広島・宮島",
    base: "Kansai",
    travel:
      "Nozomi shinkansen Shin-Osaka→Hiroshima, ~85 min, ~¥10,620 (~$71) reserved each way — book all 8 seats together on the smartEX app/site well ahead (Dec 26 sits in peak New Year travel season, so reserved cars fill). In town: trams ¥220 flat; JR Sanyo line Hiroshima→Miyajimaguchi 25 min + 10-min ferry (~¥300 incl. the ¥100 island tax).",
    cost: "~$185/person (shinkansen ¥21,240 + museum/shrine/ferry ~¥1,100 + okonomiyaki + oysters)",
    hours: "07:00–21:15",
    tier: 1,
    pitch:
      "Locked Dec 26 and the heaviest, best day of the trip: the Peace Memorial Museum in the morning — devastating, essential, non-negotiable — then the spirit-lifting second act on Miyajima, where the vermillion torii rises out of the Seto Inland Sea and December means oyster season at its absolute peak. Two of Japan's most important places, one bullet train, home by nine.",
    play: [
      "07:00 — Midosuji line to Shin-Osaka; Nozomi rolling by ~07:40 (konbini breakfast on the platform)",
      "09:10 — Tram or 15-min walk to the Peace Memorial Park: approach the A-Bomb Dome first, from across the river, in quiet morning light",
      "09:45 — Peace Memorial Museum (¥200): give it two unhurried hours — artifacts, testimony, no flinching; this is why we came",
      "12:00 — Cenotaph, eternal flame, and the Children's Peace Monument draped in a million paper cranes",
      "12:45 — Okonomimura: three floors of griddle counters — Hiroshima-style okonomiyaki with the yakisoba layer (~¥1,200), sit wherever there's seats",
      "14:00 — JR Sanyo line to Miyajimaguchi (25 min), straight onto the ferry (10 min — stand on the right, starboard side, for the torii approach)",
      "14:45 — Itsukushima Shrine (¥500): the shrine on stilts and THE torii — timed to the tide if the gods cooperate (floating at high tide, walk-up-and-touch-it at low)",
      "15:45 — Omotesando arcade: grilled oysters at the street stalls (December = peak season, ¥500–800) + momiji manju fried fresh",
      "17:00 — Dusk torii against the lit water, then the 17:30–18:00 ferry back",
      "19:15 — Nozomi home; Namba by ~21:15, legs done, perspective recalibrated",
    ],
    protip:
      "Check the Miyajima tide table (on the official island site) the week before and flip the day if needed — museum-first vs island-first — to catch the torii BOTH floating and walkable. Book the Peace Museum timed entry online to skip the line, and don't schedule anything emotionally demanding for that evening; the museum stays with you.",
    links: [
      { label: "Hiroshima Peace Memorial Museum", url: "https://hpmmuseum.jp/" },
      { label: "Miyajima Tourist Association", url: "https://www.miyajima.or.jp/" },
      { label: "smartEX shinkansen booking", url: "https://smart-ex.jp/en/" },
    ],
    wiki: "Itsukushima Shrine",
  },
  {
    id: "himeji-kobe",
    name: "Himeji + Kobe Combo",
    jp: "姫路・神戸",
    base: "Kansai",
    travel:
      "Nozomi/Sakura shinkansen Shin-Osaka→Himeji, ~30 min, ~¥3,280 (~$22) unreserved each way; return in stages — JR Special Rapid Himeji→Sannomiya (Kobe) 40 min ¥990, then Sannomiya→Osaka 21 min ¥420. Three cities, one JR line home.",
    cost: "~$130/person (trains ~¥7,800 + castle combo ¥1,050 + Kobe beef teppanyaki lunch ~¥8,000)",
    hours: "08:15–19:00",
    tier: 2,
    pitch:
      "The Dec 28 audible, and it's a banger: Japan's greatest surviving original castle — the White Heron, never burned, never bombed, never concrete — 30 minutes away by bullet train, then certified Kobe beef eaten in Kobe at half the dinner price, plus the hillside Kitano district on the walk-off. Castle, A5 wagyu, harbor dusk, back in Namba for the last big night.",
    play: [
      "08:15 — Midosuji to Shin-Osaka; ~08:45 shinkansen west (unreserved cars are fine for a 30-min hop)",
      "09:20 — Himeji station: the castle fills the avenue dead ahead — 15-min walk straight at it",
      "09:45 — Himeji Castle (¥1,000): six storeys of original 1609 keep, shoes-off ladder-stairs, arrow slits and stone-drop chutes — at opening you'll have it nearly to yourselves",
      "11:30 — Koko-en gardens next door (combo ticket ¥1,050 covers both): nine Edo-style walled gardens against the castle backdrop",
      "12:20 — JR Special Rapid east to Sannomiya (40 min — same view the shinkansen charges triple for)",
      "13:15 — Kobe beef teppanyaki LUNCH in Sannomiya: lunch sets run ¥6,000–10,000 vs ¥20,000+ at dinner — book ahead for 8 or split across two counters and trade bites",
      "15:00 — Kitano-Ijinkan: Meiji-era foreign merchants' mansions on the hillside, Starbucks-in-a-heritage-house included",
      "16:15 — Nankinmachi Chinatown snack lap, then Kobe Harborland as the port tower and Ferris wheel light up (~17:00 December dusk)",
      "18:15 — JR back to Osaka — showered and in Ura-Namba by 20:00 for the farewell crawl",
    ],
    protip:
      "Himeji Castle's last keep entry is 16:00 and it closes Dec 29–30 for New Year — the 28th is literally the last possible day, which is why this audible exists. White walls against December blue sky are blinding: sunglasses are gear, not vibes. Kobe Luminarie has shifted to late January in recent years, so don't bank on it — Harborland's regular lights carry the evening fine.",
    links: [
      { label: "Himeji Castle official", url: "https://www.himejicastle.jp/" },
      { label: "Feel Kobe (official tourism)", url: "https://www.feel-kobe.jp/" },
    ],
    wiki: "Himeji Castle",
  },
  {
    id: "minoo-falls",
    name: "Minoo Falls",
    jp: "箕面大滝",
    base: "Kansai",
    travel:
      "Hankyu Takarazuka line Osaka-Umeda→Ishibashi handai-mae (change cross-platform to the Minoo line)→Minoh, ~30 min total, ¥280 (~$1.90) each way. The trail starts directly behind the station's shopping street.",
    cost: "~$15/person (trains ¥560 + momiji tempura ¥400 + coffee; lunch back in Umeda)",
    hours: "09:00–14:00",
    tier: 3,
    pitch:
      "Osaka's hidden reset button: a 33-meter waterfall at the end of a gentle 2.8km river-gorge trail, half an hour from Umeda for less than two dollars. The signature snack is momiji tempura — actual maple leaves, battered and fried, a tradition the trailside shops have kept going for centuries. December means a near-empty trail, maybe the last stubborn red maples, and a full afternoon still left in the city.",
    play: [
      "09:00 — Hankyu from Umeda, cross-platform change at Ishibashi handai-mae",
      "09:40 — Minoh station: grab coffee, hit the paved riverside trail behind the shopping street",
      "10:00 — Momiji tempura stalls along the lower trail — buy a bag of fried maple leaves for the walk (sweet, crunchy, weirdly addictive)",
      "10:30 — Ryuanji (Mino Temple) halfway up: vermillion bridge over the gorge, founded 7th century",
      "11:15 — Minoo Falls: 33m of water in a maple amphitheater — winter flow against bare red-brown hillsides, photo, snack, exhale",
      "12:00 — Amble back down; the tiny Minoh insect museum (¥280) for the brave, beer-of-record at Minoh Beer's local taps if open",
      "13:00 — Hankyu back — standing in Umeda by ~13:45 with the whole Osaka afternoon ahead",
    ],
    protip:
      "Wild monkeys live in the park — don't eat while walking and don't flash the tempura bag, they know exactly what's in it. The trail is paved the whole way (sneakers fine, zero hiking gear), which makes this the perfect hangover-morning or rest-day half-card; pair it with Umeda Sky Building at sunset for a full low-effort day.",
    links: [
      { label: "Minoo Park official", url: "https://www.mino-park.jp/" },
      { label: "Hankyu Railway (English)", url: "https://www.hankyu.co.jp/global/" },
    ],
    wiki: "Meiji no Mori Minō Quasi-National Park",
  },
];
