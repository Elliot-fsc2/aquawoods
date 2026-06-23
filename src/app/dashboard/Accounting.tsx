import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, PieChart, Pie, Cell, LineChart, Line, Legend,
} from "recharts";
import {
  DollarSign, TrendingUp, TrendingDown, Receipt,
  FileText, Download, Printer, Pencil, Trash2, Plus,
  Check, X, Search,
} from "lucide-react";

// ---- Types ----
interface AccountEntry {
  id: string;
  date: string;
  description: string;
  category: string;
  type: "Income" | "Expense";
  amount: number;
  method: string;
  reference: string;
}

const METHODS = ["Cash", "GCash", "Maya", "Card", "Bank Transfer", "Room Charge"];

export default function Accounting() {
  const [entries, setEntries] = useState<AccountEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("accounting_entries").select("*").order("date", { ascending: false }).then(({ data }) => {
      if (data) setEntries(data as AccountEntry[]);
      setLoading(false);
    });
  }, []);
  const [filter, setFilter] = useState<"all" | "Income" | "Expense">("all");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<AccountEntry | null>(null);
  const [tab, setTab] = useState<"entries" | "summary" | "reports">("entries");

  const filtered = useMemo(() => entries.filter((e) =>
    (filter === "all" || e.type === filter) &&
    (e.description.toLowerCase().includes(search.toLowerCase()) || e.id.toLowerCase().includes(search.toLowerCase()) || e.category.toLowerCase().includes(search.toLowerCase()))
  ), [entries, filter, search]);

  const totalIncome = entries.filter((e) => e.type === "Income").reduce((s, e) => s + e.amount, 0);
  const totalExpense = entries.filter((e) => e.type === "Expense").reduce((s, e) => s + e.amount, 0);
  const netProfit = totalIncome - totalExpense;
  const margin = totalIncome > 0 ? ((netProfit / totalIncome) * 100).toFixed(1) : "0";

  const incomeByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    entries.filter((e) => e.type === "Income").forEach((e) => { map[e.category] = (map[e.category] || 0) + e.amount; });
    const colors = ["#245435", "#5fa06e", "#b8923f", "#d4af6a", "#94a3b8"];
    return Object.entries(map).map(([name, value], i) => ({ name, value, color: colors[i % colors.length] }));
  }, [entries]);

  const dailyNet = useMemo(() => {
    const map: Record<string, { date: string; income: number; expense: number }> = {};
    entries.forEach((e) => {
      if (!map[e.date]) map[e.date] = { date: e.date, income: 0, expense: 0 };
      if (e.type === "Income") map[e.date].income += e.amount;
      else map[e.date].expense += e.amount;
    });
    return Object.values(map).sort((a, b) => a.date.localeCompare(b.date));
  }, [entries]);

  const save = async (data: Omit<AccountEntry, "id"> & { id?: string }) => {
    if (data.id) {
      await supabase.from("accounting_entries").update(data).eq("id", data.id);
      setEntries((es) => es.map((e) => e.id === data.id ? { ...data, id: data.id! } : e));
    } else {
      const id = `JE-${String(entries.length + 1).padStart(3, "0")}`;
      const { error } = await supabase.from("accounting_entries").insert({ ...data, id });
      if (!error) setEntries((es) => [...es, { ...data, id }]);
    }
    setShowForm(false);
    setEditing(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="text-xs uppercase tracking-[0.25em] text-gold-500 font-medium mb-1">Accounting</div>
          <h1 className="font-serif text-3xl md:text-4xl text-brand-900">Accounting Management</h1>
          <p className="text-brand-700 mt-1">Journal entries, income/expense tracking, and financial reports.</p>
        </div>
        <button onClick={() => { setEditing(null); setShowForm(true); }} className="px-4 py-2 bg-brand-800 text-cream-50 rounded-md text-sm hover:bg-brand-900 flex items-center gap-2"><Plus className="w-4 h-4" /> New Entry</button>
      </div>

      {/* KPI ROW */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard icon={<TrendingUp className="w-5 h-5" />} label="Total Income" value={totalIncome} color="brand" />
        <KPICard icon={<TrendingDown className="w-5 h-5" />} label="Total Expenses" value={totalExpense} color="red" />
        <KPICard icon={<DollarSign className="w-5 h-5" />} label="Net Profit" value={netProfit} color={netProfit >= 0 ? "emerald" : "red"} />
        <KPICard icon={<DollarSign className="w-5 h-5" />} label="Profit Margin" value={`${margin}%`} color="gold" isString />
      </div>

      {/* TABS */}
      <div className="bg-white rounded-xl border border-brand-100 p-2 flex flex-wrap gap-1">
        {[
          { k: "entries" as const, l: "Journal Entries", i: <FileText className="w-4 h-4" /> },
          { k: "summary" as const, l: "Summary", i: <Receipt className="w-4 h-4" /> },
          { k: "reports" as const, l: "Reports", i: <TrendingUp className="w-4 h-4" /> },
        ].map((t) => (
          <button key={t.k} onClick={() => setTab(t.k)} className={`px-4 py-2 rounded-md text-sm flex items-center gap-2 transition ${tab === t.k ? "bg-brand-800 text-cream-50 shadow" : "text-brand-700 hover:bg-brand-50"}`}>
            {t.i} {t.l}
          </button>
        ))}
      </div>

      {/* ENTRIES TABLE */}
      {tab === "entries" && (
        <div className="bg-white rounded-xl border border-brand-100 p-6">
          <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
            <div className="flex gap-2 flex-wrap">
              {[{ k: "all", l: `All (${entries.length})` }, { k: "Income", l: `Income (${entries.filter(e => e.type === "Income").length})` }, { k: "Expense", l: `Expense (${entries.filter(e => e.type === "Expense").length})` }].map((f) => (
                <button key={f.k} onClick={() => setFilter(f.k as typeof filter)} className={`px-3 py-1.5 text-xs rounded-full ${filter === f.k ? "bg-brand-800 text-cream-50" : "bg-white border border-brand-200 text-brand-700 hover:bg-brand-50"}`}>{f.l}</button>
              ))}
            </div>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-brand-400" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search entries..." className="pl-9 pr-4 py-2 text-sm border border-brand-200 rounded-md bg-cream-50 focus:outline-none focus:border-brand-500" />
            </div>
          </div>

          {/* FORM */}
          {(showForm || editing) && (
            <EntryForm
              entry={editing}
              onSave={save}
              onCancel={() => { setShowForm(false); setEditing(null); }}
            />
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-brand-600 uppercase tracking-wider border-b border-brand-100">
                  <th className="text-left pb-2 font-medium">Ref #</th>
                  <th className="text-left pb-2 font-medium">Date</th>
                  <th className="text-left pb-2 font-medium">Description</th>
                  <th className="text-left pb-2 font-medium">Category</th>
                  <th className="text-left pb-2 font-medium">Type</th>
                  <th className="text-left pb-2 font-medium">Method</th>
                  <th className="text-right pb-2 font-medium">Amount</th>
                  <th className="text-right pb-2 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-50">
                {filtered.map((e) => (
                  <tr key={e.id} className="hover:bg-brand-50/40">
                    <td className="py-3 font-mono text-xs text-brand-700">{e.id}</td>
                    <td className="py-3 text-brand-700 text-xs">{e.date}</td>
                    <td className="py-3 text-brand-800 text-sm">{e.description}</td>
                    <td className="py-3 text-brand-700 text-xs">{e.category}</td>
                    <td className="py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${e.type === "Income" ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"}`}>{e.type}</span>
                    </td>
                    <td className="py-3 text-brand-700 text-xs">{e.method}</td>
                    <td className={`py-3 text-right font-medium ${e.type === "Income" ? "text-emerald-700" : "text-red-700"}`}>
                      {e.type === "Income" ? "+" : "-"}₱{e.amount.toLocaleString()}
                    </td>
                    <td className="py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => { setEditing(e); setShowForm(false); }} className="p-1.5 rounded hover:bg-brand-100 text-brand-600"><Pencil className="w-3.5 h-3.5" /></button>
                        <button onClick={async () => { await supabase.from("accounting_entries").delete().eq("id", e.id); setEntries((es) => es.filter((x) => x.id !== e.id)); }} className="p-1.5 rounded hover:bg-red-50 text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUMMARY */}
      {tab === "summary" && (
        <div className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-brand-100 p-6">
              <h3 className="font-serif text-xl text-brand-900 mb-4">Income by Category</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={incomeByCategory} dataKey="value" cx="50%" cy="50%" innerRadius={55} outerRadius={85}>
                      {incomeByCategory.map((s, i) => <Cell key={i} fill={s.color} />)}
                    </Pie>
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-brand-100 p-6">
              <h3 className="font-serif text-xl text-brand-900 mb-4">Expense by Category</h3>
              <div className="space-y-2">
                {(() => {
                  const map: Record<string, number> = {};
                  entries.filter((e) => e.type === "Expense").forEach((e) => { map[e.category] = (map[e.category] || 0) + e.amount; });
                  return Object.entries(map).map(([cat, amt]) => {
                    const pct = totalExpense > 0 ? ((amt / totalExpense) * 100).toFixed(1) : "0";
                    return (
                      <div key={cat}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-brand-800">{cat}</span>
                          <span className="text-brand-600">₱{amt.toLocaleString()} ({pct}%)</span>
                        </div>
                        <div className="h-2 bg-brand-100 rounded-full overflow-hidden">
                          <div className="h-full bg-red-500 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-brand-100 p-6">
            <h3 className="font-serif text-xl text-brand-900 mb-4">Daily Net Cash Flow</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyNet}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="income" fill="#245435" name="Income" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expense" fill="#dc2626" name="Expense" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* REPORTS */}
      {tab === "reports" && (
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-brand-100 p-6">
            <h3 className="font-serif text-xl text-brand-900 mb-1">P&L Snapshot</h3>
            <div className="text-xs text-brand-600 mb-4">Current period</div>
            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b border-brand-50">
                <span className="text-brand-700">Total Income</span>
                <span className="font-medium text-emerald-700">+₱{totalIncome.toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-brand-50">
                <span className="text-brand-700">Total Expenses</span>
                <span className="font-medium text-red-700">-₱{totalExpense.toLocaleString()}</span>
              </div>
              <div className={`flex justify-between py-3 font-medium text-lg ${netProfit >= 0 ? "text-emerald-800" : "text-red-800"}`}>
                <span>Net Profit</span>
                <span>₱{netProfit.toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-brand-50 text-sm">
                <span className="text-brand-700">Profit Margin</span>
                <span>{margin}%</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-brand-100 p-6">
            <h3 className="font-serif text-xl text-brand-900 mb-4">Payment Methods</h3>
            <div className="space-y-2">
              {(() => {
                const map: Record<string, number> = {};
                entries.filter((e) => e.type === "Income").forEach((e) => { map[e.method] = (map[e.method] || 0) + e.amount; });
                return Object.entries(map).map(([m, amt]) => {
                  const pct = totalIncome > 0 ? ((amt / totalIncome) * 100).toFixed(1) : "0";
                  return (
                    <div key={m} className="flex justify-between items-center py-2 border-b border-brand-50 text-sm">
                      <span className="text-brand-800">{m}</span>
                      <span className="text-brand-600">₱{amt.toLocaleString()} ({pct}%)</span>
                    </div>
                  );
                });
              })()}
            </div>
          </div>

          <div className="md:col-span-2 bg-white rounded-xl border border-brand-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-serif text-xl text-brand-900 mb-1">Profit Trend</h3>
                <div className="text-xs text-brand-600">Daily net (income − expense)</div>
              </div>
              <div className="flex gap-2">
                <button className="px-3 py-2 border border-brand-200 rounded-md text-xs hover:bg-brand-50 flex items-center gap-1"><Printer className="w-3.5 h-3.5" /> Print</button>
                <button className="px-3 py-2 bg-brand-800 text-cream-50 rounded-md text-xs hover:bg-brand-900 flex items-center gap-1"><Download className="w-3.5 h-3.5" /> Export CSV</button>
              </div>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dailyNet}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Line type="monotone" dataKey="income" stroke="#245435" strokeWidth={2} dot={false} name="Income" />
                  <Line type="monotone" dataKey="expense" stroke="#dc2626" strokeWidth={2} dot={false} name="Expense" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function KPICard({ icon, label, value, color, isString = false }: { icon: React.ReactNode; label: string; value: number | string; color: string; isString?: boolean }) {
  const bgMap: Record<string, string> = { brand: "bg-brand-100 text-brand-700", red: "bg-red-100 text-red-700", emerald: "bg-emerald-100 text-emerald-700", gold: "bg-yellow-100 text-yellow-700" };
  const prefix = color === "emerald" ? "+" : "";
  return (
    <div className="bg-white rounded-xl border border-brand-100 p-5">
      <div className={`w-10 h-10 rounded-lg ${bgMap[color]} flex items-center justify-center mb-3`}>{icon}</div>
      <div className="font-serif text-2xl text-brand-900">{isString ? value : `${prefix}₱${typeof value === "number" ? value.toLocaleString() : value}`}</div>
      <div className="text-sm text-brand-700 mt-0.5">{label}</div>
    </div>
  );
}

function EntryForm({ entry, onSave, onCancel }: { entry: AccountEntry | null; onSave: (data: Omit<AccountEntry, "id"> & { id?: string }) => void; onCancel: () => void }) {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    onSave({
      id: entry?.id,
      date: String(fd.get("date")),
      description: String(fd.get("description")),
      category: String(fd.get("category")),
      type: String(fd.get("type")) as "Income" | "Expense",
      amount: Number(fd.get("amount")),
      method: String(fd.get("method")),
      reference: String(fd.get("reference")),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="mb-4 p-4 rounded-lg bg-brand-50 border border-brand-100">
      <div className="text-xs uppercase tracking-wider text-brand-600 mb-3">{entry ? "Edit" : "New"} Journal Entry</div>
      <div className="grid md:grid-cols-3 gap-3">
        <label className="text-xs text-brand-700">Date<input name="date" type="date" required defaultValue={entry?.date || new Date().toISOString().slice(0, 10)} className="mt-1 w-full px-3 py-2 border border-brand-200 rounded-md bg-white text-sm" /></label>
        <label className="text-xs text-brand-700">Type
          <select name="type" required defaultValue={entry?.type || "Income"} className="mt-1 w-full px-3 py-2 border border-brand-200 rounded-md bg-white text-sm">
            <option>Income</option><option>Expense</option>
          </select>
        </label>
        <label className="text-xs text-brand-700">Category
          <select name="category" required defaultValue={entry?.category} className="mt-1 w-full px-3 py-2 border border-brand-200 rounded-md bg-white text-sm">
            <option>Room Revenue</option><option>F&B Revenue</option><option>Spa Revenue</option><option>Events Revenue</option><option>Other Income</option>
            <option>Payroll</option><option>Utilities</option><option>F&B Supplies</option><option>Maintenance</option><option>Marketing</option><option>Other Expense</option>
          </select>
        </label>
        <label className="text-xs text-brand-700 md:col-span-2">Description<input name="description" required defaultValue={entry?.description} className="mt-1 w-full px-3 py-2 border border-brand-200 rounded-md bg-white text-sm" /></label>
        <label className="text-xs text-brand-700">Amount (₱)<input name="amount" type="number" min="0" required defaultValue={entry?.amount} className="mt-1 w-full px-3 py-2 border border-brand-200 rounded-md bg-white text-sm" /></label>
        <label className="text-xs text-brand-700">Method
          <select name="method" required defaultValue={entry?.method || "Cash"} className="mt-1 w-full px-3 py-2 border border-brand-200 rounded-md bg-white text-sm">
            {METHODS.map((m) => <option key={m}>{m}</option>)}
          </select>
        </label>
        <label className="text-xs text-brand-700">Reference<input name="reference" required defaultValue={entry?.reference} className="mt-1 w-full px-3 py-2 border border-brand-200 rounded-md bg-white text-sm" /></label>
      </div>
      <div className="flex justify-end gap-2 mt-3">
        <button type="button" onClick={onCancel} className="px-3 py-1.5 border border-brand-200 rounded-md text-xs hover:bg-white flex items-center gap-1"><X className="w-3 h-3" /> Cancel</button>
        <button type="submit" className="px-3 py-1.5 bg-brand-800 text-cream-50 rounded-md text-xs hover:bg-brand-900 flex items-center gap-1"><Check className="w-3 h-3" /> Save</button>
      </div>
    </form>
  );
}
