import { CREW, type CrewMember } from "../hooks/useIdentity";

const INITIALS: Record<CrewMember, string> = {
  JJ: "JJ", Ethan: "ET", Steven: "SV", Alex: "AL",
  Charlie: "CH", Kaishun: "KS", Daniel: "DA", Junha: "JH",
};

export function IdentityModal({ open, onChoose }: { open: boolean; onChoose: (n: CrewMember) => void }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 backdrop-blur-sm px-4">
      <div className="glass rounded-2xl p-6 sm:p-8 w-full max-w-sm">
        <p className="text-center text-3xl mb-2">⛩️</p>
        <h2 className="text-xl font-extrabold text-center mb-1">Who are you?</h2>
        <p className="text-xs text-slate-400 text-center mb-6">
          Your status and votes sync to the crew in real time.
        </p>
        <div className="grid grid-cols-4 gap-2">
          {CREW.map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => onChoose(n)}
              className="flex flex-col items-center gap-1.5 rounded-xl bg-white/5 hover:bg-rose-500/20 border border-white/10 hover:border-rose-500/40 px-2 py-3 transition-colors group"
            >
              <span className="w-9 h-9 rounded-full bg-white/10 group-hover:bg-rose-500/30 flex items-center justify-center text-[0.65rem] font-bold text-slate-300 group-hover:text-rose-200 transition-colors">
                {INITIALS[n]}
              </span>
              <span className="text-xs font-semibold">{n}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
