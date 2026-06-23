import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import { useApp } from "../context/AppContext";
import {
  LayoutDashboard, Bed, CalendarCheck, LineChart, Users, PartyPopper, DollarSign,
  Settings, LogOut, Leaf, Bell, Search, ChevronRight, Home, Sparkles, Utensils,
  Menu, X, Boxes,
} from "lucide-react";
import { useEffect, useState } from "react";

const baseNav = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Overview", end: true, adminOnly: false },
  { to: "/dashboard/frontdesk", icon: Bed, label: "Front Desk & Rooms", adminOnly: false },
  { to: "/dashboard/reservations", icon: CalendarCheck, label: "Reservations", adminOnly: false },
  { to: "/dashboard/food", icon: Utensils, label: "Food & POS", adminOnly: false },
  { to: "/dashboard/revenue", icon: LineChart, label: "Revenue & Pricing", adminOnly: false },
  { to: "/dashboard/events", icon: PartyPopper, label: "Groups & Events", adminOnly: false },
  { to: "/dashboard/crm", icon: Users, label: "CRM & Loyalty", adminOnly: false },
  { to: "/dashboard/reports", icon: Sparkles, label: "Reports & Analytics", adminOnly: false },
  { to: "/dashboard/accounting", icon: DollarSign, label: "Accounting", adminOnly: false },
  { to: "/dashboard/erp", icon: Boxes, label: "ERP", adminOnly: false },
];

export default function DashboardLayout() {
  const { user, logout, property } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => { setSidebarOpen(false); }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [sidebarOpen]);

  const isAdmin = user?.role === "admin";
  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const currentNav = baseNav.find((n) => n.end ? location.pathname === n.to : location.pathname.startsWith(n.to));
  const pageTitle = location.pathname === "/dashboard/settings" ? "Settings" : (currentNav?.label || "Operations");

  return (
    <div className="min-h-screen bg-brand-50/40 lg:flex">
      {/* MOBILE OVERLAY */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* SIDEBAR */}
      <aside className={`fixed lg:sticky top-0 left-0 z-50 w-72 lg:w-64 h-screen bg-brand-900 text-cream-50 flex-shrink-0 flex flex-col transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}>
        <div className="px-5 py-5 border-b border-brand-800 flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            {property.logo ? (
              <img src={property.logo} alt={property.name} className="w-9 h-9 rounded-full object-cover bg-cream-50 flex-shrink-0" />
            ) : (
              <div className="w-9 h-9 rounded-full bg-gold-500 flex items-center justify-center text-white flex-shrink-0"><Leaf className="w-4 h-4" /></div>
            )}
            <div className="leading-tight min-w-0">
              <div className="font-serif text-lg truncate">{property.name.split(",")[0] || "Aquawood"}</div>
              <div className="text-[9px] uppercase tracking-[0.25em] text-gold-400">HSMS Console</div>
            </div>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden w-9 h-9 rounded-full hover:bg-brand-800 flex items-center justify-center flex-shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {baseNav.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={"end" in n ? n.end : false}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition ${
                  isActive
                    ? "bg-gold-500 text-white font-medium shadow"
                    : "text-cream-100/80 hover:bg-brand-800 hover:text-cream-50"
                }`
              }
            >
              <n.icon className="w-4 h-4" />
              {n.label}
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-brand-800 space-y-2">
          {isAdmin && (
            <NavLink
              to="/dashboard/settings"
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-md text-sm transition ${isActive ? "bg-brand-800 text-cream-50" : "text-cream-100/70 hover:bg-brand-800"}`
              }
            >
              <Settings className="w-4 h-4" /> Settings
              <span className="ml-auto text-[9px] uppercase tracking-wider bg-gold-500/20 text-gold-400 px-1.5 py-0.5 rounded">Admin</span>
            </NavLink>
          )}
          <div className="px-3 py-3 bg-brand-800/50 rounded-md">
            <div className="text-xs text-cream-100/60 uppercase tracking-wider">Signed in as</div>
            <div className="text-sm font-medium truncate">{user?.name}</div>
            <div className="text-xs text-cream-100/60 truncate">{user?.role === "admin" ? "Administrator" : user?.position || "Employee"}</div>
          </div>
          <button onClick={handleLogout} className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm text-cream-100/70 hover:bg-brand-800 transition">
            <LogOut className="w-4 h-4" /> Sign out
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <div className="flex-1 min-w-0 w-full">
        <header className="sticky top-0 z-30 bg-cream-50/95 backdrop-blur-md border-b border-brand-100 px-4 md:px-6 lg:px-8 py-3 md:py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden w-10 h-10 rounded-full border border-brand-200 hover:bg-brand-50 flex items-center justify-center flex-shrink-0">
              <Menu className="w-5 h-5 text-brand-700" />
            </button>
            <div className="hidden md:flex items-center gap-2 text-sm text-brand-700">
              <Home className="w-4 h-4" />
              <ChevronRight className="w-4 h-4 text-brand-400" />
              <span className="font-medium text-brand-900">{pageTitle}</span>
            </div>
            <div className="md:hidden font-serif text-lg text-brand-900 truncate">{pageTitle}</div>
          </div>
          <div className="flex items-center gap-2 md:gap-3">
            <div className="relative hidden md:block">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-brand-400" />
              <input
                placeholder="Search..."
                className="pl-9 pr-4 py-2 w-48 lg:w-72 text-sm border border-brand-200 rounded-full focus:outline-none focus:border-brand-500 bg-white"
              />
            </div>
            <button className="relative w-10 h-10 rounded-full border border-brand-200 hover:bg-brand-50 flex items-center justify-center flex-shrink-0">
              <Bell className="w-4 h-4 text-brand-700" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-gold-500 rounded-full" />
            </button>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-600 to-brand-800 text-cream-50 flex items-center justify-center text-sm font-medium flex-shrink-0">
              {user?.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
            </div>
          </div>
        </header>
        <main className="p-4 md:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
