import { useEffect, useState } from "react";
import { onSnapshot, updateDoc } from "firebase/firestore";
import { FIREBASE_ENABLED, tripDoc } from "../lib/firebase";
import { useLocalStorage } from "./useLocalStorage";
import { getIdentityName } from "./useIdentity";

export type BookingEntry = { done: boolean; by: string | null; at: string | null };

export function useBookingsSync() {
  const [localDone, setLocalDone] = useLocalStorage<Record<string, boolean>>("bookings-done", {});
  const [fsBookings, setFsBookings] = useState<Record<string, BookingEntry>>({});

  useEffect(() => {
    if (!FIREBASE_ENABLED || !tripDoc) return;
    return onSnapshot(tripDoc, (snap) => {
      if (snap.exists()) setFsBookings((snap.data()?.bookings as Record<string, BookingEntry>) ?? {});
    });
  }, []);

  const isDone = (id: string): boolean =>
    FIREBASE_ENABLED ? (fsBookings[id]?.done ?? false) : (localDone[id] ?? false);

  const whoBy = (id: string): string | null =>
    FIREBASE_ENABLED ? (fsBookings[id]?.by ?? null) : null;

  const whenAt = (id: string): string | null =>
    FIREBASE_ENABLED ? (fsBookings[id]?.at ?? null) : null;

  const toggle = async (id: string): Promise<void> => {
    const nowDone = !isDone(id);
    if (!FIREBASE_ENABLED || !tripDoc) {
      setLocalDone((prev) => ({ ...prev, [id]: nowDone }));
      return;
    }
    const name = getIdentityName();
    await updateDoc(tripDoc, {
      [`bookings.${id}.done`]: nowDone,
      [`bookings.${id}.by`]: nowDone ? name : null,
      [`bookings.${id}.at`]: nowDone ? new Date().toISOString() : null,
    }).catch(console.error);
  };

  return { isDone, whoBy, whenAt, toggle };
}
