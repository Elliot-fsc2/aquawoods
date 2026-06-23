import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Package, Truck, ClipboardList, Users as UsersIcon, Plus, Search, AlertTriangle,
  X, Loader2, Trash2, Edit, DollarSign, TrendingDown, CheckCircle2,
} from "lucide-react";

type Tab = "inventory" | "vendors" | "purchasing" | "payroll";

interface InventoryItem {
  id: string; sku: string; name: string; category: string | null; unit: string | null;
  quantity: number; reorder_level: number; unit_cost: number; location: string | null; active: boolean;
}
interface Vendor {
  id: string; name: string; contact_name: string | null; email: string | null;
  phone: string | null; payment_terms: string | null; active: boolean;
}
interface POItem { description: string; qty: number; unit_cost: number; }
interface PurchaseOrder {
  id: string; po_number: string; vendor_id: string | null; status: string;
  order_date: string; expected_date: string | null; items: POItem[];
  subtotal: number; tax: number; total: number; notes: string | null;
}
interface Employee {
  id: string; employee_code: string; full_name: string; email: string | null;
  department: string | null; position: string | null; pay_type: string;
  base_salary: number; hourly_rate: number; status: string;
}
interface PayrollRun {
  id: string; employee_id: string | null; period_start: string; period_end: string;
  hours_worked: number; gross_pay: number; deductions: number; net_pay: number;
  status: string; paid_at: string | null;
}

const money = (n: number) => `$${(n || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;

export default function ERP() {
  const [tab, setTab] = useState<Tab>("inventory");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif text-2xl md:text-3xl text-brand-900">Enterprise Resource Planning</h2>
        <p className="text-sm text-brand-600">Inventory, purchasing, vendors and payroll — live from Lovable Cloud.</p>
      </div>

      <div className="flex flex-wrap gap-1 bg-white border border-brand-100 rounded-xl p-1 w-fit">
        {([
          ["inventory", "Inventory", Package],
          ["vendors", "Vendors", Truck],
          ["purchasing", "Purchase Orders", ClipboardList],
          ["payroll", "Payroll & HR", UsersIcon],
        ] as const).map(([k, label, Icon]) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={`flex items-center gap-2 px-4 py-2 text-sm rounded-lg transition ${
              tab === k ? "bg-brand-900 text-cream-50" : "text-brand-700 hover:bg-brand-50"
            }`}
          >
            <Icon className="w-4 h-4" /> {label}
          </button>
        ))}
      </div>

      {tab === "inventory" && <InventoryPanel />}
      {tab === "vendors" && <VendorsPanel />}
      {tab === "purchasing" && <PurchasingPanel />}
      {tab === "payroll" && <PayrollPanel />}
    </div>
  );
}

/* ----------------------------- INVENTORY ----------------------------- */

function InventoryPanel() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [modal, setModal] = useState<InventoryItem | null>(null);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("erp_inventory_items").select("*").order("name");
    setItems((data as InventoryItem[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
    const ch = supabase.channel("erp-inv")
      .on("postgres_changes", { event: "*", schema: "public", table: "erp_inventory_items" }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const filtered = items.filter(i =>
    !q || i.name.toLowerCase().includes(q.toLowerCase()) || i.sku.toLowerCase().includes(q.toLowerCase())
  );
  const lowStock = items.filter(i => i.quantity <= i.reorder_level);
  const totalValue = items.reduce((s, i) => s + i.quantity * i.unit_cost, 0);

  const remove = async (id: string) => {
    if (!confirm("Delete this item?")) return;
    await supabase.from("erp_inventory_items").delete().eq("id", id);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard label="Total SKUs" value={String(items.length)} icon={Package} tone="brand" />
        <StatCard label="Low Stock" value={String(lowStock.length)} icon={AlertTriangle} tone={lowStock.length ? "red" : "brand"} />
        <StatCard label="Inventory Value" value={money(totalValue)} icon={DollarSign} tone="gold" />
      </div>

      <div className="bg-white border border-brand-100 rounded-xl p-4 md:p-5">
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-brand-400" />
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search SKU or name…"
              className="w-full pl-9 pr-4 py-2 text-sm border border-brand-200 rounded-lg focus:outline-none focus:border-brand-500" />
          </div>
          <button onClick={() => setModal({ id: "", sku: "", name: "", category: "", unit: "unit", quantity: 0, reorder_level: 0, unit_cost: 0, location: "", active: true })}
            className="flex items-center gap-2 px-4 py-2 bg-brand-900 text-cream-50 rounded-lg text-sm hover:bg-brand-800">
            <Plus className="w-4 h-4" /> New Item
          </button>
        </div>

        {loading ? <Loading /> : filtered.length === 0 ? <Empty label="No inventory items" /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs uppercase text-brand-500 border-b border-brand-100">
                <tr><th className="text-left py-2 px-2">SKU</th><th className="text-left px-2">Name</th>
                  <th className="text-left px-2">Category</th><th className="text-right px-2">Qty</th>
                  <th className="text-right px-2">Reorder</th><th className="text-right px-2">Cost</th>
                  <th className="text-right px-2">Value</th><th className="px-2"></th></tr>
              </thead>
              <tbody>
                {filtered.map(i => {
                  const low = i.quantity <= i.reorder_level;
                  return (
                    <tr key={i.id} className="border-b border-brand-50 hover:bg-brand-50/50">
                      <td className="py-2 px-2 font-mono text-xs">{i.sku}</td>
                      <td className="px-2 font-medium text-brand-900">{i.name}</td>
                      <td className="px-2 text-brand-600">{i.category}</td>
                      <td className={`px-2 text-right ${low ? "text-red-600 font-semibold" : ""}`}>{i.quantity} {i.unit}</td>
                      <td className="px-2 text-right text-brand-500">{i.reorder_level}</td>
                      <td className="px-2 text-right">{money(i.unit_cost)}</td>
                      <td className="px-2 text-right font-medium">{money(i.quantity * i.unit_cost)}</td>
                      <td className="px-2 text-right">
                        <div className="flex justify-end gap-1">
                          <button onClick={() => setModal(i)} className="p-1.5 hover:bg-brand-100 rounded"><Edit className="w-3.5 h-3.5" /></button>
                          <button onClick={() => remove(i.id)} className="p-1.5 hover:bg-red-50 text-red-600 rounded"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal && <InventoryModal item={modal} onClose={() => setModal(null)} onSaved={() => { setModal(null); load(); }} />}
    </div>
  );
}

function InventoryModal({ item, onClose, onSaved }: { item: InventoryItem; onClose: () => void; onSaved: () => void; }) {
  const [f, setF] = useState(item);
  const [saving, setSaving] = useState(false);
  const isNew = !item.id;
  const save = async () => {
    setSaving(true);
    const payload = { sku: f.sku, name: f.name, category: f.category, unit: f.unit,
      quantity: Number(f.quantity), reorder_level: Number(f.reorder_level),
      unit_cost: Number(f.unit_cost), location: f.location, active: f.active };
    if (isNew) await supabase.from("erp_inventory_items").insert(payload);
    else await supabase.from("erp_inventory_items").update(payload).eq("id", f.id);
    setSaving(false);
    onSaved();
  };
  return (
    <Modal title={isNew ? "New Item" : "Edit Item"} onClose={onClose}>
      <div className="grid grid-cols-2 gap-3">
        <Field label="SKU"><input value={f.sku} onChange={e => setF({ ...f, sku: e.target.value })} className={inputCls} /></Field>
        <Field label="Name"><input value={f.name} onChange={e => setF({ ...f, name: e.target.value })} className={inputCls} /></Field>
        <Field label="Category"><input value={f.category || ""} onChange={e => setF({ ...f, category: e.target.value })} className={inputCls} /></Field>
        <Field label="Unit"><input value={f.unit || ""} onChange={e => setF({ ...f, unit: e.target.value })} className={inputCls} /></Field>
        <Field label="Quantity"><input type="number" value={f.quantity} onChange={e => setF({ ...f, quantity: +e.target.value })} className={inputCls} /></Field>
        <Field label="Reorder Level"><input type="number" value={f.reorder_level} onChange={e => setF({ ...f, reorder_level: +e.target.value })} className={inputCls} /></Field>
        <Field label="Unit Cost"><input type="number" step="0.01" value={f.unit_cost} onChange={e => setF({ ...f, unit_cost: +e.target.value })} className={inputCls} /></Field>
        <Field label="Location"><input value={f.location || ""} onChange={e => setF({ ...f, location: e.target.value })} className={inputCls} /></Field>
      </div>
      <ModalActions onClose={onClose} onSave={save} saving={saving} disabled={!f.sku || !f.name} />
    </Modal>
  );
}

/* ------------------------------ VENDORS ------------------------------ */

function VendorsPanel() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<Vendor | null>(null);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("erp_vendors").select("*").order("name");
    setVendors((data as Vendor[]) || []);
    setLoading(false);
  };
  useEffect(() => {
    load();
    const ch = supabase.channel("erp-vendors").on("postgres_changes",
      { event: "*", schema: "public", table: "erp_vendors" }, load).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);
  const remove = async (id: string) => { if (!confirm("Delete vendor?")) return; await supabase.from("erp_vendors").delete().eq("id", id); };

  return (
    <div className="space-y-4">
      <div className="bg-white border border-brand-100 rounded-xl p-4 md:p-5">
        <div className="flex justify-between mb-4">
          <h3 className="font-serif text-lg text-brand-900">Vendors ({vendors.length})</h3>
          <button onClick={() => setModal({ id: "", name: "", contact_name: "", email: "", phone: "", payment_terms: "Net 30", active: true })}
            className="flex items-center gap-2 px-4 py-2 bg-brand-900 text-cream-50 rounded-lg text-sm hover:bg-brand-800">
            <Plus className="w-4 h-4" /> New Vendor
          </button>
        </div>
        {loading ? <Loading /> : vendors.length === 0 ? <Empty label="No vendors" /> : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {vendors.map(v => (
              <div key={v.id} className="border border-brand-100 rounded-lg p-4 hover:shadow-sm transition">
                <div className="flex justify-between mb-2">
                  <div className="font-medium text-brand-900">{v.name}</div>
                  <span className={`text-[10px] uppercase px-2 py-0.5 rounded-full ${v.active ? "bg-green-100 text-green-700" : "bg-brand-100 text-brand-600"}`}>{v.active ? "Active" : "Inactive"}</span>
                </div>
                <div className="text-xs text-brand-600 space-y-0.5">
                  {v.contact_name && <div>{v.contact_name}</div>}
                  {v.email && <div>{v.email}</div>}
                  {v.phone && <div>{v.phone}</div>}
                  <div className="text-brand-500">Terms: {v.payment_terms}</div>
                </div>
                <div className="flex gap-2 mt-3 pt-3 border-t border-brand-100">
                  <button onClick={() => setModal(v)} className="text-xs text-brand-700 hover:underline">Edit</button>
                  <button onClick={() => remove(v.id)} className="text-xs text-red-600 hover:underline ml-auto">Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {modal && <VendorModal vendor={modal} onClose={() => setModal(null)} onSaved={() => { setModal(null); load(); }} />}
    </div>
  );
}

function VendorModal({ vendor, onClose, onSaved }: { vendor: Vendor; onClose: () => void; onSaved: () => void; }) {
  const [f, setF] = useState(vendor);
  const [saving, setSaving] = useState(false);
  const isNew = !vendor.id;
  const save = async () => {
    setSaving(true);
    const payload = { name: f.name, contact_name: f.contact_name, email: f.email, phone: f.phone, payment_terms: f.payment_terms, active: f.active };
    if (isNew) await supabase.from("erp_vendors").insert(payload);
    else await supabase.from("erp_vendors").update(payload).eq("id", f.id);
    setSaving(false); onSaved();
  };
  return (
    <Modal title={isNew ? "New Vendor" : "Edit Vendor"} onClose={onClose}>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Name"><input value={f.name} onChange={e => setF({ ...f, name: e.target.value })} className={inputCls} /></Field>
        <Field label="Contact"><input value={f.contact_name || ""} onChange={e => setF({ ...f, contact_name: e.target.value })} className={inputCls} /></Field>
        <Field label="Email"><input value={f.email || ""} onChange={e => setF({ ...f, email: e.target.value })} className={inputCls} /></Field>
        <Field label="Phone"><input value={f.phone || ""} onChange={e => setF({ ...f, phone: e.target.value })} className={inputCls} /></Field>
        <Field label="Payment Terms"><input value={f.payment_terms || ""} onChange={e => setF({ ...f, payment_terms: e.target.value })} className={inputCls} /></Field>
        <Field label="Status">
          <select value={f.active ? "1" : "0"} onChange={e => setF({ ...f, active: e.target.value === "1" })} className={inputCls}>
            <option value="1">Active</option><option value="0">Inactive</option>
          </select>
        </Field>
      </div>
      <ModalActions onClose={onClose} onSave={save} saving={saving} disabled={!f.name} />
    </Modal>
  );
}

/* ----------------------------- PURCHASING ---------------------------- */

function PurchasingPanel() {
  const [pos, setPos] = useState<PurchaseOrder[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<PurchaseOrder | null>(null);

  const load = async () => {
    setLoading(true);
    const [p, v] = await Promise.all([
      supabase.from("erp_purchase_orders").select("*").order("order_date", { ascending: false }),
      supabase.from("erp_vendors").select("*").eq("active", true).order("name"),
    ]);
    setPos(((p.data as unknown) as PurchaseOrder[])?.map(po => ({ ...po, items: Array.isArray(po.items) ? po.items : [] })) || []);
    setVendors((v.data as Vendor[]) || []);
    setLoading(false);
  };
  useEffect(() => {
    load();
    const ch = supabase.channel("erp-po").on("postgres_changes",
      { event: "*", schema: "public", table: "erp_purchase_orders" }, load).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const vendorName = (id: string | null) => vendors.find(v => v.id === id)?.name || "—";
  const totalSpend = pos.reduce((s, p) => s + p.total, 0);

  const newPO = () => {
    const num = `PO-${Date.now().toString().slice(-6)}`;
    setModal({ id: "", po_number: num, vendor_id: vendors[0]?.id || null, status: "draft",
      order_date: new Date().toISOString().slice(0, 10), expected_date: null, items: [],
      subtotal: 0, tax: 0, total: 0, notes: "" });
  };
  const remove = async (id: string) => { if (!confirm("Delete PO?")) return; await supabase.from("erp_purchase_orders").delete().eq("id", id); };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard label="Total POs" value={String(pos.length)} icon={ClipboardList} tone="brand" />
        <StatCard label="Open" value={String(pos.filter(p => p.status !== "received" && p.status !== "cancelled").length)} icon={TrendingDown} tone="gold" />
        <StatCard label="Total Spend" value={money(totalSpend)} icon={DollarSign} tone="brand" />
      </div>

      <div className="bg-white border border-brand-100 rounded-xl p-4 md:p-5">
        <div className="flex justify-between mb-4">
          <h3 className="font-serif text-lg text-brand-900">Purchase Orders</h3>
          <button onClick={newPO} className="flex items-center gap-2 px-4 py-2 bg-brand-900 text-cream-50 rounded-lg text-sm hover:bg-brand-800">
            <Plus className="w-4 h-4" /> New PO
          </button>
        </div>
        {loading ? <Loading /> : pos.length === 0 ? <Empty label="No purchase orders" /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs uppercase text-brand-500 border-b border-brand-100">
                <tr><th className="text-left py-2 px-2">PO #</th><th className="text-left px-2">Vendor</th>
                  <th className="text-left px-2">Date</th><th className="text-left px-2">Status</th>
                  <th className="text-right px-2">Items</th><th className="text-right px-2">Total</th><th className="px-2"></th></tr>
              </thead>
              <tbody>
                {pos.map(p => (
                  <tr key={p.id} className="border-b border-brand-50 hover:bg-brand-50/50">
                    <td className="py-2 px-2 font-mono text-xs">{p.po_number}</td>
                    <td className="px-2 font-medium">{vendorName(p.vendor_id)}</td>
                    <td className="px-2 text-brand-600">{p.order_date}</td>
                    <td className="px-2"><StatusBadge status={p.status} /></td>
                    <td className="px-2 text-right">{p.items.length}</td>
                    <td className="px-2 text-right font-medium">{money(p.total)}</td>
                    <td className="px-2 text-right">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => setModal(p)} className="p-1.5 hover:bg-brand-100 rounded"><Edit className="w-3.5 h-3.5" /></button>
                        <button onClick={() => remove(p.id)} className="p-1.5 hover:bg-red-50 text-red-600 rounded"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal && <POModal po={modal} vendors={vendors} onClose={() => setModal(null)} onSaved={() => { setModal(null); load(); }} />}
    </div>
  );
}

function POModal({ po, vendors, onClose, onSaved }: { po: PurchaseOrder; vendors: Vendor[]; onClose: () => void; onSaved: () => void; }) {
  const [f, setF] = useState(po);
  const [saving, setSaving] = useState(false);
  const isNew = !po.id;

  const subtotal = useMemo(() => f.items.reduce((s, i) => s + i.qty * i.unit_cost, 0), [f.items]);
  const total = subtotal + Number(f.tax || 0);

  const addItem = () => setF({ ...f, items: [...f.items, { description: "", qty: 1, unit_cost: 0 }] });
  const updItem = (idx: number, patch: Partial<POItem>) =>
    setF({ ...f, items: f.items.map((it, i) => i === idx ? { ...it, ...patch } : it) });
  const delItem = (idx: number) => setF({ ...f, items: f.items.filter((_, i) => i !== idx) });

  const save = async () => {
    setSaving(true);
    const payload: any = { po_number: f.po_number, vendor_id: f.vendor_id, status: f.status,
      order_date: f.order_date, expected_date: f.expected_date || null,
      items: f.items, subtotal, tax: Number(f.tax || 0), total, notes: f.notes };
    if (isNew) await supabase.from("erp_purchase_orders").insert(payload);
    else await supabase.from("erp_purchase_orders").update(payload).eq("id", f.id);
    setSaving(false); onSaved();
  };

  return (
    <Modal title={isNew ? "New Purchase Order" : `Edit ${f.po_number}`} onClose={onClose} wide>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Field label="PO #"><input value={f.po_number} onChange={e => setF({ ...f, po_number: e.target.value })} className={inputCls} /></Field>
        <Field label="Vendor">
          <select value={f.vendor_id || ""} onChange={e => setF({ ...f, vendor_id: e.target.value || null })} className={inputCls}>
            <option value="">— Select —</option>
            {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
          </select>
        </Field>
        <Field label="Order Date"><input type="date" value={f.order_date} onChange={e => setF({ ...f, order_date: e.target.value })} className={inputCls} /></Field>
        <Field label="Expected"><input type="date" value={f.expected_date || ""} onChange={e => setF({ ...f, expected_date: e.target.value })} className={inputCls} /></Field>
        <Field label="Status">
          <select value={f.status} onChange={e => setF({ ...f, status: e.target.value })} className={inputCls}>
            <option value="draft">Draft</option><option value="sent">Sent</option>
            <option value="confirmed">Confirmed</option><option value="received">Received</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </Field>
        <Field label="Tax"><input type="number" step="0.01" value={f.tax} onChange={e => setF({ ...f, tax: +e.target.value })} className={inputCls} /></Field>
      </div>

      <div className="mt-4">
        <div className="flex justify-between items-center mb-2">
          <div className="text-sm font-medium text-brand-900">Line Items</div>
          <button onClick={addItem} className="text-xs flex items-center gap-1 px-2 py-1 bg-brand-100 hover:bg-brand-200 rounded"><Plus className="w-3 h-3" /> Add line</button>
        </div>
        <div className="space-y-2">
          {f.items.map((it, idx) => (
            <div key={idx} className="grid grid-cols-12 gap-2 items-center">
              <input placeholder="Description" value={it.description} onChange={e => updItem(idx, { description: e.target.value })} className={`${inputCls} col-span-6`} />
              <input type="number" placeholder="Qty" value={it.qty} onChange={e => updItem(idx, { qty: +e.target.value })} className={`${inputCls} col-span-2`} />
              <input type="number" step="0.01" placeholder="Cost" value={it.unit_cost} onChange={e => updItem(idx, { unit_cost: +e.target.value })} className={`${inputCls} col-span-2`} />
              <div className="col-span-1 text-right text-sm">{money(it.qty * it.unit_cost)}</div>
              <button onClick={() => delItem(idx)} className="col-span-1 p-1 text-red-600 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button>
            </div>
          ))}
          {f.items.length === 0 && <div className="text-xs text-brand-500 italic">No line items yet.</div>}
        </div>
        <div className="mt-3 flex justify-end gap-6 text-sm border-t border-brand-100 pt-3">
          <div>Subtotal: <span className="font-medium">{money(subtotal)}</span></div>
          <div>Tax: <span className="font-medium">{money(Number(f.tax || 0))}</span></div>
          <div className="text-base">Total: <span className="font-bold text-brand-900">{money(total)}</span></div>
        </div>
      </div>

      <ModalActions onClose={onClose} onSave={save} saving={saving} disabled={!f.po_number} />
    </Modal>
  );
}

/* ------------------------------ PAYROLL ------------------------------ */

function PayrollPanel() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [runs, setRuns] = useState<PayrollRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [empModal, setEmpModal] = useState<Employee | null>(null);
  const [payModal, setPayModal] = useState<PayrollRun | null>(null);

  const load = async () => {
    setLoading(true);
    const [e, r] = await Promise.all([
      supabase.from("erp_employees").select("*").order("full_name"),
      supabase.from("erp_payroll_runs").select("*").order("period_end", { ascending: false }).limit(50),
    ]);
    setEmployees((e.data as Employee[]) || []);
    setRuns((r.data as PayrollRun[]) || []);
    setLoading(false);
  };
  useEffect(() => {
    load();
    const ch = supabase.channel("erp-hr")
      .on("postgres_changes", { event: "*", schema: "public", table: "erp_employees" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "erp_payroll_runs" }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const totalMonthly = employees.reduce((s, e) => s + (e.pay_type === "salary" ? e.base_salary : e.hourly_rate * 160), 0);
  const empName = (id: string | null) => employees.find(e => e.id === id)?.full_name || "—";
  const removeEmp = async (id: string) => { if (!confirm("Delete employee?")) return; await supabase.from("erp_employees").delete().eq("id", id); };
  const newRun = () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);
    setPayModal({ id: "", employee_id: employees[0]?.id || null, period_start: start, period_end: end,
      hours_worked: 160, gross_pay: 0, deductions: 0, net_pay: 0, status: "pending", paid_at: null });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard label="Employees" value={String(employees.length)} icon={UsersIcon} tone="brand" />
        <StatCard label="Monthly Payroll" value={money(totalMonthly)} icon={DollarSign} tone="gold" />
        <StatCard label="Paid Runs" value={String(runs.filter(r => r.status === "paid").length)} icon={CheckCircle2} tone="brand" />
      </div>

      <div className="bg-white border border-brand-100 rounded-xl p-4 md:p-5">
        <div className="flex justify-between mb-4">
          <h3 className="font-serif text-lg text-brand-900">Employees</h3>
          <button onClick={() => setEmpModal({ id: "", employee_code: `EMP-${String(employees.length + 1).padStart(3, "0")}`, full_name: "", email: "", department: "", position: "", pay_type: "salary", base_salary: 0, hourly_rate: 0, status: "active" })}
            className="flex items-center gap-2 px-4 py-2 bg-brand-900 text-cream-50 rounded-lg text-sm hover:bg-brand-800">
            <Plus className="w-4 h-4" /> New Employee
          </button>
        </div>
        {loading ? <Loading /> : employees.length === 0 ? <Empty label="No employees" /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs uppercase text-brand-500 border-b border-brand-100">
                <tr><th className="text-left py-2 px-2">Code</th><th className="text-left px-2">Name</th>
                  <th className="text-left px-2">Department</th><th className="text-left px-2">Position</th>
                  <th className="text-left px-2">Type</th><th className="text-right px-2">Pay</th>
                  <th className="text-left px-2">Status</th><th className="px-2"></th></tr>
              </thead>
              <tbody>
                {employees.map(e => (
                  <tr key={e.id} className="border-b border-brand-50 hover:bg-brand-50/50">
                    <td className="py-2 px-2 font-mono text-xs">{e.employee_code}</td>
                    <td className="px-2 font-medium text-brand-900">{e.full_name}</td>
                    <td className="px-2 text-brand-600">{e.department}</td>
                    <td className="px-2 text-brand-600">{e.position}</td>
                    <td className="px-2 capitalize text-xs">{e.pay_type}</td>
                    <td className="px-2 text-right">{e.pay_type === "salary" ? `${money(e.base_salary)}/mo` : `${money(e.hourly_rate)}/hr`}</td>
                    <td className="px-2"><StatusBadge status={e.status} /></td>
                    <td className="px-2 text-right">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => setEmpModal(e)} className="p-1.5 hover:bg-brand-100 rounded"><Edit className="w-3.5 h-3.5" /></button>
                        <button onClick={() => removeEmp(e.id)} className="p-1.5 hover:bg-red-50 text-red-600 rounded"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="bg-white border border-brand-100 rounded-xl p-4 md:p-5">
        <div className="flex justify-between mb-4">
          <h3 className="font-serif text-lg text-brand-900">Payroll Runs</h3>
          <button onClick={newRun} disabled={!employees.length}
            className="flex items-center gap-2 px-4 py-2 bg-brand-900 text-cream-50 rounded-lg text-sm hover:bg-brand-800 disabled:opacity-50">
            <Plus className="w-4 h-4" /> New Run
          </button>
        </div>
        {runs.length === 0 ? <Empty label="No payroll runs" /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs uppercase text-brand-500 border-b border-brand-100">
                <tr><th className="text-left py-2 px-2">Employee</th><th className="text-left px-2">Period</th>
                  <th className="text-right px-2">Hours</th><th className="text-right px-2">Gross</th>
                  <th className="text-right px-2">Deductions</th><th className="text-right px-2">Net</th>
                  <th className="text-left px-2">Status</th><th className="px-2"></th></tr>
              </thead>
              <tbody>
                {runs.map(r => (
                  <tr key={r.id} className="border-b border-brand-50 hover:bg-brand-50/50">
                    <td className="py-2 px-2 font-medium">{empName(r.employee_id)}</td>
                    <td className="px-2 text-brand-600 text-xs">{r.period_start} → {r.period_end}</td>
                    <td className="px-2 text-right">{r.hours_worked}</td>
                    <td className="px-2 text-right">{money(r.gross_pay)}</td>
                    <td className="px-2 text-right text-red-600">{money(r.deductions)}</td>
                    <td className="px-2 text-right font-bold">{money(r.net_pay)}</td>
                    <td className="px-2"><StatusBadge status={r.status} /></td>
                    <td className="px-2 text-right">
                      <button onClick={() => setPayModal(r)} className="p-1.5 hover:bg-brand-100 rounded"><Edit className="w-3.5 h-3.5" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {empModal && <EmployeeModal employee={empModal} onClose={() => setEmpModal(null)} onSaved={() => { setEmpModal(null); load(); }} />}
      {payModal && <PayrollModal run={payModal} employees={employees} onClose={() => setPayModal(null)} onSaved={() => { setPayModal(null); load(); }} />}
    </div>
  );
}

function EmployeeModal({ employee, onClose, onSaved }: { employee: Employee; onClose: () => void; onSaved: () => void; }) {
  const [f, setF] = useState(employee);
  const [saving, setSaving] = useState(false);
  const isNew = !employee.id;
  const save = async () => {
    setSaving(true);
    const payload = { employee_code: f.employee_code, full_name: f.full_name, email: f.email,
      department: f.department, position: f.position, pay_type: f.pay_type,
      base_salary: Number(f.base_salary), hourly_rate: Number(f.hourly_rate), status: f.status };
    if (isNew) await supabase.from("erp_employees").insert(payload);
    else await supabase.from("erp_employees").update(payload).eq("id", f.id);
    setSaving(false); onSaved();
  };
  return (
    <Modal title={isNew ? "New Employee" : "Edit Employee"} onClose={onClose}>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Code"><input value={f.employee_code} onChange={e => setF({ ...f, employee_code: e.target.value })} className={inputCls} /></Field>
        <Field label="Full Name"><input value={f.full_name} onChange={e => setF({ ...f, full_name: e.target.value })} className={inputCls} /></Field>
        <Field label="Email"><input value={f.email || ""} onChange={e => setF({ ...f, email: e.target.value })} className={inputCls} /></Field>
        <Field label="Department"><input value={f.department || ""} onChange={e => setF({ ...f, department: e.target.value })} className={inputCls} /></Field>
        <Field label="Position"><input value={f.position || ""} onChange={e => setF({ ...f, position: e.target.value })} className={inputCls} /></Field>
        <Field label="Pay Type">
          <select value={f.pay_type} onChange={e => setF({ ...f, pay_type: e.target.value })} className={inputCls}>
            <option value="salary">Salary</option><option value="hourly">Hourly</option>
          </select>
        </Field>
        <Field label="Base Salary (mo)"><input type="number" value={f.base_salary} onChange={e => setF({ ...f, base_salary: +e.target.value })} className={inputCls} /></Field>
        <Field label="Hourly Rate"><input type="number" step="0.01" value={f.hourly_rate} onChange={e => setF({ ...f, hourly_rate: +e.target.value })} className={inputCls} /></Field>
        <Field label="Status">
          <select value={f.status} onChange={e => setF({ ...f, status: e.target.value })} className={inputCls}>
            <option value="active">Active</option><option value="on_leave">On Leave</option><option value="terminated">Terminated</option>
          </select>
        </Field>
      </div>
      <ModalActions onClose={onClose} onSave={save} saving={saving} disabled={!f.employee_code || !f.full_name} />
    </Modal>
  );
}

function PayrollModal({ run, employees, onClose, onSaved }: { run: PayrollRun; employees: Employee[]; onClose: () => void; onSaved: () => void; }) {
  const [f, setF] = useState(run);
  const [saving, setSaving] = useState(false);
  const isNew = !run.id;
  const emp = employees.find(e => e.id === f.employee_id);

  useEffect(() => {
    if (!emp) return;
    const gross = emp.pay_type === "salary" ? emp.base_salary : emp.hourly_rate * Number(f.hours_worked || 0);
    setF(prev => ({ ...prev, gross_pay: +gross.toFixed(2), net_pay: +(gross - Number(prev.deductions || 0)).toFixed(2) }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [f.employee_id, f.hours_worked, f.deductions]);

  const save = async () => {
    setSaving(true);
    const payload = { employee_id: f.employee_id, period_start: f.period_start, period_end: f.period_end,
      hours_worked: Number(f.hours_worked), gross_pay: Number(f.gross_pay), deductions: Number(f.deductions),
      net_pay: Number(f.net_pay), status: f.status, paid_at: f.status === "paid" ? new Date().toISOString() : null };
    if (isNew) await supabase.from("erp_payroll_runs").insert(payload);
    else await supabase.from("erp_payroll_runs").update(payload).eq("id", f.id);
    setSaving(false); onSaved();
  };

  return (
    <Modal title={isNew ? "New Payroll Run" : "Edit Payroll Run"} onClose={onClose}>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Employee">
          <select value={f.employee_id || ""} onChange={e => setF({ ...f, employee_id: e.target.value })} className={inputCls}>
            {employees.map(e => <option key={e.id} value={e.id}>{e.full_name}</option>)}
          </select>
        </Field>
        <Field label="Status">
          <select value={f.status} onChange={e => setF({ ...f, status: e.target.value })} className={inputCls}>
            <option value="pending">Pending</option><option value="approved">Approved</option><option value="paid">Paid</option>
          </select>
        </Field>
        <Field label="Period Start"><input type="date" value={f.period_start} onChange={e => setF({ ...f, period_start: e.target.value })} className={inputCls} /></Field>
        <Field label="Period End"><input type="date" value={f.period_end} onChange={e => setF({ ...f, period_end: e.target.value })} className={inputCls} /></Field>
        <Field label="Hours Worked"><input type="number" value={f.hours_worked} onChange={e => setF({ ...f, hours_worked: +e.target.value })} className={inputCls} /></Field>
        <Field label="Deductions"><input type="number" step="0.01" value={f.deductions} onChange={e => setF({ ...f, deductions: +e.target.value })} className={inputCls} /></Field>
        <Field label="Gross Pay"><input type="number" step="0.01" value={f.gross_pay} onChange={e => setF({ ...f, gross_pay: +e.target.value })} className={inputCls} /></Field>
        <Field label="Net Pay"><input type="number" step="0.01" value={f.net_pay} onChange={e => setF({ ...f, net_pay: +e.target.value })} className={inputCls} /></Field>
      </div>
      <ModalActions onClose={onClose} onSave={save} saving={saving} disabled={!f.employee_id} />
    </Modal>
  );
}

/* ------------------------------ SHARED ------------------------------- */

const inputCls = "w-full px-3 py-2 text-sm border border-brand-200 rounded-lg focus:outline-none focus:border-brand-500";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs uppercase tracking-wide text-brand-500 mb-1">{label}</span>
      {children}
    </label>
  );
}

function Modal({ title, onClose, wide, children }: { title: string; onClose: () => void; wide?: boolean; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className={`bg-white rounded-xl ${wide ? "max-w-3xl" : "max-w-xl"} w-full max-h-[90vh] overflow-y-auto`}>
        <div className="flex justify-between items-center p-5 border-b border-brand-100 sticky top-0 bg-white">
          <h3 className="font-serif text-lg text-brand-900">{title}</h3>
          <button onClick={onClose} className="p-1 hover:bg-brand-100 rounded"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

function ModalActions({ onClose, onSave, saving, disabled }: { onClose: () => void; onSave: () => void; saving: boolean; disabled?: boolean }) {
  return (
    <div className="flex justify-end gap-2 mt-5 pt-4 border-t border-brand-100">
      <button onClick={onClose} className="px-4 py-2 text-sm text-brand-700 hover:bg-brand-50 rounded-lg">Cancel</button>
      <button onClick={onSave} disabled={saving || disabled} className="flex items-center gap-2 px-4 py-2 bg-brand-900 text-cream-50 rounded-lg text-sm hover:bg-brand-800 disabled:opacity-50">
        {saving && <Loader2 className="w-4 h-4 animate-spin" />} Save
      </button>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, tone }: { label: string; value: string; icon: any; tone: "brand" | "gold" | "red" }) {
  const colors = {
    brand: "bg-brand-50 text-brand-900",
    gold: "bg-gold-50 text-gold-700",
    red: "bg-red-50 text-red-700",
  }[tone];
  return (
    <div className="bg-white border border-brand-100 rounded-xl p-4 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${colors}`}><Icon className="w-5 h-5" /></div>
      <div>
        <div className="text-xs uppercase tracking-wide text-brand-500">{label}</div>
        <div className="text-xl font-serif text-brand-900">{value}</div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    draft: "bg-brand-100 text-brand-700", sent: "bg-blue-100 text-blue-700",
    confirmed: "bg-purple-100 text-purple-700", received: "bg-green-100 text-green-700",
    cancelled: "bg-red-100 text-red-700", active: "bg-green-100 text-green-700",
    on_leave: "bg-amber-100 text-amber-700", terminated: "bg-red-100 text-red-700",
    pending: "bg-amber-100 text-amber-700", approved: "bg-blue-100 text-blue-700",
    paid: "bg-green-100 text-green-700",
  };
  return <span className={`text-[10px] uppercase px-2 py-0.5 rounded-full ${map[status] || "bg-brand-100 text-brand-700"}`}>{status.replace("_", " ")}</span>;
}

function Loading() { return <div className="py-12 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-brand-500" /></div>; }
function Empty({ label }: { label: string }) { return <div className="py-12 text-center text-sm text-brand-500">{label}</div>; }
