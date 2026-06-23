import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PartyPopper, Users, CalendarDays, DollarSign, Plus, FileText, Sparkles, MapPin, Utensils, Tv, Trash2, Printer, Save, X, ImageOff } from "lucide-react";

type EventType = "Wedding" | "Conference" | "Banquet" | "Corporate Meeting";
type EventStatus = "Proposal" | "Confirmed" | "In Progress" | "Completed";

interface BeoAgendaItem { time: string; activity: string; }
interface BeoDetails {
  setup_style?: string;
  setup_time?: string;
  start_time?: string;
  end_time?: string;
  teardown_time?: string;
  contact_name?: string;
  contact_phone?: string;
  contact_email?: string;
  menu?: string;
  beverages?: string;
  equipment?: string;
  staffing?: string;
  floral?: string;
  notes?: string;
  agenda?: BeoAgendaItem[];
  generated_at?: string;
}

interface EventRow {
  id: string;
  title: string;
  client: string | null;
  type: EventType;
  venue: string | null;
  date: string | null;
  guests: number;
  budget: number;
  status: EventStatus;
  catering: string | null;
  av_requirements: string[];
  beo: BeoDetails | null;
}

interface VenueRow {
  id: string;
  name: string;
  capacity: number;
  area: string | null;
  features: string[];
  rate: number;
  active: boolean;
  image_url: string | null;
}

const typeColors: Record<string, string> = {
  Wedding: "bg-pink-100 text-pink-800",
  Conference: "bg-blue-100 text-blue-800",
  Banquet: "bg-amber-100 text-amber-800",
  "Corporate Meeting": "bg-slate-200 text-slate-800",
};

const SETUP_STYLES = ["Rounds of 10", "Theater", "Classroom", "U-Shape", "Boardroom", "Banquet", "Cocktail", "Reception"];

export default function Events() {
  const [events, setEvents] = useState<EventRow[]>([]);
  const [venues, setVenues] = useState<VenueRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [prefillVenue, setPrefillVenue] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [beoEvent, setBeoEvent] = useState<EventRow | null>(null);
  const [calView, setCalView] = useState<"list" | "month">("list");
  const [monthAnchor, setMonthAnchor] = useState<Date>(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  const loadEvents = async () => {
    const { data, error } = await supabase.from("events").select("*").order("date", { ascending: true });
    if (error) setError(error.message);
    else setEvents((data ?? []).map((d: any) => ({
      ...d,
      av_requirements: Array.isArray(d.av_requirements) ? d.av_requirements : [],
      beo: d.beo ?? null,
    })));
  };

  const loadVenues = async () => {
    const { data, error } = await supabase.from("venues").select("*").eq("active", true).order("rate", { ascending: false });
    if (error) setError(error.message);
    else setVenues((data ?? []).map((v: any) => ({ ...v, features: Array.isArray(v.features) ? v.features : [] })));
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      await Promise.all([loadEvents(), loadVenues()]);
      setLoading(false);
    })();
    const ch = supabase
      .channel("events-venues-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "events" }, () => loadEvents())
      .on("postgres_changes", { event: "*", schema: "public", table: "venues" }, () => loadVenues())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const bookingsByVenue = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth();
    const map = new Map<string, number>();
    for (const e of events) {
      if (!e.venue || !e.date || e.status === "Completed") continue;
      const d = new Date(e.date);
      if (d.getFullYear() === y && d.getMonth() === m) {
        map.set(e.venue, (map.get(e.venue) ?? 0) + 1);
      }
    }
    return map;
  }, [events]);

  const totalRevenue = events.reduce((s, e) => s + Number(e.budget || 0), 0);
  const pipeline = events.filter((e) => e.status === "Proposal").length;
  const totalGuests = events.reduce((s, e) => s + (e.guests || 0), 0);

  const openNew = (venueName?: string) => {
    setPrefillVenue(venueName ?? "");
    setShowNew(true);
  };

  const createProposal = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const row = {
      id: `EVT-${Date.now().toString(36).toUpperCase()}`,
      title: String(fd.get("title") || ""),
      client: String(fd.get("client") || ""),
      type: String(fd.get("type") || "Wedding") as EventType,
      venue: String(fd.get("venue") || ""),
      date: String(fd.get("date") || ""),
      guests: Number(fd.get("guests") || 0),
      budget: Number(fd.get("budget") || 0),
      status: "Proposal" as EventStatus,
      catering: String(fd.get("catering") || ""),
      av_requirements: [],
    };
    const { error } = await supabase.from("events").insert(row);
    setSaving(false);
    if (error) { setError(error.message); return; }
    setShowNew(false);
    setPrefillVenue("");
    loadEvents();
  };

  const updateStatus = async (id: string, status: EventStatus) => {
    const { error } = await supabase.from("events").update({ status }).eq("id", id);
    if (error) setError(error.message);
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this event?")) return;
    const { error } = await supabase.from("events").delete().eq("id", id);
    if (error) setError(error.message);
  };

  const openBeo = (e: EventRow) => setBeoEvent(e);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="text-xs uppercase tracking-[0.25em] text-gold-500 font-medium mb-1">MICE Sales</div>
          <h1 className="font-serif text-4xl text-brand-900">Groups, Events & Banquets</h1>
          <p className="text-brand-700 mt-1">Weddings, conferences, and banquet management.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => openNew()} className="px-4 py-2 bg-brand-800 text-cream-50 rounded-md text-sm hover:bg-brand-900 flex items-center gap-2"><Plus className="w-4 h-4" /> New RFP</button>
        </div>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded text-sm">{error}</div>}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-brand-100 p-5">
          <PartyPopper className="w-5 h-5 text-brand-500 mb-2" />
          <div className="font-serif text-3xl text-brand-900">{events.length}</div>
          <div className="text-sm text-brand-700">Active Events</div>
        </div>
        <div className="bg-white rounded-xl border border-brand-100 p-5">
          <DollarSign className="w-5 h-5 text-gold-500 mb-2" />
          <div className="font-serif text-3xl text-brand-900">₱{(totalRevenue / 1000).toFixed(0)}k</div>
          <div className="text-sm text-brand-700">Pipeline Value</div>
        </div>
        <div className="bg-white rounded-xl border border-brand-100 p-5">
          <Sparkles className="w-5 h-5 text-amber-500 mb-2" />
          <div className="font-serif text-3xl text-brand-900">{pipeline}</div>
          <div className="text-sm text-brand-700">Open Proposals</div>
        </div>
        <div className="bg-white rounded-xl border border-brand-100 p-5">
          <Users className="w-5 h-5 text-indigo-500 mb-2" />
          <div className="font-serif text-3xl text-brand-900">{totalGuests}</div>
          <div className="text-sm text-brand-700">Total Guests</div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-brand-100 p-6">
        <h3 className="font-serif text-xl text-brand-900 mb-1">Venue Inventory</h3>
        <div className="text-xs text-brand-600 mb-4">Live bookings this month — reserve any venue</div>
        {venues.length === 0 ? (
          <div className="text-sm text-brand-600 py-6 text-center">No venues configured.</div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {venues.map((v) => {
              const booked = bookingsByVenue.get(v.name) ?? 0;
              const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
              const utilization = Math.min(100, Math.round((booked / daysInMonth) * 100));
              const venueEvents = events.filter((e) => e.venue === v.name && e.status !== "Completed").slice(0, 3);
              return (
                <div key={v.id} className="border border-brand-100 rounded-lg overflow-hidden flex flex-col">
                  <div className="relative h-36 bg-brand-100 group">
                    {v.image_url ? (
                      <img src={v.image_url} alt={v.name} className="w-full h-full object-cover" loading="lazy" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-brand-400"><ImageOff className="w-8 h-8" /></div>
                    )}
                    <div className="absolute top-2 right-2 bg-white/95 px-2 py-0.5 rounded text-xs font-medium text-brand-900">₱{Number(v.rate).toLocaleString()}</div>
                    <div className="absolute inset-x-0 bottom-0 p-2 flex gap-1 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition">
                      <label className="flex-1 cursor-pointer text-center text-[11px] px-2 py-1 bg-white/95 hover:bg-white text-brand-900 rounded">
                        {v.image_url ? "Replace" : "Upload"}
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            e.target.value = "";
                            if (!file) return;
                            if (file.size > 5 * 1024 * 1024) { alert("Image too large (max 5MB)."); return; }
                            try {
                              const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
                              const path = `venues/${v.id}-${Date.now()}.${ext}`;
                              const { error: upErr } = await supabase.storage.from("room-images").upload(path, file, { cacheControl: "31536000", contentType: file.type, upsert: false });
                              if (upErr) throw upErr;
                              const { data: pub } = supabase.storage.from("room-images").getPublicUrl(path);
                              const { error: updErr } = await supabase.from("venues").update({ image_url: pub.publicUrl }).eq("id", v.id);
                              if (updErr) throw updErr;
                              loadVenues();
                            } catch (err) {
                              alert(`Upload failed: ${(err as Error).message}`);
                            }
                          }}
                        />
                      </label>
                      <button
                        type="button"
                        onClick={async () => {
                          const url = window.prompt("Paste image URL (leave blank to remove):", v.image_url ?? "");
                          if (url === null) return;
                          const next = url.trim() === "" ? null : url.trim();
                          const { error } = await supabase.from("venues").update({ image_url: next }).eq("id", v.id);
                          if (error) { alert(error.message); return; }
                          loadVenues();
                        }}
                        className="text-[11px] px-2 py-1 bg-white/95 hover:bg-white text-brand-900 rounded"
                      >
                        URL
                      </button>
                    </div>
                  </div>
                  <div className="p-4 flex flex-col flex-1">
                    <div className="mb-2">
                      <div className="font-medium text-brand-900">{v.name}</div>
                      <div className="text-xs text-brand-500">{v.area}</div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-brand-700 mb-3">
                      <Users className="w-3 h-3" /> Up to {v.capacity}
                    </div>
                    <div className="flex flex-wrap gap-1 mb-3">
                      {v.features.map((f) => <span key={f} className="text-[10px] px-2 py-0.5 bg-brand-50 text-brand-700 rounded-full">{f}</span>)}
                    </div>
                    <div className="text-xs mb-3">
                      <div className="flex justify-between mb-1"><span className="text-brand-600">Utilization ({booked} booking{booked === 1 ? "" : "s"})</span><span className="font-medium">{utilization}%</span></div>
                      <div className="h-1.5 bg-brand-100 rounded-full overflow-hidden">
                        <div className="h-full bg-brand-600" style={{ width: `${utilization}%` }} />
                      </div>
                    </div>
                    {venueEvents.length > 0 && (
                      <div className="text-[11px] text-brand-700 mb-3 space-y-1">
                        {venueEvents.map((e) => (
                          <div key={e.id} className="flex justify-between gap-2">
                            <span className="truncate">{e.date} · {e.title}</span>
                            <span className="text-brand-500">{e.status}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    <button
                      onClick={() => openNew(v.name)}
                      className="mt-auto px-3 py-1.5 bg-brand-800 text-cream-50 rounded text-xs hover:bg-brand-900 inline-flex items-center justify-center gap-1"
                    >
                      <Plus className="w-3 h-3" /> Reserve venue
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl border border-brand-100 p-6">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <h3 className="font-serif text-xl text-brand-900">Event Calendar</h3>
          <div className="inline-flex rounded-md border border-brand-200 overflow-hidden text-xs">
            <button
              type="button"
              onClick={() => setCalView("list")}
              className={`px-3 py-1.5 ${calView === "list" ? "bg-brand-800 text-cream-50" : "bg-white text-brand-700 hover:bg-brand-50"}`}
            >List</button>
            <button
              type="button"
              onClick={() => setCalView("month")}
              className={`px-3 py-1.5 border-l border-brand-200 ${calView === "month" ? "bg-brand-800 text-cream-50" : "bg-white text-brand-700 hover:bg-brand-50"}`}
            >Month</button>
          </div>
        </div>
        {loading ? (
          <div className="text-sm text-brand-600 py-8 text-center">Loading events…</div>
        ) : events.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-brand-200 rounded-lg">
            <PartyPopper className="w-10 h-10 text-brand-300 mx-auto mb-3" />
            <div className="text-brand-900 font-medium mb-1">No events yet</div>
            <div className="text-sm text-brand-600 mb-4">Create your first proposal to start tracking groups and events.</div>
            <button onClick={() => openNew()} className="px-4 py-2 bg-brand-800 text-cream-50 rounded-md text-sm hover:bg-brand-900 inline-flex items-center gap-2"><Plus className="w-4 h-4" /> New RFP</button>
          </div>
        ) : calView === "month" ? (
          (() => {
            const year = monthAnchor.getFullYear();
            const month = monthAnchor.getMonth();
            const firstDow = (new Date(year, month, 1).getDay() + 6) % 7; // Mon=0
            const gridStart = new Date(year, month, 1 - firstDow);
            const days: Date[] = Array.from({ length: 42 }, (_, i) => {
              const d = new Date(gridStart);
              d.setDate(gridStart.getDate() + i);
              return d;
            });
            const todayStr = new Date().toISOString().slice(0, 10);
            const eventsByDate = new Map<string, EventRow[]>();
            for (const e of events) {
              if (!e.date) continue;
              const key = e.date.slice(0, 10);
              const arr = eventsByDate.get(key) ?? [];
              arr.push(e);
              eventsByDate.set(key, arr);
            }
            const monthName = monthAnchor.toLocaleString("en-US", { month: "long", year: "numeric" });
            const dowLabels = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
            return (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="font-serif text-lg text-brand-900">{monthName}</div>
                  <div className="flex gap-1 text-xs">
                    <button onClick={() => setMonthAnchor(new Date(year, month - 1, 1))} className="px-2 py-1 border border-brand-200 rounded hover:bg-brand-50">‹ Prev</button>
                    <button onClick={() => { const t = new Date(); setMonthAnchor(new Date(t.getFullYear(), t.getMonth(), 1)); }} className="px-2 py-1 border border-brand-200 rounded hover:bg-brand-50">Today</button>
                    <button onClick={() => setMonthAnchor(new Date(year, month + 1, 1))} className="px-2 py-1 border border-brand-200 rounded hover:bg-brand-50">Next ›</button>
                  </div>
                </div>
                <div className="grid grid-cols-7 gap-px bg-brand-100 border border-brand-100 rounded-lg overflow-hidden">
                  {dowLabels.map((l) => (
                    <div key={l} className="bg-brand-50 px-2 py-1.5 text-[11px] uppercase tracking-wider text-brand-600 text-center">{l}</div>
                  ))}
                  {days.map((d) => {
                    const key = d.toISOString().slice(0, 10);
                    const inMonth = d.getMonth() === month;
                    const isToday = key === todayStr;
                    const dayEvents = eventsByDate.get(key) ?? [];
                    return (
                      <div key={key} className={`bg-white min-h-[96px] p-1.5 ${inMonth ? "" : "opacity-50"} ${isToday ? "ring-1 ring-inset ring-brand-400" : ""}`}>
                        <div className="text-[11px] text-brand-600 mb-1">{d.getDate()}</div>
                        <div className="space-y-1">
                          {dayEvents.slice(0, 3).map((e) => (
                            <button
                              key={e.id}
                              onClick={() => openBeo(e)}
                              title={`${e.title} · ${e.venue ?? ""}`}
                              className={`block w-full text-left text-[10px] px-1.5 py-0.5 rounded truncate ${typeColors[e.type] ?? "bg-slate-100 text-slate-700"} hover:opacity-80`}
                            >
                              {e.title}
                            </button>
                          ))}
                          {dayEvents.length > 3 && (
                            <div className="text-[10px] text-brand-500 px-1">+{dayEvents.length - 3} more</div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()
        ) : (
          <div className="space-y-3">
            {events.map((e) => (
              <div key={e.id} className="border border-brand-100 rounded-lg p-4 hover:border-brand-300 transition">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${typeColors[e.type] ?? "bg-slate-100 text-slate-700"}`}>{e.type}</span>
                      <select
                        value={e.status}
                        onChange={(ev) => updateStatus(e.id, ev.target.value as EventStatus)}
                        className={`text-xs px-2 py-0.5 rounded-full border-0 cursor-pointer ${e.status === "Confirmed" ? "bg-emerald-100 text-emerald-800" : e.status === "Proposal" ? "bg-yellow-100 text-yellow-800" : e.status === "In Progress" ? "bg-blue-100 text-blue-800" : "bg-slate-100 text-slate-700"}`}
                      >
                        <option>Proposal</option><option>Confirmed</option><option>In Progress</option><option>Completed</option>
                      </select>
                      <span className="text-xs text-brand-500">{e.id}</span>
                      {e.beo && <span className="text-[10px] px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full">BEO ready</span>}
                    </div>
                    <div className="font-medium text-brand-900">{e.title}</div>
                    <div className="text-xs text-brand-600 mt-1">Client: {e.client || "—"}</div>
                    <div className="flex gap-4 mt-2 text-xs text-brand-700 flex-wrap">
                      {e.date && <span className="flex items-center gap-1"><CalendarDays className="w-3 h-3" /> {e.date}</span>}
                      {e.venue && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {e.venue}</span>}
                      <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {e.guests} pax</span>
                      {e.catering && <span className="flex items-center gap-1"><Utensils className="w-3 h-3" /> {e.catering}</span>}
                    </div>
                    {e.av_requirements.length > 0 && (
                      <div className="flex gap-1 mt-2 flex-wrap items-center">
                        <Tv className="w-3 h-3 text-brand-500" />
                        {e.av_requirements.map((a) => <span key={a} className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-700 rounded-full">{a}</span>)}
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="font-serif text-2xl text-brand-900">₱{Number(e.budget).toLocaleString()}</div>
                    <div className="text-xs text-brand-500 mb-2">event value</div>
                    <div className="flex gap-2 justify-end">
                      <button onClick={() => openBeo(e)} className="text-xs px-2 py-1 border border-brand-200 rounded hover:bg-brand-50 inline-flex items-center gap-1"><FileText className="w-3 h-3" /> BEO</button>
                      <button onClick={() => remove(e.id)} className="text-xs px-2 py-1 border border-red-200 text-red-700 rounded hover:bg-red-50 inline-flex items-center gap-1"><Trash2 className="w-3 h-3" /> Delete</button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>


      {showNew && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => { setShowNew(false); setPrefillVenue(""); }}>
          <form onSubmit={createProposal} className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-brand-100">
              <div className="text-xs uppercase tracking-wider text-gold-500">{prefillVenue ? "Reserve Venue" : "New Proposal"}</div>
              <h3 className="font-serif text-2xl text-brand-900">{prefillVenue ? `Book ${prefillVenue}` : "Create RFP"}</h3>
            </div>
            <div className="p-6 grid md:grid-cols-2 gap-4">
              <label className="md:col-span-2">
                <span className="text-xs uppercase tracking-wider text-brand-700">Event Title</span>
                <input name="title" required className="w-full mt-1 px-3 py-2 border border-brand-200 rounded-md" />
              </label>
              <label>
                <span className="text-xs uppercase tracking-wider text-brand-700">Client Name</span>
                <input name="client" required className="w-full mt-1 px-3 py-2 border border-brand-200 rounded-md" />
              </label>
              <label>
                <span className="text-xs uppercase tracking-wider text-brand-700">Event Type</span>
                <select name="type" className="w-full mt-1 px-3 py-2 border border-brand-200 rounded-md bg-white">
                  <option>Wedding</option><option>Conference</option><option>Banquet</option><option>Corporate Meeting</option>
                </select>
              </label>
              <label>
                <span className="text-xs uppercase tracking-wider text-brand-700">Venue</span>
                <select name="venue" defaultValue={prefillVenue || venues[0]?.name || ""} className="w-full mt-1 px-3 py-2 border border-brand-200 rounded-md bg-white">
                  {venues.map((v) => <option key={v.id} value={v.name}>{v.name}</option>)}
                </select>
              </label>
              <label>
                <span className="text-xs uppercase tracking-wider text-brand-700">Event Date</span>
                <input name="date" type="date" required className="w-full mt-1 px-3 py-2 border border-brand-200 rounded-md" />
              </label>
              <label>
                <span className="text-xs uppercase tracking-wider text-brand-700">Expected Guests</span>
                <input name="guests" type="number" required className="w-full mt-1 px-3 py-2 border border-brand-200 rounded-md" />
              </label>
              <label>
                <span className="text-xs uppercase tracking-wider text-brand-700">Budget (₱)</span>
                <input name="budget" type="number" required defaultValue={prefillVenue ? venues.find((v) => v.name === prefillVenue)?.rate ?? "" : ""} className="w-full mt-1 px-3 py-2 border border-brand-200 rounded-md" />
              </label>
              <label className="md:col-span-2">
                <span className="text-xs uppercase tracking-wider text-brand-700">Catering Preference</span>
                <input name="catering" required className="w-full mt-1 px-3 py-2 border border-brand-200 rounded-md" />
              </label>
            </div>
            <div className="p-6 border-t border-brand-100 flex gap-2 justify-end">
              <button type="button" onClick={() => { setShowNew(false); setPrefillVenue(""); }} className="px-4 py-2 border border-brand-200 rounded-md text-sm">Cancel</button>
              <button disabled={saving} className="px-4 py-2 bg-brand-800 text-cream-50 rounded-md text-sm hover:bg-brand-900 disabled:opacity-60">{saving ? "Saving…" : prefillVenue ? "Confirm Reservation" : "Generate Proposal"}</button>
            </div>
          </form>
        </div>
      )}

      {beoEvent && (
        <BeoModal
          event={beoEvent}
          onClose={() => setBeoEvent(null)}
          onSaved={() => { loadEvents(); }}
        />
      )}
    </div>
  );
}

function BeoModal({ event, onClose, onSaved }: { event: EventRow; onClose: () => void; onSaved: () => void }) {
  const [beo, setBeo] = useState<BeoDetails>(() => event.beo ?? {
    setup_style: "Rounds of 10",
    setup_time: "08:00",
    start_time: "18:00",
    end_time: "23:00",
    teardown_time: "23:30",
    contact_name: event.client ?? "",
    contact_phone: "",
    contact_email: "",
    menu: event.catering ?? "",
    beverages: "Open bar — beer, wine, soft drinks",
    equipment: "PA system, 2 wireless mics, projector, screen",
    staffing: "1 captain, 4 servers, 1 bartender",
    floral: "",
    notes: "",
    agenda: [
      { time: "18:00", activity: "Guest arrival & cocktails" },
      { time: "19:00", activity: "Welcome remarks" },
      { time: "19:30", activity: "Dinner service" },
      { time: "21:00", activity: "Program / entertainment" },
      { time: "22:30", activity: "Closing" },
    ],
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  const update = (patch: Partial<BeoDetails>) => setBeo((b) => ({ ...b, ...patch }));
  const updateAgenda = (i: number, patch: Partial<BeoAgendaItem>) =>
    setBeo((b) => ({ ...b, agenda: (b.agenda ?? []).map((a, idx) => idx === i ? { ...a, ...patch } : a) }));
  const addAgenda = () => setBeo((b) => ({ ...b, agenda: [...(b.agenda ?? []), { time: "", activity: "" }] }));
  const removeAgenda = (i: number) => setBeo((b) => ({ ...b, agenda: (b.agenda ?? []).filter((_, idx) => idx !== i) }));

  const save = async () => {
    setSaving(true); setErr(null);
    const payload = { ...beo, generated_at: new Date().toISOString() };
    const { error } = await supabase.from("events").update({ beo: payload as any }).eq("id", event.id);
    setSaving(false);
    if (error) { setErr(error.message); return; }
    onSaved();
    onClose();
  };

  const doPrint = () => {
    const html = printRef.current?.innerHTML ?? "";
    const w = window.open("", "_blank", "width=900,height=1000");
    if (!w) return;
    w.document.write(`<!doctype html><html><head><title>BEO ${event.id}</title>
      <style>
        body{font-family:Georgia,serif;color:#111;padding:32px;max-width:780px;margin:auto;}
        h1{font-size:22px;margin:0 0 4px;} h2{font-size:14px;text-transform:uppercase;letter-spacing:.15em;color:#555;margin:24px 0 8px;border-bottom:1px solid #ddd;padding-bottom:4px;}
        .row{display:flex;gap:24px;flex-wrap:wrap;margin-bottom:8px;}
        .row > div{flex:1;min-width:180px;}
        .lbl{font-size:10px;text-transform:uppercase;letter-spacing:.1em;color:#888;}
        .val{font-size:13px;}
        table{width:100%;border-collapse:collapse;margin-top:8px;}
        th,td{text-align:left;padding:6px 8px;border-bottom:1px solid #eee;font-size:12px;}
        th{background:#f7f5f2;font-size:10px;text-transform:uppercase;letter-spacing:.1em;}
        .foot{margin-top:32px;font-size:11px;color:#888;border-top:1px solid #ddd;padding-top:8px;}
      </style></head><body>${html}<div class="foot">Generated ${new Date().toLocaleString()} · ${event.id}</div></body></html>`);
    w.document.close();
    w.focus();
    setTimeout(() => w.print(), 250);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[92vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b border-brand-100 flex items-start justify-between gap-4">
          <div>
            <div className="text-xs uppercase tracking-wider text-gold-500">Banquet Event Order</div>
            <h3 className="font-serif text-2xl text-brand-900">{event.title}</h3>
            <div className="text-xs text-brand-600 mt-1">{event.id} · {event.venue} · {event.date} · {event.guests} pax</div>
          </div>
          <button onClick={onClose} className="text-brand-500 hover:text-brand-900"><X className="w-5 h-5" /></button>
        </div>

        {err && <div className="mx-6 mt-4 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">{err}</div>}

        <div className="p-6 grid md:grid-cols-3 gap-4">
          <label><span className="text-xs uppercase tracking-wider text-brand-700">Setup Style</span>
            <select value={beo.setup_style ?? ""} onChange={(e) => update({ setup_style: e.target.value })} className="w-full mt-1 px-3 py-2 border border-brand-200 rounded-md bg-white">
              {SETUP_STYLES.map((s) => <option key={s}>{s}</option>)}
            </select>
          </label>
          <label><span className="text-xs uppercase tracking-wider text-brand-700">Setup Time</span>
            <input type="time" value={beo.setup_time ?? ""} onChange={(e) => update({ setup_time: e.target.value })} className="w-full mt-1 px-3 py-2 border border-brand-200 rounded-md" />
          </label>
          <label><span className="text-xs uppercase tracking-wider text-brand-700">Teardown</span>
            <input type="time" value={beo.teardown_time ?? ""} onChange={(e) => update({ teardown_time: e.target.value })} className="w-full mt-1 px-3 py-2 border border-brand-200 rounded-md" />
          </label>
          <label><span className="text-xs uppercase tracking-wider text-brand-700">Start Time</span>
            <input type="time" value={beo.start_time ?? ""} onChange={(e) => update({ start_time: e.target.value })} className="w-full mt-1 px-3 py-2 border border-brand-200 rounded-md" />
          </label>
          <label><span className="text-xs uppercase tracking-wider text-brand-700">End Time</span>
            <input type="time" value={beo.end_time ?? ""} onChange={(e) => update({ end_time: e.target.value })} className="w-full mt-1 px-3 py-2 border border-brand-200 rounded-md" />
          </label>
          <div />

          <label><span className="text-xs uppercase tracking-wider text-brand-700">Contact Name</span>
            <input value={beo.contact_name ?? ""} onChange={(e) => update({ contact_name: e.target.value })} className="w-full mt-1 px-3 py-2 border border-brand-200 rounded-md" />
          </label>
          <label><span className="text-xs uppercase tracking-wider text-brand-700">Phone</span>
            <input value={beo.contact_phone ?? ""} onChange={(e) => update({ contact_phone: e.target.value })} className="w-full mt-1 px-3 py-2 border border-brand-200 rounded-md" />
          </label>
          <label><span className="text-xs uppercase tracking-wider text-brand-700">Email</span>
            <input type="email" value={beo.contact_email ?? ""} onChange={(e) => update({ contact_email: e.target.value })} className="w-full mt-1 px-3 py-2 border border-brand-200 rounded-md" />
          </label>

          <label className="md:col-span-3"><span className="text-xs uppercase tracking-wider text-brand-700">Menu / F&B</span>
            <textarea value={beo.menu ?? ""} onChange={(e) => update({ menu: e.target.value })} rows={2} className="w-full mt-1 px-3 py-2 border border-brand-200 rounded-md" />
          </label>
          <label className="md:col-span-3"><span className="text-xs uppercase tracking-wider text-brand-700">Beverages</span>
            <textarea value={beo.beverages ?? ""} onChange={(e) => update({ beverages: e.target.value })} rows={2} className="w-full mt-1 px-3 py-2 border border-brand-200 rounded-md" />
          </label>
          <label className="md:col-span-3"><span className="text-xs uppercase tracking-wider text-brand-700">AV & Equipment</span>
            <textarea value={beo.equipment ?? ""} onChange={(e) => update({ equipment: e.target.value })} rows={2} className="w-full mt-1 px-3 py-2 border border-brand-200 rounded-md" />
          </label>
          <label className="md:col-span-3"><span className="text-xs uppercase tracking-wider text-brand-700">Staffing</span>
            <textarea value={beo.staffing ?? ""} onChange={(e) => update({ staffing: e.target.value })} rows={2} className="w-full mt-1 px-3 py-2 border border-brand-200 rounded-md" />
          </label>
          <label className="md:col-span-3"><span className="text-xs uppercase tracking-wider text-brand-700">Floral / Decor</span>
            <input value={beo.floral ?? ""} onChange={(e) => update({ floral: e.target.value })} className="w-full mt-1 px-3 py-2 border border-brand-200 rounded-md" />
          </label>
          <label className="md:col-span-3"><span className="text-xs uppercase tracking-wider text-brand-700">Special Notes</span>
            <textarea value={beo.notes ?? ""} onChange={(e) => update({ notes: e.target.value })} rows={3} className="w-full mt-1 px-3 py-2 border border-brand-200 rounded-md" />
          </label>

          <div className="md:col-span-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs uppercase tracking-wider text-brand-700">Run Sheet / Agenda</span>
              <button type="button" onClick={addAgenda} className="text-xs px-2 py-1 border border-brand-200 rounded hover:bg-brand-50 inline-flex items-center gap-1"><Plus className="w-3 h-3" /> Row</button>
            </div>
            <div className="space-y-2">
              {(beo.agenda ?? []).map((a, i) => (
                <div key={i} className="flex gap-2">
                  <input type="time" value={a.time} onChange={(e) => updateAgenda(i, { time: e.target.value })} className="w-32 px-3 py-2 border border-brand-200 rounded-md text-sm" />
                  <input value={a.activity} onChange={(e) => updateAgenda(i, { activity: e.target.value })} placeholder="Activity" className="flex-1 px-3 py-2 border border-brand-200 rounded-md text-sm" />
                  <button type="button" onClick={() => removeAgenda(i)} className="px-2 text-red-600 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Printable preview (hidden visually, used for print) */}
        <div className="hidden">
          <div ref={printRef}>
            <h1>Banquet Event Order — {event.title}</h1>
            <div style={{ fontSize: 12, color: "#666" }}>{event.id} · {event.type} · {event.venue}</div>
            <h2>Event Details</h2>
            <div className="row">
              <div><div className="lbl">Date</div><div className="val">{event.date}</div></div>
              <div><div className="lbl">Guests</div><div className="val">{event.guests}</div></div>
              <div><div className="lbl">Setup Style</div><div className="val">{beo.setup_style}</div></div>
              <div><div className="lbl">Budget</div><div className="val">₱{Number(event.budget).toLocaleString()}</div></div>
            </div>
            <div className="row">
              <div><div className="lbl">Setup</div><div className="val">{beo.setup_time}</div></div>
              <div><div className="lbl">Start</div><div className="val">{beo.start_time}</div></div>
              <div><div className="lbl">End</div><div className="val">{beo.end_time}</div></div>
              <div><div className="lbl">Teardown</div><div className="val">{beo.teardown_time}</div></div>
            </div>
            <h2>Contact</h2>
            <div className="row">
              <div><div className="lbl">Name</div><div className="val">{beo.contact_name}</div></div>
              <div><div className="lbl">Phone</div><div className="val">{beo.contact_phone}</div></div>
              <div><div className="lbl">Email</div><div className="val">{beo.contact_email}</div></div>
            </div>
            <h2>Menu & Beverages</h2>
            <div className="val">{beo.menu}</div>
            <div className="val" style={{ marginTop: 4 }}>{beo.beverages}</div>
            <h2>AV & Equipment</h2><div className="val">{beo.equipment}</div>
            <h2>Staffing</h2><div className="val">{beo.staffing}</div>
            {beo.floral && (<><h2>Floral / Decor</h2><div className="val">{beo.floral}</div></>)}
            <h2>Run Sheet</h2>
            <table><thead><tr><th style={{ width: 90 }}>Time</th><th>Activity</th></tr></thead>
              <tbody>{(beo.agenda ?? []).map((a, i) => <tr key={i}><td>{a.time}</td><td>{a.activity}</td></tr>)}</tbody>
            </table>
            {beo.notes && (<><h2>Special Notes</h2><div className="val">{beo.notes}</div></>)}
          </div>
        </div>

        <div className="p-6 border-t border-brand-100 flex flex-wrap gap-2 justify-end">
          <button onClick={onClose} className="px-4 py-2 border border-brand-200 rounded-md text-sm">Close</button>
          <button onClick={doPrint} className="px-4 py-2 border border-brand-200 rounded-md text-sm inline-flex items-center gap-2"><Printer className="w-4 h-4" /> Print / PDF</button>
          <button onClick={save} disabled={saving} className="px-4 py-2 bg-brand-800 text-cream-50 rounded-md text-sm hover:bg-brand-900 disabled:opacity-60 inline-flex items-center gap-2"><Save className="w-4 h-4" /> {saving ? "Saving…" : "Save BEO"}</button>
        </div>
      </div>
    </div>
  );
}
