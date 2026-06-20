import { useEffect, useState } from "react";
import { onSnapshot, updateDoc } from "firebase/firestore";
import { FIREBASE_ENABLED, tripDoc } from "../lib/firebase";
import { CREW, type CrewMember } from "./useIdentity";
import { toast } from "../lib/toast";

export function useSplits() {
  const [settled, setSettled] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!FIREBASE_ENABLED || !tripDoc) return;
    return onSnapshot(tripDoc, (snap) => {
      if (snap.exists()) setSettled((snap.data()?.splits ?? {}) as Record<string, boolean>);
    });
  }, []);

  const toggle = async (memberName: CrewMember): Promise<void> => {
    if (!FIREBASE_ENABLED || !tripDoc) return;
    await updateDoc(tripDoc, {
      [`splits.${memberName}`]: !(settled[memberName] ?? false),
    }).catch((err) => { console.error(err); toast.error("Budget sync failed — check your connection"); });
  };

  const settledCount = CREW.filter((m) => settled[m]).length;

  return { settled, toggle, settledCount };
}
