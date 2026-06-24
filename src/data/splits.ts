export type SplitItem = {
  id: string;
  label: string;
  ppUSD: number;
  note?: string;
};

export const SPLIT_ITEMS: SplitItem[] = [
  { id: "airbnbs",    label: "Airbnbs (all 3 legs)",     ppUSD: 446, note: "Tokyo + Kyoto + Osaka · 14 nights" },
  { id: "teamlab",    label: "teamLab Planets",           ppUSD: 21  },
  { id: "usj",        label: "USJ + Express Pass",        ppUSD: 80  },
  { id: "ghibli",     label: "Ghibli Museum",             ppUSD: 25  },
  { id: "shibuyasky", label: "Shibuya Sky",               ppUSD: 21  },
  { id: "skytree",    label: "Tokyo Skytree",             ppUSD: 15  },
];
