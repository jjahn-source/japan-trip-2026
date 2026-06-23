import { useEffect, useState } from "react";

export interface JapanAlert {
  title: string;
  url: string;
  flair: string | null;
  age: string;
  score: number;
  relevance?: string;
}

const CACHE_TTL = 30 * 60 * 1000; // 30 min
const CACHE_KEY = "japan-alerts";

// Static file written by GitHub Actions cron — same origin, no CORS issues
const DATA_URL = `${import.meta.env.BASE_URL}reddit-alerts.json`;

export function useJapanAlerts(): { alerts: JapanAlert[]; loading: boolean; error: boolean } {
  const [alerts, setAlerts] = useState<JapanAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(CACHE_KEY);
      if (raw) {
        const { data, ts } = JSON.parse(raw) as { data: JapanAlert[]; ts: number };
        if (Date.now() - ts < CACHE_TTL) {
          setAlerts(data);
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
      .then((json: { posts?: JapanAlert[] }) => {
        const posts = json.posts ?? [];
        setAlerts(posts);
        setError(false);
        if (posts.length > 0) {
          sessionStorage.setItem(CACHE_KEY, JSON.stringify({ data: posts, ts: Date.now() }));
        }
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  return { alerts, loading, error };
}
