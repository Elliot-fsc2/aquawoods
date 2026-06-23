import { useApp } from "../context/AppContext";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { Search, Mail, Star, Award, Heart, Send, Plus, Phone, MapPin } from "lucide-react";
import { useState } from "react";


const tierColors: Record<string, { bg: string; text: string; ring: string }> = {
  Bronze: { bg: "bg-orange-100", text: "text-orange-800", ring: "ring-orange-300" },
  Silver: { bg: "bg-slate-200", text: "text-slate-800", ring: "ring-slate-400" },
  Gold: { bg: "bg-yellow-100", text: "text-yellow-800", ring: "ring-yellow-400" },
  Platinum: { bg: "bg-indigo-100", text: "text-indigo-800", ring: "ring-indigo-400" },
};

export default function CRM() {
  const { guests } = useApp();
  const [search, setSearch] = useState("");
  const [tierFilter, setTierFilter] = useState("all");
  const [selected, setSelected] = useState(guests[0]);

  const filtered = guests.filter((g) =>
    (tierFilter === "all" || g.loyaltyTier === tierFilter) &&
    (g.name.toLowerCase().includes(search.toLowerCase()) || g.email.toLowerCase().includes(search.toLowerCase()))
  );

  const tierDist = [
    { name: "Bronze", value: guests.filter((g) => g.loyaltyTier === "Bronze").length, color: "#fb923c" },
    { name: "Silver", value: guests.filter((g) => g.loyaltyTier === "Silver").length, color: "#94a3b8" },
    { name: "Gold", value: guests.filter((g) => g.loyaltyTier === "Gold").length, color: "#fbbf24" },
    { name: "Platinum", value: guests.filter((g) => g.loyaltyTier === "Platinum").length, color: "#6366f1" },
  ];

  const lifetimeValue = [
    { tier: "Bronze", avg: 2400 },
    { tier: "Silver", avg: 6800 },
    { tier: "Gold", avg: 15200 },
    { tier: "Platinum", avg: 28100 },
  ];

  const totalPoints = guests.reduce((s, g) => s + g.points, 0);
  const totalSpent = guests.reduce((s, g) => s + g.totalSpent, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="text-xs uppercase tracking-[0.25em] text-gold-500 font-medium mb-1">Guest CRM</div>
          <h1 className="font-serif text-4xl text-brand-900">Guest Profiles & Loyalty</h1>
          <p className="text-brand-700 mt-1">Relationships that turn first-time guests into lifelong advocates.</p>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-white border border-brand-200 rounded-md text-sm hover:bg-brand-50 flex items-center gap-2"><Mail className="w-4 h-4" /> Campaign</button>
          <button className="px-4 py-2 bg-brand-800 text-cream-50 rounded-md text-sm hover:bg-brand-900 flex items-center gap-2"><Plus className="w-4 h-4" /> New Guest</button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-brand-100 p-5">
          <Heart className="w-5 h-5 text-pink-500 mb-2" />
          <div className="font-serif text-3xl text-brand-900">{guests.length}</div>
          <div className="text-sm text-brand-700">Total Guests</div>
        </div>
        <div className="bg-white rounded-xl border border-brand-100 p-5">
          <Award className="w-5 h-5 text-indigo-500 mb-2" />
          <div className="font-serif text-3xl text-brand-900">{guests.filter((g) => g.loyaltyTier === "Gold" || g.loyaltyTier === "Platinum").length}</div>
          <div className="text-sm text-brand-700">Premium Members</div>
        </div>
        <div className="bg-white rounded-xl border border-brand-100 p-5">
          <Star className="w-5 h-5 text-yellow-500 mb-2" />
          <div className="font-serif text-3xl text-brand-900">{(totalPoints / 1000).toFixed(0)}k</div>
          <div className="text-sm text-brand-700">Points Issued</div>
        </div>
        <div className="bg-white rounded-xl border border-brand-100 p-5">
          <Award className="w-5 h-5 text-gold-500 mb-2" />
          <div className="font-serif text-3xl text-brand-900">₱{(totalSpent / 1000).toFixed(0)}k</div>
          <div className="text-sm text-brand-700">Lifetime Value</div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl border border-brand-100 p-6">
          <h3 className="font-serif text-xl text-brand-900 mb-1">Loyalty Tiers</h3>
          <div className="text-xs text-brand-600 mb-4">Member distribution</div>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={tierDist} dataKey="value" cx="50%" cy="50%" innerRadius={40} outerRadius={70}>
                  {tierDist.map((s, i) => <Cell key={i} fill={s.color} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {tierDist.map((t) => (
              <div key={t.name} className="flex items-center gap-2 text-xs">
                <div className="w-3 h-3 rounded" style={{ background: t.color }} />
                <span className="text-brand-700">{t.name}</span>
                <span className="ml-auto font-medium">{t.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-brand-100 p-6 lg:col-span-2">
          <h3 className="font-serif text-xl text-brand-900 mb-1">Lifetime Value by Tier</h3>
          <div className="text-xs text-brand-600 mb-4">Average total spend per guest</div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={lifetimeValue}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                <XAxis dataKey="tier" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Bar dataKey="avg" name="Avg LTV ($)" radius={[6, 6, 0, 0]} fill="#245435" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl border border-brand-100 p-6 lg:col-span-2">
          <div className="flex items-center gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-brand-400" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search guests..." className="w-full pl-9 pr-4 py-2 text-sm border border-brand-200 rounded-md bg-cream-50 focus:outline-none focus:border-brand-500" />
            </div>
            <div className="flex gap-1">
              {["all", "Bronze", "Silver", "Gold", "Platinum"].map((t) => (
                <button key={t} onClick={() => setTierFilter(t)} className={`px-3 py-1.5 text-xs rounded-full capitalize ${tierFilter === t ? "bg-brand-800 text-cream-50" : "bg-brand-50 text-brand-700"}`}>
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div className="divide-y divide-brand-50 max-h-[500px] overflow-y-auto">
            {filtered.map((g) => {
              const isSelected = selected?.id === g.id;
              const tc = tierColors[g.loyaltyTier];
              return (
                <button key={g.id} onClick={() => setSelected(g)} className={`w-full text-left p-4 transition flex items-center gap-4 ${isSelected ? "bg-brand-50" : "hover:bg-brand-50/50"}`}>
                  <div className="w-11 h-11 rounded-full bg-gradient-to-br from-brand-600 to-brand-800 text-cream-50 flex items-center justify-center font-medium flex-shrink-0">
                    {g.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="font-medium text-brand-900 truncate">{g.name}</div>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full ${tc.bg} ${tc.text} ring-1 ${tc.ring}`}>{g.loyaltyTier}</span>
                    </div>
                    <div className="text-xs text-brand-600 truncate">{g.email} · {g.country}</div>
                    <div className="text-xs text-brand-500 mt-0.5">{g.totalStays} stays · ₱{g.totalSpent.toLocaleString()} spent · {g.points.toLocaleString()} pts</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-brand-100 p-6">
          {selected ? (
            <>
              <div className="text-center pb-4 border-b border-brand-100">
                <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-brand-600 to-brand-800 text-cream-50 flex items-center justify-center text-2xl font-serif mb-3">
                  {selected.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                </div>
                <div className="font-serif text-xl text-brand-900">{selected.name}</div>
                <div className={`inline-block text-xs px-3 py-0.5 rounded-full mt-2 ${tierColors[selected.loyaltyTier].bg} ${tierColors[selected.loyaltyTier].text}`}>
                  {selected.loyaltyTier} Member
                </div>
              </div>

              <div className="py-4 space-y-3 border-b border-brand-100 text-sm">
                <div className="flex items-center gap-2 text-brand-700"><Mail className="w-4 h-4" /> {selected.email}</div>
                <div className="flex items-center gap-2 text-brand-700"><Phone className="w-4 h-4" /> {selected.phone}</div>
                <div className="flex items-center gap-2 text-brand-700"><MapPin className="w-4 h-4" /> {selected.country}</div>
              </div>

              <div className="py-4 grid grid-cols-3 gap-2 text-center border-b border-brand-100">
                <div>
                  <div className="font-serif text-xl text-brand-900">{selected.totalStays}</div>
                  <div className="text-xs text-brand-600">Stays</div>
                </div>
                <div>
                  <div className="font-serif text-xl text-brand-900">₱{(selected.totalSpent / 1000).toFixed(1)}k</div>
                  <div className="text-xs text-brand-600">Spent</div>
                </div>
                <div>
                  <div className="font-serif text-xl text-brand-900">{(selected.points / 1000).toFixed(1)}k</div>
                  <div className="text-xs text-brand-600">Points</div>
                </div>
              </div>

              <div className="py-4 border-b border-brand-100">
                <div className="text-xs uppercase tracking-wider text-brand-600 mb-2">Preferences</div>
                <div className="flex flex-wrap gap-1">
                  {selected.preferences.map((p) => <span key={p} className="text-xs px-2 py-1 bg-brand-50 text-brand-700 rounded-full">{p}</span>)}
                </div>
              </div>

              <div className="py-4 border-b border-brand-100">
                <div className="text-xs uppercase tracking-wider text-brand-600 mb-1">Last Stay</div>
                <div className="text-sm text-brand-900">{selected.lastStay}</div>
              </div>

              <div className="pt-4 space-y-2">
                <button className="w-full py-2 bg-brand-800 text-cream-50 rounded-md text-sm hover:bg-brand-900 flex items-center justify-center gap-2"><Mail className="w-4 h-4" /> Send Personalized Offer</button>
                <button className="w-full py-2 border border-brand-200 rounded-md text-sm hover:bg-brand-50">View Full History</button>
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-brand-500 text-sm">Select a guest</div>
          )}
        </div>
      </div>


      {/* AUTOMATED ENGAGEMENT */}
      <div className="bg-white rounded-xl border border-brand-100 p-6">
        <h3 className="font-serif text-xl text-brand-900 mb-1">Automated Engagement Journeys</h3>
        <div className="text-xs text-brand-600 mb-4">Triggered by guest lifecycle events</div>
        <div className="grid md:grid-cols-3 gap-4">
          {[
            { t: "Welcome Email", d: "Sent after first booking with resort guide & loyalty enrollment", trigger: "First reservation" },
            { t: "Birthday Surprise", d: "Complimentary dessert + spa credit for members in their birthday month", trigger: "Date-based" },
            { t: "Win-Back Campaign", d: "Personalized offer after 180+ days of inactivity based on past preferences", trigger: "Inactivity trigger" },
            { t: "Post-Stay Review", d: "2h after check-out — review request + loyalty points incentive", trigger: "Check-out" },
            { t: "Anniversary Stay", d: "Tier upgrade notification + exclusive package offer", trigger: "Annual cycle" },
            { t: "Preference Match", d: "AI-driven offer when guest's favorite room becomes available", trigger: "Inventory match" },
          ].map((c) => (
            <div key={c.t} className="border border-brand-100 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Send className="w-4 h-4 text-gold-500" />
                <div className="font-medium text-brand-900 text-sm">{c.t}</div>
              </div>
              <div className="text-xs text-brand-600 mb-2">{c.d}</div>
              <div className="text-[10px] text-brand-500 italic">Trigger: {c.trigger}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
