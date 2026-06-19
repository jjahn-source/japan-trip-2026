import { useEffect, useState } from "react";

export const VIEWS = ["plan", "explore", "eat", "guide", "crew"] as const;
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
    // Compare against the LIVE hash (not the closed-over `view`) so this is
    // correct even if called from a prop/stale render.
    const changed = parseHash() !== v;
    window.location.hash = `/${v}`;
    // Only jump to the top when actually switching tabs — never yank the user
    // up while they're working within the current view.
    if (changed) window.scrollTo({ top: 0 });
  };

  return [view, setView] as const;
}
