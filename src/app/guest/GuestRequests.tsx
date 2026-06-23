import { useState } from "react";
import { useApp, type RequestType, type GuestRequest } from "../context/AppContext";
import { useToast } from "../components/ToastProvider";
import {
  Bell, Sparkles, Wrench, Coffee, MapPin, Plus, Clock, Check,
  AlertTriangle, Pencil, Bed,
} from "lucide-react";

const typeIcons: Record<RequestType, React.ReactNode> = {
  Housekeeping: <Sparkles className="w-4 h-4" />,
  Maintenance: <Wrench className="w-4 h-4" />,
  Concierge: <MapPin className="w-4 h-4" />,
  Amenities: <Coffee className="w-4 h-4" />,
  "Buzz Reception": <Bell className="w-4 h-4" />,
  "Room Change": <Bed className="w-4 h-4" />,
};

const typeColors: Record<RequestType, string> = {
  Housekeeping: "bg-emerald-100 text-emerald-700",
  Maintenance: "bg-amber-100 text-amber-700",
  Concierge: "bg-blue-100 text-blue-700",
  Amenities: "bg-purple-100 text-purple-700",
  "Buzz Reception": "bg-yellow-100 text-yellow-700",
  "Room Change": "bg-rose-100 text-rose-700",
};

const QUICK_BUZZ = [
  { type: "Housekeeping" as RequestType, icon: <Sparkles className="w-5 h-5" />, title: "Room Cleaning", details: "Please clean my room when convenient", color: "from-emerald-500 to-emerald-600" },
  { type: "Maintenance" as RequestType, icon: <Wrench className="w-5 h-5" />, title: "Maintenance Issue", details: "Something needs fixing in my room", color: "from-amber-500 to-amber-600" },
  { type: "Room Change" as RequestType, icon: <Bed className="w-5 h-5" />, title: "Room Change", details: "I want to request a transfer to another room", color: "from-rose-500 to-rose-600" },
  { type: "Amenities" as RequestType, icon: <Coffee className="w-5 h-5" />, title: "Extra Towels", details: "Please bring extra bath towels", color: "from-blue-500 to-blue-600" },
  { type: "Amenities" as RequestType, icon: <Coffee className="w-5 h-5" />, title: "Toiletries", details: "Need extra toiletries (shampoo, soap)", color: "from-purple-500 to-purple-600" },
  { type: "Concierge" as RequestType, icon: <MapPin className="w-5 h-5" />, title: "Local Tips", details: "Recommend nearby attractions / restaurants", color: "from-cyan-500 to-cyan-600" },
  { type: "Buzz Reception" as RequestType, icon: <Bell className="w-5 h-5" />, title: "Buzz Reception", details: "Front desk assistance needed", color: "from-gold-500 to-gold-600" },
];

export default function GuestRequests() {
  const { guestUser, guestBookings, guestRequests, addGuestRequest, updateRequestStatus } = useApp();
  const { addToast } = useToast();
  const [tab, setTab] = useState<"new" | "all">("new");
  const [filter, setFilter] = useState<"all" | "open" | "resolved">("all");
  const [customMode, setCustomMode] = useState(false);
  const [customTitle, setCustomTitle] = useState("");
  const [customDetails, setCustomDetails] = useState("");
  const [customType, setCustomType] = useState<RequestType>("Concierge");
  const [roomChangeReason, setRoomChangeReason] = useState("Guest Preference");
  const [roomChangeOther, setRoomChangeOther] = useState("");
  const [urgent, setUrgent] = useState(false);

  const myRequests = guestRequests.filter((r) => r.guestUserId === guestUser?.id);
  const activeBooking = guestBookings.find((b) => b.guestUserId === guestUser?.id && (b.status === "Confirmed" || b.status === "Checked-in"));
  const roomNumber = activeBooking?.roomNumber || "Lobby";

  const filteredRequests = filter === "all" ? myRequests : filter === "open" ? myRequests.filter((r) => r.status !== "Resolved") : myRequests.filter((r) => r.status === "Resolved");

  const sendBuzz = (type: RequestType, title: string, details: string, isUrgent = false) => {
    if (!guestUser) return;
    const newReq: GuestRequest = {
      id: `RQ-${Math.floor(Math.random() * 9000) + 1000}`,
      guestUserId: guestUser.id,
      bookingId: activeBooking?.id,
      type, title, details,
      priority: isUrgent ? "Urgent" : "Normal",
      status: "Pending",
      roomNumber,
      createdAt: new Date().toLocaleString(),
    };
    addGuestRequest(newReq);
    addToast("success", "Request sent", `"${title}" — our team has been notified.`);
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalDetails = customType === "Room Change"
      ? `Reason: ${roomChangeReason}${roomChangeReason === "Other Concern" && roomChangeOther.trim() ? ` — ${roomChangeOther.trim()}` : ""}${customDetails.trim() ? ` | Details: ${customDetails.trim()}` : ""}`
      : customDetails;
    const finalTitle = customType === "Room Change" && !customTitle.trim() ? "Room Change Request" : customTitle;
    sendBuzz(customType, finalTitle, finalDetails, urgent);
    setCustomTitle("");
    setCustomDetails("");
    setRoomChangeReason("Guest Preference");
    setRoomChangeOther("");
    setUrgent(false);
    setCustomMode(false);
    setTab("all");
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="text-xs uppercase tracking-[0.25em] text-gold-500 font-medium mb-1">Requests & Buzz</div>
        <h1 className="font-serif text-3xl md:text-4xl text-brand-900">Service Requests</h1>
        <p className="text-brand-700 mt-1">Buzz reception, request housekeeping, maintenance & concierge services.</p>
      </div>

      {/* STATUS */}
      {activeBooking ? (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center gap-3">
          <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse" />
          <div className="text-sm">
            <span className="font-medium text-emerald-900">Active stay</span>
            <span className="text-emerald-700"> · Requests will be sent from Room {activeBooking.roomNumber || "TBA"}</span>
          </div>
        </div>
      ) : (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <div className="text-sm text-amber-800">
            No active stay — requests will be logged to "Lobby". For in-room services please book or check-in first.
          </div>
        </div>
      )}

      {/* TABS */}
      <div className="bg-white rounded-xl border border-brand-100 p-2 flex flex-wrap gap-1">
        <button onClick={() => setTab("new")} className={`px-4 py-2 rounded-md text-sm flex items-center gap-2 ${tab === "new" ? "bg-brand-800 text-cream-50 shadow" : "text-brand-700 hover:bg-brand-50"}`}>
          <Plus className="w-4 h-4" /> New Request
        </button>
        <button onClick={() => setTab("all")} className={`px-4 py-2 rounded-md text-sm flex items-center gap-2 ${tab === "all" ? "bg-brand-800 text-cream-50 shadow" : "text-brand-700 hover:bg-brand-50"}`}>
          <Bell className="w-4 h-4" /> My Requests ({myRequests.length})
        </button>
      </div>

      {/* NEW REQUEST */}
      {tab === "new" && (
        <div className="space-y-6">
          {/* QUICK BUZZ */}
          <div className="bg-white rounded-xl border border-brand-100 p-6">
            <h3 className="font-serif text-xl text-brand-900 mb-1 flex items-center gap-2"><Sparkles className="w-5 h-5 text-gold-500" /> Quick Buzz</h3>
            <p className="text-xs text-brand-600 mb-4">Tap any button to instantly send a request to our team</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {QUICK_BUZZ.map((q, i) => (
                <button
                  key={i}
                  onClick={() => {
                    if (q.type === "Room Change") {
                      setCustomMode(true);
                      setCustomType("Room Change");
                      setCustomTitle("Room Change Request");
                      setCustomDetails("");
                      setRoomChangeReason("Guest Preference");
                      setRoomChangeOther("");
                      return;
                    }
                    sendBuzz(q.type, q.title, q.details);
                  }}
                  className="text-left p-4 rounded-lg border border-brand-100 hover:border-brand-500 hover:shadow-md transition group"
                >
                  <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${q.color} text-white flex items-center justify-center mb-3 group-hover:scale-110 transition`}>{q.icon}</div>
                  <div className="font-medium text-brand-900">{q.title}</div>
                  <div className="text-xs text-brand-600 mt-0.5">{q.details}</div>
                </button>
              ))}
            </div>
          </div>

          {/* CUSTOM REQUEST */}
          <div className="bg-white rounded-xl border border-brand-100 p-6">
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-serif text-xl text-brand-900 flex items-center gap-2"><Pencil className="w-5 h-5 text-brand-600" /> Custom Request</h3>
              {!customMode && <button onClick={() => setCustomMode(true)} className="text-xs px-3 py-1.5 bg-brand-50 text-brand-700 rounded-md hover:bg-brand-100">+ Create Custom</button>}
            </div>
            {!customMode ? (
              <p className="text-xs text-brand-600">Need something not listed above? Create a detailed custom request.</p>
            ) : (
              <form onSubmit={handleCustomSubmit} className="space-y-3 mt-3">
                <div className="grid md:grid-cols-2 gap-3">
                  <label className="text-xs uppercase tracking-wider text-brand-700">Request Type
                    <select value={customType} onChange={(e) => setCustomType(e.target.value as RequestType)} className="mt-1 w-full px-3 py-2 border border-brand-200 rounded-md bg-white">
                      <option>Housekeeping</option>
                      <option>Maintenance</option>
                      <option>Room Change</option>
                      <option>Concierge</option>
                      <option>Amenities</option>
                      <option>Buzz Reception</option>
                    </select>
                  </label>
                  <label className="text-xs uppercase tracking-wider text-brand-700">Title
                    <input required value={customTitle} onChange={(e) => setCustomTitle(e.target.value)} placeholder="e.g. AC not cooling" className="mt-1 w-full px-3 py-2 border border-brand-200 rounded-md" />
                  </label>
                </div>
                {customType === "Room Change" && (
                  <div className="grid md:grid-cols-2 gap-3">
                    <label className="text-xs uppercase tracking-wider text-brand-700">Room Change Reason
                      <select value={roomChangeReason} onChange={(e) => setRoomChangeReason(e.target.value)} className="mt-1 w-full px-3 py-2 border border-brand-200 rounded-md bg-white">
                        <option>Guest Preference</option>
                        <option>Noise Concern</option>
                        <option>Maintenance Issue</option>
                        <option>Need Larger Room</option>
                        <option>Need Lower Floor</option>
                        <option>Accessibility Need</option>
                        <option>Other Concern</option>
                      </select>
                    </label>
                    {roomChangeReason === "Other Concern" && (
                      <label className="text-xs uppercase tracking-wider text-brand-700">Other Concern
                        <input value={roomChangeOther} onChange={(e) => setRoomChangeOther(e.target.value)} placeholder="Describe the concern" className="mt-1 w-full px-3 py-2 border border-brand-200 rounded-md" />
                      </label>
                    )}
                  </div>
                )}
                <label className="text-xs uppercase tracking-wider text-brand-700 block">Details
                  <textarea required value={customDetails} onChange={(e) => setCustomDetails(e.target.value)} rows={3} placeholder={customType === "Room Change" ? "Tell us your preferred room or concern..." : "Tell us more..."} className="mt-1 w-full px-3 py-2 border border-brand-200 rounded-md resize-none" />
                </label>
                <label className="flex items-center gap-2 text-sm text-brand-800">
                  <input type="checkbox" checked={urgent} onChange={(e) => setUrgent(e.target.checked)} className="h-4 w-4 accent-red-600" />
                  Mark as urgent (faster response)
                </label>
                <div className="flex gap-2 justify-end">
                  <button type="button" onClick={() => setCustomMode(false)} className="px-4 py-2 border border-brand-200 rounded-md text-sm hover:bg-brand-50">Cancel</button>
                  <button className="px-4 py-2 bg-brand-800 text-cream-50 rounded-md text-sm hover:bg-brand-900">Send Request</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ALL REQUESTS */}
      {tab === "all" && (
        <div className="space-y-4">
          <div className="flex gap-2 items-center flex-wrap">
            {[
              { k: "all", l: `All (${myRequests.length})` },
              { k: "open", l: `Open (${myRequests.filter((r) => r.status !== "Resolved").length})` },
              { k: "resolved", l: `Resolved (${myRequests.filter((r) => r.status === "Resolved").length})` },
            ].map((f) => (
              <button key={f.k} onClick={() => setFilter(f.k as typeof filter)} className={`px-3 py-1.5 text-xs rounded-full ${filter === f.k ? "bg-brand-800 text-cream-50" : "bg-white border border-brand-200 text-brand-700 hover:bg-brand-50"}`}>
                {f.l}
              </button>
            ))}
          </div>

          {filteredRequests.length === 0 ? (
            <div className="bg-white rounded-xl border border-brand-100 p-12 text-center">
              <Bell className="w-12 h-12 mx-auto mb-4 text-brand-300" />
              <h3 className="font-serif text-2xl text-brand-900 mb-2">No requests yet</h3>
              <p className="text-brand-600 mb-6">Use Quick Buzz to send your first request.</p>
              <button onClick={() => setTab("new")} className="px-6 py-3 bg-brand-800 text-cream-50 rounded-md hover:bg-brand-900">+ New Request</button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredRequests.map((r) => (
                <div key={r.id} className="bg-white rounded-xl border border-brand-100 p-5">
                  <div className="flex items-start gap-4">
                    <div className={`w-11 h-11 rounded-full ${typeColors[r.type]} flex items-center justify-center flex-shrink-0`}>{typeIcons[r.type]}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <div className="font-medium text-brand-900">{r.title}</div>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider ${typeColors[r.type]}`}>{r.type}</span>
                        {r.priority === "Urgent" && <span className="text-[10px] px-2 py-0.5 bg-red-100 text-red-800 rounded-full uppercase">⚠ Urgent</span>}
                        <span className="text-[10px] text-brand-500 font-mono">{r.id}</span>
                      </div>
                      <p className="text-sm text-brand-700 mb-2">{r.details}</p>
                      <div className="text-xs text-brand-500 flex items-center gap-3 flex-wrap">
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {r.createdAt}</span>
                        <span>Room {r.roomNumber}</span>
                        {r.resolvedAt && <span className="flex items-center gap-1 text-emerald-700"><Check className="w-3 h-3" /> Resolved {r.resolvedAt}</span>}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 space-y-2">
                      <span className={`block text-xs px-2 py-1 rounded-full ${r.status === "Resolved" ? "bg-emerald-100 text-emerald-800" : r.status === "In Progress" ? "bg-amber-100 text-amber-800" : r.status === "Acknowledged" ? "bg-blue-100 text-blue-800" : "bg-slate-100 text-slate-700"}`}>
                        {r.status}
                      </span>
                      {r.status !== "Resolved" && (
                        <button onClick={() => { if (confirm("Mark this as resolved?")) updateRequestStatus(r.id, "Resolved"); }} className="block text-xs text-brand-600 hover:text-brand-900 underline">Mark resolved</button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
