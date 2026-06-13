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
  {
    group: "Degenerate Prerequisites",
    emoji: "🧠",
    items: [
      { id: "dignity-budget", label: "Dignity (allocate carefully — depreciates fast)", note: "Full stack on Day 1. Down to 40% by the purikura session. Expendable after the electric bath at Funaoka." },
      { id: "shame-floor", label: "A functioning shame floor (20% minimum)", note: "Below 20% you become a liability. Above 80% and you miss the best stories. Operate in the zone." },
      { id: "noise-cancel", label: "Noise-canceling headphones", note: "For the 14-hour flight, the morning after karaoke nights, and the Shinkansen when Charlie is talking." },
      { id: "antacids", label: "Antacids / stomach insurance", note: "You will eat 17 things that conflict on Day 3. You will do it again on Day 4. This is a feature." },
      { id: "compression-socks", label: "Compression socks (mandatory, non-negotiable)", note: "14-hour flight. 18-hour return. Your ankles are not too good for socks. We've had this conversation." },
      { id: "sleep-debt", label: "Sleep debt tolerance (minimum 6-day runway)", note: "You will survive on 5 hours through Dec 21. The itinerary is merciful but the illuminations do not wait." },
      { id: "splitwise", label: "Splitwise app (installed, account active, logged in)", note: "If this isn't set up before the flight, you are the reason the group chat implodes on Day 12." },
      { id: "phone-storage", label: "100GB+ free phone storage", note: "You will take 400 photos on Dec 22 alone. The purikura strips are not small. The shrine in snow is not one shot." },
      { id: "group-chat", label: "Group chat notifications ON (all 16 days)", note: "The 21:00 audible window, emergency konbini location shares, the Nara deer situation — these are time-sensitive." },
      { id: "japanese-keyboard", label: "Japanese keyboard on your phone", note: "Download now. Practice あいうえお on the flight. By Day 4 you'll be attempting to order entirely in hiragana. This will not work but it earns massive respect." },
      { id: "dont-be-weird", label: "Working knowledge of what's disrespectful", note: "No eating while walking (ok at festivals). Quiet on trains. Stand right escalators. No tips. Phones in restaurants on vibrate. These are not optional guidelines they are the contract." },
    ],
  },
];
