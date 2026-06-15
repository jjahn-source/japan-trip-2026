export type Contingency = {
  date: string; // ISO date
  day: number;
  location: string;
  rainPlan: string[];
  energySlumpPlan: string[];
  lastMinuteCancellation: string[];
};

export const CONTINGENCIES: Contingency[] = [
  {
    date: "2026-12-15",
    day: 1,
    location: "Tokyo",
    rainPlan: [
      "Senso-ji (covered shopping arcade = rain-proof)",
      "Tokyo National Museum (indoor, samurai armor/swords)",
      "teamLab Planets (fully indoor, 2h immersive)",
      "Department store food halls (Isetan, Mitsubishi)",
      "Akihabara arcades (GiGO, multiple floors indoor)",
    ],
    energySlumpPlan: [
      "Day 1 jet lag = plan early bedtime anyway",
      "Skip evening plans. Dinner at konbini, 22:00 lights out",
      "Jet lag is normal. Don't force activities.",
    ],
    lastMinuteCancellation: [
      "Ghibli sold out? Arashiyama Bamboo (outdoor, no reservation)",
      "Sumo stable cancelled? Ryogoku Edo-Tokyo Museum (indoor)",
    ],
  },
  {
    date: "2026-12-21",
    day: 7,
    location: "Kyoto",
    rainPlan: [
      "Kinkaku-ji in rain is actually stunning (moody gold pavilion)",
      "Kinpusen-ji (huge wooden hall, covered)",
      "Kyoto National Museum (samurai robes, pottery)",
      "Covered shopping: Takashimaya, Daimaru department stores",
      "Gion Geisha Museum (indoor, geisha performance)",
    ],
    energySlumpPlan: [
      "Kyoto day 1 = lighter schedule. One temple max.",
      "Afternoon onsen (rotenburo in rain = magical)",
      "Early dinner, explore Gion alleys at dusk",
    ],
    lastMinuteCancellation: [
      "Temple closed? Philosopher's Path is still walkable (covered gates)",
      "Market cancelled? Indoor Nishiki Market (food hall)",
    ],
  },
  {
    date: "2026-12-25",
    day: 11,
    location: "Hiroshima",
    rainPlan: [
      "Hiroshima Peace Museum (indoor, essential experience)",
      "Hiroshima Castle interior (covered)",
      "Mitaki-dera waterfall is actually beautiful in rain/mist",
      "Okonomiyaki museum + cooking demo (indoor)",
      "Streetside okonomiyaki (covered counters in Okonomimura)",
    ],
    energySlumpPlan: [
      "Dec 25 = day is emotionally heavy anyway",
      "Peace Museum takes 3–4h; that's enough for the day",
      "Dinner: hot pot (nabe) in the Airbnb or local restaurant",
    ],
    lastMinuteCancellation: [
      "Miyajima too crowded/rainy? Skip it, double down on Peace Museum",
      "Ferry cancelled? Onomichi day trip (1h away, alt route)",
    ],
  },
  {
    date: "2026-12-28",
    day: 15,
    location: "Tokyo (return)",
    rainPlan: [
      "Last-minute shopping: Don Quijote (massive indoor, multi-floor)",
      "Shibuya 109 shopping center (indoor, 8 floors)",
      "teamLab Borderless (if you skipped it before)",
      "Tokyo Station indoor shopping (GRANSTA, Kurette)",
      "Roppongi Hills (indoor mall + Mori Art Museum)",
    ],
    energySlumpPlan: [
      "Dec 28 = pack day anyway, not activity day",
      "Low-key: late breakfast, laundry, shopping, dinner",
      "Early night: flight is Dec 29 morning",
    ],
    lastMinuteCancellation: [
      "Nothing is really cancelled on Dec 28",
      "This is buffer day — embrace it",
    ],
  },
];

export type CrewMember = {
  name: string;
  role: string;
  responsibilities: string[];
  backups: string[]; // Who backs them up if they're tired/sick
};

export const CREW_ROLES: CrewMember[] = [
  {
    name: "Navigator",
    role: "Route planner, Google Maps master, train expert",
    responsibilities: [
      "Read Google Maps before each move",
      "Know which train line, platform number",
      "Check last train time by 22:00 each night",
      "Call out navigation updates to the group",
    ],
    backups: ["Timekeeper"],
  },
  {
    name: "CFO",
    role: "Money handler, budget tracker",
    responsibilities: [
      "Collect cash/split from the group",
      "Track Splitwise entries daily by 21:00",
      "Know remaining budget vs actual spend",
      "Point out if someone's overrunning",
    ],
    backups: ["Translator"],
  },
  {
    name: "Food Scout",
    role: "Restaurant picker, reservation requester",
    responsibilities: [
      "Find restaurants 3–5 days before eating",
      "Make TableCheck/phone reservations",
      "Confirm reservations 24h before",
      "Route to restaurant + ETA to group",
    ],
    backups: ["Translator"],
  },
  {
    name: "Translator",
    role: "Language + cultural bridge",
    responsibilities: [
      "Know polite Japanese phrases",
      "Help with menu translations",
      "Explain customs (shoes-off, onsen rules, etc.)",
      "Interface with non-English speakers (hosts, restaurants)",
    ],
    backups: ["Navigator"],
  },
  {
    name: "Photo Lead",
    role: "Group photo documentation",
    responsibilities: [
      "Sunset group photo daily (same pose, different city)",
      "Capture key moments for the trip recap",
      "Edit/share photos in group chat weekly",
      "Backup: ensure 3 copies of best photos",
    ],
    backups: ["Morale"],
  },
  {
    name: "Logistics",
    role: "Luggage + Yamato coordination",
    responsibilities: [
      "Arrange Yamato pickup/delivery",
      "Know luggage ETA to next Airbnb",
      "Confirm addresses in Japanese with hosts",
      "Pack/unpack suitcases on travel days",
    ],
    backups: ["Navigator"],
  },
  {
    name: "Timekeeper",
    role: "Schedule enforcer, wake-up caller",
    responsibilities: [
      "Know what time we're leaving each morning",
      "Set alarms, call out departure times",
      "Monitor if anyone's lagging (temples close at 16:00)",
      "Last-train reminder by 22:30",
    ],
    backups: ["Navigator"],
  },
  {
    name: "Morale",
    role: "Crew health monitor",
    responsibilities: [
      "Check in: \"How are you actually feeling?\"",
      "Suggest rest if someone's cooked",
      "Find konbini breaks / onsen when needed",
      "Lead spontaneous joy (random bars, karaoke)",
    ],
    backups: ["Food Scout"],
  },
];
