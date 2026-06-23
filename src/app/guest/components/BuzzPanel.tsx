import { useState } from "react";
import { useApp, type RequestType } from "../../context/AppContext";
import { useToast } from "../../components/ToastProvider";
import { Sparkles, Wrench, Bell, Coffee, AlertCircle, Check, Bed } from "lucide-react";

const QUICK_BUZZ = [
  { type: "Housekeeping" as RequestType, icon: <Sparkles className="w-5 h-5" />, title: "Room Cleaning", details: "Please clean my room", color: "bg-emerald-500" },
  { type: "Maintenance" as RequestType, icon: <Wrench className="w-5 h-5" />, title: "Maintenance", details: "Something needs fixing", color: "bg-amber-500" },
  { type: "Room Change" as RequestType, icon: <Bed className="w-5 h-5" />, title: "Room Change", details: "I want to request another room", color: "bg-rose-500" },
  { type: "Amenities" as RequestType, icon: <Coffee className="w-5 h-5" />, title: "Extra Amenities", details: "I need extra towels / toiletries", color: "bg-blue-500" },
  { type: "Buzz Reception" as RequestType, icon: <Bell className="w-5 h-5" />, title: "Buzz Reception", details: "Front desk assistance needed", color: "bg-gold-500" },
];

export default function BuzzPanel({ onClose }: { onClose: () => void }) {
  const { guestUser, guestBookings, addGuestRequest } = useApp();
  const { addToast } = useToast();
  const [sent, setSent] = useState<string | null>(null);
  const [customMode, setCustomMode] = useState(false);
  const [customTitle, setCustomTitle] = useState("");
  const [customDetails, setCustomDetails] = useState("");
  const [customType, setCustomType] = useState<RequestType>("Concierge");
  const [roomChangeReason, setRoomChangeReason] = useState("Guest Preference");
  const [roomChangeOther, setRoomChangeOther] = useState("");
  const [urgent, setUrgent] = useState(false);

  const activeBooking = guestBookings.find((b) => b.guestUserId === guestUser?.id && (b.status === "Confirmed" || b.status === "Checked-in"));
  const roomNumber = activeBooking?.roomNumber || "Lobby";

  const sendBuzz = (type: RequestType, title: string, details: string, isUrgent = false) => {
    if (!guestUser) return;
    addGuestRequest({
      id: `RQ-${Math.floor(Math.random() * 9000) + 1000}`,
      guestUserId: guestUser.id,
      bookingId: activeBooking?.id,
      type, title, details,
      priority: isUrgent ? "Urgent" : "Normal",
      status: "Pending",
      roomNumber,
      createdAt: new Date().toLocaleString(),
    });
    setSent(title);
    addToast("success", "Buzz sent!", `"${title}" — front desk notified.`);
    setTimeout(() => { setSent(null); onClose(); }, 1500);
  };

  const handleCustom = (e: React.FormEvent) => {
    e.preventDefault();
    const finalDetails = customType === "Room Change"
      ? `Reason: ${roomChangeReason}${roomChangeReason === "Other Concern" && roomChangeOther.trim() ? ` — ${roomChangeOther.trim()}` : ""}${customDetails.trim() ? ` | Details: ${customDetails.trim()}` : ""}`
      : customDetails;
    const finalTitle = customType === "Room Change" && !customTitle.trim() ? "Room Change Request" : customTitle;
    sendBuzz(customType, finalTitle, finalDetails, urgent);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-4 animate-fade-up" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b border-brand-100 flex items-start justify-between">
          <div>
            <div className="text-xs uppercase tracking-wider text-gold-500">Quick Buzz</div>
            <h3 className="font-serif text-2xl text-brand-900">Send a request</h3>
            <div className="text-xs text-brand-600 mt-1">From: Room {roomNumber} · {guestUser?.name}</div>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-full hover:bg-brand-100 flex items-center justify-center text-brand-800">×</button>
        </div>

        <div className="p-6">
          {sent ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8" />
              </div>
              <div className="font-serif text-xl text-brand-900 mb-1">Request Sent</div>
              <div className="text-sm text-brand-600">"{sent}" — our team will respond shortly</div>
            </div>
          ) : !customMode ? (
            <>
              <div className="grid grid-cols-2 gap-3 mb-4">
                {QUICK_BUZZ.map((q) => (
                  <button
                    key={q.title}
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
                    className="p-4 rounded-lg border border-brand-100 hover:border-brand-500 hover:shadow-md transition text-left"
                  >
                    <div className={`w-10 h-10 rounded-full ${q.color} text-white flex items-center justify-center mb-3`}>{q.icon}</div>
                    <div className="font-medium text-brand-900">{q.title}</div>
                    <div className="text-xs text-brand-600 mt-0.5">{q.details}</div>
                  </button>
                ))}
              </div>

              <button onClick={() => setCustomMode(true)} className="w-full py-3 border-2 border-dashed border-brand-200 rounded-lg text-sm text-brand-700 hover:border-brand-400 hover:bg-brand-50 transition">
                + Custom Request
              </button>

              {!activeBooking && (
                <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-md text-xs text-amber-800 flex gap-2 items-start">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <div>You don't have an active stay. Buzz requests will be logged to "Lobby" — for active room requests, please book or check-in first.</div>
                </div>
              )}
            </>
          ) : (
            <form onSubmit={handleCustom} className="space-y-3">
              <label className="block">
                <span className="text-xs uppercase tracking-wider text-brand-700">Request Type</span>
                <select value={customType} onChange={(e) => setCustomType(e.target.value as RequestType)} className="mt-1 w-full px-3 py-2 border border-brand-200 rounded-md bg-white">
                  <option>Housekeeping</option>
                  <option>Maintenance</option>
                  <option>Room Change</option>
                  <option>Concierge</option>
                  <option>Amenities</option>
                  <option>Buzz Reception</option>
                </select>
              </label>
              <label className="block">
                <span className="text-xs uppercase tracking-wider text-brand-700">Title</span>
                <input required value={customTitle} onChange={(e) => setCustomTitle(e.target.value)} placeholder="e.g. AC not cooling" className="mt-1 w-full px-3 py-2 border border-brand-200 rounded-md" />
              </label>
              {customType === "Room Change" && (
                <div className="grid md:grid-cols-2 gap-3">
                  <label className="block">
                    <span className="text-xs uppercase tracking-wider text-brand-700">Room Change Reason</span>
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
                    <label className="block">
                      <span className="text-xs uppercase tracking-wider text-brand-700">Other Concern</span>
                      <input value={roomChangeOther} onChange={(e) => setRoomChangeOther(e.target.value)} placeholder="Describe the concern" className="mt-1 w-full px-3 py-2 border border-brand-200 rounded-md" />
                    </label>
                  )}
                </div>
              )}
              <label className="block">
                <span className="text-xs uppercase tracking-wider text-brand-700">Details</span>
                <textarea required value={customDetails} onChange={(e) => setCustomDetails(e.target.value)} rows={3} placeholder={customType === "Room Change" ? "Tell us your preferred room or concern..." : "Tell us more..."} className="mt-1 w-full px-3 py-2 border border-brand-200 rounded-md resize-none" />
              </label>
              <label className="flex items-center gap-2 text-sm text-brand-800">
                <input type="checkbox" checked={urgent} onChange={(e) => setUrgent(e.target.checked)} className="h-4 w-4 accent-red-600" />
                Mark as urgent
              </label>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setCustomMode(false)} className="flex-1 py-2.5 border border-brand-200 rounded-md text-sm hover:bg-brand-50">Back</button>
                <button className="flex-1 py-2.5 bg-brand-800 text-cream-50 rounded-md text-sm hover:bg-brand-900">Send Buzz</button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
