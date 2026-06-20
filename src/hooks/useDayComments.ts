import { useEffect, useState } from "react";
import { collection, addDoc, query, orderBy, onSnapshot } from "firebase/firestore";
import { FIREBASE_ENABLED, db } from "../lib/firebase";
import { toast } from "../lib/toast";

export type DayComment = { id: string; date: string; author: string; text: string; at: string };

export function useDayComments() {
  const [comments, setComments] = useState<DayComment[]>([]);

  useEffect(() => {
    if (!FIREBASE_ENABLED || !db) return;
    const col = collection(db, "trips", "japan-2026", "dayComments");
    const q = query(col, orderBy("at"));
    return onSnapshot(q, (snap) => {
      setComments(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<DayComment, "id">) })));
    });
  }, []);

  const forDate = (date: string): DayComment[] => comments.filter((c) => c.date === date);

  const add = async (date: string, author: string, text: string): Promise<void> => {
    if (!FIREBASE_ENABLED || !db || !text.trim()) return;
    await addDoc(collection(db, "trips", "japan-2026", "dayComments"), {
      date,
      author,
      text: text.trim().slice(0, 1000),
      at: new Date().toISOString(),
    }).catch((err) => { console.error(err); toast.error("Comment sync failed — check your connection"); });
  };

  return { forDate, add };
}
