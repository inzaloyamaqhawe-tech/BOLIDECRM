import { useEffect, useState } from "react";
import { X } from "lucide-react";
import type { Deal, DivisionKey, Segment, StageKey } from "../types";
import { DIVISIONS, STAGES } from "../lib/seed-data";
import { createCompany, createDeal, updateDeal, deleteDeal } from "../lib/store";
import { useCompanies, useUsers } from "../lib/use-store";
import { formatZAR } from "../lib/format";
import { DivisionBadge } from "./DivisionBadge";

const SEGMENTS: Segment[] = ["Commercial", "Industrial", "Forecourt", "MDU"];

interface Props {
  /** Pass an existing deal to edit/view it; omit to create a new one. */
  deal?: Deal;
  /** Pre-select a division when creating fresh (e.g. from a Pipeline column). */
  defaultDivision?: DivisionKey;
  defaultStage?: StageKey;
  onClose: () => void;
}

/**
 * Single modal used everywhere a deal needs to be created, viewed, or edited:
 * the "+ New deal" button, a row click in Deals, and now a card click in the
 * Pipeline board too (previously the Pipeline only let you drag a card
 * between stages — there was no way to see what a client was actually
 * quoted before it became a Deal).
 */
export function DealModal({ deal, defaultDivision, defaultStage, onClose }: Props) {
  const companies = useCompanies();
  const users = useUsers();
  const isNew = !deal;

  const [title, setTitle] = useState(deal?.title ?? "");
  const [companyName, setCompanyName] = useState(() => companies.find((c) => c.id === deal?.companyId)?.name ?? "");
  const [division, setDivision] = useState<DivisionKey>(deal?.division ?? defaultDivision ?? "secure");
  const [segment, setSegment] = useState<Segment | "">(deal?.segment ?? "");
  const [site, setSite] = useState(deal?.site ?? "");
  const [productLine, setProductLine] = useState(deal?.productLine ?? "");
  const [stage, setStage] = useState<StageKey>(deal?.stage ?? defaultStage ?? "lead");
  const [onceOff, setOnceOff] = useState(deal?.onceOff?.toString() ?? "0");
  const [mrr, setMrr] = useState(deal?.mrr?.toString() ?? "0");
  const [ownerId, setOwnerId] = useState(deal?.ownerId ?? users[0]?.id ?? "");
  const [closeDate, setCloseDate] = useState(deal?.closeDate ?? "");
  const [notes, setNotes] = useState(deal?.notes ?? "");

  const [camerasInstalled, setCamerasInstalled] = useState(deal?.secureDetails?.camerasInstalled?.toString() ?? "");
  const [camerasMonitored, setCamerasMonitored] = useState(deal?.secureDetails?.camerasMonitored?.toString() ?? "");
  const [solarKwp, setSolarKwp] = useState(deal?.energyDetails?.solarKwp?.toString() ?? "");
  const [bessKwh, setBessKwh] = useState(deal?.energyDetails?.bessKwh?.toString() ?? "");
  const [ratePerKwh, setRatePerKwh] = useState(deal?.energyDetails?.ratePerKwh?.toString() ?? "");
  const [litresPerDay, setLitresPerDay] = useState(deal?.waterDetails?.litresPerDay?.toString() ?? "");

  const [error, setError] = useState("");

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const divisionMeta = DIVISIONS.find((d) => d.key === division)!;

  function handleSave() {
    if (!title.trim()) {
      setError("Give the deal a title.");
      return;
    }
    const trimmedName = companyName.trim();
    if (!trimmedName) {
      setError("Enter the client's company name.");
      return;
    }
    // Matches an existing company by name (case-insensitive) so typing an
    // existing client's name reuses their record; anything new — a
    // brand-new client — is created on the fly rather than requiring a
    // separate step first.
    const existing = companies.find((c) => c.name.toLowerCase() === trimmedName.toLowerCase());
    const finalCompanyId = existing ? existing.id : createCompany({ name: trimmedName, industry: "—", status: "Prospect", divisions: [division] }).id;

    const payload = {
      title: title.trim(),
      companyId: finalCompanyId,
      site: site.trim() || undefined,
      division,
      segment: segment || undefined,
      productLine: productLine.trim() || undefined,
      stage,
      onceOff: Number(onceOff) || 0,
      mrr: Number(mrr) || 0,
      ownerId,
      closeDate: closeDate || undefined,
      notes: notes.trim() || undefined,
      secureDetails:
        division === "secure"
          ? { camerasInstalled: Number(camerasInstalled) || undefined, camerasMonitored: Number(camerasMonitored) || undefined }
          : undefined,
      energyDetails:
        division === "energy"
          ? {
              solarKwp: Number(solarKwp) || undefined,
              bessKwh: Number(bessKwh) || undefined,
              ratePerKwh: Number(ratePerKwh) || undefined,
            }
          : undefined,
      waterDetails: division === "water" ? { litresPerDay: Number(litresPerDay) || undefined } : undefined,
    };

    if (isNew) {
      createDeal(payload);
    } else {
      updateDeal(deal.id, payload);
    }
    onClose();
  }

  function handleDelete() {
    if (!deal) return;
    if (!confirm(`Delete "${deal.title}"? This can't be undone.`)) return;
    deleteDeal(deal.id);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 pt-12" onClick={onClose}>
      <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-start justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <DivisionBadge division={division} />
            {!isNew && <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-semibold text-neutral-600">{stage}</span>}
          </div>
          <button onClick={onClose} className="rounded-full p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700">
            <X className="h-5 w-5" />
          </button>
        </div>

        <h2 className="mb-1 text-xl font-black">{isNew ? "New deal" : deal!.title}</h2>
        {!isNew && (
          <p className="mb-4 text-sm text-neutral-500">
            {companies.find((c) => c.id === deal!.companyId)?.name} · Once-off {formatZAR(deal!.onceOff)} · {formatZAR(deal!.mrr)}/m (excl. VAT)
          </p>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Title" span={2}>
            <input value={title} onChange={(e) => setTitle(e.target.value)} className="input" placeholder="e.g. AJ — Kingsburgh" />
          </Field>

          <Field label="Company">
            <input
              list="company-names"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="input"
              placeholder="Type a client name — existing or brand new"
            />
            <datalist id="company-names">
              {companies.map((c) => (
                <option key={c.id} value={c.name} />
              ))}
            </datalist>
            <p className="mt-1 text-xs text-neutral-400">
              Matches an existing company if the name matches one, otherwise creates a new one — no need to add the company first.
            </p>
          </Field>

          <Field label="Site">
            <input value={site} onChange={(e) => setSite(e.target.value)} className="input" placeholder="e.g. Kingsburgh" />
          </Field>

          <Field label="Division">
            <select value={division} onChange={(e) => setDivision(e.target.value as DivisionKey)} className="input">
              {DIVISIONS.map((d) => (
                <option key={d.key} value={d.key}>
                  {d.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Segment">
            <select value={segment} onChange={(e) => setSegment(e.target.value as Segment | "")} className="input">
              <option value="">—</option>
              {SEGMENTS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Product line">
            <input list="product-lines" value={productLine} onChange={(e) => setProductLine(e.target.value)} className="input" />
            <datalist id="product-lines">
              {divisionMeta.productLines.map((p) => (
                <option key={p} value={p} />
              ))}
            </datalist>
          </Field>

          <Field label="Stage">
            <select value={stage} onChange={(e) => setStage(e.target.value as StageKey)} className="input">
              {STAGES.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.label}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Once-off (excl. VAT)">
            <input type="number" value={onceOff} onChange={(e) => setOnceOff(e.target.value)} className="input" />
          </Field>

          <Field label="MRR (excl. VAT)">
            <input type="number" value={mrr} onChange={(e) => setMrr(e.target.value)} className="input" />
          </Field>

          <Field label="ARR (computed)">
            <input disabled value={formatZAR((Number(mrr) || 0) * 12)} className="input bg-neutral-50 text-neutral-500" />
          </Field>

          <Field label="Owner">
            <select value={ownerId} onChange={(e) => setOwnerId(e.target.value)} className="input">
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Expected close date">
            <input type="date" value={closeDate} onChange={(e) => setCloseDate(e.target.value)} className="input" />
          </Field>

          {division === "secure" && (
            <>
              <div className="sm:col-span-2 -mb-2 mt-2 text-xs font-bold uppercase tracking-widest text-neutral-400">Secure details</div>
              <Field label="Cameras installed">
                <input type="number" value={camerasInstalled} onChange={(e) => setCamerasInstalled(e.target.value)} className="input" />
              </Field>
              <Field label="Cameras monitored">
                <input type="number" value={camerasMonitored} onChange={(e) => setCamerasMonitored(e.target.value)} className="input" />
              </Field>
            </>
          )}

          {division === "energy" && (
            <>
              <div className="sm:col-span-2 -mb-2 mt-2 text-xs font-bold uppercase tracking-widest text-neutral-400">Energy details</div>
              <Field label="Solar (kWp)">
                <input type="number" value={solarKwp} onChange={(e) => setSolarKwp(e.target.value)} className="input" />
              </Field>
              <Field label="BESS (kWh)">
                <input type="number" value={bessKwh} onChange={(e) => setBessKwh(e.target.value)} className="input" />
              </Field>
              <Field label="Rate (R/kWh)">
                <input type="number" step="0.01" value={ratePerKwh} onChange={(e) => setRatePerKwh(e.target.value)} className="input" />
              </Field>
            </>
          )}

          {division === "water" && (
            <>
              <div className="sm:col-span-2 -mb-2 mt-2 text-xs font-bold uppercase tracking-widest text-neutral-400">Water details</div>
              <Field label="Litres / day">
                <input type="number" value={litresPerDay} onChange={(e) => setLitresPerDay(e.target.value)} className="input" />
              </Field>
            </>
          )}

          <Field label="Notes" span={2}>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="input resize-y" />
          </Field>
        </div>

        {error && <p className="mt-3 text-sm font-semibold text-red-600">{error}</p>}

        <div className="mt-6 flex items-center justify-between">
          <div>
            {!isNew && (
              <button type="button" onClick={handleDelete} className="text-sm font-semibold text-red-600 hover:underline">
                Delete deal
              </button>
            )}
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="rounded-full border border-neutral-200 px-5 py-2.5 text-sm font-semibold">
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="rounded-full bg-brand-gradient px-6 py-2.5 text-sm font-bold text-white shadow-brand"
            >
              {isNew ? "Create deal" : "Save deal"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children, span = 1 }: { label: string; children: React.ReactNode; span?: 1 | 2 }) {
  return (
    <label className={`block ${span === 2 ? "sm:col-span-2" : ""}`}>
      <span className="mb-1 block text-xs font-semibold uppercase tracking-widest text-neutral-500">{label}</span>
      {children}
    </label>
  );
}
