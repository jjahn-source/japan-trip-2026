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
      { dish: "Ramen", jp: "ラーメン", where: "Ichiran (solo booths), Nakiryu, Tokyo Station Ramen Street", why: "December cold + tonkotsu broth = perfection", groupTip: "Ichiran's booths mean 8 people never need a table" },
      { dish: "Sushi breakfast", jp: "寿司", where: "Tsukiji Outer Market", why: "Tuna bowls and oysters at 8am hits different", groupTip: "Graze the stalls instead of one sit-down — faster for 8" },
      { dish: "Wagyu yakiniku", jp: "焼肉", where: "Yakiniku chains like Gyukaku, or splurge at Jojoen", why: "Grill-your-own works perfectly for big groups", groupTip: "Book a private room for 8 — most yakiniku places have them" },
      { dish: "Konbini everything", jp: "コンビニ", where: "7-Eleven, Lawson, FamilyMart", why: "Egg sandos, onigiri, fried chicken, ¥200 coffee. Breakfast solved daily" },
      { dish: "Monjayaki", jp: "もんじゃ焼き", where: "Tsukishima Monja Street", why: "Tokyo's gooier answer to okonomiyaki — cook it yourselves at the table" },
    ],
  },
  {
    city: "Kyoto",
    emoji: "⛩️",
    accent: "from-orange-500 to-red-600",
    items: [
      { dish: "Kaiseki", jp: "懐石", where: "Gion / Pontocho — book weeks ahead", why: "Multi-course seasonal art. THE Kyoto food experience", groupTip: "Private tatami rooms fit 8; lunch kaiseki is half the dinner price" },
      { dish: "Yudofu (hot tofu)", jp: "湯豆腐", where: "Arashiyama & near Nanzen-ji", why: "Kyoto winter specialty — simmering tofu in kombu broth" },
      { dish: "Nishiki Market grazing", jp: "錦市場", where: "Nishiki Market, 'Kyoto's Kitchen'", why: "Tako tamago, yuba, sesame ice cream, fresh mochi", groupTip: "Eat standing at each stall — walking-while-eating is frowned on" },
      { dish: "Matcha everything", jp: "抹茶", where: "Uji (near Nintendo Museum!) or %Arabica Arashiyama", why: "Uji is Japan's matcha capital — parfaits, lattes, soba" },
      { dish: "Obanzai", jp: "おばんざい", where: "Small Kyoto home-style restaurants", why: "Kyoto's traditional small-plate home cooking" },
    ],
  },
  {
    city: "Osaka",
    emoji: "🐙",
    accent: "from-fuchsia-500 to-purple-600",
    items: [
      { dish: "Takoyaki", jp: "たこ焼き", where: "Wanaka Sennichimae, Dotonbori stands", why: "Molten octopus balls — the national dish of Osaka street life", groupTip: "Order 3-4 boats of 8 and share; they're LAVA inside" },
      { dish: "Okonomiyaki", jp: "お好み焼き", where: "Mizuno (Dotonbori, queue early), Fukutaro", why: "Savory cabbage pancake, Kansai-style" },
      { dish: "Kushikatsu", jp: "串カツ", where: "Daruma, Shinsekai", why: "Deep-fried skewers of everything. NO DOUBLE-DIPPING the communal sauce" },
      { dish: "Kuromon Market seafood", jp: "黒門市場", where: "Kuromon Ichiba", why: "Grilled scallops, snow crab legs, uni, wagyu skewers" },
      { dish: "Crab at Kani Doraku", jp: "かに道楽", where: "Dotonbori (the giant moving crab sign)", why: "December = peak crab season in Japan", groupTip: "Reserve a group course — full crab kaiseki for 8" },
    ],
  },
  {
    city: "Hiroshima & Miyajima",
    emoji: "🕊️",
    accent: "from-sky-500 to-blue-600",
    items: [
      { dish: "Hiroshima okonomiyaki", jp: "広島風", where: "Okonomimura (20+ stalls, one building)", why: "Layered with yakisoba noodles — locals insist it beats Osaka's", groupTip: "Spread across two stalls' counters in Okonomimura" },
      { dish: "Miyajima oysters", jp: "牡蠣", where: "Omotesando street grills", why: "Winter is oyster season; grilled in the shell streetside" },
      { dish: "Momiji manju", jp: "もみじ饅頭", where: "Miyajima island shops", why: "Maple-leaf cakes — get them deep-fried (age-momiji)" },
    ],
  },
];
