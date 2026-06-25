import { useEffect, useRef, useState } from "react";
import { useApp } from "../context/AppContext";
import { useToast } from "../components/ToastProvider";
import type { Room, Reservation, RoomStatus } from "../data/mockData";
import { supabase } from "@/integrations/supabase/client";
import {
  Bed,
  Sparkles,
  CheckCircle2,
  DoorClosed,
  Search,
  Filter,
  Plus,
  ArrowRight,
  Receipt,
  Coffee,
  Shuffle,
  Check,
  X,
  AlertTriangle,
  Shield,
  Bell as BellIcon,
} from "lucide-react";

const fmtPHP = (n: number) =>
  new Intl.NumberFormat("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(
    Number(n) || 0,
  );

const isRoomAvailableForDates = (
  room: Room,
  checkIn: string,
  checkOut: string,
  reservations: Reservation[],
  excludeId?: string,
): { ok: boolean; conflict?: Reservation } => {
  if (room.status === "maintenance") return { ok: false };
  if (room.status === "occupied" && checkIn <= new Date().toISOString().slice(0, 10))
    return { ok: false };
  const activeStatuses: Reservation["status"][] = ["confirmed", "checked-in"];
  const conflict = reservations.find(
    (r) =>
      r.id !== excludeId &&
      r.roomId === room.id &&
      activeStatuses.includes(r.status) &&
      checkIn < r.checkOut &&
      checkOut > r.checkIn,
  );
  if (conflict) return { ok: false, conflict };
  return { ok: true };
};

const getRoomSchedule = (roomId: string, from: string, to: string, reservations: Reservation[]) =>
  reservations.filter(
    (r) =>
      r.roomId === roomId &&
      (r.status === "confirmed" || r.status === "checked-in") &&
      r.checkIn < to &&
      r.checkOut > from,
  );

const statusStyle: Record<RoomStatus, { bg: string; text: string; label: string }> = {
  available: { bg: "bg-emerald-100", text: "text-emerald-800", label: "Available" },
  occupied: { bg: "bg-brand-900", text: "text-cream-50", label: "Occupied" },
  dirty: { bg: "bg-amber-100", text: "text-amber-800", label: "Makeup Room" },
  reserved: { bg: "bg-yellow-100", text: "text-yellow-800", label: "Reserved" },
  maintenance: { bg: "bg-slate-200", text: "text-slate-700", label: "Maintenance" },
};

export default function FrontDesk() {
  const {
    rooms,
    reservations,
    checkIn,
    checkOut,
    setRoomStatus,
    updateReservation,
    addReservation,
    guestRequests,
    updateRequestStatus,
    assignRoomToRequest,
    emergencyAlerts,
    acknowledgeEmergency,
    property,
  } = useApp();
  const { addToast } = useToast();
  const prevRequestCount = useRef(guestRequests.length);
  const prevEmergencyCount = useRef(emergencyAlerts.length);

  // Live buzz popup — fires toast when a new request or emergency arrives
  useEffect(() => {
    if (guestRequests.length > prevRequestCount.current) {
      const newest = guestRequests[0];
      if (newest) {
        const isRC = newest.type === "Room Change";
        addToast(
          newest.priority === "Urgent" ? "warning" : "info",
          `${isRC ? "🔄" : "🔔"} New ${newest.type} — Room ${newest.roomNumber}`,
          `${newest.title}: ${newest.details.slice(0, 80)}`,
        );
      }
    }
    prevRequestCount.current = guestRequests.length;
  }, [guestRequests.length, guestRequests, addToast]);

  useEffect(() => {
    if (emergencyAlerts.length > prevEmergencyCount.current) {
      const newest = emergencyAlerts[0];
      if (newest) {
        addToast(
          "emergency",
          `🚨 EMERGENCY — Room ${newest.roomNumber}`,
          `${newest.guestName}: ${newest.message}`,
        );
      }
    }
    prevEmergencyCount.current = emergencyAlerts.length;
  }, [emergencyAlerts.length, emergencyAlerts, addToast]);

  // (addReservation pulled from useApp above)
  const [filter, setFilter] = useState<RoomStatus | "all">("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [folioOpen, setFolioOpen] = useState(false);
  const [roomChangeOpen, setRoomChangeOpen] = useState(false);
  const [roomChangeReason, setRoomChangeReason] = useState("Guest Request");
  const [roomChangeOther, setRoomChangeOther] = useState("");
  const [targetRoomId, setTargetRoomId] = useState("");

  // New Reservation / Walk-in modals
  const today = new Date().toISOString().slice(0, 10);
  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  const [newResOpen, setNewResOpen] = useState(false);
  const [walkInOpen, setWalkInOpen] = useState(false);
  const [topChangeOpen, setTopChangeOpen] = useState(false);
  const [resForm, setResForm] = useState({
    guestName: "",
    roomId: "",
    checkIn: today,
    checkOut: tomorrow,
    adults: 1,
    children: 0,
    rateCode: "BAR",
    notes: "",
  });
  const [walkForm, setWalkForm] = useState({
    guestName: "",
    roomId: "",
    nights: 1,
    adults: 1,
    children: 0,
    notes: "",
  });
  const [topChangeResId, setTopChangeResId] = useState("");
  const [topChangeRoomId, setTopChangeRoomId] = useState("");

  // Folio: extra charges + add charge modal
  type FolioCharge = { d: string; desc: string; amt: number; room: string };
  const [extraCharges, setExtraCharges] = useState<FolioCharge[]>([]);
  const [addChargeOpen, setAddChargeOpen] = useState(false);
  const [chargeForm, setChargeForm] = useState({ d: "Today", desc: "", amt: "" });
  type FoodProd = { id: string; name: string; price: number; category: string };
  const [foodProducts, setFoodProducts] = useState<FoodProd[]>([]);
  const [selectedFoodId, setSelectedFoodId] = useState("");

  useEffect(() => {
    if (!addChargeOpen) return;
    supabase
      .from("food_products")
      .select("id,name,price,category")
      .eq("available", true)
      .order("name")
      .then(({ data }) => setFoodProducts((data as FoodProd[]) || []));
  }, [addChargeOpen]);

  const printFolio = () => {
    const node = document.getElementById("folio-print-area");
    if (!node) {
      window.print();
      return;
    }
    const w = window.open("", "_blank", "width=800,height=900");
    if (!w) {
      addToast("error", "Popup blocked", "Allow popups to print the folio.");
      return;
    }
    w.document.write(`<!doctype html><html><head><title>Guest Folio</title>
      <style>body{font-family:system-ui,sans-serif;padding:24px;color:#1f2937}
      table{width:100%;border-collapse:collapse;margin-top:12px}
      th,td{padding:6px 4px;text-align:left;border-bottom:1px solid #e5e7eb;font-size:13px}
      th{font-size:11px;text-transform:uppercase;color:#6b7280}
      .right{text-align:right}.muted{color:#6b7280;font-size:12px}.total{font-size:18px;font-weight:600}
      </style></head><body>${node.innerHTML}</body></html>`);
    w.document.close();
    setTimeout(() => {
      w.focus();
      w.print();
    }, 250);
  };

  const availableForBooking = rooms.filter((r) => r.status === "available");
  const activeReservations = reservations.filter(
    (r) => r.status === "confirmed" || r.status === "checked-in",
  );

  const handleCreateReservation = async (autoCheckIn = false) => {
    const f = autoCheckIn ? walkForm : resForm;
    if (!f.guestName.trim() || !f.roomId) {
      addToast("error", "Missing info", "Guest name and room are required.");
      return;
    }
    const room = rooms.find((r) => r.id === f.roomId);
    if (!room) return;
    const ci = autoCheckIn ? today : (f as typeof resForm).checkIn;
    const co = autoCheckIn
      ? new Date(Date.now() + walkForm.nights * 86400000).toISOString().slice(0, 10)
      : (f as typeof resForm).checkOut;
    const nights = Math.max(
      1,
      Math.round((new Date(co).getTime() - new Date(ci).getTime()) / 86400000),
    );
    const id = `RES-${Date.now().toString().slice(-6)}`;
    const res = await addReservation({
      id,
      guestName: f.guestName.trim(),
      guestId: `G-${Date.now().toString().slice(-5)}`,
      roomId: f.roomId,
      checkIn: ci,
      checkOut: co,
      rateCode: autoCheckIn ? "WALKIN" : (f as typeof resForm).rateCode,
      totalAmount: room.baseRate * nights,
      deposit: 0,
      status: "confirmed",
      source: autoCheckIn ? "Walk-in" : "Phone",
      adults: f.adults,
      children: f.children,
      notes: f.notes || undefined,
    });
    if (!res.ok) {
      addToast("error", "Could not create reservation", res.error || "Unknown error");
      return;
    }
    if (autoCheckIn) {
      await checkIn(id);
      addToast("success", "Walk-in checked in", `${f.guestName} → Room ${room.number}`);
      setWalkInOpen(false);
      setWalkForm({ guestName: "", roomId: "", nights: 1, adults: 1, children: 0, notes: "" });
    } else {
      addToast("success", "Reservation created", `${f.guestName} · ${room.number} · ${ci} → ${co}`);
      setNewResOpen(false);
      setResForm({
        guestName: "",
        roomId: "",
        checkIn: today,
        checkOut: tomorrow,
        adults: 1,
        children: 0,
        rateCode: "BAR",
        notes: "",
      });
    }
    setSelected(room.id);
  };

  const submitTopChange = () => {
    const res = reservations.find((r) => r.id === topChangeResId);
    const target = rooms.find((r) => r.id === topChangeRoomId);
    const from = res ? rooms.find((r) => r.id === res.roomId) : null;
    if (!res || !target || !from) return;
    updateReservation(res.id, {
      roomId: target.id,
      notes: res.notes ? `${res.notes} | Room Change (Front Desk)` : "Room Change (Front Desk)",
    });
    if (res.status === "checked-in") {
      setRoomStatus(from.id, "dirty");
      setRoomStatus(target.id, "occupied");
    } else {
      setRoomStatus(from.id, "available");
      setRoomStatus(target.id, "reserved");
    }
    addToast(
      "success",
      "Room changed",
      `${res.guestName}: Room ${from.number} → Room ${target.number}`,
    );
    setTopChangeOpen(false);
    setTopChangeResId("");
    setTopChangeRoomId("");
  };

  const filtered = rooms.filter(
    (r) =>
      (filter === "all" || r.status === filter) &&
      (r.number.includes(search) || r.type.toLowerCase().includes(search.toLowerCase())),
  );

  const selectedRoom = rooms.find((r) => r.id === selected);
  const selectedReservation = reservations.find(
    (r) => r.roomId === selected && (r.status === "checked-in" || r.status === "confirmed"),
  );
  const roomChangeOptions = rooms.filter((r) => r.id !== selected && r.status === "available");

  // Folio computations
  const baseFolioLines = selectedRoom
    ? [
        { d: "Day 1", desc: "Room charge — " + selectedRoom.type, amt: selectedRoom.baseRate },
        { d: "Day 1", desc: "Welcome amenity (comp)", amt: 0 },
        { d: "Day 2", desc: "Room charge — " + selectedRoom.type, amt: selectedRoom.baseRate },
      ]
    : [];
  const folioLines = [
    ...baseFolioLines,
    ...extraCharges
      .filter((c) => c.room === selected)
      .map(({ d, desc, amt }) => ({ d, desc, amt })),
  ];
  const folioSubtotal = folioLines.reduce((s, l) => s + l.amt, 0);
  const folioTax = folioSubtotal * 0.12;
  const folioTotal = folioSubtotal + folioTax;

  const submitRoomChange = () => {
    if (!selectedReservation || !selectedRoom || !targetRoomId) return;
    const targetRoom = rooms.find((r) => r.id === targetRoomId);
    if (!targetRoom) return;

    const reasonNote =
      roomChangeReason === "Other Concern"
        ? `Room Change: Other Concern${roomChangeOther ? ` — ${roomChangeOther}` : ""}`
        : `Room Change: ${roomChangeReason}`;

    updateReservation(selectedReservation.id, {
      roomId: targetRoom.id,
      notes: selectedReservation.notes
        ? `${selectedReservation.notes} | ${reasonNote}`
        : reasonNote,
    });

    if (selectedReservation.status === "checked-in") {
      setRoomStatus(selectedRoom.id, "dirty");
      setRoomStatus(targetRoom.id, "occupied");
    } else {
      setRoomStatus(selectedRoom.id, "available");
      setRoomStatus(targetRoom.id, "reserved");
    }

    addToast(
      "success",
      "Room changed",
      `${selectedReservation.guestName}: Room ${selectedRoom.number} → Room ${targetRoom.number}`,
    );
    setSelected(targetRoom.id);
    setRoomChangeOpen(false);
    setRoomChangeReason("Guest Request");
    setRoomChangeOther("");
    setTargetRoomId("");
  };

  const counts = {
    all: rooms.length,
    available: rooms.filter((r) => r.status === "available").length,
    occupied: rooms.filter((r) => r.status === "occupied").length,
    reserved: rooms.filter((r) => r.status === "reserved").length,
    dirty: rooms.filter((r) => r.status === "dirty").length,
    maintenance: rooms.filter((r) => r.status === "maintenance").length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="text-xs uppercase tracking-[0.25em] text-gold-500 font-medium mb-1">
            Front Desk
          </div>
          <h1 className="font-serif text-4xl text-brand-900">Rooms & Check-in/out</h1>
          <p className="text-brand-700 mt-1">
            Live inventory, express check-in/out, and housekeeping sync.
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setTopChangeOpen(true)}
            className="px-4 py-2 bg-white border border-rose-300 text-rose-700 rounded-md text-sm hover:bg-rose-50 flex items-center gap-2"
          >
            <Shuffle className="w-4 h-4" /> Change Room
          </button>
          <button
            onClick={() => setWalkInOpen(true)}
            className="px-4 py-2 bg-white border border-brand-200 rounded-md text-sm hover:bg-brand-50 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Walk-in Sale
          </button>
          <button
            onClick={() => setNewResOpen(true)}
            className="px-4 py-2 bg-brand-800 text-cream-50 rounded-md text-sm hover:bg-brand-900 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> New Reservation
          </button>
        </div>
      </div>

      {/* STATUS LEGEND */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        {(Object.keys(counts) as Array<keyof typeof counts>).map((key) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`p-3 rounded-lg border transition text-left ${filter === key ? "border-brand-600 bg-brand-50" : "border-brand-100 bg-white hover:border-brand-300"}`}
          >
            <div className="text-xs uppercase tracking-wider text-brand-600 capitalize">{key}</div>
            <div className="font-serif text-2xl text-brand-900">{counts[key]}</div>
          </button>
        ))}
      </div>

      {/* SEARCH */}
      <div className="flex gap-3 items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-brand-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by room number or type..."
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-brand-200 rounded-md bg-white focus:outline-none focus:border-brand-500"
          />
        </div>
        <button className="px-3 py-2.5 border border-brand-200 rounded-md text-sm bg-white hover:bg-brand-50 flex items-center gap-2">
          <Filter className="w-4 h-4" /> Filter
        </button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* ROOM GRID */}
        <div className="lg:col-span-2 grid grid-cols-4 md:grid-cols-6 gap-3">
          {filtered.map((room) => {
            const st = statusStyle[room.status];
            const isSelected = selected === room.id;
            const hasPendingReservation = reservations.some(
              (r) => r.roomId === room.id && r.status === "confirmed",
            );
            return (
              <button
                key={room.id}
                onClick={() => setSelected(room.id)}
                className={`relative aspect-square rounded-lg p-2 text-left transition border-2 ${isSelected ? "border-brand-700 scale-[1.02] shadow-lg" : "border-transparent hover:border-brand-300"} ${st.bg}`}
              >
                <div className={`font-mono font-bold text-sm ${st.text}`}>{room.number}</div>
                <div className={`text-[10px] mt-1 ${st.text} opacity-80 leading-tight`}>
                  {room.type}
                </div>
                {hasPendingReservation && room.status !== "occupied" && (
                  <span className="absolute top-1 right-1 text-[8px] font-bold px-1.5 py-0.5 rounded bg-blue-600 text-white tracking-wider shadow">
                    RES
                  </span>
                )}
                <div
                  className={`absolute bottom-2 left-2 right-2 text-[9px] uppercase tracking-wider ${st.text} opacity-70`}
                >
                  ₱{room.baseRate}
                </div>
              </button>
            );
          })}
        </div>

        {/* ROOM DETAILS */}
        <div className="bg-white rounded-xl border border-brand-100 p-6 h-fit">
          {selectedRoom ? (
            <>
              <img
                src={selectedRoom.image}
                alt={selectedRoom.type}
                className="w-full aspect-video object-cover rounded-md mb-4"
              />
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="font-serif text-2xl text-brand-900">
                    Room {selectedRoom.number}
                  </div>
                  <div className="text-sm text-brand-600">
                    {selectedRoom.type} · Floor {selectedRoom.floor}
                  </div>
                </div>
                <span
                  className={`text-xs px-2 py-1 rounded-full ${statusStyle[selectedRoom.status].bg} ${statusStyle[selectedRoom.status].text}`}
                >
                  {statusStyle[selectedRoom.status].label}
                </span>
              </div>
              <div className="font-serif text-xl text-brand-900 mb-3">
                ₱{selectedRoom.baseRate}
                <span className="text-sm text-brand-600 font-sans"> / night</span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm text-brand-700 mb-4">
                <div>
                  <Bed className="inline w-4 h-4 mr-1" />
                  {selectedRoom.beds}
                </div>
                <div>👥 Up to {selectedRoom.capacity}</div>
              </div>
              <div className="flex flex-wrap gap-1 mb-5">
                {selectedRoom.amenities.map((a) => (
                  <span
                    key={a}
                    className="text-xs px-2 py-1 bg-brand-50 text-brand-700 rounded-full"
                  >
                    {a}
                  </span>
                ))}
              </div>

              {selectedReservation && (
                <div className="border-t border-brand-100 pt-4 mb-4">
                  <div className="text-xs uppercase tracking-wider text-brand-600 mb-2">
                    Current Guest
                  </div>
                  <div className="font-medium text-brand-900">{selectedReservation.guestName}</div>
                  <div className="text-xs text-brand-600">
                    {selectedReservation.id} · {selectedReservation.rateCode}
                  </div>
                  <div className="text-xs text-brand-600">
                    {selectedReservation.checkIn} → {selectedReservation.checkOut}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                {selectedReservation?.status === "confirmed" && (
                  <button
                    onClick={() => {
                      checkIn(selectedReservation.id);
                      addToast(
                        "success",
                        "Guest checked in",
                        `${selectedReservation.guestName} → Room ${selectedRoom.number}`,
                      );
                    }}
                    className="w-full py-2.5 bg-brand-700 text-cream-50 rounded-md hover:bg-brand-800 flex items-center justify-center gap-2 text-sm"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Check-In Guest
                  </button>
                )}
                {selectedReservation?.status === "checked-in" && (
                  <button
                    onClick={() => {
                      checkOut(selectedReservation.id);
                      addToast(
                        "success",
                        "Guest checked out",
                        `${selectedReservation.guestName} — Room ${selectedRoom.number} → Makeup Room`,
                      );
                    }}
                    className="w-full py-2.5 bg-brand-700 text-cream-50 rounded-md hover:bg-brand-800 flex items-center justify-center gap-2 text-sm"
                  >
                    <ArrowRight className="w-4 h-4" /> Process Check-Out
                  </button>
                )}
                {selectedRoom.status === "dirty" && (
                  <button
                    onClick={() => setRoomStatus(selectedRoom.id, "available")}
                    className="w-full py-2.5 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 flex items-center justify-center gap-2 text-sm"
                  >
                    <Sparkles className="w-4 h-4" /> Mark Clean & Available
                  </button>
                )}
                {selectedReservation && roomChangeOptions.length > 0 && (
                  <button
                    onClick={() => setRoomChangeOpen(true)}
                    className="w-full py-2.5 bg-rose-600 text-white rounded-md hover:bg-rose-700 flex items-center justify-center gap-2 text-sm"
                  >
                    <Shuffle className="w-4 h-4" /> Room Change
                  </button>
                )}
                <button
                  onClick={() => setFolioOpen(true)}
                  className="w-full py-2.5 border border-brand-200 rounded-md hover:bg-brand-50 flex items-center justify-center gap-2 text-sm"
                >
                  <Receipt className="w-4 h-4" /> View Folio
                </button>
              </div>

              <div className="mt-4 pt-4 border-t border-brand-100">
                <div className="text-xs uppercase tracking-wider text-brand-600 mb-2">
                  Quick Status
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {(["available", "occupied", "dirty", "maintenance"] as RoomStatus[]).map((s) => (
                    <button
                      key={s}
                      onClick={() => setRoomStatus(selectedRoom.id, s)}
                      className={`text-xs px-2 py-1.5 rounded ${selectedRoom.status === s ? statusStyle[s].bg + " " + statusStyle[s].text + " font-medium" : "bg-brand-50 text-brand-700 hover:bg-brand-100"}`}
                    >
                      {statusStyle[s].label}
                    </button>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-brand-500">
              <DoorClosed className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p className="text-sm">Select a room to view details</p>
            </div>
          )}
        </div>
      </div>

      {/* HOUSEKEEPING QUEUE */}
      <div className="bg-white rounded-xl border border-brand-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-serif text-xl text-brand-900">Housekeeping Queue</h3>
            <div className="text-xs text-brand-600">Auto-synced from check-outs</div>
          </div>
          <button className="text-xs text-brand-600 hover:text-brand-900">Manage →</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-brand-600 uppercase tracking-wider border-b border-brand-100">
                <th className="text-left pb-2 font-medium">Room</th>
                <th className="text-left pb-2 font-medium">Task</th>
                <th className="text-left pb-2 font-medium">Priority</th>
                <th className="text-left pb-2 font-medium">Assigned</th>
                <th className="text-left pb-2 font-medium">ETA</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rooms
                .filter((r) => r.status === "dirty")
                .slice(0, 5)
                .map((r, i) => (
                  <tr key={r.id} className="border-b border-brand-50 last:border-0">
                    <td className="py-3 font-medium">{r.number}</td>
                    <td className="py-3 text-brand-700">
                      {i === 0 ? "Deep clean + turndown" : "Standard checkout clean"}
                    </td>
                    <td className="py-3">
                      <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full">
                        {i === 0 ? "High" : "Medium"}
                      </span>
                    </td>
                    <td className="py-3 text-brand-700">
                      {["Maria S.", "Juan P.", "Aisha K.", "Carlos M."][i % 4]}
                    </td>
                    <td className="py-3 text-brand-700">
                      {["1:45 PM", "2:15 PM", "2:30 PM", "3:00 PM"][i % 4]}
                    </td>
                    <td className="py-3">
                      <button
                        onClick={() => setRoomStatus(r.id, "available")}
                        className="text-xs text-brand-600 hover:text-brand-900"
                      >
                        Mark clean
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ============ EMERGENCY ALERTS ============ */}
      {emergencyAlerts.filter((e) => !e.acknowledged).length > 0 && (
        <div className="space-y-3">
          {emergencyAlerts
            .filter((e) => !e.acknowledged)
            .map((alert) => (
              <div
                key={alert.id}
                className="bg-red-600 text-white rounded-xl p-5 flex items-start gap-4 shadow-xl animate-pulse border-2 border-red-400"
              >
                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                  <Shield className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <div className="text-lg font-bold flex items-center gap-2">
                    🚨 EMERGENCY — Room {alert.roomNumber}
                  </div>
                  <div className="text-sm text-red-100 mt-1">
                    <span className="font-medium text-white">Guest:</span> {alert.guestName}
                  </div>
                  <div className="text-sm text-red-100">
                    <span className="font-medium text-white">Message:</span> {alert.message}
                  </div>
                  <div className="text-xs text-red-200 mt-1">{alert.createdAt}</div>
                </div>
                <button
                  onClick={() => {
                    acknowledgeEmergency(alert.id);
                    addToast(
                      "warning",
                      "Emergency acknowledged",
                      `Alert from Room ${alert.roomNumber} has been acknowledged.`,
                    );
                  }}
                  className="px-4 py-2 bg-white text-red-700 rounded-md text-sm font-medium hover:bg-red-50 flex-shrink-0 flex items-center gap-1"
                >
                  <Check className="w-4 h-4" /> Acknowledge
                </button>
              </div>
            ))}
        </div>
      )}

      {/* ============ REQUEST INBOX ============ */}
      {guestRequests.filter((r) => r.status !== "Resolved").length > 0 && (
        <div className="bg-white rounded-xl border border-brand-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <BellIcon className="w-5 h-5 text-brand-600" />
              <div>
                <h3 className="font-serif text-xl text-brand-900">Guest Request Inbox</h3>
                <div className="text-xs text-brand-600">
                  {guestRequests.filter((r) => r.status !== "Resolved").length} open requests
                </div>
              </div>
            </div>
          </div>
          <div className="space-y-3">
            {guestRequests
              .filter((r) => r.status !== "Resolved")
              .map((req) => {
                const isRoomChange = req.type === "Room Change";
                const availableRooms = rooms.filter((r) => r.status === "available");
                return (
                  <div
                    key={req.id}
                    className={`border rounded-lg p-4 ${isRoomChange ? "border-rose-200 bg-rose-50/50" : req.priority === "Urgent" ? "border-red-200 bg-red-50/30" : "border-brand-100"}`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${isRoomChange ? "bg-rose-100 text-rose-700" : req.type === "Maintenance" ? "bg-amber-100 text-amber-700" : req.type === "Housekeeping" ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700"}`}
                      >
                        {isRoomChange ? (
                          <Shuffle className="w-4 h-4" />
                        ) : req.type === "Maintenance" ? (
                          <AlertTriangle className="w-4 h-4" />
                        ) : req.type === "Housekeeping" ? (
                          <Sparkles className="w-4 h-4" />
                        ) : (
                          <BellIcon className="w-4 h-4" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="font-medium text-brand-900 text-sm">{req.title}</span>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider ${isRoomChange ? "bg-rose-100 text-rose-700" : "bg-brand-100 text-brand-700"}`}
                          >
                            {req.type}
                          </span>
                          {req.priority === "Urgent" && (
                            <span className="text-[10px] px-2 py-0.5 bg-red-100 text-red-800 rounded-full">
                              ⚠ Urgent
                            </span>
                          )}
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full ${req.status === "Acknowledged" ? "bg-blue-100 text-blue-800" : req.status === "In Progress" ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-700"}`}
                          >
                            {req.status}
                          </span>
                        </div>
                        <div className="text-xs text-brand-700 mb-1">{req.details}</div>
                        <div className="text-[10px] text-brand-500">
                          Room {req.roomNumber} · {req.createdAt} · {req.id}
                        </div>
                        {req.assignedRoom && (
                          <div className="text-xs text-emerald-700 mt-1">
                            ✓ Assigned: {req.assignedRoom}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col gap-1 flex-shrink-0">
                        {isRoomChange && !req.assignedRoom && availableRooms.length > 0 && (
                          <select
                            defaultValue=""
                            onChange={(e) => {
                              if (e.target.value) {
                                assignRoomToRequest(req.id, e.target.value);
                                addToast(
                                  "success",
                                  "Room assigned",
                                  `Request ${req.id} — assigned to ${rooms.find((r) => r.id === e.target.value)?.number || e.target.value}`,
                                );
                              }
                            }}
                            className="text-xs px-2 py-1.5 border border-brand-200 rounded-md bg-white"
                          >
                            <option value="">Assign room</option>
                            {availableRooms.map((r) => (
                              <option key={r.id} value={r.id}>
                                Room {r.number} · {r.type}
                              </option>
                            ))}
                          </select>
                        )}
                        {req.status === "Pending" && (
                          <button
                            onClick={() => {
                              updateRequestStatus(req.id, "Acknowledged");
                              addToast("info", "Request acknowledged", req.title);
                            }}
                            className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded hover:bg-blue-200"
                          >
                            Acknowledge
                          </button>
                        )}
                        {req.status === "Acknowledged" && (
                          <button
                            onClick={() => {
                              updateRequestStatus(req.id, "In Progress");
                              addToast("info", "In progress", req.title);
                            }}
                            className="text-xs px-2 py-1 bg-amber-100 text-amber-800 rounded hover:bg-amber-200"
                          >
                            Start
                          </button>
                        )}
                        {(req.status === "Acknowledged" || req.status === "In Progress") && (
                          <button
                            onClick={() => {
                              updateRequestStatus(req.id, "Resolved");
                              addToast("success", "Request resolved", req.title);
                            }}
                            className="text-xs px-2 py-1 bg-emerald-100 text-emerald-800 rounded hover:bg-emerald-200"
                          >
                            Resolve
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* ROOM CHANGE MODAL */}
      {roomChangeOpen && selectedRoom && selectedReservation && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          onClick={() => setRoomChangeOpen(false)}
        >
          <div
            className="bg-white rounded-xl max-w-xl w-full max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-brand-100 flex items-center justify-between">
              <div>
                <div className="text-xs uppercase tracking-wider text-gold-500">
                  Front Desk Action
                </div>
                <h3 className="font-serif text-2xl text-brand-900">Room Change</h3>
                <div className="text-xs text-brand-600 mt-1">
                  {selectedReservation.guestName} · Current Room {selectedRoom.number}
                </div>
              </div>
              <button
                onClick={() => setRoomChangeOpen(false)}
                className="text-brand-600 hover:text-brand-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <label className="block">
                <span className="text-xs uppercase tracking-wider text-brand-700">
                  Transfer to Room
                </span>
                <select
                  value={targetRoomId}
                  onChange={(e) => setTargetRoomId(e.target.value)}
                  className="mt-1 w-full px-3 py-2 border border-brand-200 rounded-md bg-white"
                >
                  <option value="">Select available room</option>
                  {roomChangeOptions.map((room) => (
                    <option key={room.id} value={room.id}>
                      Room {room.number} · {room.type} · ₱{room.baseRate}/night
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="text-xs uppercase tracking-wider text-brand-700">Reason</span>
                <select
                  value={roomChangeReason}
                  onChange={(e) => setRoomChangeReason(e.target.value)}
                  className="mt-1 w-full px-3 py-2 border border-brand-200 rounded-md bg-white"
                >
                  <option>Guest Request</option>
                  <option>Maintenance Issue</option>
                  <option>Noise Complaint</option>
                  <option>Upgrade</option>
                  <option>Downgrade</option>
                  <option>Accessibility Need</option>
                  <option>Other Concern</option>
                </select>
              </label>

              {roomChangeReason === "Other Concern" && (
                <label className="block">
                  <span className="text-xs uppercase tracking-wider text-brand-700">
                    Other Concern
                  </span>
                  <textarea
                    value={roomChangeOther}
                    onChange={(e) => setRoomChangeOther(e.target.value)}
                    rows={3}
                    placeholder="Describe the concern for this room change..."
                    className="mt-1 w-full px-3 py-2 border border-brand-200 rounded-md resize-none"
                  />
                </label>
              )}

              <div className="rounded-lg bg-brand-50 p-4 text-sm text-brand-700">
                <div>
                  <span className="font-medium text-brand-900">Guest:</span>{" "}
                  {selectedReservation.guestName}
                </div>
                <div>
                  <span className="font-medium text-brand-900">From:</span> Room{" "}
                  {selectedRoom.number}
                </div>
                <div>
                  <span className="font-medium text-brand-900">Status:</span>{" "}
                  {selectedReservation.status}
                </div>
                <div className="mt-2 text-xs text-brand-600">
                  Checked-in transfers mark the old room as makeup room and the new room occupied.
                  Confirmed transfers release the old room and reserve the new room.
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRoomChangeOpen(false)}
                  className="px-4 py-2 border border-brand-200 rounded-md text-sm hover:bg-brand-50 flex items-center gap-1"
                >
                  <X className="w-4 h-4" /> Cancel
                </button>
                <button
                  type="button"
                  onClick={submitRoomChange}
                  disabled={
                    !targetRoomId ||
                    (roomChangeReason === "Other Concern" && !roomChangeOther.trim())
                  }
                  className="px-4 py-2 bg-rose-600 text-white rounded-md text-sm hover:bg-rose-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
                >
                  <Check className="w-4 h-4" /> Confirm Change
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FOLIO MODAL */}
      {folioOpen && selectedRoom && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          onClick={() => setFolioOpen(false)}
        >
          <div
            className="bg-white rounded-xl max-w-2xl w-full max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-brand-100 flex items-center justify-between print:hidden">
              <div>
                <div className="text-xs uppercase tracking-wider text-gold-500">Guest Folio</div>
                <h3 className="font-serif text-2xl text-brand-900">Room {selectedRoom.number}</h3>
              </div>
              <button
                onClick={() => setFolioOpen(false)}
                className="text-brand-600 hover:text-brand-900"
              >
                ×
              </button>
            </div>
            <div className="p-6" id="folio-print-area">
              <div className="hidden print:block mb-4">
                <div className="font-serif text-2xl text-brand-900">{property.name}</div>
                <div className="text-xs text-brand-600">
                  {property.address}, {property.city} · {property.phone}
                </div>
                <div className="mt-2 font-medium">Guest Folio — Room {selectedRoom.number}</div>
              </div>
              <div className="grid grid-cols-3 gap-4 mb-6 text-sm">
                <div>
                  <div className="text-brand-600 text-xs">Guest</div>
                  <div className="font-medium">{selectedReservation?.guestName || "—"}</div>
                </div>
                <div>
                  <div className="text-brand-600 text-xs">Check-in</div>
                  <div>{selectedReservation?.checkIn || "—"}</div>
                </div>
                <div>
                  <div className="text-brand-600 text-xs">Check-out</div>
                  <div>{selectedReservation?.checkOut || "—"}</div>
                </div>
              </div>
              <table className="w-full text-sm mb-4">
                <thead>
                  <tr className="text-xs text-brand-600 uppercase border-b">
                    <th className="text-left pb-2">Date</th>
                    <th className="text-left pb-2">Description</th>
                    <th className="text-right pb-2">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {folioLines.map((l, i) => (
                    <tr key={i} className="border-b border-brand-50">
                      <td className="py-2 text-brand-600">{l.d}</td>
                      <td className="py-2">{l.desc}</td>
                      <td className="py-2 text-right">₱{fmtPHP(l.amt)}</td>
                    </tr>
                  ))}
                  <tr className="font-medium">
                    <td colSpan={2} className="py-3 text-brand-900">
                      Subtotal
                    </td>
                    <td className="py-3 text-right">₱{fmtPHP(folioSubtotal)}</td>
                  </tr>
                  <tr>
                    <td colSpan={2} className="py-2 text-brand-700">
                      Tax (12%)
                    </td>
                    <td className="py-2 text-right">₱{fmtPHP(folioTax)}</td>
                  </tr>
                  <tr className="font-medium">
                    <td colSpan={2} className="py-3 text-brand-900">
                      Total
                    </td>
                    <td className="py-3 text-right font-serif text-xl text-brand-900">
                      ₱{fmtPHP(folioTotal)}
                    </td>
                  </tr>
                </tbody>
              </table>
              <div className="grid grid-cols-2 gap-2 print:hidden">
                <button
                  onClick={() => setAddChargeOpen(true)}
                  className="py-2 border border-brand-200 rounded-md text-sm flex items-center justify-center gap-2 hover:bg-brand-50"
                >
                  <Coffee className="w-4 h-4" /> Add Charge
                </button>
                <button
                  onClick={printFolio}
                  className="py-2 bg-brand-800 text-cream-50 rounded-md text-sm flex items-center justify-center gap-2 hover:bg-brand-900"
                >
                  <Receipt className="w-4 h-4" /> Print Folio
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ADD CHARGE MODAL */}
      {addChargeOpen && selectedRoom && (
        <div
          className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4"
          onClick={() => setAddChargeOpen(false)}
        >
          <div className="bg-white rounded-xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <div className="p-5 border-b border-brand-100 flex items-center justify-between">
              <h3 className="font-serif text-xl text-brand-900">
                Add Charge — Room {selectedRoom.number}
              </h3>
              <button
                onClick={() => setAddChargeOpen(false)}
                className="text-brand-600 hover:text-brand-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-3">
              <label className="block text-xs uppercase tracking-wider text-brand-700">
                Food Product (optional)
                <select
                  value={selectedFoodId}
                  onChange={(e) => {
                    const id = e.target.value;
                    setSelectedFoodId(id);
                    const p = foodProducts.find((x) => x.id === id);
                    if (p)
                      setChargeForm((f) => ({
                        ...f,
                        desc: `Food: ${p.name}`,
                        amt: String(p.price),
                      }));
                  }}
                  className="mt-1 w-full px-3 py-2 border border-brand-200 rounded-md text-sm bg-white"
                >
                  <option value="">— Custom charge —</option>
                  {foodProducts.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} — ₱{fmtPHP(p.price)} ({p.category})
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-xs uppercase tracking-wider text-brand-700">
                Description
                <input
                  value={chargeForm.desc}
                  onChange={(e) => setChargeForm({ ...chargeForm, desc: e.target.value })}
                  placeholder="e.g. Mini-bar restock"
                  className="mt-1 w-full px-3 py-2 border border-brand-200 rounded-md text-sm"
                />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block text-xs uppercase tracking-wider text-brand-700">
                  Amount (₱)
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={chargeForm.amt}
                    onChange={(e) => setChargeForm({ ...chargeForm, amt: e.target.value })}
                    className="mt-1 w-full px-3 py-2 border border-brand-200 rounded-md text-sm"
                  />
                  {chargeForm.amt && !isNaN(parseFloat(chargeForm.amt)) && (
                    <div className="mt-1 text-xs text-brand-600">
                      = ₱{fmtPHP(parseFloat(chargeForm.amt))}
                    </div>
                  )}
                </label>
                <label className="block text-xs uppercase tracking-wider text-brand-700">
                  Date Label
                  <input
                    value={chargeForm.d}
                    onChange={(e) => setChargeForm({ ...chargeForm, d: e.target.value })}
                    placeholder="e.g. Day 2"
                    className="mt-1 w-full px-3 py-2 border border-brand-200 rounded-md text-sm"
                  />
                </label>
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  onClick={() => {
                    setAddChargeOpen(false);
                    setSelectedFoodId("");
                  }}
                  className="px-4 py-2 border border-brand-200 rounded-md text-sm hover:bg-brand-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    const amt = parseFloat(chargeForm.amt);
                    if (!chargeForm.desc.trim() || isNaN(amt) || amt <= 0) {
                      addToast(
                        "error",
                        "Invalid charge",
                        "Description and a positive amount are required.",
                      );
                      return;
                    }
                    setExtraCharges((c) => [
                      ...c,
                      {
                        d: chargeForm.d || "Today",
                        desc: chargeForm.desc.trim(),
                        amt,
                        room: selectedRoom.id,
                      },
                    ]);
                    addToast("success", "Charge added", `${chargeForm.desc} — ₱${fmtPHP(amt)}`);
                    setChargeForm({ d: "Today", desc: "", amt: "" });
                    setSelectedFoodId("");
                    setAddChargeOpen(false);
                  }}
                  className="px-4 py-2 bg-brand-800 text-cream-50 rounded-md text-sm hover:bg-brand-900 flex items-center gap-1"
                >
                  <Check className="w-4 h-4" /> Add Charge
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* NEW RESERVATION MODAL */}
      {newResOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          onClick={() => setNewResOpen(false)}
        >
          <div
            className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-brand-100 flex items-center justify-between">
              <div>
                <div className="text-xs uppercase tracking-wider text-gold-500">Front Desk</div>
                <h3 className="font-serif text-2xl text-brand-900">New Reservation</h3>
              </div>
              <button
                onClick={() => setNewResOpen(false)}
                className="text-brand-600 hover:text-brand-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-3">
              <label className="md:col-span-2 block text-xs uppercase tracking-wider text-brand-700">
                Guest Name
                <input
                  value={resForm.guestName}
                  onChange={(e) => setResForm({ ...resForm, guestName: e.target.value })}
                  className="mt-1 w-full px-3 py-2 border border-brand-200 rounded-md text-sm normal-case"
                />
              </label>
              <label className="md:col-span-2 block text-xs uppercase tracking-wider text-brand-700">
                Room
                <select
                  value={resForm.roomId}
                  onChange={(e) => setResForm({ ...resForm, roomId: e.target.value })}
                  className="mt-1 w-full px-3 py-2 border border-brand-200 rounded-md text-sm bg-white"
                >
                  <option value="">Select room</option>
                  {rooms.map((r) => {
                    const { ok, conflict } = isRoomAvailableForDates(
                      r,
                      resForm.checkIn,
                      resForm.checkOut,
                      reservations,
                    );
                    return (
                      <option
                        key={r.id}
                        value={r.id}
                        disabled={!ok}
                        className={!ok ? "text-rose-600" : ""}
                      >
                        Room {r.number} · {r.type} · ₱{r.baseRate}/night
                        {ok ? " ✓ Available" : ""}
                        {!ok && conflict
                          ? ` ✗ ${conflict.guestName} (${conflict.checkIn}–${conflict.checkOut})`
                          : ""}
                        {!ok && !conflict && r.status === "maintenance" ? " ✗ MAINTENANCE" : ""}
                        {!ok && !conflict && r.status !== "maintenance" ? " ✗ UNAVAILABLE" : ""}
                      </option>
                    );
                  })}
                </select>
                {/* Schedule preview for selected room */}
                {resForm.roomId &&
                  (() => {
                    const schedule = getRoomSchedule(
                      resForm.roomId,
                      resForm.checkIn,
                      resForm.checkOut,
                      reservations,
                    );
                    return (
                      <div className="mt-2 text-xs bg-brand-50 rounded p-2 space-y-1">
                        <div className="font-medium text-brand-700 mb-1">
                          Schedule · {resForm.checkIn} → {resForm.checkOut}
                        </div>
                        {schedule.length > 0 ? (
                          schedule.map((s) => (
                            <div key={s.id} className="flex items-center gap-1.5 text-brand-700">
                              <span className="w-2 h-2 rounded-full bg-rose-500 flex-shrink-0" />
                              <span className="font-medium">{s.guestName}</span>
                              <span className="text-brand-500">
                                ({s.checkIn} → {s.checkOut})
                              </span>
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-brand-100 capitalize">
                                {s.status}
                              </span>
                            </div>
                          ))
                        ) : (
                          <div className="flex items-center gap-1.5 text-emerald-700">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
                            Clear — no conflicting reservations
                          </div>
                        )}
                      </div>
                    );
                  })()}
              </label>
              <label className="block text-xs uppercase tracking-wider text-brand-700">
                Check-in
                <input
                  type="date"
                  value={resForm.checkIn}
                  onChange={(e) => {
                    setResForm({ ...resForm, checkIn: e.target.value, roomId: "" });
                  }}
                  className="mt-1 w-full px-3 py-2 border border-brand-200 rounded-md text-sm"
                />
              </label>
              <label className="block text-xs uppercase tracking-wider text-brand-700">
                Check-out
                <input
                  type="date"
                  value={resForm.checkOut}
                  onChange={(e) => {
                    setResForm({ ...resForm, checkOut: e.target.value, roomId: "" });
                  }}
                  className="mt-1 w-full px-3 py-2 border border-brand-200 rounded-md text-sm"
                />
              </label>
              <label className="block text-xs uppercase tracking-wider text-brand-700">
                Adults
                <input
                  type="number"
                  min={1}
                  value={resForm.adults}
                  onChange={(e) =>
                    setResForm({ ...resForm, adults: parseInt(e.target.value) || 1 })
                  }
                  className="mt-1 w-full px-3 py-2 border border-brand-200 rounded-md text-sm"
                />
              </label>
              <label className="block text-xs uppercase tracking-wider text-brand-700">
                Children
                <input
                  type="number"
                  min={0}
                  value={resForm.children}
                  onChange={(e) =>
                    setResForm({ ...resForm, children: parseInt(e.target.value) || 0 })
                  }
                  className="mt-1 w-full px-3 py-2 border border-brand-200 rounded-md text-sm"
                />
              </label>
              <label className="md:col-span-2 block text-xs uppercase tracking-wider text-brand-700">
                Notes
                <textarea
                  rows={2}
                  value={resForm.notes}
                  onChange={(e) => setResForm({ ...resForm, notes: e.target.value })}
                  className="mt-1 w-full px-3 py-2 border border-brand-200 rounded-md text-sm resize-none normal-case"
                />
              </label>

              {/* Full availability calendar for selected dates */}
              <div className="md:col-span-2 border-t border-brand-100 pt-3 mt-1">
                <div className="text-xs uppercase tracking-wider text-brand-600 mb-2">
                  Room Availability · {resForm.checkIn} → {resForm.checkOut}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1.5">
                  {rooms.map((r) => {
                    const { ok, conflict } = isRoomAvailableForDates(
                      r,
                      resForm.checkIn,
                      resForm.checkOut,
                      reservations,
                    );
                    return (
                      <button
                        key={r.id}
                        onClick={() => ok && setResForm({ ...resForm, roomId: r.id })}
                        disabled={!ok}
                        className={`text-xs p-2 rounded border text-left transition ${
                          ok
                            ? resForm.roomId === r.id
                              ? "border-brand-700 bg-brand-100 text-brand-900"
                              : "border-emerald-200 bg-emerald-50 text-emerald-800 hover:border-emerald-400"
                            : "border-rose-200 bg-rose-50 text-rose-500 opacity-70 cursor-not-allowed"
                        }`}
                        title={
                          conflict
                            ? `Conflict: ${conflict.guestName} (${conflict.checkIn}–${conflict.checkOut})`
                            : r.status === "maintenance"
                              ? "Under maintenance"
                              : ""
                        }
                      >
                        <div className="font-mono font-bold">Room {r.number}</div>
                        <div className="opacity-70">{r.type}</div>
                        <div className="flex items-center gap-1 mt-0.5">
                          {ok ? (
                            <span className="text-emerald-600">✓ Free</span>
                          ) : (
                            <span className="text-rose-500">
                              {conflict
                                ? `${conflict.guestName.split(" ")[0]}`
                                : r.status === "maintenance"
                                  ? "Maint."
                                  : "Busy"}
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="md:col-span-2 flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setNewResOpen(false)}
                  className="px-4 py-2 border border-brand-200 rounded-md text-sm hover:bg-brand-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleCreateReservation(false)}
                  className="px-4 py-2 bg-brand-800 text-cream-50 rounded-md text-sm hover:bg-brand-900 flex items-center gap-1"
                >
                  <Check className="w-4 h-4" /> Create Reservation
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* WALK-IN SALE MODAL */}
      {walkInOpen &&
        (() => {
          const walkInCheckIn = today;
          const walkInCheckOut = new Date(Date.now() + walkForm.nights * 86400000)
            .toISOString()
            .slice(0, 10);
          return (
            <div
              className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
              onClick={() => setWalkInOpen(false)}
            >
              <div
                className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-6 border-b border-brand-100 flex items-center justify-between">
                  <div>
                    <div className="text-xs uppercase tracking-wider text-gold-500">Front Desk</div>
                    <h3 className="font-serif text-2xl text-brand-900">Walk-in Sale</h3>
                    <div className="text-xs text-brand-600 mt-1">
                      Books and checks in the guest immediately.
                    </div>
                  </div>
                  <button
                    onClick={() => setWalkInOpen(false)}
                    className="text-brand-600 hover:text-brand-900"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-3">
                  <label className="md:col-span-2 block text-xs uppercase tracking-wider text-brand-700">
                    Guest Name
                    <input
                      value={walkForm.guestName}
                      onChange={(e) => setWalkForm({ ...walkForm, guestName: e.target.value })}
                      className="mt-1 w-full px-3 py-2 border border-brand-200 rounded-md text-sm normal-case"
                    />
                  </label>
                  <label className="md:col-span-2 block text-xs uppercase tracking-wider text-brand-700">
                    Room
                    <select
                      value={walkForm.roomId}
                      onChange={(e) => setWalkForm({ ...walkForm, roomId: e.target.value })}
                      className="mt-1 w-full px-3 py-2 border border-brand-200 rounded-md text-sm bg-white"
                    >
                      <option value="">Select room</option>
                      {rooms.map((r) => {
                        const { ok, conflict } = isRoomAvailableForDates(
                          r,
                          walkInCheckIn,
                          walkInCheckOut,
                          reservations,
                        );
                        return (
                          <option
                            key={r.id}
                            value={r.id}
                            disabled={!ok}
                            className={!ok ? "text-rose-600" : ""}
                          >
                            Room {r.number} · {r.type} · ₱{r.baseRate}/night
                            {ok ? " ✓ Available" : ""}
                            {!ok && conflict
                              ? ` ✗ ${conflict.guestName} (${conflict.checkIn}–${conflict.checkOut})`
                              : ""}
                            {!ok && !conflict && r.status === "maintenance" ? " ✗ MAINTENANCE" : ""}
                            {!ok && !conflict && r.status !== "maintenance" ? " ✗ UNAVAILABLE" : ""}
                          </option>
                        );
                      })}
                    </select>
                    {/* Schedule preview for selected room */}
                    {walkForm.roomId &&
                      (() => {
                        const schedule = getRoomSchedule(
                          walkForm.roomId,
                          walkInCheckIn,
                          walkInCheckOut,
                          reservations,
                        );
                        return (
                          <div className="mt-2 text-xs bg-brand-50 rounded p-2 space-y-1">
                            <div className="font-medium text-brand-700 mb-1">
                              Schedule · {walkInCheckIn} → {walkInCheckOut}
                            </div>
                            {schedule.length > 0 ? (
                              schedule.map((s) => (
                                <div
                                  key={s.id}
                                  className="flex items-center gap-1.5 text-brand-700"
                                >
                                  <span className="w-2 h-2 rounded-full bg-rose-500 flex-shrink-0" />
                                  <span className="font-medium">{s.guestName}</span>
                                  <span className="text-brand-500">
                                    ({s.checkIn} → {s.checkOut})
                                  </span>
                                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-brand-100 capitalize">
                                    {s.status}
                                  </span>
                                </div>
                              ))
                            ) : (
                              <div className="flex items-center gap-1.5 text-emerald-700">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
                                Clear — no conflicting reservations
                              </div>
                            )}
                          </div>
                        );
                      })()}
                  </label>
                  <label className="block text-xs uppercase tracking-wider text-brand-700">
                    Nights
                    <input
                      type="number"
                      min={1}
                      value={walkForm.nights}
                      onChange={(e) =>
                        setWalkForm({ ...walkForm, nights: parseInt(e.target.value) || 1 })
                      }
                      className="mt-1 w-full px-3 py-2 border border-brand-200 rounded-md text-sm"
                    />
                  </label>
                  <label className="block text-xs uppercase tracking-wider text-brand-700">
                    Adults
                    <input
                      type="number"
                      min={1}
                      value={walkForm.adults}
                      onChange={(e) =>
                        setWalkForm({ ...walkForm, adults: parseInt(e.target.value) || 1 })
                      }
                      className="mt-1 w-full px-3 py-2 border border-brand-200 rounded-md text-sm"
                    />
                  </label>
                  <label className="md:col-span-2 block text-xs uppercase tracking-wider text-brand-700">
                    Notes
                    <textarea
                      rows={2}
                      value={walkForm.notes}
                      onChange={(e) => setWalkForm({ ...walkForm, notes: e.target.value })}
                      className="mt-1 w-full px-3 py-2 border border-brand-200 rounded-md text-sm resize-none normal-case"
                    />
                  </label>

                  {/* Full availability grid for walk-in */}
                  <div className="md:col-span-2 border-t border-brand-100 pt-3 mt-1">
                    <div className="text-xs uppercase tracking-wider text-brand-600 mb-2">
                      Room Availability · {walkInCheckIn} → {walkInCheckOut}
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1.5">
                      {rooms.map((r) => {
                        const { ok, conflict } = isRoomAvailableForDates(
                          r,
                          walkInCheckIn,
                          walkInCheckOut,
                          reservations,
                        );
                        return (
                          <button
                            key={r.id}
                            onClick={() => ok && setWalkForm({ ...walkForm, roomId: r.id })}
                            disabled={!ok}
                            className={`text-xs p-2 rounded border text-left transition ${
                              ok
                                ? walkForm.roomId === r.id
                                  ? "border-brand-700 bg-brand-100 text-brand-900"
                                  : "border-emerald-200 bg-emerald-50 text-emerald-800 hover:border-emerald-400"
                                : "border-rose-200 bg-rose-50 text-rose-500 opacity-70 cursor-not-allowed"
                            }`}
                            title={
                              conflict
                                ? `Conflict: ${conflict.guestName} (${conflict.checkIn}–${conflict.checkOut})`
                                : r.status === "maintenance"
                                  ? "Under maintenance"
                                  : ""
                            }
                          >
                            <div className="font-mono font-bold">Room {r.number}</div>
                            <div className="opacity-70">{r.type}</div>
                            <div className="flex items-center gap-1 mt-0.5">
                              {ok ? (
                                <span className="text-emerald-600">✓ Free</span>
                              ) : (
                                <span className="text-rose-500">
                                  {conflict
                                    ? `${conflict.guestName.split(" ")[0]}`
                                    : r.status === "maintenance"
                                      ? "Maint."
                                      : "Busy"}
                                </span>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="md:col-span-2 flex justify-end gap-2 pt-2">
                    <button
                      onClick={() => setWalkInOpen(false)}
                      className="px-4 py-2 border border-brand-200 rounded-md text-sm hover:bg-brand-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleCreateReservation(true)}
                      className="px-4 py-2 bg-emerald-600 text-white rounded-md text-sm hover:bg-emerald-700 flex items-center gap-1"
                    >
                      <CheckCircle2 className="w-4 h-4" /> Book & Check-in
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

      {/* TOP-LEVEL CHANGE ROOM MODAL */}
      {topChangeOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          onClick={() => setTopChangeOpen(false)}
        >
          <div
            className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-brand-100 flex items-center justify-between">
              <div>
                <div className="text-xs uppercase tracking-wider text-gold-500">Front Desk</div>
                <h3 className="font-serif text-2xl text-brand-900">Change Room</h3>
                <div className="text-xs text-brand-600 mt-1">
                  Move an active guest to a different room.
                </div>
              </div>
              <button
                onClick={() => setTopChangeOpen(false)}
                className="text-brand-600 hover:text-brand-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-3">
              <label className="block text-xs uppercase tracking-wider text-brand-700">
                Reservation
                <select
                  value={topChangeResId}
                  onChange={(e) => setTopChangeResId(e.target.value)}
                  className="mt-1 w-full px-3 py-2 border border-brand-200 rounded-md text-sm bg-white"
                >
                  <option value="">Select reservation</option>
                  {activeReservations.map((r) => {
                    const rm = rooms.find((x) => x.id === r.roomId);
                    return (
                      <option key={r.id} value={r.id}>
                        {r.guestName} · Room {rm?.number || r.roomId} · {r.status}
                      </option>
                    );
                  })}
                </select>
              </label>
              <label className="block text-xs uppercase tracking-wider text-brand-700">
                Transfer to Room
                <select
                  value={topChangeRoomId}
                  onChange={(e) => setTopChangeRoomId(e.target.value)}
                  disabled={!topChangeResId}
                  className="mt-1 w-full px-3 py-2 border border-brand-200 rounded-md text-sm bg-white disabled:opacity-50"
                >
                  <option value="">Select available room</option>
                  {rooms
                    .filter(
                      (r) =>
                        r.status === "available" &&
                        r.id !== reservations.find((x) => x.id === topChangeResId)?.roomId,
                    )
                    .map((r) => (
                      <option key={r.id} value={r.id}>
                        Room {r.number} · {r.type} · ₱{r.baseRate}/night
                      </option>
                    ))}
                </select>
              </label>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setTopChangeOpen(false)}
                  className="px-4 py-2 border border-brand-200 rounded-md text-sm hover:bg-brand-50"
                >
                  Cancel
                </button>
                <button
                  onClick={submitTopChange}
                  disabled={!topChangeResId || !topChangeRoomId}
                  className="px-4 py-2 bg-rose-600 text-white rounded-md text-sm hover:bg-rose-700 disabled:opacity-40 flex items-center gap-1"
                >
                  <Check className="w-4 h-4" /> Confirm Change
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
