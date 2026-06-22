import { useEffect, useState } from "react";

export interface JapanAlert {
  title: string;
  url: string;
  flair: string | null;
  age: string;
  score: number;
}

const CACHE_TTL = 30 * 60 * 1000; // 30 min
const CACHE_KEY = "japan-alerts";

// Skip pinned/megathread posts that don't add travel value
const SKIP_FLAIRS = ["Weekly Discussion", "Megathread", "Weekly Thread"];

function relativeAge(utcSeconds: number): string {
  const diff = Math.floor(Date.now() / 1000) - utcSeconds;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export function useJapanAlerts(): { alerts: JapanAlert[]; loading: boolean } {
  const [alerts, setAlerts] = useState<JapanAlert[]>([]);
  const [loading, setLoading] = useState(true);

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

    fetch("https://www.reddit.com/r/JapanTravel/hot.json?limit=15&raw_json=1")
      .then((r) => r.json())
      .then((json) => {
        const posts: JapanAlert[] = (json?.data?.children ?? [])
          .map((c: { data: { title: string; permalink: string; link_flair_text: string | null; created_utc: number; score: number; stickied: boolean } }) => c.data)
          .filter((d: { stickied: boolean; link_flair_text: string | null }) =>
            !d.stickied && !SKIP_FLAIRS.includes(d.link_flair_text ?? ""),
          )
          .slice(0, 5)
          .map((d: { title: string; permalink: string; link_flair_text: string | null; created_utc: number; score: number }) => ({
            title: d.title,
            url: `https://reddit.com${d.permalink}`,
            flair: d.link_flair_text ?? null,
            age: relativeAge(d.created_utc),
            score: d.score,
          }));

        setAlerts(posts);
        sessionStorage.setItem(CACHE_KEY, JSON.stringify({ data: posts, ts: Date.now() }));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return { alerts, loading };
}
