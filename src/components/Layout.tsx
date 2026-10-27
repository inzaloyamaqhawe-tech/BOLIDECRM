import { useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";

export function Layout() {
  const { user, loading } = useAuth();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [compactNav,setCompactNav]=useState(()=>localStorage.getItem("bolide-crm:compact-nav")==="1");

  function toggleCompactNav(){setCompactNav(value=>{const next=!value;localStorage.setItem("bolide-crm:compact-nav",next?"1":"0");return next;});}

  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="flex h-screen overflow-hidden bg-neutral-50">
      <Sidebar open={mobileNavOpen} onClose={() => setMobileNavOpen(false)} compact={compactNav} onToggleCompact={toggleCompactNav} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopBar onOpenNav={() => setMobileNavOpen(true)} />
        <main className="flex-1 overflow-y-auto scroll-thin px-4 py-6 sm:px-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
