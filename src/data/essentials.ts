// Emergency & essentials — the stuff you hope to never tap, surfaced so it's one
// tap away on the ground. Numbers verified Jun 2026 (JNTO / official sources).

export type EmergencyLine = {
  emoji: string;
  label: string;
  number: string; // display
  tel: string; // tel: href digits
  note: string;
};

export const EMERGENCY_LINES: EmergencyLine[] = [
  { emoji: "🚓", label: "Police", number: "110", tel: "110", note: "Crime, theft, traffic accidents. Free from any phone, 24/7. For a lost wallet/passport, the nearest kōban (police box) is faster." },
  { emoji: "🚑", label: "Fire & Ambulance", number: "119", tel: "119", note: "Medical emergency or fire. Ambulances are FREE. Say 'kyūkyū' (ambulance) or 'kaji' (fire); operators can route English help." },
  { emoji: "🌊", label: "Coast Guard", number: "118", tel: "118", note: "Emergencies at sea — relevant on the Enoshima and Miyajima ferries." },
  { emoji: "🗣️", label: "JNTO Visitor Hotline · English 24/7", number: "050-3816-2787", tel: "0503816-2787", note: "The 'I don't know who to call' line. Accidents, illness, natural disasters, lost items, general help — in English, Chinese, Korean. CALL THIS FIRST if unsure." },
  { emoji: "🆘", label: "JHELP multilingual relay", number: "0570-000-911", tel: "0570000911", note: "24/7 multilingual emergency relay and translation if there's a language wall during a 110/119 call." },
];

export type EssentialCard = { emoji: string; title: string; body: string };

export const ESSENTIALS: EssentialCard[] = [
  {
    emoji: "🛂",
    title: "Lost passport",
    body: "Report to the nearest kōban first (they issue a loss report you'll need). Then contact the US Embassy Tokyo (+81-3-3224-5000) or US Consulate Osaka (+81-6-6315-5900) for an emergency travel document. Keep a photo of your passport + a printed copy separate from the original — do this BEFORE the flight.",
  },
  {
    emoji: "🌐",
    title: "Install 'Safety Tips' before you go",
    body: "The official JNTO/JTA disaster-alert app (free, iOS/Android) pushes earthquake early-warnings, tsunami, typhoon and evacuation info in English. It's the single most useful traveler app most people forget. Add it on the flight Wi-Fi.",
  },
  {
    emoji: "🫨",
    title: "Earthquake protocol",
    body: "Japan trembles often and buildings are built for it. DROP, COVER under a table, HOLD. Do NOT run outside (falling glass). Stay away from windows/shelves. After shaking stops, follow staff instructions and signs to the nearest 'evacuation area' (避難場所). Phones blare a loud J-Alert a few seconds before a big one — that's normal.",
  },
  {
    emoji: "🏥",
    title: "Getting medical help",
    body: "119 for an ambulance (free). For non-emergencies, the JNTO hotline (050-3816-2787) finds the nearest English-speaking clinic. Carry your travel-insurance card + policy number; Japan's care is excellent and insurance makes the already-cheap bills free. Bigger cities have international clinics (e.g. Tokyo Medical & Surgical Clinic).",
  },
  {
    emoji: "💊",
    title: "Pharmacies & meds",
    body: "Drugstores (ドラッグストア — Matsukiyo, Welcia, Sundrug) cover painkillers, cold meds, stomach stuff, Pocari, hangover turmeric shots. Bring prescriptions in original packaging + a doctor's note. Heads-up: some common US meds (anything with pseudoephedrine, Adderall/stimulants, codeine) are RESTRICTED or banned — check before flying.",
  },
  {
    emoji: "🏧",
    title: "Cash when you're stuck",
    body: "7-Eleven (7-Bank) and Japan Post ATMs take foreign cards 24/7 with English menus — they're everywhere and the reliable fallback when a shop is cash-only and your wallet's empty. Carry ~¥10,000 for the cash-only alleys (Golden Gai, yokocho, sentō, small shrines).",
  },
  {
    emoji: "🧳",
    title: "Lost something? You'll probably get it back",
    body: "Japan's lost-and-found culture is genuinely elite. Phone, wallet, bag — report to the nearest kōban and the station's lost-and-found (忘れ物). Note the train line + approximate time. A lost Suica/ICOCA can be cancelled and the balance recovered if it was a registered/mobile card.",
  },
  {
    emoji: "📵",
    title: "If your phone dies abroad",
    body: "Every konbini and most cafés have free Wi-Fi; 'Japan Connected-free Wi-Fi' and station/airport Wi-Fi cover the gaps. Screenshot the day's plan, the Airbnb address (in Japanese), and key reservations each morning so a dead battery never strands you. Power banks are doctrine (Packing tab).",
  },
];

export type EmergencyPhrase = { en: string; jp: string; romaji: string };

export const EMERGENCY_PHRASES: EmergencyPhrase[] = [
  { en: "Help! / Emergency!", jp: "助けて！", romaji: "Tasukete!" },
  { en: "Please call an ambulance.", jp: "救急車を呼んでください。", romaji: "Kyūkyūsha o yonde kudasai." },
  { en: "Please call the police.", jp: "警察を呼んでください。", romaji: "Keisatsu o yonde kudasai." },
  { en: "Where is the hospital?", jp: "病院はどこですか？", romaji: "Byōin wa doko desu ka?" },
  { en: "I'm lost.", jp: "道に迷いました。", romaji: "Michi ni mayoimashita." },
  { en: "Does anyone speak English?", jp: "英語を話せる人はいますか？", romaji: "Eigo o hanaseru hito wa imasu ka?" },
  { en: "I have an allergy to ___.", jp: "___ アレルギーがあります。", romaji: "___ arerugī ga arimasu." },
];
