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
  "Basic Economy: seats NOT assigned — check in at exactly T-24h or pay for seat selection (14h in a random middle seat is a war crime)",
  "Carry-on included; checked bags cost extra — decide who checks the souvenir-overflow bag home",
  "No refunds or changes on this fare — guard the dates",
  "Booked for 2 so far — the other 6 need to book onto these exact flights ASAP before December pricing climbs",
];
