// Arcades, retro games, gachapon, anime, crane-game warfare — the Play layer.

export type PlaySpot = {
  name: string;
  jp?: string;
  city: "Tokyo" | "Kyoto" | "Osaka";
  area: string;
  kind: "Arcade" | "Retro Games" | "Gachapon" | "Anime & Manga" | "Character Store" | "Purikura" | "Cards & Figures" | "Mega Store";
  cost: string;
  why: string;
  protip: string;
};

export const PLAY_SPOTS: PlaySpot[] = [
  {
    name: "GiGO Akihabara (Buildings 1–5)",
    jp: "GiGO 秋葉原",
    city: "Tokyo",
    area: "Akihabara",
    kind: "Arcade",
    cost: "¥100–200/credit",
    why: "Multiple towers of arcade: crane games at street level, fighting games and rhythm games above, retro deeper in. The post-SEGA flagship cluster of the world's arcade capital.",
    protip: "Floor 1 = tourist crane bait. The real ones are upstairs: maimai (washing-machine rhythm game), Taiko no Tatsujin, DDR. Watch a Japanese pro play Chunithm for 5 minutes — it's a religious experience.",
  },
  {
    name: "Super Potato",
    jp: "スーパーポテト",
    city: "Tokyo",
    area: "Akihabara",
    kind: "Retro Games",
    cost: "Browsing free; wallets historically unsafe",
    why: "Three floors of immaculate retro: boxed Famicoms, EarthBound carts, GameBoys by the crate, a top-floor retro arcade with ¥100 classics. The museum where everything's for sale.",
    protip: "Japanese carts are region-happy for collectors but check console compatibility. Prices are fair-not-cheap; the find is the point. Top-floor arcade has original Space Invaders cabinets.",
  },
  {
    name: "Taito Station / GiGO Shinjuku",
    city: "Tokyo",
    area: "Kabukicho",
    kind: "Arcade",
    cost: "¥100–500/play",
    why: "The day-one arcade: open till midnight+, crane games, drum games, punch machines — 90 seconds from the Godzilla head.",
    protip: "Set a ¥1,000/person crane-game loss limit on night one or Charlie's whole shopping budget dies for a Pikachu the staff would've repositioned for free. (Staff WILL reposition prizes — just ask: 'sumimasen!')",
  },
  {
    name: "Gachapon Kaikan (Gashapon Department Store)",
    jp: "ガチャポン会館",
    city: "Tokyo",
    area: "Akihabara / Ikebukuro (Sunshine City has 3,000+ machines)",
    kind: "Gachapon",
    cost: "¥300–500/capsule",
    why: "Walls of hundreds of capsule machines: hyper-detailed animals, sushi keychains, tiny sitting salarymen, cats in hats. The greatest ¥400 dopamine system ever engineered.",
    protip: "Carry ¥100 coins like ammunition (change machines exist). The 'weird tier' (capybaras in onsen, kneeling businessmen) make the best omiyage — better than anything at the airport.",
  },
  {
    name: "Pokémon Center MEGA TOKYO & Shibuya",
    city: "Tokyo",
    area: "Ikebukuro Sunshine City / Shibuya Parco 6F",
    kind: "Character Store",
    cost: "¥500–6,000",
    why: "The mothership stores: exclusive plush, TCG walls, region-limited merch. Shibuya Parco's 6F also stacks Nintendo TOKYO, Capcom Store, and Jump Shop in one elevator ride — the densest nerd floor on Earth.",
    protip: "Scout Dec 16 (Shibuya), BUY Dec 28 (finale day) — luggage math. TCG releases sell out by 11am; if anyone collects, rope-drop it. Tax-free counter with passport.",
  },
  {
    name: "Nakano Broadway",
    jp: "中野ブロードウェイ",
    city: "Tokyo",
    area: "Nakano (5 min from Shinjuku)",
    kind: "Cards & Figures",
    cost: "Browsing free",
    why: "A 1966 shopping arcade colonized by ~30 Mandarake stores: vintage manga, cels, figures, watches, weird. Akihabara for people who think Akihabara sold out.",
    protip: "Strong Dec 28 split-squad option — 5 min from the Airbnb side of town. Basement has an 8-layer soft cream for the brave.",
  },
  {
    name: "Purikura at Calla / Moreru Mignon",
    jp: "プリクラ",
    city: "Tokyo",
    area: "Shibuya / Harajuku",
    kind: "Purikura",
    cost: "¥500–600/machine",
    why: "Japanese photo booths that auto-enlarge your eyes, erase your sins, and let 8 people decorate the result with airbrushed chaos. The single funniest 10 minutes available for ¥500.",
    protip: "All 8 in one booth is technically against capacity rules and spiritually mandatory. Machines assume you have eyelashes; the output is the trip's best group photo, fight me.",
  },
  {
    name: "Mandarake Complex",
    jp: "まんだらけ",
    city: "Tokyo",
    area: "Akihabara",
    kind: "Anime & Manga",
    cost: "¥100 manga to ¥100k cels",
    why: "Eight floors of secondhand everything-otaku. Buying used is how you find the 1998 thing you didn't know you needed.",
    protip: "Floor guide by genre is in English. Vintage Jump issues from your birth month: peak personalized souvenir, usually under ¥500.",
  },
  {
    name: "Den Den Town",
    jp: "でんでんタウン",
    city: "Osaka",
    area: "Nipponbashi (walkable from Namba Airbnb!)",
    kind: "Anime & Manga",
    cost: "Browsing free",
    why: "Osaka's Akihabara: retro game shops (Super Potato Osaka included), figure stores, card shops, maid cafés — 10 minutes' walk from where we sleep.",
    protip: "Dec 27 split-squad slot. Often cheaper than Akiba for the same retro carts — compare before Tokyo's final-day buys.",
  },
  {
    name: "Round1 Stadium",
    jp: "ラウンドワン",
    city: "Osaka",
    area: "Dotonbori / multiple",
    kind: "Arcade",
    cost: "¥100–300/play · Spo-Cha ~¥3,000/3h",
    why: "Arcade + bowling + karaoke towers; some have 'Spo-Cha' floors — all-you-can-play batting cages, basketball, roller skating, arcade, at 1am. Built for exactly our demographic.",
    protip: "Dotonbori Round1 till midnight+ is the Christmas-night overtime option after USJ. Spo-Cha for 8 is the best ¥3,000 in sports.",
  },
  {
    name: "Kyoto International Manga Museum",
    jp: "京都国際マンガミュージアム",
    city: "Kyoto",
    area: "Karasuma-Oike",
    kind: "Anime & Manga",
    cost: "¥1,200",
    why: "50,000 manga on open shelves in a converted elementary school — you sit and READ (huge English section). A former school yard full of people lying on grass reading comics.",
    protip: "Rainy-day Kyoto ace in the hole. 30 min is fun; 3 hours is easy. Closed Wednesdays.",
  },
  {
    name: "Yodobashi Camera / Bic Camera",
    city: "Tokyo",
    area: "Akihabara / Shinjuku / everywhere",
    kind: "Mega Store",
    cost: "Tax-free over ¥5,000",
    why: "Nine floors of every electronic object Japan makes, including a full floor of games/toys/gunpla. The toy floor of Yodobashi Akiba is an attraction, not a store.",
    protip: "Gunpla (Gundam models) are half US price here. Tax-free + passport. Check voltage on anything with a plug; game consoles are region-relevant.",
  },
];

export type CraneTip = { title: string; body: string };

export const CRANE_SCHOOL: CraneTip[] = [
  { title: "The machines are beatable, the operators are kind", body: "Staff want you to win (winners attract players). If a prize is wedged hopelessly, flag staff — 'sumimasen' + pointing — and they'll reposition it into a winnable spot. Use this every 2-3 attempts." },
  { title: "Play the placement, not the prize", body: "Scan the row: you're hunting prizes already hanging over the chute, balanced on edges, or in 'bridge' setups one nudge from falling. Walk past anything sitting flat in the center — that's a ¥3,000 donation." },
  { title: "Two-claw machines: push, don't grab", body: "Most UFO catchers can't lift the big plush — the winning move is using one claw arm to PUSH the box's high corner, walking it across the bridge rails over 3–5 plays. Watch the locals do it once." },
  { title: "Set the treaty limit", body: "¥1,000/person/session, enforced by the group. Pool the squad's budget on ONE good setup and share custody of the Snorlax. The house always wins against 8 separate egos." },
  { title: "Know the rhythm-game starter pack", body: "Taiko no Tatsujin (drums — instantly fun), maimai DX (the washing machine — pick Easy, become addicted), DDR (cardio), Chunithm (watch first). ¥100-200/play, two players side by side on most." },
];
