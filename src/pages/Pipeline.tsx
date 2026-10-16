import { DealFilters } from "../components/DealFilters";
import { emptyFilters, filterDeals } from "../lib/deal-filters";
import { useCompanies } from "../lib/use-store";
import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import type { Deal } from "../types";
import { useDeals } from "../lib/use-store";
import { KanbanBoard } from "../components/kanban/KanbanBoard";
import { DealModal } from "../components/DealModal";
import { getDeal } from "../lib/store";

export function PipelinePage() {
  const deals = useDeals();
  const companies=useCompanies();
  const [filters,setFilters]=useState({...emptyFilters});
  const [params, setParams] = useSearchParams();

  const openId = params.get("open");
  const openDeal = openId ? getDeal(openId) : undefined;
  const [selectedDeal, setSelectedDeal] = useState<Deal | undefined>(openDeal);

  const filtered = filterDeals(deals,filters,id=>companies.find(c=>c.id===id)?.name??"");

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

      <DealFilters value={filters} onChange={setFilters}/>

      <KanbanBoard deals={filtered} onOpenDeal={setSelectedDeal} />

      {selectedDeal && <DealModal deal={selectedDeal} onClose={closeModal} />}
    </div>
  );
}
