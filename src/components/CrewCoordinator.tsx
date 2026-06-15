import { Users, AlertCircle } from "lucide-react";
import { CREW_ROLES } from "../data/contingencies";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { SectionHeading } from "./SectionHeading";

export function CrewCoordinator() {
  const [assigned, setAssigned] = useLocalStorage<Record<string, string>>(
    "crew-assignments",
    {}
  );

  const assignRole = (role: string, person: string) => {
    setAssigned({ ...assigned, [role]: assigned[role] === person ? "" : person });
  };

  const crewNames = ["Person 1", "Person 2", "Person 3", "Person 4", "Person 5", "Person 6", "Person 7", "Person 8"];

  return (
    <section className="section-pad py-24">
      <SectionHeading
        kicker="Crew"
        title="Role Assignments"
        sub="Who's the navigator? Who handles money? Click to assign."
      />

      <div className="grid gap-4 md:grid-cols-2 mb-8">
        {CREW_ROLES.map((role) => {
          const assignedTo = assigned[role.role];

          return (
            <div key={role.role} className="glass rounded-2xl border border-white/10 p-6">
              <div className="mb-4">
                <h3 className="font-bold text-lg">{role.role}</h3>
                <p className="text-xs text-slate-400">{role.name}</p>
              </div>

              {/* Person selector */}
              <div className="flex gap-1.5 mb-4 flex-wrap">
                {crewNames.map((person) => (
                  <button
                    key={person}
                    onClick={() => assignRole(role.role, person)}
                    className={`text-xs font-bold px-2.5 py-1.5 rounded transition-colors ${
                      assignedTo === person
                        ? "bg-rose-500 text-white"
                        : "bg-white/5 text-slate-300 hover:bg-white/10"
                    }`}
                  >
                    {person.split(" ")[1]}
                  </button>
                ))}
              </div>

              {/* Responsibilities */}
              {assignedTo && (
                <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                  <p className="text-xs font-bold text-emerald-300 mb-2">{assignedTo} owns:</p>
                  <ul className="space-y-1">
                    {role.responsibilities.map((resp, i) => (
                      <li key={i} className="text-xs text-slate-300 flex gap-2">
                        <span className="text-emerald-400 shrink-0">✓</span>
                        <span>{resp}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Backups */}
              <p className="text-[0.7rem] text-slate-500">
                Backups: {role.backups.join(", ")}
              </p>
            </div>
          );
        })}
      </div>

      {/* Unassigned roles warning */}
      {CREW_ROLES.filter((r) => !assigned[r.role]).length > 0 && (
        <div className="glass rounded-2xl border border-amber-500/30 bg-amber-500/5 p-6 mb-8">
          <div className="flex items-start gap-3">
            <AlertCircle size={18} className="text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-amber-300 mb-2">
                {CREW_ROLES.filter((r) => !assigned[r.role]).length} roles unassigned
              </p>
              <p className="text-sm text-slate-300">
                Assign every role before the trip. Even if one person covers multiple, make it explicit.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Philosophy */}
      <div className="glass rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-6">
        <div className="flex items-start gap-3">
          <Users size={18} className="text-cyan-400 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-cyan-300 mb-2">Why roles matter:</h3>
            <p className="text-sm text-slate-300 mb-3">
              Eight people with no structure = chaos. Assign roles and backups. Rotate if you want,
              but make it clear. The CFO owns money decisions, the Navigator owns routing, the Food
              Scout owns restaurant reservations.
            </p>
            <p className="text-xs text-slate-400">
              If someone gets sick/tired, their backup steps in. This keeps the trip running.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
