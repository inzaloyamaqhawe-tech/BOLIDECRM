import { NavLink } from "react-router-dom";
import { LayoutGrid, Trello, Handshake, Building2, Users, BarChart3, Settings, CheckSquare, X } from "lucide-react";

const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutGrid, end: true },
  { to: "/pipeline", label: "Pipeline", icon: Trello },
  { to: "/deals", label: "Deals", icon: Handshake },
  { to: "/companies", label: "Companies", icon: Building2 },
  { to: "/contacts", label: "Contacts", icon: Users },
  { to: "/tasks", label: "Tasks", icon: CheckSquare },
  { to: "/reports", label: "Reports", icon: BarChart3 },
  { to: "/settings", label: "Settings", icon: Settings },
];

/**
 * On small screens this renders as a slide-over drawer (controlled by
 * `open`/`onClose`, toggled from TopBar's hamburger button) instead of a
 * permanent column — the Kanban board especially has no room to share the
 * screen with a fixed 256px sidebar on a phone.
 */
export function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <>
      {open && <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={onClose} />}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 shrink-0 flex-col border-r border-neutral-200 bg-white px-4 py-6 transition-transform lg:static lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="mb-8 flex items-center justify-between">
          <img src={`${import.meta.env.BASE_URL}bolide-logo.jpg`} alt="Bolide" className="h-9 w-auto object-contain object-left" />
          <button onClick={onClose} className="text-neutral-400 lg:hidden">
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex flex-1 flex-col gap-1">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl border-l-4 px-3 py-2.5 text-sm font-semibold transition ${
                  isActive
                    ? "border-pink-500 bg-pink-50 text-pink-600"
                    : "border-transparent text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900"
                }`
              }
            >
              <Icon className="h-4.5 w-4.5" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="rounded-2xl bg-gradient-to-br from-pink-50 to-orange-50 p-4">
          <div className="text-sm font-bold text-neutral-800">Bolide CRM</div>
          <div className="text-xs text-neutral-500">Internal tool · All values in ZAR, excl. VAT</div>
        </div>
      </aside>
    </>
  );
}
