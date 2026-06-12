export type Neighborhood = {
  name: string;
  jp: string;
  city: string;
  vibe: string;
  knownFor: string[];
  proTip: string;
};

export const NEIGHBORHOODS: Neighborhood[] = [
  // Tokyo
  {
    name: "Shinjuku",
    jp: "新宿",
    city: "Tokyo",
    vibe: "Neon maximalism — the Tokyo of your imagination",
    knownFor: ["World's busiest station (3.6M/day)", "Golden Gai & Omoide Yokocho", "Kabukicho nightlife", "Department store food basements"],
    proTip: "Learn ONE exit (the East). The station has 200+ — agreeing on 'meet at Shinjuku station' has ended friendships.",
  },
  {
    name: "Shibuya",
    jp: "渋谷",
    city: "Tokyo",
    vibe: "Youth culture HQ, scramble crossing, big-screen energy",
    knownFor: ["Scramble Crossing", "Shibuya Sky", "Center Gai nightlife", "Parco's Nintendo/Pokémon floor"],
    proTip: "The backstreets (Dogenzaka, Udagawacho) have the actual good restaurants — the crossing block itself is mostly chains.",
  },
  {
    name: "Harajuku / Omotesando",
    jp: "原宿・表参道",
    city: "Tokyo",
    vibe: "Teen chaos on one street, high-fashion calm on the next",
    knownFor: ["Takeshita Street", "Cat Street vintage", "Meiji Shrine next door", "Architecture flagship row"],
    proTip: "Do Meiji Shrine at 9am, Takeshita at 10 when shops open, escape down Cat Street before the noon crush.",
  },
  {
    name: "Asakusa",
    jp: "浅草",
    city: "Tokyo",
    vibe: "Old Edo — temples, rickshaws, craftsman shops",
    knownFor: ["Senso-ji", "Nakamise snacks", "Kappabashi kitchen street", "Sumida river Skytree views"],
    proTip: "Stay past 18:00 when tour groups vanish — lit-up Senso-ji with empty grounds is a different temple.",
  },
  {
    name: "Ginza",
    jp: "銀座",
    city: "Tokyo",
    vibe: "Polished luxury, depachika food halls, gallery quiet",
    knownFor: ["Uniqlo 12-floor flagship", "Itoya stationery (18 floors)", "Mitsukoshi food basement", "Kabuki-za theater"],
    proTip: "Weekend afternoons the main street closes to cars ('Pedestrian Paradise'). Depachika basements discount bento after 19:00.",
  },
  {
    name: "Akihabara",
    jp: "秋葉原",
    city: "Tokyo",
    vibe: "Anime, arcades, electronics — otaku ground zero",
    knownFor: ["Super Potato retro games", "Multi-floor arcades", "Gachapon halls", "Maid cafés"],
    proTip: "Arcades: floor 1 is crane games for tourists; rhythm games and retro cabinets live on floors 3+.",
  },
  {
    name: "Ueno / Yanaka",
    jp: "上野・谷中",
    city: "Tokyo",
    vibe: "Museums, market bustle, then suddenly old-town quiet",
    knownFor: ["Tokyo National Museum", "Ameyoko street market", "Yanaka Ginza", "Temple cats"],
    proTip: "Ameyoko under the train tracks sells everything from tuna to sneakers — best chaos in late December.",
  },
  // Kyoto
  {
    name: "Gion & Higashiyama",
    jp: "祇園・東山",
    city: "Kyoto",
    vibe: "Wooden teahouses, lantern light, geiko sightings",
    knownFor: ["Hanamikoji Street", "Shirakawa canal", "Kiyomizu-dera slopes", "Yasaka Shrine"],
    proTip: "The Sannenzaka/Ninenzaka lanes empty out after 17:00 — sunset-to-dusk here beats any daytime visit.",
  },
  {
    name: "Downtown Kyoto (Kawaramachi)",
    jp: "河原町",
    city: "Kyoto",
    vibe: "Where Kyoto actually eats and shops",
    knownFor: ["Nishiki Market", "Pontocho Alley", "Teramachi arcades", "Kamo riverbank"],
    proTip: "Pontocho looks expensive but has plenty of ¥3-4k izakaya — look for picture menus on the north end.",
  },
  {
    name: "Arashiyama",
    jp: "嵐山",
    city: "Kyoto",
    vibe: "River, bamboo, mountains — Kyoto's scenic west edge",
    knownFor: ["Bamboo Grove", "Togetsukyo Bridge", "Monkey Park", "%Arabica coffee"],
    proTip: "Everything closes early (~17:00). Go at dawn, be done by 14:00, head back for downtown evening.",
  },
  {
    name: "Kyoto Station South (Fushimi)",
    jp: "伏見",
    city: "Kyoto",
    vibe: "Torii gates and sake breweries",
    knownFor: ["Fushimi Inari", "Sake district tastings", "Tofuku-ji"],
    proTip: "Fushimi's sake breweries (Gekkeikan museum, ¥600 with tasting) are 10 min from the shrine and nobody goes.",
  },
  // Osaka
  {
    name: "Namba / Dotonbori",
    jp: "難波・道頓堀",
    city: "Osaka",
    vibe: "Neon, noise, and the best street food in Japan",
    knownFor: ["Glico sign", "Hozenji Yokocho alley", "Kuromon market", "Den Den Town"],
    proTip: "Hozenji Yokocho — one alley south of the chaos — is a stone-paved pocket of tiny bars around a moss-covered Buddha. Magic.",
  },
  {
    name: "Umeda / Kita",
    jp: "梅田",
    city: "Osaka",
    vibe: "Skyscrapers, mega-malls, underground labyrinths",
    knownFor: ["Umeda Sky Building", "Grand Front dining", "Whisky bars", "HEP FIVE red ferris wheel"],
    proTip: "Umeda's underground city is genuinely maze-tier. Navigate by department store names, not compass directions.",
  },
  {
    name: "Shinsekai / Tennoji",
    jp: "新世界・天王寺",
    city: "Osaka",
    vibe: "Retro grit, kushikatsu, working-class soul",
    knownFor: ["Tsutenkaku tower", "Daruma kushikatsu", "Spa World", "Abeno Harukas (300m tower)"],
    proTip: "Janjan Yokocho alley has the cheapest, most local kushikatsu counters — half Daruma's price, same oil-crisped joy.",
  },
];
