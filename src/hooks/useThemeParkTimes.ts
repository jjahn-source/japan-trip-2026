import { useState, useEffect } from "react";

export type RideWaitTime = {
  id: string;
  name: string;
  waitTime: number | null;
  status: string;
};

// Map friendly names to ThemeParks.wiki UUIDs
export const THEME_PARKS = {
  TDL: "7340550b-c14d-4def-80bb-acdb51d49a66", // Tokyo Disneyland
  TDS: "b6aa2ac7-2b5d-4f10-9730-1c4b1849fc35", // Tokyo DisneySea
  USJ: "1bb09581-c71c-4235-961f-1ed4fcd85c76", // Universal Studios Japan
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
