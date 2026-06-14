// Small navigation helpers shared by global search, the Today banner, and
// Mission Control deep-links.

/** Stable slug for building/[matching] DOM anchor ids. Must be used identically
 * on both the index side and the rendered-element side. */
export function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

/** Smooth-scroll to an element id, polling on a wall-clock deadline so lazily
 * mounted views (and accordions) have time to appear. Falls back silently
 * (caller has already navigated, so the user just lands at the top). */
export function scrollToAnchor(id: string, deadlineMs = 6000): void {
  if (!id) return;
  const start = Date.now();
  const tick = () => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      el.classList.add("anchor-flash");
      setTimeout(() => el.classList.remove("anchor-flash"), 1600);
      return;
    }
    if (Date.now() - start < deadlineMs) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}
