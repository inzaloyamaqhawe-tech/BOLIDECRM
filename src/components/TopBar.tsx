import { useState } from "react";
import { Plus, LogOut } from "lucide-react";
import { DIVISIONS } from "../lib/seed-data";
import { useAuth } from "../lib/auth";
import { Avatar } from "./Avatar";
import { GlobalSearch } from "./GlobalSearch";
import { DealModal } from "./DealModal";

export function TopBar() {
  const { user, logout } = useAuth();
  const [showNewDeal, setShowNewDeal] = useState(false);

  return (
    <header className="border-b border-neutral-200 bg-white">
      <div className="flex items-center gap-4 px-6 py-3">
        <GlobalSearch />
        <div className="flex-1" />
        <button
          type="button"
          onClick={() => setShowNewDeal(true)}
          className="inline-flex items-center gap-2 rounded-full bg-brand-gradient px-5 py-2.5 text-sm font-bold text-white shadow-brand transition hover:brightness-110"
        >
          <Plus className="h-4 w-4" /> New deal
        </button>
        {user && (
          <div className="group relative">
            <Avatar name={user.name} size={36} />
            <div className="absolute right-0 top-full z-20 mt-2 hidden w-48 rounded-xl border border-neutral-200 bg-white p-2 shadow-xl group-hover:block">
              <div className="px-2 py-1.5 text-sm font-semibold text-neutral-800">{user.name}</div>
              <div className="truncate px-2 pb-2 text-xs text-neutral-400">{user.email}</div>
              <button
                onClick={logout}
                className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm font-semibold text-red-600 hover:bg-red-50"
              >
                <LogOut className="h-3.5 w-3.5" /> Sign out
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 px-6 pb-3 text-xs">
        <span className="font-bold uppercase tracking-widest text-neutral-400">Divisions</span>
        {DIVISIONS.map((d) => (
          <span key={d.key} className="rounded-full bg-neutral-100 px-2.5 py-1 font-semibold text-neutral-600">
            {d.name.replace("Bolide ", "")}
          </span>
        ))}
      </div>

      {showNewDeal && <DealModal onClose={() => setShowNewDeal(false)} />}
    </header>
  );
}
