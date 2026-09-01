import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import type { Deal } from "../types";
import { useDeals, useUsers } from "../lib/use-store";
import { OwnerFilterDropdown } from "../components/OwnerFilterDropdown";
import { KanbanBoard } from "../components/kanban/KanbanBoard";
import { DealModal } from "../components/DealModal";
import { getDeal } from "../lib/store";

export function PipelinePage() {
  const deals = useDeals();
  const users = useUsers();
  const [owner, setOwner] = useState<string | "everyone">("everyone");
  const [params, setParams] = useSearchParams();

  const openId = params.get("open");
  const openDeal = openId ? getDeal(openId) : undefined;
  const [selectedDeal, setSelectedDeal] = useState<Deal | undefined>(openDeal);

  const filtered = owner === "everyone" ? deals : deals.filter((d) => d.ownerId === owner);

  function closeModal() {
    setSelectedDeal(undefined);
    if (params.has("open")) {
      params.delete("open");
      setParams(params, { replace: true });
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-black text-neutral-900">Pipeline</h1>
        <p className="text-sm text-neutral-500">Drag deals between stages, or click one to view its details · ZAR, excl. VAT</p>
      </div>

      <div className="flex items-center gap-3">
        <span className="text-xs font-bold uppercase tracking-widest text-neutral-400">Owner</span>
        <OwnerFilterDropdown users={users} value={owner} onChange={setOwner} />
      </div>

      <KanbanBoard deals={filtered} onOpenDeal={setSelectedDeal} />

      {selectedDeal && <DealModal deal={selectedDeal} onClose={closeModal} />}
    </div>
  );
}
