import { useEffect, useState } from "react";
import { onSnapshot, updateDoc } from "firebase/firestore";
import { FIREBASE_ENABLED, tripDoc } from "../lib/firebase";
import { CREW, type CrewMember } from "./useIdentity";

export type CrewEntry = { flightBooked: boolean; passportValid: boolean };
export type CrewData = Record<CrewMember, CrewEntry>;

const DEFAULT: CrewData = Object.fromEntries(
  CREW.map((n) => [n, { flightBooked: false, passportValid: false }])
) as CrewData;

export function useCrewSync() {
  const [crew, setCrew] = useState<CrewData>(DEFAULT);

  useEffect(() => {
    if (!FIREBASE_ENABLED || !tripDoc) return;
    return onSnapshot(tripDoc, (snap) => {
      if (snap.exists()) {
        const raw = (snap.data()?.crew ?? {}) as Partial<CrewData>;
        setCrew({ ...DEFAULT, ...raw } as CrewData);
      }
    });
  }, []);

  const update = async (name: CrewMember, field: keyof CrewEntry, value: boolean): Promise<void> => {
    if (!FIREBASE_ENABLED || !tripDoc) return;
    await updateDoc(tripDoc, { [`crew.${name}.${field}`]: value }).catch(console.error);
  };

  return { crew, update };
}
