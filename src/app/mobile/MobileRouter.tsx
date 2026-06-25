import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useApp } from "../context/AppContext";
import MobileGuestPortal from "./MobileGuestPortal";
import MobileStaffPortal from "./MobileStaffPortal";
import MobileUnifiedLogin from "./MobileUnifiedLogin";
import PublicSiteMobile from "./PublicSiteMobile";
// Guest pages
import GuestDashboard from "../guest/GuestDashboard";
import GuestBookings from "../guest/GuestBookings";
import GuestFood from "../guest/GuestFood";
import GuestRequests from "../guest/GuestRequests";
import GuestProfile from "../guest/GuestProfile";
// Staff pages
import Overview from "../dashboard/Overview";
import FrontDesk from "../dashboard/FrontDesk";
import Reservations from "../dashboard/Reservations";
import FoodOrdering from "../dashboard/FoodOrdering";
import Revenue from "../dashboard/Revenue";
import Events from "../dashboard/Events";
import CRM from "../dashboard/CRM";
import Reports from "../dashboard/Reports";
import Accounting from "../dashboard/Accounting";
import Settings from "../dashboard/Settings";

function GuestGuard({ children }: { children: React.ReactNode }) {
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

function StaffGuard({ children }: { children: React.ReactNode }) {
  const { user, guestUser, hydrating } = useApp();
  if (hydrating) return <div className="flex min-h-screen items-center justify-center"><div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" /></div>;
  if (guestUser) return <Navigate to="/account" replace />;
  return user ? <>{children}</> : <Navigate to="/login" replace />;
}

function AdminGuard({ children }: { children: React.ReactNode }) {
  const { user, guestUser, hydrating } = useApp();
  if (hydrating) return <div className="flex min-h-screen items-center justify-center"><div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" /></div>;
  if (guestUser) return <Navigate to="/account" replace />;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== "admin") return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

function GuestPublic({ children }: { children: React.ReactNode }) {
  const { guestUser, user, hydrating } = useApp();
  if (hydrating) return <div className="flex min-h-screen items-center justify-center"><div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" /></div>;
  if (user) return <Navigate to="/dashboard" replace />;
  return guestUser ? <Navigate to="/account" replace /> : <>{children}</>;
}

function StaffPublic({ children }: { children: React.ReactNode }) {
  const { user, guestUser, hydrating } = useApp();
  if (hydrating) return <div className="flex min-h-screen items-center justify-center"><div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" /></div>;
  if (guestUser) return <Navigate to="/account" replace />;
  return user ? <Navigate to="/dashboard" replace /> : <>{children}</>;
}

export function MobileRoutes() {
  return (
    <Routes>
      <Route path="/" element={<PublicSiteMobile />} />
      <Route path="/login" element={<StaffPublic><MobileUnifiedLogin /></StaffPublic>} />
      <Route path="/guest-login" element={<GuestPublic><MobileUnifiedLogin /></GuestPublic>} />

      {/* Guest portal with nested pages */}
      <Route path="/account" element={<GuestGuard><MobileGuestPortal /></GuestGuard>}>
        <Route index element={<GuestDashboard />} />
        <Route path="bookings" element={<GuestBookings />} />
        <Route path="food" element={<GuestFood />} />
        <Route path="requests" element={<GuestRequests />} />
        <Route path="profile" element={<GuestProfile />} />
      </Route>

      {/* Staff portal with nested pages */}
      <Route path="/dashboard" element={<StaffGuard><MobileStaffPortal /></StaffGuard>}>
        <Route index element={<Overview />} />
        <Route path="frontdesk" element={<FrontDesk />} />
        <Route path="reservations" element={<Reservations />} />
        <Route path="food" element={<FoodOrdering />} />
        <Route path="revenue" element={<Revenue />} />
        <Route path="events" element={<Events />} />
        <Route path="crm" element={<CRM />} />
        <Route path="reports" element={<Reports />} />
        <Route path="accounting" element={<Accounting />} />
        <Route path="settings" element={<AdminGuard><Settings /></AdminGuard>} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
