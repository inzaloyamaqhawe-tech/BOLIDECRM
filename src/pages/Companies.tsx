import { useState } from "react";
import { Link } from "react-router-dom";
import { Building2, Globe, MapPin, Merge, Phone, X } from "lucide-react";
import { useCompanies, useContacts, useDeals } from "../lib/use-store";
import { mergeCompanies } from "../lib/store";
import { DivisionBadge } from "../components/DivisionBadge";
import { formatZAR } from "../lib/format";

export function CompaniesPage() {
  const companies = useCompanies();
  const deals = useDeals();
  const contacts = useContacts();
  const [showMerge, setShowMerge] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-black text-neutral-900">Companies</h1>
          <p className="text-sm text-neutral-500">Accounts across every division · ZAR, excl. VAT</p>
        </div>
        <button
          onClick={() => setShowMerge(true)}
          className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-4 py-2 text-sm font-semibold hover:border-neutral-400"
        >
          <Merge className="h-4 w-4" /> Merge duplicates
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {companies.map((c) => {
          const companyDeals = deals.filter((d) => d.companyId === c.id);
          const companyContacts = contacts.filter((ct) => ct.companyId === c.id);
          const totalValue = companyDeals.reduce((s, d) => s + d.onceOff, 0);

          return (
            <Link
              key={c.id}
              to={`/companies/${c.id}`}
              className="flex flex-col rounded-2xl border border-neutral-200 bg-white p-5 transition hover:border-pink-300 hover:shadow-md"
            >
              <div className="mb-1 flex items-start justify-between gap-2">
                <h3 className="font-bold text-neutral-900">{c.name}</h3>
                <span className="whitespace-nowrap rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-semibold text-neutral-600">
                  {c.status}
                </span>
              </div>
              <p className="mb-3 text-sm text-neutral-500">{c.industry}</p>

              <div className="mb-4 flex flex-wrap gap-1.5">
                {c.divisions.map((d) => (
                  <DivisionBadge key={d} division={d} />
                ))}
              </div>

              <div className="mb-4 space-y-1.5 text-sm text-neutral-400">
                <div className="flex items-center gap-2">
                  <Globe className="h-3.5 w-3.5" /> {c.website ?? "—"}
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5" /> {c.phone ?? "—"}
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5" /> {c.address ?? "—"}
                </div>
              </div>

              <div className="mt-auto flex items-center justify-between border-t border-neutral-100 pt-3 text-sm">
                <span className="text-neutral-500">
                  {companyDeals.length} deals · {companyContacts.length} contacts
                </span>
                <span className="font-bold text-neutral-900">{formatZAR(totalValue)}</span>
              </div>
            </Link>
          );
        })}
        {companies.length === 0 && (
          <div className="col-span-full rounded-2xl border border-dashed border-neutral-200 p-10 text-center text-neutral-400">
            <Building2 className="mx-auto mb-2 h-8 w-8" />
            No companies yet.
          </div>
        )}
      </div>

      {showMerge && <MergeModal onClose={() => setShowMerge(false)} />}
    </div>
  );
}

function MergeModal({ onClose }: { onClose: () => void }) {
  const companies = useCompanies();
  const [keepId, setKeepId] = useState(companies[0]?.id ?? "");
  const [mergeId, setMergeId] = useState(companies[1]?.id ?? "");

  function handleMerge() {
    if (!keepId || !mergeId || keepId === mergeId) return;
    const keepName = companies.find((c) => c.id === keepId)?.name;
    const mergeName = companies.find((c) => c.id === mergeId)?.name;
    if (!confirm(`Merge "${mergeName}" into "${keepName}"? All its deals and contacts move to "${keepName}", and "${mergeName}" is removed.`)) return;
    mergeCompanies(keepId, mergeId);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-black">Merge duplicate companies</h2>
          <button onClick={onClose} className="rounded-full p-1 text-neutral-400 hover:bg-neutral-100">
            <X className="h-5 w-5" />
          </button>
        </div>
        <p className="mb-4 text-sm text-neutral-500">Useful when a typo created a second record for the same client — fold it back into one.</p>
        <div className="space-y-3">
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-widest text-neutral-500">Keep this company</span>
            <select value={keepId} onChange={(e) => setKeepId(e.target.value)} className="input">
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-widest text-neutral-500">Merge this one into it, then remove it</span>
            <select value={mergeId} onChange={(e) => setMergeId(e.target.value)} className="input">
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="mt-5 flex justify-end gap-3">
          <button onClick={onClose} className="rounded-full border border-neutral-200 px-5 py-2.5 text-sm font-semibold">
            Cancel
          </button>
          <button
            onClick={handleMerge}
            disabled={keepId === mergeId}
            className="rounded-full bg-brand-gradient px-6 py-2.5 text-sm font-bold text-white shadow-brand disabled:opacity-50"
          >
            Merge
          </button>
        </div>
      </div>
    </div>
  );
}
