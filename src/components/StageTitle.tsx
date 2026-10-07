import type { Stage } from "../types";
export function StageTitle({stage}: {stage: Stage}) {
 return <span tabIndex={0} className="group relative inline-block cursor-help" aria-label={`${stage.label}: ${stage.description ?? ""}`}>
  {stage.label}<span role="tooltip" className="pointer-events-none absolute left-0 top-full z-50 mt-2 hidden w-64 rounded-lg border border-neutral-200 bg-neutral-50 p-3 text-xs font-normal leading-relaxed text-neutral-600 shadow-lg group-hover:block group-focus:block">{stage.description}</span>
 </span>;
}
