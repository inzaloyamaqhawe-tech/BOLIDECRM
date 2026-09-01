import type { DivisionKey } from "../types";
import { DIVISIONS } from "../lib/seed-data";

const DOT_CLASSES: Record<DivisionKey, string> = {
  energy: "bg-division-energy",
  secure: "bg-division-secure",
  connect: "bg-division-connect",
  water: "bg-division-water",
  saas: "bg-division-saas",
};

const BG_CLASSES: Record<DivisionKey, string> = {
  energy: "bg-division-energy/10 text-orange-700",
  secure: "bg-division-secure/10 text-pink-700",
  connect: "bg-division-connect/10 text-sky-700",
  water: "bg-division-water/10 text-sky-600",
  saas: "bg-division-saas/10 text-violet-700",
};

export function DivisionBadge({ division, className = "" }: { division: DivisionKey; className?: string }) {
  const meta = DIVISIONS.find((d) => d.key === division);
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap ${BG_CLASSES[division]} ${className}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${DOT_CLASSES[division]}`} />
      {meta?.name.replace("Bolide ", "") ?? division}
    </span>
  );
}

export function DivisionDot({ division }: { division: DivisionKey }) {
  return <span className={`inline-block h-2 w-2 rounded-full ${DOT_CLASSES[division]}`} />;
}
