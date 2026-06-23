import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Legend, Cell,
} from "recharts";
import { TrendingUp, TrendingDown, Zap, CalendarDays, Percent, DollarSign, Edit2, Check, X, Plus, Sparkles, Trash2 } from "lucide-react";

interface RateCode {
  id: string;
  name: string;
  discount: number;
  description: string | null;
  active: boolean;
}

const competitorRates = [
  { name: "Aquawood", rate: 285, ours: true },
  { name: "Serenity Bay", rate: 265, ours: false },
  { name: "Lotus Palace", rate: 310, ours: false },
  { name: "Garden Cove", rate: 248, ours: false },
  { name: "Lagoon Resort", rate: 295, ours: false },
];

const emptyForm: RateCode = { id: "", name: "", discount: 0, description: "", active: true };

export default function Revenue() {
  const [rates, setRates] = useState<RateCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<RateCode | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<RateCode>(emptyForm);
  const [adrSeries, setAdrSeries] = useState<{ date: string; adr: number }[]>([]);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from("rate_codes").select("*").order("id");
      setRates((data || []) as RateCode[]);

      // Load last 14 days reservations to compute ADR
      const since = new Date();
      since.setDate(since.getDate() - 14);
      const { data: res } = await supabase
        .from("reservations")
        .select("check_in,check_out,total_amount,status")
        .gte("check_in", since.toISOString().slice(0, 10))
        .neq("status", "cancelled");
      const buckets: Record<string, { rev: number; nights: number }> = {};
      (res || []).forEach((r) => {
        const ci = new Date(r.check_in);
        const co = new Date(r.check_out);
        const nights = Math.max(1, Math.round((+co - +ci) / 86400000));
        const perNight = Number(r.total_amount) / nights;
        for (let i = 0; i < nights; i++) {
          const d = new Date(ci);
          d.setDate(d.getDate() + i);
          const k = d.toISOString().slice(0, 10);
          if (!buckets[k]) buckets[k] = { rev: 0, nights: 0 };
          buckets[k].rev += perNight;
          buckets[k].nights += 1;
        }
      });
      const series = Object.entries(buckets)
        .sort(([a], [b]) => (a < b ? -1 : 1))
        .map(([date, v]) => ({ date, adr: Math.round(v.rev / v.nights) }));
      setAdrSeries(series);
      setLoading(false);
    };
    load();

    const ch = supabase
      .channel("rate_codes_changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "rate_codes" }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const todayAdr = adrSeries.length ? adrSeries[adrSeries.length - 1].adr : 285;
  const prevAdr = adrSeries.length > 7 ? adrSeries[adrSeries.length - 8].adr : todayAdr;
  const adrDelta = prevAdr ? Math.round(((todayAdr - prevAdr) / prevAdr) * 100) : 0;

  const demandForecast = useMemo(() => Array.from({ length: 14 }).map((_, i) => ({
    day: `+${i + 1}`,
    base: todayAdr + Math.round(Math.sin(i / 2.5) * 40),
    dynamic: todayAdr + Math.round(Math.sin(i / 2.5) * 40) + (i % 7 >= 5 ? 60 : 0),
  })), [todayAdr]);

  const openCreate = () => { setEditing(null); setForm({ ...emptyForm, id: `RC-${Date.now().toString(36).toUpperCase()}` }); setShowForm(true); };
  const openEdit = (rc: RateCode) => { setEditing(rc); setForm(rc); setShowForm(true); };

  const save = async () => {
    if (!form.id || !form.name) return;
    const payload = { id: form.id, name: form.name, discount: Number(form.discount) || 0, description: form.description, active: form.active };
    if (editing) {
      await supabase.from("rate_codes").update(payload).eq("id", editing.id);
    } else {
      await supabase.from("rate_codes").insert(payload);
    }
    setShowForm(false);
  };

  const toggleActive = async (rc: RateCode) => {
    await supabase.from("rate_codes").update({ active: !rc.active }).eq("id", rc.id);
  };

  const remove = async (rc: RateCode) => {
    if (!confirm(`Delete rate code "${rc.name}"?`)) return;
    await supabase.from("rate_codes").delete().eq("id", rc.id);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="text-xs uppercase tracking-[0.25em] text-gold-500 font-medium mb-1">Revenue Management</div>
          <h1 className="font-serif text-4xl text-brand-900">Pricing & Demand</h1>
          <p className="text-brand-700 mt-1">Dynamic pricing engine, rate codes, and competitive intelligence.</p>
        </div>
        <button className="px-4 py-2 bg-gold-500 text-white rounded-md text-sm hover:bg-gold-600 flex items-center gap-2"><Zap className="w-4 h-4" /> Run Price Optimization</button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-brand-100 p-5">
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs uppercase tracking-wider text-brand-600">Current BAR</div>
            <DollarSign className="w-4 h-4 text-brand-400" />
          </div>
          <div className="font-serif text-3xl text-brand-900">₱{todayAdr}</div>
          <div className={`text-xs mt-1 flex items-center gap-1 ${adrDelta >= 0 ? "text-brand-600" : "text-red-600"}`}>
            {adrDelta >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {adrDelta >= 0 ? "+" : ""}{adrDelta}% vs last week
          </div>
        </div>
        <div className="bg-white rounded-xl border border-brand-100 p-5">
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs uppercase tracking-wider text-brand-600">Demand Index</div>
            <TrendingUp className="w-4 h-4 text-brand-400" />
          </div>
          <div className="font-serif text-3xl text-brand-900">1.18</div>
          <div className="text-xs mt-1 text-brand-600">+18% above historical pace</div>
        </div>
        <div className="bg-white rounded-xl border border-brand-100 p-5">
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs uppercase tracking-wider text-brand-600">Market Penetration</div>
            <Percent className="w-4 h-4 text-brand-400" />
          </div>
          <div className="font-serif text-3xl text-brand-900">112%</div>
          <div className="text-xs mt-1 text-brand-600">MPI — fair share is 100%</div>
        </div>
        <div className="bg-white rounded-xl border border-brand-100 p-5">
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs uppercase tracking-wider text-brand-600">Forecast Accuracy</div>
            <Sparkles className="w-4 h-4 text-gold-500" />
          </div>
          <div className="font-serif text-3xl text-brand-900">94.2%</div>
          <div className="text-xs mt-1 text-brand-600">30-day rolling window</div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-brand-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-serif text-xl text-brand-900">Dynamic Pricing Recommendation</h3>
              <div className="text-xs text-brand-600">Next 14 days — base BAR vs. optimized</div>
            </div>
            <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full flex items-center gap-1"><Zap className="w-3 h-3" /> AI-Optimized</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={demandForecast}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="base" stroke="#94a3b8" strokeWidth={2} strokeDasharray="4 4" dot={false} name="Base BAR" />
                <Line type="monotone" dataKey="dynamic" stroke="#b8923f" strokeWidth={2.5} dot={false} name="Optimized" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-brand-100 p-6">
          <h3 className="font-serif text-xl text-brand-900 mb-1">Competitive Set</h3>
          <div className="text-xs text-brand-600 mb-4">Average BAR comparison (5-star garden resorts)</div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={competitorRates}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Bar dataKey="rate" name="BAR ($)" radius={[6, 6, 0, 0]}>
                  {competitorRates.map((e, i) => (
                    <Cell key={i} fill={e.ours ? "#245435" : "#94a3b8"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-brand-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-serif text-xl text-brand-900">Rate Codes & Packages</h3>
            <div className="text-xs text-brand-600">Negotiated rates, loyalty tiers, and bundled packages</div>
          </div>
          <button onClick={openCreate} className="px-3 py-2 bg-brand-800 text-cream-50 rounded-md text-xs hover:bg-brand-900 flex items-center gap-1"><Plus className="w-3 h-3" /> Add Rate Code</button>
        </div>

        {loading ? (
          <div className="text-sm text-brand-600 py-8 text-center">Loading rate codes…</div>
        ) : rates.length === 0 ? (
          <div className="text-sm text-brand-600 py-8 text-center border border-dashed border-brand-200 rounded-lg">
            No rate codes yet. Click <span className="font-medium">Add Rate Code</span> to create one.
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {rates.map((rc) => (
              <div key={rc.id} className="border border-brand-100 rounded-lg p-4 hover:border-brand-300 transition">
                <div className="flex items-start justify-between mb-2">
                  <div className="font-mono text-xs text-brand-500">{rc.id}</div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => toggleActive(rc)} title={rc.active ? "Active" : "Inactive"}>
                      {rc.active ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <X className="w-3.5 h-3.5 text-red-500" />}
                    </button>
                    <button onClick={() => openEdit(rc)} className="text-xs text-brand-600 hover:text-brand-900 ml-1"><Edit2 className="w-3 h-3" /></button>
                    <button onClick={() => remove(rc)} className="text-xs text-red-500 hover:text-red-700 ml-1"><Trash2 className="w-3 h-3" /></button>
                  </div>
                </div>
                <div className="font-medium text-brand-900 mb-1">{rc.name}</div>
                <div className="text-xs text-brand-600 mb-3 line-clamp-2">{rc.description}</div>
                <div className="flex items-baseline justify-between">
                  <span className="text-xs text-brand-600">Discount</span>
                  <span className="font-serif text-lg text-gold-600">-{rc.discount}%</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl border border-brand-100 p-6">
        <h3 className="font-serif text-xl text-brand-900 mb-1">Inventory Controls</h3>
        <div className="text-xs text-brand-600 mb-4">Length-of-stay restrictions and close-to-arrival rules</div>
        <div className="grid md:grid-cols-3 gap-4">
          {[
            { p: "Dec 22 – Jan 2", mlos: "4 nights min", cta: "Closed arrivals Dec 24, 31", note: "Holiday peak season" },
            { p: "Feb 14 (Valentine's)", mlos: "2 nights min", cta: "Open", note: "Romance package push" },
            { p: "Apr 10 – 14 (Songkran)", mlos: "3 nights min", cta: "Closed arrivals Apr 12", note: "Festival weekend" },
          ].map((r, i) => (
            <div key={i} className="border border-brand-100 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <CalendarDays className="w-4 h-4 text-brand-600" />
                <div className="font-medium text-brand-900 text-sm">{r.p}</div>
              </div>
              <div className="text-xs space-y-1 text-brand-700">
                <div><span className="text-brand-500">MLOS:</span> {r.mlos}</div>
                <div><span className="text-brand-500">CTA:</span> {r.cta}</div>
                <div className="text-brand-500 italic pt-1">{r.note}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-serif text-xl text-brand-900">{editing ? "Edit Rate Code" : "New Rate Code"}</h3>
              <button onClick={() => setShowForm(false)}><X className="w-4 h-4 text-brand-600" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-brand-600">Code ID</label>
                <input disabled={!!editing} value={form.id} onChange={(e) => setForm({ ...form, id: e.target.value.toUpperCase() })} className="w-full mt-1 px-3 py-2 border border-brand-200 rounded text-sm disabled:bg-brand-50" />
              </div>
              <div>
                <label className="text-xs text-brand-600">Name</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full mt-1 px-3 py-2 border border-brand-200 rounded text-sm" />
              </div>
              <div>
                <label className="text-xs text-brand-600">Description</label>
                <textarea value={form.description || ""} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full mt-1 px-3 py-2 border border-brand-200 rounded text-sm" rows={2} />
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-xs text-brand-600">Discount %</label>
                  <input type="number" value={form.discount} onChange={(e) => setForm({ ...form, discount: Number(e.target.value) })} className="w-full mt-1 px-3 py-2 border border-brand-200 rounded text-sm" />
                </div>
                <div className="flex-1">
                  <label className="text-xs text-brand-600">Status</label>
                  <select value={form.active ? "1" : "0"} onChange={(e) => setForm({ ...form, active: e.target.value === "1" })} className="w-full mt-1 px-3 py-2 border border-brand-200 rounded text-sm">
                    <option value="1">Active</option>
                    <option value="0">Inactive</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button onClick={() => setShowForm(false)} className="px-3 py-2 text-sm text-brand-700 hover:bg-brand-50 rounded">Cancel</button>
                <button onClick={save} className="px-4 py-2 bg-brand-800 text-cream-50 text-sm rounded hover:bg-brand-900">{editing ? "Save" : "Create"}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
