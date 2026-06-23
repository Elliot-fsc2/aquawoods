import { useEffect, useRef, useState } from "react";
import { Outlet, useNavigate, useLocation, Link } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { useToast } from "../components/ToastProvider";
import {
  LayoutDashboard, Bed, CalendarCheck, Utensils, Settings, LogOut,
  Leaf, Menu, X, DollarSign, LineChart, Users, PartyPopper, Sparkles, Shield,
} from "lucide-react";

export default function MobileStaffPortal() {
  const { user, logout, property, guestRequests, emergencyAlerts } = useApp();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const prevReqCount = useRef(guestRequests.length);
  const prevEmgCount = useRef(emergencyAlerts.length);

  const handleLogout = () => { logout(); navigate("/"); };
  const isAdmin = user?.role === "admin";

  // Live buzz popup for staff mobile
  useEffect(() => {
    if (guestRequests.length > prevReqCount.current) {
      const n = guestRequests[0];
      if (n) addToast(n.priority === "Urgent" ? "warning" : "info", `🔔 ${n.type} — Room ${n.roomNumber}`, n.title);
    }
    prevReqCount.current = guestRequests.length;
  }, [guestRequests.length, guestRequests, addToast]);

  useEffect(() => {
    if (emergencyAlerts.length > prevEmgCount.current) {
      const n = emergencyAlerts[0];
      if (n) addToast("emergency", `🚨 EMERGENCY — Room ${n.roomNumber}`, n.message);
    }
    prevEmgCount.current = emergencyAlerts.length;
  }, [emergencyAlerts.length, emergencyAlerts, addToast]);

  useEffect(() => { setDrawerOpen(false); }, [location.pathname]);

  const bottomTabs = [
    { path: "/dashboard", icon: LayoutDashboard, label: "Home", end: true },
    { path: "/dashboard/frontdesk", icon: Bed, label: "Rooms" },
    { path: "/dashboard/reservations", icon: CalendarCheck, label: "Book" },
    { path: "/dashboard/food", icon: Utensils, label: "Food" },
    { path: "/dashboard/accounting", icon: DollarSign, label: "Acct" },
  ];

  const allNav = [
    { path: "/dashboard", icon: LayoutDashboard, label: "Overview" },
    { path: "/dashboard/frontdesk", icon: Bed, label: "Front Desk & Rooms" },
    { path: "/dashboard/reservations", icon: CalendarCheck, label: "Reservations" },
    { path: "/dashboard/food", icon: Utensils, label: "Food & POS" },
    { path: "/dashboard/revenue", icon: LineChart, label: "Revenue & Pricing" },
    { path: "/dashboard/events", icon: PartyPopper, label: "Groups & Events" },
    { path: "/dashboard/crm", icon: Users, label: "CRM & Loyalty" },
    { path: "/dashboard/reports", icon: Sparkles, label: "Reports" },
    { path: "/dashboard/accounting", icon: DollarSign, label: "Accounting" },
    ...(isAdmin ? [{ path: "/dashboard/settings", icon: Settings, label: "Settings" }] : []),
  ];

  const isActive = (path: string) => path === "/dashboard" ? location.pathname === "/dashboard" : location.pathname.startsWith(path);

  return (
    <div className="min-h-screen bg-brand-50/40 flex flex-col">
      {/* HEADER */}
      <header className="sticky top-0 z-40 bg-brand-900 text-cream-50">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2 min-w-0">
            <button onClick={() => setDrawerOpen(true)} className="w-9 h-9 rounded-full bg-brand-800 flex items-center justify-center flex-shrink-0 active:bg-brand-700">
              <Menu className="w-5 h-5" />
            </button>
            <Link to="/" className="flex items-center gap-2 min-w-0">
              {property.logo ? (
                <img src={property.logo} alt="" className="w-6 h-6 rounded-full object-cover flex-shrink-0" />
              ) : (
                <div className="w-6 h-6 rounded-full bg-gold-500 flex items-center justify-center text-white flex-shrink-0"><Leaf className="w-3 h-3" /></div>
              )}
              <span className="font-serif text-sm truncate max-w-[120px]">{property.name.split(",")[0]}</span>
            </Link>
          </div>
          <div className="flex items-center gap-1.5">
            {emergencyAlerts.filter((e) => !e.acknowledged).length > 0 && (
              <div className="w-9 h-9 rounded-full bg-red-600 flex items-center justify-center animate-pulse">
                <Shield className="w-4 h-4 text-white" />
              </div>
            )}
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-cream-50 flex items-center justify-center text-xs font-medium flex-shrink-0">
              {user?.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
            </div>
          </div>
        </div>
      </header>

      {/* DRAWER OVERLAY */}
      {drawerOpen && <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setDrawerOpen(false)} />}

      {/* SIDE DRAWER */}
      <div className={`fixed top-0 left-0 z-50 w-72 h-full bg-brand-900 text-cream-50 flex flex-col transition-transform duration-300 ${drawerOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex items-center justify-between px-4 py-4 border-b border-brand-800">
          <div className="flex items-center gap-2 min-w-0">
            {property.logo ? (
              <img src={property.logo} alt="" className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gold-500 flex items-center justify-center text-white flex-shrink-0"><Leaf className="w-4 h-4" /></div>
            )}
            <div className="min-w-0">
              <div className="font-serif text-base truncate">{property.name.split(",")[0]}</div>
              <div className="text-[9px] uppercase tracking-wider text-gold-400">HSMS</div>
            </div>
          </div>
          <button onClick={() => setDrawerOpen(false)} className="w-9 h-9 rounded-full hover:bg-brand-800 flex items-center justify-center"><X className="w-5 h-5" /></button>
        </div>

        {/* User card */}
        <div className="px-4 py-3 border-b border-brand-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-cream-50 flex items-center justify-center text-sm font-medium flex-shrink-0">
            {user?.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium truncate">{user?.name}</div>
            <div className="text-[10px] text-cream-100/60">{isAdmin ? "Administrator" : user?.position || "Employee"}</div>
          </div>
          {isAdmin && <span className="text-[8px] uppercase tracking-wider bg-gold-500/20 text-gold-400 px-1.5 py-0.5 rounded">Admin</span>}
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
          {allNav.map((n) => (
            <button
              key={n.path}
              onClick={() => { navigate(n.path); setDrawerOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm transition ${isActive(n.path) ? "bg-gold-500 text-white font-medium" : "text-cream-100/80 active:bg-brand-800"}`}
            >
              <n.icon className="w-4 h-4" />
              {n.label}
            </button>
          ))}
        </nav>

        <div className="p-3 border-t border-brand-800">
          <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 px-3 py-3 rounded-lg text-sm text-cream-100/70 active:bg-brand-800">
            <LogOut className="w-4 h-4" /> Sign out
          </button>
        </div>
      </div>

      {/* CONTENT */}
      <main className="flex-1 overflow-y-auto px-3 py-3 pb-24 md:px-6 md:py-6">
        <Outlet />
      </main>

      {/* BOTTOM NAV */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-brand-200 shadow-[0_-2px_10px_rgba(0,0,0,0.06)]">
        <div className="grid grid-cols-5 max-w-lg mx-auto">
          {bottomTabs.map((t) => {
            const active = isActive(t.path);
            return (
              <button
                key={t.path}
                onClick={() => navigate(t.path)}
                className={`flex flex-col items-center justify-center py-2 transition-colors ${active ? "text-gold-600" : "text-brand-500 active:text-brand-800"}`}
              >
                <t.icon className={`w-5 h-5 ${active ? "stroke-[2.5px]" : ""}`} />
                <span className="text-[10px] mt-0.5 font-medium leading-tight">{t.label}</span>
                {active && <div className="w-4 h-0.5 bg-gold-500 rounded-full mt-0.5" />}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
