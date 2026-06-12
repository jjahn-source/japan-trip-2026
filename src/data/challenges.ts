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
    rules: "Each city: everyone pulls ONE mystery capsule ≤¥500. Group votes best & worst pull. Worst pull's owner must display it prominently (jacket, bag) until the next city.",
  },
  {
    title: "Crane Game Custody Battle",
    emoji: "🧸",
    sides: "The squad vs one (1) giant plush",
    rules: "Pooled ¥-budget per arcade night, one target prize. Whoever lands the winning play gets naming rights; custody rotates daily; it must appear in every group photo thereafter.",
  },
  {
    title: "Ekiben Iron Chef",
    emoji: "🍱",
    sides: "Every shinkansen leg",
    rules: "Everyone buys a DIFFERENT station bento, everyone tries everyone's. Beauty, value, taste scored. Buying the same one as someone else = automatic last place.",
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
];

export type Award = { name: string; emoji: string; criteria: string };

export const AWARDS_CEREMONY: Award[] = [
  { name: "MVP of the Trip", emoji: "🏆", criteria: "Most clutch human across 16 days — navigation saves, reservation snipes, morale carries. Voted at the farewell sukiyaki, Dec 28." },
  { name: "The Strong Zero Memorial Trophy", emoji: "🥫", criteria: "Most spectacular self-inflicted morning. Recipient must hold the trophy (an empty Strong Zero can) in the airport group photo." },
  { name: "Best Boy (Deer Division)", emoji: "🦌", criteria: "Calmest performance under deer-mugging conditions, Nara, Dec 23. Daniel is the presumed favorite; upsets welcome." },
  { name: "The Human Google Maps", emoji: "🗺️", criteria: "Fewest wrong station exits. Statistically impossible to win in Shinjuku; that's what makes it prestigious." },
  { name: "Iron Stomach", emoji: "🦾", criteria: "Total distinct foods eaten. Market organ skewers count double. Konbini items count single but infinitely." },
  { name: "Karaoke Heart of Gold", emoji: "🎤", criteria: "Not the best singer — the one who went hardest. Scream-crying 'Linda Linda' counts triple." },
  { name: "The Yamato Award for Logistics", emoji: "📦", criteria: "Best packing/shipping/luggage performance. Checked-bag-overflow heroes honored here." },
  { name: "Most Likely to Move to Japan", emoji: "🇯🇵", criteria: "Self-explanatory by Day 9. Watch for the one pricing Tokyo apartments 'as a joke.'" },
];

export type Ritual = { title: string; emoji: string; body: string };

export const DAILY_RITUALS: Ritual[] = [
  { title: "Morning konbini parliament", emoji: "🌅", body: "First 20 minutes of every day: konbini run + breakfast scoring + day's plan review on the walk. Attendance mandatory, pants optional at the Airbnb table." },
  { title: "Golden hour = phones up", emoji: "📸", body: "December sunset ~16:30. Wherever we are at 16:15, that's the photo op — the schedule is literally built around this. One group photo per day minimum, same pose, different city." },
  { title: "The 21:00 audible window", emoji: "🎲", body: "Every night at 21:00, anyone can call an audible from the day's 'Audibles' list (see each itinerary day). Majority vote, loser-faction grumbles permitted for 5 minutes max." },
  { title: "One unknown thing per day", emoji: "❓", body: "Everyone orders/buys/does ONE thing per day they can't identify or haven't planned. The trip rule that produces 80% of the stories." },
  { title: "Lights-out treaty", emoji: "😴", body: "Whatever the night was, walking shoes on by 9:00 next morning (10:00 after karaoke nights). The itinerary is the boss. The itinerary is merciful but firm." },
  { title: "Nightly damage report", emoji: "💸", body: "Splitwise updated before bed by that day's designated wallet. 3 minutes nightly beats 3 hours of forensic accounting at RDU." },
];
