import { useState } from "react";
import { Outlet, useNavigate, useLocation, Link } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { LayoutDashboard, CalendarCheck, Utensils, Bell, User, LogOut, Leaf, Sparkles } from "lucide-react";
import BuzzPanel from "../guest/components/BuzzPanel";

export default function MobileGuestPortal() {
  const { guestUser, logoutGuest, property, guestBookings } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const [buzzOpen, setBuzzOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => { logoutGuest(); navigate("/"); };
  const activeBooking = guestBookings.find((b) => b.guestUserId === guestUser?.id && (b.status === "Confirmed" || b.status === "Checked-in"));

  const tabs = [
    { path: "/account", icon: LayoutDashboard, label: "Home" },
    { path: "/account/bookings", icon: CalendarCheck, label: "Book" },
    { path: "/account/food", icon: Utensils, label: "Food" },
    { path: "/account/requests", icon: Bell, label: "Buzz" },
    { path: "/account/profile", icon: User, label: "Me" },
  ];

  const isActive = (path: string) => path === "/account" ? location.pathname === "/account" : location.pathname.startsWith(path);
  const _pageTitle = tabs.find((t) => isActive(t.path))?.label || "Account";
  void _pageTitle;

  return (
    <div className="min-h-screen bg-cream-50 flex flex-col">
      {/* HEADER */}
      <header className="sticky top-0 z-40 bg-brand-900 text-cream-50 safe-area-top">
        <div className="flex items-center justify-between px-4 py-3">
          <Link to="/" className="flex items-center gap-2 min-w-0">
            {property.logo ? (
              <img src={property.logo} alt="" className="w-7 h-7 rounded-full object-cover flex-shrink-0" />
            ) : (
              <div className="w-7 h-7 rounded-full bg-gold-500 flex items-center justify-center text-white flex-shrink-0"><Leaf className="w-3.5 h-3.5" /></div>
            )}
            <span className="font-serif text-base truncate max-w-[140px]">{property.name.split(",")[0]}</span>
          </Link>
          <div className="flex items-center gap-1.5">
            <button onClick={() => setBuzzOpen(true)} className="relative w-9 h-9 rounded-full bg-brand-800 flex items-center justify-center active:bg-brand-700">
              <Bell className="w-4.5 h-4.5 text-cream-50" />
              {activeBooking && <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-gold-500 rounded-full" />}
            </button>
            <button onClick={() => setMenuOpen(!menuOpen)} className="w-9 h-9 rounded-full bg-brand-800 flex items-center justify-center overflow-hidden active:bg-brand-700">
              {guestUser?.avatar ? (
                <img src={guestUser.avatar} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-xs font-medium">{guestUser?.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}</span>
              )}
            </button>
          </div>
        </div>

        {/* Dropdown profile menu */}
        {menuOpen && (
          <div className="bg-brand-800 border-t border-brand-700 px-4 py-3">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 text-white flex items-center justify-center font-medium flex-shrink-0 overflow-hidden">
                {guestUser?.avatar ? <img src={guestUser.avatar} alt="" className="w-full h-full object-cover" /> : guestUser?.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium truncate">{guestUser?.name}</div>
                <div className="text-[10px] text-gold-400">{guestUser?.loyaltyTier} · {guestUser?.points.toLocaleString()} pts</div>
              </div>
            </div>
            <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-brand-700 text-cream-50 text-sm active:bg-brand-600">
              <LogOut className="w-4 h-4" /> Sign out
            </button>
          </div>
        )}
      </header>

      {/* CONTENT — grows to fill, scrollable */}
      <main className="flex-1 overflow-y-auto px-4 py-4 pb-24">
        <Outlet />
      </main>

      {/* QUICK BUZZ FAB */}
      {activeBooking && (
        <button
          onClick={() => setBuzzOpen(true)}
          className="fixed bottom-[76px] right-3 z-30 w-12 h-12 rounded-full bg-gradient-to-br from-gold-500 to-gold-600 text-white shadow-xl flex items-center justify-center active:scale-90 transition"
        >
          <Sparkles className="w-5 h-5" />
        </button>
      )}

      {/* BOTTOM NAVIGATION */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-brand-200 shadow-[0_-2px_10px_rgba(0,0,0,0.06)]">
        <div className="grid grid-cols-5 max-w-lg mx-auto">
          {tabs.map((t) => {
            const active = isActive(t.path);
            return (
              <button
                key={t.path}
                onClick={() => { navigate(t.path); setMenuOpen(false); }}
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

      {buzzOpen && <BuzzPanel onClose={() => setBuzzOpen(false)} />}
    </div>
  );
}
