import { useEffect, useState } from "react";

export interface TravelIntel {
  exchangeRate: { usd_jpy: number; source: string; date: string } | null;
  advisory: { score: number | null; level: string; name: string } | null;
  fetchedAt: string | null;
}

const CACHE_TTL = 30 * 60 * 1000; // 30 min
const CACHE_KEY = "travel-intel";
const DATA_URL = `${import.meta.env.BASE_URL}travel-intel.json`;

export function useTravelIntel(): { intel: TravelIntel; loading: boolean; error: boolean } {
  const [intel, setIntel] = useState<TravelIntel>({
    exchangeRate: null,
    advisory: null,
    fetchedAt: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(CACHE_KEY);
      if (raw) {
        const { data, ts } = JSON.parse(raw) as { data: TravelIntel; ts: number };
        if (Date.now() - ts < CACHE_TTL) {
          setIntel(data);
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
      .then(
        (json: {
          exchangeRate?: TravelIntel["exchangeRate"];
          advisory?: TravelIntel["advisory"];
          fetchedAt?: string;
        }) => {
          const data: TravelIntel = {
            exchangeRate: json.exchangeRate ?? null,
            advisory: json.advisory ?? null,
            fetchedAt: json.fetchedAt ?? null,
          };
          setIntel(data);
          setError(false);
          sessionStorage.setItem(CACHE_KEY, JSON.stringify({ data, ts: Date.now() }));
        },
      )
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  return { intel, loading, error };
}
