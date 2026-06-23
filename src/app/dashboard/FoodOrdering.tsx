import { useEffect, useMemo, useState } from "react";
import { useApp } from "../context/AppContext";
import { useToast } from "../components/ToastProvider";
import { supabase } from "@/integrations/supabase/client";
import {
  Utensils, Coffee, Pizza, IceCream, Salad, ShoppingCart, Plus, Minus, Trash2,
  CheckCircle2, Clock, ChefHat, BedDouble, Search, Filter, Printer, Pencil, X, Check, DollarSign, Receipt,
} from "lucide-react";

// ---- Types ----
type Category = "Appetizers" | "Mains" | "Desserts" | "Beverages" | "Breakfast" | "Sides";

interface MenuItem {
  id: string;
  name: string;
  category: Category;
  price: number;
  description: string;
  available: boolean;
  prepTime: number; // minutes
  image: string;
}

interface OrderItem { menuItemId: string; name: string; price: number; quantity: number; note?: string }

type OrderType = "Dine-In" | "Room Service" | "Takeaway" | "Banquet";
type OrderStatus = "Pending" | "Preparing" | "Ready" | "Served" | "Cancelled";
type PaymentMethod = "Cash" | "Card" | "Room Charge" | "Mobile";

interface Order {
  id: string;
  type: OrderType;
  tableOrRoom: string;
  guestName: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  service: number;
  total: number;
  status: OrderStatus;
  payment: PaymentMethod | "Unpaid";
  createdAt: string;
  createdAtIso: string;
  notes: string;
}


const categoryIcons: Record<Category, React.ReactNode> = {
  Appetizers: <Salad className="w-4 h-4" />,
  Mains: <Pizza className="w-4 h-4" />,
  Desserts: <IceCream className="w-4 h-4" />,
  Beverages: <Coffee className="w-4 h-4" />,
  Breakfast: <Coffee className="w-4 h-4" />,
  Sides: <Utensils className="w-4 h-4" />,
};

const seedMenu: MenuItem[] = [];

const TIME_FMT: Intl.DateTimeFormatOptions = { hour: "2-digit", minute: "2-digit" };
function formatTime(iso: string) {
  try { return new Date(iso).toLocaleTimeString([], TIME_FMT); } catch { return iso; }
}


const TAX_RATE = 0.07;
const SERVICE_RATE = 0.10;

export default function FoodOrdering() {
  const { user, property } = useApp();
  const { addToast } = useToast();
  const isAdmin = user?.role === "admin";
  const [receiptOrder, setReceiptOrder] = useState<Order | null>(null);

  const [tab, setTab] = useState<"pos" | "orders" | "kitchen" | "menu">("pos");
  const [menu, setMenu] = useState<MenuItem[]>(seedMenu);
  const [menuLoading, setMenuLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data, error } = await supabase
        .from("food_products")
        .select("id,name,category,price,description,available,prep_time,image")
        .order("id");
      if (!mounted) return;
      if (error) {
        addToast("error", "Could not load menu", error.message);
      } else if (data) {
        setMenu(data.map((r: any) => ({
          id: r.id, name: r.name, category: r.category as Category,
          price: Number(r.price), description: r.description ?? "",
          available: r.available, prepTime: r.prep_time,
          image: r.image ?? "",
        })));
      }
      setMenuLoading(false);
    })();
    return () => { mounted = false; };
  }, [addToast]);
  const [orders, setOrders] = useState<Order[]>([]);

  // Load orders from Supabase + realtime
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      const { data, error } = await supabase
        .from("pos_orders")
        .select("*")
        .order("created_at", { ascending: false });
      if (!mounted) return;
      if (error) { addToast("error", "Could not load orders", error.message); return; }
      setOrders((data ?? []).map((r: any) => ({
        id: r.id, type: r.type, tableOrRoom: r.table_or_room, guestName: r.guest_name,
        items: r.items ?? [],
        subtotal: Number(r.subtotal), tax: Number(r.tax), service: Number(r.service), total: Number(r.total),
        status: r.status, payment: r.payment,
        createdAt: formatTime(r.created_at),
        createdAtIso: r.created_at,
        notes: r.notes ?? "",
      })));

    };
    load();
    const channel = supabase
      .channel("pos_orders_changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "pos_orders" }, () => load())
      .subscribe();
    return () => { mounted = false; supabase.removeChannel(channel); };
  }, [addToast]);

  // POS state
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [orderType, setOrderType] = useState<OrderType>("Dine-In");
  const [tableOrRoom, setTableOrRoom] = useState("Table 1");
  const [guestName, setGuestName] = useState("Walk-in");
  const [orderNotes, setOrderNotes] = useState("");
  const [activeCategory, setActiveCategory] = useState<Category | "All">("All");
  const [menuSearch, setMenuSearch] = useState("");

  // KPIs (today only, excluding cancelled)
  const isToday = (iso: string) => {
    const d = new Date(iso); const n = new Date();
    return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth() && d.getDate() === n.getDate();
  };
  const todaysOrders = orders.filter((o) => isToday(o.createdAtIso));
  const todayRevenue = todaysOrders.filter((o) => o.status !== "Cancelled").reduce((s, o) => s + o.total, 0);
  const activeOrders = orders.filter((o) => o.status === "Pending" || o.status === "Preparing").length;
  const completedOrders = todaysOrders.filter((o) => o.status === "Served").length;


  // Cart helpers
  const subtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const tax = subtotal * TAX_RATE;
  const service = subtotal * SERVICE_RATE;
  const total = subtotal + tax + service;

  const addToCart = (item: MenuItem) => {
    setCart((c) => {
      const exists = c.find((i) => i.menuItemId === item.id);
      if (exists) return c.map((i) => i.menuItemId === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...c, { menuItemId: item.id, name: item.name, price: item.price, quantity: 1 }];
    });
  };

  const updateQty = (id: string, delta: number) => {
    setCart((c) => c.map((i) => i.menuItemId === id ? { ...i, quantity: Math.max(1, i.quantity + delta) } : i));
  };

  const removeFromCart = (id: string) => setCart((c) => c.filter((i) => i.menuItemId !== id));

  const filteredMenu = useMemo(() => {
    return menu.filter((m) =>
      (activeCategory === "All" || m.category === activeCategory) &&
      (m.name.toLowerCase().includes(menuSearch.toLowerCase()) || m.description.toLowerCase().includes(menuSearch.toLowerCase()))
    );
  }, [menu, activeCategory, menuSearch]);

  const placeOrder = async (payment: PaymentMethod) => {
    if (cart.length === 0) return;
    const id = `ORD-${Date.now().toString().slice(-6)}`;
    const row = {
      id, type: orderType, table_or_room: tableOrRoom, guest_name: guestName,
      items: cart as any, subtotal, tax, service, total,
      status: "Pending" as OrderStatus, payment, notes: orderNotes || null,
    };
    const { error } = await supabase.from("pos_orders").insert(row);
    if (error) { addToast("error", "Order failed", error.message); return; }
    const nowIso = new Date().toISOString();
    const newOrder: Order = {
      id, type: orderType, tableOrRoom, guestName, items: cart,
      subtotal, tax, service, total, status: "Pending", payment,
      createdAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      createdAtIso: nowIso,
      notes: orderNotes,
    };

    setCart([]); setOrderNotes("");
    addToast("success", "Order placed", `${id} — Total ₱${total.toFixed(2)}`);
    setReceiptOrder(newOrder);
  };

  const updateOrderStatus = async (id: string, status: OrderStatus) => {
    const { error } = await supabase.from("pos_orders").update({ status }).eq("id", id);
    if (error) { addToast("error", "Update failed", error.message); return; }
    setOrders((o) => o.map((order) => order.id === id ? { ...order, status } : order));
    addToast("success", "Order updated", `${id} → ${status}`);
  };

  const deleteOrder = async (id: string) => {
    if (!confirm("Delete this order?")) return;
    const { error } = await supabase.from("pos_orders").delete().eq("id", id);
    if (error) { addToast("error", "Delete failed", error.message); return; }
    setOrders((o) => o.filter((order) => order.id !== id));
    addToast("warning", "Order deleted", id);
  };

  const categories: (Category | "All")[] = ["All", "Appetizers", "Mains", "Breakfast", "Desserts", "Beverages", "Sides"];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="text-xs uppercase tracking-[0.25em] text-gold-500 font-medium mb-1">Restaurant & Room Service</div>
          <h1 className="font-serif text-4xl text-brand-900">Food Ordering & POS</h1>
          <p className="text-brand-700 mt-1">Point of sale, in-room dining, kitchen display, and menu management.</p>
        </div>
        <div className="flex gap-3">
          <KPI label="Today's Revenue" value={`₱${todayRevenue.toFixed(2)}`} icon={<DollarSign className="w-4 h-4" />} />
          <KPI label="Active Orders" value={activeOrders.toString()} icon={<Clock className="w-4 h-4" />} />
          <KPI label="Completed" value={completedOrders.toString()} icon={<CheckCircle2 className="w-4 h-4" />} />
        </div>
      </div>

      {/* TABS */}
      <div className="bg-white rounded-xl border border-brand-100 p-2 flex flex-wrap gap-1">
        {[
          { k: "pos", l: "POS Terminal", i: <ShoppingCart className="w-4 h-4" /> },
          { k: "orders", l: "All Orders", i: <Receipt className="w-4 h-4" /> },
          { k: "kitchen", l: "Kitchen Display", i: <ChefHat className="w-4 h-4" /> },
          { k: "menu", l: "Menu Management", i: <Utensils className="w-4 h-4" /> },
        ].map((t) => (
          <button
            key={t.k}
            onClick={() => setTab(t.k as typeof tab)}
            className={`px-4 py-2 rounded-md text-sm flex items-center gap-2 transition ${tab === t.k ? "bg-brand-800 text-cream-50 shadow" : "text-brand-700 hover:bg-brand-50"}`}
          >
            {t.i} {t.l}
          </button>
        ))}
        {tab === "kitchen" && (
          <button
            onClick={() => {
              const activeKds = orders.filter((o) => o.status === "Pending" || o.status === "Preparing" || o.status === "Ready");
              const rows = activeKds.map((o) => `
                <div style="border:1px solid #ddd;border-radius:8px;padding:12px;margin:8px;display:inline-block;vertical-align:top;width:280px;background:#fff;color:#1f2937;">
                  <div style="font-size:11px;color:#4b5563;font-family:monospace;">${o.id}</div>
                  <div style="font-weight:600;margin-bottom:6px;color:#111827;">${o.tableOrRoom} · ${o.type}</div>
                  <div style="font-size:11px;color:#6b7280;margin-bottom:8px;">${o.createdAt} · ${o.status}</div>
                  ${o.items.map((i) => `<div style="font-size:13px;color:#374151;"><span style="font-weight:600;">${i.quantity}×</span> ${i.name}</div>`).join("")}
                  ${o.notes ? `<div style="margin-top:8px;font-size:12px;background:#fef3c7;color:#92400e;padding:6px;border-radius:4px;">⚠️ ${o.notes}</div>` : ""}
                </div>`).join("");
              const w = window.open("", "KitchenDisplay", "width=1200,height=800");
              if (w) {
                w.document.title = `${property.name} — Kitchen Display`;
                w.document.body.style.cssText = "margin:0;padding:16px;font-family:system-ui,sans-serif;background:#0f172a;color:#fff;";
                w.document.body.innerHTML = `
                  <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 16px;">
                    <h2 style="margin:0;">Kitchen Display · ${activeKds.length} active</h2>
                    <div style="font-size:12px;opacity:.7;">Updated ${new Date().toLocaleTimeString()}</div>
                  </div>
                  <div>${rows || '<p style="padding:32px;text-align:center;opacity:.7;">No active orders</p>'}</div>`;
              }
            }}
            className="ml-auto px-3 py-2 bg-amber-100 text-amber-800 rounded-md text-xs hover:bg-amber-200 flex items-center gap-1"
          >
            📺 Open Kitchen Monitor
          </button>
        )}

      </div>

      {/* POS TERMINAL */}
      {tab === "pos" && (
        <div className="grid lg:grid-cols-3 gap-6">
          {/* MENU SIDE */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-xl border border-brand-100 p-4">
              <div className="flex gap-3 items-center mb-4">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-brand-400" />
                  <input value={menuSearch} onChange={(e) => setMenuSearch(e.target.value)} placeholder="Search menu items..." className="w-full pl-9 pr-4 py-2 text-sm border border-brand-200 rounded-md bg-white focus:outline-none focus:border-brand-500" />
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {categories.map((c) => (
                  <button
                    key={c}
                    onClick={() => setActiveCategory(c)}
                    className={`px-3 py-1.5 text-xs rounded-full flex items-center gap-1.5 transition ${activeCategory === c ? "bg-brand-800 text-cream-50" : "bg-brand-50 text-brand-700 hover:bg-brand-100"}`}
                  >
                    {c !== "All" && categoryIcons[c]} {c}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {filteredMenu.map((item) => (
                <button
                  key={item.id}
                  onClick={() => item.available && addToCart(item)}
                  disabled={!item.available}
                  className={`text-left bg-white rounded-lg border overflow-hidden transition ${item.available ? "border-brand-100 hover:border-brand-500 hover:shadow-md" : "border-brand-100 opacity-50 cursor-not-allowed"}`}
                >
                  <div className="aspect-video bg-brand-50 relative overflow-hidden">
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    {!item.available && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <span className="text-white text-xs uppercase tracking-wider">86'd</span>
                      </div>
                    )}
                    <div className="absolute top-1 right-1 bg-white/95 px-1.5 py-0.5 rounded text-[10px] text-brand-700 flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5" /> {item.prepTime}m
                    </div>
                  </div>
                  <div className="p-3">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="font-medium text-sm text-brand-900 leading-tight">{item.name}</div>
                      <div className="font-serif text-base text-brand-900 flex-shrink-0">₱{item.price}</div>
                    </div>
                    <div className="text-[11px] text-brand-600 line-clamp-2">{item.description}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* CART SIDE */}
          <div className="bg-white rounded-xl border border-brand-100 p-5 h-fit sticky top-24">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-serif text-xl text-brand-900 flex items-center gap-2"><ShoppingCart className="w-5 h-5" /> Current Order</h3>
              {cart.length > 0 && (
                <button onClick={() => setCart([])} className="text-xs text-red-600 hover:text-red-700">Clear</button>
              )}
            </div>

            <div className="space-y-3 mb-4">
              <div className="grid grid-cols-2 gap-2">
                <label className="text-xs text-brand-700">Order Type
                  <select value={orderType} onChange={(e) => setOrderType(e.target.value as OrderType)} className="mt-1 w-full px-2 py-1.5 border border-brand-200 rounded text-sm bg-white">
                    <option>Dine-In</option><option>Room Service</option><option>Takeaway</option><option>Banquet</option>
                  </select>
                </label>
                <label className="text-xs text-brand-700">{orderType === "Room Service" ? "Room #" : "Table #"}
                  <input value={tableOrRoom} onChange={(e) => setTableOrRoom(e.target.value)} className="mt-1 w-full px-2 py-1.5 border border-brand-200 rounded text-sm" />
                </label>
              </div>
              <label className="text-xs text-brand-700 block">Guest / Customer
                <input value={guestName} onChange={(e) => setGuestName(e.target.value)} className="mt-1 w-full px-2 py-1.5 border border-brand-200 rounded text-sm" />
              </label>
            </div>

            <div className="border-t border-brand-100 pt-3 max-h-72 overflow-y-auto">
              {cart.length === 0 ? (
                <div className="text-center py-8 text-brand-500 text-sm">
                  <ShoppingCart className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  Tap menu items to add
                </div>
              ) : (
                <div className="space-y-2">
                  {cart.map((item) => (
                    <div key={item.menuItemId} className="flex items-center gap-2 py-2 border-b border-brand-50 last:border-0">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-brand-900 truncate">{item.name}</div>
                        <div className="text-xs text-brand-600">₱{item.price.toFixed(2)} × {item.quantity}</div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button onClick={() => updateQty(item.menuItemId, -1)} className="w-6 h-6 rounded bg-brand-100 hover:bg-brand-200 flex items-center justify-center"><Minus className="w-3 h-3" /></button>
                        <span className="w-6 text-center text-sm">{item.quantity}</span>
                        <button onClick={() => updateQty(item.menuItemId, 1)} className="w-6 h-6 rounded bg-brand-100 hover:bg-brand-200 flex items-center justify-center"><Plus className="w-3 h-3" /></button>
                        <button onClick={() => removeFromCart(item.menuItemId)} className="w-6 h-6 rounded hover:bg-red-50 flex items-center justify-center text-red-600 ml-1"><Trash2 className="w-3 h-3" /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {cart.length > 0 && (
              <>
                <textarea value={orderNotes} onChange={(e) => setOrderNotes(e.target.value)} placeholder="Special instructions, allergies..." rows={2} className="w-full mt-3 px-2 py-1.5 text-xs border border-brand-200 rounded resize-none" />

                <div className="space-y-1 text-sm mt-3 pt-3 border-t border-brand-100">
                  <Line label="Subtotal" value={subtotal} />
                  <Line label={`Tax (${(TAX_RATE * 100).toFixed(0)}%)`} value={tax} />
                  <Line label={`Service (${(SERVICE_RATE * 100).toFixed(0)}%)`} value={service} />
                  <div className="flex justify-between pt-2 border-t border-brand-100">
                    <span className="font-medium">Total</span>
                    <span className="font-serif text-2xl text-brand-900">₱{total.toFixed(2)}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-4">
                  <button onClick={() => placeOrder("Cash")} className="py-2 bg-emerald-600 text-white rounded-md text-sm hover:bg-emerald-700 flex items-center justify-center gap-1"><DollarSign className="w-4 h-4" /> Cash</button>
                  <button onClick={() => placeOrder("Card")} className="py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700">💳 Card</button>
                  {orderType === "Room Service" && (
                    <button onClick={() => placeOrder("Room Charge")} className="py-2 bg-brand-800 text-cream-50 rounded-md text-sm hover:bg-brand-900 col-span-2 flex items-center justify-center gap-1"><BedDouble className="w-4 h-4" /> Charge to Room</button>
                  )}
                  <button onClick={() => placeOrder("Mobile")} className={`py-2 bg-purple-600 text-white rounded-md text-sm hover:bg-purple-700 ${orderType !== "Room Service" ? "col-span-2" : ""}`}>📱 Mobile Pay</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ALL ORDERS */}
      {tab === "orders" && (
        <OrdersTable
          orders={orders}
          isAdmin={isAdmin}
          onUpdateStatus={updateOrderStatus}
          onDelete={deleteOrder}
          onPrint={(o) => setReceiptOrder(o)}
        />
      )}

      {/* KITCHEN DISPLAY */}
      {tab === "kitchen" && (
        <KitchenDisplay
          orders={orders.filter((o) => o.status === "Pending" || o.status === "Preparing" || o.status === "Ready")}
          onUpdateStatus={updateOrderStatus}
        />
      )}

      {/* MENU MANAGEMENT */}
      {tab === "menu" && <MenuManagement menu={menu} setMenu={setMenu} isAdmin={isAdmin} />}

      {/* ORDER RECEIPT MODAL */}
      {receiptOrder && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 print:bg-white print:p-0" onClick={() => setReceiptOrder(null)}>
          <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto print:rounded-none print:max-w-full" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-brand-100 flex items-start justify-between print:hidden">
              <div>
                <div className="text-xs uppercase tracking-wider text-gold-500">Order Receipt</div>
                <h3 className="font-serif text-2xl text-brand-900">{receiptOrder.id}</h3>
              </div>
              <button onClick={() => setReceiptOrder(null)} className="text-brand-600 hover:text-brand-900 text-2xl leading-none">×</button>
            </div>
            <div className="p-6" id="order-receipt-print">
              <div className="text-center mb-4">
                <div className="font-serif text-xl text-brand-900">{property.name}</div>
                <div className="text-xs text-brand-500">{receiptOrder.type} · {receiptOrder.tableOrRoom} · {receiptOrder.createdAt}</div>
              </div>
              <div className="text-sm border-t border-b border-brand-100 py-3 mb-3">
                <div className="flex justify-between"><span className="text-brand-600">Guest</span><span className="font-medium">{receiptOrder.guestName}</span></div>
                <div className="flex justify-between"><span className="text-brand-600">Status</span><span>{receiptOrder.status}</span></div>
                <div className="flex justify-between"><span className="text-brand-600">Payment</span><span>{receiptOrder.payment}</span></div>
              </div>
              <div className="text-sm space-y-1">
                {receiptOrder.items.map((it) => (
                  <div key={it.menuItemId} className="flex justify-between"><span>{it.quantity}× {it.name}</span><span>₱{(it.price * it.quantity).toFixed(2)}</span></div>
                ))}
              </div>
              <div className="mt-3 pt-3 border-t border-brand-100 text-sm space-y-1">
                <div className="flex justify-between"><span className="text-brand-600">Subtotal</span><span>₱{receiptOrder.subtotal.toFixed(2)}</span></div>
                <div className="flex justify-between"><span className="text-brand-600">Tax</span><span>₱{receiptOrder.tax.toFixed(2)}</span></div>
                <div className="flex justify-between"><span className="text-brand-600">Service</span><span>₱{receiptOrder.service.toFixed(2)}</span></div>
                <div className="flex justify-between text-base pt-2 border-t border-brand-100 mt-2">
                  <span className="font-medium">Total</span><span className="font-serif text-xl">₱{receiptOrder.total.toFixed(2)}</span>
                </div>
              </div>
              {receiptOrder.notes && (
                <div className="mt-3 text-xs italic text-brand-600 bg-brand-50 p-2 rounded">{receiptOrder.notes}</div>
              )}
              <div className="mt-6 text-center text-xs text-brand-500">Thank you · Generated {new Date().toLocaleString()}</div>
            </div>
            <div className="p-4 border-t border-brand-100 flex gap-2 print:hidden">
              <button onClick={() => { window.print(); addToast("info", "Printing receipt", receiptOrder.id); }} className="flex-1 py-2.5 bg-brand-800 text-cream-50 rounded-md text-sm hover:bg-brand-900 flex items-center justify-center gap-1">
                <Printer className="w-4 h-4" /> Print Receipt
              </button>
              <button onClick={() => setReceiptOrder(null)} className="flex-1 py-2.5 border border-brand-200 rounded-md text-sm hover:bg-brand-50">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function KPI({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="bg-white rounded-lg border border-brand-100 px-4 py-2 flex items-center gap-2">
      <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center">{icon}</div>
      <div>
        <div className="text-[10px] text-brand-600 uppercase tracking-wider">{label}</div>
        <div className="font-serif text-lg text-brand-900 leading-tight">{value}</div>
      </div>
    </div>
  );
}

function Line({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex justify-between text-brand-700">
      <span>{label}</span>
      <span>₱{value.toFixed(2)}</span>
    </div>
  );
}

// ============= ORDERS TABLE =============
function OrdersTable({ orders, isAdmin, onUpdateStatus, onDelete, onPrint }: {
  orders: Order[]; isAdmin: boolean;
  onUpdateStatus: (id: string, status: OrderStatus) => void;
  onDelete: (id: string) => void;
  onPrint: (order: Order) => void;
}) {
  const [filterStatus, setFilterStatus] = useState<"all" | OrderStatus>("all");
  const [filterType, setFilterType] = useState<"all" | OrderType>("all");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const filtered = orders.filter((o) =>
    (filterStatus === "all" || o.status === filterStatus) &&
    (filterType === "all" || o.type === filterType)
  );

  const allSelected = filtered.length > 0 && filtered.every((o) => selectedIds.includes(o.id));
  const toggleAll = () => {
    if (allSelected) setSelectedIds((c) => c.filter((id) => !filtered.find((f) => f.id === id)));
    else setSelectedIds(Array.from(new Set([...selectedIds, ...filtered.map((f) => f.id)])));
  };

  const bulkDelete = () => {
    if (confirm(`Delete ${selectedIds.length} orders?`)) {
      selectedIds.forEach((id) => onDelete(id));
      setSelectedIds([]);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-brand-100 p-6">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
        <div>
          <h3 className="font-serif text-xl text-brand-900">All Orders</h3>
          <div className="text-xs text-brand-600">Track every order across POS, room service, and dine-in</div>
        </div>
        <div className="flex gap-2 items-center">
          {isAdmin && selectedIds.length > 0 && (
            <button onClick={bulkDelete} className="px-3 py-2 bg-red-600 text-white rounded-md text-xs hover:bg-red-700 flex items-center gap-1">
              <Trash2 className="w-3.5 h-3.5" /> Delete {selectedIds.length}
            </button>
          )}
          <select value={filterType} onChange={(e) => setFilterType(e.target.value as typeof filterType)} className="px-3 py-2 text-xs border border-brand-200 rounded-md bg-white">
            <option value="all">All Types</option>
            <option>Dine-In</option><option>Room Service</option><option>Takeaway</option><option>Banquet</option>
          </select>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as typeof filterStatus)} className="px-3 py-2 text-xs border border-brand-200 rounded-md bg-white">
            <option value="all">All Status</option>
            <option>Pending</option><option>Preparing</option><option>Ready</option><option>Served</option><option>Cancelled</option>
          </select>
          <button
            onClick={() => {
              const header = ["Order #","Type","Location","Guest","Items","Total","Payment","Status","Time"];
              const rows = filtered.map((o) => [
                o.id, o.type, o.tableOrRoom, o.guestName,
                o.items.reduce((s, i) => s + i.quantity, 0),
                o.total.toFixed(2), o.payment, o.status, o.createdAt,
              ]);
              const csv = [header, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
              const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
              const a = document.createElement("a");
              a.href = url; a.download = `pos-orders-${new Date().toISOString().slice(0,10)}.csv`; a.click();
              URL.revokeObjectURL(url);
            }}
            className="px-3 py-2 text-xs border border-brand-200 rounded-md bg-white hover:bg-brand-50 flex items-center gap-1"
          ><Filter className="w-3 h-3" /> Export</button>

        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-brand-600 uppercase tracking-wider border-b border-brand-100">
              {isAdmin && (
                <th className="text-left pb-2 font-medium">
                  <input type="checkbox" checked={allSelected} onChange={toggleAll} className="h-4 w-4 accent-brand-700" />
                </th>
              )}
              <th className="text-left pb-2 font-medium">Order #</th>
              <th className="text-left pb-2 font-medium">Type</th>
              <th className="text-left pb-2 font-medium">Location</th>
              <th className="text-left pb-2 font-medium">Guest</th>
              <th className="text-left pb-2 font-medium">Items</th>
              <th className="text-right pb-2 font-medium">Total</th>
              <th className="text-left pb-2 font-medium">Payment</th>
              <th className="text-left pb-2 font-medium">Status</th>
              <th className="text-left pb-2 font-medium">Time</th>
              <th className="text-right pb-2 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-50">
            {filtered.length === 0 && (
              <tr><td colSpan={isAdmin ? 11 : 10} className="py-10 text-center text-brand-500 text-sm">
                <Receipt className="w-8 h-8 mx-auto mb-2 opacity-40" />
                No orders match these filters. Place one from the POS Terminal tab.
              </td></tr>
            )}
            {filtered.map((order) => (

              <tr key={order.id} className="hover:bg-brand-50/40">
                {isAdmin && (
                  <td className="py-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(order.id)}
                      onChange={() => setSelectedIds((c) => c.includes(order.id) ? c.filter((id) => id !== order.id) : [...c, order.id])}
                      className="h-4 w-4 accent-brand-700"
                    />
                  </td>
                )}
                <td className="py-3 font-mono text-xs">{order.id}</td>
                <td className="py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${order.type === "Room Service" ? "bg-purple-100 text-purple-800" : order.type === "Dine-In" ? "bg-blue-100 text-blue-800" : "bg-slate-100 text-slate-700"}`}>
                    {order.type === "Room Service" && <BedDouble className="inline w-3 h-3 mr-1" />}
                    {order.type}
                  </span>
                </td>
                <td className="py-3 font-medium text-brand-900">{order.tableOrRoom}</td>
                <td className="py-3 text-brand-700 text-xs">{order.guestName}</td>
                <td className="py-3 text-brand-700 text-xs">{order.items.reduce((s, i) => s + i.quantity, 0)} items</td>
                <td className="py-3 text-right font-medium">₱{order.total.toFixed(2)}</td>
                <td className="py-3 text-xs">
                  <span className={`px-2 py-0.5 rounded-full ${order.payment === "Unpaid" ? "bg-red-100 text-red-800" : "bg-emerald-100 text-emerald-800"}`}>{order.payment}</span>
                </td>
                <td className="py-3">
                  <select
                    value={order.status}
                    onChange={(e) => onUpdateStatus(order.id, e.target.value as OrderStatus)}
                    className={`text-xs px-2 py-1 rounded-full border-0 cursor-pointer ${order.status === "Served" ? "bg-emerald-100 text-emerald-800" : order.status === "Ready" ? "bg-blue-100 text-blue-800" : order.status === "Preparing" ? "bg-amber-100 text-amber-800" : order.status === "Cancelled" ? "bg-red-100 text-red-800" : "bg-slate-100 text-slate-700"}`}
                  >
                    <option>Pending</option><option>Preparing</option><option>Ready</option><option>Served</option><option>Cancelled</option>
                  </select>
                </td>
                <td className="py-3 text-brand-600 text-xs">{order.createdAt}</td>
                <td className="py-3 text-right">
                  <div className="flex justify-end gap-1">
                    <button onClick={() => onPrint(order)} className="p-1.5 rounded hover:bg-brand-100 text-brand-600" title="Print receipt"><Printer className="w-3.5 h-3.5" /></button>
                    {isAdmin && (
                      <button onClick={() => onDelete(order.id)} className="p-1.5 rounded hover:bg-red-50 text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============= KITCHEN DISPLAY =============
function KitchenDisplay({ orders, onUpdateStatus }: { orders: Order[]; onUpdateStatus: (id: string, status: OrderStatus) => void }) {
  const buckets = [
    { status: "Pending" as OrderStatus, label: "New Orders", color: "bg-slate-700" },
    { status: "Preparing" as OrderStatus, label: "Preparing", color: "bg-amber-600" },
    { status: "Ready" as OrderStatus, label: "Ready to Serve", color: "bg-emerald-600" },
  ];

  return (
    <div className="grid md:grid-cols-3 gap-4">
      {buckets.map((bucket) => {
        const bucketOrders = orders.filter((o) => o.status === bucket.status);
        return (
          <div key={bucket.status} className="bg-white rounded-xl border border-brand-100">
            <div className={`${bucket.color} text-white px-4 py-3 rounded-t-xl flex items-center justify-between`}>
              <div className="flex items-center gap-2">
                <ChefHat className="w-4 h-4" />
                <h3 className="font-medium">{bucket.label}</h3>
              </div>
              <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs">{bucketOrders.length}</span>
            </div>
            <div className="p-3 space-y-3 max-h-[600px] overflow-y-auto">
              {bucketOrders.length === 0 ? (
                <div className="text-center py-8 text-brand-500 text-sm">No orders</div>
              ) : bucketOrders.map((order) => (
                <div key={order.id} className="border border-brand-100 rounded-lg p-3">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="font-mono text-xs text-brand-600">{order.id}</div>
                      <div className="font-medium text-brand-900 text-sm flex items-center gap-1">
                        {order.type === "Room Service" && <BedDouble className="w-3.5 h-3.5" />}
                        {order.tableOrRoom}
                      </div>
                    </div>
                    <div className="text-xs text-brand-600">{order.createdAt}</div>
                  </div>
                  <div className="space-y-1 mb-3 text-sm">
                    {order.items.map((item) => (
                      <div key={item.menuItemId} className="flex justify-between text-brand-800">
                        <span><span className="font-medium">{item.quantity}×</span> {item.name}</span>
                      </div>
                    ))}
                  </div>
                  {order.notes && (
                    <div className="text-xs bg-amber-50 text-amber-800 px-2 py-1 rounded mb-3">⚠️ {order.notes}</div>
                  )}
                  <div className="flex gap-1">
                    {bucket.status === "Pending" && (
                      <button onClick={() => onUpdateStatus(order.id, "Preparing")} className="flex-1 py-1.5 bg-amber-600 text-white rounded text-xs hover:bg-amber-700">Start Preparing</button>
                    )}
                    {bucket.status === "Preparing" && (
                      <button onClick={() => onUpdateStatus(order.id, "Ready")} className="flex-1 py-1.5 bg-emerald-600 text-white rounded text-xs hover:bg-emerald-700">Mark Ready</button>
                    )}
                    {bucket.status === "Ready" && (
                      <button onClick={() => onUpdateStatus(order.id, "Served")} className="flex-1 py-1.5 bg-brand-800 text-cream-50 rounded text-xs hover:bg-brand-900">Mark Served</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ============= MENU MANAGEMENT =============
function MenuManagement({ menu, setMenu, isAdmin }: { menu: MenuItem[]; setMenu: React.Dispatch<React.SetStateAction<MenuItem[]>>; isAdmin: boolean }) {
  const { addToast } = useToast();
  const [editing, setEditing] = useState<MenuItem | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState<Category | "all">("all");

  const filtered = filter === "all" ? menu : menu.filter((m) => m.category === filter);

  const save = async (data: Omit<MenuItem, "id"> & { id?: string }) => {
    const row = {
      name: data.name, category: data.category, price: data.price,
      description: data.description, available: data.available,
      prep_time: data.prepTime, image: data.image,
    };
    if (data.id) {
      const { error } = await supabase.from("food_products").update(row).eq("id", data.id);
      if (error) return addToast("error", "Update failed", error.message);
      setMenu((m) => m.map((item) => item.id === data.id ? { ...item, ...data, id: data.id! } : item));
      addToast("success", "Menu item updated", data.name);
    } else {
      const newId = `M-${String(Date.now()).slice(-6)}`;
      const { error } = await supabase.from("food_products").insert({ id: newId, ...row });
      if (error) return addToast("error", "Create failed", error.message);
      setMenu((m) => [...m, { ...data, id: newId }]);
      addToast("success", "Menu item added", data.name);
    }
    setEditing(null);
    setShowForm(false);
  };

  const toggleAvailable = async (id: string) => {
    const item = menu.find((m) => m.id === id);
    if (!item) return;
    const next = !item.available;
    const { error } = await supabase.from("food_products").update({ available: next }).eq("id", id);
    if (error) return addToast("error", "Update failed", error.message);
    setMenu((m) => m.map((it) => it.id === id ? { ...it, available: next } : it));
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("food_products").delete().eq("id", id);
    if (error) return addToast("error", "Delete failed", error.message);
    setMenu((m) => m.filter((x) => x.id !== id));
    addToast("warning", "Menu item removed", id);
  };


  return (
    <div className="bg-white rounded-xl border border-brand-100 p-6">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
        <div>
          <h3 className="font-serif text-xl text-brand-900">Menu Management</h3>
          <div className="text-xs text-brand-600">{menu.length} items · {menu.filter((m) => m.available).length} available</div>
        </div>
        <div className="flex gap-2 items-center">
          <select value={filter} onChange={(e) => setFilter(e.target.value as typeof filter)} className="px-3 py-2 text-xs border border-brand-200 rounded-md bg-white">
            <option value="all">All Categories</option>
            <option>Appetizers</option><option>Mains</option><option>Breakfast</option><option>Desserts</option><option>Beverages</option><option>Sides</option>
          </select>
          {isAdmin && (
            <button onClick={() => { setEditing(null); setShowForm(true); }} className="px-3 py-2 bg-brand-800 text-cream-50 rounded-md text-xs hover:bg-brand-900 flex items-center gap-1">
              <Plus className="w-3.5 h-3.5" /> Add Item
            </button>
          )}
        </div>
      </div>

      {(showForm || editing) && isAdmin && (
        <MenuForm item={editing} onSave={save} onCancel={() => { setEditing(null); setShowForm(false); }} />
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-brand-600 uppercase tracking-wider border-b border-brand-100">
              <th className="text-left pb-2 font-medium">Item</th>
              <th className="text-left pb-2 font-medium">Category</th>
              <th className="text-left pb-2 font-medium">Description</th>
              <th className="text-right pb-2 font-medium">Price</th>
              <th className="text-left pb-2 font-medium">Prep</th>
              <th className="text-left pb-2 font-medium">Status</th>
              {isAdmin && <th className="text-right pb-2 font-medium">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-50">
            {filtered.map((item) => (
              <tr key={item.id} className="hover:bg-brand-50/40">
                <td className="py-3">
                  <div className="flex items-center gap-3">
                    <img src={item.image} alt={item.name} className="w-12 h-12 rounded-md object-cover" />
                    <div>
                      <div className="font-medium text-brand-900">{item.name}</div>
                      <div className="font-mono text-[10px] text-brand-500">{item.id}</div>
                    </div>
                  </div>
                </td>
                <td className="py-3">
                  <span className="text-xs px-2 py-0.5 bg-brand-50 text-brand-700 rounded-full flex items-center gap-1 w-fit">{categoryIcons[item.category]} {item.category}</span>
                </td>
                <td className="py-3 text-brand-700 text-xs max-w-xs truncate">{item.description}</td>
                <td className="py-3 text-right font-medium">₱{item.price}</td>
                <td className="py-3 text-brand-700 text-xs">{item.prepTime}m</td>
                <td className="py-3">
                  <button onClick={() => isAdmin && toggleAvailable(item.id)} className={`text-xs px-2 py-0.5 rounded-full ${item.available ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"} ${isAdmin ? "cursor-pointer hover:opacity-80" : "cursor-default"}`}>
                    {item.available ? "Available" : "86'd"}
                  </button>
                </td>
                {isAdmin && (
                  <td className="py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => { setEditing(item); setShowForm(false); }} className="p-1.5 rounded hover:bg-brand-100 text-brand-600"><Pencil className="w-3.5 h-3.5" /></button>
                      <button onClick={() => remove(item.id)} className="p-1.5 rounded hover:bg-red-50 text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function MenuForm({ item, onSave, onCancel }: { item: MenuItem | null; onSave: (data: Omit<MenuItem, "id"> & { id?: string }) => void; onCancel: () => void }) {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    onSave({
      id: item?.id,
      name: String(fd.get("name")),
      category: String(fd.get("category")) as Category,
      price: Number(fd.get("price")),
      description: String(fd.get("description")),
      available: fd.get("available") === "on",
      prepTime: Number(fd.get("prepTime")),
      image: String(fd.get("image")) || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80",
    });
  };

  return (
    <form onSubmit={handleSubmit} className="mb-4 p-4 rounded-lg bg-brand-50 border border-brand-100">
      <div className="text-xs uppercase tracking-wider text-brand-600 mb-3">{item ? "Update" : "Add"} Menu Item</div>
      <div className="grid md:grid-cols-3 gap-3">
        <label className="text-xs text-brand-700">Name<input name="name" required defaultValue={item?.name} className="mt-1 w-full px-3 py-2 border border-brand-200 rounded-md bg-white text-sm" /></label>
        <label className="text-xs text-brand-700">Category
          <select name="category" required defaultValue={item?.category || "Mains"} className="mt-1 w-full px-3 py-2 border border-brand-200 rounded-md bg-white text-sm">
            <option>Appetizers</option><option>Mains</option><option>Breakfast</option><option>Desserts</option><option>Beverages</option><option>Sides</option>
          </select>
        </label>
        <label className="text-xs text-brand-700">Price ($)<input name="price" type="number" step="0.01" min="0" required defaultValue={item?.price} className="mt-1 w-full px-3 py-2 border border-brand-200 rounded-md bg-white text-sm" /></label>
        <label className="text-xs text-brand-700 md:col-span-2">Description<input name="description" required defaultValue={item?.description} className="mt-1 w-full px-3 py-2 border border-brand-200 rounded-md bg-white text-sm" /></label>
        <label className="text-xs text-brand-700">Prep Time (min)<input name="prepTime" type="number" min="1" required defaultValue={item?.prepTime} className="mt-1 w-full px-3 py-2 border border-brand-200 rounded-md bg-white text-sm" /></label>
        <label className="text-xs text-brand-700 md:col-span-2">Image URL<input name="image" defaultValue={item?.image} className="mt-1 w-full px-3 py-2 border border-brand-200 rounded-md bg-white text-sm" /></label>
        <label className="text-xs text-brand-700 flex items-center gap-2 mt-5">
          <input type="checkbox" name="available" defaultChecked={item?.available ?? true} className="h-4 w-4 accent-brand-700" />
          Available
        </label>
      </div>
      <div className="flex justify-end gap-2 mt-3">
        <button type="button" onClick={onCancel} className="px-3 py-1.5 border border-brand-200 rounded-md text-xs hover:bg-white flex items-center gap-1"><X className="w-3 h-3" /> Cancel</button>
        <button type="submit" className="px-3 py-1.5 bg-brand-800 text-cream-50 rounded-md text-xs hover:bg-brand-900 flex items-center gap-1"><Check className="w-3 h-3" /> Save</button>
      </div>
    </form>
  );
}
