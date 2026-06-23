import { useEffect, useState } from "react";

export interface DayOptimization {
  weatherAlert?: string;
  crowdAlert?: string;
  transitAlert?: string;
  suggestedSwap?: {
    originalActivity: string;
    suggestedAlt: string;
    reason: string;
  };
  newEvents?: {
    name: string;
    note: string;
    station?: string;
  }[];
  tips?: string[];
}

export interface ItineraryOptimizations {
  generatedAt: string;
  optimizations: Record<string, DayOptimization>;
  globalTips?: string[];
}

const CACHE_TTL = 30 * 60 * 1000; // 30 min
const CACHE_KEY = "itinerary-optimizations";
const DATA_URL = `${import.meta.env.BASE_URL}itinerary-optimizations.json`;

export function useItineraryOptimizations(): {
  data: ItineraryOptimizations | null;
  loading: boolean;
  error: boolean;
} {
  const [data, setData] = useState<ItineraryOptimizations | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(CACHE_KEY);
      if (raw) {
        const { cachedData, ts } = JSON.parse(raw) as {
          cachedData: ItineraryOptimizations;
          ts: number;
        };
        if (Date.now() - ts < CACHE_TTL) {
          setData(cachedData);
          setLoading(false);
          return;
        }
      }
    } catch {}

    fetch(DATA_URL)
      .then((r) => {
        if (!r.ok) throw new Error(`${r.status}`);
        return r.json();
      })
      .then((json: ItineraryOptimizations) => {
        setData(json);
        setError(false);
        sessionStorage.setItem(CACHE_KEY, JSON.stringify({ cachedData: json, ts: Date.now() }));
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  return { data, loading, error };
}
