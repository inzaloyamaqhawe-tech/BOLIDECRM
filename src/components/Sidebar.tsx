import { NavLink } from "react-router-dom";
import { LayoutGrid, Trello, Handshake, Building2, Users, BarChart3, Settings } from "lucide-react";

const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutGrid, end: true },
  { to: "/pipeline", label: "Pipeline", icon: Trello },
  { to: "/deals", label: "Deals", icon: Handshake },
  { to: "/companies", label: "Companies", icon: Building2 },
  { to: "/contacts", label: "Contacts", icon: Users },
  { to: "/reports", label: "Reports", icon: BarChart3 },
  { to: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-neutral-200 bg-white px-4 py-6">
      <img src={`${import.meta.env.BASE_URL}bolide-logo.jpg`} alt="Bolide" className="mb-8 h-9 w-auto object-contain object-left" />

      <nav className="flex flex-1 flex-col gap-1">
        {NAV.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
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
  );
}
