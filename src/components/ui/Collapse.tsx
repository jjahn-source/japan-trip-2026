import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronDown } from "lucide-react";

/**
 * Progressive-disclosure primitive: a compact, tappable header that reveals its
 * children on click. `title` is always visible; `summary` shows next to it only
 * while collapsed (a one-line teaser so nothing feels hidden). Generalized from
 * the original GuideView accordion so the whole app shares one pattern.
 */
export function Collapse({
  title,
  summary,
  defaultOpen = false,
  className = "",
  headerClassName = "",
  bodyClassName = "",
  children,
}: {
  title: React.ReactNode;
  summary?: React.ReactNode;
  defaultOpen?: boolean;
  className?: string;
  headerClassName?: string;
  bodyClassName?: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={className}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className={`w-full flex items-center justify-between gap-3 text-left min-h-[40px] ${headerClassName}`}
      >
        <span className="min-w-0 flex-1 flex flex-wrap items-baseline gap-x-2">
          {title}
          {!open && summary != null && (
            <span className="text-xs text-slate-500 font-normal truncate">{summary}</span>
          )}
        </span>
        <ChevronDown
          size={16}
          className={`shrink-0 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className={bodyClassName}>{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
