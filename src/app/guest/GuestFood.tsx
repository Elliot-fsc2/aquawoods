import { useState, useMemo } from "react";
import { useApp, type GuestFoodOrder } from "../context/AppContext";
import { useToast } from "../components/ToastProvider";
import { Utensils, Coffee, Pizza, IceCream, Salad, ShoppingCart, Plus, Minus, Trash2, Search, BedDouble, Receipt, Check, Clock } from "lucide-react";

type Category = "All" | "Filipino" | "Mains" | "Breakfast" | "Snacks" | "Desserts" | "Drinks";

interface MenuItem {
  id: string;
  name: string;
  category: Exclude<Category, "All">;
  price: number;
  description: string;
  image: string;
  prepTime: number;
}

const MENU: MenuItem[] = [
  // Filipino
  { id: "F-001", name: "Crispy Pata", category: "Filipino", price: 680, description: "Deep-fried pork knuckle, soy-vinegar dip", image: "https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?auto=format&fit=crop&w=400&q=80", prepTime: 25 },
  { id: "F-002", name: "Sinigang na Hipon", category: "Filipino", price: 420, description: "Sour tamarind shrimp soup with vegetables", image: "https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?auto=format&fit=crop&w=400&q=80", prepTime: 20 },
  { id: "F-003", name: "Kare-Kare", category: "Filipino", price: 520, description: "Oxtail in peanut sauce, served with bagoong", image: "https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=400&q=80", prepTime: 30 },
  { id: "F-004", name: "Chicken Adobo", category: "Filipino", price: 380, description: "Classic chicken adobo with steamed rice", image: "https://images.unsplash.com/photo-1606471191009-63994c53433b?auto=format&fit=crop&w=400&q=80", prepTime: 18 },
  // Breakfast
  { id: "B-001", name: "Tapsilog", category: "Breakfast", price: 280, description: "Beef tapa, garlic rice, fried egg", image: "https://images.unsplash.com/photo-1608039829572-78524f79c4c7?auto=format&fit=crop&w=400&q=80", prepTime: 12 },
  { id: "B-002", name: "Longsilog", category: "Breakfast", price: 260, description: "Sweet longganisa, garlic rice, fried egg", image: "https://images.unsplash.com/photo-1608039829572-78524f79c4c7?auto=format&fit=crop&w=400&q=80", prepTime: 12 },
  { id: "B-003", name: "Daing na Bangus", category: "Breakfast", price: 320, description: "Marinated milkfish, garlic rice, atchara", image: "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=400&q=80", prepTime: 15 },
  { id: "B-004", name: "American Breakfast", category: "Breakfast", price: 380, description: "Eggs, bacon, hash brown, toast, juice", image: "https://images.unsplash.com/photo-1608039829572-78524f79c4c7?auto=format&fit=crop&w=400&q=80", prepTime: 15 },
  // Mains
  { id: "M-001", name: "Grilled Liempo", category: "Mains", price: 450, description: "Grilled pork belly with java rice", image: "https://images.unsplash.com/photo-1558030006-450675393462?auto=format&fit=crop&w=400&q=80", prepTime: 22 },
  { id: "M-002", name: "Pancit Canton", category: "Mains", price: 320, description: "Stir-fried noodles, vegetables, chicken", image: "https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?auto=format&fit=crop&w=400&q=80", prepTime: 15 },
  { id: "M-003", name: "Margherita Pizza (10\")", category: "Mains", price: 380, description: "Tomato, fresh mozzarella, basil", image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=400&q=80", prepTime: 18 },
  // Snacks
  { id: "S-001", name: "Lumpiang Shanghai", category: "Snacks", price: 220, description: "Crispy pork spring rolls (8 pcs)", image: "https://images.unsplash.com/photo-1606471191009-63994c53433b?auto=format&fit=crop&w=400&q=80", prepTime: 12 },
  { id: "S-002", name: "Sisig", category: "Snacks", price: 350, description: "Sizzling pork sisig with rice", image: "https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?auto=format&fit=crop&w=400&q=80", prepTime: 15 },
  { id: "S-003", name: "Chicken Wings", category: "Snacks", price: 280, description: "Buffalo or honey-garlic, 8 pieces", image: "https://images.unsplash.com/photo-1606471191009-63994c53433b?auto=format&fit=crop&w=400&q=80", prepTime: 18 },
  // Desserts
  { id: "D-001", name: "Halo-Halo", category: "Desserts", price: 180, description: "Shaved ice, sweet beans, leche flan, ube ice cream", image: "https://images.unsplash.com/photo-1470124182917-cc6e71b22ecc?auto=format&fit=crop&w=400&q=80", prepTime: 6 },
  { id: "D-002", name: "Leche Flan", category: "Desserts", price: 140, description: "Classic Filipino caramel custard", image: "https://images.unsplash.com/photo-1470124182917-cc6e71b22ecc?auto=format&fit=crop&w=400&q=80", prepTime: 5 },
  { id: "D-003", name: "Chocolate Lava Cake", category: "Desserts", price: 220, description: "Warm cake with vanilla ice cream", image: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=400&q=80", prepTime: 12 },
  // Drinks
  { id: "DR-001", name: "Fresh Buko Juice", category: "Drinks", price: 120, description: "Served in young coconut", image: "https://images.unsplash.com/photo-1502764613149-7f1d229e230f?auto=format&fit=crop&w=400&q=80", prepTime: 3 },
  { id: "DR-002", name: "Calamansi Juice", category: "Drinks", price: 90, description: "Freshly squeezed, iced", image: "https://images.unsplash.com/photo-1551538827-9c037cb4f32a?auto=format&fit=crop&w=400&q=80", prepTime: 3 },
  { id: "DR-003", name: "San Miguel Beer", category: "Drinks", price: 110, description: "Ice-cold, 330ml", image: "https://images.unsplash.com/photo-1502764613149-7f1d229e230f?auto=format&fit=crop&w=400&q=80", prepTime: 1 },
  { id: "DR-004", name: "Brewed Coffee", category: "Drinks", price: 80, description: "Locally sourced Quezon beans", image: "https://images.unsplash.com/photo-1510707577719-ae7c14805e3a?auto=format&fit=crop&w=400&q=80", prepTime: 4 },
];

const categoryIcons: Record<string, React.ReactNode> = {
  All: <Utensils className="w-4 h-4" />,
  Filipino: <Utensils className="w-4 h-4" />,
  Mains: <Pizza className="w-4 h-4" />,
  Breakfast: <Coffee className="w-4 h-4" />,
  Snacks: <Salad className="w-4 h-4" />,
  Desserts: <IceCream className="w-4 h-4" />,
  Drinks: <Coffee className="w-4 h-4" />,
};

interface CartItem { menuItemId: string; name: string; price: number; quantity: number }

export default function GuestFood() {
  const { guestUser, guestBookings, guestFoodOrders, addGuestFoodOrder } = useApp();
  const { addToast } = useToast();
  const [tab, setTab] = useState<"menu" | "history">("menu");
  const [activeCategory, setActiveCategory] = useState<Category>("All");
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [notes, setNotes] = useState("");

  const myOrders = guestFoodOrders.filter((o) => o.guestUserId === guestUser?.id);
  const activeBooking = guestBookings.find((b) => b.guestUserId === guestUser?.id && (b.status === "Confirmed" || b.status === "Checked-in"));
  const deliverTo = activeBooking ? `Room ${activeBooking.roomNumber || "TBA"}` : "Pickup at Restaurant";

  const filteredMenu = useMemo(() => MENU.filter((m) =>
    (activeCategory === "All" || m.category === activeCategory) &&
    (m.name.toLowerCase().includes(search.toLowerCase()) || m.description.toLowerCase().includes(search.toLowerCase()))
  ), [activeCategory, search]);

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

  const subtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const serviceCharge = subtotal * 0.10;
  const total = subtotal + serviceCharge;

  const placeOrder = () => {
    if (cart.length === 0 || !guestUser) return;
    const newOrder: GuestFoodOrder = {
      id: `FO-${Math.floor(Math.random() * 9000) + 1000}`,
      guestUserId: guestUser.id,
      bookingId: activeBooking?.id,
      items: cart.map((c) => ({ name: c.name, price: c.price, qty: c.quantity })),
      total,
      deliverTo,
      status: "Placed",
      notes,
      createdAt: new Date().toLocaleString(),
    };
    addGuestFoodOrder(newOrder);
    setCart([]);
    setNotes("");
    addToast("success", "Order placed!", `${newOrder.id} — ₱${total.toFixed(2)} → ${deliverTo}`);
    setTab("history");
  };

  const categories: Category[] = ["All", "Filipino", "Breakfast", "Mains", "Snacks", "Desserts", "Drinks"];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="text-xs uppercase tracking-[0.25em] text-gold-500 font-medium mb-1">Restaurant & Room Service</div>
          <h1 className="font-serif text-3xl md:text-4xl text-brand-900">Food Ordering</h1>
          <p className="text-brand-700 mt-1">{activeBooking ? `Order to your room — ${deliverTo}` : "Browse our menu — order will be ready for pickup at the restaurant"}</p>
        </div>
      </div>

      {/* TABS */}
      <div className="bg-white rounded-xl border border-brand-100 p-2 flex flex-wrap gap-1">
        {[
          { k: "menu", l: "Menu", i: <Utensils className="w-4 h-4" /> },
          { k: "history", l: `My Orders (${myOrders.length})`, i: <Receipt className="w-4 h-4" /> },
        ].map((t) => (
          <button key={t.k} onClick={() => setTab(t.k as typeof tab)} className={`px-4 py-2 rounded-md text-sm flex items-center gap-2 transition ${tab === t.k ? "bg-brand-800 text-cream-50 shadow" : "text-brand-700 hover:bg-brand-50"}`}>
            {t.i} {t.l}
          </button>
        ))}
      </div>

      {tab === "menu" && (
        <div className="grid lg:grid-cols-3 gap-6">
          {/* MENU */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-xl border border-brand-100 p-4">
              <div className="relative mb-4">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-brand-400" />
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search the menu..." className="w-full pl-9 pr-4 py-2.5 border border-brand-200 rounded-md focus:outline-none focus:border-brand-500" />
              </div>
              <div className="flex flex-wrap gap-1.5">
                {categories.map((c) => (
                  <button key={c} onClick={() => setActiveCategory(c)} className={`px-3 py-1.5 text-xs rounded-full flex items-center gap-1.5 transition ${activeCategory === c ? "bg-brand-800 text-cream-50" : "bg-brand-50 text-brand-700 hover:bg-brand-100"}`}>
                    {categoryIcons[c]} {c}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {filteredMenu.map((item) => (
                <button key={item.id} onClick={() => addToCart(item)} className="text-left bg-white rounded-lg border border-brand-100 overflow-hidden hover:border-brand-500 hover:shadow-md transition">
                  <div className="aspect-video bg-brand-50 relative overflow-hidden">
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
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

          {/* CART */}
          <div className="bg-white rounded-xl border border-brand-100 p-5 h-fit lg:sticky lg:top-24">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-serif text-xl text-brand-900 flex items-center gap-2"><ShoppingCart className="w-5 h-5" /> Your Order</h3>
              {cart.length > 0 && <button onClick={() => setCart([])} className="text-xs text-red-600 hover:text-red-700">Clear</button>}
            </div>

            <div className="mb-3 p-3 bg-brand-50 rounded-md text-xs">
              <div className="flex items-center gap-1 text-brand-600 uppercase tracking-wider"><BedDouble className="w-3 h-3" /> Deliver to</div>
              <div className="font-medium text-brand-900 mt-0.5">{deliverTo}</div>
            </div>

            <div className="space-y-3 mb-4">
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
                          <div className="text-xs text-brand-600">₱{item.price} × {item.quantity}</div>
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
            </div>

            {cart.length > 0 && (
              <>
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Special requests, allergies..." rows={2} className="w-full mb-3 px-2 py-1.5 text-xs border border-brand-200 rounded resize-none" />

                <div className="space-y-1 text-sm pt-3 border-t border-brand-100">
                  <div className="flex justify-between text-brand-700"><span>Subtotal</span><span>₱{subtotal.toFixed(2)}</span></div>
                  <div className="flex justify-between text-brand-700"><span>Service Charge (10%)</span><span>₱{serviceCharge.toFixed(2)}</span></div>
                  <div className="flex justify-between pt-2 border-t border-brand-100">
                    <span className="font-medium">Total</span>
                    <span className="font-serif text-2xl text-brand-900">₱{total.toFixed(2)}</span>
                  </div>
                </div>

                <button onClick={placeOrder} className={`w-full py-2.5 mt-4 rounded-md text-sm flex items-center justify-center gap-2 font-medium ${activeBooking ? "bg-brand-800 text-cream-50 hover:bg-brand-900" : "bg-amber-500 text-white hover:bg-amber-600"}`}>
                  {activeBooking ? <><BedDouble className="w-4 h-4" /> Charge to Room</> : <>Place Order (Pay at Pickup)</>}
                </button>
                {activeBooking && (
                  <div className="text-[10px] text-brand-500 text-center mt-2">Will be added to your room folio</div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* ORDER HISTORY */}
      {tab === "history" && (
        <div className="space-y-3">
          {myOrders.length === 0 ? (
            <div className="bg-white rounded-xl border border-brand-100 p-12 text-center">
              <Receipt className="w-12 h-12 mx-auto mb-4 text-brand-300" />
              <h3 className="font-serif text-2xl text-brand-900 mb-2">No orders yet</h3>
              <p className="text-brand-600 mb-6">Browse the menu and place your first order.</p>
              <button onClick={() => setTab("menu")} className="px-6 py-3 bg-brand-800 text-cream-50 rounded-md hover:bg-brand-900">Browse Menu</button>
            </div>
          ) : myOrders.map((o) => (
            <div key={o.id} className="bg-white rounded-xl border border-brand-100 p-5">
              <div className="flex items-start justify-between mb-3 flex-wrap gap-2">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs text-brand-500">{o.id}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full uppercase tracking-wider ${o.status === "Delivered" ? "bg-emerald-100 text-emerald-800" : o.status === "On the way" ? "bg-blue-100 text-blue-800" : o.status === "Preparing" ? "bg-amber-100 text-amber-800" : o.status === "Cancelled" ? "bg-red-100 text-red-800" : "bg-slate-100 text-slate-700"}`}>{o.status}</span>
                  </div>
                  <div className="text-sm text-brand-600 mt-1 flex items-center gap-1"><BedDouble className="w-3 h-3" /> {o.deliverTo} · {o.createdAt}</div>
                </div>
                <div className="font-serif text-2xl text-brand-900">₱{o.total.toFixed(2)}</div>
              </div>
              <div className="border-t border-brand-100 pt-3 space-y-1 text-sm">
                {o.items.map((i, idx) => (
                  <div key={idx} className="flex justify-between text-brand-700">
                    <span>{i.qty}× {i.name}</span>
                    <span>₱{(i.price * i.qty).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              {o.notes && <div className="mt-3 text-xs text-brand-600 italic bg-brand-50 px-3 py-2 rounded">"{o.notes}"</div>}
              {o.status === "Delivered" && (
                <div className="mt-3 flex items-center gap-2 text-xs text-emerald-700">
                  <Check className="w-4 h-4" /> Order delivered — thank you!
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
