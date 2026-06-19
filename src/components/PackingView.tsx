import { PACKING } from "../data/packing";
import { SectionHeading } from "./SectionHeading";
import { Collapse } from "./ui/Collapse";
import { useLocalStorage } from "../hooks/useLocalStorage";

export function PackingView() {
  const [checked, setChecked] = useLocalStorage<Record<string, boolean>>("packing-state", {});

  const totalItems = PACKING.reduce((sum, g) => sum + g.items.length, 0);
  const checkedCount = PACKING.reduce(
    (sum, g) => sum + g.items.filter((it) => checked[it.id]).length,
    0,
  );

  const toggle = (id: string) => setChecked({ ...checked, [id]: !checked[id] });

  return (
    <section className="section-pad pt-32 pb-16 sm:pb-24">
      <SectionHeading
        kicker="Pack Once, Regret Nothing"
        title="Packing List"
        sub="Five categories, one device-local checklist. Your December survival kit."
      />
      <div className="flex items-center justify-between mb-6 -mt-4">
        <span className="text-sm font-bold text-teal-300">{checkedCount} / {totalItems} packed</span>
        <button
          onClick={() => setChecked({})}
          className="text-xs text-slate-500 hover:text-rose-300 transition-colors"
        >
          Reset all
        </button>
      </div>
      <div className="space-y-3">
        {PACKING.map((group) => {
          const groupChecked = group.items.filter((it) => checked[it.id]).length;
          return (
            <Collapse
              key={group.group}
              defaultOpen
              className="glass rounded-2xl overflow-hidden"
              headerClassName="px-4 sm:px-5 py-4 hover:bg-white/[0.03] transition-colors"
              bodyClassName="px-4 sm:px-5 pb-4"
              title={
                <span className="font-bold flex items-center gap-2.5">
                  <span>{group.emoji}</span>
                  <span>{group.group}</span>
                  <span className="text-[0.65rem] font-bold bg-white/10 text-slate-300 rounded-full px-2 py-0.5 tabular-nums">
                    {groupChecked}/{group.items.length}
                  </span>
                </span>
              }
            >
              <ul className="space-y-1.5 pt-1">
                {group.items.map((item) => (
                  <li key={item.id}>
                    <button
                      onClick={() => toggle(item.id)}
                      className={`w-full flex items-start gap-3 rounded-lg px-2.5 py-2 text-left transition-colors ${
                        checked[item.id]
                          ? "opacity-50 hover:opacity-70"
                          : "hover:bg-white/[0.04]"
                      }`}
                    >
                      <span className={`shrink-0 mt-0.5 w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                        checked[item.id]
                          ? "bg-teal-500 border-teal-400"
                          : "border-white/20 bg-white/5"
                      }`}>
                        {checked[item.id] && (
                          <span className="text-white text-[0.6rem] font-bold leading-none">✓</span>
                        )}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className={`text-sm font-medium leading-snug block ${
                          checked[item.id] ? "line-through text-slate-500" : ""
                        }`}>
                          {item.label}
                        </span>
                        {item.note && (
                          <span className="text-xs text-slate-500 leading-relaxed mt-0.5 block">
                            {item.note}
                          </span>
                        )}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </Collapse>
          );
        })}
      </div>
    </section>
  );
}
