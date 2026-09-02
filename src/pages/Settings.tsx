import { useState } from "react";
import { Mail, Pencil, Plus, UserPlus, X } from "lucide-react";
import { WHOLESALE_CATALOGUE } from "../lib/seed-data";
import { useCompanies, useCrm, useDeals, useUsers } from "../lib/use-store";
import { createUser, getAllActivities, getDivisions, getStagesLive, updateDivisionMeta, updateStageMeta, updateUser } from "../lib/store";
import { emailDomainAllowed } from "../lib/auth";
import { useAuth } from "../lib/auth";
import { ALLOWED_EMAIL_DOMAINS, type Division, type Stage } from "../types";
import { Avatar } from "../components/Avatar";
import { DivisionBadge } from "../components/DivisionBadge";
import { formatDate, formatZAR } from "../lib/format";

export function SettingsPage() {
  const { user: me } = useAuth();
  const users = useUsers();
  const deals = useDeals();
  const companies = useCompanies();
  const divisions = useCrm(getDivisions);
  const stages = useCrm(getStagesLive);
  const activities = useCrm(getAllActivities);
  const [showInvite, setShowInvite] = useState(false);
  const isAdmin = me?.role === "admin";

  const secureConnect = divisions.filter((d) => d.legalEntity === "Bolide Connect (Pty) Ltd");
  const standalone = divisions.filter((d) => d.legalEntity !== "Bolide Connect (Pty) Ltd");

  function eventLabel(a: (typeof activities)[number]) {
    if (a.dealId) return deals.find((d) => d.id === a.dealId)?.title ?? "Deleted deal";
    if (a.companyId) return companies.find((c) => c.id === a.companyId)?.name ?? "Deleted company";
    return "—";
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-neutral-900">Settings</h1>
        <p className="text-sm text-neutral-500">Divisions, pipeline and access</p>
      </div>

      <Card title="Divisions & product lines" sub={isAdmin ? "Edit a division's description or product lines." : "Only admins can edit this."}>
        <div className="space-y-3">
          {standalone.map((d) => (
            <DivisionRow key={d.key} division={d} editable={isAdmin} />
          ))}
          <div className="pt-2 text-xs font-bold uppercase tracking-widest text-neutral-400">
            Legal entity
            <div className="mt-0.5 text-sm font-black normal-case tracking-normal text-neutral-800">Bolide Connect (Pty) Ltd</div>
          </div>
          {secureConnect.map((d) => (
            <DivisionRow key={d.key} division={d} editable={isAdmin} />
          ))}
        </div>
      </Card>

      <Card title="Herotel Business wholesale catalogue" sub="Wholesale cost prices Bolide pays, ZAR excl. VAT. NRC = once-off, MRC = per month.">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-sm">
            <thead>
              <tr className="border-b border-neutral-100 text-left text-xs font-bold uppercase tracking-widest text-neutral-400">
                <th className="py-2">Package</th>
                <th className="py-2">Family</th>
                <th className="py-2">Access</th>
                <th className="py-2 text-right">NRC</th>
                <th className="py-2 text-right">12mo</th>
                <th className="py-2 text-right">24mo</th>
                <th className="py-2 text-right">36mo</th>
                <th className="py-2 text-right">48mo</th>
                <th className="py-2 text-right">60mo</th>
              </tr>
            </thead>
            <tbody>
              {WHOLESALE_CATALOGUE.map((p) => (
                <tr key={p.package} className="border-b border-neutral-50">
                  <td className="py-2 font-semibold">{p.package}</td>
                  <td className="py-2 text-neutral-500">{p.family}</td>
                  <td className="py-2 text-neutral-500">{p.access}</td>
                  <td className="py-2 text-right font-bold">{formatZAR(p.nrc)}</td>
                  <td className="py-2 text-right">{p.m12 != null ? formatZAR(p.m12) : "—"}</td>
                  <td className="py-2 text-right">{p.m24 != null ? formatZAR(p.m24) : "—"}</td>
                  <td className="py-2 text-right">{p.m36 != null ? formatZAR(p.m36) : "—"}</td>
                  <td className="py-2 text-right">{p.m48 != null ? formatZAR(p.m48) : "—"}</td>
                  <td className="py-2 text-right">{p.m60 != null ? formatZAR(p.m60) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card title="Pipeline stages" sub={isAdmin ? "Edit a stage's label or win probability." : "Only admins can edit this."}>
        <div className="space-y-2">
          {stages.map((s) => (
            <StageRow key={s.key} stage={s} editable={isAdmin} />
          ))}
        </div>
      </Card>

      <Card title="Access" sub="Sign-up is limited to Bolide Group email domains.">
        <div className="mb-4 flex flex-wrap gap-2">
          {ALLOWED_EMAIL_DOMAINS.map((d) => (
            <span key={d} className="rounded-full bg-pink-50 px-3 py-1 text-xs font-semibold text-pink-700">
              @{d}
            </span>
          ))}
        </div>
        <div className="space-y-2">
          {users.map((u) => (
            <div key={u.id} className="flex items-center gap-3 rounded-xl border border-neutral-100 px-4 py-3">
              <Avatar name={u.name} size={36} />
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-neutral-800">{u.name}</div>
                <div className="truncate text-xs text-neutral-500">
                  {u.email}
                  {!u.passwordHash && <span className="ml-2 rounded-full bg-orange-50 px-2 py-0.5 text-[10px] font-bold uppercase text-orange-600">Invited</span>}
                </div>
              </div>
              {isAdmin ? (
                <select
                  value={u.role}
                  onChange={(e) => updateUser(u.id, { role: e.target.value as "admin" | "rep" })}
                  className="rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-600"
                >
                  <option value="rep">Rep</option>
                  <option value="admin">Admin</option>
                </select>
              ) : (
                <span className="rounded-full bg-neutral-100 px-3 py-1.5 text-xs font-semibold capitalize text-neutral-600">{u.role}</span>
              )}
            </div>
          ))}
        </div>
        <button
          onClick={() => setShowInvite(true)}
          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-brand-gradient px-6 py-3 text-sm font-bold text-white shadow-brand"
        >
          <UserPlus className="h-4 w-4" /> Invite teammate
        </button>
      </Card>

      <Card title="Activity log" sub="Every deal and company event, newest first.">
        <div className="max-h-96 space-y-2 overflow-y-auto scroll-thin">
          {activities.map((a) => (
            <div key={a.id} className="flex items-start justify-between gap-3 rounded-lg border border-neutral-100 px-3 py-2 text-sm">
              <div className="min-w-0">
                <div className="text-neutral-700">{a.body}</div>
                <div className="text-xs text-neutral-400">{eventLabel(a)}</div>
              </div>
              <div className="shrink-0 text-xs text-neutral-400">{formatDate(a.createdAt)}</div>
            </div>
          ))}
          {activities.length === 0 && <p className="text-sm text-neutral-400">Nothing logged yet.</p>}
        </div>
      </Card>

      {showInvite && <InviteModal onClose={() => setShowInvite(false)} />}
    </div>
  );
}

function DivisionRow({ division, editable }: { division: Division; editable: boolean }) {
  const [editing, setEditing] = useState(false);
  const [description, setDescription] = useState(division.description);
  const [newTag, setNewTag] = useState("");

  function save() {
    updateDivisionMeta(division.key, { description });
    setEditing(false);
  }

  function addTag() {
    if (!newTag.trim()) return;
    updateDivisionMeta(division.key, { productLines: [...division.productLines, newTag.trim()] });
    setNewTag("");
  }

  function removeTag(tag: string) {
    updateDivisionMeta(division.key, { productLines: division.productLines.filter((p) => p !== tag) });
  }

  return (
    <div className="rounded-xl border border-neutral-100 p-4">
      <div className="mb-1 flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="font-bold text-neutral-900">{division.name}</div>
          {editing ? (
            <input value={description} onChange={(e) => setDescription(e.target.value)} className="input mt-1" />
          ) : (
            <div className="text-sm text-neutral-500">{division.description}</div>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <DivisionBadge division={division.key} />
          {editable && (
            <button onClick={() => (editing ? save() : setEditing(true))} className="text-neutral-400 hover:text-pink-600">
              <Pencil className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        {division.productLines.map((p) => (
          <span key={p} className="inline-flex items-center gap-1 rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-semibold text-neutral-600">
            {p}
            {editing && (
              <button onClick={() => removeTag(p)} className="text-neutral-400 hover:text-red-600">
                <X className="h-3 w-3" />
              </button>
            )}
          </span>
        ))}
        {editing && (
          <div className="flex items-center gap-1">
            <input
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addTag()}
              placeholder="New product line"
              className="rounded-full border border-neutral-200 px-2.5 py-1 text-xs outline-none focus:border-pink-400"
            />
            <button onClick={addTag} className="text-pink-600 hover:text-pink-700">
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function StageRow({ stage, editable }: { stage: Stage; editable: boolean }) {
  const [editing, setEditing] = useState(false);
  const [label, setLabel] = useState(stage.label);
  const [probability, setProbability] = useState(stage.probability.toString());

  function save() {
    updateStageMeta(stage.key, { label, probability: Number(probability) || 0 });
    setEditing(false);
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-neutral-100 px-4 py-3">
      {editing ? (
        <>
          <input value={label} onChange={(e) => setLabel(e.target.value)} className="input" />
          <div className="flex shrink-0 items-center gap-2">
            <input type="number" min={0} max={100} value={probability} onChange={(e) => setProbability(e.target.value)} className="input w-20" />
            <span className="text-sm text-neutral-500">%</span>
            <button onClick={save} className="text-sm font-semibold text-pink-600">
              Save
            </button>
          </div>
        </>
      ) : (
        <>
          <span className="font-semibold text-neutral-800">{stage.label}</span>
          <div className="flex items-center gap-3">
            <span className="text-sm text-neutral-500">{stage.probability}% probability</span>
            {editable && (
              <button onClick={() => setEditing(true)} className="text-neutral-400 hover:text-pink-600">
                <Pencil className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function Card({ title, sub, children }: { title: string; sub?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-6">
      <h2 className="font-bold text-neutral-900">{title}</h2>
      {sub && <p className="mb-4 mt-0.5 text-sm text-neutral-500">{sub}</p>}
      {!sub && <div className="mb-4" />}
      {children}
    </div>
  );
}

function InviteModal({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  function send() {
    if (!name.trim()) return setError("Enter their name.");
    if (!emailDomainAllowed(email)) return setError("Must be a @bolide.co.za, @airnergize.co.za or @newgx.co.za address.");
    createUser({ name: name.trim(), email: email.trim().toLowerCase(), passwordHash: "", role: "rep" });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-black">Invite a teammate</h2>
          <button onClick={onClose} className="rounded-full p-1 text-neutral-400 hover:bg-neutral-100">
            <X className="h-5 w-5" />
          </button>
        </div>
        <p className="mb-4 text-sm text-neutral-500">
          They'll show up under Access as "Invited" and can finish setting up their own password from the sign-up page using this email.
        </p>
        <div className="space-y-3">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" className="input" />
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@bolide.co.za" type="email" className="input" />
        </div>
        {error && <p className="mt-2 text-sm font-semibold text-red-600">{error}</p>}
        <div className="mt-5 flex justify-end gap-3">
          <button onClick={onClose} className="rounded-full border border-neutral-200 px-5 py-2.5 text-sm font-semibold">
            Cancel
          </button>
          <button onClick={send} className="inline-flex items-center gap-2 rounded-full bg-brand-gradient px-6 py-2.5 text-sm font-bold text-white shadow-brand">
            <Mail className="h-4 w-4" /> Send invite
          </button>
        </div>
      </div>
    </div>
  );
}
