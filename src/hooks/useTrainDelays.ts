import { useState, useEffect } from "react";

export type TrainDelay = {
  name: string;
  company: string;
  source: string;
};

// Lines we actually care about for this trip
export const CRITICAL_LINES = ["山手線", "東海道新幹線", "中央線", "大阪環状線", "御堂筋線", "銀座線", "丸ノ内線"];

export function useTrainDelays() {
  const [delayedLines, setDelayedLines] = useState<TrainDelay[]>([]);
  const [hasMajorDelays, setHasMajorDelays] = useState(false);

  useEffect(() => {
    let mounted = true;

    fetch("https://rti-giken.jp/fhc/api/train_tetsudo/delay.json")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch");
        return res.json();
      })
      .then((data) => {
        if (!mounted) return;

        const delays: TrainDelay[] = data.map((item: { name: string; company: string; source: string }) => ({
          name: item.name,
          company: item.company,
          source: item.source
        }));

        setDelayedLines(delays);

        // Check if any critical lines are delayed
        const majorDelays = delays.some(d =>
          CRITICAL_LINES.some(cl => d.name.includes(cl))
        );
        setHasMajorDelays(majorDelays);
      })
      .catch((err) => {
        console.error("Train delay fetch failed:", err);
        // Silent failure is expected
      });

    return () => {
      mounted = false;
    };
  }, []);

  return { delayedLines, hasMajorDelays };
}
