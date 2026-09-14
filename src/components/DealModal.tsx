import { useEffect, useRef, useState } from "react";
import { X, Copy, Paperclip, Download, Trash2, Send, CalendarClock } from "lucide-react";
import type { Activity, Attachment, Deal, DivisionKey, Segment, StageKey } from "../types";
import {
  cloneDeal,
  createCompany,
  createContact,
  createDeal,
  createTask,
  deleteDeal,
  getActivities,
  getContactsByCompany,
  getDivisions,
  getStagesLive,
  logActivity,
  restoreDeal,
  subscribe,
  updateDeal,
} from "../lib/store";
import { useCompanies, useContacts, useUsers } from "../lib/use-store";
import { formatZAR, formatDate, findSimilarName } from "../lib/format";
import { addAttachment, deleteAttachment, formatFileSize, getAttachments } from "../lib/attachments";
import { DivisionBadge } from "./DivisionBadge";
import { useAuth } from "../lib/auth";
import { useToast } from "../lib/toast";

const SEGMENTS: Segment[] = ["Commercial", "Industrial", "Forecourt", "MDU"];

// Fixed per client request (email, Sep 2026) — Product Line is a plain
// dropdown of these four now, not a free-text field suggesting a division's
// product lines.
const PRODUCT_LINES = ["Water", "Security", "Solar", "Fibre"];

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
  const { user } = useAuth();
  const { show: showToast } = useToast();
  const companies = useCompanies();
  const contacts = useContacts();
  const users = useUsers();
  const isNew = !deal;
  const divisions = getDivisions();
  const stages = getStagesLive();

  const [title, setTitle] = useState(deal?.title ?? "");
  const [companyName, setCompanyName] = useState(() => companies.find((c) => c.id === deal?.companyId)?.name ?? "");
  const [primaryContactId, setPrimaryContactId] = useState(deal?.primaryContactId ?? "");
  const [division, setDivision] = useState<DivisionKey>(deal?.division ?? defaultDivision ?? "secure");
  const [segment, setSegment] = useState<Segment | "">(deal?.segment ?? "");
  const [site, setSite] = useState(deal?.site ?? "");
  const [productLine, setProductLine] = useState(deal?.productLine ?? "");
  const [stage, setStage] = useState<StageKey>(deal?.stage ?? defaultStage ?? "lead");
  const [lostReason, setLostReason] = useState(deal?.lostReason ?? "");
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
  const [addingContact, setAddingContact] = useState(false);
  const [newContactName, setNewContactName] = useState("");
  const [newContactEmail, setNewContactEmail] = useState("");

  const [activities, setActivities] = useState<Activity[]>([]);
  const [newNote, setNewNote] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Activity feed + attachments only exist for a deal that's already been
  // saved (they're keyed by dealId) — refresh whenever the store changes so
  // a note added a moment ago shows immediately.
  useEffect(() => {
    if (!deal) return;
    const refresh = () => setActivities(getActivities(deal.id));
    refresh();
    return subscribe(refresh);
  }, [deal]);

  useEffect(() => {
    if (!deal) return;
    getAttachments(deal.id).then(setAttachments);
  }, [deal]);

  const companyContacts = deal ? getContactsByCompany(deal.companyId) : [];
  const similarCompany = !isNew
    ? undefined
    : findSimilarName(
        companyName,
        companies.map((c) => c.name)
      );

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
    if (stage === "lost" && !lostReason.trim()) {
      setError("Say why this deal was lost — price, timing, went with a competitor, etc.");
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
      primaryContactId: primaryContactId || undefined,
      site: site.trim() || undefined,
      division,
      segment: segment || undefined,
      productLine: productLine.trim() || undefined,
      stage,
      lostReason: stage === "lost" ? lostReason.trim() : undefined,
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
      const wasLost = deal.stage === "lost";
      updateDeal(deal.id, payload);
      if (stage === "lost" && !wasLost) {
        logActivity(deal.id, "stage-change", `Marked Lost — ${payload.lostReason}`, user?.id);
      } else {
        logActivity(deal.id, "update", "Deal details updated", user?.id);
      }
    }
    onClose();
  }

  function handleDelete() {
    if (!deal) return;
    const snapshot = deal;
    deleteDeal(snapshot.id);
    onClose();
    showToast(`"${snapshot.title}" deleted`, {
      label: "Undo",
      onClick: () => restoreDeal(snapshot),
    });
  }

  function handleDuplicate() {
    if (!deal) return;
    const clone = cloneDeal(deal.id);
    onClose();
    if (clone) showToast(`Duplicated as "${clone.title}"`);
  }

  function handleAddNote() {
    if (!deal || !newNote.trim()) return;
    logActivity(deal.id, "note", newNote.trim(), user?.id);
    setNewNote("");
  }

  function handleAddFollowUp() {
    if (!deal) return;
    const title = window.prompt("Follow up on what?");
    if (!title || !title.trim()) return;
    const due = window.prompt("Due date (YYYY-MM-DD), or leave blank:");
    createTask({ title: title.trim(), dueDate: due?.trim() || undefined, dealId: deal.id });
    showToast("Follow-up added — see it under Tasks");
  }

  function handleAddContact() {
    if (!deal || !newContactName.trim() || !newContactEmail.trim()) return;
    const contact = createContact({ companyId: deal.companyId, name: newContactName.trim(), email: newContactEmail.trim() });
    setPrimaryContactId(contact.id);
    setAddingContact(false);
    setNewContactName("");
    setNewContactEmail("");
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (!deal || !e.target.files?.length) return;
    setUploading(true);
    try {
      for (const file of Array.from(e.target.files)) {
        await addAttachment(deal.id, file);
      }
      setAttachments(await getAttachments(deal.id));
      logActivity(deal.id, "note", `Attached ${e.target.files.length} file(s)`, user?.id);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleDeleteAttachment(id: string) {
    if (!deal) return;
    await deleteAttachment(id);
    setAttachments(await getAttachments(deal.id));
  }

  function userName(id?: string) {
    if (!id || id === "system") return "System";
    return users.find((u) => u.id === id)?.name ?? "Unknown";
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

          <Field label="Company" span={2}>
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
            {similarCompany ? (
              <p className="mt-1 text-xs font-semibold text-orange-600">
                Did you mean "{similarCompany}"?{" "}
                <button type="button" onClick={() => setCompanyName(similarCompany)} className="underline">
                  Use that instead
                </button>
                {" · "}otherwise this will create a new, separate company.
              </p>
            ) : (
              <p className="mt-1 text-xs text-neutral-400">
                Matches an existing company if the name matches one, otherwise creates a new one — no need to add the company first.
              </p>
            )}
          </Field>

          {!isNew && (
            <Field label="Primary contact" span={2}>
              {addingContact ? (
                <div className="flex flex-wrap gap-2">
                  <input value={newContactName} onChange={(e) => setNewContactName(e.target.value)} className="input" placeholder="Name" />
                  <input value={newContactEmail} onChange={(e) => setNewContactEmail(e.target.value)} className="input" placeholder="Email" type="email" />
                  <button type="button" onClick={handleAddContact} className="whitespace-nowrap text-xs font-semibold text-pink-600">
                    Save contact
                  </button>
                  <button type="button" onClick={() => setAddingContact(false)} className="whitespace-nowrap text-xs font-semibold text-neutral-500">
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <select value={primaryContactId} onChange={(e) => setPrimaryContactId(e.target.value)} className="input">
                    <option value="">—</option>
                    {companyContacts.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.email})
                      </option>
                    ))}
                  </select>
                  <button type="button" onClick={() => setAddingContact(true)} className="whitespace-nowrap text-xs font-semibold text-pink-600">
                    + New
                  </button>
                </div>
              )}
            </Field>
          )}

          <Field label="Site">
            <input value={site} onChange={(e) => setSite(e.target.value)} className="input" placeholder="e.g. Kingsburgh" />
          </Field>

          <Field label="Division">
            <select value={division} onChange={(e) => setDivision(e.target.value as DivisionKey)} className="input">
              {divisions.map((d) => (
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
            <select value={productLine} onChange={(e) => setProductLine(e.target.value)} className="input">
              <option value="">—</option>
              {PRODUCT_LINES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
              {productLine && !PRODUCT_LINES.includes(productLine) && (
                <option value={productLine}>{productLine} (legacy)</option>
              )}
            </select>
          </Field>

          <Field label="Stage">
            <select value={stage} onChange={(e) => setStage(e.target.value as StageKey)} className="input">
              {stages.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.label}
                </option>
              ))}
            </select>
          </Field>

          {stage === "lost" && (
            <Field label="Reason lost" span={2}>
              <input
                value={lostReason}
                onChange={(e) => setLostReason(e.target.value)}
                className="input"
                placeholder="e.g. Price, timing, went with a competitor…"
              />
            </Field>
          )}

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

        {!isNew && (
          <div className="mt-6 space-y-3">
            <div className="text-xs font-bold uppercase tracking-widest text-neutral-400">Attachments</div>
            <div className="space-y-1.5">
              {attachments.map((a) => (
                <div key={a.id} className="flex items-center gap-2 rounded-lg border border-neutral-100 px-3 py-2 text-sm">
                  <Paperclip className="h-3.5 w-3.5 shrink-0 text-neutral-400" />
                  <span className="min-w-0 flex-1 truncate">{a.filename}</span>
                  <span className="shrink-0 text-xs text-neutral-400">{formatFileSize(a.size)}</span>
                  <a href={a.dataUrl} download={a.filename} className="shrink-0 text-neutral-400 hover:text-pink-600">
                    <Download className="h-3.5 w-3.5" />
                  </a>
                  <button type="button" onClick={() => handleDeleteAttachment(a.id)} className="shrink-0 text-neutral-400 hover:text-red-600">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
              {attachments.length === 0 && <p className="text-sm text-neutral-400">No files attached yet.</p>}
            </div>
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-neutral-200 px-4 py-2 text-xs font-semibold hover:border-neutral-400">
              <Paperclip className="h-3.5 w-3.5" />
              {uploading ? "Uploading…" : "Attach a file"}
              <input ref={fileInputRef} type="file" multiple onChange={handleFileChange} disabled={uploading} className="hidden" />
            </label>
          </div>
        )}

        {!isNew && (
          <div className="mt-6">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-widest text-neutral-400">Notes &amp; activity</span>
              <button type="button" onClick={handleAddFollowUp} className="inline-flex items-center gap-1 text-xs font-semibold text-pink-600 hover:underline">
                <CalendarClock className="h-3.5 w-3.5" /> Add follow-up
              </button>
            </div>
            <div className="flex gap-2">
              <input
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddNote()}
                className="input"
                placeholder="Called client, waiting on their sign-off…"
              />
              <button type="button" onClick={handleAddNote} className="shrink-0 rounded-full bg-neutral-900 px-4 text-white">
                <Send className="h-3.5 w-3.5" />
              </button>
            </div>
            <ul className="mt-3 max-h-40 space-y-2 overflow-y-auto scroll-thin">
              {activities.map((a) => (
                <li key={a.id} className="rounded-lg border border-neutral-100 px-3 py-2 text-sm">
                  <div className="text-neutral-700">{a.body}</div>
                  <div className="mt-0.5 text-xs text-neutral-400">
                    {userName(a.userId)} · {formatDate(a.createdAt)}
                  </div>
                </li>
              ))}
              {activities.length === 0 && <li className="text-sm text-neutral-400">No activity logged yet.</li>}
            </ul>
          </div>
        )}

        {error && <p className="mt-3 text-sm font-semibold text-red-600">{error}</p>}

        <div className="mt-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {!isNew && (
              <>
                <button type="button" onClick={handleDelete} className="text-sm font-semibold text-red-600 hover:underline">
                  Delete deal
                </button>
                <button type="button" onClick={handleDuplicate} className="inline-flex items-center gap-1.5 text-sm font-semibold text-neutral-500 hover:text-neutral-800">
                  <Copy className="h-3.5 w-3.5" /> Duplicate
                </button>
              </>
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
