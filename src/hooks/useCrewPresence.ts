import { useEffect, useState } from "react";
import { onSnapshot, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import { FIREBASE_ENABLED, tripDoc } from "../lib/firebase";
import { toast } from "../lib/toast";

// key format: "YYYY-MM-DD_activityIndex"
export function useCrewPresence() {
  const [presence, setPresence] = useState<Record<string, string[]>>({});

  useEffect(() => {
    if (!FIREBASE_ENABLED || !tripDoc) return;
    return onSnapshot(tripDoc, (snap) => {
      if (snap.exists()) setPresence((snap.data()?.presence as Record<string, string[]>) ?? {});
    });
  }, []);

  const getPresent = (date: string, idx: number): string[] =>
    presence[`${date}_${idx}`] ?? [];

  const toggle = async (date: string, idx: number, name: string): Promise<void> => {
    if (!FIREBASE_ENABLED || !tripDoc) return;
    const key = `${date}_${idx}`;
    const current = presence[key] ?? [];
    const op = current.includes(name) ? arrayRemove(name) : arrayUnion(name);
    await updateDoc(tripDoc, { [`presence.${key}`]: op }).catch((err) => {
      console.error(err);
      toast.error("Presence sync failed — check your connection");
    });
  };

  return { getPresent, toggle };
}
