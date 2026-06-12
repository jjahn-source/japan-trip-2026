export type Booking = {
  id: string;
  what: string;
  when: string; // human-readable deadline
  deadline: string; // ISO date for urgency sorting
  detail: string;
  priority: "critical" | "high" | "medium";
  url?: string;
};

export const BOOKINGS: Booking[] = [
  {
    id: "flights",
    what: "Flights for 8 → Tokyo (HND/NRT)",
    when: "NOW — book ASAP",
    deadline: "2026-07-01",
    detail: "December holiday fares climb fast. Book all 8 on one record locator so seat assignments stay together. Fly into Tokyo, out of Tokyo (we loop back).",
    priority: "critical",
  },
  {
    id: "hotels",
    what: "Hotels: Tokyo (x5 nts), Kyoto (x4), Osaka (x4), Tokyo (x2)",
    when: "NOW — December is peak illumination season",
    deadline: "2026-07-15",
    detail: "For 8: either 4 twin rooms or whole-apartment rentals. Stay near Shinjuku/Shibuya (Tokyo), Kyoto Stn/Kawaramachi (Kyoto), Namba (Osaka). Free-cancellation rates = book now, optimize later.",
    priority: "critical",
  },
  {
    id: "ryokan",
    what: "Hakone ryokan w/ kaiseki + onsen (Dec 18)",
    when: "NOW — 8-person ryokan capacity is scarce",
    deadline: "2026-07-15",
    detail: "Look for two 4-person rooms with dinner+breakfast plans. Ryokans this size book out 6 months ahead for December weekends.",
    priority: "critical",
  },
  {
    id: "teamlab",
    what: "teamLab Planets × 8 (Dec 17)",
    when: "Sept 17 — exactly 3 months before",
    deadline: "2026-09-17",
    detail: "Sales open 3 months ahead and morning slots evaporate. Set an alarm for the drop; buy all 8 in one transaction.",
    priority: "high",
    url: "https://teamlabplanets.dmm.com/en",
  },
  {
    id: "nintendo",
    what: "Nintendo Museum lottery (Dec 23)",
    when: "Enter drawing ~Sept–Oct",
    deadline: "2026-09-23",
    detail: "Tickets are awarded by random drawing ~3 months out. Have multiple people in the group apply to raise odds; each winner can bring guests.",
    priority: "high",
    url: "https://museum-tickets.nintendo.com/en",
  },
  {
    id: "usj",
    what: "USJ tickets + Express Pass (Dec 24)",
    when: "~2–3 months out (Sept–Oct)",
    deadline: "2026-10-01",
    detail: "Christmas Eve will be MOBBED. Dated studio passes + Express Pass 7 with Nintendo World timed entry. Express passes for peak dates sell out weeks ahead.",
    priority: "high",
    url: "https://www.usj.co.jp/web/en/us",
  },
  {
    id: "romancecar",
    what: "Romancecar + shinkansen seat blocks",
    when: "1 month before each ride",
    deadline: "2026-11-14",
    detail: "Reserve 8 seats together: Shinjuku→Hakone (Nov 18 opens), Odawara→Kyoto, Shin-Osaka→Hiroshima r/t, Shin-Osaka→Tokyo. Use SmartEX app or station counters. Skip the JR Pass — point-to-point is ~¥38k vs ¥50k pass.",
    priority: "medium",
  },
  {
    id: "ghibli",
    what: "Ghibli Museum (Dec 28, Option A)",
    when: "Nov 10, 10:00 JST sharp",
    deadline: "2026-11-10",
    detail: "December tickets drop on the 10th of November at 10am JST and sell out within minutes. All 8 of us should try simultaneously from different devices.",
    priority: "high",
    url: "https://www.ghibli-museum.jp/en/tickets/",
  },
  {
    id: "shibuyasky",
    what: "Shibuya Sky sunset slot (Dec 15)",
    when: "Dec 1 — 2 weeks before",
    deadline: "2026-12-01",
    detail: "¥3,400 for post-3pm entry. Sunset (~16:30 in December) slots go first. Buy all 8 at once.",
    priority: "medium",
    url: "https://www.shibuya-scramble-square.com/sky/",
  },
  {
    id: "restaurants",
    what: "Group dinner reservations (party of 8!)",
    when: "Rolling — 4–6 weeks out",
    deadline: "2026-11-01",
    detail: "Eight people walk-in = rejection in Japan. Reserve: Shibuya izakaya (12/15), yakiniku (12/16), Pontocho riverside (12/19), Kyoto kaiseki (12/20), Osaka crab/yakiniku (12/26), Tokyo farewell wagyu (12/28). Use TableCheck, Omakase, or hotel concierge.",
    priority: "high",
  },
  {
    id: "esim",
    what: "eSIMs / pocket WiFi for the squad",
    when: "1–2 weeks before",
    deadline: "2026-12-05",
    detail: "Ubigi/Airalo eSIMs (~$10 for 10GB) per person beats one shared pocket WiFi — nobody gets stranded when the group splits.",
    priority: "medium",
  },
  {
    id: "visitjapan",
    what: "Visit Japan Web + travel insurance",
    when: "Week before flight",
    deadline: "2026-12-07",
    detail: "Pre-register immigration + customs QR codes for all 8. Screenshot the QR codes — airport WiFi is flaky.",
    priority: "medium",
    url: "https://vjw-lp.digital.go.jp/en/",
  },
];
