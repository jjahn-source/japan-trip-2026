export type Dish = {
  name: string;
  jp: string;
  what: string;
  order: string; // how/where to order it
  price: string;
};

export const DISH_ENCYCLOPEDIA: Dish[] = [
  { name: "Ramen", jp: "ラーメン", what: "The four great broths: shoyu (soy, Tokyo classic), tonkotsu (pork bone, rich), miso (Sapporo-style, hearty), shio (salt, light). December bonus: everything tastes 30% better cold-weather.", order: "Vending machine at the door: insert cash, press picture buttons, hand ticket to chef. Slurping = correct.", price: "¥900–1,500" },
  { name: "Sushi", jp: "寿司", what: "From ¥150/plate conveyor (Sushiro, Kura) to standing sushi bars to omakase. Mid-tier standing bars near fish markets punch far above their price.", order: "Conveyor: grab plates or order via tablet. Counter: 'omakase de' (chef's choice) or point at the case.", price: "¥1,500 conveyor – ¥15k+ omakase" },
  { name: "Yakiniku", jp: "焼肉", what: "Grill-it-yourself wagyu over charcoal. The great group-dinner format — order rounds of cuts and let everyone cook.", order: "Tablet ordering at most chains. Start with karubi (short rib), tan (tongue) with lemon, harami (skirt).", price: "¥3–6k/person" },
  { name: "Tempura", jp: "天ぷら", what: "Feather-light battered seafood and vegetables. Chain spots (Tenya, ~¥700 bowls) are great; specialist counters fry piece-by-piece in front of you.", order: "Tendon (over rice) for casual; 'course' at counters.", price: "¥700–8k" },
  { name: "Tonkatsu", jp: "とんかつ", what: "Panko-fried pork cutlet, shredded cabbage, miso soup. Grind your own sesame into the sauce at proper shops.", order: "Choose rosu (fatty loin, correct answer) or hire (lean fillet). Cabbage refills are usually free.", price: "¥1,200–2,500" },
  { name: "Udon & Soba", jp: "うどん・そば", what: "Thick wheat (udon) vs thin buckwheat (soba). Standing station soba at ¥400 is a transit-day ritual; Marugame Seimen is the beloved fresh-udon chain.", order: "Hot (kake) in December. Add tempura from the self-serve trays.", price: "¥400–1,200" },
  { name: "Gyoza", jp: "餃子", what: "Pan-fried dumplings, crispy bottoms, beer's best friend. Osaka and Tokyo both claim them; everyone wins.", order: "By the plate of 5–6. 'Yaki-gyoza' is the standard.", price: "¥300–600/plate" },
  { name: "Kaiseki", jp: "懐石", what: "The haute-cuisine multi-course procession — a dozen tiny seasonal dishes as art. Kyoto's signature meal, December menus feature crab and yuzu.", order: "Reservation only. Lunch kaiseki (¥5–8k) delivers 80% of the dinner experience (¥15–30k) at half price.", price: "¥5k–30k" },
  { name: "Sukiyaki / Shabu-shabu", jp: "すき焼き", what: "Hotpot royalty: sukiyaki (sweet soy broth, dip in raw egg) vs shabu-shabu (swish thin beef in kombu broth). Built for groups around one pot.", order: "All-you-can-eat chains (Nabezo, Onyasai) handle 8 easily with courses.", price: "¥3–8k/person" },
  { name: "Curry rice", jp: "カレー", what: "Japan's true national dish — thick, mild, deeply comforting. CoCo Ichibanya lets you tune spice 1–10 and pile on toppings.", order: "Pick base, spice level (3 = solid), toppings. Katsu curry = the move.", price: "¥800–1,400" },
  { name: "Onigiri", jp: "おにぎり", what: "Konbini rice triangles — tuna mayo, salmon, umeboshi. The pull-tab seaweed wrapper system is origami genius.", order: "Pull tab 1, then 2, then 3. There are diagrams. You'll still tear one wrong and that's part of it.", price: "¥120–250" },
  { name: "Wagashi & matcha", jp: "和菓子", what: "Traditional sweets — mochi, dorayaki, taiyaki (fish-shaped custard/red-bean waffles, eaten HOT in December), dango. Pair with bitter matcha.", order: "Taiyaki from street stands; matcha + seasonal wagashi sets at temple-adjacent tea houses.", price: "¥200–1,500" },
  { name: "Kare-pan & konbini bakery", jp: "カレーパン", what: "Curry-stuffed fried bread, melon pan, an entire genre of milk breads. Japanese bakeries (and even konbinis) embarrass most Western ones.", order: "Tongs + tray at bakeries. Grab melon pan warm if you ever see it fresh.", price: "¥150–400" },
  { name: "Crab (kani)", jp: "蟹", what: "December = peak season. Snow crab legs grilled at markets, full crab kaiseki at Kani Doraku, crab hotpots at ryokan.", order: "Market stalls: point, pay, eat. Kani Doraku: book a course for the table.", price: "¥1k market snack – ¥10k course" },
  { name: "Fluffy pancakes & kissaten", jp: "喫茶店", what: "Jiggly soufflé pancakes (A Happy Pancake, Flipper's) vs retro kissaten coffee shops with pudding and pizza toast. Tokyo breakfast culture both old and new.", order: "Expect a queue at pancake spots — put a name in, walk, return.", price: "¥1,000–1,800" },
  { name: "Ichigo daifuku & strawberry season", jp: "いちご大福", what: "Winter is strawberry season in Japan (greenhouse perfection). Whole strawberry inside mochi with red bean — December depachika stock them everywhere.", order: "Depachika basements and wagashi shops. Eat same-day.", price: "¥300–600" },
  { name: "Yakitori", jp: "焼き鳥", what: "Charcoal chicken skewers, piece by piece: momo (thigh), negima (thigh+leek), tsukune (meatball, dip in raw egg yolk), kawa (crispy skin). The yokocho-alley food group.", order: "By the stick or 'omakase de'. Choose shio (salt) or tare (sweet glaze) — shio shows off good charcoal.", price: "¥150–400/stick" },
  { name: "Okonomiyaki", jp: "お好み焼き", what: "The savory cabbage-batter pancake. RELIGIOUS SCHISM: Osaka mixes everything in; Hiroshima LAYERS it over yakisoba noodles. We try both and take sides on Dec 26.", order: "Many shops let you grill at the table; if a counter chef builds it, hands off the spatula. Mayo crosshatch = correct.", price: "¥900–1,600" },
  { name: "Takoyaki", jp: "たこ焼き", what: "Molten octopus dough-balls flipped in cast iron, painted with sauce, mayo, dancing bonito flakes. Osaka's street-food mascot.", order: "By the 6 or 8. WARNING: the inside is lava for a full 3 minutes. Every member of the crew will burn their mouth anyway. Tradition.", price: "¥500–700" },
  { name: "Kushikatsu", jp: "串カツ", what: "Everything-on-a-stick, panko'd and deep-fried: beef, quail egg, lotus root, cheese, mochi. Born in Shinsekai, Osaka.", order: "Order rounds of sticks; communal sauce vat is dip-ONCE only (use the free cabbage to spoon extra). Daruma is the origin chain.", price: "¥130–300/stick" },
  { name: "Unagi / Hitsumabushi", jp: "うなぎ", what: "Grilled freshwater eel lacquered in tare over rice — crisp edges, custard middle. Hitsumabushi style = eat it 3 ways (plain, with condiments, as dashi-poured rice soup).", order: "Una-don for casual, hitsumabushi at specialist shops. Worth one splurge lunch.", price: "¥2,500–5,000" },
  { name: "Gyukatsu", jp: "牛カツ", what: "Tonkatsu's beef cousin: rare-fried wagyu cutlet you finish yourself on a personal stone grill, slice by slice.", order: "Gyukatsu Motomura (Tokyo/Kyoto) is the queue-worthy chain. Sear each slice 10 seconds a side.", price: "¥1,800–2,800" },
  { name: "Monjayaki", jp: "もんじゃ焼き", what: "Okonomiyaki's chaotic Tokyo cousin — a molten savory goo you cook on the table and eat with tiny metal spatulas straight off the griddle. Looks wrong, tastes right.", order: "Tsukishima Monja Street, Dec 17. Staff will start the first one so you learn the ritual.", price: "¥1,000–1,500" },
  { name: "Nishin soba & yudofu", jp: "にしんそば・湯豆腐", what: "Kyoto's December soul-food set: hot soba topped with sweet-simmered herring (since 1882), and yudofu — silken tofu in kombu broth by the temple gardens.", order: "Matsuba at Shijo bridge invented nishin soba; yudofu row sits below Tenryu-ji in Arashiyama.", price: "¥1,100–2,500" },
  { name: "Omurice", jp: "オムライス", what: "Ketchup fried rice wearing a quivering omelet blanket, often knife-split tableside in slow motion. Yoshoku (Japanese-Western) comfort canon.", order: "Kissaten and yoshoku diners. If the menu photo shows the knife-split, order that one.", price: "¥900–1,500" },
  { name: "Melonpan & taiyaki, hot", jp: "メロンパン・たい焼き", what: "Street-bakery December doubleheader: crackly melonpan straight from the oven and fish-shaped taiyaki with scalding custard/red-bean tails.", order: "Asakusa's Kagetsudo for melonpan; any street stall venting sweet steam for taiyaki. Eat standing next to the stall (manners).", price: "¥200–350" },
  { name: "Ekiben", jp: "駅弁", what: "Station bento engineered for shinkansen windows: regional specialties, self-heating wagyu boxes, art-tier packaging. A genre, a hobby, and one of our standing competitions (see Play tab).", order: "Ekibenya Matsuri at Tokyo Stn (200+ kinds) or any station hall. Buy BEFORE boarding + tea + dessert.", price: "¥1,000–2,000" },
  { name: "Wagyu, properly", jp: "和牛", what: "A5 marbling that dissolves like beef butter. Formats by budget: yakiniku (grill-it, best value), sukiyaki (the farewell dinner format), steak counters, ¥1,000 market skewers.", order: "Kuromon/Nishiki market skewers for the cheap hit; the Dec 28 sukiyaki for the ceremony. 'A5' on the menu is the keyword.", price: "¥1,000 skewer – ¥15k dinner" },
];

export type Chain = {
  name: string;
  what: string;
  verdict: string;
};

export const CHAINS: Chain[] = [
  { name: "Ichiran", what: "Tonkotsu ramen in solo focus booths", verdict: "Touristy but genuinely good — and the booth system seats 8 instantly when restaurants won't" },
  { name: "Sushiro / Kura Sushi", what: "Conveyor sushi, ¥150–300 plates, tablet ordering", verdict: "Quality that would embarrass US sushi bars; Kura's prize-capsule game hooks groups" },
  { name: "Torikizoku", what: "All skewers & drinks one price (~¥390)", verdict: "The big-group izakaya cheat code — walk-ins for 8 actually possible" },
  { name: "CoCo Ichibanya", what: "Customizable curry rice", verdict: "Reliable warm hug at any hour, every city" },
  { name: "Marugame Seimen", what: "Fresh-pulled udon cafeteria", verdict: "¥500 lunch that outclasses ¥2,000 meals elsewhere" },
  { name: "Tenya", what: "Tempura bowls fast-food style", verdict: "¥700 tendon is the best value meal in Japan" },
  { name: "Gyukaku", what: "Yakiniku BBQ chain", verdict: "Group-friendly grills, English menus, courses for 8" },
  { name: "Saizeriya", what: "Absurdly cheap 'Italian'", verdict: "¥300 pizza at 11pm hits a specific note — a cultural experience, not a culinary one" },
  { name: "Komeda's Coffee", what: "Nagoya-style kissaten chain", verdict: "Order coffee before 11am → free toast & egg. December morning ritual" },
  { name: "Mister Donut", what: "Donuts + dim sum, weirdly", verdict: "Pon de Ring texture doesn't exist in America. Get one" },
  { name: "Isomaru Suisan", what: "24h grill-your-own seafood izakaya", verdict: "Crab miso shell + scallops over a table grill at 1am, walk-in for 8 possible. Kabukicho safe harbor" },
  { name: "Gyukatsu Motomura", what: "Self-seared rare beef cutlet", verdict: "The queue moves fast and the stone-grill ritual converts skeptics. ¥1,500 lunch heroics" },
  { name: "Kura Sushi (the other one)", what: "Conveyor sushi with the prize game", verdict: "Every 5 plates feeds the Bikkura-Pon slot machine — gamified dinner for 8 competitive idiots. That's us" },
  { name: "Matsuya / Sukiya / Yoshinoya", what: "The gyudon (beef bowl) trinity", verdict: "¥500, 90 seconds, open 24h. The 6am pre-Fushimi-Inari fuel and the 2am shame meal. Both valid" },
  { name: "Hanamaru / station soba stands", what: "Standing noodles, ¥400", verdict: "Eat shoulder-to-shoulder with salarymen in 6 minutes flat. A transit-day ritual, not a compromise" },
  { name: "Osaka Ohsho / Gyoza no Ohsho", what: "Gyoza + fried rice + beer", verdict: "Cheap, loud, fast, everywhere in Kansai. The post-arcade refuel" },
  { name: "Coco's curry rival: Go!Go!Curry", what: "Kanazawa-style black curry", verdict: "Thicker, darker, gorilla-branded. Try once and join the CoCo-vs-GoGo discourse" },
  { name: "Doutor / Komeda / kissaten chains", what: "Coffee + morning sets", verdict: "¥500 coffee-and-toast breakfasts when the konbini rotation needs a sit-down day" },
];

export type RegionalEat = {
  city: string;
  emoji: string;
  items: { name: string; where: string; note: string }[];
};

export const REGIONAL_EATS: RegionalEat[] = [
  {
    city: "Tokyo",
    emoji: "🗼",
    items: [
      { name: "Tsukiji outer-market sushi breakfast", where: "Tsukiji, Dec 18, 8am", note: "Tuna-belly bowls, uni, tamagoyaki on a stick, grilled scallops with butter-soy. Arrive hungry, leave broke, regret nothing" },
      { name: "Ramen Street ranking run", where: "Tokyo Station B1", note: "8 famous shops underground — split up, order via machine, reconvene, rank bowls. Rokurinsha's tsukemen is the favorite to beat" },
      { name: "Monjayaki initiation", where: "Tsukishima Monja Street", note: "45 shops on one street. Tables of 4, two tables, swap halfway" },
      { name: "Depachika raid", where: "Mitsukoshi/Isetan basements", note: "The greatest food halls on Earth. ¥3,000 jewel-strawberries to gawk at, ichigo daifuku + croquettes to actually buy. Bento discounts after 19:00" },
      { name: "Omoide Yokocho yakitori", where: "Shinjuku, night one", note: "Smoke, lanterns, 1947. Point at sticks, drink what appears" },
    ],
  },
  {
    city: "Hakone",
    emoji: "🗻",
    items: [
      { name: "Kuro-tamago black eggs", where: "Owakudani crater station", note: "Sulfur-boiled, +7 years of life each. Eat two — math is math" },
      { name: "Yumoto onsen manju", where: "Hakone-Yumoto shopping street", note: "Steamed brown-sugar buns straight from the steamer, eaten in cold mountain air" },
      { name: "Villa nabe night", where: "Our Airbnb, Dec 19", note: "Supermarket run in Yumoto: hotpot kit, crab legs, sake. The kaiseki replacement that becomes the better story" },
      { name: "Ekiben on the Romancecar", where: "Shinjuku Odakyu hall", note: "Breakfast bento with a front-window mountain view at 8am" },
    ],
  },
  {
    city: "Kyoto",
    emoji: "⛩️",
    items: [
      { name: "Nishiki Market grazing run", where: "'Kyoto's Kitchen', 400m arcade", note: "Tako-tamago (candied octopus with a quail egg head), yuba donuts, black sesame ice cream, pickle samples. Stand and eat AT each stall" },
      { name: "Matcha everything", where: "Uji (Dec 24 am) + tea houses", note: "The matcha capital: stone-milled parfaits, matcha soba, ceremonial-grade hits. Order 'koicha' only if you respect bitterness" },
      { name: "Yatsuhashi free-sample circuit", where: "Sannenzaka/Ninenzaka shops", note: "Cinnamon mochi sheets, every shop samples — a full dessert if you're shameless. Buy a box from whoever wins" },
      { name: "Obanzai izakaya night", where: "Kiyamachi backstreets", note: "Kyoto home-cooking small plates — the counter ones with handwritten menus. Say 'osusume de' and trust" },
      { name: "Kyoto Station Ramen Koji", where: "Station 10F", note: "7 regional ramen styles in one corridor — the national tour without the train tickets" },
    ],
  },
  {
    city: "Nara",
    emoji: "🦌",
    items: [
      { name: "Kakinoha-zushi", where: "Around Nara park", note: "Pressed sushi cured in persimmon leaves — the 1,300-year-old original to-go food" },
      { name: "Nakatanidou mochi, warm", where: "Naramachi", note: "The viral high-speed mochi-pounding shop. Warm yomogi mochi straight from the hammer: best ¥200 of the trip" },
      { name: "Harushika sake flight", where: "Harushika brewery", note: "Sake was invented in Nara. ¥500 = 5 tastings + the glass. Educational. Extremely educational" },
    ],
  },
  {
    city: "Osaka",
    emoji: "🐙",
    items: [
      { name: "Kuromon Ichiba seafood flex", where: "Kuromon market, Dec 27 9am", note: "Grilled scallops, wagyu skewers, uni shooters, king crab legs at December peak. Breakfast of degenerates" },
      { name: "Takoyaki crawl", where: "Wanaka, Kukuru, Juhachiban", note: "Three stands, six balls each, crown a champion. Mouth-roof casualties expected" },
      { name: "Okonomiyaki at Mizuno", where: "Dotonbori (queue) or Ajinoya", note: "1945 institution. The yamaimo-batter deluxe is the order" },
      { name: "Kushikatsu at Daruma", where: "Shinsekai origin store", note: "NO DOUBLE DIPPING. They will announce it to the room in two languages" },
      { name: "Kani Doraku crab kaiseki", where: "Under the giant moving crab", note: "December = crab season peak in crab city: sashimi, sukiyaki, grilled, tempura. The booked-ahead Kansai farewell" },
      { name: "551 Horai butaman", where: "Namba/stations everywhere", note: "Steamed pork buns Osakans carry like contraband. The line moves fast; buy a 4-pack for the house" },
    ],
  },
  {
    city: "Hiroshima & Miyajima",
    emoji: "🕊️",
    items: [
      { name: "Hiroshima-yaki at Okonomimura", where: "20 counters, one building", note: "Layered-with-noodles style on a giant communal teppan. Lunch doubles as the day's decompression" },
      { name: "Grilled oysters", where: "Miyajima Omotesando street", note: "December = peak oyster season, Miyajima = oyster Mecca. ¥500 for two, grilled in the shell in front of you" },
      { name: "Momiji manju, deep-fried", where: "Miyajima stalls", note: "Maple-leaf cakes, custard or red bean, battered and fried on a stick. The walking dessert" },
      { name: "Anago meshi", where: "Near Miyajimaguchi ferry", note: "Conger-eel rice boxes — Ueno's 1901 shop by the ferry pier is the legend, sells out by afternoon" },
    ],
  },
];

export type KonbiniItem = {
  name: string;
  where: string;
  note: string;
};

export const KONBINI_HALL_OF_FAME: KonbiniItem[] = [
  { name: "Egg sando", where: "7-Eleven", note: "The famous one. Kewpie-mayo egg salad on impossible milk bread" },
  { name: "Famichiki", where: "FamilyMart", note: "Hot fried chicken at the register. The people's champion" },
  { name: "Karaage-kun", where: "Lawson", note: "Nugget cups in 4 flavors — the rival faction. Try both, pick a side" },
  { name: "Onigiri (tuna mayo)", where: "All three", note: "¥140 of perfection. 7-Eleven's rice is rated best by nerds" },
  { name: "Strawberry sandwich", where: "7-Eleven / Lawson", note: "Fruit + cream + bread. Sounds wrong, is right — peak season is now" },
  { name: "Hot snack case oden", where: "7-Eleven / FamilyMart", note: "Winter-only simmered dashi pot: daikon, eggs, fishcakes. ¥100/piece" },
  { name: "Premium roll cake", where: "Lawson", note: "Cream-to-cake ratio set by a visionary" },
  { name: "あたたかい hot drinks", where: "All + vending machines", note: "The heated case/red-label rows: hot royal milk tea, corn soup, lemon honey. Pocket heaters you drink" },
  { name: "Melon pan", where: "All three", note: "Cookie-crusted sweet bun. Best slightly warmed if they offer" },
  { name: "¥120 drip coffee", where: "7-Eleven", note: "Better than most US café pours. Machine grinds per cup" },
  { name: "Nikuman (steamed pork bun)", where: "All three, register case", note: "December hand-warmer you eat. Pizza-man variant is the chaos pick" },
  { name: "Zaru soba & pasta chillers", where: "All three", note: "Konbini cold noodles that would pass at a restaurant. Sauce packet origami included" },
  { name: "Salmon harasu onigiri", where: "Lawson", note: "Fatty salmon belly rice bomb — the connoisseur's pick over tuna mayo (fight it out)" },
  { name: "Gari-gari kun ice pop", where: "All three", note: "¥80 national-treasure soda pop. Eating one outside in December = bingo-adjacent honor" },
  { name: "Mochi-texture rolls (Shiroi roll)", where: "FamilyMart", note: "The bakery shelf's sleeper hit — mochi-mochi means 'pleasantly chewy' and it's a national value" },
  { name: "Pocari Sweat / Aquarius", where: "All + vending", note: "Electrolyte salvation. The official sponsor of nomihodai recovery" },
  { name: "Ukon no Chikara / Hepalyse", where: "Register-side shelf", note: "Turmeric/liver shots drunk BEFORE drinking by professionals. Trust the salaryman meta" },
  { name: "Curry pan", where: "All three", note: "Curry inside fried bread. 7-Eleven's is fried-to-order at some locations — if you see the hot case version, drop everything" },
  { name: "Famichiki bun hack", where: "FamilyMart", note: "Buy Famichiki + the ¥120 plain bun, assemble the forbidden chicken burger. Menu off-menu" },
  { name: "Pudding (purin)", where: "7-Eleven 'kotteri' / Lawson", note: "Custard pudding section is a genre. The 'firm retro' vs 'molten' debate splits families" },
  { name: "Hot lemon / royal milk tea cans", where: "Vending machines (red label)", note: "あたたかい = warm. A drinkable hand-warmer every 40 meters across the entire nation" },
  { name: "Senbei & weird KitKats", where: "All + Don Quijote", note: "Matcha, sake, regional-exclusive KitKats = the omiyage workhorse. Buy flat boxes, pack like Tetris" },
  { name: "Egg salad's rival: katsu sando", where: "All three", note: "Pork cutlet between milk bread. The airport-morning final meal, by law" },
];
