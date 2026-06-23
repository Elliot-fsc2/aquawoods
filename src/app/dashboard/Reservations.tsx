import { useState, useEffect } from "react";
import { useApp } from "../context/AppContext";
import { useToast } from "../components/ToastProvider";
import { type Reservation } from "../data/mockData";
import { Search, Filter, Plus, Download, Calendar, CheckCircle, XCircle, AlertTriangle, Pencil, Trash2, Printer, Receipt, List, ChevronLeft, ChevronRight } from "lucide-react";

const DAY_MS = 24 * 60 * 60 * 1000;
const fmtISO = (d: Date) => d.toISOString().slice(0, 10);
const startOfWeek = (d: Date) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  const day = x.getDay(); // 0 Sun .. 6 Sat
  const diff = (day + 6) % 7; // Monday start
  x.setDate(x.getDate() - diff);
  return x;
};
const addDays = (d: Date, n: number) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};
const statusBar: Record<string, string> = {
  confirmed: "bg-blue-500 hover:bg-blue-600",
  "checked-in": "bg-emerald-500 hover:bg-emerald-600",
  "checked-out": "bg-slate-400 hover:bg-slate-500",
  cancelled: "bg-red-400 hover:bg-red-500",
  "no-show": "bg-amber-500 hover:bg-amber-600",
};


const statusStyle: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
  confirmed: { bg: "bg-blue-100", text: "text-blue-800", icon: <Calendar className="w-3 h-3" /> },
  "checked-in": { bg: "bg-emerald-100", text: "text-emerald-800", icon: <CheckCircle className="w-3 h-3" /> },
  "checked-out": { bg: "bg-slate-100", text: "text-slate-700", icon: <CheckCircle className="w-3 h-3" /> },
  cancelled: { bg: "bg-red-100", text: "text-red-800", icon: <XCircle className="w-3 h-3" /> },
  "no-show": { bg: "bg-amber-100", text: "text-amber-800", icon: <AlertTriangle className="w-3 h-3" /> },
};

export default function Reservations() {
  const { user, reservations, rooms, checkIn, checkOut, addReservation, updateReservation, deleteReservation, deleteReservations, property } = useApp();
  const { addToast } = useToast();
  const [receiptRes, setReceiptRes] = useState<Reservation | null>(null);
  const [checkInRes, setCheckInRes] = useState<Reservation | null>(null);
  const [checkInRoomId, setCheckInRoomId] = useState<string>("");
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [editingReservation, setEditingReservation] = useState<Reservation | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createDates, setCreateDates] = useState({ checkIn: "", checkOut: "" });
  const [editDates, setEditDates] = useState({ checkIn: "", checkOut: "" });
  const [viewMode, setViewMode] = useState<"list" | "week" | "month">("list");
  const [weekStart, setWeekStart] = useState<Date>(() => startOfWeek(new Date()));
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const weekEndExcl = addDays(weekStart, 7);
  const [monthAnchor, setMonthAnchor] = useState<Date>(() => {
    const d = new Date();
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const monthGridStart = startOfWeek(monthAnchor);
  const monthGridDays = Array.from({ length: 42 }, (_, i) => addDays(monthGridStart, i));
  const monthGridEndExcl = addDays(monthGridStart, 42);
  const isAdmin = user?.role === "admin";

  const startCheckIn = (r: Reservation) => {
    const assignedRoom = rooms.find((rm) => rm.id === r.roomId);
    if (assignedRoom && assignedRoom.status !== "occupied") {
      checkIn(r.id);
      addToast("success", "Guest checked in", `${r.guestName} → Room ${assignedRoom.number}`);
      return;
    }
    // No room assigned (e.g. online booking) or room blocked — open picker
    setCheckInRes(r);
    setCheckInRoomId("");
  };

  const confirmCheckIn = async () => {
    if (!checkInRes || !checkInRoomId) return;
    const room = rooms.find((rm) => rm.id === checkInRoomId);
    await updateReservation(checkInRes.id, { roomId: checkInRoomId, status: "checked-in" });
    addToast("success", "Guest checked in", `${checkInRes.guestName} → Room ${room?.number ?? checkInRoomId}`);
    setCheckInRes(null);
    setCheckInRoomId("");
  };


  useEffect(() => {
    if (showCreate) setCreateDates({ checkIn: "", checkOut: "" });
  }, [showCreate]);

  useEffect(() => {
    if (editingReservation) {
      setEditDates({ checkIn: editingReservation.checkIn, checkOut: editingReservation.checkOut });
    }
  }, [editingReservation]);

  const filtered = reservations.filter((r) =>
    (filter === "all" || r.status === filter) &&
    (r.guestName.toLowerCase().includes(search.toLowerCase()) || r.id.toLowerCase().includes(search.toLowerCase()))
  );
  const filteredIds = filtered.map((r) => r.id);
  const allVisibleSelected = filteredIds.length > 0 && filteredIds.every((id) => selectedIds.includes(id));

  const toggleSelectAll = () => {
    setSelectedIds((current) => {
      if (allVisibleSelected) return current.filter((id) => !filteredIds.includes(id));
      return Array.from(new Set([...current, ...filteredIds]));
    });
  };

  const toggleSelectOne = (reservationId: string) => {
    setSelectedIds((current) => current.includes(reservationId) ? current.filter((id) => id !== reservationId) : [...current, reservationId]);
  };

  const removeOne = (reservationId: string) => {
    deleteReservation(reservationId);
    setSelectedIds((current) => current.filter((id) => id !== reservationId));
  };

  const removeSelected = () => {
    deleteReservations(selectedIds);
    setSelectedIds([]);
  };

  const saveReservationEdit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingReservation) return;
    const form = new FormData(event.currentTarget);
    const checkIn = String(form.get("checkIn"));
    const checkOut = String(form.get("checkOut"));
    const roomId = String(form.get("roomId"));
    if (checkOut <= checkIn) {
      addToast("error", "Invalid dates", "Check-out must be after check-in.");
      return;
    }
    const overlap = isOverlap(roomId, checkIn, checkOut, editingReservation.id);
    if (overlap) {
      addToast(
        "error",
        "Room not available",
        `Room ${overlap.roomId} is already reserved from ${overlap.checkIn} to ${overlap.checkOut} (${overlap.guestName}).`
      );
      return;
    }
    updateReservation(editingReservation.id, {
      guestName: String(form.get("guestName")),
      roomId,
      checkIn,
      checkOut,
      rateCode: String(form.get("rateCode")),
      status: String(form.get("status")) as Reservation["status"],
      adults: Number(form.get("adults")),
      children: Number(form.get("children")),
      totalAmount: Number(form.get("totalAmount")),
      deposit: Number(form.get("deposit")),
    });
    setEditingReservation(null);
  };
  const isOverlap = (
    roomId: string,
    checkIn: string,
    checkOut: string,
    excludeId?: string
  ): Reservation | undefined => {
    if (!roomId) return undefined;
    const activeStatuses = ["confirmed", "checked-in"];
    return reservations.find(
      (r) =>
        r.id !== excludeId &&
        r.roomId === roomId &&
        activeStatuses.includes(r.status) &&
        checkIn < r.checkOut &&
        checkOut > r.checkIn
    );
  };

  const createReservation = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const guestName = String(form.get("guestName") ?? "").trim();
    const checkInDate = String(form.get("checkIn") ?? "");
    const checkOutDate = String(form.get("checkOut") ?? "");
    const roomId = String(form.get("roomId") ?? "");
    if (!guestName || !checkInDate || !checkOutDate) {
      addToast("error", "Missing details", "Guest name, check-in and check-out are required.");
      return;
    }
    if (checkOutDate <= checkInDate) {
      addToast("error", "Invalid dates", "Check-out must be after check-in.");
      return;
    }
    const overlap = isOverlap(roomId, checkInDate, checkOutDate);
    if (overlap) {
      addToast(
        "error",
        "Room not available",
        `Room ${overlap.roomId} is already reserved from ${overlap.checkIn} to ${overlap.checkOut} (${overlap.guestName}).`
      );
      return;
    }

    const newRes: Reservation = {
      id: `RES-${Date.now().toString(36).toUpperCase()}`,
      guestName,
      guestId: "",
      roomId,
      checkIn: checkInDate,
      checkOut: checkOutDate,
      rateCode: String(form.get("rateCode") ?? "BAR"),
      totalAmount: Number(form.get("totalAmount") ?? 0),
      deposit: Number(form.get("deposit") ?? 0),
      status: String(form.get("status") ?? "confirmed") as Reservation["status"],
      source: "Walk-in" as Reservation["source"],
      adults: Number(form.get("adults") ?? 1),
      children: Number(form.get("children") ?? 0),
      notes: String(form.get("notes") ?? "") || undefined,
    };

    setCreating(true);
    const result = await addReservation(newRes);
    setCreating(false);
    if (result.ok) {
      addToast("success", "Reservation created", `Reservation ${newRes.id} created.`);
      setShowCreate(false);
    } else {
      const isPermission = /permission|not allowed|admin or staff/i.test(result.error || "");
      addToast(
        "error",
        isPermission ? "Permission denied" : "Could not create reservation",
        result.error || "Please try again."
      );
    }
  };


  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="text-xs uppercase tracking-[0.25em] text-gold-500 font-medium mb-1">Reservations</div>
          <h1 className="font-serif text-4xl text-brand-900">Central Reservation System</h1>
          <p className="text-brand-700 mt-1">All room bookings — walk-ins, phone reservations, and online inquiries — in one place.</p>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-white border border-brand-200 rounded-md text-sm hover:bg-brand-50 flex items-center gap-2"><Download className="w-4 h-4" /> Export</button>
          <button onClick={() => setShowCreate(true)} className="px-4 py-2 bg-brand-800 text-cream-50 rounded-md text-sm hover:bg-brand-900 flex items-center gap-2"><Plus className="w-4 h-4" /> New Reservation</button>
        </div>
      </div>

      {/* FILTERS */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-brand-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search guest or reservation ID..." className="w-full pl-9 pr-4 py-2 text-sm border border-brand-200 rounded-md bg-white focus:outline-none focus:border-brand-500" />
        </div>
        {[
          { k: "all", l: `All (${reservations.length})` },
          { k: "confirmed", l: `Confirmed (${reservations.filter(r => r.status === "confirmed").length})` },
          { k: "checked-in", l: `In-House (${reservations.filter(r => r.status === "checked-in").length})` },
          { k: "checked-out", l: `Checked-Out` },
          { k: "cancelled", l: `Cancelled` },
        ].map((f) => (
          <button key={f.k} onClick={() => setFilter(f.k)} className={`px-3 py-1.5 text-xs rounded-full transition ${filter === f.k ? "bg-brand-800 text-cream-50" : "bg-white border border-brand-200 text-brand-700 hover:bg-brand-50"}`}>
            {f.l}
          </button>
        ))}
        <button className="px-3 py-1.5 text-xs bg-white border border-brand-200 rounded-md text-brand-700 hover:bg-brand-50 flex items-center gap-1"><Filter className="w-3 h-3" /> More</button>
        <div className="ml-auto inline-flex rounded-md border border-brand-200 overflow-hidden">
          <button onClick={() => setViewMode("list")} className={`px-3 py-1.5 text-xs flex items-center gap-1 ${viewMode === "list" ? "bg-brand-800 text-cream-50" : "bg-white text-brand-700 hover:bg-brand-50"}`}>
            <List className="w-3 h-3" /> List
          </button>
          <button onClick={() => setViewMode("week")} className={`px-3 py-1.5 text-xs flex items-center gap-1 border-l border-brand-200 ${viewMode === "week" ? "bg-brand-800 text-cream-50" : "bg-white text-brand-700 hover:bg-brand-50"}`}>
            <Calendar className="w-3 h-3" /> Week
          </button>
          <button onClick={() => setViewMode("month")} className={`px-3 py-1.5 text-xs flex items-center gap-1 border-l border-brand-200 ${viewMode === "month" ? "bg-brand-800 text-cream-50" : "bg-white text-brand-700 hover:bg-brand-50"}`}>
            <Calendar className="w-3 h-3" /> Month
          </button>
        </div>
      </div>

      {viewMode === "week" && (
        <div className="bg-white rounded-xl border border-brand-100 overflow-hidden">
          <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-brand-100 bg-brand-50/40">
            <div>
              <div className="text-xs uppercase tracking-wider text-gold-500">Week of</div>
              <div className="font-serif text-lg text-brand-900">
                {weekStart.toLocaleDateString(undefined, { month: "long", day: "numeric" })} – {addDays(weekStart, 6).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setWeekStart(addDays(weekStart, -7))} className="p-1.5 rounded border border-brand-200 hover:bg-white" aria-label="Previous week"><ChevronLeft className="w-4 h-4" /></button>
              <button onClick={() => setWeekStart(startOfWeek(new Date()))} className="px-3 py-1.5 text-xs rounded border border-brand-200 bg-white hover:bg-brand-50">Today</button>
              <button onClick={() => setWeekStart(addDays(weekStart, 7))} className="p-1.5 rounded border border-brand-200 hover:bg-white" aria-label="Next week"><ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <div className="min-w-[900px]">
              <div className="grid grid-cols-[160px_repeat(7,minmax(0,1fr))] bg-brand-50/50 border-b border-brand-100 text-xs uppercase tracking-wider text-brand-600">
                <div className="px-3 py-2 font-medium">Room</div>
                {weekDays.map((d) => {
                  const isToday = fmtISO(d) === fmtISO(new Date());
                  return (
                    <div key={d.toISOString()} className={`px-2 py-2 text-center border-l border-brand-100 ${isToday ? "bg-brand-100 text-brand-900" : ""}`}>
                      <div className="font-medium">{d.toLocaleDateString(undefined, { weekday: "short" })}</div>
                      <div className="text-[11px] text-brand-500">{d.getMonth() + 1}/{d.getDate()}</div>
                    </div>
                  );
                })}
              </div>
              {rooms.map((rm) => {
                const roomRes = filtered.filter((r) => {
                  if (r.roomId !== rm.id) return false;
                  const ci = new Date(r.checkIn);
                  const co = new Date(r.checkOut);
                  return ci < weekEndExcl && co > weekStart;
                });
                return (
                  <div key={rm.id} className="grid grid-cols-[160px_repeat(7,minmax(0,1fr))] border-b border-brand-50 relative">
                    <div className="px-3 py-3 border-r border-brand-100">
                      <div className="font-mono text-sm font-medium text-brand-900">{rm.number}</div>
                      <div className="text-[11px] text-brand-500">{rm.type}</div>
                    </div>
                    <div className="col-span-7 relative h-14">
                      <div className="absolute inset-0 grid grid-cols-7">
                        {weekDays.map((d) => {
                          const isToday = fmtISO(d) === fmtISO(new Date());
                          return <div key={d.toISOString()} className={`border-l border-brand-50 ${isToday ? "bg-brand-50/60" : ""}`} />;
                        })}
                      </div>
                      {roomRes.map((r) => {
                        const ci = new Date(r.checkIn);
                        const co = new Date(r.checkOut);
                        const startIdx = Math.max(0, Math.floor((ci.getTime() - weekStart.getTime()) / DAY_MS));
                        const endIdx = Math.min(7, Math.ceil((co.getTime() - weekStart.getTime()) / DAY_MS));
                        const span = Math.max(1, endIdx - startIdx);
                        const left = (startIdx / 7) * 100;
                        const width = (span / 7) * 100;
                        const cls = statusBar[r.status] ?? "bg-brand-500";
                        return (
                          <button
                            key={r.id}
                            onClick={() => isAdmin ? setEditingReservation(r) : setReceiptRes(r)}
                            title={`${r.guestName} · ${r.checkIn} → ${r.checkOut} · ${r.status}`}
                            className={`absolute top-1.5 bottom-1.5 rounded-md text-[11px] text-white px-2 truncate text-left shadow-sm ${cls}`}
                            style={{ left: `calc(${left}% + 2px)`, width: `calc(${width}% - 4px)` }}
                          >
                            <span className="font-medium">{r.guestName}</span>
                            <span className="opacity-80 ml-1">· {r.id}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
              {(() => {
                const unassigned = filtered.filter((r) => {
                  if (r.roomId) return false;
                  const ci = new Date(r.checkIn);
                  const co = new Date(r.checkOut);
                  return ci < weekEndExcl && co > weekStart;
                });
                if (unassigned.length === 0) return null;
                return (
                  <div className="px-4 py-3 text-xs text-brand-600 bg-amber-50/50 border-t border-amber-100">
                    {unassigned.length} reservation(s) in this week have no room assigned.
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {viewMode === "month" && (
        <div className="bg-white rounded-xl border border-brand-100 overflow-hidden">
          <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-brand-100 bg-brand-50/40">
            <div>
              <div className="text-xs uppercase tracking-wider text-gold-500">Month</div>
              <div className="font-serif text-lg text-brand-900">
                {monthAnchor.toLocaleDateString(undefined, { month: "long", year: "numeric" })}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => { const d = new Date(monthAnchor); d.setMonth(d.getMonth() - 1); setMonthAnchor(d); }} className="p-1.5 rounded border border-brand-200 hover:bg-white" aria-label="Previous month"><ChevronLeft className="w-4 h-4" /></button>
              <button onClick={() => { const d = new Date(); d.setDate(1); d.setHours(0,0,0,0); setMonthAnchor(d); }} className="px-3 py-1.5 text-xs rounded border border-brand-200 bg-white hover:bg-brand-50">Today</button>
              <button onClick={() => { const d = new Date(monthAnchor); d.setMonth(d.getMonth() + 1); setMonthAnchor(d); }} className="p-1.5 rounded border border-brand-200 hover:bg-white" aria-label="Next month"><ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>
          <div className="grid grid-cols-7 bg-brand-50/50 border-b border-brand-100 text-[11px] uppercase tracking-wider text-brand-600">
            {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map((d) => (
              <div key={d} className="px-2 py-2 text-center font-medium border-l first:border-l-0 border-brand-100">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 grid-rows-6">
            {monthGridDays.map((d, i) => {
              const inMonth = d.getMonth() === monthAnchor.getMonth();
              const isToday = fmtISO(d) === fmtISO(new Date());
              const dayEnd = addDays(d, 1);
              const dayRes = filtered.filter((r) => {
                const ci = new Date(r.checkIn);
                const co = new Date(r.checkOut);
                return ci < dayEnd && co > d;
              });
              return (
                <div key={i} className={`min-h-[110px] border-l border-t border-brand-50 p-1.5 flex flex-col gap-1 ${inMonth ? "bg-white" : "bg-brand-50/30"} ${isToday ? "ring-1 ring-inset ring-brand-400" : ""}`}>
                  <div className={`text-[11px] font-medium ${inMonth ? "text-brand-900" : "text-brand-400"}`}>{d.getDate()}</div>
                  <div className="flex flex-col gap-0.5 overflow-hidden">
                    {dayRes.slice(0, 3).map((r) => {
                      const cls = statusBar[r.status] ?? "bg-brand-500";
                      return (
                        <button
                          key={r.id}
                          onClick={() => isAdmin ? setEditingReservation(r) : setReceiptRes(r)}
                          title={`${r.guestName} · ${r.checkIn} → ${r.checkOut} · ${r.status}`}
                          className={`text-left text-[10px] text-white px-1.5 py-0.5 rounded truncate ${cls}`}
                        >
                          {r.guestName}
                        </button>
                      );
                    })}
                    {dayRes.length > 3 && (
                      <div className="text-[10px] text-brand-500 px-1">+{dayRes.length - 3} more</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          {(() => {
            const unassigned = filtered.filter((r) => {
              if (r.roomId) return false;
              const ci = new Date(r.checkIn);
              const co = new Date(r.checkOut);
              return ci < monthGridEndExcl && co > monthGridStart;
            });
            if (unassigned.length === 0) return null;
            return (
              <div className="px-4 py-3 text-xs text-brand-600 bg-amber-50/50 border-t border-amber-100">
                {unassigned.length} reservation(s) in this period have no room assigned.
              </div>
            );
          })()}
        </div>
      )}


      {isAdmin && (
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white border border-brand-100 rounded-xl px-4 py-3">
          <label className="inline-flex items-center gap-2 text-sm text-brand-800 cursor-pointer">
            <input
              type="checkbox"
              checked={allVisibleSelected}
              onChange={toggleSelectAll}
              className="h-4 w-4 accent-brand-700"
            />
            Select all visible reservations
          </label>
          <div className="flex items-center gap-2">
            <span className="text-xs text-brand-600">{selectedIds.length} selected</span>
            <button
              onClick={removeSelected}
              disabled={selectedIds.length === 0}
              className="px-3 py-1.5 text-xs rounded-md bg-red-600 text-white hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete Selected
            </button>
          </div>
        </div>
      )}

      {/* RESERVATION LIST */}
      {viewMode === "list" && (
      <div className="bg-white rounded-xl border border-brand-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-brand-50/50 border-b border-brand-100">
              <tr className="text-xs text-brand-600 uppercase tracking-wider">
                {isAdmin && (
                  <th className="text-left px-4 py-3 font-medium">
                    <input
                      type="checkbox"
                      checked={allVisibleSelected}
                      onChange={toggleSelectAll}
                      className="h-4 w-4 accent-brand-700"
                      aria-label="Select all visible reservations"
                    />
                  </th>
                )}
                <th className="text-left px-4 py-3 font-medium">Reservation</th>
                <th className="text-left px-4 py-3 font-medium">Guest</th>
                <th className="text-left px-4 py-3 font-medium">Dates</th>
                <th className="text-left px-4 py-3 font-medium">Room</th>
                <th className="text-left px-4 py-3 font-medium">Rate</th>
                <th className="text-right px-4 py-3 font-medium">Total</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-50">
              {filtered.map((r) => {
                const st = statusStyle[r.status];
                return (
                  <tr key={r.id} className="hover:bg-brand-50/40">
                    {isAdmin && (
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(r.id)}
                          onChange={() => toggleSelectOne(r.id)}
                          className="h-4 w-4 accent-brand-700"
                          aria-label={`Select reservation ${r.id}`}
                        />
                      </td>
                    )}
                    <td className="px-4 py-3 font-mono text-xs text-brand-900">{r.id}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-brand-900">{r.guestName}</div>
                      <div className="text-xs text-brand-500">{r.adults}A {r.children}C</div>
                    </td>
                    <td className="px-4 py-3 text-brand-700 text-xs">
                      <div>{r.checkIn}</div>
                      <div className="text-brand-400">→ {r.checkOut}</div>
                    </td>
                    <td className="px-4 py-3 text-brand-700 text-xs">{r.roomId}</td>
                    <td className="px-4 py-3"><span className="text-xs px-2 py-0.5 bg-brand-50 text-brand-700 rounded-full">{r.rateCode}</span></td>
                    <td className="px-4 py-3 text-right font-medium">₱{r.totalAmount}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${st.bg} ${st.text}`}>
                        {st.icon} {r.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex gap-1 justify-end">
                        {r.status === "confirmed" && (
                          <button onClick={() => startCheckIn(r)} className="text-xs px-2 py-1 bg-brand-100 text-brand-800 rounded hover:bg-brand-200">Check-in</button>
                        )}
                        {r.status === "checked-in" && (
                          <button onClick={() => checkOut(r.id)} className="text-xs px-2 py-1 bg-amber-100 text-amber-800 rounded hover:bg-amber-200">Check-out</button>
                        )}
                        {isAdmin && (
                          <>
                            <button onClick={() => setEditingReservation(r)} className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded hover:bg-blue-200 flex items-center gap-1"><Pencil className="w-3 h-3" /> Edit</button>
                            <button onClick={() => removeOne(r.id)} className="text-xs px-2 py-1 bg-red-100 text-red-800 rounded hover:bg-red-200 flex items-center gap-1"><Trash2 className="w-3 h-3" /> Delete</button>
                          </>
                        )}
                        <button onClick={() => setReceiptRes(r)} className="text-xs px-2 py-1 bg-slate-100 text-slate-700 rounded hover:bg-slate-200 flex items-center gap-1"><Receipt className="w-3 h-3" /> Receipt</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      )}



      {showCreate && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => !creating && setShowCreate(false)}>
          <form onSubmit={createReservation} className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-brand-100 flex items-start justify-between">
              <div>
                <div className="text-xs uppercase tracking-wider text-gold-500">New Booking</div>
                <h3 className="font-serif text-2xl text-brand-900">Create Reservation</h3>
                <p className="text-xs text-brand-600 mt-1">Capture a walk-in, phone, or online reservation.</p>
              </div>
              <button type="button" onClick={() => setShowCreate(false)} className="text-brand-600 hover:text-brand-900">×</button>
            </div>
            <div className="p-6 grid md:grid-cols-3 gap-4">
              <label className="md:col-span-3 text-xs uppercase tracking-wider text-brand-700">
                Guest Name
                <input name="guestName" required maxLength={120} placeholder="e.g. Juan Dela Cruz" className="mt-1 w-full px-3 py-2 border border-brand-200 rounded-md text-sm normal-case" />
              </label>

              <label className="text-xs uppercase tracking-wider text-brand-700">
                Check-in
                <input name="checkIn" type="date" required value={createDates.checkIn} onChange={(e) => setCreateDates((d) => ({ ...d, checkIn: e.target.value }))} className="mt-1 w-full px-3 py-2 border border-brand-200 rounded-md text-sm normal-case" />
              </label>
              <label className="text-xs uppercase tracking-wider text-brand-700">
                Check-out
                <input name="checkOut" type="date" required value={createDates.checkOut} onChange={(e) => setCreateDates((d) => ({ ...d, checkOut: e.target.value }))} className="mt-1 w-full px-3 py-2 border border-brand-200 rounded-md text-sm normal-case" />
              </label>
              <label className="text-xs uppercase tracking-wider text-brand-700">
                Room
                <select name="roomId" className="mt-1 w-full px-3 py-2 border border-brand-200 rounded-md bg-white text-sm normal-case">
                  <option value="">— unassigned —</option>
                  {rooms.map((rm) => {
                    const blocked = createDates.checkIn && createDates.checkOut ? isOverlap(rm.id, createDates.checkIn, createDates.checkOut) : undefined;
                    return (
                      <option key={rm.id} value={rm.id} disabled={!!blocked}>
                        {rm.number} · {rm.type} (₱{rm.baseRate}){blocked ? " — UNAVAILABLE" : ""}
                      </option>
                    );
                  })}
                </select>
              </label>

              <label className="text-xs uppercase tracking-wider text-brand-700">
                Rate Code
                <input name="rateCode" defaultValue="BAR" required maxLength={20} className="mt-1 w-full px-3 py-2 border border-brand-200 rounded-md text-sm normal-case" />
              </label>
              <label className="text-xs uppercase tracking-wider text-brand-700">
                Status
                <select name="status" defaultValue="confirmed" className="mt-1 w-full px-3 py-2 border border-brand-200 rounded-md bg-white text-sm normal-case">
                  {Object.keys(statusStyle).map((status) => <option key={status}>{status}</option>)}
                </select>
              </label>
              <label className="text-xs uppercase tracking-wider text-brand-700">
                Adults
                <input name="adults" type="number" min="1" max="20" defaultValue={1} required className="mt-1 w-full px-3 py-2 border border-brand-200 rounded-md text-sm normal-case" />
              </label>
              <label className="text-xs uppercase tracking-wider text-brand-700">
                Children
                <input name="children" type="number" min="0" max="20" defaultValue={0} required className="mt-1 w-full px-3 py-2 border border-brand-200 rounded-md text-sm normal-case" />
              </label>
              <label className="text-xs uppercase tracking-wider text-brand-700">
                Total Amount (₱)
                <input name="totalAmount" type="number" min="0" step="0.01" defaultValue={0} required className="mt-1 w-full px-3 py-2 border border-brand-200 rounded-md text-sm normal-case" />
              </label>
              <label className="text-xs uppercase tracking-wider text-brand-700">
                Deposit (₱)
                <input name="deposit" type="number" min="0" step="0.01" defaultValue={0} required className="mt-1 w-full px-3 py-2 border border-brand-200 rounded-md text-sm normal-case" />
              </label>

              <label className="md:col-span-3 text-xs uppercase tracking-wider text-brand-700">
                Notes
                <textarea name="notes" maxLength={500} rows={3} placeholder="Special requests, arrival time, etc." className="mt-1 w-full px-3 py-2 border border-brand-200 rounded-md text-sm normal-case" />
              </label>
            </div>
            <div className="p-6 border-t border-brand-100 flex justify-end gap-2">
              <button type="button" onClick={() => setShowCreate(false)} disabled={creating} className="px-4 py-2 border border-brand-200 rounded-md text-sm hover:bg-brand-50 disabled:opacity-60">Cancel</button>
              <button type="submit" disabled={creating} className="px-4 py-2 bg-brand-800 text-cream-50 rounded-md text-sm hover:bg-brand-900 disabled:opacity-60">
                {creating ? "Creating…" : "Create Reservation"}
              </button>
            </div>
          </form>
        </div>
      )}

      {editingReservation && isAdmin && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setEditingReservation(null)}>
          <form onSubmit={saveReservationEdit} className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto" onClick={(event) => event.stopPropagation()}>
            <div className="p-6 border-b border-brand-100 flex items-start justify-between">
              <div>
                <div className="text-xs uppercase tracking-wider text-gold-500">Admin Edit</div>
                <h3 className="font-serif text-2xl text-brand-900">Edit {editingReservation.id}</h3>
              </div>
              <button type="button" onClick={() => setEditingReservation(null)} className="text-brand-600 hover:text-brand-900">x</button>
            </div>
            <div className="p-6 grid md:grid-cols-3 gap-4">
              <label className="md:col-span-2 text-xs uppercase tracking-wider text-brand-700">
                Guest Name
                <input name="guestName" defaultValue={editingReservation.guestName} required className="mt-1 w-full px-3 py-2 border border-brand-200 rounded-md text-sm normal-case" />
              </label>
              <label className="text-xs uppercase tracking-wider text-brand-700">
                Room
                <select name="roomId" defaultValue={editingReservation.roomId} className="mt-1 w-full px-3 py-2 border border-brand-200 rounded-md bg-white text-sm normal-case">
                  <option value="">— unassigned —</option>
                  {rooms.map((rm) => {
                    const blocked = editDates.checkIn && editDates.checkOut ? isOverlap(rm.id, editDates.checkIn, editDates.checkOut, editingReservation.id) : undefined;
                    return (
                      <option key={rm.id} value={rm.id} disabled={!!blocked}>
                        {rm.number} · {rm.type} (₱{rm.baseRate}){blocked ? " — UNAVAILABLE" : ""}
                      </option>
                    );
                  })}
                </select>
              </label>
              <label className="text-xs uppercase tracking-wider text-brand-700">
                Check-in
                <input name="checkIn" type="date" required value={editDates.checkIn} onChange={(e) => setEditDates((d) => ({ ...d, checkIn: e.target.value }))} className="mt-1 w-full px-3 py-2 border border-brand-200 rounded-md text-sm normal-case" />
              </label>
              <label className="text-xs uppercase tracking-wider text-brand-700">
                Check-out
                <input name="checkOut" type="date" required value={editDates.checkOut} onChange={(e) => setEditDates((d) => ({ ...d, checkOut: e.target.value }))} className="mt-1 w-full px-3 py-2 border border-brand-200 rounded-md text-sm normal-case" />
              </label>

              <label className="text-xs uppercase tracking-wider text-brand-700">
                Rate Code
                <input name="rateCode" defaultValue={editingReservation.rateCode} required className="mt-1 w-full px-3 py-2 border border-brand-200 rounded-md text-sm normal-case" />
              </label>
              <label className="text-xs uppercase tracking-wider text-brand-700">
                Status
                <select name="status" defaultValue={editingReservation.status} className="mt-1 w-full px-3 py-2 border border-brand-200 rounded-md bg-white text-sm normal-case">
                  {Object.keys(statusStyle).map((status) => <option key={status}>{status}</option>)}
                </select>
              </label>
              <label className="text-xs uppercase tracking-wider text-brand-700">
                Adults
                <input name="adults" type="number" min="0" defaultValue={editingReservation.adults} required className="mt-1 w-full px-3 py-2 border border-brand-200 rounded-md text-sm normal-case" />
              </label>
              <label className="text-xs uppercase tracking-wider text-brand-700">
                Children
                <input name="children" type="number" min="0" defaultValue={editingReservation.children} required className="mt-1 w-full px-3 py-2 border border-brand-200 rounded-md text-sm normal-case" />
              </label>
              <label className="text-xs uppercase tracking-wider text-brand-700">
                Total Amount
                <input name="totalAmount" type="number" min="0" defaultValue={editingReservation.totalAmount} required className="mt-1 w-full px-3 py-2 border border-brand-200 rounded-md text-sm normal-case" />
              </label>
              <label className="text-xs uppercase tracking-wider text-brand-700">
                Deposit
                <input name="deposit" type="number" min="0" defaultValue={editingReservation.deposit} required className="mt-1 w-full px-3 py-2 border border-brand-200 rounded-md text-sm normal-case" />
              </label>
            </div>
            <div className="p-6 border-t border-brand-100 flex justify-end gap-2">
              <button type="button" onClick={() => setEditingReservation(null)} className="px-4 py-2 border border-brand-200 rounded-md text-sm hover:bg-brand-50">Cancel</button>
              <button className="px-4 py-2 bg-brand-800 text-cream-50 rounded-md text-sm hover:bg-brand-900">Save Changes</button>
            </div>
          </form>
        </div>
      )}

      {/* CHECK-IN ROOM PICKER */}
      {checkInRes && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setCheckInRes(null)}>
          <div className="bg-white rounded-xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-brand-100">
              <div className="text-xs uppercase tracking-wider text-gold-500">Check-in Guest</div>
              <h3 className="font-serif text-2xl text-brand-900">{checkInRes.guestName}</h3>
              <div className="text-xs text-brand-600 mt-1">{checkInRes.id} · {checkInRes.checkIn} → {checkInRes.checkOut} · {checkInRes.adults}A {checkInRes.children}C</div>
            </div>
            <div className="p-6">
              <label className="text-xs font-medium text-brand-700 uppercase tracking-wider">Assign Available Room</label>
              {(() => {
                const avail = rooms.filter((rm) => rm.status === "available");
                if (avail.length === 0) return <div className="mt-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md p-3">No available rooms. Mark a dirty room as ready first.</div>;
                return (
                  <div className="mt-2 grid grid-cols-3 gap-2 max-h-64 overflow-y-auto">
                    {avail.map((rm) => (
                      <button key={rm.id} type="button" onClick={() => setCheckInRoomId(rm.id)}
                        className={`text-left p-2 rounded-md border-2 transition ${checkInRoomId === rm.id ? "border-brand-700 bg-brand-50" : "border-brand-200 hover:border-brand-400"}`}>
                        <div className="font-mono font-bold text-sm text-brand-900">{rm.number}</div>
                        <div className="text-[10px] text-brand-600 leading-tight">{rm.type}</div>
                        <div className="text-[10px] text-brand-500 mt-1">₱{rm.baseRate}</div>
                      </button>
                    ))}
                  </div>
                );
              })()}
            </div>
            <div className="p-4 border-t border-brand-100 flex gap-2">
              <button onClick={() => setCheckInRes(null)} className="flex-1 py-2.5 border border-brand-200 rounded-md text-sm hover:bg-brand-50">Cancel</button>
              <button onClick={confirmCheckIn} disabled={!checkInRoomId} className="flex-1 py-2.5 bg-brand-800 text-cream-50 rounded-md text-sm hover:bg-brand-900 disabled:opacity-50 disabled:cursor-not-allowed">
                Confirm Check-in
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RECEIPT MODAL */}
      {receiptRes && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setReceiptRes(null)}>
          <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-brand-100 flex items-center justify-between">
              <div>
                <div className="text-xs uppercase tracking-wider text-gold-500">Official Receipt</div>
                <h3 className="font-serif text-2xl text-brand-900">{receiptRes.id}</h3>
              </div>
              <button onClick={() => setReceiptRes(null)} className="text-brand-600 hover:text-brand-900">×</button>
            </div>
            <div className="p-6" id="receipt-print">
              <div className="text-center mb-6">
                <div className="font-serif text-xl text-brand-900">{property.name}</div>
                <div className="text-xs text-brand-600">{property.address}, {property.city}</div>
                <div className="text-xs text-brand-600">{property.phone} · {property.email}</div>
              </div>
              <div className="border-t border-dashed border-brand-300 pt-4 space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-brand-600">Guest</span><span className="font-medium">{receiptRes.guestName}</span></div>
                <div className="flex justify-between"><span className="text-brand-600">Room</span><span>{receiptRes.roomId}</span></div>
                <div className="flex justify-between"><span className="text-brand-600">Check-in</span><span>{receiptRes.checkIn}</span></div>
                <div className="flex justify-between"><span className="text-brand-600">Check-out</span><span>{receiptRes.checkOut}</span></div>
                <div className="flex justify-between"><span className="text-brand-600">Rate</span><span>{receiptRes.rateCode}</span></div>
                <div className="flex justify-between"><span className="text-brand-600">Guests</span><span>{receiptRes.adults}A {receiptRes.children}C</span></div>
                <div className="flex justify-between"><span className="text-brand-600">Status</span><span className="font-medium">{receiptRes.status}</span></div>
              </div>
              <div className="border-t border-dashed border-brand-300 mt-4 pt-4">
                <div className="flex justify-between text-sm"><span>Room Charges</span><span>₱{receiptRes.totalAmount.toLocaleString()}</span></div>
                <div className="flex justify-between text-sm text-brand-600"><span>Tax (7%)</span><span>₱{Math.round(receiptRes.totalAmount * 0.07).toLocaleString()}</span></div>
                <div className="flex justify-between font-medium text-lg mt-2 pt-2 border-t border-brand-200">
                  <span>Total</span><span className="font-serif">₱{Math.round(receiptRes.totalAmount * 1.07).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm mt-1"><span className="text-brand-600">Deposit</span><span>₱{receiptRes.deposit.toLocaleString()}</span></div>
                <div className="flex justify-between text-sm font-medium"><span>Balance</span><span>₱{Math.round(receiptRes.totalAmount * 1.07 - receiptRes.deposit).toLocaleString()}</span></div>
              </div>
              <div className="text-center text-xs text-brand-500 mt-6 pt-4 border-t border-dashed border-brand-300">
                Thank you for staying at {property.name.split(",")[0]}!<br />
                Receipt generated {new Date().toLocaleString()}
              </div>
            </div>
            <div className="p-4 border-t border-brand-100 flex gap-2">
              <button onClick={() => { window.print(); addToast("info", "Printing receipt", receiptRes.id); }} className="flex-1 py-2.5 bg-brand-800 text-cream-50 rounded-md text-sm hover:bg-brand-900 flex items-center justify-center gap-1">
                <Printer className="w-4 h-4" /> Print Receipt
              </button>
              <button onClick={() => setReceiptRes(null)} className="flex-1 py-2.5 border border-brand-200 rounded-md text-sm hover:bg-brand-50">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
