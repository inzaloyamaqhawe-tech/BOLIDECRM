import { DragDropContext, Droppable, type DropResult } from "@hello-pangea/dnd";
import type { Deal, StageKey } from "../../types";
import { STAGES } from "../../lib/seed-data";
import { moveDealStage } from "../../lib/store";
import { formatZAR } from "../../lib/format";
import { KanbanCard } from "./KanbanCard";

const STAGE_DOT: Record<StageKey, string> = {
  lead: "bg-neutral-400",
  qualified: "bg-sky-500",
  quote: "bg-violet-500",
  negotiation: "bg-orange-500",
  won: "bg-emerald-500",
  lost: "bg-red-500",
};

export function KanbanBoard({ deals, onOpenDeal }: { deals: Deal[]; onOpenDeal: (deal: Deal) => void }) {
  function handleDragEnd(result: DropResult) {
    const { destination, draggableId } = result;
    if (!destination) return;
    moveDealStage(draggableId, destination.droppableId as StageKey);
  }

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4 scroll-thin">
        {STAGES.map((stage) => {
          const stageDeals = deals.filter((d) => d.stage === stage.key);
          const onceOffTotal = stageDeals.reduce((sum, d) => sum + d.onceOff, 0);
          const mrrTotal = stageDeals.reduce((sum, d) => sum + d.mrr, 0);

          return (
            <div key={stage.key} className="w-72 shrink-0">
              <div className="mb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-bold text-neutral-800">
                    <span className={`h-2 w-2 rounded-full ${STAGE_DOT[stage.key]}`} />
                    {stage.label}
                  </div>
                  <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-bold text-neutral-500">{stageDeals.length}</span>
                </div>
                <div className="mt-0.5 text-xs text-neutral-400">
                  {formatZAR(onceOffTotal)} once-off · {formatZAR(mrrTotal)}/m
                </div>
              </div>

              <Droppable droppableId={stage.key}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`min-h-[120px] rounded-xl p-1 transition ${snapshot.isDraggingOver ? "bg-pink-50" : ""}`}
                  >
                    {stageDeals.map((deal, index) => (
                      <KanbanCard key={deal.id} deal={deal} index={index} onOpen={onOpenDeal} />
                    ))}
                    {provided.placeholder}
                    {stageDeals.length === 0 && (
                      <div className="rounded-xl border-2 border-dashed border-neutral-200 p-6 text-center text-xs text-neutral-400">
                        Drop a deal here
                      </div>
                    )}
                  </div>
                )}
              </Droppable>
            </div>
          );
        })}
      </div>
    </DragDropContext>
  );
}
