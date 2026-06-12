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
];
