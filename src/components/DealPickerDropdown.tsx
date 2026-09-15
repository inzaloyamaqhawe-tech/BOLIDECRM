import { useEffect, useRef, useState } from "react";
import { ChevronDown, Search } from "lucide-react";
import type { Deal } from "../types";

/**
 * Searchable "linked deal" picker. A plain <option> list stops being usable
 * once there are hundreds/thousands of deals (client's Lead Tracker is
 * already close to that) — this always opens downward (never flips above
 * the trigger, unlike a native <select>) and filters as you type.
 */
export function DealPickerDropdown({
  deals,
  value,
  onChange,
  placeholder = "No linked deal",
}: {
  deals: Deal[];
  value: string;
  onChange: (dealId: string) => void;
  placeholder?: string;
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

  const filtered = deals.filter((d) => d.title.toLowerCase().includes(query.toLowerCase()));
  const selectedLabel = deals.find((d) => d.id === value)?.title ?? placeholder;

  return (
    <div className="relative inline-block" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="input flex w-auto min-w-[200px] items-center justify-between gap-2 text-left"
      >
        <span className={`truncate ${value ? "" : "text-neutral-400"}`}>{selectedLabel}</span>
        <ChevronDown className="h-4 w-4 shrink-0 text-neutral-400" />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-20 mt-2 w-80 rounded-xl border border-neutral-200 bg-white p-2 shadow-xl">
          <div className="relative mb-2">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-neutral-400" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search deals…"
              className="w-full rounded-lg border border-neutral-200 py-1.5 pl-8 pr-2 text-sm outline-none focus:border-neutral-400"
            />
          </div>
          <div className="max-h-64 overflow-y-auto scroll-thin">
            <button
              type="button"
              onClick={() => {
                onChange("");
                setOpen(false);
                setQuery("");
              }}
              className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm hover:bg-neutral-50 ${
                value === "" ? "bg-pink-50 font-semibold text-pink-700" : "text-neutral-500"
              }`}
            >
              {placeholder}
            </button>
            {filtered.map((d) => (
              <button
                key={d.id}
                type="button"
                onClick={() => {
                  onChange(d.id);
                  setOpen(false);
                  setQuery("");
                }}
                className={`flex w-full items-center gap-2 truncate rounded-lg px-2 py-1.5 text-left text-sm hover:bg-neutral-50 ${
                  value === d.id ? "bg-pink-50 font-semibold text-pink-700" : ""
                }`}
              >
                <span className="truncate">{d.title}</span>
              </button>
            ))}
            {filtered.length === 0 && <div className="px-2 py-3 text-center text-xs text-neutral-400">No deals match "{query}"</div>}
          </div>
        </div>
      )}
    </div>
  );
}
