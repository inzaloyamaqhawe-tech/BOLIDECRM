import { useState } from "react";
import { Mail, UserPlus, X } from "lucide-react";
import { DIVISIONS, STAGES, WHOLESALE_CATALOGUE } from "../lib/seed-data";
import { useUsers } from "../lib/use-store";
import { createUser } from "../lib/store";
import { emailDomainAllowed } from "../lib/auth";
import { ALLOWED_EMAIL_DOMAINS } from "../types";
import { Avatar } from "../components/Avatar";
import { DivisionBadge } from "../components/DivisionBadge";
import { formatZAR } from "../lib/format";

export function SettingsPage() {
  const users = useUsers();
  const [showInvite, setShowInvite] = useState(false);

  const secureConnect = DIVISIONS.filter((d) => d.legalEntity === "Bolide Connect (Pty) Ltd");
  const standalone = DIVISIONS.filter((d) => d.legalEntity !== "Bolide Connect (Pty) Ltd");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-neutral-900">Settings</h1>
        <p className="text-sm text-neutral-500">Divisions, pipeline and access</p>
      </div>

      <Card title="Divisions & product lines">
        <div className="space-y-3">
          {standalone.map((d) => (
            <DivisionRow key={d.key} division={d} />
          ))}
          <div className="pt-2 text-xs font-bold uppercase tracking-widest text-neutral-400">
            Legal entity
            <div className="mt-0.5 text-sm font-black normal-case tracking-normal text-neutral-800">Bolide Connect (Pty) Ltd</div>
          </div>
          {secureConnect.map((d) => (
            <DivisionRow key={d.key} division={d} />
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

      <Card title="Pipeline stages">
        <div className="space-y-2">
          {STAGES.map((s) => (
            <div key={s.key} className="flex items-center justify-between rounded-xl border border-neutral-100 px-4 py-3">
              <span className="font-semibold text-neutral-800">{s.label}</span>
              <span className="text-sm text-neutral-500">{s.probability}% probability</span>
            </div>
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
              <div className="min-w-0">
                <div className="font-semibold text-neutral-800">{u.name}</div>
                <div className="truncate text-xs text-neutral-500">
                  {u.email}
                  {!u.passwordHash && <span className="ml-2 rounded-full bg-orange-50 px-2 py-0.5 text-[10px] font-bold uppercase text-orange-600">Invited</span>}
                </div>
              </div>
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

      {showInvite && <InviteModal onClose={() => setShowInvite(false)} />}
    </div>
  );
}

function DivisionRow({ division }: { division: (typeof DIVISIONS)[number] }) {
  return (
    <div className="rounded-xl border border-neutral-100 p-4">
      <div className="mb-1 flex items-start justify-between gap-2">
        <div>
          <div className="font-bold text-neutral-900">{division.name}</div>
          <div className="text-sm text-neutral-500">{division.description}</div>
        </div>
        <DivisionBadge division={division.key} />
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {division.productLines.map((p) => (
          <span key={p} className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-semibold text-neutral-600">
            {p}
          </span>
        ))}
      </div>
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
    createUser({ name: name.trim(), email: email.trim().toLowerCase(), passwordHash: "" });
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
