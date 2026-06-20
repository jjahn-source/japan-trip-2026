import { useEffect, useState } from "react";
import { collection, addDoc, updateDoc, onSnapshot, doc } from "firebase/firestore";
import { FIREBASE_ENABLED, db } from "../lib/firebase";
import { toast } from "../lib/toast";

const POLL_DURATION_MS = 5 * 60 * 1000; // 5 minutes

export type PollOption = { text: string; votes: string[] };
export type Poll = {
  id: string;
  question: string;
  options: PollOption[];
  createdAt: string;
  expiresAt: string;
  createdBy: string;
};

export function useCrewPolls() {
  const [polls, setPolls] = useState<Poll[]>([]);

  useEffect(() => {
    if (!FIREBASE_ENABLED || !db) return;
    const col = collection(db, "trips", "japan-2026", "polls");
    return onSnapshot(col, (snap) => {
      const all = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Poll, "id">) }));
      setPolls(all.sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 10));
    });
  }, []);

  const create = async (question: string, optionTexts: string[], createdBy: string): Promise<void> => {
    if (!FIREBASE_ENABLED || !db || !question.trim() || optionTexts.length < 2) return;
    const now = new Date().toISOString();
    const expires = new Date(Date.now() + POLL_DURATION_MS).toISOString();
    await addDoc(collection(db, "trips", "japan-2026", "polls"), {
      question: question.trim().slice(0, 200),
      options: optionTexts.map((t) => ({ text: t.trim().slice(0, 100), votes: [] })),
      createdAt: now,
      expiresAt: expires,
      createdBy,
    }).catch((err) => {
      console.error(err);
      toast.error("Failed to create poll");
    });
  };

  const vote = async (pollId: string, optionIndex: number, voterName: string): Promise<void> => {
    if (!FIREBASE_ENABLED || !db) return;
    const poll = polls.find((p) => p.id === pollId);
    if (!poll) return;
    const newOptions = poll.options.map((opt, i) => ({
      ...opt,
      votes:
        i === optionIndex
          ? [...opt.votes.filter((v) => v !== voterName), voterName]
          : opt.votes.filter((v) => v !== voterName),
    }));
    await updateDoc(doc(db, "trips", "japan-2026", "polls", pollId), {
      options: newOptions,
    }).catch((err) => {
      console.error(err);
      toast.error("Vote failed — check your connection");
    });
  };

  const now = new Date();
  const activePolls = polls.filter((p) => new Date(p.expiresAt) > now);
  const recentPolls = polls.filter((p) => new Date(p.expiresAt) <= now).slice(0, 3);

  return { activePolls, recentPolls, create, vote };
}
