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
const SKIP_FLAIRS = ["Weekly Discussion", "Megathread", "Weekly Thread"];

const REDDIT_URL = "https://www.reddit.com/r/JapanTravel/hot.json?limit=15&raw_json=1";
// allorigins.win /raw returns the upstream response body directly — no wrapping
const PROXY_URL = `https://api.allorigins.win/raw?url=${encodeURIComponent(REDDIT_URL)}`;

function relativeAge(utcSeconds: number): string {
  const diff = Math.floor(Date.now() / 1000) - utcSeconds;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

type RedditChild = {
  data: {
    title: string;
    permalink: string;
    link_flair_text: string | null;
    created_utc: number;
    score: number;
    stickied: boolean;
  };
};

function parseRedditJson(json: unknown): JapanAlert[] {
  return ((json as { data?: { children?: RedditChild[] } })?.data?.children ?? [])
    .map((c) => c.data)
    .filter((d) => !d.stickied && !SKIP_FLAIRS.includes(d.link_flair_text ?? ""))
    .slice(0, 5)
    .map((d) => ({
      title: d.title,
      url: `https://reddit.com${d.permalink}`,
      flair: d.link_flair_text ?? null,
      age: relativeAge(d.created_utc),
      score: d.score,
    }));
}

async function fetchReddit(): Promise<JapanAlert[]> {
  // Try direct first (works in dev / if Reddit ever enables CORS)
  try {
    const r = await fetch(REDDIT_URL);
    if (r.ok) return parseRedditJson(await r.json());
  } catch {}

  // Fall back to allorigins.win proxy
  const r = await fetch(PROXY_URL);
  if (!r.ok) throw new Error(`proxy ${r.status}`);
  return parseRedditJson(await r.json());
}

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

    fetchReddit()
      .then((posts) => {
        setAlerts(posts);
        setError(false);
        sessionStorage.setItem(CACHE_KEY, JSON.stringify({ data: posts, ts: Date.now() }));
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  return { alerts, loading, error };
}
