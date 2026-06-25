import { Link } from "react-router-dom";
import { useState } from "react";
import { useApp } from "../context/AppContext";
import { useToast } from "../components/ToastProvider";
import {
  CalendarCheck, Bell, Utensils, Award, ArrowRight,
  MapPin, Phone, Sparkles, TrendingUp, Plus, CheckCircle, Clock,
  AlertTriangle, Shield, Shuffle,
} from "lucide-react";

const ROOM_CHANGE_REASONS = [
  "Guest Preference",
  "Noise Concern",
  "Maintenance Issue",
  "Need Larger Room",
  "Need Lower Floor",
  "Accessibility Need",
  "Safety Concern",
  "Other Concern",
];

export default function GuestDashboard() {
  const { guestUser, guestBookings, guestFoodOrders, guestRequests, property, addEmergency, addGuestRequest } = useApp();
  const { addToast } = useToast();
  const [emergencyOpen, setEmergencyOpen] = useState(false);
  const [emergencyMsg, setEmergencyMsg] = useState("");
  const [roomChangeOpen, setRoomChangeOpen] = useState(false);
  const [rcReason, setRcReason] = useState(ROOM_CHANGE_REASONS[0]);
  const [rcDetails, setRcDetails] = useState("");
  const [rcEscalate, setRcEscalate] = useState(false);

  const myBookings = guestBookings;
  const myFood = guestFoodOrders.filter((o) => o.guestUserId === guestUser?.id);
  const myRequests = guestRequests.filter((r) => r.guestUserId === guestUser?.id);

  const upcomingBooking = myBookings.find((b) => b.status === "Confirmed");
  const activeBooking = myBookings.find((b) => b.status === "Checked-in");
  const currentStay = activeBooking || upcomingBooking;
  const openRequests = myRequests.filter((r) => r.status !== "Resolved").length;

  const totalSpent = myBookings.filter((b) => b.status === "Checked-out").reduce((s, b) => s + b.total, 0);

  // Tier progress
  const tierThresholds: Record<string, number> = { Bronze: 0, Silver: 2500, Gold: 7500, Platinum: 15000 };
  const tiers = ["Bronze", "Silver", "Gold", "Platinum"];
  const currentTierIdx = tiers.indexOf(guestUser?.loyaltyTier || "Bronze");
  const nextTier = tiers[currentTierIdx + 1];
  const nextThreshold = nextTier ? tierThresholds[nextTier] : tierThresholds[guestUser?.loyaltyTier || "Bronze"];
  const progress = nextTier ? Math.min(100, ((guestUser?.points || 0) / nextThreshold) * 100) : 100;

  return (
    <div className="space-y-6">
      {/* HERO */}
      <div className="bg-gradient-to-br from-brand-800 to-brand-900 text-cream-50 rounded-2xl p-6 md:p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gold-500/10 rounded-full blur-3xl" />
        <div className="relative">
          <div className="text-xs uppercase tracking-[0.25em] text-gold-400 mb-2">Welcome back</div>
          <h1 className="font-serif text-3xl md:text-4xl mb-4">Hello, {guestUser?.name.split(" ")[0]}!</h1>
          <p className="text-cream-100/80 max-w-2xl mb-6">
            Thanks for being a {guestUser?.loyaltyTier} member at {property.name.split(",")[0]}. Manage your stays, order food to your room, and request services anytime.
          </p>

          {currentStay ? (
            <div className="bg-cream-50/10 backdrop-blur-sm rounded-lg p-5 border border-cream-50/20 grid md:grid-cols-4 gap-4 items-center">
              <div className="md:col-span-2">
                <div className="text-xs text-gold-400 uppercase tracking-wider mb-1">
                  {activeBooking ? "🟢 In-House" : "Upcoming Stay"}
                </div>
                <div className="font-serif text-2xl">{currentStay.roomType}</div>
                <div className="text-sm text-cream-100/70 mt-1">Room {currentStay.roomNumber || "TBA"} · {currentStay.nights} nights</div>
              </div>
              <div className="text-sm">
                <div className="text-cream-100/60 text-xs uppercase tracking-wider">Check-in</div>
                <div className="font-medium">{currentStay.checkIn}</div>
                <div className="text-cream-100/60 text-xs uppercase tracking-wider mt-2">Check-out</div>
                <div className="font-medium">{currentStay.checkOut}</div>
              </div>
              <Link to={`/account/bookings`} className="px-4 py-2.5 bg-gold-500 text-white rounded-md hover:bg-gold-600 transition text-sm flex items-center justify-center gap-2">
                Manage Booking <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            <Link to="/account/bookings" className="inline-flex items-center gap-2 px-5 py-3 bg-gold-500 text-white rounded-full hover:bg-gold-600 transition">
              <Plus className="w-4 h-4" /> Book Your Next Stay
            </Link>
          )}
        </div>
      </div>

      {/* EMERGENCY BUTTON */}
      <button
        onClick={() => setEmergencyOpen(true)}
        className="w-full bg-gradient-to-r from-red-600 via-red-500 to-red-600 text-white rounded-2xl p-5 flex items-center gap-4 shadow-lg hover:from-red-700 hover:to-red-700 active:scale-[0.98] transition group border-2 border-red-400"
      >
        <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0 ring-4 ring-white/30 group-hover:ring-white/50 transition">
          <Shield className="w-7 h-7 md:w-8 md:h-8 text-white" />
        </div>
        <div className="text-left flex-1">
          <div className="text-lg md:text-xl font-bold tracking-wide">🚨 EMERGENCY</div>
          <div className="text-sm text-red-100 mt-0.5">Tap here for immediate assistance — fire, medical, safety</div>
        </div>
        <AlertTriangle className="w-8 h-8 text-white/60 flex-shrink-0 group-hover:text-white transition" />
      </button>

      {/* REQUEST ROOM CHANGE */}
      <button
        onClick={() => setRoomChangeOpen(true)}
        className="w-full bg-white border-2 border-rose-300 hover:border-rose-500 text-rose-700 rounded-2xl p-5 flex items-center gap-4 shadow-sm hover:shadow-md active:scale-[0.98] transition group"
      >
        <div className="w-12 h-12 rounded-full bg-rose-100 group-hover:bg-rose-200 flex items-center justify-center flex-shrink-0">
          <Shuffle className="w-6 h-6" />
        </div>
        <div className="text-left flex-1">
          <div className="text-base md:text-lg font-bold text-rose-800">Request Room Change</div>
          <div className="text-xs md:text-sm text-rose-600/80 mt-0.5">Noise, maintenance, accessibility — or escalate as an emergency buzz</div>
        </div>
        <ArrowRight className="w-5 h-5 text-rose-400 group-hover:text-rose-700 flex-shrink-0" />
      </button>

      {/* ROOM CHANGE MODAL */}
      {roomChangeOpen && (
        <div className="fixed inset-0 z-[150] bg-black/70 flex items-center justify-center p-4" onClick={() => setRoomChangeOpen(false)}>
          <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="bg-rose-600 px-6 py-5 text-white flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                <Shuffle className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="text-lg font-bold">Request Room Change</div>
                <div className="text-sm text-rose-100">Front desk will review and reassign</div>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="text-sm text-brand-800">
                <div><span className="font-medium">Guest:</span> {guestUser?.name}</div>
                <div><span className="font-medium">Current Room:</span> {currentStay?.roomNumber || "Not assigned"}</div>
              </div>
              <label className="block">
                <span className="text-xs uppercase tracking-wider text-brand-700">Reason</span>
                <select value={rcReason} onChange={(e) => setRcReason(e.target.value)} className="mt-1 w-full px-3 py-2 border border-brand-200 rounded-md bg-white">
                  {ROOM_CHANGE_REASONS.map((r) => <option key={r}>{r}</option>)}
                </select>
              </label>
              <label className="block">
                <span className="text-xs uppercase tracking-wider text-brand-700">Details</span>
                <textarea
                  value={rcDetails}
                  onChange={(e) => setRcDetails(e.target.value)}
                  rows={3}
                  placeholder="Tell us more about your concern or preference..."
                  className="mt-1 w-full px-3 py-2 border border-brand-200 rounded-md resize-none"
                />
              </label>
              <label className="flex items-start gap-2 text-sm text-brand-800 p-3 rounded-md bg-red-50 border border-red-200">
                <input type="checkbox" checked={rcEscalate} onChange={(e) => setRcEscalate(e.target.checked)} className="h-4 w-4 mt-0.5 accent-red-600" />
                <span>
                  <span className="font-medium text-red-800">Escalate as Emergency Buzz</span>
                  <span className="block text-xs text-red-700/80">For safety concerns — also fires an emergency alert to the front desk.</span>
                </span>
              </label>
              <div className="flex gap-2">
                <button onClick={() => setRoomChangeOpen(false)} className="flex-1 py-3 border border-brand-200 rounded-lg text-sm hover:bg-brand-50">Cancel</button>
                <button
                  onClick={() => {
                    if (!guestUser) return;
                    const room = currentStay?.roomNumber || "Lobby";
                    addGuestRequest({
                      id: `RQ-${Math.floor(Math.random() * 9000) + 1000}`,
                      guestUserId: guestUser.id,
                      bookingId: currentStay?.id,
                      type: "Room Change",
                      title: `Room Change — ${rcReason}`,
                      details: rcDetails.trim() || `Reason: ${rcReason}`,
                      priority: rcEscalate ? "Urgent" : "Normal",
                      status: "Pending",
                      roomNumber: room,
                      createdAt: new Date().toLocaleString(),
                    });
                    if (rcEscalate) {
                      addEmergency({
                        id: `EMG-${Math.floor(Math.random() * 9000) + 1000}`,
                        guestUserId: guestUser.id,
                        guestName: guestUser.name,
                        roomNumber: room,
                        message: `Room change concern (${rcReason}): ${rcDetails.trim() || "no details"}`,
                        createdAt: new Date().toLocaleString(),
                        acknowledged: false,
                      });
                      addToast("emergency", "🚨 Emergency buzz sent", `Room change concern escalated — Room ${room}`);
                    } else {
                      addToast("success", "Room change requested", `Front desk has been notified — Room ${room}`);
                    }
                    setRcDetails("");
                    setRcReason(ROOM_CHANGE_REASONS[0]);
                    setRcEscalate(false);
                    setRoomChangeOpen(false);
                  }}
                  className={`flex-1 py-3 rounded-lg text-sm font-medium text-white flex items-center justify-center gap-2 ${rcEscalate ? "bg-red-600 hover:bg-red-700" : "bg-rose-600 hover:bg-rose-700"}`}
                >
                  {rcEscalate ? <><Shield className="w-4 h-4" /> Send + Emergency</> : <><Shuffle className="w-4 h-4" /> Send Request</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}


      {/* EMERGENCY MODAL */}
      {emergencyOpen && (
        <div className="fixed inset-0 z-[150] bg-black/70 flex items-center justify-center p-4" onClick={() => setEmergencyOpen(false)}>
          <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="bg-red-600 px-6 py-5 text-white flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="text-lg font-bold">🚨 Emergency Alert</div>
                <div className="text-sm text-red-100">This will immediately notify the front desk</div>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="text-sm text-brand-800">
                <div><span className="font-medium">Guest:</span> {guestUser?.name}</div>
                <div><span className="font-medium">Room:</span> {currentStay?.roomNumber || "Lobby"}</div>
              </div>
              <textarea
                value={emergencyMsg}
                onChange={(e) => setEmergencyMsg(e.target.value)}
                rows={3}
                placeholder="Describe the emergency (fire, medical, safety concern)..."
                className="w-full px-3 py-2 border border-red-300 rounded-lg focus:outline-none focus:border-red-500 resize-none"
              />
              <div className="flex gap-2">
                <button onClick={() => setEmergencyOpen(false)} className="flex-1 py-3 border border-brand-200 rounded-lg text-sm hover:bg-brand-50">Cancel</button>
                <button
                  onClick={() => {
                    if (!guestUser) return;
                    addEmergency({
                      id: `EMG-${Math.floor(Math.random() * 9000) + 1000}`,
                      guestUserId: guestUser.id,
                      guestName: guestUser.name,
                      roomNumber: currentStay?.roomNumber || "Lobby",
                      message: emergencyMsg || "Emergency assistance needed",
                      createdAt: new Date().toLocaleString(),
                      acknowledged: false,
                    });
                    addToast("emergency", "🚨 Emergency alert sent!", `Front desk has been notified — Room ${currentStay?.roomNumber || "Lobby"}`);
                    setEmergencyMsg("");
                    setEmergencyOpen(false);
                  }}
                  className="flex-1 py-3 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 flex items-center justify-center gap-2"
                >
                  <Shield className="w-4 h-4" /> Send Emergency Alert
                </button>
              </div>
              <p className="text-[10px] text-brand-500 text-center">For life-threatening emergencies, also call local emergency services: 911</p>
            </div>
          </div>
        </div>
      )}

      {/* KPI ROW */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat icon={<CalendarCheck className="w-5 h-5" />} label="Total Bookings" value={myBookings.length.toString()} color="bg-emerald-100 text-emerald-700" />
        <Stat icon={<Utensils className="w-5 h-5" />} label="Food Orders" value={myFood.length.toString()} color="bg-amber-100 text-amber-700" />
        <Stat icon={<Bell className="w-5 h-5" />} label="Open Requests" value={openRequests.toString()} color="bg-blue-100 text-blue-700" />
        <Stat icon={<Award className="w-5 h-5" />} label="Loyalty Points" value={(guestUser?.points || 0).toLocaleString()} color="bg-yellow-100 text-yellow-700" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* LEFT: BOOKINGS */}
        <div className="lg:col-span-2 space-y-6">
          {/* BOOKING MONITORING */}
          <div className="bg-white rounded-xl border border-brand-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-serif text-xl text-brand-900">Booking Monitor</h2>
                <p className="text-xs text-brand-600">Track all your reservations in real time</p>
              </div>
              <Link to="/account/bookings" className="text-xs text-brand-600 hover:text-brand-900">View all →</Link>
            </div>
            {myBookings.length === 0 ? (
              <div className="text-center py-10 text-brand-500">
                <CalendarCheck className="w-10 h-10 mx-auto mb-3 opacity-40" />
                <p className="text-sm">No bookings yet. Start your first stay.</p>
                <Link to="/account/bookings" className="inline-block mt-4 px-4 py-2 bg-brand-800 text-cream-50 rounded-md text-sm hover:bg-brand-900">Book Now</Link>
              </div>
            ) : (
              <div className="space-y-3">
                {myBookings.slice(0, 4).map((b) => (
                  <div key={b.id} className="border border-brand-100 rounded-lg p-4 flex items-center gap-4 hover:border-brand-300 transition">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${b.status === "Checked-in" ? "bg-emerald-100 text-emerald-700" : b.status === "Confirmed" ? "bg-blue-100 text-blue-700" : b.status === "Cancelled" ? "bg-red-100 text-red-700" : "bg-slate-100 text-slate-700"}`}>
                      <CalendarCheck className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <div className="font-medium text-brand-900">{b.roomType}</div>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider ${b.status === "Checked-in" ? "bg-emerald-100 text-emerald-800" : b.status === "Confirmed" ? "bg-blue-100 text-blue-800" : b.status === "Cancelled" ? "bg-red-100 text-red-800" : "bg-slate-100 text-slate-700"}`}>{b.status}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${b.paymentStatus === "Paid" ? "bg-emerald-50 text-emerald-700" : b.paymentStatus === "Partial" ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-700"}`}>{b.paymentStatus}</span>
                      </div>
                      <div className="text-xs text-brand-600 mt-1">{b.id} · {b.checkIn} → {b.checkOut} · {b.nights} nights</div>
                    </div>
                    <div className="text-right">
                      <div className="font-serif text-lg text-brand-900">₱{b.total.toLocaleString()}</div>
                      <Link to="/account/bookings" className="text-xs text-brand-600 hover:text-brand-900">Details →</Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* RECENT REQUESTS */}
          <div className="bg-white rounded-xl border border-brand-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-serif text-xl text-brand-900">Recent Requests</h2>
                <p className="text-xs text-brand-600">Housekeeping, maintenance & concierge</p>
              </div>
              <Link to="/account/requests" className="text-xs text-brand-600 hover:text-brand-900">View all →</Link>
            </div>
            {myRequests.length === 0 ? (
              <div className="text-center py-8 text-brand-500 text-sm">No requests yet. Use Quick Buzz from the sidebar.</div>
            ) : (
              <div className="space-y-2">
                {myRequests.slice(0, 4).map((r) => (
                  <div key={r.id} className="flex items-center gap-3 p-3 border border-brand-100 rounded-md">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${r.status === "Resolved" ? "bg-emerald-500" : r.status === "In Progress" ? "bg-amber-500" : "bg-blue-500"}`} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-brand-900">{r.title}</div>
                      <div className="text-xs text-brand-600">{r.type} · Room {r.roomNumber} · {r.createdAt}</div>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${r.status === "Resolved" ? "bg-emerald-100 text-emerald-800" : r.status === "In Progress" ? "bg-amber-100 text-amber-800" : r.status === "Acknowledged" ? "bg-blue-100 text-blue-800" : "bg-slate-100 text-slate-700"}`}>{r.status}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: SIDEBAR INFO */}
        <div className="space-y-6">
          {/* LOYALTY CARD */}
          <div className="bg-gradient-to-br from-gold-400 to-gold-600 text-white rounded-xl p-6">
            <div className="flex items-center gap-2 mb-2"><Sparkles className="w-4 h-4" /><span className="text-xs uppercase tracking-wider">Loyalty Tier</span></div>
            <div className="font-serif text-3xl mb-1">{guestUser?.loyaltyTier}</div>
            <div className="text-sm text-white/80 mb-4">{guestUser?.points.toLocaleString()} points</div>
            {nextTier && (
              <>
                <div className="text-xs text-white/80 mb-1">{(nextThreshold - (guestUser?.points || 0)).toLocaleString()} pts to {nextTier}</div>
                <div className="h-2 bg-white/30 rounded-full overflow-hidden">
                  <div className="h-full bg-white" style={{ width: `${progress}%` }} />
                </div>
              </>
            )}
            <div className="mt-4 pt-4 border-t border-white/20 text-xs text-white/80 flex items-center gap-2">
              <TrendingUp className="w-3 h-3" /> Total spent: ₱{totalSpent.toLocaleString()}
            </div>
          </div>

          {/* QUICK ACTIONS */}
          <div className="bg-white rounded-xl border border-brand-100 p-6">
            <h3 className="font-serif text-lg text-brand-900 mb-4">Quick Actions</h3>
            <div className="space-y-2">
              {[
                { to: "/account/food", icon: <Utensils className="w-4 h-4" />, label: "Order Food to Room" },
                { to: "/account/bookings", icon: <Plus className="w-4 h-4" />, label: "New Booking" },
                { to: "/account/requests", icon: <Bell className="w-4 h-4" />, label: "Make a Request" },
                { to: "/account/profile", icon: <Award className="w-4 h-4" />, label: "Update Profile" },
              ].map((q) => (
                <Link key={q.to} to={q.to} className="flex items-center gap-3 p-3 rounded-md hover:bg-brand-50 transition group">
                  <div className="w-9 h-9 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center group-hover:bg-brand-700 group-hover:text-cream-50 transition">{q.icon}</div>
                  <div className="text-sm font-medium text-brand-900 flex-1">{q.label}</div>
                  <ArrowRight className="w-4 h-4 text-brand-400 group-hover:text-brand-700" />
                </Link>
              ))}
            </div>
          </div>

          {/* RESORT INFO */}
          <div className="bg-white rounded-xl border border-brand-100 p-6">
            <h3 className="font-serif text-lg text-brand-900 mb-4">Resort Info</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-brand-500 flex-shrink-0 mt-0.5" />
                <div className="text-brand-700">{property.address}, {property.city}</div>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-brand-500" />
                <a href={`tel:${property.phone}`} className="text-brand-700 hover:text-brand-900">{property.phone}</a>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-brand-500" />
                <div className="text-brand-700">Check-in: 2:00 PM · Check-out: 12:00 PM</div>
              </div>
            </div>
          </div>

          {/* RECENT FOOD */}
          {myFood.length > 0 && (
            <div className="bg-white rounded-xl border border-brand-100 p-6">
              <h3 className="font-serif text-lg text-brand-900 mb-4">Recent Food Orders</h3>
              <div className="space-y-2">
                {myFood.slice(0, 3).map((f) => (
                  <div key={f.id} className="flex items-center justify-between p-2 rounded-md hover:bg-brand-50">
                    <div>
                      <div className="text-sm font-medium text-brand-900">{f.items.map((i) => `${i.qty}× ${i.name}`).join(", ").slice(0, 35)}{f.items.map((i) => i.name).join("").length > 35 ? "..." : ""}</div>
                      <div className="text-xs text-brand-600">{f.deliverTo} · {f.createdAt}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">₱{f.total}</div>
                      <CheckCircle className="w-3 h-3 text-emerald-500 ml-auto" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Stat({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  return (
    <div className="bg-white rounded-xl border border-brand-100 p-5">
      <div className={`w-10 h-10 rounded-lg ${color} flex items-center justify-center mb-3`}>{icon}</div>
      <div className="font-serif text-2xl text-brand-900">{value}</div>
      <div className="text-xs text-brand-600 uppercase tracking-wider mt-0.5">{label}</div>
    </div>
  );
}
