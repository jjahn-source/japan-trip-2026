import { useCallback, useEffect, useState } from "react";

/**
 * localStorage-backed state that stays in sync:
 *  - across browser tabs (native `storage` event)
 *  - across multiple hook instances of the same key in THIS tab (custom event)
 * so the Mission Control dashboard reflects checkmarks made anywhere, live.
 */
export function useLocalStorage<T>(key: string, initial: T) {
  const read = useCallback((): T => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : initial;
    } catch {
      return initial;
    }
  }, [key, initial]);

  const [value, setValue] = useState<T>(read);

  // Write + broadcast to other instances in this tab.
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      window.dispatchEvent(new CustomEvent("local-storage", { detail: key }));
    } catch {
      /* quota / private mode — ignore */
    }
  }, [key, value]);

  // Re-read when another tab (storage) or another in-tab instance (custom) changes this key.
  useEffect(() => {
    const sync = (e: Event) => {
      if (e instanceof StorageEvent && e.key && e.key !== key) return;
      if (e instanceof CustomEvent && e.detail && e.detail !== key) return;
      // Use functional update: return current reference unchanged if data hasn't changed.
      // This prevents the write effect's own dispatch from triggering an infinite re-render loop.
      setValue((cur) => {
        const next = read();
        return JSON.stringify(cur) === JSON.stringify(next) ? cur : next;
      });
    };
    window.addEventListener("storage", sync);
    window.addEventListener("local-storage", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("local-storage", sync);
    };
  }, [key, read]);

  return [value, setValue] as const;
}
