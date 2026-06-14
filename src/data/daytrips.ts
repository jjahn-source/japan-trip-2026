export type DayTrip = {
  id: string;
  name: string;
  jp: string;
  base: "Tokyo" | "Kansai"; // which home base it runs from
  travel: string; // exact route + time + cost, e.g. "JR Shonan-Shinjuku line Shinjuku→Kamakura, ~60 min, ¥960 ($6) each way — tap Suica/PASMO, no rail pass..."
  cost: string; // realistic all-in per person USD for the day
  hours: string; // door-to-door, e.g. "07:30–19:30"
  tier: 1 | 2 | 3; // 1 = locked into the itinerary, 2 = strong audible, 3 = if a day frees up
  pitch: string; // 2-3 sentence sell
  play: string[]; // 6-10 step hour-by-hour run of show, each step "HH:MM — thing (detail)"
  protip: string;
  links: { label: string; url: string }[]; // 1-3 REAL official links (transport pass page, attraction official site)
  wiki: string; // exact English Wikipedia article title for the hero photo, e.g. "Kōtoku-in" or "Itsukushima Shrine"
};

export const DAY_TRIPS: DayTrip[] = [
  // ───────────────────────── FROM TOKYO BASE ─────────────────────────
  {
    id: "kamakura-enoshima",
    name: "Kamakura + Enoshima",
    jp: "鎌倉・江の島",
    base: "Tokyo",
    travel:
      "Point-to-point on Suica/PASMO, NO rail pass: JR Yokosuka / Shonan-Shinjuku line Shinjuku or Tokyo→Kamakura direct, ~60 min, ¥960 ($6); inside the area the 1902 Enoden tram hops temple-to-temple (tap your IC card, or the 'Noriorikun' day pass ¥700/$4.40 pays off after ~3 rides); return from Katase-Enoshima on the Odakyu line to Shinjuku ~70 min ¥660 ($4.10), or Enoden back to Kamakura + JR. Forward nothing — this is a day bag, IC-card, no-reservation kind of trip.",
    cost: "~$50/person (trains ~$15 + Great Buddha + Hase-dera + Enoshima island pass + shirasu lunch + street food)",
    hours: "08:00–19:30",
    tier: 1,
    pitch:
      "THE Dec 19 plan: the samurai capital by the sea, one hour south. A 13-meter open-air bronze Buddha you can stand INSIDE, a hillside temple staring down the Pacific, and a rattling 110-year-old green tram threading between surf shops and backyards. Cap it on Enoshima island, where a crisp, dry December evening hands you the single best Fuji-over-the-ocean sunset anywhere near Tokyo — volcano silhouette across Sagami Bay, then the Sea Candle lighthouse lit up for winter. Replaces the old Hakone day entirely, costs half as much, and never once asks you to look at a rail pass.",
    play: [
      "08:00 — JR Yokosuka/Shonan-Shinjuku line from Shinjuku or Tokyo (grab egg sandos + a hot coffee for the ride; tap in with Suica, no reservation, no pass)",
      "09:05 — Kamakura station: walk Komachi-dori as the snack shops roll up their shutters (sweet-potato soft serve and warm ningyo-yaki at 9am is fully legal here)",
      "09:40 — Tsurugaoka Hachimangu: the Minamoto shogunate's great shrine crowning the avenue, wide stone approach (dankazura) and a giant ginkgo, near-empty at this hour",
      "10:30 — Enoden tram from Kamakura to Hase (4 stops — the tiny green tram squeezing between living-room windows is half the reason you came)",
      "10:50 — The Great Buddha at Kotoku-in (¥300/$1.90, +¥50 to climb INSIDE the 1252 bronze casting and see the hollow shell) — open-air since a 1498 tsunami took the hall",
      "11:50 — Hase-dera (¥400/$2.50): the 9m gilded eleven-headed Kannon, thousands of tiny red-bibbed jizo, and a hillside terrace looking straight down Yuigahama beach to the bay",
      "12:50 — Shirasu-don lunch near Hase (raw or boiled whitebait over rice — the Shonan coast's signature; ~¥1,300/$8)",
      "14:00 — Enoden the rest of the way down the coast to Enoshima — December-clear days throw Fuji up over the water out the right-hand windows, between the houses, for about 40 seconds at Kamakurakohan",
      "14:40 — Cross the causeway bridge to Enoshima: climb past Enoshima Shrine, ride the outdoor escalators ('Escar') up, hit the Iwaya sea caves at the back of the island (¥500/$3.10, candle-lit lava tubes the waves carved)",
      "16:00 — Be at the Sea Candle observation tower (¥800/$5, or the ¥1,100/$6.90 island combo covers caves + garden + tower + escalators) for the December alpenglow",
      "16:35 — Fuji silhouette goes black against an orange Sagami Bay at sunset; the Samuel Cocking Garden + Sea Candle winter illumination switches on after dark, then Odakyu home from Katase-Enoshima",
    ],
    protip:
      "Sunset is ~16:35 in mid-December and the light show is FAST — build the whole day backwards from standing on Enoshima's west side by 16:10. Mornings near the coast hover just above freezing and the wind off the bay bites, so this is a real-coat day even though it's at sea level. Black kites (tonbi) divebomb street food along this entire coast — eat with your back to a wall, hold the senbei low. Weekday beats weekend by a mile; the Enoden gets sardine-packed on December weekends chasing the same Fuji sunset you are.",
    links: [
      { label: "Kotoku-in (Great Buddha) official", url: "https://www.kotoku-in.jp/en/" },
      { label: "Hase-dera official", url: "https://www.hasedera.jp/en/" },
      { label: "Enoden railway (English)", url: "https://www.enoden.co.jp/en/" },
      { label: "Enoshima Sea Candle / Cocking Garden", url: "https://enoshima-seacandle.com/" },
    ],
    wiki: "Kōtoku-in",
  },
  {
    id: "nikko",
    name: "Nikko — Toshogu in Winter",
    jp: "日光",
    base: "Tokyo",
    travel:
      "Point-to-point, NO rail pass: Tobu limited express (Revaty Kegon / Spacia X) Asakusa→Tobu-Nikko, ~1h50, ~¥3,050 ($19) each way with reserved seat — buy seats on the Tobu Top Tours / Tobu Railway site in advance; or pay-as-you-go on local Tobu trains + area buses with your IC card and just add the limited express seat fee each way to skip the slow ride. (Tobu, not JR — your Suica/PASMO taps the buses too.)",
    cost: "~$70/person (trains ~$38 + Toshogu ¥1,600/$10 + yuba lunch + buses)",
    hours: "07:00–19:00",
    tier: 3,
    pitch:
      "Tokugawa Ieyasu's mausoleum is the most extravagant thing ever built in Japan — a mountain forest of 350-year-old cedars wrapped around shrines dripping in gold leaf and over 5,000 carvings. In late December there's a real chance the whole complex is dusted in snow, which turns the gold up to eleven and the crowds down to nothing, and the cold thins the day-tripper herd to almost zero. The longest haul in the Tokyo deck, and it earns every minute. UNESCO World Heritage, and it shows.",
    play: [
      "07:00 — Revaty/Spacia X limited express from Asakusa (reserve seats in advance; sleep, or stare out at a frozen Kanto plain — buy a hot coffee at the kiosk)",
      "09:00 — Tobu-Nikko station: bus up the hill (tap your IC card) past the Shinkyo sacred bridge",
      "09:30 — Toshogu (¥1,600/$10): the Yomeimon 'sunset gate' (so detailed people once stared at it till dusk — hence the name), the original see-no-evil-hear-no-evil-speak-no-evil monkeys, the famous sleeping cat (nemuri-neko), then 207 stone steps up to Ieyasu's surprisingly quiet bronze tomb",
      "11:30 — Futarasan Shrine and Taiyuin: the grandson Iemitsu's deliberately humbler mausoleum tucked in the cedars — many people's secret favorite, and far quieter than Toshogu",
      "12:45 — Yuba lunch (yuba = tofu skin, in every conceivable form — Nikko's mountain-temple monk specialty, weirdly excellent, and hot food is the move at near-freezing altitude)",
      "14:00 — Kanmangafuchi Abyss: a lava-gorge riverside lined with ~70 jizo statues in red knit caps (the 'Bake-jizo' — count them twice and you'll get a different number, allegedly), dead silent and dusted with snow in winter",
      "15:00 — Rinno-ji temple's Sanbutsudo hall and the gold Buddhas, if legs allow",
      "15:45 — Shinkyo bridge photo (vermillion arch over an icy river), sweet shops, and warm yuba manju or castella cake for the train",
      "16:30 — Limited express home; Asakusa by ~18:30",
    ],
    protip:
      "It runs a brutal 5–8°C colder than Tokyo and the shaded shrine paths hold ice all day — this is the trip for every single layer you packed, plus grip soles. Skip the Lake Chuzenji / Kegon Falls extension in December (the Irohazaka switchback road ices over, buses get cut, and it eats 2+ hours); the World Heritage cluster in town IS the show. Buy limited express seats both ways in advance — winter trains run short and the good ones sell out. The Tobu Nikko Pass covers the round trip + local buses on your card, no JR involved.",
    links: [
      { label: "Nikko Toshogu official", url: "https://www.toshogu.jp/" },
      { label: "Nikko Toshogu (English)", url: "https://www.toshogu.jp/english/" },
      { label: "Tobu Railway passes (English)", url: "https://www.tobu.co.jp/en/" },
    ],
    wiki: "Nikkō Tōshō-gū",
  },
  {
    id: "kawaguchiko",
    name: "Kawaguchiko — Closest Fuji Day",
    jp: "河口湖",
    base: "Tokyo",
    travel:
      "Highway bus from Busta Shinjuku (the terminal above Shinjuku station, gate 4F)→Kawaguchiko Station, ~1h45, ~¥2,200 ($14) each way — reserve seats online up to a month out (no rail pass exists for this anyway); first departures ~6:45 sell the best Fuji light. The slower alternative is JR/Fujikyu trains paid by IC card, but the bus is faster and cheaper.",
    cost: "~$60/person (bus ~$28 + local trains/ropeway ~$18 + hoto lunch)",
    hours: "06:45–19:00",
    tier: 3,
    pitch:
      "The Fuji Five Lakes put you at the mountain's feet: Chureito Pagoda's five-story-pagoda-plus-Fuji postcard, the lake panorama from the ropeway, and the volcano filling your entire windshield from 15km out. December is statistically the best month of the year to actually SEE Fuji — cold, dry, ruthless clarity, and the snowcap is finally on. This is the all-in photo day, and it only runs on a clear forecast — check the webcam the night before or don't go.",
    play: [
      "06:45 — Highway bus from Busta Shinjuku (left/passenger side seats for the Fuji reveal as the expressway crests; sunrise Fuji over the wing of the bus is the warmup)",
      "08:45 — Kawaguchiko Station: Fuji status check, lockers for anything heavy, hot vending-machine coffee",
      "09:15 — Fujikyu line two stops to Shimoyoshida → climb the 398 steps to Chureito Pagoda (THE postcard: vermillion five-story pagoda, town below, snow-capped Fuji filling the sky behind — and in December, no autumn-leaf tour-bus mob)",
      "11:15 — Back to Kawaguchiko; hoto lunch (flat hand-cut udon in a pumpkin-miso stew served boiling in an iron pot — Yamanashi's winter weapon, ~¥1,200/$8)",
      "12:45 — Mt. Fuji Panoramic Ropeway (the 'Kachi Kachi Yama' ropeway) up Mt. Tenjo (~¥1,800/$11 round trip) for the lake-and-Fuji panorama and the tanuki-and-rabbit folktale photo spots",
      "14:15 — Bus or rental cycle to Oishi Park on the north shore — THE calendar-photo angle, Fuji mirrored across Lake Kawaguchi with winter flowers in the foreground",
      "15:45 — Lakeside coffee and a Fujiyama Cookie back near the station to thaw out",
      "16:30 — Watch the December alpenglow ('beni-Fuji') turn the snowcap pink (~16:30), then the bus home — Shinjuku by ~18:30",
    ],
    protip:
      "Book a CANCELLABLE bus and decide the night before off the forecast and live webcams — Fuji hidden = day wasted, Fuji out = the best photos of the entire trip. It's a high-altitude basin (~830m): noticeably colder than Tokyo, dawn well below freezing, and the pagoda steps are sheet ice in the morning shade — grip soles or you're going down them on your back. Buses back to Shinjuku sell out Sunday and holiday evenings; reserve the return seat too. If two clear days line up, this and Kamakura+Enoshima are your two Fuji angles — ocean vs lake.",
    links: [
      { label: "Highway Bus reservations (Keio)", url: "https://www.highwaybus.com/gp/index" },
      { label: "Mt. Fuji Panoramic Ropeway", url: "https://www.mtfujiropeway.jp/en/" },
      { label: "Fujikyu Railway (English)", url: "https://www.fujikyu-railway.jp/en/" },
    ],
    wiki: "Lake Kawaguchi",
  },
  {
    id: "yokohama",
    name: "Yokohama — Ramen, Chinatown & Harbor Lights",
    jp: "横浜",
    base: "Tokyo",
    travel:
      "Point-to-point on Suica/PASMO, no pass: Tokyu Shin-Yokohama line Shibuya→Shin-Yokohama direct, ~25 min, ~¥470 ($2.90) to start at the Ramen Museum; then local trains / Minatomirai line between districts (¥200–300/$1.30–1.90 a hop, just tap); Tokyu Toyoko line back to Shibuya from Motomachi-Chukagai, ~40 min, ¥550 ($3.40).",
    cost: "~$45/person (trains ~$9 + museums ~$9 + ramen grazing + Christmas market beers)",
    hours: "10:30–21:00",
    tier: 3,
    pitch:
      "Japan's second city is 30 minutes away and built for a low-effort, high-calorie day: a retro-streetscape museum where you crawl nine regional ramen styles in mini-bowls, the country's biggest Chinatown, and a harbor skyline that does December better than almost anywhere — Christmas market, skating rink, full illumination. The best bad-weather or tired-legs card in the deck.",
    play: [
      "10:30 — Tokyu direct from Shibuya to Shin-Yokohama",
      "11:00 — Shin-Yokohama Ramen Museum (~¥450/$2.80 entry): a 1958 Tokyo streetscape underground with nine legendary regional shops — order mini-bowls (~¥600/$3.80 each) and hit three minimum",
      "13:00 — Train to Motomachi-Chukagai: Yokohama Chinatown, 600+ shops — steamed buns and peking-duck wraps as dessert-after-ramen",
      "14:30 — Yamashita Park stroll along the water past the Hikawa Maru liner (wind off the bay is cold — keep moving)",
      "15:00 — Cup Noodles Museum (¥500/$3.10): design and seal your own custom Cup Noodle (~¥500/$3.10 extra) — the dumbest great souvenir in Japan",
      "16:30 — Red Brick Warehouse: German-style Christmas Market in December (mulled wine, sausages, an outdoor skating rink) just as the lights come on at dusk",
      "18:00 — Minato Mirai illumination walk + Landmark Tower Sky Garden observatory (¥1,000/$6.30, 273m) for the harbor-and-Fuji dusk view — clear December evenings put Fuji on the western horizon",
      "19:30 — Dinner-and-a-beer in Noge, the old-school izakaya quarter, then Toyoko line home",
    ],
    protip:
      "The Ramen Museum shops post their wait times at the door — split into pairs and divide-and-conquer different bowls, then compare notes. The Christmas market at the Red Brick Warehouse charges a small entry on December weekends and queues after 17:00; weekday evening is the cheat code.",
    links: [
      { label: "Shin-Yokohama Ramen Museum", url: "https://www.raumen.co.jp/english/" },
      { label: "Cup Noodles Museum Yokohama", url: "https://www.cupnoodles-museum.jp/en/yokohama/" },
      { label: "Yokohama Red Brick Warehouse", url: "https://www.yokohama-akarenga.jp/en/" },
    ],
    wiki: "Minato Mirai 21",
  },

  {
    id: "kawagoe",
    name: "Kawagoe — Little Edo",
    jp: "川越",
    base: "Tokyo",
    travel:
      "Closest day trip in the deck, all on IC card: Tobu Tojo line express Ikebukuro→Kawagoe, ~30 min, ~¥480 ($3) each way; or the Seibu Shinjuku line to Hon-Kawagoe. The Kurazukuri warehouse street is a 10–15 min walk or a short ¥190/$1.20 Tobu bus hop from the station — tap your Suica on the bus.",
    cost: "~$30/person (trains ~$6 + Toki-no-Kane area is free + sweet-potato everything + craft beer + lunch)",
    hours: "09:30–18:00",
    tier: 3,
    pitch:
      "Half an hour north of Ikebukuro sits a town that kept its Edo merchant streetscape: black clay-walled kurazukuri warehouses, a 400-year-old wooden bell tower (Toki-no-Kane) that still chimes, and an entire alley of penny-candy shops. It's the low-effort, low-cost, high-charm card — no mountains, no bullet train, no reservations, just a half-day wander with a beer and a sweet-potato soft serve. Sweet potato is the local obsession; lean into it.",
    play: [
      "09:30 — Tobu Tojo express from Ikebukuro (grab a coffee, it's a short hop)",
      "10:15 — Walk into the Kurazukuri (warehouse) district: the surviving Edo merchant street, clay-walled storehouses now full of shops",
      "10:45 — Toki-no-Kane: the wooden bell tower over the rooftops, ~400 years old, chimes at noon — time the photo to the 12:00 ring",
      "11:15 — Kashiya Yokocho ('Penny Candy Alley'): a lane of old-school sweet shops — fat sweet-potato chips, candy, and the longest sweet-potato soft serve you'll ever hold",
      "12:30 — Lunch: unagi (Kawagoe's traditional specialty, ~¥2,500/$16) or sweet-potato-themed everything; Coedo craft beer (the local brewery, sweet-potato 'Beniaka' lager included) at a tap room",
      "14:00 — Kawagoe Hikawa Shrine: the tunnel of ~1,500 pink and red wind chimes and the heart-shaped 'aitai' draw — quiet and pretty in winter light",
      "15:00 — Kita-in temple: the only surviving rooms of Edo Castle (relocated here after a fire) and the 540 stone Gohyaku-Rakan statues, every face different",
      "16:00 — Last warehouse-street wander as the December dusk and shop lanterns come on (~16:30 sunset), then the train back to Ikebukuro by ~17:30",
    ],
    protip:
      "It's a flat, walkable half-day with zero altitude and no Fuji gamble — the perfect bad-forecast or recovery-day card, and the cheapest day in the whole deck. Mondays many of the old shops close, so aim Tue–Sun. Pair it with an Ikebukuro evening (Sunshine City, Pokémon Center MEGA) on the way back since you're returning to that exact station.",
    links: [
      { label: "Tobu Railway — Kawagoe guide", url: "https://www.tobu.co.jp/en/sightseeing/articles/27.html" },
      { label: "Koedo Kawagoe (official tourism)", url: "https://www.koedo.or.jp/foreign/english/" },
    ],
    wiki: "Kawagoe",
  },

  // ───────────────────────── FROM KANSAI BASE ─────────────────────────
  {
    id: "nara",
    name: "Nara — Deer, the Great Buddha & Mochi Violence",
    jp: "奈良",
    base: "Kansai",
    travel:
      "Point-to-point on Suica/ICOCA, no pass: Kintetsu limited express Kyoto→Kintetsu-Nara, 35 min, ¥1,280 ($8) each way (¥760 fare + ¥520 reserved seat) — drops you a 5-min walk from the park; the ordinary express on the same line is ¥760 ($4.80) and only 10 min slower. Skip JR Nara; it's a 20-min walk further out.",
    cost: "~$35/person (trains ~$16 + Todai-ji ¥800/$5 + deer crackers, mochi, sake tasting)",
    hours: "12:30–19:30",
    tier: 1,
    pitch:
      "Locked for the Dec 23 afternoon: 1,200 sacred deer that bow for crackers, a 500-ton bronze Buddha from 752 AD inside one of the largest wooden buildings on Earth, and the viral mochi-pounding shop — all within one walkable park. December means fluffy winter deer, thin crowds, and more bowing per cracker. An afternoon is genuinely enough.",
    play: [
      "12:30 — Kintetsu limited express from Kyoto (buy reserved seats at the machine — all 8 together, big windows)",
      "13:10 — Kintetsu-Nara station: straight up the Higashimuki arcade",
      "13:20 — Nakatanidou: catch the high-speed mochi pounding if the hammers are flying (the two-man pounding show is a viral institution — they go absurdly fast), eat one warm yomogi mochi regardless (¥200/$1.30 — best ¥200 in Kansai)",
      "13:45 — Into Nara Park: buy shika senbei (¥200/$1.30 a stack), get politely mobbed, hold a cracker high and collect a bow before you hand it over",
      "14:30 — Todai-ji Daibutsuden (¥800/$5): the 15m, 500-ton bronze Great Buddha from 752 AD inside one of the largest wooden buildings on Earth — and the pillar with a hole the exact size of his nostril (crawl through = enlightenment, limber members only)",
      "15:30 — Walk the stone-lantern path through the forest to Kasuga Taisha (grounds free; ~3,000 bronze and stone lanterns, deer included)",
      "16:15 — Catch the December sunset (~16:45 in Nara) over the park from Nigatsu-do's terrace — the whole Nara basin lights up below the hall, near-empty in winter",
      "16:45 — Naramachi old quarter: machiya lanes + Harushika brewery sake tasting (5 pours, ¥500/$3.10, keep the cup)",
      "17:45 — Snacks/dinner near Higashimuki, then the limited express back — Kyoto by ~19:30",
    ],
    protip:
      "The deer bow first and headbutt second — hide every piece of paper (maps and paper tickets smell like food to them, apparently, and they WILL eat your ticket). Hold senbei behind your back between feedings or you become the buffet. Winter deer are fluffier, calmer, and the crowds thin right out. Todai-ji's last entry is 16:30 in winter, so do the Buddha before the shrine, not after.",
    links: [
      { label: "Kintetsu Railway (English)", url: "https://www.kintetsu.co.jp/foreign/english/" },
      { label: "Todai-ji official", url: "https://www.todaiji.or.jp/" },
      { label: "Nara Park / Visit Nara", url: "https://www.visitnara.jp/" },
    ],
    wiki: "Nara Park",
  },
  {
    id: "uji-nintendo",
    name: "Uji + Nintendo Museum",
    jp: "宇治・ニンテンドーミュージアム",
    base: "Kansai",
    travel:
      "All on IC card, no pass: JR Nara line rapid Kyoto→Uji, 17 min, ¥240 ($1.50). The Nintendo Museum sits beside Kintetsu Ogura station, a ~20-min walk (or short ¥800/$5 cab) west of the Byodo-in area — then ride Kintetsu south from Ogura via Yamato-Saidaiji straight into Osaka-Namba (~60 min, ~¥900/$5.60), luggage already forwarded by Yamato takkyubin.",
    cost: "~$45/person (museum ¥3,300/$21 + Byodo-in ¥700/$4.40 + trains ~$7 + matcha + Hatena Burger)",
    hours: "08:45–16:30",
    tier: 1,
    pitch:
      "Locked for Dec 24 morning, engineered as the Kyoto→Osaka moving day: Japan's matcha capital plus the temple on the ¥10 coin in the morning, then the Nintendo Museum — every console the company ever made, back to the 1889 hanafuda cards, with giant-controller games you burn digital coins on. It's lottery-entry only, so the whole squad applies three months out and we pool the wins.",
    play: [
      "08:45 — Send luggage Kyoto→Osaka by Yamato takkyubin (or coin-locker it at Kyoto station), then JR rapid to Uji",
      "09:15 — Byodo-in (¥700/$4.40): the Phoenix Hall floating on its pond — the exact building on the back of the ¥10 coin, in clean, crisp December morning light",
      "10:15 — Matcha on the temple approach: Nakamura Tokichi for the matcha-jelly parfait, or Tsuen by the bridge — pouring tea since 1160, often called the oldest tea house on Earth",
      "11:00 — Cross the Uji river for a quick Ujigami Shrine hit (free; the oldest original shrine building in Japan, UNESCO-listed) if the timing's loose",
      "11:30 — Walk or cab ~20 min west to the Nintendo Museum by Kintetsu Ogura",
      "12:00 — Museum entry slot (¥3,300/$21; LOTTERY at museum-tickets.nintendo.com ~3 months ahead — all 8 apply for the same date/slot separately): upstairs is the full hardware timeline back to the 1889 hanafuda cards, no photos in half of it, pure nostalgia damage",
      "13:00 — Burn your 10 digital coins downstairs: two-person giant NES controllers, Ultra Machine batting, zapper duels, hanafuda lessons — winner of Giant Mario claims bragging rights all the way through Osaka",
      "14:30 — Late lunch at the museum's Hatena Burger (build-your-own; ~¥1,500/$9, reserve when you book entry)",
      "15:15 — Kintetsu from Ogura→change Yamato-Saidaiji→Osaka-Namba: walk into the Namba apartment by ~16:30, Christmas Eve in Dotonbori ahead",
    ],
    protip:
      "The lottery is the whole ballgame: applications open ~3 months before the visit month — set a calendar alarm for late September 2026, everyone applies, duplicate wins get released. If the lottery shuts us out entirely, the Uji half still works as a 3-hour matcha-and-temple stop and we're in Osaka by 13:00.",
    links: [
      { label: "Nintendo Museum tickets (lottery)", url: "https://museum-tickets.nintendo.com/en/" },
      { label: "Byodo-in official", url: "https://www.byodoin.or.jp/en/" },
      { label: "Nakamura Tokichi (matcha)", url: "https://global.tokichi.jp/" },
    ],
    wiki: "Byōdō-in",
  },
  {
    id: "hiroshima-miyajima",
    name: "Hiroshima + Miyajima",
    jp: "広島・宮島",
    base: "Kansai",
    travel:
      "Nozomi shinkansen Shin-Osaka→Hiroshima, ~85 min, ~¥10,620 ($66) reserved each way — book all 8 seats together on the SmartEX app/site well ahead (no JR Pass; Dec 26 sits in peak New Year travel season, so reserved cars fill). In town: trams ¥220/$1.40 flat, tap your ICOCA; JR Sanyo line Hiroshima→Miyajimaguchi 25 min + 10-min JR ferry (~¥300/$1.90 incl. the ¥100 island visitor tax).",
    cost: "~$175/person (shinkansen ~$132 + museum/shrine/ferry ~$7 + okonomiyaki + oysters)",
    hours: "07:00–21:15",
    tier: 1,
    pitch:
      "Locked Dec 26 and the heaviest, best day of the trip: the Peace Memorial Museum in the morning — devastating, essential, non-negotiable — then the spirit-lifting second act on Miyajima, where the vermillion torii rises out of the Seto Inland Sea and December means oyster season at its absolute peak. Two of Japan's most important places, one bullet train, home by nine.",
    play: [
      "07:00 — Midosuji line to Shin-Osaka; Nozomi rolling by ~07:40 (konbini breakfast on the platform)",
      "09:10 — Tram or 15-min walk to the Peace Memorial Park: approach the A-Bomb Dome first, from across the river, in quiet morning light",
      "09:45 — Peace Memorial Museum (¥200/$1.30): give it two unhurried hours — artifacts, testimony, no flinching; this is why we came",
      "12:00 — Cenotaph, eternal flame, and the Children's Peace Monument draped in a million folded paper cranes",
      "12:45 — Okonomimura: three floors of griddle counters — Hiroshima-style okonomiyaki layered with yakisoba noodles (~¥1,200/$8), grab any open seat at a teppan",
      "14:00 — JR Sanyo line to Miyajimaguchi (25 min), straight onto the JR ferry (10 min — stand on the right, starboard side, for the torii approach)",
      "14:45 — Itsukushima Shrine (¥500/$3.10): the shrine on stilts and THE vermillion torii — timed to the tide if the gods cooperate (floating at high tide, walk-up-and-touch-it at low)",
      "15:45 — Omotesando arcade: grilled oysters at the street stalls (December = peak season, fat and cheap at ¥500–800/$3–5 a pop) + momiji-manju fried fresh and hot",
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
      "No pass needed: Nozomi/Sakura shinkansen Shin-Osaka→Himeji, ~30 min, ~¥3,280 ($21) unreserved each way (SmartEX or just buy at the machine); return in stages on your ICOCA — JR Special Rapid Himeji→Sannomiya (Kobe) 40 min ¥990/$6.20, then Sannomiya→Osaka 21 min ¥420/$2.60. Three cities, one JR line home.",
    cost: "~$130/person (trains ~$49 + castle combo ¥1,050/$6.60 + Kobe beef teppanyaki lunch ~¥8,000/$50)",
    hours: "08:15–19:00",
    tier: 2,
    pitch:
      "The Dec 28 audible, and it's a banger: Japan's greatest surviving original castle — the White Heron, never burned, never bombed, never concrete — 30 minutes away by bullet train, then certified Kobe beef eaten in Kobe at half the dinner price, plus the hillside Kitano district on the walk-off. Castle, A5 wagyu, harbor dusk, back in Namba for the last big night.",
    play: [
      "08:15 — Midosuji to Shin-Osaka; ~08:45 shinkansen west (unreserved cars are fine for a 30-min hop)",
      "09:20 — Himeji station: the castle fills the avenue dead ahead — 15-min walk straight at it",
      "09:45 — Himeji Castle (¥1,000/$6.30): six storeys of original 1609 keep, shoes-off ladder-stairs, arrow slits and stone-drop chutes — at opening you'll have it nearly to yourselves",
      "11:30 — Koko-en gardens next door (combo ticket ¥1,050/$6.60 covers both): nine Edo-style walled gardens against the white castle backdrop",
      "12:20 — JR Special Rapid east to Sannomiya (40 min — same Inland Sea view the shinkansen charges triple for)",
      "13:15 — Kobe beef teppanyaki LUNCH in Sannomiya: lunch sets run ¥6,000–10,000/$38–63 vs ¥20,000+/$125+ at dinner — book ahead for 8, or split across two counters and trade bites",
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
      "Hankyu Takarazuka line Osaka-Umeda→Ishibashi handai-mae (change cross-platform to the Minoo line)→Minoh, ~30 min total, ¥280 ($1.80) each way, tap your ICOCA. The trail starts directly behind the station's shopping street.",
    cost: "~$15/person (trains ~$3.60 + momiji tempura ¥400/$2.50 + coffee; lunch back in Umeda)",
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
      "12:00 — Amble back down; the tiny Minoh insect museum (¥280/$1.80) for the brave, beer-of-record at Minoh Beer's local taps if open",
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
  {
    id: "koyasan",
    name: "Koyasan — Mountain of the Dead",
    jp: "高野山",
    base: "Kansai",
    travel:
      "All on ICOCA, no rail pass: Nankai Koya line limited express Osaka-Namba→Gokurakubashi, ~80 min, ¥1,650 ($10) each way (¥870 fare + ¥780 ltd-express seat), then the 5-min funicular cable car up the mountainside (¥500/$3.10) and a bus into town (tap your card). The Nankai 'Koyasan World Heritage Ticket' bundles the round trip + buses if you'd rather one purchase — your call, but plain IC works fine.",
    cost: "~$55/person (trains+cable+bus ~$32 + Kongobuji ¥1,000/$6.30 + shojin-ryori lunch + Okunoin free)",
    hours: "07:30–19:30",
    tier: 3,
    pitch:
      "1,200 years of Shingon Buddhism on a misty mountaintop temple-town at 800m. The headliner is Okunoin: a 2km path through Japan's largest cemetery — 200,000+ moss-furred graves and towering cedars leading to the mausoleum of Kobo Daishi, who is officially 'meditating,' not dead, and gets two meals a day delivered to this morning. December buries the whole place in silence, often snow, and almost no one else. Heaviest atmosphere of any day in the deck.",
    play: [
      "07:30 — Nankai limited express from Namba (reserve the seat; mountains close in fast through the windows)",
      "09:00 — Gokurakubashi → cable car up the cliff (steep enough to feel it) → bus into town",
      "09:40 — Danjo Garan: the sacred temple complex and the vermillion Konpon Daito great pagoda, the spiritual heart of the mountain",
      "10:45 — Kongobuji (¥1,000/$6.30): head temple of Shingon, gilded sliding-door paintings and Japan's largest rock garden (Banryutei)",
      "12:00 — Shojin-ryori lunch: Buddhist vegetarian temple cuisine (sesame tofu, mountain vegetables, ~¥2,000/$13) — the real Koyasan meal, hot food at altitude",
      "13:30 — Okunoin: enter at Ichi-no-hashi and walk the full 2km cemetery path through giant cedars and 200,000 graves to the Torodo lantern hall — no photos past the last bridge (Gobyobashi), out of respect",
      "15:30 — Daimon, the great mountain gate, and warm amazake at a tea house to thaw",
      "16:30 — Cable car + Nankai limited express back; Namba by ~18:30, recalibrated",
    ],
    protip:
      "It is the single coldest place on the Kansai roster — a snowy mountaintop, dawn well below freezing, paths slick with ice and packed snow; bring genuine winter layers and grip soles, this is not an Osaka-street outfit. The Okunoin path is worth doing in fading December light (lantern-lit, deeply atmospheric) but be off the mountain before the last comfortable cable car. If a temple stay (shukubo) ever tempted you, this is the place — but as a day trip it still lands hard.",
    links: [
      { label: "Koyasan Shingon Buddhism (official)", url: "https://www.koyasan.or.jp/en/" },
      { label: "Nankai Railway — Koyasan", url: "https://www.howto-osaka.com/en/ticket/details/koyasan_worldheritage/" },
    ],
    wiki: "Mount Kōya",
  },
  {
    id: "kurama-kibune",
    name: "Kurama → Kibune — Mountain Onsen Hike",
    jp: "鞍馬・貴船",
    base: "Kansai",
    travel:
      "All on ICOCA, no pass: Keihan main line to Demachiyanagi, then the two-car Eizan 'Eiden' mountain railway Demachiyanagi→Kurama, ~30 min, ¥470 ($2.90) — sit on the right for the cedar gorge. Hop off one stop earlier at Kibune-guchi on the way back; total day's rail is well under ¥2,000 ($13). Winter Eizan service thins out, so screenshot the timetable.",
    cost: "~$45/person (trains ~$13 + Kurama-dera ¥500/$3.10 + Kurama Onsen rotenburo ¥1,300/$8 + kaiseki or noodles)",
    hours: "08:30–17:30",
    tier: 3,
    pitch:
      "Thirty minutes north of the city, Kyoto turns into a snow-dusted cedar mountain. Climb from Kurama-dera temple over the pass — through the gnarled exposed tree roots where the tengu mountain goblins supposedly trained the boy who became Japan's greatest warrior — and down into Kibune, a shrine village of lantern-lit ryokan stacked along a rushing stream. Then strip down at Kurama Onsen's open-air rotenburo and soak chin-deep facing a forested slope while snow falls on your head. The most nature, and the best bath, of any Kansai day.",
    play: [
      "08:30 — Keihan to Demachiyanagi, change to the little Eizan railway (front seats, gorge windows)",
      "09:15 — Kurama station: the giant red tengu face out front, then the cedar-lined approach up the village street",
      "09:45 — Kurama-dera (¥500/$3.10): ride the short cable car or climb to the main hall and its mountain-energy 'power spot' triangle in the pavement, valley views opening below",
      "10:45 — The mountain trail over the pass toward Kibune — past the tree-root slope (kinone-michi) where Minamoto no Yoshitsune trained with the tengu, ~45–60 min, real shoes required",
      "12:00 — Drop into Kibune: the vermillion-lantern stone steps of Kifune Shrine (water-god shrine; float a paper fortune in the sacred spring to reveal the writing)",
      "12:45 — Lunch in Kibune — winter is botan-nabe (wild-boar hot pot) or kaiseki in a lantern-lit ryokan dining room over the iced-over stream (~¥3,000–5,000/$19–31), the warm reward for the hike",
      "14:30 — Eizan back one stop's worth to Kurama Onsen: the open-air rotenburo facing the forested slope (¥1,300/$8) — soaking in snow-flecked outdoor water is the entire point of coming in December",
      "16:00 — Thaw, dress, and ride the Eiden back down; Demachiyanagi and central Kyoto by ~17:15",
    ],
    protip:
      "This is a genuine cold mountain, 5–8°C below central Kyoto with ice and packed snow on the pass trail — grip soles and real layers, not your Gion sightseeing outfit. If the trail is closed or anyone's not up for the climb, skip it and ride the Eizan two stops between Kurama and Kibune-guchi, then walk the valley road — you still get both villages and the bath. Check the Eizan winter timetable and the last comfortable downhill train; service is sparse and the village empties early in winter.",
    links: [
      { label: "Eizan Railway (English)", url: "https://eizandensha.co.jp/en/" },
      { label: "Kuramadera Temple", url: "https://www.kuramadera.or.jp/" },
      { label: "Kurama Onsen", url: "https://www.kurama-onsen.co.jp/" },
    ],
    wiki: "Kurama-dera",
  },
  {
    id: "kinosaki-onsen",
    name: "Kinosaki Onsen — Seven-Bath Crawl",
    jp: "城崎温泉",
    base: "Kansai",
    travel:
      "Direct on a reserved limited express, no pass: JR Limited Express 'Kinosaki' Kyoto→Kinosaki-Onsen, ~2h30, ~¥4,840 ($30) reserved each way (the train splits/runs straight up the San'in line — buy seats at the machine or on the JR West site); or the 'Kounotori' from Shin-Osaka, ~2h40, ~¥6,140 ($38). The town is tiny and entirely walkable from the station — no buses, no transfers.",
    cost: "~$80/person (train ~$60 + all-seven-bath day pass ¥1,500/$9.40 + crab/tajima-beef lunch)",
    hours: "08:30–20:30",
    tier: 3,
    pitch:
      "A willow-lined canal town on the Sea of Japan coast where the whole point is to walk the streets in a yukata and wooden geta, clogs clacking, drifting between seven public hot-spring bathhouses with a single pass. December is the headline season: this is the snow-crab capital of Japan, the steam rises thick off the canal in the cold, and a fresh snowfall on the lantern-lit streets is the postcard. The most pure-relaxation day in the entire deck, and a long, scenic train nap to get there.",
    play: [
      "08:30 — JR Limited Express Kinosaki from Kyoto (reserve seats together; coffee and a long, scenic nap up through the mountains and out to the coast)",
      "11:00 — Kinosaki-Onsen station: a free public foot bath and a hot-spring drinking fountain greet you on the platform; grab the ¥1,500/$9.40 'Yumepa' all-bath day pass",
      "11:20 — Check a bag at the station and change into the rental yukata + geta — wearing it town-wide is the tradition, and it's free or cheap from most shops",
      "11:45 — Bath #1, Satonoyu by the station (the biggest — top-floor open-air baths and a 'penguin' cold sauna) to start the crawl warm",
      "13:00 — Crab lunch: December is matsuba (snow) crab season and Kinosaki is the source — a whole grilled/boiled crab set, or Tajima beef if crab prices scare the group (~¥3,000–6,000/$19–38)",
      "14:30 — Stroll the willow-lined canal, clacking in geta over the little stone bridges — bath-hop through Ichinoyu (cave bath), Goshonoyu (waterfall bath), and Mandaranoyu as you go",
      "16:30 — December dusk and the canal lanterns light up; the Kinosaki Ropeway up Mt. Daishi for a snow-coast panorama if anyone has bath-energy left (~¥900/$5.60)",
      "17:30 — A final soak, onsen-pudding and crab croquettes from the canal stalls, then the limited express back — Kyoto by ~20:30",
    ],
    protip:
      "Buy the round-trip limited express seats in advance — December weekend trains to crab country fill up, and reserved is worth it for 2.5 hours each way. Tattoos are generally fine at the public bathhouses here (unusually relaxed), but confirm at the door. It's a long day for a town this small, so it's a tier-3 audible: ideal as the trip's designated do-nothing recovery day, not a sightseeing sprint. The crab is the splurge — set a per-person budget before you sit down.",
    links: [
      { label: "Visit Kinosaki (official, English)", url: "https://visitkinosaki.com/" },
      { label: "JR West timetable & fares", url: "https://www.westjr.co.jp/global/en/" },
    ],
    wiki: "Kinosaki Onsen",
  },
  {
    id: "kanazawa",
    name: "Kanazawa — Little Kyoto of the North",
    jp: "金沢",
    base: "Kansai",
    travel:
      "Reserved, no pass, one easy transfer: JR Limited Express 'Thunderbird' Kyoto→Tsuruga ~45 min, cross-platform change to the Hokuriku Shinkansen 'Tsurugi/Hakutaka' Tsuruga→Kanazawa ~1h — ~2h door to door total, ~¥7,500 ($47) reserved each way. Book the through-ticket on the JR West site; the Tsuruga transfer is signposted and takes minutes. In town, the ¥200/$1.30 flat-fare Kanazawa Loop Bus (tap ICOCA) rings every sight.",
    cost: "~$130/person (trains ~$94 + Kenrokuen ¥320/$2 + castle + 21st Century Museum ¥450/$2.80 + seafood-bowl lunch)",
    hours: "07:30–20:30",
    tier: 3,
    pitch:
      "The castle town the war never touched, two hours north on the bullet train: Kenrokuen, ranked one of Japan's three greatest gardens, plus an immaculate samurai district, a geisha quarter of preserved teahouses, gold-leaf everything (the city makes 99% of Japan's), and an Edo-era market piled with Sea-of-Japan winter crab and shrimp. December dresses Kenrokuen in 'yukitsuri' — the conical rope umbrellas that protect the pines from snow — which is the single most beautiful thing in any Japanese garden in winter. A long but spectacular full-day audible from the Kyoto base.",
    play: [
      "07:30 — Kyoto: Thunderbird to Tsuruga, cross-platform to the Hokuriku Shinkansen for Kanazawa (reserve the through-ticket; breakfast bento on board)",
      "09:30 — Kanazawa station: gawk at the colossal wooden Tsuzumi-mon 'drum gate,' then the ¥200 Loop Bus toward the center",
      "10:00 — Kenrokuen Garden (¥320/$2): the December 'yukitsuri' snow-rope cones strung over every pine, the Kotojitoro lantern, frosted ponds — Japan's garden art at its absolute winter peak",
      "11:15 — Kanazawa Castle next door: the white-lead-tile roofs and the rebuilt Hishi Yagura turret, gardens and gate free to roam",
      "12:00 — Omicho Market: the Edo-era covered market — a kaisendon piled with snow crab, sweet shrimp, and sea urchin (~¥2,500/$16), December being peak Sea-of-Japan season",
      "13:30 — Higashi Chaya District: the preserved geisha-teahouse quarter — gold-leaf ice cream (yes, edible gold), the Kaikaro teahouse, lacquer and craft shops in dark wooden machiya",
      "14:45 — Nagamachi samurai district: earthen-walled lanes and the Nomura-ke samurai residence with its tiny perfect garden, a short Loop Bus hop south",
      "15:45 — 21st Century Museum of Contemporary Art (¥450/$2.80 for exhibits; Leandro Erlich's walk-on 'Swimming Pool' is the icon) — a glassy, modern palate-cleanser",
      "17:00 — Last gold-leaf souvenir run near the station, then the shinkansen + Thunderbird back; Kyoto by ~20:30",
    ],
    protip:
      "Book the through reserved ticket in advance — the Tsuruga transfer is painless but the trains run reserved-heavy and December fills them. It's the longest single-day rail haul on the Kansai roster (~4h round trip), so it lives as a tier-3 'if a full day frees up' play, not a casual one. Kanazawa is famously the rainiest/snowiest city — 'forget your umbrella' is a local saying — so pack waterproofs and grip soles; Kenrokuen under actual snow is the jackpot but the paths get slick.",
    links: [
      { label: "Visit Kanazawa (official)", url: "https://visitkanazawa.jp/en/" },
      { label: "Kenrokuen Garden (official)", url: "https://www.pref.ishikawa.jp/siro-niwa/kenrokuen/e/" },
      { label: "JR West — Hokuriku & Thunderbird", url: "https://www.westjr.co.jp/global/en/" },
    ],
    wiki: "Kanazawa",
  },
  {
    id: "amanohashidate-ine",
    name: "Amanohashidate + Ine no Funaya",
    jp: "天橋立・伊根の舟屋",
    base: "Kansai",
    travel:
      "Reserved, no pass: the JR/Kyoto Tango Railway Limited Express 'Hashidate' Kyoto→Amanohashidate, ~2h, ~¥4,400 ($28) reserved each way (runs onto the private Tango line — buy the through reserved seat). From Amanohashidate, the Tankai bus up to Ine is ~1h, ¥400/$2.50 (tap or cash); the village bay-tour boat loops from there. Long day, but one scenic train each way.",
    cost: "~$80/person (train ~$56 + chairlift ¥850/$5.30 + Ine bay boat ¥1,000/$6.30 + Ine bus + seafood lunch)",
    hours: "07:30–20:00",
    tier: 3,
    pitch:
      "Two of the Sea of Japan's quietest postcards in one big day. Amanohashidate is one of Japan's three official 'great views' — a 3.6km pine sandbar that, viewed upside-down between your legs from the hilltop, becomes a 'bridge to heaven.' Then a coastal bus to Ine, where 230 wooden 'boat houses' stand directly over the bay, boat garage below and home above, best seen from a little tour boat with gulls dive-bombing for crackers. Remote, cold, crowd-free, and unlike anywhere else on the trip.",
    play: [
      "07:30 — Kyoto: Limited Express Hashidate north onto the Tango Railway (reserve seats; long scenic mountain-and-coast nap)",
      "09:35 — Amanohashidate station: walk out onto the pine sandbar itself, or rent bikes to cross its 3.6km",
      "10:30 — Kasamatsu Park via chairlift/cablecar (¥850/$5.30 round trip) for the famous 'matanozoki' — bend over, look between your legs, watch the sandbar float into the sky; undignified and mandatory",
      "11:30 — Tankai bus up the coast to Ine (~1h) — Sea-of-Japan views the whole way",
      "12:45 — Ine bay sightseeing boat (~¥1,000/$6.30): loop the bay to see the full row of 230 funaya boat houses from the water, gulls and black kites chasing the shrimp crackers",
      "13:45 — Seafood lunch in Ine — whatever the morning boats landed, plus a wander past the funaya at water level",
      "15:00 — Bus back to Amanohashidate; a last sandbar stroll or a hot drink as the winter light goes flat and gold",
      "16:30 — Limited Express Hashidate back to Kyoto by ~20:00",
    ],
    protip:
      "This is a real expedition — far north, genuinely cold and windy on the winter coast, and the Ine buses and bay boats run a thin December schedule, so screenshot the timetables and build the day around the boat departure, not the other way round. Reserve the limited express both ways; the Tango line runs short trains. Pure tier-3: only worth it if a full clear day frees up and the group wants remote-and-quiet over another temple sprint.",
    links: [
      { label: "Amanohashidate tourism (official)", url: "https://www.amanohashidate.jp/en/" },
      { label: "Ine Tourism (funaya)", url: "https://www.ine-kankou.jp/en/" },
      { label: "Kyoto Tango Railway (English)", url: "https://trains.willer.co.jp/en/" },
    ],
    wiki: "Amanohashidate",
  },
];
