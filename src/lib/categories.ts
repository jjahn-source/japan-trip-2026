// What people look for, in one table that both the build (scripts/places.mjs, which packs the places
// near every stop) and the search box read: the words that ask for it (EN + JA), the TREK Places
// categories that answer it, and the OpenStreetMap tags that answer it. Because the same selectors
// write the Overpass query and classify what comes back, a place in the pack is in a category exactly
// when Overpass would have returned it for that category.
export interface Cat {
  key: string; label: string; words: RegExp;
  /** Text query for the TREK index when it has no category for this (ramen, karaoke…). */
  trekQ?: string;
  /** TREK Places (Overture) categories, for /v1/nearby and for classifying index hits. */
  trekCats?: string[];
  /** Overpass selectors, ANDed within a string, ORed across strings. */
  osm?: string[];
  /** A daily need rather than a sight: walking distance outranks fame. */
  need?: boolean;
}

export const CATS: Cat[] = [
  { key: 'ramen', label: 'Ramen', words: /\b(ramen|tsukemen|abura ?soba|tonkotsu)\b|ラーメン|らーめん|つけ麺/, trekQ: 'ramen', trekCats: ['ramen_restaurant'], osm: ['["cuisine"~"ramen"]'] },
  { key: 'sushi', label: 'Sushi', words: /\b(sushi|kaitenzushi|kaiten|conveyor sushi|sashimi)\b|寿司|鮨|すし/, trekQ: 'sushi', trekCats: ['sushi_restaurant'], osm: ['["cuisine"~"sushi"]'] },
  { key: 'izakaya', label: 'Izakaya', words: /\b(izakaya|tachinomi|standing bar)\b|居酒屋|立ち飲み/, trekQ: 'izakaya', osm: ['["cuisine"~"izakaya"]', '["amenity"="pub"]'] },
  { key: 'yakitori', label: 'Yakitori', words: /\b(yakitori|kushiyaki)\b|焼鳥|焼き鳥/, trekQ: 'yakitori', osm: ['["cuisine"~"yakitori"]'] },
  { key: 'yakiniku', label: 'Yakiniku / wagyu', words: /\b(yakiniku|wagyu|bbq|korean bbq|kobe beef)\b|焼肉/, trekQ: 'yakiniku', osm: ['["cuisine"~"yakiniku|barbecue|korean"]'] },
  { key: 'okonomiyaki', label: 'Okonomiyaki', words: /\b(okonomiyaki|monja(yaki)?|takoyaki)\b|お好み焼|たこ焼|もんじゃ/, trekQ: 'okonomiyaki', osm: ['["cuisine"~"okonomiyaki|takoyaki|monja"]'] },
  { key: 'noodles', label: 'Udon / soba', words: /\b(udon|soba|noodles?)\b|うどん|そば|蕎麦/, trekQ: 'udon', osm: ['["cuisine"~"udon|soba|noodle"]'] },
  { key: 'katsu', label: 'Tonkatsu', words: /\b(tonkatsu|katsu|kushikatsu|kushiage)\b|とんかつ|串カツ/, trekQ: 'tonkatsu', osm: ['["cuisine"~"tonkatsu|katsu|kushikatsu"]'] },
  { key: 'tempura', label: 'Tempura', words: /\btempura\b|天ぷら/, trekQ: 'tempura', osm: ['["cuisine"~"tempura"]'] },
  { key: 'curry', label: 'Curry', words: /\bcurry\b|カレー/, trekQ: 'curry', osm: ['["cuisine"~"curry|indian"]'] },
  { key: 'cafe', label: 'Cafés', words: /\b(cafe|café|cafés|cafes|coffee|kissaten|latte|espresso)\b|喫茶|カフェ|コーヒー/, trekCats: ['coffee_shop', 'cafe'], osm: ['["amenity"="cafe"]'] },
  { key: 'sweets', label: 'Sweets', words: /\b(sweets|desserts?|bakery|bakeries|cakes?|parfaits?|crepes?|ice cream|mochi|matcha|pancakes?)\b|スイーツ|パン屋|和菓子/, trekCats: ['bakery', 'dessert_shop', 'ice_cream_shop'], osm: ['["shop"~"^(bakery|confectionery|pastry)$"]', '["amenity"="ice_cream"]'] },
  { key: 'food', label: 'Food', words: /\b(food|eat|eats|restaurants?|lunch|dinner|breakfast|brunch|hungry|meal)\b|食事|レストラン|ご飯/, trekCats: ['restaurant', 'japanese_restaurant', 'casual_eatery', 'fast_food'], osm: ['["amenity"~"^(restaurant|fast_food|food_court)$"]'] },
  { key: 'bar', label: 'Bars', words: /\b(bars?|pubs?|drinks?|drinking|cocktails?|whisk(e)?y|beers?|sake|highball|nightlife|booze)\b|バー|飲み屋/, trekCats: ['bar', 'pub', 'cocktail_bar', 'beer_bar', 'sake_bar', 'wine_bar', 'lounge'], osm: ['["amenity"~"^(bar|pub|biergarten)$"]'] },
  { key: 'club', label: 'Clubs', words: /\b(clubs?|clubbing|night ?clubs?|dancing|dance)\b|クラブ/, trekCats: ['dance_club'], osm: ['["amenity"="nightclub"]'] },
  { key: 'karaoke', label: 'Karaoke', words: /\b(karaoke|big echo|manekineko|jankara)\b|カラオケ/, trekQ: 'karaoke', trekCats: ['karaoke'], osm: ['["amenity"="karaoke_box"]', '["leisure"="karaoke"]'] },
  { key: 'arcade', label: 'Arcades', words: /\b(arcades?|game cent(er|re)s?|ufo catchers?|crane games?|gacha|purikura|round ?1|round one|taito|gigo)\b|ゲーセン|ゲームセンター|ラウンドワン/, trekCats: ['arcade'], osm: ['["leisure"="amusement_arcade"]', '["name"~"ROUND1|ラウンドワン|Round1",i]'] },
  { key: 'onsen', label: 'Onsen / sentō', words: /\b(onsen|sento|sentō|bath(house)?s?|spa|saunas?)\b|温泉|銭湯|サウナ/, trekCats: ['public_bath', 'onsen'], osm: ['["amenity"="public_bath"]', '["leisure"="sauna"]'] },
  { key: 'shrine', label: 'Shrines', words: /\b(shrines?|jinja|taisha)\b|神社|大社/, osm: ['["amenity"="place_of_worship"]["religion"="shinto"]'] },
  { key: 'temple', label: 'Temples', words: /\btemples?\b|寺/, osm: ['["amenity"="place_of_worship"]["religion"="buddhist"]'] },
  { key: 'park', label: 'Parks', words: /\b(parks?|gardens?)\b|公園|庭園/, trekCats: ['park', 'garden'], osm: ['["leisure"~"^(park|garden)$"]["name"]'] },
  { key: 'museum', label: 'Museums', words: /\b(museums?|galler(y|ies)|exhibitions?)\b|美術館|博物館/, trekCats: ['museum', 'art_gallery'], osm: ['["tourism"~"^(museum|gallery)$"]'] },
  { key: 'view', label: 'Views', words: /\b(view(point)?s?|observation( deck)?|observatory|skyline|lookout|rooftop)\b|展望/, osm: ['["tourism"="viewpoint"]'] },
  { key: 'sight', label: 'Sights', words: /\b(sights?|sightseeing|attractions?|landmarks?|things to do)\b|観光/, osm: ['["tourism"~"^(attraction|theme_park|zoo|aquarium)$"]["name"]'] },
  { key: 'shopping', label: 'Shopping', words: /\b(shopping|malls?|department stores?|depachika|depato)\b|デパート|百貨店/, trekCats: ['department_store', 'shopping_center'], osm: ['["shop"~"^(department_store|mall)$"]'] },
  { key: 'anime', label: 'Anime / games', words: /\b(anime|manga|figures?|otaku|pok[eé]mon|nintendo|video games?|retro games?|toys?|gundam)\b|アニメ|ゲーム/, trekCats: ['toy_store', 'video_game_store'], osm: ['["shop"~"^(anime|games|video_games|toys|comic|collector)$"]'] },
  { key: 'konbini', label: 'Konbini', words: /\b(konbinis?|combini|convenience( store)?|7-?eleven|seven ?eleven|lawson|family ?mart)\b|コンビニ/, trekCats: ['convenience_store'], osm: ['["shop"="convenience"]'], need: true },
  { key: 'supermarket', label: 'Supermarkets', words: /\b(supermarkets?|grocer(y|ies))\b|スーパー/, trekCats: ['grocery_store'], osm: ['["shop"="supermarket"]'], need: true },
  { key: 'drugstore', label: 'Drugstores', words: /\b(drug ?stores?|pharmac(y|ies)|chemists?|matsukiyo|medicine)\b|薬局|ドラッグ/, trekCats: ['pharmacy_and_drug_store'], osm: ['["shop"="chemist"]', '["amenity"="pharmacy"]'], need: true },
  { key: 'donki', label: 'Don Quijote', words: /\b(don ?quijote|donki|donkihote)\b|ドン・?キホーテ|ドンキ/, trekQ: 'ドン・キホーテ', trekCats: ['discount_store'], osm: ['["name"~"ドン・キホーテ|Don Quijote|MEGAドン|ドンキ",i]'] },
  { key: '100yen', label: '100-yen shops', words: /\b(100 ?yen|daiso|seria|can ?do|3 ?coins)\b|ダイソー|セリア|百均/, osm: ['["name"~"ダイソー|DAISO|セリア|Seria|キャンドゥ|3COINS",i]', '["shop"="variety_store"]'] },
  { key: 'atm', label: 'ATMs', words: /\b(atms?|cash|seven bank|withdraw)\b/, trekCats: ['atm'], osm: ['["amenity"="atm"]'], need: true },
  { key: 'lockers', label: 'Coin lockers', words: /\b(lockers?|luggage|baggage|coin lockers?|suitcase)\b|ロッカー/, osm: ['["amenity"~"^(locker|luggage_locker|lockers)$"]'], need: true },
  { key: 'toilets', label: 'Toilets', words: /\b(toilets?|restrooms?|bathrooms?|wc|loo|washrooms?)\b|トイレ/, osm: ['["amenity"="toilets"]'], need: true },
  { key: 'laundry', label: 'Laundry', words: /\b(laundry|laundromats?|coin laundry|washing machines?)\b|コインランドリー/, trekCats: ['laundromat'], osm: ['["shop"~"^(laundry|dry_cleaning)$"]'], need: true },
  { key: 'vintage', label: 'Vintage', words: /\b(vintage|thrift(ing)?|second ?hand|used clothes)\b|古着/, trekCats: ['second_hand_store'], osm: ['["shop"="second_hand"]', '["second_hand"~"yes|only"]'] },
  { key: 'records', label: 'Record shops', words: /\b(records?|vinyl)\b|レコード/, trekCats: ['record_store'], osm: ['["shop"="music"]'] },
  { key: 'sneakers', label: 'Sneakers', words: /\b(sneakers?|kicks|shoes)\b|スニーカー/, trekCats: ['shoe_store'], osm: ['["shop"="shoes"]'] },
  { key: 'souvenir', label: 'Souvenirs', words: /\b(souvenirs?|gifts?|omiyage)\b|お土産/, trekCats: ['gift_shop'], osm: ['["shop"="gift"]'] },
];
export const CAT = Object.fromEntries(CATS.map((c) => [c.key, c])) as Record<string, Cat>;

// Some asks are a family of the categories above: "food" should find the ramen shop too.
const PARENT: Record<string, string> = {
  ramen: 'food', sushi: 'food', yakitori: 'food', yakiniku: 'food', okonomiyaki: 'food', noodles: 'food', katsu: 'food',
  tempura: 'food', curry: 'food', izakaya: 'bar',
};
export const covers = (asked: string, has: string) => asked === has || PARENT[has] === asked;

// ── OSM selectors, read the way Overpass reads them ──
type Test = { k: string; op: '=' | '~' | 'has'; v?: string; re?: RegExp };
const SEL = /\["([^"]+)"(?:(=|~)"([^"]*)"(,i)?)?\]/g;
const parsed = new Map<string, Test[]>();
function tests(sel: string): Test[] {
  let t = parsed.get(sel);
  if (!t) {
    t = [...sel.matchAll(SEL)].map(([, k, op, v, i]): Test => (op === '~' ? { k, op: '~', v, re: new RegExp(v, i ? 'i' : '') } : op === '=' ? { k, op: '=', v } : { k, op: 'has' }));
    parsed.set(sel, t);
  }
  return t;
}
export function matches(sel: string, tags: Record<string, string>): boolean {
  return tests(sel).every((t) => {
    const v = tags[t.k];
    if (v == null) return false;
    return t.op === 'has' || (t.op === '=' ? v === t.v : t.re!.test(v));
  });
}
/** The categories an OpenStreetMap element belongs to. */
export const catsOfTags = (tags: Record<string, string>) => CATS.filter((c) => c.osm?.some((s) => matches(s, tags))).map((c) => c.key);

/** The categories a TREK Places (Overture) hit belongs to, by its category, else by its name. */
export function catsOfTrek(category: string | null | undefined, name: string): string[] {
  const out = new Set<string>();
  if (category) for (const c of CATS) if (c.trekCats?.includes(category)) out.add(c.key);
  const text = ` ${name.toLowerCase()} `;
  for (const c of CATS) if (!c.need && c.words.test(text)) out.add(c.key); // "Ichiran Ramen …", "ROUND1 …"
  if (category && /restaurant|eatery|food/.test(category)) out.add('food');
  return [...out];
}

/** Overpass query text for a set of selectors within a geographic clause. */
export function overpassQL(sels: string[], where: string, limit = 60, timeout = 12): string {
  return `[out:json][timeout:${timeout}];(${sels.map((s) => `nwr${s}${where};`).join('')});out center tags ${limit};`;
}
