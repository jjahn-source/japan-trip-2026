import { useEffect, useState } from "react";
import { onSnapshot, updateDoc } from "firebase/firestore";
import { FIREBASE_ENABLED, tripDoc } from "../lib/firebase";
import { CREW, type CrewMember } from "./useIdentity";

export type SplitMap = Record<string, Record<string, boolean>>;

export function useSplits() {
  const [splits, setSplits] = useState<SplitMap>({});

  useEffect(() => {
    if (!FIREBASE_ENABLED || !tripDoc) return;
    return onSnapshot(tripDoc, (snap) => {
      if (snap.exists()) setSplits((snap.data()?.splits ?? {}) as SplitMap);
    });
  }, []);

  const toggle = async (itemId: string, memberName: CrewMember): Promise<void> => {
    if (!FIREBASE_ENABLED || !tripDoc) return;
    const current = splits[itemId]?.[memberName] ?? false;
    await updateDoc(tripDoc, {
      [`splits.${itemId}.${memberName}`]: !current,
    }).catch(console.error);
  };

  const paidCount = (itemId: string): number =>
    CREW.filter((m) => splits[itemId]?.[m]).length;

  return { splits, toggle, paidCount };
}
