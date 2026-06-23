import { useEffect, useState } from "react";
import { onSnapshot, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import { FIREBASE_ENABLED, tripDoc } from "../lib/firebase";
import { toast } from "../lib/toast";

export type DayOverride = { order: string[]; skipped: string[] };

const LOCAL_STORAGE_KEY = "itinerary-overrides-fallback";

export function useItineraryOverrides() {
  const [overrides, setOverrides] = useState<Record<string, DayOverride>>({});

  useEffect(() => {
    if (!FIREBASE_ENABLED || !tripDoc) {
      // Local storage fallback
      try {
        const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (raw) setOverrides(JSON.parse(raw));
      } catch (err) {
        console.error("Failed to load local overrides:", err);
      }
      return;
    }
    return onSnapshot(tripDoc, (snap) => {
      if (snap.exists()) {
        setOverrides((snap.data()?.overrides ?? {}) as Record<string, DayOverride>);
      }
    });
  }, []);

  const saveLocal = (next: Record<string, DayOverride>) => {
    setOverrides(next);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(next));
    } catch (err) {
      console.error("Failed to save local overrides:", err);
    }
  };

  const skip = async (date: string, key: string, value: boolean): Promise<void> => {
    if (!FIREBASE_ENABLED || !tripDoc) {
      const next = { ...overrides };
      if (!next[date]) next[date] = { order: [], skipped: [] };
      const skipped = new Set(next[date].skipped);
      if (value) skipped.add(key); else skipped.delete(key);
      next[date].skipped = Array.from(skipped);
      saveLocal(next);
      return;
    }
    await updateDoc(tripDoc, {
      [`overrides.${date}.skipped`]: value ? arrayUnion(key) : arrayRemove(key),
    }).catch((err) => {
      console.error(err);
      toast.error("Itinerary sync failed — check your connection");
    });
  };

  const setOrder = async (date: string, order: string[]): Promise<void> => {
    if (!FIREBASE_ENABLED || !tripDoc) {
      const next = { ...overrides };
      if (!next[date]) next[date] = { order: [], skipped: [] };
      next[date].order = order;
      saveLocal(next);
      return;
    }
    await updateDoc(tripDoc, { [`overrides.${date}.order`]: order }).catch((err) => {
      console.error(err);
      toast.error("Itinerary sync failed — check your connection");
    });
  };

  const setAllOverrides = async (newOverrides: Record<string, DayOverride>): Promise<void> => {
    if (!FIREBASE_ENABLED || !tripDoc) {
      saveLocal(newOverrides);
      return;
    }
    await updateDoc(tripDoc, { overrides: newOverrides }).catch((err) => {
      console.error(err);
      toast.error("Itinerary sync failed — check your connection");
    });
  };

  return { overrides, skip, setOrder, setAllOverrides };
}
