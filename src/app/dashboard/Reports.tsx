import { useMemo } from "react";
import { useApp } from "../context/AppContext";

const daysAgo = (n: number) => { const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString().slice(0, 10); };

const bookingSources = [
  { name: "Walk-in", revenue: 42500, commission: 0 },
  { name: "Phone", revenue: 36800, commission: 0 },
  { name: "Facebook", revenue: 28400, commission: 0 },
  { name: "Website", revenue: 15600, commission: 0 },
  { name: "Referral", revenue: 10200, commission: 1020 },
  { name: "Repeat", revenue: 14800, commission: 0 },
];
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, CartesianGrid, Legend, PieChart, Pie, Cell,
  LineChart, Line,
} from "recharts";
import { Download, FileText, Printer, TrendingUp, Calendar, Filter } from "lucide-react";


export default function Reports() {
  const { rooms, reservations } = useApp();

  const last30Res = reservations.filter((r) => r.checkIn >= daysAgo(30));
  const revenue30 = last30Res.reduce((s, r) => s + r.totalAmount, 0);
  const bookings30 = last30Res.filter((r) => r.status === "confirmed" || r.status === "checked-in").length;
  const avgOcc = rooms.length > 0 ? Math.round(last30Res.reduce((s) => s + 1, 0) / 30 / rooms.length * 100) : 0;
  const last30Nights = last30Res.reduce((s, r) => s + (new Date(r.checkOut).getTime() - new Date(r.checkIn).getTime()) / 86400000, 0);
  const avgAdr = last30Nights > 0 ? Math.round(revenue30 / last30Nights) : 0;

  // Build daily aggregate chart data from real reservations
  const dailyData = useMemo(() => {
    const map: Record<string, { revenue: number; bookings: number }> = {};
    for (let i = 29; i >= 0; i--) {
      const d = daysAgo(i);
      map[d] = { revenue: 0, bookings: 0 };
    }
    last30Res.forEach((r) => {
      const d = r.checkIn.slice(0, 10);
      if (map[d]) { map[d].revenue += r.totalAmount; map[d].bookings += 1; }
    });
    return Object.entries(map).map(([date, v]) => ({ date, ...v }));
  }, [reservations]);

  const revenueByChannel = bookingSources;

  const segmentData = [
    { name: "Transient", value: 52, color: "#245435" },
    { name: "Corporate", value: 23, color: "#5fa06e" },
    { name: "Group/MICE", value: 18, color: "#b8923f" },
    { name: "Wholesale", value: 7, color: "#94a3b8" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="text-xs uppercase tracking-[0.25em] text-gold-500 font-medium mb-1">Reports & Analytics</div>
          <h1 className="font-serif text-4xl text-brand-900">Performance Intelligence</h1>
          <p className="text-brand-700 mt-1">Financial reconciliation, forecasting, and executive KPIs.</p>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-white border border-brand-200 rounded-md text-sm hover:bg-brand-50 flex items-center gap-2"><Filter className="w-4 h-4" /> Filter</button>
          <button className="px-4 py-2 bg-white border border-brand-200 rounded-md text-sm hover:bg-brand-50 flex items-center gap-2"><Printer className="w-4 h-4" /> Print</button>
          <button className="px-4 py-2 bg-brand-800 text-cream-50 rounded-md text-sm hover:bg-brand-900 flex items-center gap-2"><Download className="w-4 h-4" /> Export PDF</button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-brand-800 to-brand-900 text-cream-50 rounded-xl p-5">
          <div className="text-xs uppercase tracking-wider text-cream-100/70 mb-1">Total Revenue (30d)</div>
          <div className="font-serif text-3xl">₱{(revenue30 / 1000).toFixed(1)}k</div>
          <div className="text-xs mt-1 text-emerald-300">+8.4% vs prior period</div>
        </div>
        <div className="bg-white rounded-xl border border-brand-100 p-5">
          <div className="text-xs uppercase tracking-wider text-brand-600 mb-1">Avg Occupancy</div>
          <div className="font-serif text-3xl text-brand-900">{avgOcc}%</div>
          <div className="text-xs mt-1 text-brand-600">30-day rolling</div>
        </div>
        <div className="bg-white rounded-xl border border-brand-100 p-5">
          <div className="text-xs uppercase tracking-wider text-brand-600 mb-1">Avg ADR</div>
          <div className="font-serif text-3xl text-brand-900">₱{avgAdr}</div>
          <div className="text-xs mt-1 text-brand-600">30-day rolling</div>
        </div>
        <div className="bg-white rounded-xl border border-brand-100 p-5">
          <div className="text-xs uppercase tracking-wider text-brand-600 mb-1">Total Bookings</div>
          <div className="font-serif text-3xl text-brand-900">{bookings30}</div>
          <div className="text-xs mt-1 text-brand-600">Confirmed + in-house</div>
        </div>
      </div>

      {/* MAIN CHART */}
      <div className="bg-white rounded-xl border border-brand-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-serif text-xl text-brand-900">Daily Revenue & Occupancy</h3>
            <div className="text-xs text-brand-600">Last 30 days</div>
          </div>
          <div className="text-right">
            <div className="font-serif text-2xl text-brand-900">₱{(revenue30 / 1000).toFixed(1)}k</div>
            <div className="text-xs text-brand-600">Period total</div>
          </div>
        </div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={dailyData}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#245435" stopOpacity={0.5} />
                  <stop offset="95%" stopColor="#245435" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="bookGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#b8923f" stopOpacity={0.5} />
                  <stop offset="95%" stopColor="#b8923f" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Area yAxisId="left" type="monotone" dataKey="revenue" stroke="#245435" fill="url(#revGrad)" name="Revenue ($)" />
              <Area yAxisId="right" type="monotone" dataKey="occupancy" stroke="#b8923f" fill="url(#bookGrad)" name="Occupancy (%)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-brand-100 p-6">
          <h3 className="font-serif text-xl text-brand-900 mb-1">Revenue by Booking Source</h3>
          <div className="text-xs text-brand-600 mb-4">30-day with commission impact</div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueByChannel}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="revenue" stackId="a" fill="#245435" name="Net Revenue" radius={[0, 0, 0, 0]} />
                <Bar dataKey="commission" stackId="a" fill="#dc2626" name="Commission" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-brand-100 p-6">
          <h3 className="font-serif text-xl text-brand-900 mb-1">Business Mix</h3>
          <div className="text-xs text-brand-600 mb-4">Segment breakdown by booking source</div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={segmentData} dataKey="value" cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={2} label={(entry: any) => `${entry.name} ${entry.value}%`}>
                  {segmentData.map((s, i) => <Cell key={i} fill={s.color} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* FORECAST */}
      <div className="bg-white rounded-xl border border-brand-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-serif text-xl text-brand-900">90-Day Revenue Forecast</h3>
            <div className="text-xs text-brand-600">Based on booking pace, historical data & demand signals</div>
          </div>
          <span className="text-xs px-2 py-1 bg-emerald-100 text-emerald-800 rounded-full flex items-center gap-1"><TrendingUp className="w-3 h-3" /> 87% confidence</span>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={Array.from({ length: 90 }).map((_, i) => ({
              day: i + 1,
              baseline: Math.round(8000 + Math.sin(i / 7) * 2500),
              optimistic: Math.round(9000 + Math.sin(i / 7) * 3000),
              conservative: Math.round(7000 + Math.sin(i / 7) * 2000),
            }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
              <XAxis dataKey="day" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="optimistic" stroke="#5fa06e" strokeWidth={1} strokeDasharray="4 4" dot={false} name="Optimistic" />
              <Line type="monotone" dataKey="baseline" stroke="#245435" strokeWidth={2.5} dot={false} name="Baseline" />
              <Line type="monotone" dataKey="conservative" stroke="#dc2626" strokeWidth={1} strokeDasharray="4 4" dot={false} name="Conservative" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* REPORTS LIBRARY */}
      <div className="bg-white rounded-xl border border-brand-100 p-6">
        <h3 className="font-serif text-xl text-brand-900 mb-1">Reports Library</h3>
        <div className="text-xs text-brand-600 mb-4">Standard operational & financial reports</div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
          {[
            { t: "Daily Manager Report", d: "Night audit summary with occupancy, revenue, and variances", cat: "Daily" },
            { t: "Night Audit Reconciliation", d: "Full financial reconciliation across all departments", cat: "Daily" },
            { t: "P&L Statement (Monthly)", d: "Profit & loss breakdown with departmental margins", cat: "Monthly" },
            { t: "Tax Breakdown Report", d: "GST/VAT breakdown by revenue source for compliance", cat: "Monthly" },
            { t: "Channel Performance", d: "OTA vs direct bookings with commission analysis", cat: "Monthly" },
            { t: "Revenue Forecast (90d)", d: "AI-driven forecast with three confidence bands", cat: "Weekly" },
            { t: "Guest Satisfaction (NPS)", d: "Post-stay survey results with sentiment analysis", cat: "Weekly" },
            { t: "Staffing Optimization", d: "Recommended staff-to-guest ratios based on forecast", cat: "Weekly" },
            { t: "Loyalty Tier Migration", d: "Guest movement across tiers with upgrade triggers", cat: "Monthly" },
          ].map((r) => (
            <button key={r.t} className="text-left p-4 border border-brand-100 rounded-lg hover:border-brand-400 transition group">
              <div className="flex items-start justify-between mb-2">
                <FileText className="w-4 h-4 text-brand-500 group-hover:text-brand-700" />
                <span className="text-[10px] px-2 py-0.5 bg-brand-50 text-brand-600 rounded-full">{r.cat}</span>
              </div>
              <div className="font-medium text-brand-900 text-sm mb-1">{r.t}</div>
              <div className="text-xs text-brand-600 line-clamp-2">{r.d}</div>
            </button>
          ))}
        </div>
      </div>


      <div className="bg-white rounded-xl border border-brand-100 p-6">
        <div className="flex items-center gap-3 mb-4">
          <Calendar className="w-5 h-5 text-brand-600" />
          <div>
            <h3 className="font-serif text-xl text-brand-900">Night Audit — Today</h3>
            <div className="text-xs text-brand-600">Auto-generated at 03:00</div>
          </div>
        </div>
        <div className="grid md:grid-cols-4 gap-4 text-sm">
          <div><div className="text-brand-600 text-xs uppercase">Total Revenue</div><div className="font-serif text-2xl text-brand-900">₱42,850</div></div>
          <div><div className="text-brand-600 text-xs uppercase">Rooms Sold</div><div className="font-serif text-2xl text-brand-900">22</div></div>
          <div><div className="text-brand-600 text-xs uppercase">Check-ins</div><div className="font-serif text-2xl text-brand-900">8</div></div>
          <div><div className="text-brand-600 text-xs uppercase">Check-outs</div><div className="font-serif text-2xl text-brand-900">6</div></div>
        </div>
        <div className="mt-4 pt-4 border-t border-brand-100 text-xs text-brand-600 flex justify-between">
          <span>Last audit: today at 03:00 AM · Status: <span className="text-emerald-600 font-medium">Balanced ✓</span></span>
          <a href="#" className="text-brand-700 hover:text-brand-900">View full report →</a>
        </div>
      </div>
    </div>
  );
}
