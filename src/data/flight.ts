export type FlightLeg = {
  flightNo: string;
  aircraft: string;
  dep: { code: string; time: string; date: string };
  arr: { code: string; time: string; date: string };
};

export type FlightBound = {
  label: string;
  duration: string;
  stop: string;
  legs: FlightLeg[];
};

export const CONFIRMATION = "HLL6GI";
export const AIRLINE = "Delta Air Lines · Main Basic (E)";

export const FLIGHTS: FlightBound[] = [
  {
    label: "Outbound",
    duration: "18h 35m",
    stop: "1 stop · MSP 2h 42m",
    legs: [
      {
        flightNo: "DL 2538",
        aircraft: "Airbus A320",
        dep: { code: "RDU", time: "06:00", date: "Mon Dec 14" },
        arr: { code: "MSP", time: "08:42", date: "Mon Dec 14" },
      },
      {
        flightNo: "DL 121",
        aircraft: "Airbus A350-900",
        dep: { code: "MSP", time: "11:24", date: "Mon Dec 14" },
        arr: { code: "HND", time: "14:35", date: "Tue Dec 15" },
      },
    ],
  },
  {
    label: "Return",
    duration: "20h 38m",
    stop: "1 stop · MSP 6h 55m",
    legs: [
      {
        flightNo: "DL 120",
        aircraft: "Airbus A350-900",
        dep: { code: "HND", time: "17:15", date: "Tue Dec 29" },
        arr: { code: "MSP", time: "13:25", date: "Tue Dec 29" },
      },
      {
        flightNo: "DL 2932",
        aircraft: "Airbus A321",
        dep: { code: "MSP", time: "20:20", date: "Tue Dec 29" },
        arr: { code: "RDU", time: "23:53", date: "Tue Dec 29" },
      },
    ],
  },
];

export const FARE_WARNINGS = [
  "Basic Economy: seats NOT assigned — check in at exactly T-24h (Sun Dec 13, 06:00 EST) or pay up for selection. 14h in a random middle seat is a war crime we can prevent.",
  "Carry-on included; checked bags cost extra — the souvenir-overflow bag is a Dec 29 problem you can solve now by deciding who checks one bag home.",
  "No refunds or changes on this fare — these dates are law. Dec 14 departs whether you feel like it or not.",
  "Booked for 2 so far — the other 6 need to book onto these exact flights ASAP before December pricing climbs another $200.",
  "MSP layover is 2h42m — enough time for a real breakfast and the Crew Draft (Play tab), not enough time to lose a passport.",
  "DL 121 is 14h in coach on an A350 — hydration is not optional. Two glasses of water per hour, skip the third wine, walk every 2h. Arrive functional.",
  "Set watches to JST on takeoff from RDU: arrive Haneda already running on local time. This is the jet-lag play.",
  "Return: MSP layover is 6h55m — long enough for the duty-free whisky to be worth buying at Haneda before departing (carry sealed, do NOT bury in transfer bag).",
];

export const SURVIVAL_NOTES = [
  { icon: "⏰", note: "T-24h check-in alarm: Dec 13, 06:00 EST. Set it now. Seriously." },
  { icon: "💺", note: "Seat selection hack: check in at exactly T-24h and refresh. Exit rows and bulkheads open last. A/F window seats go fastest." },
  { icon: "🧦", note: "Compression socks for the 14h leg. Not negotiable. Your ankles are not too good for this." },
  { icon: "💧", note: "Cabin hydration protocol: water every hour. The chu-hai and the altitude are a bad combo." },
  { icon: "📱", note: "Download offline: Google Maps (Tokyo/Kyoto/Osaka), a Japanese keyboard, and at least one season of something for the A350." },
  { icon: "🛂", note: "Visit Japan Web QR codes BEFORE landing — do not rely on HND WiFi when 400 people need it simultaneously." },
];
