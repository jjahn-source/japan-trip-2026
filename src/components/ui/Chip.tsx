/** Shared filter/toggle chip. Extracted from the duplicated copies in Explore
 * and NightView so filter rows are consistent and tap-friendly on mobile. */
export function Chip({
  active,
  onClick,
  children,
  color = "rose",
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  color?: "rose" | "fuchsia";
}) {
  const activeCls =
    color === "fuchsia" ? "bg-fuchsia-500 border-fuchsia-400 text-white" : "bg-accent-500 border-accent-400 text-white";
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 rounded-full px-3.5 py-2 text-xs font-semibold border transition-colors whitespace-nowrap ${
        active ? activeCls : "glass text-slate-300 hover:bg-white/10"
      }`}
    >
      {children}
    </button>
  );
}
