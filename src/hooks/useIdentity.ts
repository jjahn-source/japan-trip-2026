import { useState } from "react";

export const CREW = ["JJ", "Ethan", "Steven", "Alex", "Charlie", "Kaishun", "Daniel", "Junha"] as const;
export type CrewMember = (typeof CREW)[number];

const KEY = "identity-name";

export function useIdentity() {
  const [name, setName] = useState<CrewMember | null>(() => {
    const stored = localStorage.getItem(KEY);
    return (CREW as readonly string[]).includes(stored ?? "") ? (stored as CrewMember) : null;
  });

  const chooseName = (n: CrewMember) => {
    localStorage.setItem(KEY, n);
    setName(n);
  };

  return { name, chooseName };
}

export function getIdentityName(): CrewMember | null {
  const stored = localStorage.getItem(KEY);
  return (CREW as readonly string[]).includes(stored ?? "") ? (stored as CrewMember) : null;
}
