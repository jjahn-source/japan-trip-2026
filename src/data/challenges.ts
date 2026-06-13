// The boredom-proofing layer: standing competitions, bingo, awards, rituals.

export type Faction = {
  title: string;
  emoji: string;
  sides: string;
  rules: string;
};

export const FACTION_WARS: Faction[] = [
  {
    title: "The Chicken War",
    emoji: "🍗",
    sides: "Famichiki (FamilyMart) vs Karaage-kun (Lawson)",
    rules: "Declare allegiance Day 2 breakfast. Blind taste-off final on Dec 29 morning settles it forever. Traitors who switch sides buy a round.",
  },
  {
    title: "Konbini Cold War",
    emoji: "🏪",
    sides: "7-Eleven vs Lawson vs FamilyMart",
    rules: "Running score: each guy rates every konbini meal /10 in the group chat. Highest chain average at trip's end gets named in the group chat title for a year.",
  },
  {
    title: "The Ramen Power Rankings",
    emoji: "🍜",
    sides: "Every bowl anyone eats, all 16 days",
    rules: "Shared note: shop, style, score /10, one-line review. Minimum 8 entries per person or you can't vote in the final ranking. Winner's shop gets revisited if geography allows.",
  },
  {
    title: "Gachapon Roulette",
    emoji: "🎰",
    sides: "Everyone vs the machines",
    rules: "Each city: everyone pulls ONE mystery capsule ≤$3 (¥500). Group votes best & worst pull. Worst pull's owner must display it prominently (jacket, bag) until the next city.",
  },
  {
    title: "Crane Game Custody Battle",
    emoji: "🧸",
    sides: "The squad vs one (1) giant plush",
    rules: "Pooled budget ($6/¥1,000 a man) per arcade night, one target prize. Whoever lands the winning play gets naming rights; custody rotates daily; it must appear in every group photo thereafter.",
  },
  {
    title: "Ekiben Iron Chef",
    emoji: "🍱",
    sides: "Every shinkansen leg",
    rules: "Everyone buys a DIFFERENT station bento, everyone tries everyone's. Beauty, value, taste scored. Buying the same one as someone else = automatic last place.",
  },
  {
    title: "The Vending Machine Lottery",
    emoji: "🥤",
    sides: "Everyone vs Japan's 4 million vending machines",
    rules: "Daily mandate: buy one drink you cannot read and have never seen, ≤$2.50 (¥400). Hot-can coffee, mystery 'Pocari', Boss, whatever's glowing. Rate it /10 in the chat. December bonus: the machine has a HOT row now — a warm can in a freezing dawn scores +2. Worst drink of the trip earns a commemorative empty can on the shelf.",
  },
  {
    title: "Strong Zero Survivor",
    emoji: "🥫",
    sides: "Every man vs the 9% konbini chuhai",
    rules: "Not a drinking contest — a SURVIVAL contest. Points for finishing a Strong Zero AND making the 9:00 walking-shoes treaty the next morning intact. Negative points for the can that ends a man's night before 22:00. Feeds directly into the Strong Zero Memorial Trophy.",
  },
  {
    title: "Oyster & Crab Count",
    emoji: "🦪",
    sides: "Everyone vs December's peak seafood season",
    rules: "It's winter — oyster season on Miyajima and crab season across Kansai are at their absolute peak. Tally every oyster (grilled, fried, raw) and every crab leg consumed across 16 days. Hiroshima Dec 26 is the oyster motherlode; a kani course in Osaka is the crab end-game. Highest combined shell-count is honored at the awards.",
  },
  {
    title: "The Onsen Endurance League",
    emoji: "♨️",
    sides: "Every man vs the heat (and the cold plunge)",
    rules: "Sento and onsen only. Points for completing the hot→cold-plunge→hot cycle, bonus for the December rotenburo (outdoor bath, steam vs near-freezing air). The Funaoka electric bath in Kyoto is the boss fight — 30 seconds is legend, anything more is suspicious. Tattooed crew: private kashikiri counts full points.",
  },
  {
    title: "Lost in Translation Cup",
    emoji: "🗣️",
    sides: "Every man vs his own Japanese",
    rules: "Log every successful all-Japanese interaction — ordering, asking directions, paying a compliment to a shop grandma. Style points for keigo attempts, deductions for defaulting to pointing-and-'this one'. The man who orders the whole table's yakiniku in Japanese on Dec 28 wins outright.",
  },
];

export type BingoSquare = { text: string; hard?: boolean };

export const TRIP_BINGO: BingoSquare[] = [
  { text: "See Mt. Fuji with zero clouds" },
  { text: "Get bowed to by a Nara deer (and bow back)" },
  { text: "Successfully use 3 Japanese phrases in one interaction" },
  { text: "Win a crane game prize", hard: true },
  { text: "Eat something you cannot identify, finish it" },
  { text: "Perfect score line on karaoke", hard: true },
  { text: "Survive the Funaoka electric bath 30 seconds", hard: true },
  { text: "Befriend a stranger at a standing bar" },
  { text: "Catch the train with <60 seconds to spare" },
  { text: "Vending machine drink you've never seen before" },
  { text: "Spot a geiko/maiko in Gion (respectfully, from distance)" },
  { text: "Eat 5 different things at one market in one hour" },
  { text: "Get a purikura photo with all 8 in frame" },
  { text: "Find a gachapon weirder than 'salaryman cat'" },
  { text: "Onsen → cold air → onsen cycle ×3" },
  { text: "Order for the whole table in Japanese", hard: true },
  { text: "100% the konbini breakfast (sando + onigiri + coffee + hot snack)" },
  { text: "See snow in Japan", hard: true },
  { text: "Slurp ramen loud enough to feel proud" },
  { text: "Get personally thanked by a shop grandma" },
  { text: "Tower/observation deck at the exact sunset minute" },
  { text: "Make the last train by sprinting", hard: true },
  { text: "Find your birth-year manga/game in a retro shop" },
  { text: "Tell the Don Quijote song from memory by Dec 20 (curse)" },
  { text: "Stand inside the Great Buddha at Kamakura" },
  { text: "Catch Fuji over the ocean at Enoshima sunset", hard: true },
  { text: "Get a hot can of coffee from a vending machine before dawn" },
  { text: "Eat a fresh-grilled Miyajima oyster on the street" },
  { text: "See a city illumination / winter light-up at full dark" },
  { text: "Crawl through the enlightenment pillar at Todai-ji", hard: true },
  { text: "Finish a whole hoto / nabe hot pot in one sitting" },
  { text: "Successfully tap through a fare gate without getting stopped" },
  { text: "Take a purikura at least three times in one trip" },
  { text: "Eat a konbini oden item on a freezing night" },
  { text: "Bow correctly at a shrine (two bows, two claps, one bow)" },
  { text: "Win Spo-Cha at Round1 (any sport, any margin)" },
  { text: "Try a Strong Zero AND make the 9:00 treaty next morning", hard: true },
  { text: "Spot Fuji from a moving train window" },
  { text: "Get an omikuji fortune and tie up the bad one" },
  { text: "Eat momiji-manju fresh and hot off the press" },
  { text: "Survive a December outdoor rotenburo (steam vs frost)" },
  { text: "Beat a crew member at a rhythm game in front of locals", hard: true },
  { text: "Buy a tax-free haul over $31 with passport" },
  { text: "Hold a fried maple leaf (momiji tempura) at Minoo / a festival" },
  { text: "Take the whole crew to a standing sushi or kaiten belt" },
  { text: "See your breath inside a temple at dawn opening", hard: true },
  { text: "Down a crab leg in Osaka crab season" },
];

export type Award = { name: string; emoji: string; criteria: string };

export const AWARDS_CEREMONY: Award[] = [
  { name: "MVP of the Trip", emoji: "🏆", criteria: "Most clutch human across 16 days — navigation saves, reservation snipes, morale carries. Voted at the farewell yakiniku in Osaka, Dec 28." },
  { name: "The Strong Zero Memorial Trophy", emoji: "🥫", criteria: "Most spectacular self-inflicted morning. Recipient must hold the trophy (an empty Strong Zero can) in the airport group photo." },
  { name: "Best Boy (Deer Division)", emoji: "🦌", criteria: "Calmest performance under deer-mugging conditions, Nara, Dec 23. Daniel is the presumed favorite; upsets welcome." },
  { name: "The Human Google Maps", emoji: "🗺️", criteria: "Fewest wrong station exits. Statistically impossible to win in Shinjuku; that's what makes it prestigious." },
  { name: "Iron Stomach", emoji: "🦾", criteria: "Total distinct foods eaten. Market organ skewers count double. Konbini items count single but infinitely." },
  { name: "Karaoke Heart of Gold", emoji: "🎤", criteria: "Not the best singer — the one who went hardest. Scream-crying 'Linda Linda' counts triple." },
  { name: "The Yamato Award for Logistics", emoji: "📦", criteria: "Best packing/shipping/luggage performance. Checked-bag-overflow heroes honored here." },
  { name: "Most Likely to Move to Japan", emoji: "🇯🇵", criteria: "Self-explanatory by Day 9. Watch for the one pricing Tokyo apartments 'as a joke.'" },
  { name: "The Golden Claw", emoji: "🕹️", criteria: "Crane-game lifetime achievement across 16 days. Total prizes won vs total dollars sunk — efficiency matters. The man who lands the pooled giant plush gets an automatic nomination and naming rights to the trophy beast." },
  { name: "Oyster King / Crab Lord", emoji: "🦪", criteria: "Highest combined December shellfish count (oysters + crab legs). Miyajima Dec 26 and the Osaka kani course are the qualifying rounds. Shucking your own counts double; getting tonbi-mugged of one on the Enoshima coast counts minus one." },
  { name: "The Fuji Whisperer", emoji: "🗻", criteria: "Most distinct clear Fuji sightings logged with photo proof — ocean (Enoshima), lake (Kawaguchiko), train window, tower, all count once each. December clarity makes this winnable; cloud cover makes it cruel." },
  { name: "The Polar Bear", emoji: "🧊", criteria: "Best cold-tolerance performance: dawn temple openings, December rotenburo, the Funaoka electric bath, refusing to complain about near-freezing mornings. The man who wears shorts past Dec 20 is disqualified for being a menace, not a hero." },
  { name: "The Konbini Sommelier", emoji: "🍙", criteria: "Most refined konbini palate per the running scores — the one whose meal picks the crew actually copies. Bonus for discovering the season's best winter hot-snack before anyone else." },
  { name: "The Negotiator", emoji: "🗣️", criteria: "Most successful all-Japanese interactions, per the Lost in Translation Cup log. Reservation snipes, grandma compliments, and ordering for the table all count. Keigo attempts judged generously." },
  { name: "The Curse-Bearer", emoji: "🎵", criteria: "The man most visibly broken by the Don Quijote jingle — humming it unprompted, waking up to it, hearing it in the shinkansen rumble. There is no escaping the Donpen song. Carry it with dignity." },
];

export type Ritual = { title: string; emoji: string; body: string };

export const DAILY_RITUALS: Ritual[] = [
  { title: "Morning konbini parliament", emoji: "🌅", body: "First 20 minutes of every day: konbini run + breakfast scoring + day's plan review on the walk. Attendance mandatory, pants optional at the Airbnb table." },
  { title: "Golden hour = phones up", emoji: "📸", body: "December sunset ~16:30. Wherever we are at 16:15, that's the photo op — the schedule is literally built around this. One group photo per day minimum, same pose, different city." },
  { title: "The 21:00 audible window", emoji: "🎲", body: "Every night at 21:00, anyone can call an audible from the day's 'Audibles' list (see each itinerary day). Majority vote, loser-faction grumbles permitted for 5 minutes max." },
  { title: "One unknown thing per day", emoji: "❓", body: "Everyone orders/buys/does ONE thing per day they can't identify or haven't planned. The trip rule that produces 80% of the stories." },
  { title: "Lights-out treaty", emoji: "😴", body: "Whatever the night was, walking shoes on by 9:00 next morning (10:00 after karaoke nights). The itinerary is the boss. The itinerary is merciful but firm." },
  { title: "Nightly damage report", emoji: "💸", body: "Splitwise updated before bed by that day's designated wallet. 3 minutes nightly beats 3 hours of forensic accounting at RDU." },
  { title: "The IC card top-up check", emoji: "🎫", body: "No rail pass on this trip — everything runs on Suica/PASMO/ICOCA tapped point-to-point. Last thing every night: anyone under ~$10 (¥1,500) on their card tops up at the konbini or station machine so no one's the guy holding up the gate at 7am. Big shinkansen legs (Hiroshima, Himeji) get booked separately on SmartEX." },
  { title: "Layer parliament", emoji: "🧥", body: "December check before walking out: base layer, the temps (near-freezing dawns, ~16:30 sunset, mountain days like Nikko/Koyasan run 5–8°C colder than the city), and whether it's a heat-tech-and-gloves day or just a jacket day. The man who under-dresses for a temple-at-dawn opening suffers alone." },
  { title: "Sunset-spot scouting", emoji: "🌇", body: "Because sunset is ~16:30, the day's golden-hour location gets named at morning konbini parliament — tower, beach, temple terrace, harbor. On Fuji days (Enoshima, Kawaguchiko) the whole afternoon bends toward being in position by 16:10. Miss it and you wait 24 hours for the next one." },
  { title: "The one-unknown-food log", emoji: "🍢", body: "Tie-in to the bingo and the Iron Stomach award: the day's mystery food (market skewer, konbini hot-snack, vending-machine drink, festival oddity) gets photographed and rated in the chat. December specials — oden, nikuman, hot canned coffee, oyster everything — count toward the seasonal seafood tallies too." },
  { title: "Luggage-forward foresight", emoji: "📦", body: "On moving days (Tokyo→Kyoto Dec 21, Kyoto→Osaka Dec 24), bags go ahead by Yamato takkyubin from the morning konbini parliament onward, so day trips like Uji+Nintendo or Kamakura run as light day-bag affairs. Big otaku buys wait for Osaka week to dodge a week of hauling." },
];
