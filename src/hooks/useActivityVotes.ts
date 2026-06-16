import { useEffect, useState } from "react";
import { onSnapshot, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import { FIREBASE_ENABLED, tripDoc } from "../lib/firebase";

// key format: "YYYY-MM-DD:activityIndex" — colon replaced with underscore for Firestore field path
function sanitize(key: string) {
  return key.replace(":", "_");
}

export function useActivityVotes() {
  const [votes, setVotes] = useState<Record<string, string[]>>({});

  useEffect(() => {
    if (!FIREBASE_ENABLED || !tripDoc) return;
    return onSnapshot(tripDoc, (snap) => {
      if (snap.exists()) setVotes((snap.data()?.activityVotes as Record<string, string[]>) ?? {});
    });
  }, []);

  const getVoters = (key: string): string[] => votes[sanitize(key)] ?? [];

  const toggle = async (key: string, name: string): Promise<void> => {
    if (!FIREBASE_ENABLED || !tripDoc) return;
    const k = sanitize(key);
    const current = votes[k] ?? [];
    const op = current.includes(name) ? arrayRemove(name) : arrayUnion(name);
    await updateDoc(tripDoc, { [`activityVotes.${k}`]: op }).catch(console.error);
  };

  return { getVoters, toggle };
}
