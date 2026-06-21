import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { toast, type ToastEvent } from "../lib/toast";

const DURATION = 4000;

const STYLES: Record<ToastEvent["type"], string> = {
  error: "border-accent-500/40 bg-accent-500/15 text-accent-200",
  success: "border-emerald-500/40 bg-emerald-500/15 text-emerald-200",
  info: "border-slate-500/40 bg-slate-500/15 text-slate-200",
};

export function Toaster() {
  const [toasts, setToasts] = useState<ToastEvent[]>([]);

  useEffect(() => {
    return toast.subscribe((e) => {
      setToasts((prev) => [...prev, e]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== e.id));
      }, DURATION);
    });
  }, []);

  if (!toasts.length) return null;

  return (
    <div
      aria-live="polite"
      aria-atomic="false"
      className="fixed bottom-4 right-4 z-[200] flex flex-col gap-2 max-w-xs w-full"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          role="status"
          className={`flex items-start gap-2.5 rounded-xl border px-3.5 py-2.5 text-sm font-medium shadow-lg backdrop-blur-xl ${STYLES[t.type]}`}
        >
          <span className="flex-1 leading-snug">{t.message}</span>
          <button
            type="button"
            aria-label="Dismiss notification"
            onClick={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))}
            className="shrink-0 mt-0.5 opacity-60 hover:opacity-100 transition-opacity"
          >
            <X size={13} />
          </button>
        </div>
      ))}
    </div>
  );
}
