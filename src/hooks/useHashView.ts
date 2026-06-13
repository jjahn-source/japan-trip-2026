import { useEffect, useState } from "react";

export const VIEWS = ["plan", "mission", "route", "stay", "explore", "eat", "night", "play", "guide"] as const;
export type View = (typeof VIEWS)[number];

function parseHash(): View {
  const h = window.location.hash.replace(/^#\/?/, "");
  return (VIEWS as readonly string[]).includes(h) ? (h as View) : "plan";
}

export function useHashView() {
  const [view, setViewState] = useState<View>(parseHash);

  useEffect(() => {
    const onHash = () => setViewState(parseHash());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const setView = (v: View) => {
    window.location.hash = `/${v}`;
    window.scrollTo({ top: 0 });
  };

  return [view, setView] as const;
}
