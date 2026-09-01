import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Download, Search } from "lucide-react";
import type { Deal, Segment } from "../types";
import { useCompanies, useDeals, useUsers } from "../lib/use-store";
import { getDeal } from "../lib/store";
import { DivisionBadge } from "../components/DivisionBadge";
import { DealModal } from "../components/DealModal";
import { formatDate, formatZAR } from "../lib/format";
import { STAGES } from "../lib/seed-data";

const SEGMENTS: Segment[] = ["Commercial", "Industrial", "Forecourt", "MDU"];

export function DealsPage() {
  const deals = useDeals();
  const companies = useCompanies();
  const users = useUsers();
  const [query, setQuery] = useState("");
  const [segment, setSegment] = useState<Segment | "All">("All");
  const [params, setParams] = useSearchParams();

  const openId = params.get("open");
  const [selectedDeal, setSelectedDeal] = useState<Deal | undefined>(openId ? getDeal(openId) : undefined);

  const companyName = (id: string) => companies.find((c) => c.id === id)?.name ?? "—";
  const ownerName = (id: string) => users.find((u) => u.id === id)?.name ?? "—";

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

  function closeModal() {
    setSelectedDeal(undefined);
    if (params.has("open")) {
      params.delete("open");
      setParams(params, { replace: true });
    }
  }

  function exportCsv() {
    const header = ["Deal", "Company", "Division", "Segment", "Stage", "Site", "Once-off", "MRR", "ARR", "Owner", "Close date"];
    const rows = filtered.map((d) => [
      d.title,
      companyName(d.companyId),
      d.division,
      d.segment ?? "",
      d.stage,
      d.site ?? "",
      d.onceOff,
      d.mrr,
      d.mrr * 12,
      ownerName(d.ownerId),
      d.closeDate ?? "",
    ]);
    const csv = [header, ...rows].map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "bolide-crm-deals.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-black text-neutral-900">Deals</h1>
          <p className="text-sm text-neutral-500">All opportunities · ZAR, excl. VAT</p>
        </div>
        <button
          onClick={exportCsv}
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
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search deals, sites, companies…"
            className="w-full rounded-full border border-neutral-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-pink-400"
          />
        </div>
        <span className="text-xs font-bold uppercase tracking-widest text-neutral-400">Segment</span>
        <div className="flex gap-1.5">
          <SegmentPill label="All" active={segment === "All"} onClick={() => setSegment("All")} />
          {SEGMENTS.map((s) => (
            <SegmentPill key={s} label={s} active={segment === s} onClick={() => setSegment(s)} />
          ))}
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-neutral-200 bg-white">
        <table className="w-full min-w-[900px] text-sm">
          <thead>
            <tr className="border-b border-neutral-100 text-left text-xs font-bold uppercase tracking-widest text-neutral-400">
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
            </tr>
          </thead>
          <tbody>
            {filtered.map((d) => (
              <tr
                key={d.id}
                onClick={() => setSelectedDeal(d)}
                className="cursor-pointer border-b border-neutral-50 hover:bg-neutral-50"
              >
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
                <td className="px-4 py-3 capitalize text-neutral-700">{STAGES.find((s) => s.key === d.stage)?.label}</td>
                <td className="px-4 py-3 text-neutral-500">{d.site ?? "—"}</td>
                <td className="px-4 py-3 text-right font-semibold">{formatZAR(d.onceOff)}</td>
                <td className="px-4 py-3 text-right">{formatZAR(d.mrr)}</td>
                <td className="px-4 py-3 text-right">{formatZAR(d.mrr * 12)}</td>
                <td className="px-4 py-3 text-neutral-500">{ownerName(d.ownerId)}</td>
                <td className="px-4 py-3 text-neutral-400">{formatDate(d.closeDate)}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={10} className="px-4 py-10 text-center text-neutral-400">
                  No deals match your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

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
