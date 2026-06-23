import { NavLink, Outlet, useNavigate, Link, useLocation } from "react-router-dom";
import { useApp } from "../context/AppContext";
import {
  LayoutDashboard, CalendarCheck, Utensils, Bell, User, LogOut,
  Leaf, Home, ChevronRight, Sparkles, Menu, X,
} from "lucide-react";
import { useEffect, useState } from "react";
import BuzzPanel from "./components/BuzzPanel";

const nav = [
  { to: "/account", icon: LayoutDashboard, label: "Dashboard", end: true },
  { to: "/account/bookings", icon: CalendarCheck, label: "My Bookings" },
  { to: "/account/food", icon: Utensils, label: "Food Ordering" },
  { to: "/account/requests", icon: Bell, label: "Requests & Buzz" },
  { to: "/account/profile", icon: User, label: "Profile" },
];

export default function GuestLayout() {
  const { guestUser, logoutGuest, property, guestBookings } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const [buzzOpen, setBuzzOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Close mobile sidebar on route change
  useEffect(() => { setSidebarOpen(false); }, [location.pathname]);

  // Lock body scroll when mobile sidebar is open
  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [sidebarOpen]);

  const handleLogout = () => {
    logoutGuest();
    navigate("/");
  };

  const activeBooking = guestBookings.find((b) => b.guestUserId === guestUser?.id && (b.status === "Confirmed" || b.status === "Checked-in"));

  // Current page title for mobile header
  const currentNav = nav.find((n) => n.end ? location.pathname === n.to : location.pathname.startsWith(n.to));
  const pageTitle = currentNav?.label || "My Account";

  return (
    <div className="min-h-screen bg-cream-50 lg:flex">
      {/* MOBILE OVERLAY */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* SIDEBAR */}
      <aside className={`fixed lg:sticky top-0 left-0 z-50 w-72 lg:w-64 h-screen bg-brand-900 text-cream-50 flex-shrink-0 flex flex-col transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}>
        <div className="px-5 py-5 border-b border-brand-800 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition min-w-0">
            {property.logo ? (
              <img src={property.logo} alt={property.name} className="w-9 h-9 rounded-full object-cover bg-cream-50 flex-shrink-0" />
            ) : (
              <div className="w-9 h-9 rounded-full bg-gold-500 flex items-center justify-center text-white flex-shrink-0"><Leaf className="w-4 h-4" /></div>
            )}
            <div className="leading-tight min-w-0">
              <div className="font-serif text-lg truncate">{property.name.split(",")[0] || "Aquawood"}</div>
              <div className="text-[9px] uppercase tracking-[0.25em] text-gold-400">Guest Portal</div>
            </div>
          </Link>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden w-9 h-9 rounded-full hover:bg-brand-800 flex items-center justify-center flex-shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User card */}
        <div className="px-5 py-4 border-b border-brand-800">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 text-white flex items-center justify-center font-medium flex-shrink-0 overflow-hidden">
              {guestUser?.avatar ? (
                <img src={guestUser.avatar} alt={guestUser.name} className="w-full h-full object-cover" />
              ) : (
                guestUser?.name.split(" ").map((n) => n[0]).join("").slice(0, 2)
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium truncate">{guestUser?.name}</div>
              <div className="text-[10px] text-gold-400 uppercase tracking-wider">{guestUser?.loyaltyTier} Member</div>
            </div>
          </div>
          <div className="mt-3 px-3 py-2 bg-brand-800/60 rounded-md flex items-center justify-between">
            <div className="text-xs text-cream-100/70">Points</div>
            <div className="font-serif text-lg">{guestUser?.points.toLocaleString()}</div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {nav.map((n) => (
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

        {/* QUICK BUZZ */}
        {activeBooking && (
          <div className="px-3 pb-3">
            <button onClick={() => { setBuzzOpen(true); setSidebarOpen(false); }} className="w-full bg-gradient-to-r from-gold-500 to-gold-600 text-white rounded-md px-3 py-3 hover:from-gold-600 hover:to-gold-700 transition flex items-center justify-center gap-2 shadow">
              <Sparkles className="w-4 h-4" />
              <div className="text-left">
                <div className="text-xs uppercase tracking-wider">Quick Buzz</div>
                <div className="text-[10px] opacity-80">Room {activeBooking.roomNumber || "—"}</div>
              </div>
            </button>
          </div>
        )}

        <div className="p-3 border-t border-brand-800">
          <button onClick={handleLogout} className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm text-cream-100/70 hover:bg-brand-800 transition">
            <LogOut className="w-4 h-4" /> Sign out
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <div className="flex-1 min-w-0 w-full">
        <header className="sticky top-0 z-30 bg-cream-50/95 backdrop-blur-md border-b border-brand-100 px-4 md:px-6 lg:px-8 py-3 md:py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 md:gap-3 min-w-0">
            {/* Mobile menu button */}
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden w-10 h-10 rounded-full border border-brand-200 hover:bg-brand-50 flex items-center justify-center flex-shrink-0">
              <Menu className="w-5 h-5 text-brand-700" />
            </button>
            {/* Desktop breadcrumbs */}
            <div className="hidden md:flex items-center gap-2 text-sm text-brand-700">
              <Home className="w-4 h-4" />
              <ChevronRight className="w-4 h-4 text-brand-400" />
              <span className="font-medium text-brand-900">My Account</span>
              <ChevronRight className="w-4 h-4 text-brand-400" />
              <span className="font-medium text-brand-900">{pageTitle}</span>
            </div>
            {/* Mobile page title */}
            <div className="md:hidden font-serif text-lg text-brand-900 truncate">{pageTitle}</div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setBuzzOpen(true)} className="relative w-10 h-10 rounded-full border border-brand-200 hover:bg-brand-50 flex items-center justify-center" title="Quick Buzz">
              <Bell className="w-4 h-4 text-brand-700" />
              {activeBooking && <span className="absolute top-2 right-2 w-2 h-2 bg-gold-500 rounded-full" />}
            </button>
          </div>
        </header>

        <main className="p-4 md:p-6 lg:p-8">
          <Outlet />
        </main>

        {/* MOBILE BOTTOM NAV */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-brand-100 grid grid-cols-5 shadow-lg">
          {nav.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={"end" in n ? n.end : false}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-0.5 py-2.5 text-[10px] transition ${
                  isActive ? "text-gold-600" : "text-brand-600 hover:text-brand-900"
                }`
              }
            >
              <n.icon className="w-5 h-5" />
              <span className="leading-tight">{n.label.split(" ")[0]}</span>
            </NavLink>
          ))}
        </nav>
        {/* Bottom spacer for mobile nav */}
        <div className="lg:hidden h-16" />
      </div>

      {buzzOpen && <BuzzPanel onClose={() => setBuzzOpen(false)} />}
    </div>
  );
}
