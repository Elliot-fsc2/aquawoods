import { useState, useMemo } from "react";
import { useApp, type BookingAddon, type AddonId, type GuestBooking, type Reservation } from "../context/AppContext";
import { useToast } from "../components/ToastProvider";
import {
  Plus, Calendar, Users, Bed, Coffee, Plane, Clock, Sparkles, MapPin,
  Baby, PartyPopper, Check, X, AlertCircle, Receipt, Pencil,
} from "lucide-react";

// Fallback images per room type
const TYPE_IMAGES: Record<string, string> = {
  "Standard Room": "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=800&q=80",
  "Deluxe Garden": "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80",
  "Family Villa": "https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=800&q=80",
  "Lagoon Suite": "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80",
};

// Available addons
const ADDONS: { id: AddonId; name: string; price: number; icon: React.ReactNode; description: string }[] = [
  { id: "breakfast", name: "Filipino Breakfast (per pax)", price: 350, icon: <Coffee className="w-5 h-5" />, description: "Tapsilog, longsilog, tocilog with brewed coffee" },
  { id: "airport-pickup", name: "Airport / Bus Terminal Pickup", price: 1500, icon: <Plane className="w-5 h-5" />, description: "From Lucena Grand Terminal or NAIA (Manila +₱2000)" },
  { id: "early-checkin", name: "Early Check-in (before 12 PM)", price: 800, icon: <Clock className="w-5 h-5" />, description: "Subject to room availability" },
  { id: "late-checkout", name: "Late Check-out (until 6 PM)", price: 1200, icon: <Clock className="w-5 h-5" />, description: "Extra hours beyond 12 PM" },
  { id: "spa", name: "Couples Spa Treatment (60 min)", price: 3500, icon: <Sparkles className="w-5 h-5" />, description: "Hilot Filipino massage for two" },
  { id: "tour", name: "Local Tour Package", price: 2500, icon: <MapPin className="w-5 h-5" />, description: "Half-day Quezon highlights with guide" },
  { id: "extra-bed", name: "Extra Bed", price: 600, icon: <Baby className="w-5 h-5" />, description: "Roll-away bed with fresh linens" },
  { id: "decoration", name: "Room Decoration", price: 2000, icon: <PartyPopper className="w-5 h-5" />, description: "Romantic or birthday setup with balloons & flowers" },
];

const TAX_RATE = 0.07;

export default function GuestBookings() {
  const { guestUser, guestBookings, rooms, reservations, addGuestBooking, cancelGuestBooking, property } = useApp();
  const { addToast } = useToast();
  const [view, setView] = useState<"list" | "new" | "addons">("list");
  const [editing, setEditing] = useState<GuestBooking | null>(null);
  const [receipt, setReceipt] = useState<GuestBooking | null>(null);

  const myBookings = guestBookings;

  // New booking state
  const [selectedRoom, setSelectedRoom] = useState<(typeof rooms)[0] | null>(null);
  const [checkIn, setCheckIn] = useState(() => new Date(Date.now() + 86400000).toISOString().slice(0, 10));
  const [checkOut, setCheckOut] = useState(() => new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10));
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [specialRequests, setSpecialRequests] = useState("");
  const [bookingAddons, setBookingAddons] = useState<BookingAddon[]>([]);

  const nights = Math.max(1, Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000));

  const isRoomAvailable = (room: (typeof rooms)[0], ci: string, co: string) => {
    if (room.status === "maintenance") return false;
    if (room.status === "occupied") return false;
    const activeStatuses: Reservation["status"][] = ["confirmed", "checked-in"];
    const conflict = reservations.find(
      (r) =>
        r.roomId === room.id &&
        activeStatuses.includes(r.status) &&
        ci < r.checkOut &&
        co > r.checkIn,
    );
    return !conflict;
  };

  const availableRooms = useMemo(
    () => rooms.filter((r) => isRoomAvailable(r, checkIn, checkOut)),
    [rooms, reservations, checkIn, checkOut],
  );

  // Group rooms by type/category, show availability per type
  const roomTypes = useMemo(() => {
    const map = new Map<string, { type: string; available: boolean; sample: (typeof rooms)[0] }>();
    for (const room of rooms) {
      if (!map.has(room.type)) {
        const firstAvailable = availableRooms.find((r) => r.type === room.type);
        map.set(room.type, {
          type: room.type,
          available: !!firstAvailable,
          sample: firstAvailable ?? room,
        });
      }
    }
    return Array.from(map.values());
  }, [rooms, availableRooms]);

  const roomTotal = (selectedRoom?.baseRate || 0) * nights;
  const addonTotal = bookingAddons.reduce((s, a) => s + a.price * a.quantity, 0);
  const subtotal = roomTotal + addonTotal;
  const tax = subtotal * TAX_RATE;
  const total = subtotal + tax;

  const toggleAddon = (a: typeof ADDONS[0]) => {
    setBookingAddons((current) => {
      const exists = current.find((x) => x.id === a.id);
      if (exists) return current.filter((x) => x.id !== a.id);
      return [...current, { id: a.id, name: a.name, price: a.price, quantity: 1 }];
    });
  };

  const updateAddonQty = (id: AddonId, delta: number) => {
    setBookingAddons((current) => current.map((a) => a.id === id ? { ...a, quantity: Math.max(1, a.quantity + delta) } : a));
  };

  const confirmBooking = async () => {
    if (!selectedRoom || !guestUser) return;
    const newBooking: GuestBooking = {
      id: `BK-${Math.floor(Math.random() * 900000) + 100000}`,
      guestUserId: guestUser.id,
      roomType: selectedRoom.type,
      roomNumber: selectedRoom.number,
      checkIn, checkOut, adults, children, nights,
      roomRate: selectedRoom.baseRate,
      addons: bookingAddons,
      subtotal, tax, total,
      status: "Confirmed",
      paymentStatus: "Unpaid",
      specialRequests,
      createdAt: new Date().toLocaleString(),
    };
    const ok = await addGuestBooking(newBooking);
    setSelectedRoom(null);
    setBookingAddons([]);
    setSpecialRequests("");
    setView("list");
    if (ok) {
      addToast("success", "Booking confirmed!", `${newBooking.id} — ₱${total.toLocaleString()} · ${newBooking.roomType}`);
    } else {
      addToast("error", "Booking saved locally", "Could not sync to server. Staff may not see it.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="text-xs uppercase tracking-[0.25em] text-gold-500 font-medium mb-1">My Bookings</div>
          <h1 className="font-serif text-3xl md:text-4xl text-brand-900">Booking Monitor</h1>
          <p className="text-brand-700 mt-1">View, manage and create new room reservations with add-ons.</p>
        </div>
        {view === "list" && (
          <button onClick={() => setView("new")} className="px-4 py-2 bg-brand-800 text-cream-50 rounded-md text-sm hover:bg-brand-900 flex items-center gap-2">
            <Plus className="w-4 h-4" /> New Booking
          </button>
        )}
        {(view === "new" || view === "addons") && (
          <button onClick={() => { setView("list"); setSelectedRoom(null); setBookingAddons([]); }} className="px-4 py-2 border border-brand-200 rounded-md text-sm hover:bg-brand-50">
            ← Back to Bookings
          </button>
        )}
      </div>

      {/* LIST VIEW */}
      {view === "list" && (
        <>
          {myBookings.length === 0 ? (
            <div className="bg-white rounded-xl border border-brand-100 p-12 text-center">
              <Calendar className="w-12 h-12 mx-auto mb-4 text-brand-300" />
              <h3 className="font-serif text-2xl text-brand-900 mb-2">No bookings yet</h3>
              <p className="text-brand-600 mb-6">Start your first stay at our garden resort.</p>
              <button onClick={() => setView("new")} className="px-6 py-3 bg-brand-800 text-cream-50 rounded-md hover:bg-brand-900 inline-flex items-center gap-2">
                <Plus className="w-4 h-4" /> Book a Room
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {myBookings.map((b) => (
                <div key={b.id} className="bg-white rounded-xl border border-brand-100 overflow-hidden">
                  <div className="grid md:grid-cols-3">
                    <div className="md:col-span-2 p-6">
                      <div className="flex items-start justify-between mb-4 flex-wrap gap-2">
                        <div>
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className={`text-xs px-2 py-0.5 rounded-full uppercase tracking-wider ${b.status === "Checked-in" ? "bg-emerald-100 text-emerald-800" : b.status === "Confirmed" ? "bg-blue-100 text-blue-800" : b.status === "Cancelled" ? "bg-red-100 text-red-800" : "bg-slate-100 text-slate-700"}`}>{b.status}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${b.paymentStatus === "Paid" ? "bg-emerald-50 text-emerald-700" : b.paymentStatus === "Partial" ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-700"}`}>{b.paymentStatus}</span>
                            <span className="text-xs font-mono text-brand-500">{b.id}</span>
                          </div>
                          <div className="font-serif text-2xl text-brand-900">{b.roomType}</div>
                          <div className="text-sm text-brand-600">Room {b.roomNumber || "TBA"} · Booked {b.createdAt}</div>
                        </div>
                        <div className="flex gap-1">
                          <button onClick={() => setEditing(b)} className="px-3 py-1.5 border border-brand-200 rounded-md text-xs hover:bg-brand-50 flex items-center gap-1"><Pencil className="w-3 h-3" /> Modify</button>
                          {(b.status === "Confirmed" || b.status === "Pending") && (
                            <button onClick={() => { if (confirm("Cancel this booking?")) { cancelGuestBooking(b.id); addToast("warning", "Booking cancelled", b.id); } }} className="px-3 py-1.5 border border-red-200 text-red-700 rounded-md text-xs hover:bg-red-50">Cancel</button>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
                        <div>
                          <div className="text-xs text-brand-500 uppercase tracking-wider">Check-in</div>
                          <div className="font-medium text-brand-900">{b.checkIn}</div>
                        </div>
                        <div>
                          <div className="text-xs text-brand-500 uppercase tracking-wider">Check-out</div>
                          <div className="font-medium text-brand-900">{b.checkOut}</div>
                        </div>
                        <div>
                          <div className="text-xs text-brand-500 uppercase tracking-wider">Guests</div>
                          <div className="font-medium text-brand-900">{b.adults} adults{b.children ? ` · ${b.children} child` : ""}</div>
                        </div>
                        <div>
                          <div className="text-xs text-brand-500 uppercase tracking-wider">Nights</div>
                          <div className="font-medium text-brand-900">{b.nights}</div>
                        </div>
                      </div>

                      {b.addons.length > 0 && (
                        <div className="mb-3">
                          <div className="text-xs text-brand-500 uppercase tracking-wider mb-1">Add-ons</div>
                          <div className="flex flex-wrap gap-1">
                            {b.addons.map((a) => (
                              <span key={a.id} className="text-xs px-2 py-0.5 bg-gold-50 text-gold-800 rounded-full">{a.quantity}× {a.name} · ₱{a.price * a.quantity}</span>
                            ))}
                          </div>
                        </div>
                      )}

                      {b.specialRequests && (
                        <div className="text-xs text-brand-600 bg-brand-50 px-3 py-2 rounded-md italic">"{b.specialRequests}"</div>
                      )}
                    </div>

                    <div className="bg-brand-50 p-6 flex flex-col justify-between">
                      <div>
                        <div className="text-xs text-brand-600 uppercase tracking-wider">Total Amount</div>
                        <div className="font-serif text-3xl text-brand-900 mt-1">₱{b.total.toLocaleString()}</div>
                        <div className="text-xs text-brand-600 mt-1">Subtotal ₱{b.subtotal.toLocaleString()} + Tax ₱{b.tax.toLocaleString()}</div>
                      </div>
                      <button onClick={() => setReceipt(b)} className="mt-4 px-3 py-2 bg-white border border-brand-200 rounded-md text-xs hover:bg-brand-100 flex items-center justify-center gap-1">
                        <Receipt className="w-3 h-3" /> View Receipt
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* NEW BOOKING - ROOM SELECTION */}
      {view === "new" && (
        <div className="space-y-6">
          {/* Dates */}
          <div className="bg-white rounded-xl border border-brand-100 p-6">
            <h3 className="font-serif text-xl text-brand-900 mb-4">When are you staying?</h3>
            <div className="grid md:grid-cols-4 gap-4">
              <label className="text-xs uppercase tracking-wider text-brand-700">Check-in
                <input type="date" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} className="mt-1 w-full px-3 py-2.5 border border-brand-200 rounded-md" />
              </label>
              <label className="text-xs uppercase tracking-wider text-brand-700">Check-out
                <input type="date" value={checkOut} onChange={(e) => setCheckOut(e.target.value)} className="mt-1 w-full px-3 py-2.5 border border-brand-200 rounded-md" />
              </label>
              <label className="text-xs uppercase tracking-wider text-brand-700">Adults
                <select value={adults} onChange={(e) => setAdults(+e.target.value)} className="mt-1 w-full px-3 py-2.5 border border-brand-200 rounded-md bg-white">
                  {[1,2,3,4,5,6].map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
              </label>
              <label className="text-xs uppercase tracking-wider text-brand-700">Children
                <select value={children} onChange={(e) => setChildren(+e.target.value)} className="mt-1 w-full px-3 py-2.5 border border-brand-200 rounded-md bg-white">
                  {[0,1,2,3,4].map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
              </label>
            </div>
            <div className="mt-3 text-xs text-brand-600">{nights} {nights === 1 ? "night" : "nights"} · {adults + children} guests</div>
          </div>

          {/* Room categories */}
          <div className="bg-white rounded-xl border border-brand-100 p-6">
            <h3 className="font-serif text-xl text-brand-900 mb-1">Choose your room category</h3>
            <p className="text-xs text-brand-600 mb-4">
              {nights} {nights === 1 ? "night" : "nights"} · {adults + children} guests
              {availableRooms.length > 0 && ` · ${availableRooms.length} room${availableRooms.length > 1 ? "s" : ""} available`}
            </p>
            <div className="grid md:grid-cols-2 gap-4">
              {roomTypes.map(({ type, available, sample }) => {
                const isSelected = selectedRoom?.type === type;
                const canFit = sample.capacity >= adults + children;
                return (
                  <button
                    key={type}
                    disabled={!available || !canFit}
                    onClick={() => {
                      if (available) {
                        const room = availableRooms.find((r) => r.type === type) ?? sample;
                        setSelectedRoom(room);
                      }
                    }}
                    className={`text-left bg-cream-50 rounded-lg overflow-hidden border-2 transition relative
                      ${isSelected ? "border-brand-700 shadow-lg" : "border-transparent hover:border-brand-300"}
                      ${(!available || !canFit) ? "opacity-60 cursor-not-allowed" : ""}`}
                  >
                    <div className="aspect-video relative">
                      <img
                        src={TYPE_IMAGES[type] || TYPE_IMAGES["Standard Room"]}
                        alt={type}
                        className="w-full h-full object-cover"
                      />
                      {!available && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <span className="text-white text-sm font-medium uppercase tracking-wider bg-rose-600 px-3 py-1 rounded-full">
                            Unavailable
                          </span>
                        </div>
                      )}
                      {isSelected && available && (
                        <div className="absolute top-2 right-2 bg-emerald-600 text-white rounded-full w-7 h-7 flex items-center justify-center">
                          <Check className="w-4 h-4" />
                        </div>
                      )}
                      {!canFit && available && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white text-sm">Not enough capacity</div>
                      )}
                    </div>
                    <div className="p-4">
                      <div className="flex items-baseline justify-between mb-2">
                        <div className="font-serif text-xl text-brand-900">{type}</div>
                        <div className="text-right">
                          <div className="font-serif text-lg text-brand-900">₱{sample.baseRate.toLocaleString()}</div>
                          <div className="text-[10px] text-brand-500">per night</div>
                        </div>
                      </div>
                      <div className="text-xs text-brand-600 mb-2 flex items-center gap-1">
                        <Users className="w-3 h-3" /> Up to {sample.capacity} guests
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {(sample.amenities as string[]).slice(0, 4).map((a) => (
                          <span key={a} className="text-[10px] px-2 py-0.5 bg-white text-brand-700 rounded-full">{a}</span>
                        ))}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {selectedRoom && (
            <div className="flex justify-end">
              <button onClick={() => setView("addons")} className="px-6 py-3 bg-brand-800 text-cream-50 rounded-md hover:bg-brand-900 flex items-center gap-2">
                Continue to Add-ons <Plus className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* ADDONS & CONFIRM */}
      {view === "addons" && selectedRoom && (
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl border border-brand-100 p-6">
              <h3 className="font-serif text-xl text-brand-900 mb-1">Enhance your stay with add-ons</h3>
              <p className="text-xs text-brand-600 mb-4">Make your visit even more special — pick what you'd like included.</p>
              <div className="grid md:grid-cols-2 gap-3">
                {ADDONS.map((a) => {
                  const selected = bookingAddons.find((x) => x.id === a.id);
                  return (
                    <div key={a.id} className={`border rounded-lg p-4 transition ${selected ? "border-brand-700 bg-brand-50" : "border-brand-100 hover:border-brand-300"}`}>
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-lg ${selected ? "bg-brand-700 text-white" : "bg-brand-100 text-brand-700"} flex items-center justify-center flex-shrink-0`}>{a.icon}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="font-medium text-brand-900 text-sm">{a.name}</div>
                              <div className="text-xs text-brand-600 mt-0.5">{a.description}</div>
                            </div>
                            <div className="text-sm font-medium text-brand-900 flex-shrink-0">₱{a.price.toLocaleString()}</div>
                          </div>
                          <div className="mt-3 flex items-center gap-2">
                            {selected ? (
                              <>
                                <div className="flex items-center gap-1">
                                  <button onClick={() => updateAddonQty(a.id, -1)} className="w-7 h-7 rounded-full bg-white border border-brand-200 hover:bg-brand-100 flex items-center justify-center text-xs">−</button>
                                  <span className="w-7 text-center text-sm font-medium">{selected.quantity}</span>
                                  <button onClick={() => updateAddonQty(a.id, 1)} className="w-7 h-7 rounded-full bg-white border border-brand-200 hover:bg-brand-100 flex items-center justify-center text-xs">+</button>
                                </div>
                                <button onClick={() => toggleAddon(a)} className="ml-auto text-xs text-red-600 hover:text-red-700 flex items-center gap-0.5"><X className="w-3 h-3" /> Remove</button>
                              </>
                            ) : (
                              <button onClick={() => toggleAddon(a)} className="px-3 py-1.5 bg-brand-800 text-cream-50 rounded-md text-xs hover:bg-brand-900 flex items-center gap-1">
                                <Plus className="w-3 h-3" /> Add
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-brand-100 p-6">
              <h3 className="font-serif text-xl text-brand-900 mb-1">Special Requests</h3>
              <p className="text-xs text-brand-600 mb-4">Any preferences, allergies, or celebration notes? We'll do our best.</p>
              <textarea
                value={specialRequests}
                onChange={(e) => setSpecialRequests(e.target.value)}
                rows={3}
                placeholder="e.g. Early check-in, extra pillows, ground floor preferred..."
                className="w-full px-3 py-2 border border-brand-200 rounded-md resize-none"
              />
            </div>
          </div>

          {/* SUMMARY */}
          <div className="bg-white rounded-xl border border-brand-100 p-6 h-fit lg:sticky lg:top-24">
            <h3 className="font-serif text-xl text-brand-900 mb-4">Booking Summary</h3>

            <div className="pb-4 border-b border-brand-100">
              <div className="flex items-start gap-3 mb-2">
                <Bed className="w-4 h-4 text-brand-600 mt-1 flex-shrink-0" />
                <div>
                  <div className="font-medium text-brand-900 text-sm">{selectedRoom.type}</div>
                  <div className="text-xs text-brand-600">{checkIn} → {checkOut} · {nights} nights</div>
                </div>
              </div>
              <div className="text-xs text-brand-600">{adults} adults{children ? ` · ${children} children` : ""}</div>
            </div>

            <div className="py-3 space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-brand-700">Room ({nights} nights × ₱{selectedRoom.baseRate})</span>
                <span className="text-brand-900">₱{roomTotal.toLocaleString()}</span>
              </div>
              {bookingAddons.length > 0 && (
                <>
                  <div className="text-xs text-brand-600 mt-2">Add-ons:</div>
                  {bookingAddons.map((a) => (
                    <div key={a.id} className="flex justify-between text-xs text-brand-700 pl-2">
                      <span className="truncate pr-2">{a.quantity}× {a.name}</span>
                      <span>₱{(a.price * a.quantity).toLocaleString()}</span>
                    </div>
                  ))}
                </>
              )}
            </div>

            <div className="border-t border-brand-100 pt-3 space-y-1 text-sm">
              <div className="flex justify-between text-brand-700">
                <span>Subtotal</span>
                <span>₱{subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-brand-700">
                <span>Tax ({(TAX_RATE * 100).toFixed(0)}%)</span>
                <span>₱{tax.toLocaleString()}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-brand-100">
                <span className="font-medium">Total</span>
                <span className="font-serif text-2xl text-brand-900">₱{total.toLocaleString()}</span>
              </div>
            </div>

            <button onClick={confirmBooking} className="w-full mt-4 py-3 bg-brand-800 text-cream-50 rounded-md hover:bg-brand-900 transition font-medium">
              Confirm Booking
            </button>
            <p className="text-[10px] text-brand-500 text-center mt-2">You will earn ~{Math.floor(total / 100)} loyalty points</p>
          </div>
        </div>
      )}

      {/* EDIT MODAL (request modification) */}
      {editing && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setEditing(null)}>
          <div className="bg-white rounded-xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start gap-3 mb-4">
              <AlertCircle className="w-5 h-5 text-amber-600 mt-1" />
              <div>
                <h3 className="font-serif text-xl text-brand-900">Modify Booking</h3>
                <p className="text-sm text-brand-600 mt-1">Submit a modification request — our team will confirm changes by email within 24 hours.</p>
              </div>
            </div>
            <textarea rows={4} placeholder="What would you like to change? (dates, room type, guests, add-ons...)" className="w-full px-3 py-2 border border-brand-200 rounded-md mb-3 resize-none" />
            <div className="flex gap-2 justify-end">
              <button onClick={() => setEditing(null)} className="px-4 py-2 border border-brand-200 rounded-md text-sm hover:bg-brand-50">Cancel</button>
              <button onClick={() => { alert("Modification request sent! We'll be in touch soon."); setEditing(null); }} className="px-4 py-2 bg-brand-800 text-cream-50 rounded-md text-sm hover:bg-brand-900">Submit Request</button>
            </div>
          </div>
        </div>
      )}

      {/* RECEIPT MODAL */}
      {receipt && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 print:bg-white print:p-0" onClick={() => setReceipt(null)}>
          <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto print:rounded-none print:max-w-full print:shadow-none" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-brand-100 flex items-start justify-between print:hidden">
              <div>
                <div className="text-xs uppercase tracking-wider text-gold-500">Official Receipt</div>
                <h3 className="font-serif text-2xl text-brand-900">{receipt.id}</h3>
              </div>
              <button onClick={() => setReceipt(null)} className="text-brand-600 hover:text-brand-900 text-2xl leading-none">×</button>
            </div>
            <div className="p-6" id="guest-receipt-print">
              <div className="text-center mb-4">
                <div className="font-serif text-xl text-brand-900">{property.name}</div>
                <div className="text-xs text-brand-500">Booking Receipt · {receipt.createdAt}</div>
              </div>
              <div className="space-y-2 text-sm border-t border-b border-brand-100 py-4">
                <div className="flex justify-between"><span className="text-brand-600">Guest</span><span className="font-medium">{guestUser?.name}</span></div>
                <div className="flex justify-between"><span className="text-brand-600">Room Type</span><span>{receipt.roomType}</span></div>
                <div className="flex justify-between"><span className="text-brand-600">Room #</span><span>{receipt.roomNumber || "TBA"}</span></div>
                <div className="flex justify-between"><span className="text-brand-600">Check-in</span><span>{receipt.checkIn}</span></div>
                <div className="flex justify-between"><span className="text-brand-600">Check-out</span><span>{receipt.checkOut}</span></div>
                <div className="flex justify-between"><span className="text-brand-600">Nights</span><span>{receipt.nights}</span></div>
                <div className="flex justify-between"><span className="text-brand-600">Guests</span><span>{receipt.adults}A {receipt.children}C</span></div>
                <div className="flex justify-between"><span className="text-brand-600">Status</span><span className="font-medium">{receipt.status}</span></div>
                <div className="flex justify-between"><span className="text-brand-600">Payment</span><span className="font-medium">{receipt.paymentStatus}</span></div>
              </div>
              {receipt.addons.length > 0 && (
                <div className="py-3 border-b border-brand-100 text-sm">
                  <div className="text-xs uppercase text-brand-500 mb-2">Add-ons</div>
                  {receipt.addons.map((a) => (
                    <div key={a.id} className="flex justify-between"><span>{a.quantity}× {a.name}</span><span>₱{(a.price * a.quantity).toLocaleString()}</span></div>
                  ))}
                </div>
              )}
              <div className="pt-4 space-y-1 text-sm">
                <div className="flex justify-between"><span className="text-brand-600">Room ({receipt.nights} nights × ₱{receipt.roomRate.toLocaleString()})</span><span>₱{(receipt.roomRate * receipt.nights).toLocaleString()}</span></div>
                <div className="flex justify-between"><span className="text-brand-600">Subtotal</span><span>₱{receipt.subtotal.toLocaleString()}</span></div>
                <div className="flex justify-between"><span className="text-brand-600">Tax</span><span>₱{receipt.tax.toLocaleString()}</span></div>
                <div className="flex justify-between text-base pt-2 border-t border-brand-100 mt-2">
                  <span className="font-medium">Total</span><span className="font-serif text-xl">₱{receipt.total.toLocaleString()}</span>
                </div>
              </div>
              <div className="mt-6 text-center text-xs text-brand-500">
                Thank you for staying with us · Generated {new Date().toLocaleString()}
              </div>
            </div>
            <div className="p-4 border-t border-brand-100 flex gap-2 print:hidden">
              <button onClick={() => { window.print(); addToast("info", "Printing receipt", receipt.id); }} className="flex-1 py-2.5 bg-brand-800 text-cream-50 rounded-md text-sm hover:bg-brand-900 flex items-center justify-center gap-1">
                <Receipt className="w-4 h-4" /> Print Receipt
              </button>
              <button onClick={() => setReceipt(null)} className="flex-1 py-2.5 border border-brand-200 rounded-md text-sm hover:bg-brand-50">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
