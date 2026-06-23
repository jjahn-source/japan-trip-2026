import { useState, useEffect } from "react";

type PriceEntry = { totalUSD: number; raw: string } | { unavailable: true };
type StayPricesData = {
  prices: Record<string, PriceEntry>;
  fetchedAt: string;
  successCount: number;
  total: number;
};

const STATIC_URL = `${import.meta.env.BASE_URL}stays-prices.json`;

let cache: StayPricesData | null = null;

export function useStayPrices() {
  const [data, setData] = useState<StayPricesData | null>(cache);

  useEffect(() => {
    if (cache) return;
    fetch(STATIC_URL)
      .then((r) => (r.ok ? r.json() : null))
      .then((json: StayPricesData | null) => {
        if (json?.prices) {
          cache = json;
          setData(json);
        }
      })
      .catch(() => {});
  }, []);

  return {
    getPrice: (id: string): number | null => {
      const entry = data?.prices[id];
      if (!entry) return null;
      return "totalUSD" in entry ? entry.totalUSD : null;
    },
    isUnavailable: (id: string): boolean => {
      const entry = data?.prices[id];
      return !!entry && "unavailable" in entry;
    },
    fetchedAt: data?.fetchedAt ?? null,
  };
}
