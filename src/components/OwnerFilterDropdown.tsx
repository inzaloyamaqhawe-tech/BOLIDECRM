import { useEffect, useRef, useState } from "react";
import { ChevronDown, Search } from "lucide-react";
import type { User } from "../types";
import { Avatar } from "./Avatar";

/**
 * Owner filter as a searchable dropdown rather than one button per user.
 *
 * Replaces the earlier "one button per teammate" layout, which worked fine
 * with 5 users but would turn into a wall of buttons as the team grows.
 * "Everyone" stays the default; opening the dropdown reveals a search field
 * so a long user list stays quick to filter.
 */
export function OwnerFilterDropdown({
  users,
  value,
  onChange,
}: {
  users: User[];
  value: string | "everyone";
  onChange: (ownerId: string | "everyone") => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const filtered = users.filter((u) => u.name.toLowerCase().includes(query.toLowerCase()));
  const selectedLabel = value === "everyone" ? "Everyone" : users.find((u) => u.id === value)?.name ?? "Everyone";

  return (
    <div className="relative inline-block" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-2 rounded-full bg-brand-gradient px-4 py-2 text-sm font-semibold text-white shadow-brand"
      >
        {selectedLabel}
        <ChevronDown className="h-4 w-4" />
      </button>

      {open && (
        <div className="absolute left-0 z-20 mt-2 w-64 rounded-xl border border-neutral-200 bg-white p-2 shadow-xl">
          <div className="relative mb-2">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-neutral-400" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Find a teammate…"
              className="w-full rounded-lg border border-neutral-200 py-1.5 pl-8 pr-2 text-sm outline-none focus:border-neutral-400"
            />
          </div>
          <div className="max-h-64 overflow-y-auto scroll-thin">
            <button
              type="button"
              onClick={() => {
                onChange("everyone");
                setOpen(false);
              }}
              className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm hover:bg-neutral-50 ${
                value === "everyone" ? "bg-pink-50 font-semibold text-pink-700" : ""
              }`}
            >
              Everyone
            </button>
            {filtered.map((u) => (
              <button
                key={u.id}
                type="button"
                onClick={() => {
                  onChange(u.id);
                  setOpen(false);
                }}
                className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm hover:bg-neutral-50 ${
                  value === u.id ? "bg-pink-50 font-semibold text-pink-700" : ""
                }`}
              >
                <Avatar name={u.name} size={22} />
                {u.name}
              </button>
            ))}
            {filtered.length === 0 && <div className="px-2 py-3 text-center text-xs text-neutral-400">No teammates match "{query}"</div>}
          </div>
        </div>
      )}
    </div>
  );
}
