export type Reservation = {
  id: string;
  name: string;
  type: "restaurant" | "activity" | "hotel" | "transport" | "tour";
  date: string; // ISO date
  time?: string;
  city: string;
  bookedVia?: string; // "TableCheck", "SmartEX", "Airbnb", etc.
  bookingLink?: string;
  phone?: string;
  notes?: string;
  confirmed: boolean;
  bookByDate: string; // ISO date - when you need to book by
};

export const RESERVATIONS: Reservation[] = [
  // Flights (already booked)
  {
    id: "flight-outbound",
    name: "DL 2538 RDU → MSP → DL 121 MSP → HND",
    type: "transport",
    date: "2026-12-14",
    time: "06:00",
    city: "RDU → Tokyo",
    bookedVia: "Delta",
    bookingLink: "https://www.delta.com",
    confirmed: true,
    bookByDate: "2026-12-14",
    notes: "Confirmation HLL6GI. Check in 4:30am.",
  },
  {
    id: "flight-return",
    name: "ANA Shin-Osaka → Shinagawa → Haneda T3",
    type: "transport",
    date: "2026-12-29",
    time: "09:30",
    city: "Osaka → Tokyo → RDU",
    bookedVia: "ANA",
    bookingLink: "https://www.ana.co.jp",
    confirmed: true,
    bookByDate: "2026-12-29",
    notes: "Nozomi shinkansen. Leave Osaka house 08:45.",
  },
  // Shinkansen (book Oct 21 for Dec 21 departure, etc.)
  {
    id: "shinkansen-tokyo-kyoto",
    name: "Nozomi Tokyo → Kyoto (8-seat block)",
    type: "transport",
    date: "2026-12-21",
    time: "09:00",
    city: "Tokyo → Kyoto",
    bookedVia: "SmartEX",
    bookingLink: "https://smart-ex.jp/en",
    confirmed: false,
    bookByDate: "2026-11-21",
    notes: "Reserve 1-month window opens 10:00 JST Nov 21. Right side (D/E) for Fuji.",
  },
  {
    id: "shinkansen-osaka-hiroshima",
    name: "Shinkansen Osaka ⇄ Hiroshima (Dec 25)",
    type: "transport",
    date: "2026-12-25",
    time: "08:00",
    city: "Osaka ↔ Hiroshima",
    bookedVia: "SmartEX",
    confirmed: false,
    bookByDate: "2026-11-25",
    notes: "Round trip same day. Book on Nov 25 (1-month window).",
  },
  // Key restaurants (sample - add more)
  {
    id: "rest-sukiyaki-kyoto",
    name: "Sukiyaki Ishimatsu (Kyoto)",
    type: "restaurant",
    date: "2026-12-22",
    time: "18:00",
    city: "Kyoto",
    bookedVia: "TableCheck",
    bookingLink: "https://tabelog.com",
    phone: "+81-75-xxx-xxxx",
    confirmed: false,
    bookByDate: "2026-11-22",
    notes: "Party of 8. Book 4-6 weeks out. High-end wagyu.",
  },
  {
    id: "rest-okonomiyaki-osaka",
    name: "Okonomiyaki Kiji (Osaka)",
    type: "restaurant",
    date: "2026-12-24",
    time: "17:30",
    city: "Osaka",
    bookedVia: "Direct call",
    phone: "+81-6-6211-0743",
    confirmed: false,
    bookByDate: "2026-12-01",
    notes: "Party of 8. Call 2 weeks ahead. Christmas Eve, expect crowds.",
  },
  // Activities needing advance booking
  {
    id: "teamlab-tokyo",
    name: "teamLab Planets (Tokyo)",
    type: "activity",
    date: "2026-12-16",
    time: "14:00",
    city: "Tokyo",
    bookedVia: "Official site",
    bookingLink: "https://planets.teamlab.art",
    confirmed: false,
    bookByDate: "2026-12-02",
    notes: "Timed entry every 30 min. Book 2 weeks ahead for groups. ~$30/person.",
  },
  {
    id: "ghibli-tokyo",
    name: "Ghibli Museum (Tokyo)",
    type: "activity",
    date: "2026-12-18",
    time: "10:00",
    city: "Tokyo",
    bookedVia: "Lawson tickets",
    bookingLink: "https://www.lawson.co.jp",
    confirmed: false,
    bookByDate: "2026-11-10",
    notes: "Tickets drop Dec 10, 10:00 JST. Sells out in minutes. All 8 try at once.",
  },
  {
    id: "sumo-tokyo",
    name: "Sumo Morning Practice (Ryogoku)",
    type: "activity",
    date: "2026-12-17",
    time: "07:00",
    city: "Tokyo",
    bookedVia: "Tour guide",
    confirmed: false,
    bookByDate: "2026-12-01",
    notes: "Book via tour operator. Stables don't take walk-ins. Includes chanko lunch.",
  },
  // Hotels (samples)
  {
    id: "hotel-tokyo",
    name: "Tokyo Airbnb (Shinjuku area)",
    type: "hotel",
    date: "2026-12-15",
    city: "Tokyo",
    bookedVia: "Airbnb",
    bookingLink: "https://www.airbnb.com",
    confirmed: true,
    bookByDate: "2026-12-15",
    notes: "Dec 15-21. Yamato luggage pickup arranged with host.",
  },
  {
    id: "hotel-kyoto",
    name: "Kyoto Airbnb (Higashiyama)",
    type: "hotel",
    date: "2026-12-21",
    city: "Kyoto",
    bookedVia: "Airbnb",
    confirmed: true,
    bookByDate: "2026-12-21",
    notes: "Dec 21-24. Daypack-only stay. Bags ship to Osaka.",
  },
  {
    id: "hotel-osaka",
    name: "Osaka Airbnb (Dotonbori area)",
    type: "hotel",
    date: "2026-12-24",
    city: "Osaka",
    bookedVia: "Airbnb",
    confirmed: true,
    bookByDate: "2026-12-24",
    notes: "Dec 24-29. Luggage arrives Dec 21 evening. Final home base.",
  },
];
