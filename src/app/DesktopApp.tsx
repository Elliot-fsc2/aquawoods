import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useApp } from "./context/AppContext";
import PublicSite from "./pages/PublicSite";
import UnifiedLogin from "./pages/UnifiedLogin";
import DashboardLayout from "./pages/DashboardLayout";
import Overview from "./dashboard/Overview";
import FrontDesk from "./dashboard/FrontDesk";
import Reservations from "./dashboard/Reservations";
import Revenue from "./dashboard/Revenue";
import Events from "./dashboard/Events";
import CRM from "./dashboard/CRM";
import Reports from "./dashboard/Reports";
import Settings from "./dashboard/Settings";
import Accounting from "./dashboard/Accounting";
import FoodOrdering from "./dashboard/FoodOrdering";
import ERP from "./dashboard/ERP";
import GuestLayout from "./guest/GuestLayout";
import GuestDashboard from "./guest/GuestDashboard";
import GuestBookings from "./guest/GuestBookings";
import GuestFood from "./guest/GuestFood";
import GuestRequests from "./guest/GuestRequests";
import GuestProfile from "./guest/GuestProfile";

function Protected({ children }: { children: React.ReactNode }) {
  const { user, guestUser, hydrating } = useApp();
  if (hydrating) return <div className="flex min-h-screen items-center justify-center"><div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" /></div>;
  if (!user) return <Navigate to={guestUser ? "/account" : "/login"} replace />;
  return <>{children}</>;
}

function AdminOnly({ children }: { children: React.ReactNode }) {
  const { user, hydrating } = useApp();
  if (hydrating) return <div className="flex min-h-screen items-center justify-center"><div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== "admin") return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

function PublicOnly({ children }: { children: React.ReactNode }) {
  const { user, guestUser, hydrating } = useApp();
  if (hydrating) return <div className="flex min-h-screen items-center justify-center"><div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" /></div>;
  if (user) return <Navigate to="/dashboard" replace />;
  if (guestUser) return <Navigate to="/account" replace />;
  return <>{children}</>;
}

function GuestProtected({ children }: { children: React.ReactNode }) {
  const { guestUser, user, hydrating } = useApp();
  const location = useLocation();
  if (hydrating) return <div className="flex min-h-screen items-center justify-center"><div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" /></div>;
  if (user) return <Navigate to="/dashboard" replace />;
  if (!guestUser) {
    sessionStorage.setItem("loginRedirect", location.pathname);
    return <Navigate to="/guest-login" replace />;
  }
  return <>{children}</>;
}

export default function DesktopApp() {
  return (
    <Routes>
      <Route path="/" element={<PublicSite />} />
      <Route path="/login" element={<PublicOnly><UnifiedLogin /></PublicOnly>} />
      <Route path="/guest-login" element={<PublicOnly><UnifiedLogin /></PublicOnly>} />
      <Route path="/dashboard" element={<Protected><DashboardLayout /></Protected>}>
        <Route index element={<Overview />} />
        <Route path="frontdesk" element={<FrontDesk />} />
        <Route path="reservations" element={<Reservations />} />
        <Route path="food" element={<FoodOrdering />} />
        <Route path="revenue" element={<Revenue />} />
        <Route path="events" element={<Events />} />
        <Route path="crm" element={<CRM />} />
        <Route path="reports" element={<Reports />} />
        <Route path="accounting" element={<Accounting />} />
        <Route path="erp" element={<ERP />} />
        <Route path="settings" element={<AdminOnly><Settings /></AdminOnly>} />
      </Route>
      <Route path="/account" element={<GuestProtected><GuestLayout /></GuestProtected>}>
        <Route index element={<GuestDashboard />} />
        <Route path="bookings" element={<GuestBookings />} />
        <Route path="food" element={<GuestFood />} />
        <Route path="requests" element={<GuestRequests />} />
        <Route path="profile" element={<GuestProfile />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
