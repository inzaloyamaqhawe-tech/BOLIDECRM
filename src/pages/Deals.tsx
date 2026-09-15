import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Download, Search, Trash2, X } from "lucide-react";
import type { Deal, Segment, StageKey } from "../types";
import { useCompanies, useCrm, useDeals, useUsers } from "../lib/use-store";
import { deleteDeal, getDeal, getStagesLive, logActivity, restoreDeal, updateDeal } from "../lib/store";
import { useAuth } from "../lib/auth";
import { useToast } from "../lib/toast";
import { DivisionBadge } from "../components/DivisionBadge";
import { DealModal } from "../components/DealModal";
import { Pagination } from "../components/Pagination";
import { formatDate, formatZAR } from "../lib/format";

const SEGMENTS: Segment[] = ["Commercial", "Industrial", "Forecourt", "MDU"];

export function DealsPage() {
  const deals = useDeals();
  const companies = useCompanies();
  const users = useUsers();
  const stages = useCrm(getStagesLive);
  const { user } = useAuth();
  const { show: showToast } = useToast();
  const [query, setQuery] = useState("");
  const [segment, setSegment] = useState<Segment | "All">("All");
  const [params, setParams] = useSearchParams();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const openId = params.get("open");
  const [selectedDeal, setSelectedDeal] = useState<Deal | undefined>(openId ? getDeal(openId) : undefined);

  const companyName = (id: string) => companies.find((c) => c.id === id)?.name ?? "—";
  const ownerName = (id: string) => users.find((u) => u.id === id)?.name ?? "—";
  const stageLabel = (key: StageKey) => stages.find((s) => s.key === key)?.label ?? key;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return deals.filter((d) => {
      if (segment !== "All" && d.segment !== segment) return false;
      if (!q) return true;
      return (
        d.title.toLowerCase().includes(q) ||
        d.site?.toLowerCase().includes(q) ||
        companyName(d.companyId).toLowerCase().includes(q)
      );
    });
  }, [deals, query, segment, companies]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const paged = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const allVisibleSelected = paged.length > 0 && paged.every((d) => selected.has(d.id));

  function toggleAll() {
    if (allVisibleSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(paged.map((d) => d.id)));
    }
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function closeModal() {
    setSelectedDeal(undefined);
    if (params.has("open")) {
      params.delete("open");
      setParams(params, { replace: true });
    }
  }

  function toCsv(rows: Deal[]) {
    const header = ["Deal", "Company", "Division", "Segment", "Stage", "Site", "Once-off", "MRR", "ARR", "Owner", "Close date"];
    const body = rows.map((d) => [
      d.title,
      companyName(d.companyId),
      d.division,
      d.segment ?? "",
      stageLabel(d.stage),
      d.site ?? "",
      d.onceOff,
      d.mrr,
      d.mrr * 12,
      ownerName(d.ownerId),
      d.closeDate ?? "",
    ]);
    return [header, ...body].map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
  }

  function downloadCsv(csv: string, filename: string) {
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  function bulkChangeStage(stage: StageKey) {
    let reason = "";
    if (stage === "lost") {
      const input = window.prompt(`Why were these ${selected.size} deal(s) lost?`);
      if (!input || !input.trim()) return;
      reason = input.trim();
    }
    selected.forEach((id) => {
      updateDeal(id, { stage, lostReason: stage === "lost" ? reason : undefined });
      logActivity(id, "stage-change", stage === "lost" ? `Marked Lost — ${reason}` : `Moved to ${stageLabel(stage)} (bulk update)`, user?.id);
    });
    setSelected(new Set());
  }

  function bulkChangeOwner(ownerId: string) {
    selected.forEach((id) => {
      updateDeal(id, { ownerId });
      logActivity(id, "update", `Owner changed to ${ownerName(ownerId)} (bulk update)`, user?.id);
    });
    setSelected(new Set());
  }

  function handleDeleteRow(e: React.MouseEvent, deal: Deal) {
    e.stopPropagation();
    deleteDeal(deal.id);
    showToast(`"${deal.title}" deleted`, {
      label: "Undo",
      onClick: () => restoreDeal(deal),
    });
  }

  function bulkDelete() {
    const toDelete = deals.filter((d) => selected.has(d.id));
    if (!confirm(`Delete ${toDelete.length} deal(s)? This can't be undone.`)) return;
    toDelete.forEach((d) => deleteDeal(d.id));
    setSelected(new Set());
    showToast(`${toDelete.length} deal(s) deleted`);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-black text-neutral-900">Deals</h1>
          <p className="text-sm text-neutral-500">All opportunities · ZAR, excl. VAT</p>
        </div>
        <button
          onClick={() => downloadCsv(toCsv(filtered), "bolide-crm-deals.csv")}
          className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-4 py-2 text-sm font-semibold hover:border-neutral-400"
        >
          <Download className="h-4 w-4" /> Export CSV
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-full max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
            placeholder="Search deals, sites, companies…"
            className="w-full rounded-full border border-neutral-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-pink-400"
          />
        </div>
        <span className="text-xs font-bold uppercase tracking-widest text-neutral-400">Segment</span>
        <div className="flex gap-1.5">
          <SegmentPill
            label="All"
            active={segment === "All"}
            onClick={() => {
              setSegment("All");
              setPage(1);
            }}
          />
          {SEGMENTS.map((s) => (
            <SegmentPill
              key={s}
              label={s}
              active={segment === s}
              onClick={() => {
                setSegment(s);
                setPage(1);
              }}
            />
          ))}
        </div>
      </div>

      {selected.size > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-pink-200 bg-pink-50 px-4 py-3">
          <span className="text-sm font-bold text-pink-700">{selected.size} selected</span>
          <select
            defaultValue=""
            onChange={(e) => {
              if (e.target.value) bulkChangeStage(e.target.value as StageKey);
              e.target.value = "";
            }}
            className="input w-auto"
          >
            <option value="" disabled>
              Move to stage…
            </option>
            {stages.map((s) => (
              <option key={s.key} value={s.key}>
                {s.label}
              </option>
            ))}
          </select>
          <select
            defaultValue=""
            onChange={(e) => {
              if (e.target.value) bulkChangeOwner(e.target.value);
              e.target.value = "";
            }}
            className="input w-auto"
          >
            <option value="" disabled>
              Reassign owner…
            </option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
          <button
            onClick={() => downloadCsv(toCsv(deals.filter((d) => selected.has(d.id))), "bolide-crm-selected-deals.csv")}
            className="inline-flex items-center gap-1.5 rounded-full border border-pink-300 bg-white px-3 py-1.5 text-xs font-semibold text-pink-700"
          >
            <Download className="h-3.5 w-3.5" /> Export selected
          </button>
          <button
            onClick={bulkDelete}
            className="inline-flex items-center gap-1.5 rounded-full border border-red-300 bg-white px-3 py-1.5 text-xs font-semibold text-red-600"
          >
            <Trash2 className="h-3.5 w-3.5" /> Delete selected
          </button>
          <button onClick={() => setSelected(new Set())} className="ml-auto inline-flex items-center gap-1 text-xs font-semibold text-pink-700">
            <X className="h-3.5 w-3.5" /> Clear
          </button>
        </div>
      )}

      <div className="overflow-x-auto rounded-2xl border border-neutral-200 bg-white">
        <table className="w-full min-w-[950px] text-sm">
          <thead>
            <tr className="border-b border-neutral-100 text-left text-xs font-bold uppercase tracking-widest text-neutral-400">
              <th className="w-10 px-4 py-3">
                <input type="checkbox" checked={allVisibleSelected} onChange={toggleAll} />
              </th>
              <th className="px-4 py-3">Deal</th>
              <th className="px-4 py-3">Division</th>
              <th className="px-4 py-3">Segment</th>
              <th className="px-4 py-3">Stage</th>
              <th className="px-4 py-3">Site</th>
              <th className="px-4 py-3 text-right">Once-off / Capex</th>
              <th className="px-4 py-3 text-right">MRR</th>
              <th className="px-4 py-3 text-right">ARR</th>
              <th className="px-4 py-3">Owner</th>
              <th className="px-4 py-3">Close</th>
              <th className="w-10 px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {paged.map((d) => (
              <tr key={d.id} onClick={() => setSelectedDeal(d)} className="cursor-pointer border-b border-neutral-50 hover:bg-neutral-50">
                <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                  <input type="checkbox" checked={selected.has(d.id)} onChange={() => toggleOne(d.id)} />
                </td>
                <td className="px-4 py-3">
                  <div className="font-semibold text-neutral-900">{d.title}</div>
                  <div className="text-xs text-neutral-500">
                    {companyName(d.companyId)}
                    {d.productLine ? ` · ${d.productLine}` : ""}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <DivisionBadge division={d.division} />
                </td>
                <td className="px-4 py-3 text-neutral-500">{d.segment ?? "—"}</td>
                <td className="px-4 py-3 text-neutral-700">{stageLabel(d.stage)}</td>
                <td className="px-4 py-3 text-neutral-500">{d.site ?? "—"}</td>
                <td className="px-4 py-3 text-right font-semibold">{formatZAR(d.onceOff)}</td>
                <td className="px-4 py-3 text-right">{formatZAR(d.mrr)}</td>
                <td className="px-4 py-3 text-right">{formatZAR(d.mrr * 12)}</td>
                <td className="px-4 py-3 text-neutral-500">{ownerName(d.ownerId)}</td>
                <td className="px-4 py-3 text-neutral-400">{formatDate(d.closeDate)}</td>
                <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                  <button onClick={(e) => handleDeleteRow(e, d)} aria-label="Delete deal" className="text-neutral-300 hover:text-red-600">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={12} className="px-4 py-10 text-center text-neutral-400">
                  No deals match your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Pagination
        page={currentPage}
        pageSize={pageSize}
        total={filtered.length}
        onPageChange={setPage}
        onPageSizeChange={(size) => {
          setPageSize(size);
          setPage(1);
        }}
      />

      {selectedDeal && <DealModal deal={selectedDeal} onClose={closeModal} />}
    </div>
  );
}

function SegmentPill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
        active ? "bg-brand-gradient text-white shadow-brand" : "border border-neutral-200 text-neutral-600 hover:border-neutral-400"
      }`}
    >
      {label}
    </button>
  );
}
