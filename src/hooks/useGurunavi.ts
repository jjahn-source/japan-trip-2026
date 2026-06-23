import { useEffect, useState } from "react";

export interface GurunaviRestaurant {
  id: string;
  name: string;
  nameKana?: string;
  category: string;
  url: string;
  address: string;
  opentime?: string;
  holiday?: string;
  budgetLunch?: string;
  budgetDinner?: string;
  imageUrl?: string;
  lat?: number;
  lng?: number;
  pr?: string;
}

export type GurunaviStatus = "idle" | "loading" | "ok" | "error" | "no-key";

const CACHE_TTL = 60 * 60 * 1000; // 1 hour

function cacheKey(area: string, keyword: string) {
  return `gurunavi:${area}:${keyword}`.toLowerCase();
}

function readCache(key: string): GurunaviRestaurant[] | null {
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    const { data, ts } = JSON.parse(raw) as { data: GurunaviRestaurant[]; ts: number };
    if (Date.now() - ts > CACHE_TTL) return null;
    return data;
  } catch {
    return null;
  }
}

function writeCache(key: string, data: GurunaviRestaurant[]) {
  try {
    sessionStorage.setItem(key, JSON.stringify({ data, ts: Date.now() }));
  } catch {}
}

// Gurunavi area codes for our cities
export const GURUNAVI_AREAS: { label: string; areaCode: string; emoji: string }[] = [
  { label: "Tokyo",     areaCode: "AREA110",  emoji: "🗼" },
  { label: "Kyoto",    areaCode: "AREA260",  emoji: "⛩️" },
  { label: "Osaka",    areaCode: "AREA270",  emoji: "🐙" },
  { label: "Hiroshima",areaCode: "AREA340",  emoji: "🕊️" },
  { label: "Kobe",     areaCode: "AREA280",  emoji: "🥩" },
  { label: "Kamakura", areaCode: "AREA140",  emoji: "🌊" },
];

export function useGurunavi(areaCode: string, keyword: string) {
  const [results, setResults] = useState<GurunaviRestaurant[]>([]);
  const [status, setStatus] = useState<GurunaviStatus>("idle");

  useEffect(() => {
    const apiKey = import.meta.env.VITE_GURUNAVI_KEY as string | undefined;
    if (!apiKey) {
      setStatus("no-key");
      return;
    }

    const key = cacheKey(areaCode, keyword);
    const cached = readCache(key);
    if (cached) {
      setResults(cached);
      setStatus("ok");
      return;
    }

    setStatus("loading");

    const params = new URLSearchParams({
      keyid: apiKey,
      areacode_l: areaCode,
      format: "json",
      hit_per_page: "12",
      ...(keyword ? { freeword: keyword } : {}),
    });

    fetch(`https://api.gnavi.co.jp/RestSearchAPI/v3/?${params.toString()}`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((json) => {
        // Gurunavi returns { rest: [...] } or { total_hit_count: 0 }
        const raw: any[] = json?.rest ?? [];
        const parsed: GurunaviRestaurant[] = raw.map((r: any) => ({
          id: r.id,
          name: r.name,
          nameKana: r.name_kana,
          category: r.category,
          url: r.url,
          address: [r.address, r.address_son].filter(Boolean).join(" "),
          opentime: r.opentime,
          holiday: r.holiday,
          budgetLunch: r.budget_lunch,
          budgetDinner: r.budget_dinner,
          imageUrl: r.image_url?.shop_image1 || undefined,
          lat: r.latitude ? parseFloat(r.latitude) : undefined,
          lng: r.longitude ? parseFloat(r.longitude) : undefined,
          pr: r.pr?.pr_short,
        }));
        writeCache(key, parsed);
        setResults(parsed);
        setStatus("ok");
      })
      .catch(() => {
        setStatus("error");
      });
  }, [areaCode, keyword]);

  return { results, status };
}
