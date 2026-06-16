import { useCrewSync, type CrewEntry } from "../hooks/useCrewSync";
import { CREW, type CrewMember } from "../hooks/useIdentity";
import { FIREBASE_ENABLED } from "../lib/firebase";
import { SectionHeading } from "./SectionHeading";

export function CrewBoard({ myName }: { myName: string | null }) {
  const { crew, update } = useCrewSync();

  if (!FIREBASE_ENABLED) return null;

  const onFlight = CREW.filter((n) => crew[n]?.flightBooked).length;
  const passports = CREW.filter((n) => crew[n]?.passportValid).length;

  return (
    <section id="crew" className="section-pad py-24">
      <SectionHeading
        kicker="Who's In"
        title="Crew Status"
        sub={`${onFlight}/8 on the flight · ${passports}/8 passports ready · tap your card to update`}
      />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {CREW.map((name) => {
          const entry = crew[name] ?? { flightBooked: false, passportValid: false };
          const isMe = name === myName;
          return (
            <CrewCard
              key={name}
              name={name}
              entry={entry}
              isMe={isMe}
              onToggle={(field, val) => update(name, field, val)}
            />
          );
        })}
      </div>
    </section>
  );
}

function CrewCard({
  name,
  entry,
  isMe,
  onToggle,
}: {
  name: CrewMember;
  entry: CrewEntry;
  isMe: boolean;
  onToggle: (field: keyof CrewEntry, val: boolean) => void;
}) {
  const initials = name.length <= 2 ? name : name.slice(0, 2).toUpperCase();
  return (
    <div
      className={`glass rounded-2xl p-4 flex flex-col items-center gap-3 ${
        isMe ? "border border-rose-500/40 bg-rose-500/5" : ""
      }`}
    >
      <div
        className={`w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold ${
          isMe ? "bg-rose-500/30 text-rose-200" : "bg-white/10 text-slate-300"
        }`}
      >
        {initials}
      </div>
      <div className="text-center">
        <p className="text-sm font-semibold leading-none">{name}</p>
        {isMe && (
          <p className="text-[0.6rem] text-rose-400 font-bold uppercase tracking-wide mt-0.5">You</p>
        )}
      </div>
      <div className="w-full space-y-1.5">
        <StatusRow
          emoji="✈"
          label="Flight booked"
          checked={entry.flightBooked}
          editable={isMe}
          onToggle={() => onToggle("flightBooked", !entry.flightBooked)}
        />
        <StatusRow
          emoji="🛂"
          label="Passport valid"
          checked={entry.passportValid}
          editable={isMe}
          onToggle={() => onToggle("passportValid", !entry.passportValid)}
        />
      </div>
    </div>
  );
}

function StatusRow({
  emoji,
  label,
  checked,
  editable,
  onToggle,
}: {
  emoji: string;
  label: string;
  checked: boolean;
  editable: boolean;
  onToggle: () => void;
}) {
  const inner = (
    <div className="flex items-center gap-1.5 text-xs py-1 px-1.5 rounded-lg">
      <span className="text-[0.75rem]">{emoji}</span>
      <span className={`flex-1 leading-none ${checked ? "text-slate-300" : "text-slate-500"}`}>
        {label}
      </span>
      <span
        className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[0.5rem] font-bold ${
          checked ? "bg-emerald-500/30 text-emerald-400" : "bg-white/8 text-slate-600"
        }`}
      >
        {checked ? "✓" : "·"}
      </span>
    </div>
  );

  if (editable) {
    return (
      <button
        type="button"
        onClick={onToggle}
        className="w-full text-left hover:bg-white/5 rounded-lg transition-colors"
      >
        {inner}
      </button>
    );
  }
  return <div>{inner}</div>;
}
