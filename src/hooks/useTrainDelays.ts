import { useState, useEffect } from "react";

export type TrainDelay = {
  name: string;
  company: string;
  source: string;
};

// Lines we actually care about for this trip
export const CRITICAL_LINES = ["山手線", "東海道新幹線", "中央線", "大阪環状線", "御堂筋線", "銀座線", "丸ノ内線"];

// The rti-giken delay API has no CORS header, so it can't be fetched from the
// browser. A cron/build script (scripts/refresh-train-delays.mjs) pulls it
// server-side and writes public/train-delays.json, which we read here — same
// static-feed pattern as useTravelIntel / useWeather.
const CACHE_TTL = 10 * 60 * 1000; // 10 min
const CACHE_KEY = "train-delays";
const DATA_URL = `${import.meta.env.BASE_URL}train-delays.json`;

type TrainDelayFeed = {
  delayedLines: TrainDelay[];
  hasMajorDelays: boolean;
  fetchedAt?: string;
};

export function useTrainDelays() {
  const [delayedLines, setDelayedLines] = useState<TrainDelay[]>([]);
  const [hasMajorDelays, setHasMajorDelays] = useState(false);

  useEffect(() => {
    let mounted = true;

    const apply = (feed: TrainDelayFeed) => {
      if (!mounted) return;
      setDelayedLines(Array.isArray(feed.delayedLines) ? feed.delayedLines : []);
      setHasMajorDelays(!!feed.hasMajorDelays);
    };

    try {
      const raw = sessionStorage.getItem(CACHE_KEY);
      if (raw) {
        const { data, ts } = JSON.parse(raw) as { data: TrainDelayFeed; ts: number };
        if (Date.now() - ts < CACHE_TTL) {
          apply(data);
          return;
        }
      }
    } catch {
      // ignore malformed cache
    }

    fetch(DATA_URL)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((feed: TrainDelayFeed) => {
        apply(feed);
        try {
          sessionStorage.setItem(CACHE_KEY, JSON.stringify({ data: feed, ts: Date.now() }));
        } catch {
          // storage full / unavailable — non-fatal
        }
      })
      .catch(() => {
        // Static feed missing/unreachable — degrade silently to "no delays"
      });

    return () => {
      mounted = false;
    };
  }, []);

  return { delayedLines, hasMajorDelays };
}
