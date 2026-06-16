import { useEffect, useState } from "react";
import { onSnapshot, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import { FIREBASE_ENABLED, tripDoc } from "../lib/firebase";

export function useStayVotes() {
  const [votes, setVotes] = useState<Record<string, string[]>>({});

  useEffect(() => {
    if (!FIREBASE_ENABLED || !tripDoc) return;
    return onSnapshot(tripDoc, (snap) => {
      if (snap.exists()) setVotes((snap.data()?.stayVotes as Record<string, string[]>) ?? {});
    });
  }, []);

  const getVotes = (leg: string, listingId: string): string[] =>
    votes[`${leg}_${listingId}`] ?? [];

  const toggle = async (leg: string, listingId: string, name: string): Promise<void> => {
    if (!FIREBASE_ENABLED || !tripDoc) return;
    const key = `${leg}_${listingId}`;
    const current = votes[key] ?? [];
    const op = current.includes(name) ? arrayRemove(name) : arrayUnion(name);
    await updateDoc(tripDoc, { [`stayVotes.${key}`]: op }).catch(console.error);
  };

  return { getVotes, toggle };
}
