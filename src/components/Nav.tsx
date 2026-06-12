import { useState } from "react";
import { Menu, X } from "lucide-react";

const LINKS = [
  { href: "#itinerary", label: "Itinerary" },
  { href: "#bookings", label: "Bookings" },
  { href: "#budget", label: "Budget" },
  { href: "#food", label: "Food" },
  { href: "#packing", label: "Packing" },
  { href: "#tips", label: "Tips" },
];

export function Nav() {
  const [open, setOpen] = useState(false);

  return (
    <header className="fixed top-0 inset-x-0 z-50">
      <nav className="glass mx-auto mt-3 max-w-6xl rounded-2xl px-5 py-3 flex items-center justify-between">
        <a href="#top" className="flex items-center gap-2 font-extrabold tracking-tight">
          <span className="text-xl">⛩️</span>
          <span>
            Japan <span className="text-rose-400">’26</span>
          </span>
        </a>
        <div className="hidden md:flex items-center gap-1">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="px-3 py-1.5 rounded-lg text-sm text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
            >
              {l.label}
            </a>
          ))}
          <span className="ml-2 px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
            DEC 14–29 · 8人
          </span>
        </div>
        <button
          className="md:hidden p-2 rounded-lg hover:bg-white/10"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </nav>
      {open && (
        <div className="glass md:hidden mx-auto mt-2 max-w-6xl rounded-2xl p-3 flex flex-col">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="px-3 py-2.5 rounded-lg text-slate-200 hover:bg-white/10"
            >
              {l.label}
            </a>
          ))}
        </div>
      )}
    </header>
  );
}
