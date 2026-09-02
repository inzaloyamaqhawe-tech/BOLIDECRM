import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Mail, Phone as PhoneIcon, Plus } from "lucide-react";
import { useCompanies, useContacts, useDeals } from "../lib/use-store";
import { createContact, getCompanyActivities, updateCompany } from "../lib/store";
import { DivisionBadge } from "../components/DivisionBadge";
import { DealModal } from "../components/DealModal";
import { Avatar } from "../components/Avatar";
import { formatDate, formatZAR } from "../lib/format";
import type { Company, Deal } from "../types";

export function CompanyDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const companies = useCompanies();
  const deals = useDeals();
  const contacts = useContacts();
  const company = companies.find((c) => c.id === id);
  const [selectedDeal, setSelectedDeal] = useState<Deal | undefined>();
  const [showAddContact, setShowAddContact] = useState(false);

  if (!company) {
    return (
      <div className="py-16 text-center text-neutral-400">
        Company not found. <Link to="/companies" className="text-pink-600 underline">Back to Companies</Link>
      </div>
    );
  }

  const companyDeals = deals.filter((d) => d.companyId === company.id);
  const companyContacts = contacts.filter((c) => c.companyId === company.id);
  const totalValue = companyDeals.reduce((s, d) => s + d.onceOff, 0);
  const activities = getCompanyActivities(company.id);

  return (
    <div className="space-y-6">
      <button onClick={() => navigate("/companies")} className="inline-flex items-center gap-1.5 text-sm font-semibold text-neutral-500 hover:text-neutral-800">
        <ArrowLeft className="h-4 w-4" /> Back to Companies
      </button>

      <div className="rounded-2xl border border-neutral-200 bg-white p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-3xl font-black text-neutral-900">{company.name}</h1>
            <p className="text-sm text-neutral-500">{company.industry}</p>
          </div>
          <EditableStatus company={company} />
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {company.divisions.map((d) => (
            <DivisionBadge key={d} division={d} />
          ))}
        </div>
        <div className="mt-4 flex flex-wrap gap-6 border-t border-neutral-100 pt-4 text-sm">
          <div>
            <div className="text-xs font-bold uppercase tracking-widest text-neutral-400">Deals</div>
            <div className="font-bold">{companyDeals.length}</div>
          </div>
          <div>
            <div className="text-xs font-bold uppercase tracking-widest text-neutral-400">Total value</div>
            <div className="font-bold">{formatZAR(totalValue)}</div>
          </div>
          <div>
            <div className="text-xs font-bold uppercase tracking-widest text-neutral-400">Contacts</div>
            <div className="font-bold">{companyContacts.length}</div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-2xl border border-neutral-200 bg-white p-6">
          <h2 className="mb-3 font-bold text-neutral-900">Deals</h2>
          <div className="space-y-2">
            {companyDeals.map((d) => (
              <button
                key={d.id}
                onClick={() => setSelectedDeal(d)}
                className="flex w-full items-center justify-between gap-3 rounded-xl border border-neutral-100 px-4 py-3 text-left hover:border-pink-300"
              >
                <div className="min-w-0">
                  <div className="truncate font-semibold text-neutral-900">{d.title}</div>
                  <div className="text-xs text-neutral-500">{d.site ?? "—"}</div>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <DivisionBadge division={d.division} />
                  <span className="text-sm font-bold">{formatZAR(d.onceOff)}</span>
                </div>
              </button>
            ))}
            {companyDeals.length === 0 && <p className="text-sm text-neutral-400">No deals for this company yet.</p>}
          </div>

          <h2 className="mb-3 mt-8 font-bold text-neutral-900">Activity</h2>
          <ul className="space-y-2">
            {activities.map((a) => (
              <li key={a.id} className="rounded-lg border border-neutral-100 px-3 py-2 text-sm">
                <div className="text-neutral-700">{a.body}</div>
                <div className="text-xs text-neutral-400">{formatDate(a.createdAt)}</div>
              </li>
            ))}
            {activities.length === 0 && <li className="text-sm text-neutral-400">No company-level activity yet.</li>}
          </ul>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white p-6">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-bold text-neutral-900">Contacts</h2>
            <button onClick={() => setShowAddContact(true)} className="text-pink-600 hover:text-pink-700">
              <Plus className="h-4 w-4" />
            </button>
          </div>
          <div className="space-y-3">
            {companyContacts.map((c) => (
              <div key={c.id} className="flex items-start gap-3">
                <Avatar name={c.name} size={32} />
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-neutral-900">{c.name}</div>
                  {c.role && <div className="text-xs text-neutral-400">{c.role}</div>}
                  <div className="mt-1 flex items-center gap-1.5 text-xs text-neutral-500">
                    <Mail className="h-3 w-3" /> {c.email}
                  </div>
                  {c.phone && (
                    <div className="mt-0.5 flex items-center gap-1.5 text-xs text-neutral-500">
                      <PhoneIcon className="h-3 w-3" /> {c.phone}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {companyContacts.length === 0 && <p className="text-sm text-neutral-400">No contacts yet.</p>}
          </div>
        </div>
      </div>

      {selectedDeal && <DealModal deal={selectedDeal} onClose={() => setSelectedDeal(undefined)} />}
      {showAddContact && <QuickAddContact companyId={company.id} onClose={() => setShowAddContact(false)} />}
    </div>
  );
}

function EditableStatus({ company }: { company: Company }) {
  return (
    <select
      value={company.status}
      onChange={(e) => updateCompany(company.id, { status: e.target.value as Company["status"] })}
      className="rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-600"
    >
      <option value="Prospect">Prospect</option>
      <option value="Customer">Customer</option>
      <option value="Churned">Churned</option>
    </select>
  );
}

function QuickAddContact({ companyId, onClose }: { companyId: string; onClose: () => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");

  function save() {
    if (!name.trim() || !email.trim()) return;
    createContact({ companyId, name: name.trim(), email: email.trim(), role: role.trim() || undefined });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <h2 className="mb-4 text-lg font-black">Add contact</h2>
        <div className="space-y-3">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" className="input" />
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" type="email" className="input" />
          <input value={role} onChange={(e) => setRole(e.target.value)} placeholder="Role (optional)" className="input" />
        </div>
        <div className="mt-5 flex justify-end gap-3">
          <button onClick={onClose} className="rounded-full border border-neutral-200 px-5 py-2.5 text-sm font-semibold">
            Cancel
          </button>
          <button onClick={save} className="rounded-full bg-brand-gradient px-6 py-2.5 text-sm font-bold text-white shadow-brand">
            Add contact
          </button>
        </div>
      </div>
    </div>
  );
}
