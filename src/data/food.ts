export type FoodSpot = {
  dish: string;
  jp: string;
  where: string;
  why: string;
  groupTip?: string;
};

export type CityFood = {
  city: string;
  emoji: string;
  accent: string;
  items: FoodSpot[];
};

export const FOOD: CityFood[] = [
  {
    city: "Tokyo",
    emoji: "🗼",
    accent: "from-rose-500 to-pink-600",
    items: [
      { dish: "Ramen", jp: "ラーメン", where: "Ichiran (solo booths), Nakiryu (Michelin-starred tantanmen, Otsuka), Tokyo Station Ramen Street, Fuunji tsukemen (Shinjuku)", why: "December cold + tonkotsu broth = perfection. Nakiryu's a 1-star bowl for ~$9 (¥1,400)", groupTip: "Ichiran's booths mean 8 people never need a table; Fuunji's chicken-dashi tsukemen is worth the queue" },
      { dish: "Sushi breakfast", jp: "寿司", where: "Tsukiji Outer Market — Sushizanmai (24h), Yamacho standing sushi, Maguroya for tuna bowls", why: "Tuna bowls and grilled scallops at 8am hits different. Winter buri (yellowtail) is fat and at its peak", groupTip: "Graze the stalls instead of one sit-down — faster for 8. ~$13 (¥2,000) for a loaded kaisendon" },
      { dish: "Wagyu yakiniku", jp: "焼肉", where: "Gyukaku (chain, courses for 8), Jojoen (splurge), Yakiniku Like (solo grills)", why: "Grill-your-own works perfectly for big groups", groupTip: "Book a private room for 8 — most yakiniku places have them. Course runs ~$31–50/head ($5–8k yen)" },
      { dish: "Yakitori in the smoke", jp: "焼き鳥", where: "Omoide Yokocho (Shinjuku), Torishige yakiton (Yoyogi), Hoppy Street (Asakusa)", why: "Charcoal chicken under the tracks, lanterns, beer. The platonic Tokyo night opener", groupTip: "Counters seat 4–6 — split into two squads. ~$1.30–2.50 (¥200–400) a stick" },
      { dish: "Konbini everything", jp: "コンビニ", where: "7-Eleven, Lawson, FamilyMart", why: "Egg sandos, onigiri, fried chicken, $0.80 (¥120) coffee. Breakfast solved daily; winter oden in the hot case", groupTip: "7-Eleven egg sando ~$1.50 (¥240); Famichiki ~$1.50 (¥240)" },
      { dish: "Monjayaki", jp: "もんじゃ焼き", where: "Tsukishima Monja Street (Kondo, Daruma — 45 shops)", why: "Tokyo's gooier answer to okonomiyaki — cook it yourselves at the table", groupTip: "Two tables of 4, swap halfway. ~$9–13 (¥1,400–2,000) per plate" },
      { dish: "Sukiyaki / shabu-shabu", jp: "すき焼き", where: "Imahan (Asakusa/Ningyocho, since 1895), Nabezo (all-you-can-eat chain)", why: "The farewell-dinner format: one pot, raw egg dip, sweet soy. Made for a crew of 8 around a table", groupTip: "Nabezo handles 8 with set courses ~$31–44 (¥5–7k); Imahan is the splurge version" },
      { dish: "Tempura counter", jp: "天ぷら", where: "Tenya (chain, $5 bowls), Tsunahachi (Shinjuku, since 1923), Tempura Kondo (splurge)", why: "Feather-light, fried piece by piece in front of you at the counters", groupTip: "Tenya tendon ~$5 (¥800) is the best value lunch in Japan" },
      { dish: "Strawberry shortcake & KFC Christmas", jp: "クリスマスケーキ", where: "Depachika (Isetan/Mitsukoshi basements), any KFC, konbini", why: "Japan's Dec 24–25 ritual: reserve fried chicken weeks ahead, demolish a strawberry-cream shortcake. We lean all the way in", groupTip: "KFC Christmas barrel ~$25–40 (¥4–6.5k); pre-order online or queue an hour. Shortcake slices ~$5 (¥800)" },
      { dish: "Depachika raid", jp: "デパ地下", where: "Isetan Shinjuku, Mitsukoshi Ginza basements", why: "Greatest food halls on Earth: $19 (¥3,000) jewel-strawberries to gawk at, ichigo daifuku + croquettes to actually buy", groupTip: "Bento markdowns after 19:00 — circle back for half-price wagyu boxes" },
    ],
  },
  {
    city: "Kyoto",
    emoji: "⛩️",
    accent: "from-orange-500 to-red-600",
    items: [
      { dish: "Kaiseki", jp: "懐石", where: "Gion / Pontocho — Gion Karyo, Roan Kikunoi, Giro Giro (modern, affordable)", why: "Multi-course seasonal art. December menus feature crab and yuzu. THE Kyoto food experience", groupTip: "Private tatami rooms fit 8; lunch kaiseki ~$38–50 (¥6–8k) is half the dinner price of $94+ (¥15k+)" },
      { dish: "Yudofu (hot tofu)", jp: "湯豆腐", where: "Arashiyama (Shoraian) & near Nanzen-ji (Okutan, since 1635)", why: "Kyoto winter specialty — silken tofu simmering in kombu broth by the temple gardens", groupTip: "Okutan course ~$22–31 (¥3.5–5k); book ahead for 8" },
      { dish: "Nishiki Market grazing", jp: "錦市場", where: "Nishiki Market, 'Kyoto's Kitchen' (400m arcade)", why: "Tako-tamago (candied octopus + quail egg), yuba donuts, black sesame ice cream, fresh mochi, pickle samples", groupTip: "Eat standing AT each stall — walking-while-eating is frowned on. ~$2–5 (¥300–800) a bite" },
      { dish: "Matcha everything", jp: "抹茶", where: "Uji (Nakamura Tokichi, near Nintendo Museum), %Arabica Arashiyama, Tsujiri", why: "Uji is Japan's matcha capital — stone-milled parfaits, lattes, soba. Order koicha only if you respect bitterness", groupTip: "Nakamura Tokichi parfait ~$9 (¥1,400); expect a queue, put a name in" },
      { dish: "Obanzai", jp: "おばんざい", where: "Kiyamachi backstreets — small home-style counters with handwritten menus", why: "Kyoto's traditional small-plate home cooking. Say 'osusume de' and trust", groupTip: "~$25–38 (¥4–6k) a head with drinks; the counter spots cap at 6–8" },
      { dish: "Nishin soba", jp: "にしんそば", where: "Matsuba, Shijo bridge (invented it in 1882)", why: "Hot soba topped with sweet-simmered herring — Kyoto's December soul-food in a bowl", groupTip: "~$9 (¥1,400) a bowl, quick turnover" },
      { dish: "Tofu/yuba & temple cuisine", jp: "湯葉・精進", where: "Arashiyama yuba shops, shojin-ryori near temples", why: "Buddhist vegetarian multi-course — refined, warming, and the surprise crowd-pleaser", groupTip: "Shojin set ~$31–44 (¥5–7k); reserve for the group" },
      { dish: "Tonkatsu & gyukatsu", jp: "とんかつ・牛カツ", where: "Katsukura (Kyoto Station/Sanjo), Gyukatsu Motomura (Kyoto branch)", why: "Grind your own sesame; Motomura's stone-grill rare beef converts skeptics", groupTip: "Katsukura set ~$12–16 (¥1.9–2.5k); free cabbage refills" },
    ],
  },
  {
    city: "Osaka",
    emoji: "🐙",
    accent: "from-fuchsia-500 to-purple-600",
    items: [
      { dish: "Takoyaki", jp: "たこ焼き", where: "Wanaka Sennichimae, Kukuru, Juhachiban, Dotonbori stands", why: "Molten octopus balls — the national dish of Osaka street life", groupTip: "Order 3-4 boats of 8 and share; they're LAVA inside. ~$3.50–4.50 (¥550–700) a boat" },
      { dish: "Okonomiyaki", jp: "お好み焼き", where: "Mizuno (Dotonbori, 1945, queue early), Fukutaro, Ajinoya", why: "Savory cabbage pancake, Kansai-style — everything mixed in. The yamaimo-batter deluxe is the order", groupTip: "~$9–13 (¥1.4–2k); some let you grill at the table" },
      { dish: "Kushikatsu", jp: "串カツ", where: "Daruma (Shinsekai origin store), Yaekatsu", why: "Deep-fried skewers of everything. NO DOUBLE-DIPPING the communal sauce — they'll announce it in two languages", groupTip: "~$0.80–2 (¥130–300) a stick; use the free cabbage to spoon extra sauce" },
      { dish: "Kuromon Market seafood", jp: "黒門市場", where: "Kuromon Ichiba (Dec 27, 9am)", why: "Grilled scallops, snow crab legs at December peak, uni shooters, A5 wagyu skewers", groupTip: "Wagyu skewer ~$6 (¥1,000); king crab leg ~$13+ (¥2,000+). Breakfast of degenerates" },
      { dish: "Crab at Kani Doraku", jp: "かに道楽", where: "Dotonbori (the giant moving crab sign, since 1962)", why: "December = peak snow-crab season in crab city: sashimi, sukiyaki, grilled, tempura, kani-suki hotpot", groupTip: "Reserve a group course ~$50–94 (¥8–15k)/head — full crab kaiseki for 8. The booked-ahead Kansai farewell" },
      { dish: "Kitsune udon & dashi", jp: "きつねうどん", where: "Usami-tei Matsubaya (Namba, since 1893)", why: "Osaka invented kitsune udon — soft noodles, sweet fried tofu, killer kombu dashi. Hangover medicine", groupTip: "~$5–7 (¥800–1,100); fast and warming on a cold morning" },
      { dish: "Doteyaki & winter izakaya", jp: "どて焼き", where: "Shinsekai & Tenma standing bars", why: "Beef tendon slow-simmered in miso, the Osaka day-drinking snack, plus oden in the December cold", groupTip: "~$3–5 (¥500–800) a plate; pairs with $2 (¥350) highballs" },
      { dish: "551 Horai butaman", jp: "豚まん", where: "Namba, stations everywhere", why: "Steamed pork buns Osakans carry like contraband; the line moves fast", groupTip: "4-pack ~$5.50 (¥880); buy a box for the house" },
    ],
  },
  {
    city: "Nara",
    emoji: "🦌",
    accent: "from-amber-500 to-orange-600",
    items: [
      { dish: "Kakinoha-zushi", jp: "柿の葉寿司", where: "Shops around Nara Park (Hiraso, Tanaka)", why: "Pressed mackerel/salmon sushi cured in persimmon leaves — the 1,300-year-old original to-go food", groupTip: "Boxed sets ~$9–16 (¥1.4–2.5k); easy to share standing" },
      { dish: "Nakatanidou mochi, warm", jp: "中谷堂", where: "Naramachi (the viral high-speed mochi-pounding shop)", why: "Yomogi (mugwort) mochi pounded at hummingbird speed, served warm from the hammer", groupTip: "~$1.30 (¥200) each — best 200 yen of the trip. Catch a live pounding session" },
      { dish: "Miwa somen, hot nyumen", jp: "三輪そうめん", where: "Miwa / Nara restaurants", why: "Nara's birthplace-of-somen noodles served hot in dashi (nyumen) for December warmth", groupTip: "~$6–9 (¥1–1.4k); the warm version is the winter move" },
      { dish: "Harushika sake flight", jp: "春鹿", where: "Harushika brewery tasting room", why: "Sake was effectively born in Nara. $3 (¥500) buys 5 tastings + the glass. Extremely educational", groupTip: "Walk-in friendly; do it before the deer get handsy" },
      { dish: "Mochi & kuzu sweets", jp: "葛餅", where: "Naramachi tea houses", why: "Kuzukiri and warabimochi with kinako — silky cold-weather wagashi by the old townhouses", groupTip: "Tea + sweets set ~$5–9 (¥800–1.4k)" },
    ],
  },
  {
    city: "Kobe",
    emoji: "🥩",
    accent: "from-red-600 to-rose-700",
    items: [
      { dish: "Kobe beef teppanyaki", jp: "神戸牛", where: "Steakland (value, Sannomiya), Misono (1945, birthplace of teppanyaki), Steak House Ikuta", why: "A5 Tajima beef seared on iron in front of you. The whole reason to detour to Kobe", groupTip: "Steakland lunch ~$25–38 (¥4–6k); dinner courses $75–125+ (¥12–20k+). Book the splurge ahead for 8" },
      { dish: "Kobe beef, charcoal-grilled", jp: "炭火焼", where: "Aragawa (1967, virgin Tajima, bincho charcoal — legendary, pricey)", why: "The original Kobe steakhouse, charcoal-oven steaks. A bucket-list splurge if the crew pools funds", groupTip: "Easily $200+ (¥32k+)/head — pick ONE person's birthday and go big, or admire from the menu" },
      { dish: "Sobameshi & Kobe gyoza", jp: "そばめし・餃子", where: "Nagata district, Sannomiya gyoza shops (Hyotan)", why: "Sobameshi (fried noodles + rice) is a Kobe invention; Kobe gyoza eaten with miso-dare dipping sauce", groupTip: "~$5–9 (¥800–1.4k); the cheap counterpoint to the beef splurge" },
      { dish: "Nankinmachi Chinatown street eats", jp: "南京町", where: "Kobe Chinatown (Nankinmachi)", why: "Steamed buns, fried xiaolongbao, ramen — a dense grazing strip 5 min from Motomachi station", groupTip: "Buns ~$2–4 (¥300–600); graze a loop, regroup at the square pavilion" },
    ],
  },
  {
    city: "Kamakura",
    emoji: "🏯",
    accent: "from-emerald-500 to-teal-600",
    items: [
      { dish: "Shirasu-don (whitebait bowl)", jp: "しらす丼", where: "Wasai Yakura (original shirasu-don), Komachi Street shops", why: "Tiny Shonan-coast whitebait over rice — raw (nama, silky) or boiled (delicate). December is in-season before the Jan–Mar fishing ban", groupTip: "~$9–13 (¥1.4–2k); the nama/boiled half-and-half bowl settles the debate" },
      { dish: "Komachi Street grazing", jp: "小町通り", where: "Komachi-dori (from Kamakura station to Tsurugaoka Hachimangu)", why: "Crepes, croquettes, dango, shirasu tamagoyaki skewers, steamed buns — a 400m eat-while-you-walk gauntlet", groupTip: "Skewers & croquettes ~$2–4 (¥300–600); split a crepe to keep moving" },
      { dish: "Daibutsu-adjacent matcha & dango", jp: "抹茶・団子", where: "Tea houses near Hokokuji 'bamboo temple' and the Great Buddha", why: "Matcha + wagashi in a bamboo grove — the calm, cold-weather Kamakura afternoon", groupTip: "Hokokuji matcha set ~$8 (¥1,300) incl. temple entry" },
      { dish: "Hato sabure & local sweets", jp: "鳩サブレー", where: "Toshimaya (since 1894), Komachi shops", why: "Dove-shaped butter shortbread — the iconic Kamakura omiyage that nobody dislikes", groupTip: "Boxes ~$6–19 (¥1–3k); the airport/train-snack workhorse" },
    ],
  },
  {
    city: "Hiroshima & Miyajima",
    emoji: "🕊️",
    accent: "from-sky-500 to-blue-600",
    items: [
      { dish: "Hiroshima okonomiyaki", jp: "広島風", where: "Hassho (Yagenbori, the famous one), Okonomimura (20+ stalls, one building), Lopez", why: "Layered with yakisoba noodles, not mixed — locals insist it beats Osaka's. Add a December oyster", groupTip: "~$6–13 (¥1–2k); spread across two stalls' counters in Okonomimura" },
      { dish: "Miyajima grilled oysters", jp: "焼き牡蠣", where: "Omotesando street grills, Yakigaki no Hayashi", why: "December = peak oyster season, Miyajima = oyster Mecca. Grilled in the shell streetside, or kaki-fry", groupTip: "~$3 (¥500) for two grilled; sit-down oyster set ~$16–25 (¥2.5–4k)" },
      { dish: "Hiroshima tsukemen", jp: "広島つけ麺", where: "Bakudanya, Tsukemen Hompo near Hiroshima station", why: "Cold noodles dipped in a spicy red-pepper sauce — pick your heat level. Hiroshima's other noodle religion", groupTip: "~$6–9 (¥1–1.4k); start at spice level 3 unless you're showing off" },
      { dish: "Anago meshi", jp: "あなご飯", where: "Ueno (1901, near Miyajimaguchi ferry), Miyajima shops", why: "Conger-eel rice boxes lacquered in tare — the local eel cousin to unagi. Ueno sells out by afternoon", groupTip: "~$13–22 (¥2–3.5k); also sold as a heat-up ekiben for the train" },
      { dish: "Momiji manju, deep-fried", jp: "もみじ饅頭", where: "Miyajima stalls (age-momiji)", why: "Maple-leaf cakes — custard or red bean, battered and fried on a stick. The walking dessert", groupTip: "~$1.30–2 (¥200–300) each; eat standing by the stall" },
      { dish: "Oyster everything at Ekohiiki", jp: "牡蠣三昧", where: "Ekohiiki, near Hiroshima station", why: "Affordable oyster specialist — grilled, fried, tempura, raw. The sit-down December oyster blowout", groupTip: "Oyster course ~$19–31 (¥3–5k); reserve for 8" },
    ],
  },
];
