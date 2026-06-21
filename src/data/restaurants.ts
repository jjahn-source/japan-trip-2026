export type Restaurant = {
  date: string; // ISO date
  city: string;
  name: string;
  cuisine: string;
  party: number; // How many people
  time?: string; // Reservation time if booked
  phone?: string;
  link?: string;
  notes?: string;
  booked: boolean;
  reminderDaysOut?: number; // How many days before trip to book
};

export const RESTAURANTS: Restaurant[] = [
  {
    date: "2026-12-16",
    city: "Tokyo",
    name: "Sushi Saito",
    cuisine: "Omakase sushi",
    party: 8,
    link: "https://www.tableall.com/restaurant/49",
    notes: "Effectively invite-only — requires Amex Centurion concierge or luxury hotel concierge (Aman/Peninsula/Ritz-Carlton Tokyo). Not bookable by the general public. Party of 8 is near-impossible; counter seats ~9 total. Treat as aspirational.",
    booked: false,
    reminderDaysOut: 90,
  },
  {
    date: "2026-12-16",
    city: "Tokyo",
    name: "Ramen Alley (Shinjuku)",
    cuisine: "Tonkotsu ramen",
    party: 8,
    notes: "Walk-in, no reservation. Best late night.",
    booked: true,
    time: "22:30",
  },
  {
    date: "2026-12-17",
    city: "Tokyo",
    name: "Sukiyaki Imaiku",
    cuisine: "Premium sukiyaki",
    party: 8,
    phone: "+81 3-3988-3456",
    notes: "Shared hot pot, family-style. Reserve online.",
    booked: false,
    reminderDaysOut: 7,
  },
  {
    date: "2026-12-18",
    city: "Tokyo",
    name: "Tempura Daikichi",
    cuisine: "Counter tempura",
    party: 4,
    phone: "+81 3-3815-7844",
    link: "https://tabelog.com",
    notes: "Two seatings (4 seats each). Book early.",
    booked: false,
    reminderDaysOut: 10,
  },
  {
    date: "2026-12-22",
    city: "Kyoto",
    name: "Gion Tanto",
    cuisine: "Kaiseki (traditional)",
    party: 8,
    notes: "Book 3 weeks ahead. Geisha district.",
    booked: false,
    reminderDaysOut: 21,
  },
  {
    date: "2026-12-22",
    city: "Kyoto",
    name: "Yudofu (Okutan)",
    cuisine: "Hot pot tofu",
    party: 8,
    phone: "+81 75-771-8709",
    notes: "Traditional Buddhist-style. ⚠️ VERIFY: Okutan Nanzenji closes ~15:45 weekdays — an 18:00 reservation is after closing. Confirm this booking is real or rebook for 12:00–13:00 lunch slot.",
    booked: true,
    time: "18:00",
  },
  {
    date: "2026-12-23",
    city: "Kyoto",
    name: "Okonomiyaki Kiji",
    cuisine: "Okonomiyaki",
    party: 8,
    notes: "Counter seating. Walk-in welcome but can be crowded.",
    booked: false,
  },
  {
    date: "2026-12-24",
    city: "Kyoto",
    name: "Kikunoi (3-Michelin)",
    cuisine: "Kaiseki",
    party: 8,
    notes: "Book 2+ months ahead — December is winter crab season peak. Legendary. Very expensive (¥30,000–100,000+/person). Book via kikunoi.jp/en or tableall.com.",
    booked: false,
    reminderDaysOut: 60,
  },
  {
    date: "2026-12-26",
    city: "Hiroshima",
    name: "Okonomiyaki Hiroshima (Okonomimura)",
    cuisine: "Okonomiyaki",
    party: 8,
    notes: "Multiple stalls. No reservation needed.",
    booked: true,
  },
  {
    date: "2026-12-26",
    city: "Hiroshima",
    name: "Hatsukaichi Sushi",
    cuisine: "Oyster & sushi",
    party: 8,
    phone: "+81 82-927-2111",
    notes: "Local specialty. Reservation preferred.",
    booked: false,
    reminderDaysOut: 5,
  },
  {
    date: "2026-12-27",
    city: "Osaka",
    name: "Takoyaki Kiji",
    cuisine: "Takoyaki (octopus balls)",
    party: 8,
    notes: "Famous chain. Walk-in casual.",
    booked: true,
  },
  {
    date: "2026-12-27",
    city: "Osaka",
    name: "Kushikatsu Daruma",
    cuisine: "Deep-fried skewers",
    party: 8,
    phone: "+81 6-6209-7830",
    link: "https://tabelog.com/en/osaka/A2701/A270206/27004260/",
    notes: "Counter or tables. Reservation recommended for groups at select branches (not the Shinsekai original — walk-in only there).",
    booked: false,
    reminderDaysOut: 7,
  },
];
