import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";

/** Floating "scroll to top" button — appears after you've scrolled a bit.
 * Handy on the long Plan / Explore / Guide pages, especially on mobile. */
export function BackToTop() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 700);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!show) return null;
  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="Back to top"
      className="fixed z-40 right-4 bottom-[calc(1rem+env(safe-area-inset-bottom))] h-11 w-11 grid place-items-center rounded-full bg-rose-500 hover:bg-rose-400 text-white shadow-lg shadow-rose-500/40 transition-colors"
    >
      <ArrowUp size={20} />
    </button>
  );
}
