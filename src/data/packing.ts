export type PackItem = {
  id: string;
  label: string;
  note?: string;
};

export type PackGroup = {
  group: string;
  emoji: string;
  items: PackItem[];
};

export const PACKING: PackGroup[] = [
  {
    group: "Documents & Money",
    emoji: "🛂",
    items: [
      { id: "passport", label: "Passport (carry it at all times — it's the law)", note: "Also unlocks tax-free shopping" },
      { id: "vjw", label: "Visit Japan Web QR codes (screenshot them)" },
      { id: "cards", label: "No-FX-fee credit card + some cash", note: "Japan is card-friendly now, but small shops/shrines want yen" },
      { id: "insurance", label: "Travel insurance confirmation" },
      { id: "idp", label: "International Driving Permit (only if go-karting!)" },
    ],
  },
  {
    group: "December Layers",
    emoji: "🧥",
    items: [
      { id: "puffer", label: "Packable puffer jacket", note: "4–12°C days; trains/stores are overheated — layers beat one big coat" },
      { id: "merino", label: "Merino base layers / heattech from Uniqlo", note: "Or just buy Heattech on arrival — it's cheaper there" },
      { id: "shoes", label: "Broken-in walking shoes", note: "You will walk 20,000+ steps daily. This is the #1 item" },
      { id: "slipon", label: "Slip-on friendly footwear", note: "Temples, ryokan, and izakaya = shoes off constantly" },
      { id: "gloves", label: "Gloves + beanie", note: "Illumination viewing = standing outside at night" },
      { id: "socks", label: "Quality socks with no holes", note: "Everyone sees them at the ryokan" },
    ],
  },
  {
    group: "Tech",
    emoji: "🔌",
    items: [
      { id: "esim", label: "eSIM installed & tested before flying" },
      { id: "battery", label: "Power bank (10,000mAh+)", note: "Google Maps all day murders batteries" },
      { id: "adapter", label: "Plug adapter — Japan = US Type A, 100V", note: "US plugs mostly just work" },
      { id: "suica", label: "Suica in Apple/Google Wallet", note: "Set up before you land — works on iPhone instantly" },
    ],
  },
  {
    group: "Smart Extras",
    emoji: "🎒",
    items: [
      { id: "daypack", label: "Packable day bag", note: "Coin lockers fit small bags everywhere" },
      { id: "space", label: "Empty suitcase space (or a foldable duffel)", note: "Don Quijote will fill it. Resistance is futile" },
      { id: "meds", label: "Personal meds + copy of prescriptions", note: "Some US meds (e.g., Adderall, anything w/ pseudoephedrine) are restricted — check before flying" },
      { id: "tissues", label: "Hand sanitizer + small towel", note: "Many restrooms have no dryers or towels" },
      { id: "trashbag", label: "Small ziploc for trash", note: "Public trash cans basically don't exist" },
      { id: "onsenmind", label: "Onsen mindset", note: "Yes, everyone's naked. Yes, it's fine. Tattoos? Research tattoo-friendly baths or book private kashikiri" },
    ],
  },
];
