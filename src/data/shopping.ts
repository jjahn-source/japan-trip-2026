export type ShopItem = {
  name: string;
  where: string;
  city: "Tokyo" | "Osaka" | "Kyoto" | "All";
  what: string;
  price?: string;
  tip?: string;
};

export type ShopCategory = {
  id: string;
  title: string;
  emoji: string;
  intro: string;
  items: ShopItem[];
};

export const SHOP: ShopCategory[] = [
  {
    id: "electronics",
    title: "Electronics",
    emoji: "🖥️",
    intro:
      "Japan prices on electronics are genuinely better than US retail — not by a lot on everything, but on specific categories you win hard: Nintendo software, Sony audio, Casio calculators, and camera gear at Yodobashi. The play is tax-free at a store that hits ¥5,000 in one transaction, which most of these will easily clear.",
    items: [
      {
        name: "Nintendo Switch game cartridges",
        where: "Yodobashi Akiba · BIC Camera Akihabara · Super Potato",
        city: "Tokyo",
        what:
          "The Switch is fully region-free — cartridges bought in Japan work in your US console with no mods. New first-party titles (Mario, Zelda, Pokémon) run ¥6,578 ($41) vs. $60 US retail. Japanese-exclusive or Japan-first releases are the real prize: niche RPGs, visual novels, and arcade ports that never made it west.",
        price: "¥5,280–¥7,480 ($33–$47) new · ¥1,000–¥3,000 ($6–$19) used at Super Potato",
        tip: "Super Potato (4F, Radio Kaikan, Akihabara) has used carts in perfect condition for ¼ the new price. They grade everything A/B/C — buy A-rank without guilt.",
      },
      {
        name: "Sony WH-1000XM5 / WF-1000XM5 headphones",
        where: "Yodobashi Akiba · BIC Camera Shinjuku",
        city: "Tokyo",
        what:
          "Sony's flagship noise-cancelling headphones often land ¥5,000–¥10,000 cheaper in Japan than US MSRP, and the Japanese market gets colorways that never ship west. The WH-1000XM5 (~¥38,000 / $238) and the truly wireless WF-1000XM5 (~¥27,000 / $169) are the two to watch. Check price tracker before buying — sales can swing this.",
        price: "¥27,000–¥44,000 ($169–$275)",
        tip: "Yodobashi's point card system gives 10% back in store points. On a ¥38,000 purchase that's ¥3,800 off your next buy — useful if you grab multiple items.",
      },
      {
        name: "Casio G-Shock (Japan-exclusive models)",
        where: "Yodobashi Akiba · BIC Camera · G-Shock Store Omotesando",
        city: "Tokyo",
        what:
          "Casio manufactures G-Shocks in Japan and produces exclusives — Mudmaster editions, collaboration drops, and the G-Shock x Frogman diver series — that ship Japan-only or arrive US months later at a premium. Even the standard DW-6900 or GA-2100 is ¥1,000–¥3,000 cheaper than the US gray market.",
        price: "¥10,000–¥55,000 ($63–$344) depending on model",
        tip: "The G-Shock 'Origin' store in Omotesando has Japan-only colorways not available at department stores. Make the detour on Day 2 or 3 while in Harajuku.",
      },
      {
        name: "Sony ZV-1 II / RX100 pocket camera",
        where: "Yodobashi Akiba · Map Camera (Shinjuku)",
        city: "Tokyo",
        what:
          "Japan is the best place on Earth to buy Sony compact cameras — the domestic lineup is often fuller and street prices undercut US Amazon by ¥5,000–¥15,000. The ZV-1 II (vlogging) and RX100 VII (best pocket camera period) are the two that matter. Map Camera in Shinjuku also sells immaculate used gear at 70–80% of new price.",
        price: "ZV-1 II ¥52,000 ($325) · RX100 VII ¥110,000 ($688)",
        tip: "Map Camera grades used items A/B/C with photos — B-grade is basically new. The counter staff speak camera nerd fluently and will let you handle anything.",
      },
      {
        name: "Audio-Technica ATH-M50x / open-back headphones",
        where: "Yodobashi Akiba · e-earphone Akihabara",
        city: "Tokyo",
        what:
          "Audio-Technica is a Japanese brand — their studio monitors and IEMs are priced noticeably cheaper at home. e-earphone is a specialist chain with a listening wall of 500+ IEMs; it's the only place to A/B your way through the whole Campfire Audio lineup before committing. Japanese audiophile IEM brands (FitEar, qdc, JVCKenwood) are Japan-priced here.",
        price: "ATH-M50x ¥12,800 ($80) · IEMs ¥5,000–¥500,000",
        tip: "e-earphone's listening lounge in Akihabara has demo units of everything. Spend an hour there before you buy — this is the correct use of the store.",
      },
      {
        name: "Yodobashi Akiba — the full-floor run",
        where: "Yodobashi Camera Multimedia Akihabara (1 Chome-1 Sotokandasoto, Chiyoda)",
        city: "Tokyo",
        what:
          "Nine floors of every consumer electronic product sold in Japan, with the deepest stock and sharpest prices in Tokyo. Strategy: start on the floor relevant to what you're buying, compare to online Japanese prices on your phone, and present the competitor price — Yodobashi will match it. Tax-free counter is on the 1F main register area; bring your passport.",
        tip: "The basement food hall is the best ramen in Akihabara by default. Hit it for lunch and do the electronics floors after — you'll have more decision bandwidth on a full stomach.",
      },
      {
        name: "Retro consoles and cartridges (Famicom, SFC, N64)",
        where: "Super Potato · Retro Game Camp · Trader Akihabara",
        city: "Tokyo",
        what:
          "Akihabara has more retro game stock than anywhere else on Earth. Super Potato is famous but its prices have crept up — the competing shops Retro Game Camp and Trader have comparable stock at better prices. Japanese-market Super Famicom carts are region-locked to Japanese hardware but region-free on flash carts; NES/Famicom carts are also region-locked. Game Boy cartridges are region-free.",
        price: "Famicom carts ¥300–¥8,000 · SFC ¥300–¥30,000 depending on title",
        tip: "Kirby's Dreamland 3 (SNES), Castlevania: Rondo of Blood (PC Engine), and Mother 3 (GBA) are the grail carts — still cheap in Japan vs. US resale. Have a list.",
      },
    ],
  },
  {
    id: "anime-merch",
    title: "Anime / Figures / Merch",
    emoji: "🎌",
    intro:
      "Akihabara (Tokyo) and Den Den Town (Osaka) are the two poles of otaku retail. The hierarchy: Mandarake for cheapest used, Animate for newest official releases, specialty stores for limited edition and doujinshi. Budget ¥10,000–¥30,000 ($63–$188) for a serious run at either district.",
    items: [
      {
        name: "Mandarake — used anime goods at floor price",
        where: "Mandarake Complex (Akihabara) · Mandarake Umeda (Osaka)",
        city: "All",
        what:
          "Mandarake is the best used anime merchandise chain in Japan: figures, manga, doujinshi, vintage goods, and rare collectibles priced at 20–60% of retail. The Akihabara complex is 8 floors; each floor has a specialty (figures, doujinshi, cosplay, games). Staff grade everything honestly — A is near-mint, B is shelf-display quality.",
        price: "Figures from ¥500 ($3.13) · Limited editions up to ¥50,000+",
        tip: "The basement floor in Akihabara has sealed, unopened figures at secondhand prices — sometimes just 10–20% under retail but condition is perfect. Check it before buying new at Animate.",
      },
      {
        name: "Animate — official new releases",
        where: "Animate Akihabara · Animate Den Den Town (Osaka)",
        city: "All",
        what:
          "Japan's largest official anime merchandise chain. Every airing season's merch drops here first — acrylic stands, keychains, tapestries, B2 wall art, clear files. The floor layout is by franchise; if you know what you want, walk directly to that section. Animate exclusives (limited bonus items, first-print bundles) are not available elsewhere.",
        price: "Keychain ¥660–¥1,320 ($4–$8) · Figures ¥2,500–¥35,000 ($15–$219)",
        tip: "Animate's member card tracks points — sign up on visit 1 (no ID required, just a phone number or email). Points add up if multiple people in the crew are buying.",
      },
      {
        name: "Yellow Submarine — card games and tabletop",
        where: "Yellow Submarine Akihabara (multiple buildings)",
        city: "Tokyo",
        what:
          "The best store in Japan for trading card games: Yu-Gi-Oh, Pokémon, Weiss Schwarz, Dragon Ball Super. Japanese booster boxes are 30 packs vs. the US 36 packs, but still cheaper per-pack and include Japanese-exclusive sets that haven't been localized. The top floor has single cards — if you're hunting a specific rare, this is cheaper than eBay.",
        price: "Booster box ¥4,000–¥18,000 ($25–$113) · Single cards ¥100–¥100,000+",
        tip: "Pokémon cards are the biggest arbitrage: Japanese Scarlet & Violet packs at ¥165 ($1.03) vs. $5+ US retail. Buy a booster box, rip it on the flight home.",
      },
      {
        name: "Crane games (UFO catchers) — the real activity",
        where: "Taito Station · Sega Akihabara · Round 1 (Akihabara, Shinjuku, Osaka)",
        city: "All",
        what:
          "Japanese crane games are rigged in your favor compared to US versions — machines are calibrated to give after a set number of plays, and staff will reposition prizes if you ask (seriously). The prizes are legitimate merchandise: full retail-quality plushies, figures, snacks. Round 1 has the most machines; Taito Station has the most strategically accessible prizes.",
        price: "¥100/play ($0.63). Budget ¥500–¥2,000 per prize you want",
        tip: "Ask staff to 'naoshi' (reposition) the prize before your plays — they're legally required to do so and it dramatically improves your odds. Point at the prize and mime it sliding toward the hole.",
      },
      {
        name: "Den Den Town — Osaka's Akihabara",
        where: "Nipponbashi, Osaka (10 min walk from Namba)",
        city: "Osaka",
        what:
          "Osaka's otaku district is smaller than Akihabara but has a different specialty mix: more used doujinshi, cheaper retro games (slightly), and the Den Den Town Mandarake is less picked-over than the Tokyo complex. The walk from Namba to Den Den Town passes three Animate stores, a massive K-Books, and a Trader — do it on the day you arrive in Osaka.",
        tip: "Joshin (a Kansai electronics chain) in Den Den Town often beats Yodobashi on certain items. Worth a price check before buying in Tokyo.",
      },
      {
        name: "Kotobukiya flagship — figures and kits",
        where: "Kotobukiya Akihabara",
        city: "Tokyo",
        what:
          "Kotobukiya's flagship store carries their full line of plastic model kits (Frame Arms, Megami Device) and ARTFX statues that are Japan-priced — 20–30% under the US import price. The Megami Device build kits are a specifically Japanese product category: articulated female robot figures in 1/1 scale that you assemble and customize. Nothing comparable exists outside Japan.",
        price: "Frame Arms Girl kits ¥3,300–¥8,800 ($21–$55) · ARTFX statues ¥8,800–¥55,000",
        tip: "The display floor has fully built demo kits to assess posability before buying. Staff will show you everything — their job is to explain the product line.",
      },
    ],
  },
  {
    id: "drugstore",
    title: "Drugstore Haul",
    emoji: "💊",
    intro:
      "Matsumoto Kiyoshi (blue/yellow signage) and Sugi Pharmacy are the two chains to hit. They're everywhere — one exists within 5 minutes of every hotel we'll stay in. Japanese drugstores carry skincare, cosmetics, OTC medicine, candy, and household items that are either unique to Japan or dramatically cheaper than import prices abroad. Budget ¥3,000–¥8,000 ($19–$50) per person; it fills fast.",
    items: [
      {
        name: "Hada Labo Gokujun Lotion (HA toner)",
        where: "Matsumoto Kiyoshi · Any drugstore",
        city: "All",
        what:
          "The most famous hyaluronic acid toner in Japan — deep hydration with no fragrance, no alcohol, no irritants. The standard pump bottle (~170ml) is ¥880 ($5.50) vs. $25 import price in the US. The 'premium' version (gold cap) uses higher-MW HA and is still only ¥1,100 ($6.88). One of the cleanest arbitrage buys of the trip.",
        price: "¥880–¥1,100 ($5.50–$6.88)",
        tip: "Get two — it'll sell out in your bathroom before you're back to work. Also available in: Rohto Melano CC (vitamin C serum), DHC Lip Cream (the cult lip balm), Curel Intensive Moisture Cream.",
      },
      {
        name: "Biore UV Aqua Rich Watery Essence SPF 50+",
        where: "Matsumoto Kiyoshi · FamilyMart · Lawson",
        city: "All",
        what:
          "The SPF product that broke the American skincare community. Japanese chemical sunscreens use UV-filter combinations banned in the US (Tinosorb S, Uvinul A Plus) that offer better broad-spectrum protection at a lighter texture. The Biore Aqua Rich is the most popular: 50g tube, SPF 50+/PA++++, no white cast, dries down to a finish that feels like nothing. $5.50 vs. $30 import.",
        price: "¥880–¥1,100 ($5.50–$6.88)",
        tip: "Anessa (gold bottle) is the outdoor/sweat-proof upgrade for the day we do Kamakura beach in December. Sofina Alblanc is the most aesthetic white-bottle option if that matters.",
      },
      {
        name: "Rohto Lycée / Rohto V eye drops",
        where: "Matsumoto Kiyoshi · Convenience stores",
        city: "All",
        what:
          "Japanese eye drops are mentholated and come in varying cooling intensities — levels 0 through 5.5 on the 'cool scale.' Rohto V (the classic red cap) is a 4.0; the Rohto Arctic (black cap) is a 5.5 and will make your eyes feel like you stared into a blizzard. Both are ¥550–¥880. After a 25k-step day in the cold, these fix your face.",
        price: "¥550–¥880 ($3.44–$5.50)",
        tip: "Rohto Lycée (pink) is the gentle option for contact lens wearers. The cooling versions are for bare eyes only. Excellent stocking stuffers for anyone back home.",
      },
      {
        name: "Salonpas patches (pain relief patches)",
        where: "Matsumoto Kiyoshi · All drugstores",
        city: "All",
        what:
          "The world's best topical pain relief patch. Higher concentration of methyl salicylate and menthol than anything approved for US OTC use — the Japanese domestic version is genuinely more effective. One sheet (6 patches) is ¥330 ($2.06). After day 1 walking Shinjuku you will understand why every onsen town has these at the entrance.",
        price: "¥330–¥880 ($2.06–$5.50) per pack",
        tip: "Buy before you need them — you'll need them by Day 2. Put one on both calves before sleeping on a high-step day. The XXL back patches also exist for the Kamakura hiking day.",
      },
      {
        name: "Japanese KitKat flavors",
        where: "Matsumoto Kiyoshi · 7-Eleven · Airport",
        city: "All",
        what:
          "Nestlé Japan produces 40+ KitKat flavors unavailable outside Japan: matcha, sake, wasabi, roasted tea (hojicha), sweet potato, ruby chocolate, regional editions (Shizuoka green tea, Kyoto matcha, Hokkaido milk). The omiyage-sized box (12–15 minis) is the correct unit for bringing home to people. Sake and matcha are the flavors that actually survive translation to non-Japan audiences.",
        price: "Mini bag ¥250–¥450 ($1.56–$2.81) · Omiyage box ¥800–¥1,500 ($5–$9.38)",
        tip: "The Airport (Haneda departure floor) has the widest selection and gift-box packaging. Buy 80% of your KitKat haul there on Dec 29 — it's fresher than anything you've been carrying for two weeks.",
      },
      {
        name: "Pocky (flavors not exported) + local confectionery",
        where: "Any konbini or drugstore",
        city: "All",
        what:
          "Beyond the standard Strawberry and Chocolate, Japan Pocky runs seasonal and regional editions: Almond Crush, Winter Rich Matcha, Cookies & Cream (different formulation than the US version), and the Kinako (roasted soybean) which doesn't exist abroad. Glico also makes Pretz — savory pretzel sticks in roasted corn, pizza, and tomato flavors.",
        price: "¥130–¥280 ($0.81–$1.75)",
        tip: "The airport and service-area shops stock the largest variety. If you're going to Kyoto Station ekinaka, the regional confectionery concourse is worth 20 minutes.",
      },
      {
        name: "Daiso 100-yen store finds",
        where: "Daiso (multiple locations per city)",
        city: "All",
        what:
          "Japan's best ¥100 store carries: ceramic ramen bowls, bamboo serving trays, travel pouches, silicone ice molds, kitchen tools, office supplies, and organizational products at a quality level that embarrasses US dollar stores. Not a tourist trap — Daiso is where Japanese households actually buy household goods. The Shibuya location (Marui building) has 4 floors.",
        price: "¥100–¥300 ($0.63–$1.88) per item",
        tip: "Buy omiyage here instead of at tourist spots — the quality is the same or better for household items, and a ¥100 ceramic chopstick rest is a more interesting souvenir than a ¥800 temple postcard.",
      },
    ],
  },
  {
    id: "omiyage",
    title: "Snacks & Omiyage",
    emoji: "🍡",
    intro:
      "Omiyage (お土産) is the Japanese gift culture of bringing back regional specialties for people at home. There's a hierarchy: Airport omiyage (fine but generic), depachika (department store basement — the best), regional station shops (buy it in the city it comes from), and konbini (fresh, cheap, excellent). Spend ¥5,000–¥15,000 ($31–$94) on things to bring home and no one back home will be disappointed.",
    items: [
      {
        name: "Shiroi Koibito (白い恋人) — Hokkaido butter cookies",
        where: "Kyoto Station · Osaka depachika · Airport",
        city: "All",
        what:
          "Two white chocolate sheets sandwiching a butter cookie, packaged in a tin that looks designed for a museum gift shop. Made by Ishiya in Hokkaido, but sold nationwide at department stores and airports. The gold standard of Japanese omiyage — recognized by every Japanese person as the correct thing to bring back. Get the 18-piece box.",
        price: "¥1,080–¥2,700 ($6.75–$16.88) for 12–24 pieces",
        tip: "Also look for Royce' Chocolate (another Hokkaido brand) — their Nama Chocolate (fresh cream chocolate) is unhinged in quality and available at the airport with dry ice packaging. Get it on Dec 29 departure day only.",
      },
      {
        name: "Yoku Moku cigare cookies",
        where: "Yoku Moku stores · Isetan Shinjuku B1 · Airport",
        city: "Tokyo",
        what:
          "Buttery tuile cigarette-roll cookies in a classic blue tin that Japan has been producing since 1969. The original flavor tastes like cultured butter and pure sweetness. Premium versions include rum raisin and matcha. A 30-piece tin is ¥2,700 ($16.88) — objectively good value for what the tin looks like.",
        price: "¥1,620–¥4,860 ($10.13–$30.38)",
        tip: "Available at the Shinjuku Isetan depachika on Day 1–2 in Tokyo. Airport also has it but the floor stock can run low before Dec 29 holiday departures.",
      },
      {
        name: "Matcha Kit Kats + regional flavor sets",
        where: "Airport · Kyoto Station · Osaka depachika",
        city: "All",
        what:
          "Already covered in the drugstore section, but the airport Matcha Kit Kat 12-box gift set (¥1,500 / $9.38) is the most efficient omiyage purchase on the trip — universally recognized, shelf-stable for 6+ months, and enough pieces to cover 12 people at home.",
        price: "¥1,080–¥2,160 ($6.75–$13.50) for gift box",
      },
      {
        name: "Depachika run — Isetan Shinjuku / Osaka Takashimaya B2",
        where: "Isetan Shinjuku B1–B2 · Osaka Takashimaya Nambahankyu B2",
        city: "All",
        what:
          "The underground food halls of Japan's major department stores are the best single-floor food shopping in the world. Isetan Shinjuku B1: fresh wagashi, regional sweet sets, Sadaharu Aoki patisserie, regional sake gift boxes, fresh mochi, and every high-end confectionery brand in Japan with gift wrapping. Osaka Takashimaya is the Kansai equivalent, with a heavier focus on Kansai regional specialties.",
        price: "¥500–¥5,000 per item",
        tip: "Set aside 2 hours and ¥10,000 for one proper depachika run — it's the single most efficient omiyage session of the trip. Isetan Shinjuku is on the Day 2 path anyway.",
      },
      {
        name: "Instant ramen (Japanese domestic varieties)",
        where: "Donki · Tokyu Hands · Tsutaya D&DEPARTMENT",
        city: "All",
        what:
          "The Japanese domestic instant ramen lineup is completely different from what's exported. Nissin's Donbei range (udon), Sapporo Ichiban's full line, regional cup noodle editions (Hakata tonkotsu, Sapporo miso, Tokyo shoyu), and the instant ramen from actual ramen shops (Ippudo, Ichiran, Fuunji) are sold in Japanese supermarkets and Donki. Buy flat packets, not cups — they pack better.",
        price: "¥150–¥600 ($0.94–$3.75) per pack",
        tip: "Ippudo's packaged dry ramen kit (Tokushima Black sold at their stores) and Ichiran's home ramen kit are the prestige picks. Both available in Akihabara and Dotonbori area.",
      },
      {
        name: "Wagashi — traditional Japanese confectionery",
        where: "Kyoto station depachika · Nishiki Market · Any ryokan gift shop",
        city: "Kyoto",
        what:
          "Kyoto is the capital of wagashi (和菓子): mochi, namagashi (fresh seasonal sweets), yokan (sweet bean jelly), monaka, and higashi (dry tea ceremony sweets). The Kyoto station underground has a full floor of regional wagashi brands. Toraya and Kagizen Yoshifusa are the 300-year-old names; Malebranche is the modern shop with the most photogenic packaging.",
        price: "¥500–¥5,000 ($3.13–$31.25) per box",
        tip: "Namagashi must be refrigerated and eaten within 2–3 days — it's the most beautiful thing you can buy in Japan but it's not an omiyage. Buy it to eat in Kyoto, not to bring home.",
      },
    ],
  },
  {
    id: "tax-free",
    title: "Tax-Free & Duty-Free",
    emoji: "📋",
    intro:
      "Japan removes its 10% consumption tax on purchases over ¥5,000 at registered stores — that's $31 off every $312 you spend. On a serious electronics or merch run this adds up to real money. The system is digital since 2023: purchases link to your passport electronically. Duty-free limits on the US side are different and matter for the return — know both systems before the airport.",
    items: [
      {
        name: "Japan tax-free — the actual execution",
        where: "Any 「免税」 (tax-free) registered store",
        city: "All",
        what:
          "Spend ¥5,000+ pre-tax at a single registered store in one day → show your physical passport (phone photo won't work at most counters) → they remove the 10% or refund it at a tax-free counter. The tax-free sticker goes on your receipt. At Haneda customs on Dec 29, they may scan your passport and ask to verify you're carrying the goods — keep all tax-free purchases accessible in your carry-on or main bag, not shipped.",
        tip: "You can combine multiple receipts from the same store on the same day to hit ¥5,000. Yodobashi, BIC Camera, Matsumoto Kiyoshi, and Don Quijote are all tax-free registered. Ask '免税できますか' (Menzei dekimasu ka?) if unsure.",
      },
      {
        name: "Don Quijote — midnight tax-free everything",
        where: "Donki Akihabara · Donki Shinjuku · Donki Dotonbori (Osaka)",
        city: "All",
        what:
          "Don Quijote (Donki) is the most chaotic, densely packed discount chain in Japan — open until 3am or 24h, stacked floor-to-ceiling with electronics, cosmetics, food, clothes, toys, and novelties at prices that consistently undercut department stores. Their tax-free desk processes faster than Yodobashi, and the Dotonbori Osaka location has a tax-free counter specifically for tourists.",
        price: "Everything: cosmetics 20–40% below department store · Electronics 5–15% below",
        tip: "The Donki discount on cosmetics (Shiseido, Canmake, Crème de la Mer) is real — the discount display tags aren't performance art. Compare your target items to drugstore prices on your phone.",
      },
      {
        name: "US Customs duty-free limit — what matters on Dec 29",
        where: "U.S. Customs and Border Protection",
        city: "All",
        what:
          "Each US person gets an $800 duty-free exemption per trip. Above $800 you pay 3% on the next $1,000, then standard rates. What's actually inspected: declared items (you have to declare what you bought on the CBP form), anything that looks commercial (buying 12 identical items is a flag), and food/plant-based products (fresh fruit, vegetables, unpackaged meat — none of which you'll have). Electronics, clothes, candy, games: declare but no duty below $800 per person.",
        tip: "For 8 people at $800 each = $6,400 in collective duty-free purchases. Practically speaking: don't pool purchases for one person to declare — each person gets their own $800. Pokémon cards, KitKats, headphones, and Switch games do not need receipts for customs unless you're over the limit.",
      },
      {
        name: "What to ship home vs. carry",
        where: "Yamato Transport · FedEx Japan · Japan Post",
        city: "All",
        what:
          "Yamato (the same takkyubin service we use between Airbnbs) also ships internationally — SAL (Surface Air Lifted) is cheap (¥2,000–¥4,000 / $12–$25 for a mid-size box to the US) but takes 2–4 weeks. EMS (Express Mail Service via Japan Post) arrives in 3–5 days at ¥3,500–¥8,000 ($22–$50). If you go hard on the electronics budget, shipping the non-fragile stuff home is cheaper than checking an extra bag on Delta.",
        tip: "Japan Post is inside 7-Eleven for small packages. International EMS from a konbini to a US address for under 2kg is ¥1,500–¥2,500 ($9.38–$15.63) — the most underrated move of the trip for distributing weight across the group.",
      },
    ],
  },
];
