export type Dish = {
  name: string;
  jp: string;
  what: string;
  order: string; // how/where to order it
  price: string;
};

export const DISH_ENCYCLOPEDIA: Dish[] = [
  { name: "Ramen", jp: "ラーメン", what: "The four great broths: shoyu (soy, Tokyo classic), tonkotsu (pork bone, rich), miso (Sapporo-style, hearty), shio (salt, light). December bonus: everything tastes 30% better cold-weather.", order: "Vending machine at the door: insert cash, press picture buttons, hand ticket to chef. Slurping = correct.", price: "$6–9 (¥900–1,500)" },
  { name: "Tsukemen", jp: "つけ麺", what: "Ramen's dipping cousin: thick chewy noodles served cold/room-temp alongside a hot, intense dipping broth. Rokurinsha (Tokyo Station) and Fuunji (Shinjuku) are the temples. Hiroshima does a spicy red-pepper version.", order: "Dip a few noodles at a time. Ask for 'soup wari' at the end — they top up the leftover broth with dashi to drink.", price: "$6–11 (¥1,000–1,700)" },
  { name: "Sushi", jp: "寿司", what: "From $0.90/plate conveyor (Sushiro, Kura) to standing sushi bars to omakase. Mid-tier standing bars near fish markets punch far above their price. December: fatty winter buri and oysters.", order: "Conveyor: grab plates or order via tablet. Counter: 'omakase de' (chef's choice) or point at the case.", price: "$9 conveyor – $94+ omakase ($1.5k–15k+ yen)" },
  { name: "Yakiniku", jp: "焼肉", what: "Grill-it-yourself wagyu over charcoal. The great group-dinner format — order rounds of cuts and let everyone cook.", order: "Tablet ordering at most chains. Start with karubi (short rib), tan (tongue) with lemon, harami (skirt).", price: "$19–38/person (¥3–6k)" },
  { name: "Tempura", jp: "天ぷら", what: "Feather-light battered seafood and vegetables. Chain spots (Tenya, ~$5 bowls) are great; specialist counters fry piece-by-piece in front of you.", order: "Tendon (over rice) for casual; 'course' at counters.", price: "$4–50 (¥700–8k)" },
  { name: "Tonkatsu", jp: "とんかつ", what: "Panko-fried pork cutlet, shredded cabbage, miso soup. Grind your own sesame into the sauce at proper shops.", order: "Choose rosu (fatty loin, correct answer) or hire (lean fillet). Cabbage refills are usually free.", price: "$8–16 (¥1,200–2,500)" },
  { name: "Udon & Soba", jp: "うどん・そば", what: "Thick wheat (udon) vs thin buckwheat (soba). Standing station soba at $2.50 is a transit-day ritual; Marugame Seimen is the beloved fresh-udon chain. Osaka's kitsune udon is the local pride.", order: "Hot (kake) in December. Add tempura from the self-serve trays.", price: "$2.50–8 (¥400–1,200)" },
  { name: "Gyoza", jp: "餃子", what: "Pan-fried dumplings, crispy bottoms, beer's best friend. Osaka and Tokyo both claim them; everyone wins.", order: "By the plate of 5–6. 'Yaki-gyoza' is the standard.", price: "$2–4/plate (¥300–600)" },
  { name: "Kaiseki", jp: "懐石", what: "The haute-cuisine multi-course procession — a dozen tiny seasonal dishes as art. Kyoto's signature meal, December menus feature crab and yuzu.", order: "Reservation only. Lunch kaiseki ($31–50) delivers 80% of the dinner experience ($94–188) at half price.", price: "$31–188 (¥5k–30k)" },
  { name: "Sukiyaki / Shabu-shabu", jp: "すき焼き", what: "Hotpot royalty: sukiyaki (sweet soy broth, dip in raw egg) vs shabu-shabu (swish thin beef in kombu broth). Built for groups around one pot. Our Dec 28 farewell format.", order: "All-you-can-eat chains (Nabezo, Onyasai) handle 8 easily with courses.", price: "$19–50/person (¥3–8k)" },
  { name: "Nabe & hot pot", jp: "鍋", what: "December is nabe season: motsunabe (offal, Fukuoka-style), chanko (sumo stew), kimchi nabe, mizutaki chicken. One bubbling pot, eight spoons, finish with rice or noodles (shime).", order: "Order for the table; the staff sets up the burner. Don't fight over the last tsukune.", price: "$16–31/person (¥2.5–5k)" },
  { name: "Oden", jp: "おでん", what: "Winter-only simmered dashi pot: daikon, eggs, chikuwa, atsuage tofu, beef tendon. Konbini hot-case version is a national institution; izakaya do a deeper one.", order: "Konbini: point at the case, they ladle it into a cup. Izakaya: order by the piece. Smear karashi mustard on the daikon.", price: "$0.60–1.30/piece (¥100–200)" },
  { name: "Fugu (pufferfish)", jp: "ふぐ", what: "The famous (lethal-if-botched) blowfish, peak in winter. Licensed chefs only: paper-thin sashimi (tessa), fugu nabe (tecchiri), crispy karaage. Osaka and Shimonoseki are the strongholds.", order: "Course (fugu kaiseki) at a licensed specialist. It's about texture and the hot fin sake (hirezake), not big flavor.", price: "$50–125/person (¥8–20k)" },
  { name: "Curry rice", jp: "カレー", what: "Japan's true national dish — thick, mild, deeply comforting. CoCo Ichibanya lets you tune spice 1–10 and pile on toppings.", order: "Pick base, spice level (3 = solid), toppings. Katsu curry = the move.", price: "$5–9 (¥800–1,400)" },
  { name: "Onigiri", jp: "おにぎり", what: "Konbini rice triangles — tuna mayo, salmon, umeboshi. The pull-tab seaweed wrapper system is origami genius.", order: "Pull tab 1, then 2, then 3. There are diagrams. You'll still tear one wrong and that's part of it.", price: "$0.80–1.60 (¥120–250)" },
  { name: "Wagashi & matcha", jp: "和菓子", what: "Traditional sweets — mochi, dorayaki, taiyaki (fish-shaped custard/red-bean waffles, eaten HOT in December), dango. Pair with bitter matcha.", order: "Taiyaki from street stands; matcha + seasonal wagashi sets at temple-adjacent tea houses.", price: "$1.30–9 (¥200–1,500)" },
  { name: "Kare-pan & konbini bakery", jp: "カレーパン", what: "Curry-stuffed fried bread, melon pan, an entire genre of milk breads. Japanese bakeries (and even konbinis) embarrass most Western ones.", order: "Tongs + tray at bakeries. Grab melon pan warm if you ever see it fresh.", price: "$1–2.50 (¥150–400)" },
  { name: "Crab (kani)", jp: "蟹", what: "December = peak season. Snow crab (zuwai) legs grilled at markets, king crab, full crab kaiseki at Kani Doraku, kani-suki crab hotpots.", order: "Market stalls: point, pay, eat. Kani Doraku: book a course for the table.", price: "$6 market snack – $94 course (¥1k–15k)" },
  { name: "Fluffy pancakes & kissaten", jp: "喫茶店", what: "Jiggly soufflé pancakes (A Happy Pancake, Flipper's) vs retro kissaten coffee shops with pudding and pizza toast. Tokyo breakfast culture both old and new.", order: "Expect a queue at pancake spots — put a name in, walk, return.", price: "$6–11 (¥1,000–1,800)" },
  { name: "Ichigo daifuku & strawberry season", jp: "いちご大福", what: "Winter is strawberry season in Japan (greenhouse perfection). Whole strawberry inside mochi with red bean — December depachika stock them everywhere.", order: "Depachika basements and wagashi shops. Eat same-day.", price: "$2–4 (¥300–600)" },
  { name: "Strawberry shortcake & Christmas cake", jp: "クリスマスケーキ", what: "Japan's December obsession: sponge, whipped cream, in-season strawberries. The Dec 24–25 'Christmas cake' is a near-mandatory cultural ritual, reserved weeks ahead at depachika and konbini.", order: "Konbini slices anytime; whole cakes pre-order online. Pair with KFC for the full Japanese Christmas.", price: "$5 slice – $44 whole (¥800–7k)" },
  { name: "KFC Christmas bucket", jp: "ケンタッキー", what: "Thanks to a 1974 ad campaign, fried chicken IS Christmas dinner in Japan. Lines out the door on Dec 24. We are not above this — we are leaning all the way in.", order: "Pre-order the party barrel online days ahead, or queue 30–60 min on the 24th. Get the whole-bird option if available.", price: "$25–40 barrel (¥4–6.5k)" },
  { name: "Yakitori", jp: "焼き鳥", what: "Charcoal chicken skewers, piece by piece: momo (thigh), negima (thigh+leek), tsukune (meatball, dip in raw egg yolk), kawa (crispy skin). The yokocho-alley food group.", order: "By the stick or 'omakase de'. Choose shio (salt) or tare (sweet glaze) — shio shows off good charcoal.", price: "$1–2.50/stick (¥150–400)" },
  { name: "Yakiton (pork skewers)", jp: "焼きとん", what: "Yakitori's pork sibling: shiro (intestine), tan (tongue), kashira (cheek), all charcoal-grilled. Cheaper, funkier, the working-class izakaya staple. Torishige in Shibuya is a shrine.", order: "Shio or tare, by the stick. Pairs with a lemon sour and zero pretension.", price: "$1–2/stick (¥150–300)" },
  { name: "Okonomiyaki", jp: "お好み焼き", what: "The savory cabbage-batter pancake. RELIGIOUS SCHISM: Osaka mixes everything in; Hiroshima LAYERS it over yakisoba noodles. We try both and take sides on Dec 26.", order: "Many shops let you grill at the table; if a counter chef builds it, hands off the spatula. Mayo crosshatch = correct.", price: "$6–13 (¥900–2,000)" },
  { name: "Takoyaki", jp: "たこ焼き", what: "Molten octopus dough-balls flipped in cast iron, painted with sauce, mayo, dancing bonito flakes. Osaka's street-food mascot.", order: "By the 6 or 8. WARNING: the inside is lava for a full 3 minutes. Every member of the crew will burn their mouth anyway. Tradition.", price: "$3.50–4.50 (¥550–700)" },
  { name: "Kushikatsu", jp: "串カツ", what: "Everything-on-a-stick, panko'd and deep-fried: beef, quail egg, lotus root, cheese, mochi. Born in Shinsekai, Osaka.", order: "Order rounds of sticks; communal sauce vat is dip-ONCE only (use the free cabbage to spoon extra). Daruma is the origin chain.", price: "$0.80–2/stick (¥130–300)" },
  { name: "Unagi / Hitsumabushi", jp: "うなぎ", what: "Grilled freshwater eel lacquered in tare over rice — crisp edges, custard middle. Hitsumabushi style = eat it 3 ways (plain, with condiments, as dashi-poured rice soup).", order: "Una-don for casual, hitsumabushi at specialist shops. Worth one splurge lunch.", price: "$16–31 (¥2,500–5,000)" },
  { name: "Anago meshi (conger eel)", jp: "あなご飯", what: "Unagi's saltwater cousin — lighter, flakier conger eel over rice, lacquered in tare. Hiroshima/Miyajima's signature; Ueno near the ferry (since 1901) is the legend.", order: "Order the anago-meshi box. Available as a heat-up ekiben for the train too.", price: "$13–22 (¥2,000–3,500)" },
  { name: "Gyukatsu", jp: "牛カツ", what: "Tonkatsu's beef cousin: rare-fried wagyu cutlet you finish yourself on a personal stone grill, slice by slice.", order: "Gyukatsu Motomura (Tokyo/Kyoto) is the queue-worthy chain. Sear each slice 10 seconds a side.", price: "$11–18 (¥1,800–2,800)" },
  { name: "Monjayaki", jp: "もんじゃ焼き", what: "Okonomiyaki's chaotic Tokyo cousin — a molten savory goo you cook on the table and eat with tiny metal spatulas straight off the griddle. Looks wrong, tastes right.", order: "Tsukishima Monja Street, Dec 17. Staff will start the first one so you learn the ritual.", price: "$6–9 (¥1,000–1,500)" },
  { name: "Nishin soba & yudofu", jp: "にしんそば・湯豆腐", what: "Kyoto's December soul-food set: hot soba topped with sweet-simmered herring (since 1882), and yudofu — silken tofu in kombu broth by the temple gardens.", order: "Matsuba at Shijo bridge invented nishin soba; yudofu row sits below Tenryu-ji in Arashiyama.", price: "$7–16 (¥1,100–2,500)" },
  { name: "Omurice", jp: "オムライス", what: "Ketchup fried rice wearing a quivering omelet blanket, often knife-split tableside in slow motion. Yoshoku (Japanese-Western) comfort canon.", order: "Kissaten and yoshoku diners. If the menu photo shows the knife-split, order that one.", price: "$6–9 (¥900–1,500)" },
  { name: "Melonpan & taiyaki, hot", jp: "メロンパン・たい焼き", what: "Street-bakery December doubleheader: crackly melonpan straight from the oven and fish-shaped taiyaki with scalding custard/red-bean tails.", order: "Asakusa's Kagetsudo for melonpan; any street stall venting sweet steam for taiyaki. Eat standing next to the stall (manners).", price: "$1.30–2 (¥200–350)" },
  { name: "Gyudon (beef bowl)", jp: "牛丼", what: "Thin simmered beef over rice, the $4 fuel of the nation. Yoshinoya/Sukiya/Matsuya trinity, open 24h. The 6am pre-Fushimi-Inari breakfast and the 2am shame meal both.", order: "Ticket machine or counter. Add a raw egg (tamago) and miso soup set. 'Tsuyudaku' = extra sauce.", price: "$3–5 (¥500–800)" },
  { name: "Shirasu-don (whitebait)", jp: "しらす丼", what: "Kamakura's coastal specialty: tiny Shonan-caught whitebait over rice, raw (nama, silky) or boiled (delicate). In season Apr–Dec before the Jan–Mar fishing ban — we just catch it.", order: "Wasai Yakura did the original. Get the half-raw/half-boiled bowl to settle the debate.", price: "$9–13 (¥1,400–2,000)" },
  { name: "Kobe beef teppanyaki", jp: "神戸牛", what: "A5 Tajima beef seared on an iron plate in front of you. The reason to detour to Kobe — Misono (1945) literally invented teppanyaki steak.", order: "Steakland (Sannomiya) for value lunch; Misono/Ikuta for the ceremony. Course includes garlic rice fried in the beef fat.", price: "$25 lunch – $200+ dinner (¥4k–32k+)" },
  { name: "Ekiben", jp: "駅弁", what: "Station bento engineered for shinkansen windows: regional specialties, self-heating wagyu boxes, art-tier packaging. A genre, a hobby, and one of our standing competitions (see Play tab).", order: "Ekibenya Matsuri at Tokyo Stn (200+ kinds) or any station hall. Buy BEFORE boarding + tea + dessert.", price: "$6–13 (¥1,000–2,000)" },
  { name: "Wagyu, properly", jp: "和牛", what: "A5 marbling that dissolves like beef butter. Formats by budget: yakiniku (grill-it, best value), sukiyaki (the farewell dinner format), steak counters, $6 market skewers.", order: "Kuromon/Nishiki market skewers for the cheap hit; the Dec 28 sukiyaki for the ceremony. 'A5' on the menu is the keyword.", price: "$6 skewer – $94 dinner (¥1k–15k)" },
  { name: "Nikuman & butaman", jp: "肉まん・豚まん", what: "Fist-sized steamed pork buns, the December hand-warmer you eat. Konbini register-case version is everywhere; Osaka's 551 Horai butaman is the regional cult object Osakans smuggle home by the boxful.", order: "Konbini: ask for one from the steamer case at the register. 551: queue, buy a 4-pack ($5.50 / ¥880), eat at least one before it cools — that's the point.", price: "$1.10 konbini – $5.50/4-pack (¥180–880)" },
  { name: "Amazake", jp: "甘酒", what: "Sweet, thick, low/no-alcohol fermented-rice drink served steaming hot — the December shrine-and-festival warmer handed out near temple gates. Tastes like liquid mochi; the wholesome cousin to all the Strong Zero.", order: "Shrine stalls, old tea houses, and konbini hot-case cartons. Get it hot (atatakai); a ginger-topped one cuts the sweetness.", price: "$2–4 (¥300–600)" },
  { name: "Motsunabe", jp: "もつ鍋", what: "Fukuoka-style offal hotpot: beef/pork tripe simmered with mountains of cabbage and garlic chives in a soy or miso broth. December nabe royalty — collagen-rich, ferociously warming, built for a table to demolish.", order: "Order for the table (soy 'shoyu' or miso broth). Finish with the champon-noodle or rice shime — never skip the shime.", price: "$19–28/person (¥3,000–4,500)" },
  { name: "Kaki-nabe & oyster hotpot", jp: "牡蠣鍋", what: "December = peak oyster season, and Hiroshima (two-thirds of Japan's oysters) puts them in a miso-based hotpot with tofu and winter vegetables. Plump, briny, and the reason to anchor a Hiroshima night around a steaming pot.", order: "Order the kaki-nabe for the table at a Nagarekawa oyster izakaya; pair with cold sake or atsukan. Add the grilled-vs-fried oyster plate to start.", price: "$22–34/person (¥3,500–5,500)" },
  { name: "Yudofu, properly", jp: "湯豆腐", what: "Silken tofu trembling in a kombu broth, eaten with ponzu and condiments by a temple garden — Kyoto's most serene December lunch. Sounds austere; in a freezing Arashiyama courtyard it's transcendent.", order: "Okutan (Nanzen-ji, since 1635) or the Tenryu-ji-adjacent Arashiyama row. Course format ~$22–31 (¥3.5–5k). Let it warm you slowly.", price: "$16–31 (¥2,500–5,000)" },
  { name: "Doteyaki", jp: "どて焼き", what: "Osaka's beef tendon and konnyaku slow-braised for hours in sweet miso until it falls apart — the standing-bar winter staple that exists to be chased with a $2 (¥350) highball. Funky, sticky, deeply Osakan.", order: "Tenma and Shinsekai standing bars by the skewer/bowl. Pair with kushikatsu and a lemon sour; it's a graze, not a meal.", price: "$3–5 (¥500–800)" },
  { name: "Champon & sara-udon", jp: "ちゃんぽん・皿うどん", what: "Nagasaki's Chinese-Japanese hybrid: champon is thick noodles in a milky pork-seafood broth piled with cabbage, pork and squid; sara-udon is the crispy-fried-noodle version. Ringer Hut is the beloved chain that brings it nationwide. December comfort in a bowl.", order: "Ringer Hut for the reliable version; order it 'extra vegetables' (yasai-mashi) for free. Champon hot, sara-udon when you want the crunch.", price: "$6–11 (¥900–1,700)" },
  { name: "Tonjiru & kenchinjiru", jp: "豚汁・けんちん汁", what: "The miso soup that became a meal: tonjiru loads pork, daikon, carrot, burdock and konnyaku into miso broth (kenchinjiru is the vegetarian temple version). A $2 (¥300) bowl of pure December warmth that turns any teishoku into a feast.", order: "Add the tonjiru upgrade to any set meal (teishoku) at a teishoku-style diner; standalone at markets and festival stalls. Always hot.", price: "$2–4 (¥300–600)" },
  { name: "Imagawayaki / Oban-yaki", jp: "今川焼き・大判焼き", what: "Thick disc-shaped cakes griddled to order and stuffed with molten red-bean, custard, or matcha cream — the chunkier cousin of taiyaki. A scalding $1.30 (¥200) December street warmer; the custard ones are a controlled hazard.", order: "Street stalls and depachika counters venting sweet steam. Buy red-bean AND custard, eat standing by the stall while it cools. It will not cool enough.", price: "$1.30–2.50 (¥200–400)" },
  { name: "Hire-katsu sando & katsu sando", jp: "カツサンド", what: "Panko pork cutlet between pillowy milk bread with tonkatsu sauce — the konbini staple, the kissaten plate, and at the wagyu end a $30 (¥4,800) beef-katsu-sando flex. The handheld that does triple duty: breakfast, train fuel, 2am.", order: "Konbini case (~$2.50 / ¥400) for the everyday; specialist shops slice premium pork or wagyu thick. The airport-morning final meal, by law.", price: "$2.50 konbini – $30 wagyu (¥400–4,800)" },
  { name: "Taiyaki, hot", jp: "たい焼き", what: "Fish-shaped waffle-cakes filled with red bean, custard, or seasonal December chestnut/sweet-potato, eaten scalding off the iron. The crisp-tailed (kawari) vs cake-bodied debate splits the crew; the molten filling burns everyone equally.", order: "Any street stall venting sweet steam; eat standing next to the shop (manners). 'Anko' = red bean, 'custard' = the chaos pick.", price: "$1.30–2 (¥200–350)" },
  { name: "Buri & winter sashimi", jp: "鰤", what: "December's fish gets fat: buri (winter yellowtail) turns rich and buttery, plus winter saba and the year's best uni. Buri-shabu (swished in hot broth) and buri-daikon (simmered with radish) are the cold-weather formats that justify the season.", order: "Standing sushi bars and izakaya — ask what's 'shun' (in-season). Buri-shabu for the table; the sashimi at a counter shows off the fat.", price: "$9 plate – $50 course (¥1.5k–8k)" },
  { name: "Zenzai & oshiruko", jp: "ぜんざい・お汁粉", what: "Hot sweet red-bean soup with grilled mochi floating in it — the December tea-house dessert that doubles as a hand-warmer. Zenzai (chunky beans) vs oshiruko (smooth) is a regional schism worth one argument.", order: "Temple-adjacent tea houses and old kissaten; comes with a salty kombu or pickle on the side to reset the palate. Eat the toasted mochi before it sinks.", price: "$5–8 (¥800–1,300)" },
  { name: "Chanko nabe", jp: "ちゃんこ鍋", what: "The sumo wrestler's growth fuel: a colossal one-pot of chicken 'soppu' broth, tsukune meatballs, pork, and a mountain of vegetables — engineered to feed a whole stable. December nabe royalty, best eaten in Ryogoku at an ex-wrestler's joint with the backstory included.", order: "Order for the table at a Ryogoku chanko house (Tomoegata, Kawasaki); reserve the tatami room. Finish with the rice or udon shime — that's the closer.", price: "$25–38/person (¥4,000–6,000)" },
  { name: "Kaki-fry & kaki-meshi", jp: "牡蠣フライ・牡蠣飯", what: "December oyster season beyond the hotpot: panko-fried oysters (kaki-fry) with tartar and a lemon squeeze, and kaki-meshi — oysters simmered into rice until the whole bowl tastes of the sea. Hiroshima and Miyajima do both like nowhere else.", order: "Kaki-fry as an izakaya plate with cold beer; kaki-meshi as a set at a Hiroshima oyster specialist. Get the fried-vs-grilled comparison if it's on.", price: "$9–22 (¥1,400–3,500)" },
  { name: "Teppanyaki (the show)", jp: "鉄板焼き", what: "Beyond Kobe steak: a counter where the chef sears wagyu, garlic, seafood and vegetables on the iron in front of you, finishing with garlic fried rice cooked in the beef fat. Theater and dinner at once — Misono in Kobe (1945) literally invented the format.", order: "Counter seating for the show; course menus handle a group. The garlic rice finisher is non-negotiable. Lunch courses deliver most of the experience at half the dinner price.", price: "$25 lunch – $200+ dinner (¥4k–32k+)" },
  { name: "Negima nabe & duck nabe", jp: "ねぎま鍋・鴨鍋", what: "The old-Tokyo December hotpots: negima nabe (fatty tuna and grilled leek in a soy-dashi broth, a pre-refrigeration Edo classic) and kamo nabe (rich duck with leek). Refined, warming, and a notch more grown-up than the chain shabu-shabu.", order: "Order for the table at an old-Tokyo izakaya or soba house; finish with soba or rice in the leftover broth. Pair with atsukan.", price: "$22–38/person (¥3,500–6,000)" },
  { name: "Jingisukan (Genghis Khan lamb BBQ)", jp: "ジンギスカン", what: "Hokkaido's domed cast-iron grill piled with lamb and vegetables, the fat running down to caramelize the edges — a smoky, beer-soaked group format that's popped up across Tokyo and Osaka. Grill-it-yourself chaos with a different protein.", order: "Order rounds of lamb and veg; the dome's center grills the meat, the moat steams the cabbage. Beer is the only correct pairing.", price: "$19–31/person (¥3,000–5,000)" },
  { name: "Abura soba & mazesoba", jp: "油そば・まぜそば", what: "Brothless ramen: thick noodles tossed with tare, oil, an egg yolk and toppings — you mix it yourself at the table. Nagoya's Taiwan mazesoba (spicy minced pork, chives, garlic) is the gateway drug. Cheaper and punchier than a full bowl.", order: "Mix vigorously before the first bite — 20+ stirs. Add the vinegar and chili oil on the table. Ask for 'oomori' (extra noodles, usually free) and the rice to mop the leftover tare.", price: "$6–9 (¥900–1,500)" },
  { name: "Sumiyaki & robatayaki", jp: "炭火焼き・炉端焼き", what: "Charcoal-grill izakaya theater: a counter around an open hearth where the cook grills fish, scallops, shishito and rice balls and passes them over on a long wooden paddle. Maximum smoke, maximum group energy, and a December menu thick with winter fish.", order: "Sit at the hearth counter; point at what's on ice and let them grill it. Order the grilled rice ball (yaki-onigiri) and a hokke (grilled atka mackerel) for the table.", price: "$25–38/person (¥4,000–6,000)" },
  { name: "Hamo & winter shirako", jp: "白子", what: "The December delicacy the crew will dare each other into: shirako — cod milt (yes, that) — served raw with ponzu, grilled, or tempura'd, melting like savory custard. Funky, creamy, and a genuine winter peak. The 'order it before you Google it' dish.", order: "At a counter izakaya, ask for 'shirako ponzu' or 'shirako tempura' (the tempura is the easy-mode entry). One order to share; watch faces. December only.", price: "$8–16 (¥1,300–2,500)" },
  { name: "Sumibi yakitori omakase", jp: "焼き鳥おまかせ", what: "The serious-counter version of the yokocho stick: a chef grilling rare cuts — bonjiri (tail), seseri (neck), hatsu (heart), shiro (oyster) — over binchotan charcoal, course by course, salt-forward to show off the bird. A whole different sport from Torikizoku.", order: "Counter omakase, 'osusume de'. Shio (salt) over tare to taste the char. The chicken-wing and the tsukune-with-yolk are the standouts; one splurge yakitori night earns its place.", price: "$31–50/person (¥5,000–8,000)" },
  { name: "Uji matcha parfait", jp: "抹茶パフェ", what: "The Kyoto/Uji sweets boss fight: layered matcha ice cream, warabimochi, shiratama dango, red bean and matcha jelly in a towering glass, stone-milled from the country's best tea. Bitter, sweet, cold, and worth the inevitable queue.", order: "Nakamura Tokichi (Uji) or Tsujiri — put a name in and walk. Order 'koicha' (thick tea) on the side only if you respect bitterness. The parfait is the order, not the latte.", price: "$9–14 (¥1,400–2,200)" },
  { name: "Warabimochi & kuzukiri", jp: "わらび餅・葛切り", what: "Kyoto/Nara's silken wagashi: bracken-starch warabimochi dusted in kinako and kuromitsu, and kuzukiri — translucent kudzu noodles you dip in black sugar syrup. Cool, jiggly, refined; the calm tea-house counterpoint to a week of fried sticks.", order: "Old tea houses in Naramachi and Gion; freshly-made warabimochi (not the gummy supermarket kind) is a different food. Tea-and-sweets set format. Eat same-day.", price: "$5–9 (¥800–1,400)" },
  { name: "Battera & saba-zushi (pressed mackerel)", jp: "バッテラ・鯖寿司", what: "Kansai's pressed-sushi tradition: battera (vinegared mackerel pressed into a neat block over rice) and Kyoto's fatter saba-zushi, plus Nara's persimmon-leaf-wrapped kakinoha-zushi. Made to keep — the original travel food, and a great train-and-graze format for 8.", order: "Depachika and specialist shops; buy a sampler box to share standing. Nara's Hiraso for kakinoha-zushi; Kyoto's Izuju (Gion, since 1912) for saba-zushi.", price: "$9–19/box (¥1,400–3,000)" },
  { name: "Fugu karaage & tecchiri (the full course)", jp: "ふぐ唐揚げ・てっちり", what: "The deeper cut of the winter pufferfish ritual beyond the sashimi: fugu karaage (crispy fried chunks, the crowd-pleaser), tecchiri (the fugu hotpot you finish with rice porridge), and the hirezake fin-sake to wash it down. Osaka is the fugu stronghold.", order: "A licensed specialist, full course only. Tecchiri for the table; the karaage converts the nervous; the zosui (rice porridge shime) at the end is the secret best part. Order the hirezake.", price: "$50–125/person (¥8k–20k)" },
];

export type Chain = {
  name: string;
  what: string;
  verdict: string;
};

export const CHAINS: Chain[] = [
  { name: "Ichiran", what: "Tonkotsu ramen in solo focus booths, ~$8 (¥1,300)", verdict: "Touristy but genuinely good — and the booth system seats 8 instantly when restaurants won't" },
  { name: "Sushiro / Kura Sushi", what: "Conveyor sushi, $0.90–2 (¥150–300) plates, tablet ordering", verdict: "Quality that would embarrass US sushi bars; Kura's prize-capsule game hooks groups" },
  { name: "Torikizoku", what: "All skewers & drinks one price (~$2.40 / ¥390)", verdict: "The big-group izakaya cheat code — walk-ins for 8 actually possible" },
  { name: "CoCo Ichibanya", what: "Customizable curry rice, $5–9 (¥800–1,400)", verdict: "Reliable warm hug at any hour, every city" },
  { name: "Marugame Seimen", what: "Fresh-pulled udon cafeteria", verdict: "$3 (¥500) lunch that outclasses $13 (¥2,000) meals elsewhere" },
  { name: "Tenya", what: "Tempura bowls fast-food style", verdict: "$5 (¥700) tendon is the best value meal in Japan" },
  { name: "Gyukaku", what: "Yakiniku BBQ chain, $19–31/head (¥3–5k)", verdict: "Group-friendly grills, English menus, courses for 8" },
  { name: "Saizeriya", what: "Absurdly cheap 'Italian'", verdict: "$2 (¥300) pizza at 11pm hits a specific note — a cultural experience, not a culinary one" },
  { name: "Komeda's Coffee", what: "Nagoya-style kissaten chain", verdict: "Order coffee before 11am → free toast & egg. December morning ritual" },
  { name: "Mister Donut", what: "Donuts + dim sum, weirdly", verdict: "Pon de Ring texture doesn't exist in America. Get one" },
  { name: "Isomaru Suisan", what: "24h grill-your-own seafood izakaya", verdict: "Crab miso shell + scallops over a table grill at 1am, walk-in for 8 possible. Kabukicho safe harbor" },
  { name: "Gyukatsu Motomura", what: "Self-seared rare beef cutlet", verdict: "The queue moves fast and the stone-grill ritual converts skeptics. $9 (¥1,500) lunch heroics" },
  { name: "Nabezo / Onyasai", what: "All-you-can-eat shabu-shabu & sukiyaki, $25–38 (¥4–6k)", verdict: "Hot-pot for 8 with timed courses — the December nabe move when an izakaya can't seat the crew" },
  { name: "Matsuya / Sukiya / Yoshinoya", what: "The gyudon (beef bowl) trinity", verdict: "$3 (¥500), 90 seconds, open 24h. The 6am pre-Fushimi-Inari fuel and the 2am shame meal. Both valid" },
  { name: "Hanamaru / station soba stands", what: "Standing noodles, $2.50 (¥400)", verdict: "Eat shoulder-to-shoulder with salarymen in 6 minutes flat. A transit-day ritual, not a compromise" },
  { name: "Osaka Ohsho / Gyoza no Ohsho", what: "Gyoza + fried rice + beer", verdict: "Cheap, loud, fast, everywhere in Kansai. The post-arcade refuel" },
  { name: "Go!Go!Curry", what: "Kanazawa-style black curry, ~$6 (¥1,000)", verdict: "Thicker, darker, gorilla-branded. Try once and join the CoCo-vs-GoGo discourse" },
  { name: "Doutor / kissaten chains", what: "Coffee + morning sets", verdict: "$3 (¥500) coffee-and-toast breakfasts when the konbini rotation needs a sit-down day" },
  { name: "Yakiniku Like", what: "Solo-grill yakiniku, $7–11 (¥1,100–1,800)", verdict: "One person, one grill, one beer in 20 minutes — the lone-wolf lunch when the crew scatters" },
  { name: "Tsukada Nojo / Watami", what: "Izakaya chains with private rooms & jitokko nabe", verdict: "Reservable rooms for 8 + winter chicken nabe and nomihodai. The reliable booked-ahead group dinner" },
  { name: "Kourakuen / Tenkaippin", what: "Cheap regional ramen chains", verdict: "Tenkaippin's 'kotteri' broth is thick enough to stand a spoon in — a 1am cult classic, ~$6 (¥1,000)" },
  { name: "Hama Sushi", what: "The budget conveyor king, plates from $0.60 (¥100)", verdict: "Cheaper than Sushiro, soy-sauce taps at the table, app ordering — the volume play for 8 hungry guys" },
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
      { name: "Tsukiji outer-market sushi breakfast", where: "Tsukiji, Dec 18, 8am", note: "Tuna-belly bowls, uni, tamagoyaki on a stick, grilled scallops with butter-soy, $13 (¥2,000) kaisendon. Arrive hungry, leave broke, regret nothing" },
      { name: "Ramen Street ranking run", where: "Tokyo Station B1", note: "8 famous shops underground — split up, order via machine, reconvene, rank bowls. Rokurinsha's tsukemen ($7 / ¥1,150) is the favorite to beat" },
      { name: "Monjayaki initiation", where: "Tsukishima Monja Street", note: "45 shops on one street, ~$9 (¥1,400) a plate. Tables of 4, two tables, swap halfway" },
      { name: "Depachika raid", where: "Mitsukoshi/Isetan basements", note: "The greatest food halls on Earth. $19 (¥3,000) jewel-strawberries to gawk at, ichigo daifuku + croquettes to actually buy. Bento discounts after 19:00" },
      { name: "Omoide Yokocho yakitori", where: "Shinjuku, night one", note: "Smoke, lanterns, 1947. Point at sticks ($1.30–2.50 / ¥200–400 each), drink what appears" },
      { name: "Soufflé pancakes", where: "A Happy Pancake / Flipper's (Harajuku, Shimokita)", note: "Jiggly cloud pancakes, ~$11 (¥1,800). Put a name in, walk the neighborhood, return when buzzed" },
      { name: "KFC + shortcake Christmas", where: "Any KFC, Dec 24–25", note: "The Japanese Christmas ritual. Pre-order the barrel ($25–40 / ¥4–6.5k), grab strawberry shortcake from the konbini, lean in completely" },
      { name: "Asakusa melonpan, hot", where: "Kagetsudo, near Senso-ji", note: "Crackly-topped melonpan ($1.30 / ¥200) straight from the oven. Eat standing by the shop while it steams" },
    ],
  },
  {
    city: "Kamakura",
    emoji: "🏯",
    items: [
      { name: "Shirasu-don", where: "Wasai Yakura / Komachi-dori shops", note: "Shonan whitebait over rice, ~$11 (¥1,700). Raw and boiled half-and-half; in season right up to the December cutoff" },
      { name: "Komachi-dori grazing", where: "Station to Hachimangu shrine", note: "Croquettes, dango, shirasu tamagoyaki skewers, crepes, $2–4 (¥300–600) each. The eat-while-walking 400m gauntlet" },
      { name: "Hokokuji bamboo-grove matcha", where: "Hokokuji 'bamboo temple'", note: "Matcha + wagashi in the bamboo, ~$8 (¥1,300) incl. entry. The calm cold-weather pause" },
      { name: "Hato sabure", where: "Toshimaya, since 1894", note: "Dove-shaped butter shortbread, boxes $6–19 (¥1–3k). The omiyage nobody dislikes" },
    ],
  },
  {
    city: "Kyoto",
    emoji: "⛩️",
    items: [
      { name: "Nishiki Market grazing run", where: "'Kyoto's Kitchen', 400m arcade", note: "Tako-tamago (candied octopus with a quail egg head), yuba donuts, black sesame ice cream, pickle samples, $2–5 (¥300–800) a bite. Stand and eat AT each stall" },
      { name: "Matcha everything", where: "Uji — Nakamura Tokichi (Dec 24 am) + tea houses", note: "The matcha capital: stone-milled parfaits ($9 / ¥1,400), matcha soba, ceremonial-grade hits. Order 'koicha' only if you respect bitterness" },
      { name: "Yatsuhashi free-sample circuit", where: "Sannenzaka/Ninenzaka shops", note: "Cinnamon mochi sheets, every shop samples — a full dessert if you're shameless. Buy a $6 (¥1,000) box from whoever wins" },
      { name: "Obanzai izakaya night", where: "Kiyamachi backstreets", note: "Kyoto home-cooking small plates, $25–38 (¥4–6k) with drinks — the counter ones with handwritten menus. Say 'osusume de' and trust" },
      { name: "Kyoto Station Ramen Koji", where: "Station 10F", note: "7 regional ramen styles ($8–11 / ¥1.2–1.7k) in one corridor — the national tour without the train tickets" },
      { name: "Yudofu by the temples", where: "Okutan (Nanzen-ji, since 1635), Arashiyama row", note: "Silken tofu simmering in kombu broth, course ~$22–31 (¥3.5–5k). The platonic Kyoto-in-December lunch" },
      { name: "Nishin soba", where: "Matsuba, Shijo bridge (since 1882)", note: "Hot soba with sweet-simmered herring, ~$9 (¥1,400). They invented it; eat it where it was born" },
    ],
  },
  {
    city: "Nara",
    emoji: "🦌",
    items: [
      { name: "Kakinoha-zushi", where: "Hiraso / Tanaka, around Nara park", note: "Pressed sushi cured in persimmon leaves, boxed sets $9–16 (¥1.4–2.5k) — the 1,300-year-old original to-go food" },
      { name: "Nakatanidou mochi, warm", where: "Naramachi", note: "The viral high-speed mochi-pounding shop. Warm yomogi mochi straight from the hammer: best $1.30 (¥200) of the trip" },
      { name: "Miwa somen (hot nyumen)", where: "Miwa / Nara restaurants", note: "Birthplace of somen, served hot in dashi for December, ~$6–9 (¥1–1.4k). The warm bowl is the winter move" },
      { name: "Harushika sake flight", where: "Harushika brewery", note: "Sake was effectively born in Nara. $3 (¥500) = 5 tastings + the glass. Educational. Extremely educational" },
    ],
  },
  {
    city: "Osaka",
    emoji: "🐙",
    items: [
      { name: "Kuromon Ichiba seafood flex", where: "Kuromon market, Dec 27 9am", note: "Grilled scallops, wagyu skewers ($6 / ¥1,000), uni shooters, king crab legs ($13+ / ¥2,000+) at December peak. Breakfast of degenerates" },
      { name: "Takoyaki crawl", where: "Wanaka, Kukuru, Juhachiban", note: "Three stands, six balls each ($3.50–4.50 / ¥550–700 a boat), crown a champion. Mouth-roof casualties expected" },
      { name: "Okonomiyaki at Mizuno", where: "Dotonbori (queue) or Ajinoya", note: "1945 institution, ~$11 (¥1,700). The yamaimo-batter deluxe is the order" },
      { name: "Kushikatsu at Daruma", where: "Shinsekai origin store", note: "Sticks $0.80–2 (¥130–300). NO DOUBLE DIPPING. They will announce it to the room in two languages" },
      { name: "Kani Doraku crab kaiseki", where: "Under the giant moving crab", note: "December = crab season peak in crab city: sashimi, sukiyaki, grilled, tempura. Course $50–94 (¥8–15k). The booked-ahead Kansai farewell" },
      { name: "551 Horai butaman", where: "Namba/stations everywhere", note: "Steamed pork buns ($5.50 / ¥880 for 4) Osakans carry like contraband. The line moves fast; buy a 4-pack for the house" },
      { name: "Fugu at Zubora-ya / Shinsekai specialists", where: "Shinsekai / Dotonbori", note: "Winter pufferfish: tessa sashimi, tecchiri hotpot, hirezake. Licensed-chef course $50–125 (¥8–20k). The one nervous-laughter dinner" },
      { name: "Doteyaki & oden standing bars", where: "Tenma / Shinsekai", note: "Miso-braised beef tendon ($3–5 / ¥500–800) and winter oden against the December cold, with $2 (¥350) highballs" },
    ],
  },
  {
    city: "Kobe",
    emoji: "🥩",
    items: [
      { name: "Kobe beef teppanyaki", where: "Steakland (value) / Misono (1945) / Ikuta, Sannomiya", note: "A5 Tajima seared in front of you. Lunch $25–38 (¥4–6k); dinner course $75–125+ (¥12–20k+). Garlic rice in the beef fat is the finisher" },
      { name: "Nankinmachi Chinatown crawl", where: "Kobe Chinatown, near Motomachi", note: "Steamed buns, fried xiaolongbao, ramen, $2–4 (¥300–600) a bite. Graze a loop, regroup at the square pavilion" },
      { name: "Sobameshi & Kobe gyoza", where: "Nagata district / Hyotan, Sannomiya", note: "Kobe-invented fried-noodle-and-rice and miso-dare gyoza, ~$5–9 (¥800–1.4k). The cheap counterpoint to the beef" },
    ],
  },
  {
    city: "Hiroshima & Miyajima",
    emoji: "🕊️",
    items: [
      { name: "Hiroshima-yaki at Hassho / Okonomimura", where: "Hassho (the famous one) or 20 counters in one building", note: "Layered-with-noodles style on a giant communal teppan, ~$6–13 (¥1–2k). Add a December oyster. Lunch doubles as the day's decompression" },
      { name: "Grilled oysters", where: "Miyajima Omotesando street", note: "December = peak oyster season, Miyajima = oyster Mecca. $3 (¥500) for two, grilled in the shell in front of you" },
      { name: "Oyster blowout at Ekohiiki", where: "Near Hiroshima station", note: "Grilled, fried, tempura, raw — affordable oyster specialist, course $19–31 (¥3–5k). The sit-down December feast" },
      { name: "Hiroshima tsukemen", where: "Bakudanya, near the station", note: "Cold noodles in a spicy red-pepper dip, ~$6–9 (¥1–1.4k). Pick your heat — start at level 3" },
      { name: "Momiji manju, deep-fried", where: "Miyajima stalls", note: "Maple-leaf cakes, custard or red bean, battered and fried on a stick, $1.30–2 (¥200–300). The walking dessert" },
      { name: "Anago meshi", where: "Ueno (1901), near Miyajimaguchi ferry", note: "Conger-eel rice boxes, $13–22 (¥2–3.5k) — the 1901 shop by the ferry pier is the legend, sells out by afternoon. Grab the ekiben version if it's gone" },
    ],
  },
];

export type KonbiniItem = {
  name: string;
  where: string;
  note: string;
};

export const KONBINI_HALL_OF_FAME: KonbiniItem[] = [
  { name: "Egg sando", where: "7-Eleven", note: "The famous one, ~$1.50 (¥240). Kewpie-mayo egg salad on impossible milk bread" },
  { name: "Famichiki", where: "FamilyMart", note: "Hot fried chicken at the register, ~$1.50 (¥240). The people's champion" },
  { name: "Karaage-kun", where: "Lawson", note: "Nugget cups in 4 flavors, ~$1.60 (¥250) — the rival faction. Try both, pick a side" },
  { name: "Onigiri (tuna mayo)", where: "All three", note: "$0.90 (¥140) of perfection. 7-Eleven's rice is rated best by nerds" },
  { name: "Strawberry sandwich", where: "7-Eleven / Lawson", note: "Fruit + cream + bread, ~$2.20 (¥350). Sounds wrong, is right — peak season is now" },
  { name: "Hot snack case oden", where: "7-Eleven / FamilyMart", note: "Winter-only simmered dashi pot: daikon, eggs, fishcakes. ~$0.60–0.90/piece (¥100–150)" },
  { name: "Premium roll cake", where: "Lawson", note: "$1.60 (¥250) of cream-to-cake ratio set by a visionary" },
  { name: "あたたかい hot drinks", where: "All + vending machines", note: "The heated case/red-label rows, ~$0.80–1 (¥130–160): hot royal milk tea, corn soup, lemon honey. Pocket heaters you drink" },
  { name: "Melon pan", where: "All three", note: "Cookie-crusted sweet bun, ~$1.30 (¥200). Best slightly warmed if they offer" },
  { name: "Drip coffee", where: "7-Eleven", note: "$0.80 (¥120) machine coffee, ground per cup — better than most US café pours" },
  { name: "Nikuman (steamed pork bun)", where: "All three, register case", note: "December hand-warmer you eat, ~$1.10 (¥180). Pizza-man variant is the chaos pick" },
  { name: "Zaru soba & pasta chillers", where: "All three", note: "$2.50–4 (¥400–600) cold noodles that would pass at a restaurant. Sauce packet origami included" },
  { name: "Salmon harasu onigiri", where: "Lawson", note: "Fatty salmon belly rice bomb, ~$1.60 (¥250) — the connoisseur's pick over tuna mayo (fight it out)" },
  { name: "Gari-gari kun ice pop", where: "All three", note: "$0.50 (¥80) national-treasure soda pop. Eating one outside in December = bingo-adjacent honor" },
  { name: "Mochi-texture rolls (Shiroi roll)", where: "FamilyMart", note: "The bakery shelf's sleeper hit, ~$1.30 (¥200) — mochi-mochi means 'pleasantly chewy' and it's a national value" },
  { name: "Pocari Sweat / Aquarius", where: "All + vending", note: "Electrolyte salvation, ~$1 (¥160). The official sponsor of nomihodai recovery" },
  { name: "Ukon no Chikara / Hepalyse", where: "Register-side shelf", note: "Turmeric/liver shots ($1.30–2.50 / ¥200–400) drunk BEFORE drinking by professionals. Trust the salaryman meta" },
  { name: "Curry pan", where: "All three", note: "Curry inside fried bread, ~$1.10 (¥180). 7-Eleven's is fried-to-order at some locations — if you see the hot case version, drop everything" },
  { name: "Famichiki bun hack", where: "FamilyMart", note: "Buy Famichiki + the $0.80 (¥120) plain bun, assemble the forbidden chicken burger. Menu off-menu" },
  { name: "Pudding (purin)", where: "7-Eleven 'kotteri' / Lawson", note: "Custard pudding ($1.30–2 / ¥200–300) is a genre. The 'firm retro' vs 'molten' debate splits families" },
  { name: "Christmas shortcake slice", where: "All three, late December", note: "Konbini sponge-cream-strawberry slices, ~$5 (¥800), stocked hard around Dec 24. The no-reservation Christmas cake" },
  { name: "Hot lemon / royal milk tea cans", where: "Vending machines (red label)", note: "あたたかい = warm, ~$1 (¥160). A drinkable hand-warmer every 40 meters across the entire nation" },
  { name: "Senbei & weird KitKats", where: "All + Don Quijote", note: "Matcha, sake, regional-exclusive KitKats ($3–6 / ¥500–1k a box) = the omiyage workhorse. Buy flat boxes, pack like Tetris" },
  { name: "Katsu sando", where: "All three", note: "Pork cutlet between milk bread, ~$2.50 (¥400). The airport-morning final meal, by law" },
];
