import { useApp } from "../context/AppContext";
import { dailyMetrics } from "../data/mockData";

const today = () => new Date().toISOString().slice(0, 10);
const daysAgo = (n: number) => { const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString().slice(0, 10); };

const bookingSources = [
  { name: "Walk-in", logo: "🚶", bookings30d: 78, revenue30d: 42500 },
  { name: "Phone", logo: "📞", bookings30d: 62, revenue30d: 36800 },
  { name: "Facebook", logo: "📘", bookings30d: 54, revenue30d: 28400 },
  { name: "Website", logo: "🌐", bookings30d: 28, revenue30d: 15600 },
  { name: "Referral", logo: "👥", bookings30d: 19, revenue30d: 10200 },
  { name: "Repeat Guest", logo: "❤️", bookings30d: 24, revenue30d: 14800 },
];
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, CartesianGrid, PieChart, Pie, Cell, Legend, LineChart, Line,
} from "recharts";
import {
  TrendingUp, Users as UsersIcon, Bed, DollarSign, CalendarCheck,
  ArrowUpRight, ArrowDownRight, Activity, Clock, Bell, Sparkles,
  Shield, Check, AlertTriangle,
} from "lucide-react";

import { useToast } from "../components/ToastProvider";

export default function Overview() {
  const { rooms, reservations, guests, events, emergencyAlerts, acknowledgeEmergency, guestRequests } = useApp();
  const { addToast } = useToast();

  const unacknowledgedEmergencies = emergencyAlerts.filter((e) => !e.acknowledged);
  const openRequests = guestRequests.filter((r) => r.status !== "Resolved");

  const occupied = rooms.filter((r) => r.status === "occupied").length;
  const occupancy = Math.round((occupied / rooms.length) * 100);
  const todayArrivals = reservations.filter((r) => r.status === "confirmed").length;
  const todayDepartures = reservations.filter((r) => r.checkOut === new Date().toISOString().slice(0, 10)).length;
  const inHouse = reservations.filter((r) => r.status === "checked-in").length;
  const last30Res = reservations.filter((r) => r.checkIn >= daysAgo(30));
  const prev30Res = reservations.filter((r) => r.checkIn >= daysAgo(60) && r.checkIn < daysAgo(30));
  const revenue30 = last30Res.reduce((s, r) => s + r.totalAmount, 0);
  const prevRevenue = prev30Res.reduce((s, r) => s + r.totalAmount, 0) || revenue30 * 0.85;
  const revGrowth = Math.round(((revenue30 - prevRevenue) / prevRevenue) * 100);
  const last7Nights = reservations.filter((r) => r.checkIn >= daysAgo(7)).reduce((s, r) => s + r.totalAmount, 0);
  const last7RoomNights = reservations.filter((r) => r.checkIn >= daysAgo(7)).reduce((s, r) => s + (new Date(r.checkOut).getTime() - new Date(r.checkIn).getTime()) / 86400000, 0);
  const adr = last7RoomNights > 0 ? Math.round(last7Nights / last7RoomNights) : 0;

  const statusData = [
    { name: "Occupied", value: rooms.filter((r) => r.status === "occupied").length, color: "#245435" },
    { name: "Available", value: rooms.filter((r) => r.status === "available").length, color: "#5fa06e" },
    { name: "Reserved", value: rooms.filter((r) => r.status === "reserved").length, color: "#b8923f" },
    { name: "Makeup Room", value: rooms.filter((r) => r.status === "dirty").length, color: "#d4a574" },
    { name: "Maintenance", value: rooms.filter((r) => r.status === "maintenance").length, color: "#94a3b8" },
  ];

  const upcomingEvents = [...events].sort((a, b) => a.date.localeCompare(b.date)).slice(0, 4);
  const upcomingRes = [...reservations].filter((r) => r.status === "confirmed").sort((a, b) => a.checkIn.localeCompare(b.checkIn)).slice(0, 5);

  return (
    <div className="space-y-6">
      <div>
        <div className="text-xs uppercase tracking-[0.25em] text-gold-500 font-medium mb-1">Operations Overview</div>
        <h1 className="font-serif text-3xl md:text-4xl text-brand-900">Good {timeOfDay()}, welcome back</h1>
        <p className="text-brand-700 mt-1">Here's how Aquawood is performing today.</p>
      </div>

      {/* ============ EMERGENCY ALERTS ============ */}
      {unacknowledgedEmergencies.length > 0 && (
        <div className="space-y-3">
          {unacknowledgedEmergencies.map((alert) => (
            <div key={alert.id} className="bg-red-600 text-white rounded-xl p-4 md:p-5 flex items-start gap-3 md:gap-4 shadow-xl animate-pulse border-2 border-red-400">
              <div className="w-11 h-11 md:w-14 md:h-14 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 ring-4 ring-white/30">
                <Shield className="w-5 h-5 md:w-7 md:h-7" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-base md:text-lg font-bold flex items-center gap-2">🚨 EMERGENCY — Room {alert.roomNumber}</div>
                <div className="text-sm text-red-100 mt-1"><span className="font-medium text-white">Guest:</span> {alert.guestName}</div>
                <div className="text-sm text-red-100"><span className="font-medium text-white">Message:</span> {alert.message}</div>
                <div className="text-xs text-red-200 mt-1">{alert.createdAt} · {alert.id}</div>
              </div>
              <button
                onClick={() => {
                  acknowledgeEmergency(alert.id);
                  addToast("warning", "Emergency acknowledged", `Alert from Room ${alert.roomNumber} has been acknowledged.`);
                }}
                className="px-3 md:px-4 py-2 bg-white text-red-700 rounded-md text-xs md:text-sm font-medium hover:bg-red-50 flex-shrink-0 flex items-center gap-1"
              >
                <Check className="w-4 h-4" /> Acknowledge
              </button>
            </div>
          ))}
        </div>
      )}

      {/* OPEN REQUESTS BANNER */}
      {openRequests.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-medium text-amber-900">{openRequests.length} open guest request{openRequests.length > 1 ? "s" : ""}</div>
              <div className="text-xs text-amber-700">
                {openRequests.filter((r) => r.priority === "Urgent").length > 0 && (
                  <span className="text-red-700 font-medium">{openRequests.filter((r) => r.priority === "Urgent").length} urgent · </span>
                )}
                {openRequests.filter((r) => r.type === "Room Change").length > 0 && (
                  <span>{openRequests.filter((r) => r.type === "Room Change").length} room change · </span>
                )}
                {openRequests.filter((r) => r.type === "Housekeeping").length > 0 && (
                  <span>{openRequests.filter((r) => r.type === "Housekeeping").length} housekeeping · </span>
                )}
                {openRequests.filter((r) => r.type === "Maintenance").length > 0 && (
                  <span>{openRequests.filter((r) => r.type === "Maintenance").length} maintenance</span>
                )}
              </div>
            </div>
          </div>
          <a href="#/dashboard/frontdesk" className="px-3 py-2 bg-amber-600 text-white rounded-md text-xs hover:bg-amber-700 flex-shrink-0">
            View in Front Desk →
          </a>
        </div>
      )}

      {/* SYSTEM ALERTS — under emergency & requests */}
      <Card title="System Alerts" subtitle="Real-time notifications">
        <div className="space-y-3">
          {[
            { icon: <Bell className="w-4 h-4" />, text: "Room R108 flagged for makeup — housekeeping dispatched", time: "12 min ago", tone: "amber" },
            { icon: <Sparkles className="w-4 h-4" />, text: "Platinum guest Priya Kapoor (G005) in-house — VIP turndown scheduled", time: "1 hr ago", tone: "gold" },
            { icon: <CalendarCheck className="w-4 h-4" />, text: "14 new reservations reconciled today", time: "2 hr ago", tone: "emerald" },
            { icon: <TrendingUp className="w-4 h-4" />, text: "Dynamic pricing adjusted rates +12% for next weekend (high demand)", time: "3 hr ago", tone: "brand" },
          ].map((n, i) => (
            <div key={i} className="flex items-start gap-3 p-3 rounded-md bg-cream-50">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${n.tone === "amber" ? "bg-amber-100 text-amber-700" : n.tone === "gold" ? "bg-yellow-100 text-yellow-700" : n.tone === "emerald" ? "bg-brand-100 text-brand-700" : "bg-brand-100 text-brand-700"}`}>
                {n.icon}
              </div>
              <div className="flex-1">
                <div className="text-sm text-brand-900">{n.text}</div>
                <div className="text-xs text-brand-500 mt-0.5">{n.time}</div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* KPI CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPI icon={<Bed className="w-5 h-5" />} label="Occupancy Rate" value={`${occupancy}%`} subtext={`${occupied}/${rooms.length} rooms`} trend="+4.2%" positive color="emerald" />
        <KPI icon={<DollarSign className="w-5 h-5" />} label="ADR (7-day avg)" value={`₱${adr}`} subtext="Avg. Daily Rate" trend="+₱18" positive color="gold" />
        <KPI icon={<TrendingUp className="w-5 h-5" />} label="RevPAR (7-day)" value={`₱${Math.round(occupancy / 100 * adr)}`} subtext="Revenue per available room" trend="+6.1%" positive color="brand" />
        <KPI icon={<DollarSign className="w-5 h-5" />} label="Revenue (30d)" value={`₱${(revenue30 / 1000).toFixed(1)}k`} subtext={`vs prev period`} trend={`${revGrowth > 0 ? "+" : ""}${revGrowth}%`} positive={revGrowth > 0} color="indigo" />
      </div>

      {/* SECONDARY STATS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatPill icon={<CalendarCheck className="w-4 h-4" />} label="Today's Arrivals" value={todayArrivals} />
        <StatPill icon={<Activity className="w-4 h-4" />} label="In-House Guests" value={inHouse} />
        <StatPill icon={<Clock className="w-4 h-4" />} label="Today's Departures" value={todayDepartures} />
        <StatPill icon={<UsersIcon className="w-4 h-4" />} label="Loyalty Members" value={guests.length} />
      </div>

      {/* CHARTS ROW */}
      <div className="grid lg:grid-cols-3 gap-6">
        <Card title="30-Day Performance" subtitle="Occupancy, ADR & revenue trend" className="lg:col-span-2">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyMetrics}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#245435" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#245435" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#52525b" }} />
                <YAxis yAxisId="left" tick={{ fontSize: 11, fill: "#52525b" }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: "#52525b" }} />
                <Tooltip contentStyle={{ background: "#fff", border: "1px solid #d6d3d1", borderRadius: 8, fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Area yAxisId="left" type="monotone" dataKey="occupancy" stroke="#5fa06e" fillOpacity={1} fill="url(#colorRev)" name="Occupancy %" />
                <Line yAxisId="right" type="monotone" dataKey="adr" stroke="#b8923f" strokeWidth={2} dot={false} name="ADR ($)" />
                <Line yAxisId="right" type="monotone" dataKey="revpar" stroke="#1e40af" strokeWidth={2} dot={false} name="RevPAR ($)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Room Status" subtitle="Live inventory snapshot">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={statusData} dataKey="value" cx="50%" cy="50%" innerRadius={50} outerRadius={85} paddingAngle={2}>
                  {statusData.map((s, i) => <Cell key={i} fill={s.color} />)}
                </Pie>
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* BOOKING SOURCES & ACTIVITY */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card title="Booking Sources" subtitle="Bookings by source (30 days)">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={bookingSources}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#52525b" }} />
                <YAxis tick={{ fontSize: 11, fill: "#52525b" }} />
                <Tooltip contentStyle={{ background: "#fff", border: "1px solid #d6d3d1", borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="bookings30d" fill="#245435" radius={[6, 6, 0, 0]} name="Bookings" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Revenue Forecast" subtitle="Next 14 days based on booking pace">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={Array.from({ length: 14 }).map((_, i) => ({
                day: `D+${i + 1}`,
                forecast: Math.round(8000 + Math.sin(i / 2) * 2500 + Math.random() * 1500),
                actual: i < 3 ? Math.round(7500 + Math.random() * 2000) : undefined,
              }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#52525b" }} />
                <YAxis tick={{ fontSize: 11, fill: "#52525b" }} />
                <Tooltip contentStyle={{ background: "#fff", border: "1px solid #d6d3d1", borderRadius: 8, fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="forecast" stroke="#b8923f" strokeWidth={2} strokeDasharray="5 5" name="Forecast" />
                <Line type="monotone" dataKey="actual" stroke="#245435" strokeWidth={2} name="Actual" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* LISTS */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card title="Upcoming Arrivals" subtitle="Next confirmed check-ins" action={<a href="#" className="text-xs text-brand-600 hover:text-brand-900">View all →</a>}>
          <div className="divide-y divide-brand-100">
            {upcomingRes.map((r) => (
              <div key={r.id} className="flex items-center justify-between py-3">
                <div>
                  <div className="font-medium text-brand-900 text-sm">{r.guestName}</div>
                  <div className="text-xs text-brand-600">{r.id} · {r.checkIn} → {r.checkOut}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-brand-900">₱{r.totalAmount}</div>
                  <span className="text-xs px-2 py-0.5 bg-brand-50 text-brand-700 rounded-full">{r.rateCode}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Upcoming Events" subtitle="MICE calendar" action={<a href="#" className="text-xs text-brand-600 hover:text-brand-900">View all →</a>}>
          <div className="divide-y divide-brand-100">
            {upcomingEvents.map((e) => (
              <div key={e.id} className="flex items-center justify-between py-3">
                <div>
                  <div className="font-medium text-brand-900 text-sm">{e.title}</div>
                  <div className="text-xs text-brand-600">{e.date} · {e.venue} · {e.guests} guests</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-brand-900">₱{e.budget.toLocaleString()}</div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${e.status === "Confirmed" ? "bg-brand-100 text-brand-800" : e.status === "Proposal" ? "bg-gold-100 text-gold-700" : "bg-amber-100 text-amber-800"}`} style={{ background: e.status === "Proposal" ? "#fef3c7" : undefined, color: e.status === "Proposal" ? "#92400e" : undefined }}>{e.status}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>



    </div>
  );
}

function timeOfDay() {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 18) return "afternoon";
  return "evening";
}

function Card({ title, subtitle, action, children, className = "" }: { title: string; subtitle?: string; action?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-xl border border-brand-100 p-6 ${className}`}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="font-serif text-xl text-brand-900">{title}</div>
          {subtitle && <div className="text-xs text-brand-600 mt-0.5">{subtitle}</div>}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

function KPI({ icon, label, value, subtext, trend, positive, color }: { icon: React.ReactNode; label: string; value: string; subtext: string; trend: string; positive: boolean; color: string }) {
  const colorMap: Record<string, string> = {
    emerald: "bg-brand-100 text-brand-700",
    gold: "bg-yellow-100 text-yellow-700",
    brand: "bg-brand-100 text-brand-700",
    indigo: "bg-indigo-100 text-indigo-700",
  };
  return (
    <div className="bg-white rounded-xl border border-brand-100 p-5">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-lg ${colorMap[color]} flex items-center justify-center`}>{icon}</div>
        <div className={`text-xs font-medium flex items-center gap-0.5 ${positive ? "text-brand-600" : "text-red-600"}`}>
          {positive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />} {trend}
        </div>
      </div>
      <div className="font-serif text-3xl text-brand-900">{value}</div>
      <div className="text-sm font-medium text-brand-800 mt-1">{label}</div>
      <div className="text-xs text-brand-500 mt-0.5">{subtext}</div>
    </div>
  );
}

function StatPill({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="bg-white rounded-xl border border-brand-100 px-4 py-3 flex items-center gap-3">
      <div className="w-9 h-9 rounded-full bg-brand-50 text-brand-700 flex items-center justify-center">{icon}</div>
      <div>
        <div className="text-xs text-brand-600 uppercase tracking-wider">{label}</div>
        <div className="font-serif text-xl text-brand-900">{value}</div>
      </div>
    </div>
  );
}
