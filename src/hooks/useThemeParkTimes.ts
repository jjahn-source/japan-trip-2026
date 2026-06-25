import { useState, useEffect } from "react";

export type RideWaitTime = {
  id: string;
  name: string;
  waitTime: number | null;
  status: string;
};

// Map friendly names to ThemeParks.wiki UUIDs
export const THEME_PARKS = {
  TDL: "3cc919f1-d16d-43e0-8c3f-1dd269bd1a42", // Tokyo Disneyland
  TDS: "67b290d5-3478-4f23-b601-2f8fb71ba803", // Tokyo DisneySea
  USJ: "47f61fac-7586-41ac-ae80-61c9257cf33e", // Universal Studios Japan
};

export function useThemeParkTimes(parkId: string | null) {
  const [waitTimes, setWaitTimes] = useState<RideWaitTime[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!parkId) return;

    let mounted = true;
    setLoading(true);

    fetch(`https://api.themeparks.wiki/v1/entity/${parkId}/live`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch");
        return res.json();
      })
      .then((data) => {
        if (!mounted) return;
        const rides = (data.liveData || [])
          .filter((item: any) => item.entityType === "ATTRACTION")
          .map((item: any) => ({
            id: item.id,
            name: item.name,
            waitTime: item.queue?.STANDBY?.waitTime ?? null,
            status: item.status,
          }))
          .sort((a: RideWaitTime, b: RideWaitTime) => {
            // Sort by wait time descending, then by name
            if (a.waitTime !== b.waitTime) {
               return (b.waitTime || 0) - (a.waitTime || 0);
            }
            return a.name.localeCompare(b.name);
          });
        setWaitTimes(rides);
        setLoading(false);
      })
      .catch((err) => {
        if (!mounted) return;
        setError(err.message);
        setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [parkId]);

  return { waitTimes, loading, error };
}
