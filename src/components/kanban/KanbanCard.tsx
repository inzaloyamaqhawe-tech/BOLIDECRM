import { Draggable } from "@hello-pangea/dnd";
import { MapPin } from "lucide-react";
import type { Deal } from "../../types";
import { DivisionBadge } from "../DivisionBadge";
import { formatZAR } from "../../lib/format";
import { useCompanies } from "../../lib/use-store";

/**
 * A single Pipeline card. Dragging still moves it between stages; clicking
 * (rather than dragging) now opens the same deal detail/edit view used from
 * the Deals table, so a quote's customer, products and pricing can be
 * reviewed without needing to move it to Negotiation first.
 */
export function KanbanCard({ deal, index, onOpen }: { deal: Deal; index: number; onOpen: (deal: Deal) => void }) {
  const companies = useCompanies();
  const company = companies.find((c) => c.id === deal.companyId);

  return (
    <Draggable draggableId={deal.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={() => onOpen(deal)}
          className={`mb-3 cursor-pointer rounded-xl border border-neutral-200 bg-white p-4 transition hover:border-pink-300 hover:shadow-md ${
            snapshot.isDragging ? "shadow-lg ring-2 ring-pink-300" : ""
          }`}
        >
          <div className="mb-2 flex items-start justify-between gap-2">
            <h3 className="text-sm font-bold leading-snug text-neutral-900">{deal.title}</h3>
            <DivisionBadge division={deal.division} />
          </div>
          {company && <div className="text-xs text-neutral-500">{company.name}</div>}
          {deal.site && (
            <div className="mt-0.5 flex items-center gap-1 text-xs text-neutral-400">
              <MapPin className="h-3 w-3" /> {deal.site}
            </div>
          )}

          <div className="mt-3 grid grid-cols-3 gap-2 border-t border-neutral-100 pt-3 text-center">
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-wide text-neutral-400">Once-off</div>
              <div className="text-xs font-bold">{formatZAR(deal.onceOff)}</div>
            </div>
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-wide text-neutral-400">MRR</div>
              <div className="text-xs font-bold">{formatZAR(deal.mrr)}</div>
            </div>
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-wide text-neutral-400">ARR</div>
              <div className="text-xs font-bold">{formatZAR(deal.mrr * 12)}</div>
            </div>
          </div>

          {deal.secureDetails?.camerasInstalled != null && (
            <div className="mt-2 text-xs text-neutral-500">
              {deal.secureDetails.camerasInstalled} installed · {deal.secureDetails.camerasMonitored ?? 0} monitored
            </div>
          )}

          {deal.closeDate && <div className="mt-2 text-xs text-neutral-400">{deal.closeDate}</div>}
        </div>
      )}
    </Draggable>
  );
}
