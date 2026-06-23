import { useEffect, useState } from "react";

export interface CrewBriefing {
  briefing: string;
  generatedAt: string;
  weekNumber: number;
  daysUntilTrip: number;
}

const CACHE_TTL = 60 * 60 * 1000; // 1 hour
const CACHE_KEY = "crew-briefing";
const DATA_URL = `${import.meta.env.BASE_URL}crew-briefing.json`;

export function useCrewBriefing(): { briefing: CrewBriefing | null; loading: boolean } {
  const [briefing, setBriefing] = useState<CrewBriefing | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(CACHE_KEY);
      if (raw) {
        const { data, ts } = JSON.parse(raw) as { data: CrewBriefing; ts: number };
        if (Date.now() - ts < CACHE_TTL) {
          setBriefing(data);
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
      .then((json: CrewBriefing) => {
        setBriefing(json);
        sessionStorage.setItem(CACHE_KEY, JSON.stringify({ data: json, ts: Date.now() }));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return { briefing, loading };
}
