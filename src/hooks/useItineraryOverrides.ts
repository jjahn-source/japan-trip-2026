import { useEffect, useState } from "react";
import { onSnapshot, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import { FIREBASE_ENABLED, tripDoc } from "../lib/firebase";
import { toast } from "../lib/toast";

export type DayOverride = { order: string[]; skipped: string[] };

export function useItineraryOverrides() {
  const [overrides, setOverrides] = useState<Record<string, DayOverride>>({});

  useEffect(() => {
    if (!FIREBASE_ENABLED || !tripDoc) return;
    return onSnapshot(tripDoc, (snap) => {
      if (snap.exists()) {
        setOverrides((snap.data()?.overrides ?? {}) as Record<string, DayOverride>);
      }
    });
  }, []);

  const skip = async (date: string, key: string, value: boolean): Promise<void> => {
    if (!FIREBASE_ENABLED || !tripDoc) return;
    await updateDoc(tripDoc, {
      [`overrides.${date}.skipped`]: value ? arrayUnion(key) : arrayRemove(key),
    }).catch((err) => { console.error(err); toast.error("Itinerary sync failed — check your connection"); });
  };

  const setOrder = async (date: string, order: string[]): Promise<void> => {
    if (!FIREBASE_ENABLED || !tripDoc) return;
    await updateDoc(tripDoc, { [`overrides.${date}.order`]: order }).catch((err) => { console.error(err); toast.error("Itinerary sync failed — check your connection"); });
  };

  return { overrides, skip, setOrder };
}
