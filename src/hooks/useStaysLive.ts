import { useState, useEffect } from "react";

export type LiveListing = {
  id: string;
  name: string;
  totalUSD: number;
  ppCost: number;
  nights: number;
  bedrooms: number | null;
  beds: number | null;
  baths: number | null;
  rating: number | null;
  reviews: number | null;
  guestFav: boolean;
  superhost: boolean;
  imgUrl?: string;
  url: string;
};

export type LiveChangelog = {
  type: "new" | "dropped" | "price_drop" | "price_rise";
  id: string;
  name: string;
  totalUSD: number;
  prevUSD?: number;
  delta?: number;
  pct?: number;
};

export type LiveLeg = {
  id: string;
  city: string;
  cityJp: string;
  dates: string;
  nights: number;
  emoji: string;
  startISO: string;
  endISO: string;
  searchUrl: string;
  options: LiveListing[];
  changelog: LiveChangelog[];
};

export type StaysLiveData = {
  fetchedAt: string;
  totalNew: number;
  totalDropped: number;
  legs: LiveLeg[];
};

const STATIC_URL = `${import.meta.env.BASE_URL}stays-live.json`;

let cache: StaysLiveData | null = null;

export function useStaysLive() {
  const [data, setData] = useState<StaysLiveData | null>(cache);

  useEffect(() => {
    if (cache) return;
    fetch(STATIC_URL)
      .then((r) => (r.ok ? r.json() : null))
      .then((json: StaysLiveData | null) => {
        if (json?.legs?.length) {
          cache = json;
          setData(json);
        }
      })
      .catch(() => {});
  }, []);

  return data;
}
