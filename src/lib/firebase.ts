import { initializeApp, type FirebaseApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc, type Firestore, type DocumentReference } from "firebase/firestore";

export const FIREBASE_ENABLED = !!import.meta.env.VITE_FIREBASE_CONFIG;

let _db: Firestore | undefined;
let _tripDoc: DocumentReference | undefined;

if (FIREBASE_ENABLED) {
  try {
    const app: FirebaseApp = initializeApp(JSON.parse(import.meta.env.VITE_FIREBASE_CONFIG as string));
    _db = getFirestore(app);
    _tripDoc = doc(_db, "trips", "japan-2026");
  } catch (err) {
    console.error("[firebase] init failed:", err);
  }
}

export const db = _db;
export const tripDoc = _tripDoc;

export async function initTripDoc(): Promise<void> {
  if (!_tripDoc) return;
  try {
    const snap = await getDoc(_tripDoc);
    if (!snap.exists()) {
      await setDoc(_tripDoc, { bookings: {}, crew: {}, stayVotes: {}, overrides: {}, splits: {}, activityVotes: {} });
    }
  } catch {
    // offline or rules not configured — silently degrade
  }
}
