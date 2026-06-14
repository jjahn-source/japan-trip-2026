// The Crew Doctrines — standing orders for a platoon of 8. Collected from the
// scattered "doctrine" callouts across the app and codified into one rulebook.
// Severity: LAW = non-negotiable; STRONG = break it and you owe a round; FLEX = vibes.

export type Severity = "LAW" | "STRONG" | "FLEX";

export type Doctrine = {
  code: string;
  emoji: string;
  title: string;
  law: string;
  severity: Severity;
};

export const DOCTRINES: Doctrine[] = [
  {
    code: "D-01",
    emoji: "💧",
    title: "Hydration Doctrine",
    law: "Every man buys a Pocari Sweat or water at the LAST konbini before home. The 9% Strong Zero tallboys tax tomorrow's itinerary at 100% interest, and the itinerary always collects. Non-negotiable.",
    severity: "LAW",
  },
  {
    code: "D-02",
    emoji: "😴",
    title: "Jet-Lag Doctrine",
    law: "Days 1–2: NO naps after landing. Caffeine, sunlight, walk, sleep at 22:00 local. You'll wake at 5am anyway — that's literally what the dawn temple visits are for. The man who naps 'for 20 minutes' on Day 1 is cooked for three days.",
    severity: "LAW",
  },
  {
    code: "D-03",
    emoji: "🚃",
    title: "Last-Train Doctrine",
    law: "Trains die ~00:00–00:30 and resurrect ~05:00. Either make the last train, split a taxi, or commit fully to asa-kaeri (home at dawn) with karaoke/24h-onsen as the bivouac. There is no in-between. 'I'll figure it out' is how a man ends up in Saitama.",
    severity: "LAW",
  },
  {
    code: "D-04",
    emoji: "📲",
    title: "IC Card Top-Up Doctrine",
    law: "No rail pass on this trip — everything runs on Suica/PASMO/ICOCA tapped point-to-point. Last thing every night: anyone under ~$10 (¥1,500) tops up. Nobody is the guy holding up the 7am gate with a red error beep and eight people behind him.",
    severity: "LAW",
  },
  {
    code: "D-05",
    emoji: "🪖",
    title: "Squad-Split Doctrine",
    law: "Tiny-bar districts physically cannot seat 8. Default to 2–3 man cells, live location ON, one pinned regroup point + time. The stories at breakfast are better this way anyway. Lone wolves get adopted by a cell — nobody drinks solo in Golden Gai.",
    severity: "STRONG",
  },
  {
    code: "D-06",
    emoji: "🍻",
    title: "Pour-For-Each-Other Doctrine",
    law: "Never pour your own sake or beer in a group — fill your neighbor's glass, they fill yours, two hands on the bottle. It's the single fastest way eight loud foreigners earn a nod from the next table. 'Kanpai' before the first sip, every time.",
    severity: "STRONG",
  },
  {
    code: "D-07",
    emoji: "🧳",
    title: "Coin-Locker Doctrine",
    law: "On day trips and travel days, bags go in a station coin locker (or ahead via Yamato) BEFORE the fun starts. Nobody hauls a suitcase up a temple hill or through a deer mob. Luggage moves exactly twice all trip; the rest is daypacks.",
    severity: "STRONG",
  },
  {
    code: "D-08",
    emoji: "📦",
    title: "Yamato Forward Doctrine",
    law: "Big suitcases ship Tokyo→Osaka by takkyubin (~$16/¥2,500/bag) on the morning we leave Tokyo — they beat us to the Osaka Airbnb. Kyoto is a daypack-only city. Big otaku purchases wait for Osaka week to dodge a week of hauling.",
    severity: "STRONG",
  },
  {
    code: "D-09",
    emoji: "📸",
    title: "Golden-Hour Doctrine",
    law: "December sunset is ~16:30. Wherever we are at 16:15 is the photo op — the whole schedule bends toward being in position. One group photo per day minimum, same pose, different city. The streak is sacred; it completes at the airport gate, Dec 29.",
    severity: "STRONG",
  },
  {
    code: "D-10",
    emoji: "💸",
    title: "Nightly Damage-Report Doctrine",
    law: "Splitwise updated before bed by the day's designated wallet. Three minutes nightly beats three hours of forensic accounting at RDU. Settle in yen. The CFO of the group chat is watching.",
    severity: "LAW",
  },
  {
    code: "D-11",
    emoji: "❓",
    title: "One-Unknown-Per-Day Doctrine",
    law: "Everyone orders/buys/does ONE thing per day they can't identify or didn't plan — a mystery skewer, an unreadable vending-machine can, a bar with no English sign. The rule that produces 80% of the stories. Photograph it, rate it in the chat.",
    severity: "FLEX",
  },
  {
    code: "D-12",
    emoji: "🧥",
    title: "Layer-Parliament Doctrine",
    law: "Pre-departure check every morning: base layer, the day's temps (near-freezing dawns, mountain days run 5–8°C colder than the city), gloves-or-not. The man who under-dresses for a dawn temple opening suffers alone and earns no sympathy.",
    severity: "FLEX",
  },
  {
    code: "D-13",
    emoji: "📥",
    title: "Pre-Download Doctrine",
    law: "Before the 14-hour flight: offline Google Maps (Tokyo/Kyoto/Osaka), a Japanese keyboard, Visit Japan Web QR screenshots, and the watch-list (Shōgun, Tokyo Vice, Jiro, Lost in Translation). Do not trust airport WiFi at the exact moment 400 people need it.",
    severity: "STRONG",
  },
  {
    code: "D-14",
    emoji: "🤫",
    title: "Inside-Voices-Outside Doctrine",
    law: "Street beers on an illumination walk = a Japanese pastime. Eight Americans at 95dB through a residential Kyoto lane at 1am = how neighborhoods get Airbnbs banned. Quiet on trains, phones on manner mode, no shouting in shotengai.",
    severity: "LAW",
  },
  {
    code: "D-15",
    emoji: "🗑️",
    title: "Carry-Your-Trash Doctrine",
    law: "Public bins basically don't exist. Everyone packs a small bag for trash and carries it until a konbini or home. No eating-while-walking except at festival stalls. Leave no trace; the country is immaculate for a reason.",
    severity: "STRONG",
  },
  {
    code: "D-16",
    emoji: "🧦",
    title: "Shoes-Off-Readiness Doctrine",
    law: "Temples, ryokan, izakaya, the Airbnb — shoes come off constantly. Wear slip-on-friendly footwear and socks WITHOUT holes. Everyone sees them. This is the single most preventable embarrassment of the trip.",
    severity: "STRONG",
  },
  {
    code: "D-17",
    emoji: "🛂",
    title: "Tax-Free Paperwork Doctrine",
    law: "Tax-free buys (over ~$31/¥5,000, passport required) ride in a sealed bag with receipts attached — customs CAN check on exit. Do the 10-minute organize the night before departure, not in a Dec 29 panic at Haneda.",
    severity: "FLEX",
  },
  {
    code: "D-18",
    emoji: "🌅",
    title: "Lights-Out Treaty",
    law: "Whatever the night was, walking shoes on by 9:00 the next morning (10:00 after karaoke nights). The itinerary is the boss. The itinerary is merciful but firm. Hangover loadout — Pocari + onigiri before bed, Ukon turmeric shot at the konbini register — is pre-positioned, not improvised.",
    severity: "LAW",
  },
];

export const DOCTRINE_PREAMBLE =
  "Eight people is a platoon, not a friend group. Platoons need doctrine. These are the standing orders — break a LAW and you're a liability; break a STRONG and you owe a round; FLEX is vibes. Memorize them on the plane.";
