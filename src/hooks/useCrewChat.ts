import { useEffect, useState } from "react";
import { collection, addDoc, query, orderBy, limit, onSnapshot } from "firebase/firestore";
import { FIREBASE_ENABLED, db } from "../lib/firebase";
import { toast } from "../lib/toast";

export type ChatMessage = { id: string; author: string; text: string; at: string };

export function useCrewChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  useEffect(() => {
    if (!FIREBASE_ENABLED || !db) return;
    const col = collection(db, "trips", "japan-2026", "chat");
    const q = query(col, orderBy("at"), limit(150));
    return onSnapshot(q, (snap) => {
      setMessages(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<ChatMessage, "id">) })));
    });
  }, []);

  const send = async (author: string, text: string): Promise<void> => {
    if (!FIREBASE_ENABLED || !db || !text.trim()) return;
    await addDoc(collection(db, "trips", "japan-2026", "chat"), {
      author,
      text: text.trim().slice(0, 500),
      at: new Date().toISOString(),
    }).catch((err) => { console.error(err); toast.error("Message failed to send — check your connection"); });
  };

  return { messages, send };
}
