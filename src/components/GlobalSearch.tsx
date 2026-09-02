import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Briefcase, Building2, User as UserIcon } from "lucide-react";
import { useCompanies, useContacts, useDeals } from "../lib/use-store";
import { formatZAR } from "../lib/format";

/**
 * Live/predictive search across deals, companies and contacts.
 *
 * Replaces the earlier "type the whole thing then hit enter" search —
 * results now filter on every keystroke, which is what was asked for:
 * matches should appear as each letter is typed, without needing the full
 * term. Client-side `includes()` is plenty fast at this data size; if the
 * CRM's record count grows by orders of magnitude this is the one spot that
 * would need to move server-side.
 */
export function GlobalSearch() {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const deals = useDeals();
  const companies = useCompanies();
  const contacts = useContacts();

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return { deals: [], companies: [], contacts: [] };
    return {
      deals: deals.filter((d) => d.title.toLowerCase().includes(q) || d.site?.toLowerCase().includes(q)).slice(0, 5),
      companies: companies.filter((c) => c.name.toLowerCase().includes(q) || c.industry.toLowerCase().includes(q)).slice(0, 5),
      contacts: contacts.filter((c) => c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q)).slice(0, 5),
    };
  }, [query, deals, companies, contacts]);

  const hasResults = results.deals.length + results.companies.length + results.contacts.length > 0;

  return (
    <div className="relative w-full max-w-md" ref={ref}>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Search deals, companies, contacts…"
          className="w-full rounded-full border border-neutral-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-pink-400"
        />
      </div>

      {open && query.trim() && (
        <div className="absolute left-0 right-0 z-30 mt-2 max-h-96 overflow-y-auto scroll-thin rounded-xl border border-neutral-200 bg-white p-2 shadow-xl">
          {!hasResults && <div className="px-3 py-6 text-center text-sm text-neutral-400">No matches for "{query}"</div>}

          {results.deals.length > 0 && (
            <ResultGroup label="Deals">
              {results.deals.map((d) => (
                <ResultRow
                  key={d.id}
                  icon={<Briefcase className="h-4 w-4 text-pink-500" />}
                  title={d.title}
                  subtitle={`${d.stage} · ${formatZAR(d.onceOff)} once-off`}
                  onClick={() => {
                    navigate(`/deals?open=${d.id}`);
                    setOpen(false);
                    setQuery("");
                  }}
                />
              ))}
            </ResultGroup>
          )}

          {results.companies.length > 0 && (
            <ResultGroup label="Companies">
              {results.companies.map((c) => (
                <ResultRow
                  key={c.id}
                  icon={<Building2 className="h-4 w-4 text-orange-500" />}
                  title={c.name}
                  subtitle={c.industry}
                  onClick={() => {
                    navigate(`/companies/${c.id}`);
                    setOpen(false);
                    setQuery("");
                  }}
                />
              ))}
            </ResultGroup>
          )}

          {results.contacts.length > 0 && (
            <ResultGroup label="Contacts">
              {results.contacts.map((c) => (
                <ResultRow
                  key={c.id}
                  icon={<UserIcon className="h-4 w-4 text-sky-500" />}
                  title={c.name}
                  subtitle={c.email}
                  onClick={() => {
                    navigate(`/contacts`);
                    setOpen(false);
                    setQuery("");
                  }}
                />
              ))}
            </ResultGroup>
          )}
        </div>
      )}
    </div>
  );
}

function ResultGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-1">
      <div className="px-2 pb-1 pt-2 text-[10px] font-bold uppercase tracking-widest text-neutral-400">{label}</div>
      {children}
    </div>
  );
}

function ResultRow({ icon, title, subtitle, onClick }: { icon: React.ReactNode; title: string; subtitle: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left hover:bg-neutral-50">
      {icon}
      <div className="min-w-0">
        <div className="truncate text-sm font-semibold text-neutral-900">{title}</div>
        <div className="truncate text-xs text-neutral-500">{subtitle}</div>
      </div>
    </button>
  );
}
