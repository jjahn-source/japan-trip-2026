import { useState, useEffect } from "react";

export type DiningAlert = {
  restaurant: string;
  slots: string[];
  url: string;
};

export function useDiningAlerts() {
  const [alerts, setAlerts] = useState<DiningAlert[]>([]);
  const [lastChecked, setLastChecked] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    // Add timestamp to bypass cache
    fetch(`${import.meta.env.BASE_URL}dining-alerts.json?t=${Date.now()}`)
      .then(res => {
        if (!res.ok) throw new Error("Fetch failed");
        return res.json();
      })
      .then(data => {
        if (!mounted) return;
        if (data.alerts && data.alerts.length > 0) {
          setAlerts(data.alerts);
        }
        if (data.lastChecked) setLastChecked(data.lastChecked);
      })
      .catch(() => {
         // silently fail if file doesn't exist yet
      });

    return () => {
      mounted = false;
    };
  }, []);

  return { alerts, lastChecked };
}
