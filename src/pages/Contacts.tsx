import { useMemo, useState } from "react";
import { Mail, Phone, Plus, Search, Users, X } from "lucide-react";
import { useCompanies, useContacts } from "../lib/use-store";
import { createContact } from "../lib/store";
import { Avatar } from "../components/Avatar";
import { Pagination } from "../components/Pagination";

export function ContactsPage() {
  const contacts = useContacts();
  const companies = useCompanies();
  const [showAdd, setShowAdd] = useState(false);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const companyName = (id: string) => companies.find((c) => c.id === id)?.name ?? "";

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return contacts;
    return contacts.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        (c.role ?? "").toLowerCase().includes(q) ||
        companyName(c.companyId).toLowerCase().includes(q)
    );
  }, [contacts, query, companies]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const paged = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-black text-neutral-900">Contacts</h1>
          <p className="text-sm text-neutral-500">People behind the pipeline</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="inline-flex items-center gap-2 rounded-full bg-brand-gradient px-4 py-2 text-sm font-bold text-white shadow-brand"
        >
          <Plus className="h-4 w-4" /> Add contact
        </button>
      </div>

      {contacts.length > 0 && (
        <div className="relative w-full max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
            placeholder="Search contacts, companies…"
            className="w-full rounded-full border border-neutral-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-pink-400"
          />
        </div>
      )}

      {contacts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-neutral-200 bg-white p-16 text-center text-neutral-400">
          <Users className="mx-auto mb-2 h-8 w-8" />
          No contacts yet. Add the people you deal with at each company.
        </div>
      ) : (
        <>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {paged.map((c) => {
            const company = companies.find((co) => co.id === c.companyId);
            return (
              <div key={c.id} className="flex items-start gap-3 rounded-2xl border border-neutral-200 bg-white p-4">
                <Avatar name={c.name} size={40} />
                <div className="min-w-0">
                  <div className="truncate font-bold text-neutral-900">{c.name}</div>
                  <div className="truncate text-xs text-neutral-500">
                    {c.role ? `${c.role} · ` : ""}
                    {company?.name ?? "—"}
                  </div>
                  <div className="mt-2 space-y-1 text-xs text-neutral-500">
                    <div className="flex items-center gap-1.5 truncate">
                      <Mail className="h-3 w-3" /> {c.email}
                    </div>
                    {c.phone && (
                      <div className="flex items-center gap-1.5">
                        <Phone className="h-3 w-3" /> {c.phone}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div className="col-span-full py-10 text-center text-sm text-neutral-400">No contacts match "{query}"</div>
          )}
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
        </>
      )}

      {showAdd && <AddContactModal onClose={() => setShowAdd(false)} />}
    </div>
  );
}

function AddContactModal({ onClose }: { onClose: () => void }) {
  const companies = useCompanies();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("");
  const [companyId, setCompanyId] = useState(companies[0]?.id ?? "");

  function save() {
    if (!name.trim() || !email.trim() || !companyId) return;
    createContact({ name: name.trim(), email: email.trim(), phone: phone.trim() || undefined, role: role.trim() || undefined, companyId });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-black">Add contact</h2>
          <button onClick={onClose} className="rounded-full p-1 text-neutral-400 hover:bg-neutral-100">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="space-y-3">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" className="input" />
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" type="email" className="input" />
          <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone (optional)" className="input" />
          <input value={role} onChange={(e) => setRole(e.target.value)} placeholder="Role (optional)" className="input" />
          <select value={companyId} onChange={(e) => setCompanyId(e.target.value)} className="input">
            {companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
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
