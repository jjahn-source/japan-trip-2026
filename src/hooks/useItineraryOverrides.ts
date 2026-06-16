import { useEffect, useState } from "react";
import { onSnapshot, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import { FIREBASE_ENABLED, tripDoc } from "../lib/firebase";

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
    }).catch(console.error);
  };

  const setOrder = async (date: string, order: string[]): Promise<void> => {
    if (!FIREBASE_ENABLED || !tripDoc) return;
    await updateDoc(tripDoc, { [`overrides.${date}.order`]: order }).catch(console.error);
  };

  const moveActivity = async (
    key: string,
    fromDate: string,
    toDate: string,
    newToOrder: string[],
  ): Promise<void> => {
    if (!FIREBASE_ENABLED || !tripDoc) return;
    await updateDoc(tripDoc, {
      [`overrides.${fromDate}.skipped`]: arrayUnion(key),
      [`overrides.${toDate}.order`]: newToOrder,
    }).catch(console.error);
  };

  return { overrides, skip, setOrder, moveActivity };
}
