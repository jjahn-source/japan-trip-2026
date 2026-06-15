export type EmergencyInfo = {
  category: string;
  title: string;
  phone: string;
  details: string[];
};

export const EMERGENCY_CONTACTS: EmergencyInfo[] = [
  {
    category: "Medical Emergency",
    title: "Ambulance (Kyukusha)",
    phone: "119",
    details: [
      "24/7. English support available in Tokyo/major cities.",
      "Say: 'Kyukusha onegai shimasu' (ambulance please)",
      "Tell them your location and symptoms. They will send help.",
      "Bring passport and travel insurance card.",
    ],
  },
  {
    category: "Police Emergency",
    title: "Police (Keisatsu)",
    phone: "110",
    details: [
      "For robbery, accidents, crimes, lost belongings.",
      "English support available in major areas.",
      "Ask for English-speaking officer if needed.",
      "Get a police report number for insurance claims.",
    ],
  },
  {
    category: "Medical Non-Emergency",
    title: "Hospital/Clinic Finder",
    phone: "Call hotel concierge or use JNTO line",
    details: [
      "JNTO Hotline: +81-50-3816-2787 (24/7, English)",
      "Hotels have doctor on-call or nearby clinic lists.",
      "Dentists: search 'dental' + city name on Google Maps.",
      "Pharmacies: Every konbini has basic meds. Larger ones (Tomod's) have more.",
    ],
  },
  {
    category: "Lost Item Recovery",
    title: "Train/Station Lost & Found",
    phone: "Varies by line",
    details: [
      "Report same-day at station office or train company HQ.",
      "Bring: description, location/time lost, contact number.",
      "Tokyo Metro lost items: +81-3-3834-5577 (Japanese only, use hotel)",
      "Most items are returned within 48 hours. Check back in 1 week.",
    ],
  },
  {
    category: "Lost Passport/Documents",
    title: "U.S. Embassy Tokyo",
    phone: "+81-3-6213-0008",
    details: [
      "Address: 1-10-5 Akasaka, Minato-ku, Tokyo",
      "Open 9:00–12:00, 13:00–16:00 Mon–Fri (closed weekends/holidays)",
      "Bring: passport photo, ID, flight confirmation.",
      "Emergency passport takes ~1 day. Cost ~$145.",
    ],
  },
  {
    category: "Lost Credit Card",
    title: "Contact your bank immediately",
    phone: "Check your card for 24/7 number",
    details: [
      "Call your bank's fraud line before the card is used.",
      "Cards can be cancelled and replaced within 24–48h.",
      "Cash alternative: 7-Eleven ATMs accept foreign cards (no daily limit).",
      "Wise card has no foreign transaction fees + fast replacement.",
    ],
  },
  {
    category: "Travel Insurance Claim",
    title: "Contact your insurance provider",
    phone: "Check your policy documents",
    details: [
      "Medical: get itemized receipts + hospital invoice.",
      "Lost items: get police report number + photos.",
      "Trip cancellation: contact them BEFORE proceeding with alternative plans.",
      "Keep all receipts and documents for claims.",
    ],
  },
  {
    category: "24-Hour Resources",
    title: "Always-Open Options",
    phone: "24/7",
    details: [
      "Convenience stores: 7-Eleven, Lawson, FamilyMart (24h, food, bathrooms, meds).",
      "24-hour izakaya: Most major neighborhoods have them. Ask hotel.",
      "Internet cafes/manga cafes: ~$10/h, have bathrooms, showers, recliners.",
      "Karaoke boxes: Often have overnight rates + free drinks. ~$10–15/h.",
    ],
  },
  {
    category: "COVID/Illness",
    title: "Pharmacist Consultation",
    phone: "Ask at konbini or hotel",
    details: [
      "Pharmacists (yakuzaishi) speak English in major cities.",
      "Can diagnose minor issues + recommend over-the-counter drugs.",
      "Cost: usually free consultation, ~$3–10 for meds.",
      "If fever/serious: go to ER (kyuukyuu by ambulance) or urgent care clinic.",
    ],
  },
];
