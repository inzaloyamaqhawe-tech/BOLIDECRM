import { Building2, Globe, MapPin, Phone } from "lucide-react";
import { useCompanies, useContacts, useDeals } from "../lib/use-store";
import { DivisionBadge } from "../components/DivisionBadge";
import { formatZAR } from "../lib/format";

export function CompaniesPage() {
  const companies = useCompanies();
  const deals = useDeals();
  const contacts = useContacts();

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-black text-neutral-900">Companies</h1>
          <p className="text-sm text-neutral-500">Accounts across every division · ZAR, excl. VAT</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {companies.map((c) => {
          const companyDeals = deals.filter((d) => d.companyId === c.id);
          const companyContacts = contacts.filter((ct) => ct.companyId === c.id);
          const totalValue = companyDeals.reduce((s, d) => s + d.onceOff, 0);

          return (
            <div key={c.id} className="flex flex-col rounded-2xl border border-neutral-200 bg-white p-5">
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
            </div>
          );
        })}
        {companies.length === 0 && (
          <div className="col-span-full rounded-2xl border border-dashed border-neutral-200 p-10 text-center text-neutral-400">
            <Building2 className="mx-auto mb-2 h-8 w-8" />
            No companies yet.
          </div>
        )}
      </div>
    </div>
  );
}
