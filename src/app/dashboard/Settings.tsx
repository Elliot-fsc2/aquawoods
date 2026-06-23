import { Fragment, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { useToast } from "../components/ToastProvider";
import {
  Shield, Users, Building2, Bell, Globe, CreditCard, Palette,
  Bed, Sparkles, Plus, Pencil, Trash2, Check, X, Layers, UserCog, ClipboardList,
  Upload, Image as ImageIcon, Save, UserPlus,
  Search, ArrowUpDown, SlidersHorizontal, ListPlus, KeyRound,
  Mail, Send,
} from "lucide-react";
import type { Guest } from "../data/mockData";
import { uploadRoomImage } from "../lib/uploadRoomImage";
import { supabase } from "@/integrations/supabase/client";

type TabKey = "property" | "rooms" | "guests" | "employees" | "housekeeping" | "roles" | "integrations" | "payments" | "notifications" | "branding" | "security";

const tabs: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  { key: "property", label: "Property", icon: <Building2 className="w-4 h-4" /> },
  { key: "rooms", label: "Rooms & Floors", icon: <Bed className="w-4 h-4" /> },
  { key: "guests", label: "Guests", icon: <UserPlus className="w-4 h-4" /> },
  { key: "employees", label: "Employees", icon: <UserCog className="w-4 h-4" /> },
  { key: "housekeeping", label: "Housekeeping", icon: <Sparkles className="w-4 h-4" /> },
  { key: "roles", label: "Roles & Access", icon: <KeyRound className="w-4 h-4" /> },
  { key: "integrations", label: "Integrations", icon: <Globe className="w-4 h-4" /> },
  { key: "payments", label: "Payments & Tax", icon: <CreditCard className="w-4 h-4" /> },
  { key: "notifications", label: "Notifications", icon: <Bell className="w-4 h-4" /> },
  { key: "branding", label: "Branding", icon: <Palette className="w-4 h-4" /> },
  { key: "security", label: "Security", icon: <Shield className="w-4 h-4" /> },
];

// ---- Types ----
interface Floor { id: string; name: string; level: number; description: string; roomCount: number }
interface RoomCategory { id: string; name: string; floorId: string; basePrice: number; capacity: number; quantity: number; amenities: string; image?: string }
interface Employee { id: string; name: string; position: string; department: string; email: string; phone: string; shift: string; status: "Active" | "On Leave" | "Inactive" }
interface HousekeepingTask { id: string; roomNumber: string; assignedTo: string; taskType: string; priority: "Low" | "Medium" | "High"; status: "Pending" | "In Progress" | "Completed"; eta: string }

// ---- Seed data ----
const seedFloors: Floor[] = [
  { id: "FL-1", name: "Ground Floor", level: 1, description: "Lobby, reception & accessible rooms", roomCount: 7 },
  { id: "FL-2", name: "Garden Level", level: 2, description: "Garden-view deluxe rooms", roomCount: 7 },
  { id: "FL-3", name: "Lagoon Level", level: 3, description: "Lagoon-view suites & villas", roomCount: 7 },
  { id: "FL-4", name: "Sky Level", level: 4, description: "Presidential suites & penthouse", roomCount: 7 },
];

const seedCategories: RoomCategory[] = [
  { id: "RC-1", name: "Standard", floorId: "FL-1", basePrice: 145, capacity: 2, quantity: 6, amenities: "WiFi, Smart TV, Mini Bar" },
  { id: "RC-2", name: "Deluxe Garden", floorId: "FL-2", basePrice: 225, capacity: 2, quantity: 7, amenities: "WiFi, Garden View, Balcony" },
  { id: "RC-3", name: "Lagoon Suite", floorId: "FL-3", basePrice: 385, capacity: 3, quantity: 5, amenities: "Lagoon View, Jacuzzi, Living Area" },
  { id: "RC-4", name: "Family Villa", floorId: "FL-3", basePrice: 495, capacity: 5, quantity: 4, amenities: "Private Pool, Kitchen, Kids Corner" },
  { id: "RC-5", name: "Presidential Suite", floorId: "FL-4", basePrice: 895, capacity: 2, quantity: 2, amenities: "Butler Service, Private Terrace" },
];

const seedEmployees: Employee[] = [
  { id: "EMP-001", name: "Elena Vasquez", position: "General Manager", department: "Executive", email: "elena@aquawood.com", phone: "+66 81 555 0100", shift: "Day (9-6)", status: "Active" },
  { id: "EMP-002", name: "Sarah Chen", position: "Front Desk Agent", department: "Front Office", email: "sarah@aquawood.com", phone: "+66 81 555 0101", shift: "Morning (6-2)", status: "Active" },
  { id: "EMP-003", name: "David Kumar", position: "Sales Manager", department: "Sales & Marketing", email: "david@aquawood.com", phone: "+66 81 555 0102", shift: "Day (9-6)", status: "Active" },
  { id: "EMP-004", name: "Maria Santos", position: "Housekeeping Lead", department: "Housekeeping", email: "maria@aquawood.com", phone: "+66 81 555 0103", shift: "Morning (6-2)", status: "Active" },
  { id: "EMP-005", name: "Juan Perez", position: "Room Attendant", department: "Housekeeping", email: "juan@aquawood.com", phone: "+66 81 555 0104", shift: "Afternoon (2-10)", status: "Active" },
  { id: "EMP-006", name: "Aisha Khan", position: "Room Attendant", department: "Housekeeping", email: "aisha@aquawood.com", phone: "+66 81 555 0105", shift: "Morning (6-2)", status: "On Leave" },
  { id: "EMP-007", name: "Chef Marco", position: "Executive Chef", department: "F&B", email: "marco@aquawood.com", phone: "+66 81 555 0106", shift: "Day (9-9)", status: "Active" },
  { id: "EMP-008", name: "Carlos Mendez", position: "Concierge", department: "Front Office", email: "carlos@aquawood.com", phone: "+66 81 555 0107", shift: "Evening (2-10)", status: "Active" },
];

const seedHousekeeping: HousekeepingTask[] = [
  { id: "HK-001", roomNumber: "108", assignedTo: "Maria Santos", taskType: "Deep Clean + Turndown", priority: "High", status: "In Progress", eta: "2:30 PM" },
  { id: "HK-002", roomNumber: "114", assignedTo: "Juan Perez", taskType: "Standard Clean", priority: "Medium", status: "Pending", eta: "3:00 PM" },
  { id: "HK-003", roomNumber: "102", assignedTo: "Aisha Khan", taskType: "Check-out Clean", priority: "High", status: "Pending", eta: "1:45 PM" },
  { id: "HK-004", roomNumber: "116", assignedTo: "Maria Santos", taskType: "Linen Refresh", priority: "Low", status: "Completed", eta: "12:00 PM" },
  { id: "HK-005", roomNumber: "122", assignedTo: "Carlos Mendez", taskType: "Mini-bar Restock", priority: "Medium", status: "In Progress", eta: "3:30 PM" },
  { id: "HK-006", roomNumber: "106", assignedTo: "Juan Perez", taskType: "VIP Turndown", priority: "High", status: "Pending", eta: "2:00 PM" },
];

export default function Settings() {
  const { user } = useApp();
  const [activeTab, setActiveTab] = useState<TabKey>("property");

  return (
    <div className="space-y-6">
      <div>
        <div className="text-xs uppercase tracking-[0.25em] text-gold-500 font-medium mb-1">System Settings</div>
        <h1 className="font-serif text-4xl text-brand-900">Configuration</h1>
        <p className="text-brand-700 mt-1">Manage property, rooms, employees, housekeeping, and system preferences.</p>
      </div>

      {/* TABS */}
      <div className="bg-white rounded-xl border border-brand-100 p-2 flex flex-wrap gap-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-md text-sm flex items-center gap-2 transition ${
              activeTab === tab.key
                ? "bg-brand-800 text-cream-50 shadow"
                : "text-brand-700 hover:bg-brand-50"
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "property" && <PropertyTab />}
      {activeTab === "rooms" && <RoomsTab />}
      {activeTab === "guests" && <GuestsTab />}
      {activeTab === "employees" && <EmployeesTab />}
      {activeTab === "housekeeping" && <HousekeepingTab />}
      {activeTab === "roles" && <RolesTab />}
      {activeTab === "integrations" && <IntegrationsTab />}
      {activeTab === "payments" && <PaymentsTab />}
      {activeTab === "notifications" && <NotificationsTab />}
      {activeTab === "branding" && <BrandingTab />}
      {activeTab === "security" && <SecurityTab />}

      {user?.role !== "admin" && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 flex items-center gap-3">
          <Shield className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <div>
            <div className="font-medium text-amber-900">Limited access</div>
            <div className="text-sm text-amber-800">Some settings require administrator privileges. Sign in as admin to make changes.</div>
          </div>
        </div>
      )}
    </div>
  );
}

// =================== PROPERTY ===================
function PropertyTab() {
  const { property, updateProperty } = useApp();
  const { addToast } = useToast();
  const [draft, setDraft] = useState(property);
  const [saved, setSaved] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const faviconInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File | null, key: "logo" | "favicon") => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setDraft((d) => ({ ...d, [key]: dataUrl }));
    };
    reader.readAsDataURL(file);
  };

  const save = () => {
    updateProperty(draft);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
    addToast("success", "Property profile saved", "All changes have been applied across the system.");
  };

  const reset = () => setDraft(property);
  const isDirty = JSON.stringify(draft) !== JSON.stringify(property);

  const field = (label: string, key: keyof typeof draft, type: string = "text", textarea = false) => (
    <label className="text-xs text-brand-700">
      <span className="uppercase tracking-wider">{label}</span>
      {textarea ? (
        <textarea
          value={(draft[key] ?? "") as string}
          onChange={(e) => setDraft({ ...draft, [key]: e.target.value })}
          rows={3}
          className="mt-1 w-full px-3 py-2 border border-brand-200 rounded-md bg-white text-sm resize-none normal-case"
        />
      ) : (
        <input
          type={type}
          value={(draft[key] ?? "") as string}
          onChange={(e) => setDraft({ ...draft, [key]: e.target.value })}
          className="mt-1 w-full px-3 py-2 border border-brand-200 rounded-md bg-white text-sm normal-case"
        />
      )}
    </label>
  );

  return (
    <div className="space-y-6">
      {/* LOGO & FAVICON */}
      <div className="bg-white rounded-xl border border-brand-100 p-6">
        <div className="flex items-center gap-3 mb-4">
          <ImageIcon className="w-5 h-5 text-brand-600" />
          <div>
            <h3 className="font-serif text-xl text-brand-900">Brand Assets</h3>
            <div className="text-xs text-brand-600">Upload your property logo and browser favicon</div>
          </div>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          {/* LOGO */}
          <div>
            <div className="text-xs uppercase tracking-wider text-brand-700 font-medium mb-2">Property Logo</div>
            <div className="flex items-center gap-4">
              <div className="w-24 h-24 rounded-xl bg-brand-50 border-2 border-dashed border-brand-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                {draft.logo ? (
                  <img src={draft.logo} alt="Logo" className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon className="w-8 h-8 text-brand-300" />
                )}
              </div>
              <div className="flex-1">
                <input ref={logoInputRef} type="file" accept="image/*" onChange={(e) => handleFile(e.target.files?.[0] || null, "logo")} className="hidden" />
                <button onClick={() => logoInputRef.current?.click()} className="px-3 py-2 bg-brand-800 text-cream-50 rounded-md text-xs hover:bg-brand-900 flex items-center gap-1 mb-2">
                  <Upload className="w-3.5 h-3.5" /> Upload Logo
                </button>
                {draft.logo && (
                  <button onClick={() => setDraft({ ...draft, logo: null })} className="block text-xs text-red-600 hover:text-red-700">Remove</button>
                )}
                <div className="text-[10px] text-brand-500 mt-1">PNG/SVG recommended · Square aspect</div>
              </div>
            </div>
          </div>

          {/* FAVICON */}
          <div>
            <div className="text-xs uppercase tracking-wider text-brand-700 font-medium mb-2">Browser Favicon</div>
            <div className="flex items-center gap-4">
              <div className="w-24 h-24 rounded-xl bg-brand-50 border-2 border-dashed border-brand-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                {draft.favicon ? (
                  <img src={draft.favicon} alt="Favicon" className="w-12 h-12 object-cover rounded" />
                ) : (
                  <Globe className="w-8 h-8 text-brand-300" />
                )}
              </div>
              <div className="flex-1">
                <input ref={faviconInputRef} type="file" accept="image/png,image/x-icon,image/svg+xml" onChange={(e) => handleFile(e.target.files?.[0] || null, "favicon")} className="hidden" />
                <button onClick={() => faviconInputRef.current?.click()} className="px-3 py-2 bg-brand-800 text-cream-50 rounded-md text-xs hover:bg-brand-900 flex items-center gap-1 mb-2">
                  <Upload className="w-3.5 h-3.5" /> Upload Favicon
                </button>
                {draft.favicon && (
                  <button onClick={() => setDraft({ ...draft, favicon: null })} className="block text-xs text-red-600 hover:text-red-700">Remove</button>
                )}
                <div className="text-[10px] text-brand-500 mt-1">32×32 or 64×64 PNG/ICO</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* PROPERTY DETAILS */}
      <div className="bg-white rounded-xl border border-brand-100 p-6">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <Building2 className="w-5 h-5 text-brand-600" />
            <div>
              <h3 className="font-serif text-xl text-brand-900">Property Profile</h3>
              <div className="text-xs text-brand-600">All fields are editable — saved to all front-end and back-end views</div>
            </div>
          </div>
          {saved && (
            <span className="text-xs px-3 py-1.5 bg-emerald-100 text-emerald-800 rounded-full flex items-center gap-1">
              <Check className="w-3.5 h-3.5" /> Changes saved
            </span>
          )}
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {field("Property Name", "name")}
          {field("Tagline", "tagline")}
          {field("Property Type", "type")}
          {field("Star Rating", "starRating")}
          {field("Total Rooms", "totalRooms")}
          {field("Total Floors", "totalFloors")}
          {field("Total Employees", "totalEmployees")}
          {field("Established Year", "established")}
          {field("Garden Area", "gardenArea")}
          {field("Address", "address")}
          {field("City", "city")}
          {field("Country", "country")}
          {field("Time Zone", "timezone")}
          {field("Currency", "currency")}
          {field("Phone", "phone", "tel")}
          {field("Email", "email", "email")}
          {field("Website", "website")}
          <div className="md:col-span-2 lg:col-span-3">
            {field("Description", "description", "text", true)}
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6 pt-6 border-t border-brand-100">
          {isDirty && (
            <button onClick={reset} className="px-4 py-2 border border-brand-200 rounded-md text-sm hover:bg-brand-50 flex items-center gap-1">
              <X className="w-3.5 h-3.5" /> Discard Changes
            </button>
          )}
          <button onClick={save} disabled={!isDirty} className="px-4 py-2 bg-brand-800 text-cream-50 rounded-md text-sm hover:bg-brand-900 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1">
            <Save className="w-3.5 h-3.5" /> Save Property Profile
          </button>
        </div>
      </div>

      {/* LIVE PREVIEW */}
      <div className="bg-gradient-to-br from-brand-900 to-brand-800 text-cream-50 rounded-xl p-6">
        <div className="text-xs uppercase tracking-wider text-gold-400 mb-3">Live Preview</div>
        <div className="flex items-start gap-4">
          {draft.logo && (
            <img src={draft.logo} alt="Logo" className="w-16 h-16 rounded-full object-cover bg-cream-50 border-2 border-gold-400" />
          )}
          <div className="flex-1">
            <div className="font-serif text-2xl">{draft.name}</div>
            <div className="text-sm text-gold-400 italic mb-2">{draft.tagline}</div>
            <div className="text-xs text-cream-100/80">{draft.description}</div>
            <div className="text-xs text-cream-100/70 mt-2">
              {draft.starRating} · {draft.type} · Est. {draft.established}<br />
              {draft.address}, {draft.city}, {draft.country}<br />
              {draft.phone} · {draft.email} · {draft.website}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// =================== ROOMS & FLOORS ===================
function RoomsTab() {
  const { rooms, addRoom, updateRoom, deleteRoom } = useApp();
  const { addToast } = useToast();
  const [floors, setFloors] = useState<Floor[]>(seedFloors);
  const [categories, setCategories] = useState<RoomCategory[]>(seedCategories);

  useEffect(() => {
    supabase.from("floors").select("*").order("level").then(({ data }) => { if (data) setFloors(data as Floor[]); });
    supabase.from("room_categories").select("*").order("name").then(({ data }) => { if (data) setCategories(data as RoomCategory[]); });
  }, []);
  const [editingFloor, setEditingFloor] = useState<Floor | null>(null);
  const [editingCategory, setEditingCategory] = useState<RoomCategory | null>(null);
  const [showFloorForm, setShowFloorForm] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [selectedFloor, setSelectedFloor] = useState<Floor | null>(null);
  const [editingRoom, setEditingRoom] = useState<import("../data/mockData").Room | null>(null);
  const [showRoomForm, setShowRoomForm] = useState(false);
  const [showBulkRoomForm, setShowBulkRoomForm] = useState(false);

  const [roomSearch, setRoomSearch] = useState("");
  const [roomStatusFilter, setRoomStatusFilter] = useState<string>("all");
  const [roomTypeFilter, setRoomTypeFilter] = useState<string>("all");
  const [roomSort, setRoomSort] = useState<"number" | "type" | "rateAsc" | "rateDesc" | "capacity">("number");

  const totalRooms = categories.reduce((s, c) => s + c.quantity, 0);
  const totalFloors = floors.length;

  const saveFloor = async (data: Omit<Floor, "id"> & { id?: string }) => {
    if (data.id) {
      await supabase.from("floors").update(data).eq("id", data.id);
      setFloors((fs) => fs.map((f) => f.id === data.id ? { ...f, ...data, id: data.id! } : f));
    } else {
      const id = `FL-${Date.now().toString().slice(-4)}`;
      const { error } = await supabase.from("floors").insert({ ...data, id });
      if (!error) setFloors((fs) => [...fs, { ...data, id }]);
    }
    setEditingFloor(null);
    setShowFloorForm(false);
  };

  const saveCategory = async (data: Omit<RoomCategory, "id"> & { id?: string }) => {
    if (data.id) {
      await supabase.from("room_categories").update(data).eq("id", data.id);
      setCategories((cs) => cs.map((c) => c.id === data.id ? { ...c, ...data, id: data.id! } : c));
    } else {
      const id = `RC-${Date.now().toString().slice(-4)}`;
      const { error } = await supabase.from("room_categories").insert({ ...data, id });
      if (!error) setCategories((cs) => [...cs, { ...data, id }]);
    }
    setEditingCategory(null);
    setShowCategoryForm(false);
  };

  const allRoomsOnFloor = selectedFloor ? rooms.filter((r) => r.floor === selectedFloor.level) : [];
  const roomTypes = Array.from(new Set(allRoomsOnFloor.map((r) => r.type))).sort();

  const roomsOnFloor = allRoomsOnFloor
    .filter((r) => {
      if (!roomSearch.trim()) return true;
      const q = roomSearch.toLowerCase();
      return (
        r.number.toLowerCase().includes(q) ||
        r.type.toLowerCase().includes(q) ||
        (r.beds || "").toLowerCase().includes(q)
      );
    })
    .filter((r) => (roomStatusFilter === "all" ? true : r.status === roomStatusFilter))
    .filter((r) => (roomTypeFilter === "all" ? true : r.type === roomTypeFilter))
    .sort((a, b) => {
      switch (roomSort) {
        case "number": return a.number.localeCompare(b.number, undefined, { numeric: true });
        case "type": return a.type.localeCompare(b.type);
        case "rateAsc": return a.baseRate - b.baseRate;
        case "rateDesc": return b.baseRate - a.baseRate;
        case "capacity": return a.capacity - b.capacity;
        default: return 0;
      }
    });

  return (
    <div className="space-y-6">
      {/* SUMMARY */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<Layers className="w-5 h-5" />} label="Total Floors" value={totalFloors.toString()} />
        <StatCard icon={<Bed className="w-5 h-5" />} label="Live Rooms" value={rooms.length.toString()} />
        <StatCard icon={<Layers className="w-5 h-5" />} label="Room Categories" value={categories.length.toString()} />
        <StatCard icon={<Bed className="w-5 h-5" />} label="Planned Rooms" value={totalRooms.toString()} />
      </div>

      {/* FLOORS */}
      <div className="bg-white rounded-xl border border-brand-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Layers className="w-5 h-5 text-brand-600" />
            <div>
              <h3 className="font-serif text-xl text-brand-900">Floors</h3>
              <div className="text-xs text-brand-600">Click a floor row to manage its rooms</div>
            </div>
          </div>
          <button onClick={() => { setEditingFloor(null); setShowFloorForm(true); }} className="px-3 py-2 bg-brand-800 text-cream-50 rounded-md text-xs hover:bg-brand-900 flex items-center gap-1">
            <Plus className="w-3.5 h-3.5" /> Add Floor
          </button>
        </div>

        {(showFloorForm || editingFloor) && (
          <FloorForm
            floor={editingFloor}
            onSave={saveFloor}
            onCancel={() => { setEditingFloor(null); setShowFloorForm(false); }}
          />
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-brand-600 uppercase tracking-wider border-b border-brand-100">
                <th className="text-left pb-2 font-medium">ID</th>
                <th className="text-left pb-2 font-medium">Floor Name</th>
                <th className="text-left pb-2 font-medium">Level</th>
                <th className="text-left pb-2 font-medium">Description</th>
                <th className="text-left pb-2 font-medium">Rooms</th>
                <th className="text-right pb-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-50">
              {floors.map((floor) => {
                const liveCount = rooms.filter((r) => r.floor === floor.level).length;
                const isSel = selectedFloor?.id === floor.id;
                return (
                  <tr
                    key={floor.id}
                    onClick={() => { setSelectedFloor(isSel ? null : floor); setEditingRoom(null); setShowRoomForm(false); }}
                    className={`cursor-pointer ${isSel ? "bg-gold-50" : "hover:bg-brand-50/40"}`}
                  >
                    <td className="py-3 font-mono text-xs text-brand-700">{floor.id}</td>
                    <td className="py-3 font-medium text-brand-900">{floor.name}</td>
                    <td className="py-3 text-brand-700">Level {floor.level}</td>
                    <td className="py-3 text-brand-700 text-xs">{floor.description}</td>
                    <td className="py-3"><span className="text-xs px-2 py-0.5 bg-brand-100 text-brand-800 rounded-full">{liveCount} live</span></td>
                    <td className="py-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-end gap-1">
                        <button onClick={() => { setEditingFloor(floor); setShowFloorForm(false); }} className="p-1.5 rounded hover:bg-brand-100 text-brand-600"><Pencil className="w-3.5 h-3.5" /></button>
                        <button
                          onClick={async () => {
                            if (liveCount > 0) {
                              if (!confirm(`This floor has ${liveCount} room${liveCount > 1 ? 's' : ''} assigned. Deleting it will not remove the rooms from the database, but may affect floor-level organization. Proceed?`)) return;
                            } else {
                              if (!confirm(`Delete floor "${floor.name}"?`)) return;
                            }
                            await supabase.from("floors").delete().eq("id", floor.id);
                            setFloors((fs) => fs.filter((f) => f.id !== floor.id));
                            if (selectedFloor?.id === floor.id) setSelectedFloor(null);
                          }}
                          className="p-1.5 rounded hover:bg-red-50 text-red-600"
                        ><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ROOMS ON SELECTED FLOOR */}
      {selectedFloor && (
        <div className="bg-white rounded-xl border-2 border-gold-300 p-6">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <Bed className="w-5 h-5 text-brand-600" />
              <div>
                <h3 className="font-serif text-xl text-brand-900">Rooms on {selectedFloor.name}</h3>
                <div className="text-xs text-brand-600">Level {selectedFloor.level} · {roomsOnFloor.length} room(s) · live from database</div>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setSelectedFloor(null)} className="px-3 py-2 border border-brand-200 rounded-md text-xs hover:bg-brand-50 flex items-center gap-1">
                <X className="w-3.5 h-3.5" /> Close
              </button>
              <button onClick={() => { setEditingRoom(null); setShowRoomForm(true); setShowBulkRoomForm(false); }} className="px-3 py-2 bg-brand-800 text-cream-50 rounded-md text-xs hover:bg-brand-900 flex items-center gap-1">
                <Plus className="w-3.5 h-3.5" /> Add Room
              </button>
              <button onClick={() => { setShowBulkRoomForm(true); setShowRoomForm(false); setEditingRoom(null); }} className="px-3 py-2 bg-gold-500 text-brand-900 rounded-md text-xs hover:bg-gold-400 flex items-center gap-1">
                <ListPlus className="w-3.5 h-3.5" /> Add Multiple
              </button>
            </div>
        </div>

        {/* Search, Filter & Sort */}
        <div className="flex flex-wrap items-center gap-3 mb-4 p-3 bg-brand-50 rounded-lg border border-brand-100">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-400" />
            <input
              type="text"
              placeholder="Search rooms..."
              value={roomSearch}
              onChange={(e) => setRoomSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-brand-200 rounded-md bg-white text-sm placeholder:text-brand-400"
            />
          </div>
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-brand-500" />
            <select
              value={roomStatusFilter}
              onChange={(e) => setRoomStatusFilter(e.target.value)}
              className="px-3 py-2 border border-brand-200 rounded-md bg-white text-sm text-brand-700"
            >
              <option value="all">All Statuses</option>
              <option value="available">Available</option>
              <option value="occupied">Occupied</option>
              <option value="reserved">Reserved</option>
              <option value="dirty">Dirty</option>
              <option value="maintenance">Maintenance</option>
            </select>
            <select
              value={roomTypeFilter}
              onChange={(e) => setRoomTypeFilter(e.target.value)}
              className="px-3 py-2 border border-brand-200 rounded-md bg-white text-sm text-brand-700"
            >
              <option value="all">All Types</option>
              {roomTypes.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            <div className="flex items-center gap-1">
              <ArrowUpDown className="w-4 h-4 text-brand-500" />
              <select
                value={roomSort}
                onChange={(e) => setRoomSort(e.target.value as typeof roomSort)}
                className="px-3 py-2 border border-brand-200 rounded-md bg-white text-sm text-brand-700"
              >
                <option value="number">Room #</option>
                <option value="type">Type</option>
                <option value="rateAsc">Rate: Low → High</option>
                <option value="rateDesc">Rate: High → Low</option>
                <option value="capacity">Capacity</option>
              </select>
            </div>
            {(roomSearch || roomStatusFilter !== "all" || roomTypeFilter !== "all" || roomSort !== "number") && (
              <button
                onClick={() => { setRoomSearch(""); setRoomStatusFilter("all"); setRoomTypeFilter("all"); setRoomSort("number"); }}
                className="px-3 py-2 text-xs border border-brand-200 rounded-md hover:bg-brand-100 text-brand-700"
              >
                Reset
              </button>
            )}
          </div>
        </div>

          {(showRoomForm || editingRoom) && (
            <RoomForm
              room={editingRoom}
              defaultFloor={selectedFloor.level}
              onCancel={() => { setEditingRoom(null); setShowRoomForm(false); }}
              onSave={async (data) => {
                const res = data.id
                  ? await updateRoom(data.id, data)
                  : await addRoom(data);
                if (!res.ok) {
                  addToast("error", "Save failed", res.error || "Could not save room.");
                  return;
                }
                addToast("success", data.id ? "Room updated" : "Room added", `Room ${data.number} on Level ${data.floor}.`);
                setEditingRoom(null);
                setShowRoomForm(false);
              }}
            />
          )}

          {showBulkRoomForm && (
            <BulkRoomForm
              defaultFloor={selectedFloor.level}
              onCancel={() => setShowBulkRoomForm(false)}
              onSave={async (roomsToCreate) => {
                let created = 0;
                let failed = 0;
                for (const data of roomsToCreate) {
                  const res = await addRoom(data);
                  if (res.ok) created++;
                  else failed++;
                }
                if (failed === 0) {
                  addToast("success", `${created} rooms added`, `All rooms created on Level ${selectedFloor.level}.`);
                } else {
                  addToast("error", `${failed} failed`, `${created} created, ${failed} could not be saved.`);
                }
                setShowBulkRoomForm(false);
              }}
            />
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-brand-600 uppercase tracking-wider border-b border-brand-100">
                  <th className="text-left pb-2 font-medium">Image</th>
                  <th className="text-left pb-2 font-medium">Room #</th>
                  <th className="text-left pb-2 font-medium">Type</th>
                  <th className="text-left pb-2 font-medium">Beds</th>
                  <th className="text-left pb-2 font-medium">Capacity</th>
                  <th className="text-left pb-2 font-medium">Rate</th>
                  <th className="text-left pb-2 font-medium">Status</th>
                  <th className="text-right pb-2 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-50">
                {roomsOnFloor.map((room) => (
                  <tr key={room.id} className="hover:bg-brand-50/40">
                    <td className="py-3">
                      {room.image ? (
                        <img src={room.image} alt={room.number} className="w-12 h-12 rounded object-cover border border-brand-100" />
                      ) : (
                        <div className="w-12 h-12 rounded bg-brand-50 border border-brand-100 flex items-center justify-center text-brand-300"><Bed className="w-4 h-4" /></div>
                      )}
                    </td>
                    <td className="py-3 font-medium text-brand-900">{room.number}</td>
                    <td className="py-3 text-brand-700">{room.type}</td>
                    <td className="py-3 text-brand-700 text-xs">{room.beds || "—"}</td>
                    <td className="py-3 text-brand-700">{room.capacity}</td>
                    <td className="py-3 font-medium">₱{room.baseRate}</td>
                    <td className="py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        room.status === "available" ? "bg-emerald-100 text-emerald-800" :
                        room.status === "occupied" ? "bg-red-100 text-red-800" :
                        room.status === "reserved" ? "bg-blue-100 text-blue-800" :
                        room.status === "dirty" ? "bg-amber-100 text-amber-800" :
                        "bg-brand-100 text-brand-800"
                      }`}>{room.status}</span>
                    </td>
                    <td className="py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => { setEditingRoom(room); setShowRoomForm(false); }} className="p-1.5 rounded hover:bg-brand-100 text-brand-600"><Pencil className="w-3.5 h-3.5" /></button>
                        <button
                          onClick={async () => {
                            if (!confirm(`Delete room ${room.number}?`)) return;
                            const res = await deleteRoom(room.id);
                            if (!res.ok) addToast("error", "Delete failed", res.error || "Could not delete room.");
                            else addToast("success", "Room deleted", `Room ${room.number} removed.`);
                          }}
                          className="p-1.5 rounded hover:bg-red-50 text-red-600"
                        ><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {roomsOnFloor.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-sm text-brand-500">
                      {allRoomsOnFloor.length === 0
                        ? "No rooms on this floor yet. Click \"Add Room\" to create one."
                        : "No rooms match your search or filters."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ROOM CATEGORIES */}
      <div className="bg-white rounded-xl border border-brand-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Bed className="w-5 h-5 text-brand-600" />
            <div>
              <h3 className="font-serif text-xl text-brand-900">Room Categories</h3>
              <div className="text-xs text-brand-600">Assign categories to floors with pricing and capacity</div>
            </div>
          </div>
          <button onClick={() => { setEditingCategory(null); setShowCategoryForm(true); }} className="px-3 py-2 bg-brand-800 text-cream-50 rounded-md text-xs hover:bg-brand-900 flex items-center gap-1">
            <Plus className="w-3.5 h-3.5" /> Add Category
          </button>
        </div>

        {(showCategoryForm || editingCategory) && (
          <CategoryForm
            category={editingCategory}
            floors={floors}
            onSave={saveCategory}
            onCancel={() => { setEditingCategory(null); setShowCategoryForm(false); }}
          />
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-brand-600 uppercase tracking-wider border-b border-brand-100">
                <th className="text-left pb-2 font-medium">Image</th>
                <th className="text-left pb-2 font-medium">ID</th>
                <th className="text-left pb-2 font-medium">Category</th>
                <th className="text-left pb-2 font-medium">Floor</th>
                <th className="text-left pb-2 font-medium">Base Price</th>
                <th className="text-left pb-2 font-medium">Capacity</th>
                <th className="text-left pb-2 font-medium">Quantity</th>
                <th className="text-left pb-2 font-medium">Amenities</th>
                <th className="text-right pb-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-50">
              {categories.map((cat) => {
                const floor = floors.find((f) => f.id === cat.floorId);
                return (
                  <tr key={cat.id} className="hover:bg-brand-50/40">
                    <td className="py-3">
                      {cat.image ? (
                        <img src={cat.image} alt={cat.name} className="w-12 h-12 rounded object-cover border border-brand-100" />
                      ) : (
                        <div className="w-12 h-12 rounded bg-brand-50 border border-brand-100 flex items-center justify-center text-brand-300"><Bed className="w-4 h-4" /></div>
                      )}
                    </td>
                    <td className="py-3 font-mono text-xs text-brand-700">{cat.id}</td>
                    <td className="py-3 font-medium text-brand-900">{cat.name}</td>
                    <td className="py-3 text-brand-700 text-xs">{floor?.name || "—"}</td>
                    <td className="py-3 font-medium">₱{cat.basePrice}</td>
                    <td className="py-3 text-brand-700">{cat.capacity} guests</td>
                    <td className="py-3"><span className="text-xs px-2 py-0.5 bg-brand-100 text-brand-800 rounded-full">{cat.quantity} rooms</span></td>
                    <td className="py-3 text-brand-700 text-xs max-w-xs truncate">{cat.amenities}</td>
                    <td className="py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => { setEditingCategory(cat); setShowCategoryForm(false); }} className="p-1.5 rounded hover:bg-brand-100 text-brand-600"><Pencil className="w-3.5 h-3.5" /></button>
                        <button onClick={async () => { await supabase.from("room_categories").delete().eq("id", cat.id); setCategories((cs) => cs.filter((c) => c.id !== cat.id)); }} className="p-1.5 rounded hover:bg-red-50 text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

type RoomFormData = Partial<import("../data/mockData").Room> & {
  id?: string;
  number: string;
  floor: number;
  type: import("../data/mockData").RoomType;
  baseRate: number;
  status: import("../data/mockData").RoomStatus;
  beds: string;
  capacity: number;
  amenities: string[];
  image: string;
};

function RoomForm({
  room, defaultFloor, onSave, onCancel,
}: {
  room: import("../data/mockData").Room | null;
  defaultFloor: number;
  onSave: (data: RoomFormData) => void | Promise<void>;
  onCancel: () => void;
}) {
  const [image, setImage] = useState<string>(room?.image || "");
  const [uploading, setUploading] = useState(false);

  const handleImage = async (file: File | null) => {
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadRoomImage(file);
      setImage(url);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    onSave({
      id: room?.id,
      number: String(fd.get("number")),
      floor: Number(fd.get("floor")),
      type: String(fd.get("type")) as import("../data/mockData").RoomType,
      baseRate: Number(fd.get("baseRate")),
      status: String(fd.get("status")) as import("../data/mockData").RoomStatus,
      beds: String(fd.get("beds") || ""),
      capacity: Number(fd.get("capacity")),
      amenities: String(fd.get("amenities") || "").split(",").map((s) => s.trim()).filter(Boolean),
      image,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="mb-4 p-4 rounded-lg bg-brand-50 border border-brand-100">
      <div className="text-xs uppercase tracking-wider text-brand-600 mb-3">{room ? "Update" : "Create"} Room</div>
      <div className="grid md:grid-cols-3 gap-3">
        <label className="text-xs text-brand-700">Room Number<input name="number" required defaultValue={room?.number} className="mt-1 w-full px-3 py-2 border border-brand-200 rounded-md bg-white text-sm" /></label>
        <label className="text-xs text-brand-700">Floor (Level)<input name="floor" type="number" required defaultValue={room?.floor ?? defaultFloor} className="mt-1 w-full px-3 py-2 border border-brand-200 rounded-md bg-white text-sm" /></label>
        <label className="text-xs text-brand-700">Type
          <select name="type" required defaultValue={room?.type || "Standard"} className="mt-1 w-full px-3 py-2 border border-brand-200 rounded-md bg-white text-sm">
            {["Standard", "Deluxe Garden", "Lagoon Suite", "Family Villa", "Presidential Suite"].map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </label>
        <label className="text-xs text-brand-700">Base Rate (₱)<input name="baseRate" type="number" min="0" required defaultValue={room?.baseRate ?? 0} className="mt-1 w-full px-3 py-2 border border-brand-200 rounded-md bg-white text-sm" /></label>
        <label className="text-xs text-brand-700">Capacity<input name="capacity" type="number" min="1" required defaultValue={room?.capacity ?? 2} className="mt-1 w-full px-3 py-2 border border-brand-200 rounded-md bg-white text-sm" /></label>
        <label className="text-xs text-brand-700">Beds<input name="beds" defaultValue={room?.beds || "1 King"} className="mt-1 w-full px-3 py-2 border border-brand-200 rounded-md bg-white text-sm" /></label>
        <label className="text-xs text-brand-700">Status
          <select name="status" required defaultValue={room?.status || "available"} className="mt-1 w-full px-3 py-2 border border-brand-200 rounded-md bg-white text-sm">
            {["available", "occupied", "dirty", "maintenance", "reserved"].map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </label>
        <label className="text-xs text-brand-700 md:col-span-2">Amenities (comma separated)<input name="amenities" defaultValue={(room?.amenities || []).join(", ")} className="mt-1 w-full px-3 py-2 border border-brand-200 rounded-md bg-white text-sm" /></label>
        <div className="md:col-span-3">
          <div className="text-xs text-brand-700 mb-1">Room Image</div>
          <div className="flex items-center gap-3">
            {image ? (
              <img src={image} alt="preview" className="w-20 h-20 rounded object-cover border border-brand-200" />
            ) : (
              <div className="w-20 h-20 rounded bg-white border border-dashed border-brand-200 flex items-center justify-center text-brand-300 text-xs">No image</div>
            )}
            <label className={`px-3 py-1.5 bg-white border border-brand-200 rounded-md text-xs cursor-pointer hover:bg-brand-100 inline-flex items-center gap-1 w-fit ${uploading ? "opacity-60 pointer-events-none" : ""}`}>
              <Plus className="w-3 h-3" /> {uploading ? "Uploading..." : (image ? "Replace" : "Upload")}
              <input type="file" accept="image/*" disabled={uploading} className="hidden" onChange={(e) => handleImage(e.target.files?.[0] || null)} />
            </label>
            {image && (
              <button type="button" onClick={() => setImage("")} className="px-3 py-1.5 border border-red-200 text-red-600 rounded-md text-xs hover:bg-red-50 inline-flex items-center gap-1">
                <Trash2 className="w-3 h-3" /> Remove
              </button>
            )}
          </div>
        </div>
      </div>
      <div className="flex justify-end gap-2 mt-3">
        <button type="button" onClick={onCancel} className="px-3 py-1.5 border border-brand-200 rounded-md text-xs hover:bg-white flex items-center gap-1"><X className="w-3 h-3" /> Cancel</button>
        <button type="submit" className="px-3 py-1.5 bg-brand-800 text-cream-50 rounded-md text-xs hover:bg-brand-900 flex items-center gap-1"><Check className="w-3 h-3" /> Save</button>
      </div>
    </form>
  );
}

function BulkRoomForm({
  defaultFloor, onSave, onCancel,
}: {
  defaultFloor: number;
  onSave: (rooms: Omit<import("../data/mockData").Room, "id">[]) => void | Promise<void>;
  onCancel: () => void;
}) {
  const [prefix, setPrefix] = useState("");
  const [start, setStart] = useState<number>(defaultFloor * 100 + 1);
  const [count, setCount] = useState<number>(4);
  const [sharedType, setSharedType] = useState("Standard");
  const [sharedBeds, setSharedBeds] = useState("1 King");
  const [sharedCapacity, setSharedCapacity] = useState<number>(2);
  const [sharedRate, setSharedRate] = useState<number>(145);
  const [sharedStatus, setSharedStatus] = useState<import("../data/mockData").RoomStatus>("available");
  const [sharedAmenities, setSharedAmenities] = useState("WiFi, Smart TV, Mini Bar");

  const generatedNumbers = Array.from({ length: count }, (_, i) => `${prefix}${start + i}`);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const rooms = generatedNumbers.map((number) => ({
      number,
      floor: defaultFloor,
      type: sharedType as import("../data/mockData").Room["type"],
      baseRate: sharedRate,
      status: sharedStatus,
      beds: sharedBeds,
      capacity: sharedCapacity,
      amenities: sharedAmenities.split(",").map((s) => s.trim()).filter(Boolean),
      image: "",
    }));
    onSave(rooms);
  };

  return (
    <form onSubmit={handleSubmit} className="mb-4 p-4 rounded-lg bg-gold-50 border border-gold-200">
      <div className="text-xs uppercase tracking-wider text-brand-600 mb-3">Add Multiple Rooms</div>
      <div className="grid md:grid-cols-4 gap-3">
        <label className="text-xs text-brand-700">Number Prefix <span className="text-brand-400 font-normal">(optional)</span>
          <input value={prefix} onChange={(e) => setPrefix(e.target.value)} className="mt-1 w-full px-3 py-2 border border-brand-200 rounded-md bg-white text-sm" placeholder="e.g. A" />
        </label>
        <label className="text-xs text-brand-700">Start Number
          <input type="number" min={1} value={start} onChange={(e) => setStart(Number(e.target.value))} className="mt-1 w-full px-3 py-2 border border-brand-200 rounded-md bg-white text-sm" />
        </label>
        <label className="text-xs text-brand-700">Count
          <input type="number" min={1} max={50} value={count} onChange={(e) => setCount(Number(e.target.value))} className="mt-1 w-full px-3 py-2 border border-brand-200 rounded-md bg-white text-sm" />
        </label>
        <label className="text-xs text-brand-700">Floor (Level)
          <input type="number" readOnly value={defaultFloor} className="mt-1 w-full px-3 py-2 border border-brand-200 rounded-md bg-brand-100 text-sm text-brand-500" />
        </label>
        <label className="text-xs text-brand-700">Type
          <select value={sharedType} onChange={(e) => setSharedType(e.target.value)} className="mt-1 w-full px-3 py-2 border border-brand-200 rounded-md bg-white text-sm">
            {["Standard", "Deluxe Garden", "Lagoon Suite", "Family Villa", "Presidential Suite"].map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </label>
        <label className="text-xs text-brand-700">Base Rate (₱)
          <input type="number" min={0} value={sharedRate} onChange={(e) => setSharedRate(Number(e.target.value))} className="mt-1 w-full px-3 py-2 border border-brand-200 rounded-md bg-white text-sm" />
        </label>
        <label className="text-xs text-brand-700">Capacity
          <input type="number" min={1} value={sharedCapacity} onChange={(e) => setSharedCapacity(Number(e.target.value))} className="mt-1 w-full px-3 py-2 border border-brand-200 rounded-md bg-white text-sm" />
        </label>
        <label className="text-xs text-brand-700">Beds
          <input value={sharedBeds} onChange={(e) => setSharedBeds(e.target.value)} className="mt-1 w-full px-3 py-2 border border-brand-200 rounded-md bg-white text-sm" />
        </label>
        <label className="text-xs text-brand-700">Status
          <select value={sharedStatus} onChange={(e) => setSharedStatus(e.target.value as import("../data/mockData").RoomStatus)} className="mt-1 w-full px-3 py-2 border border-brand-200 rounded-md bg-white text-sm">
            {["available", "occupied", "dirty", "maintenance", "reserved"].map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </label>
        <label className="text-xs text-brand-700 md:col-span-3">Amenities (comma separated)
          <input value={sharedAmenities} onChange={(e) => setSharedAmenities(e.target.value)} className="mt-1 w-full px-3 py-2 border border-brand-200 rounded-md bg-white text-sm" />
        </label>
      </div>
      <div className="mt-3 p-2 bg-white rounded border border-gold-100 text-xs text-brand-600">
        <span className="font-medium">Preview:</span> {generatedNumbers.slice(0, 8).join(", ")}{count > 8 ? ` … and ${count - 8} more` : ""}
      </div>
      <div className="flex justify-end gap-2 mt-3">
        <button type="button" onClick={onCancel} className="px-3 py-1.5 border border-brand-200 rounded-md text-xs hover:bg-white flex items-center gap-1"><X className="w-3 h-3" /> Cancel</button>
        <button type="submit" className="px-3 py-1.5 bg-brand-800 text-cream-50 rounded-md text-xs hover:bg-brand-900 flex items-center gap-1"><ListPlus className="w-3 h-3" /> Create {count} Rooms</button>
      </div>
    </form>
  );
}

function FloorForm({ floor, onSave, onCancel }: { floor: Floor | null; onSave: (data: Omit<Floor, "id"> & { id?: string }) => void; onCancel: () => void }) {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    onSave({
      id: floor?.id,
      name: String(fd.get("name")),
      level: Number(fd.get("level")),
      description: String(fd.get("description")),
      roomCount: Number(fd.get("roomCount")),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="mb-4 p-4 rounded-lg bg-brand-50 border border-brand-100">
      <div className="text-xs uppercase tracking-wider text-brand-600 mb-3">{floor ? "Update" : "Create"} Floor</div>
      <div className="grid md:grid-cols-4 gap-3">
        <label className="text-xs text-brand-700">Floor Name<input name="name" required defaultValue={floor?.name} className="mt-1 w-full px-3 py-2 border border-brand-200 rounded-md bg-white text-sm" /></label>
        <label className="text-xs text-brand-700">Level<input name="level" type="number" required defaultValue={floor?.level} className="mt-1 w-full px-3 py-2 border border-brand-200 rounded-md bg-white text-sm" /></label>
        <label className="text-xs text-brand-700 md:col-span-2">Description<input name="description" required defaultValue={floor?.description} className="mt-1 w-full px-3 py-2 border border-brand-200 rounded-md bg-white text-sm" /></label>
        <label className="text-xs text-brand-700">Default Room Count<input name="roomCount" type="number" required defaultValue={floor?.roomCount ?? 0} className="mt-1 w-full px-3 py-2 border border-brand-200 rounded-md bg-white text-sm" /></label>
      </div>
      <div className="flex justify-end gap-2 mt-3">
        <button type="button" onClick={onCancel} className="px-3 py-1.5 border border-brand-200 rounded-md text-xs hover:bg-white flex items-center gap-1"><X className="w-3 h-3" /> Cancel</button>
        <button type="submit" className="px-3 py-1.5 bg-brand-800 text-cream-50 rounded-md text-xs hover:bg-brand-900 flex items-center gap-1"><Check className="w-3 h-3" /> Save</button>
      </div>
    </form>
  );
}

function CategoryForm({ category, floors, onSave, onCancel }: { category: RoomCategory | null; floors: Floor[]; onSave: (data: Omit<RoomCategory, "id"> & { id?: string }) => void; onCancel: () => void }) {
  const [image, setImage] = useState<string | undefined>(category?.image);
  const [uploading, setUploading] = useState(false);

  const handleImage = async (file: File | null) => {
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadRoomImage(file);
      setImage(url);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    onSave({
      id: category?.id,
      name: String(fd.get("name")),
      floorId: String(fd.get("floorId")),
      basePrice: Number(fd.get("basePrice")),
      capacity: Number(fd.get("capacity")),
      quantity: Number(fd.get("quantity")),
      amenities: String(fd.get("amenities")),
      image,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="mb-4 p-4 rounded-lg bg-brand-50 border border-brand-100">
      <div className="text-xs uppercase tracking-wider text-brand-600 mb-3">{category ? "Update" : "Create"} Room Category</div>
      <div className="grid md:grid-cols-3 gap-3">
        <label className="text-xs text-brand-700">Category Name<input name="name" required defaultValue={category?.name} className="mt-1 w-full px-3 py-2 border border-brand-200 rounded-md bg-white text-sm" /></label>
        <label className="text-xs text-brand-700">Floor
          <select name="floorId" required defaultValue={category?.floorId} className="mt-1 w-full px-3 py-2 border border-brand-200 rounded-md bg-white text-sm">
            {floors.map((f) => <option key={f.id} value={f.id}>{f.name} (Level {f.level})</option>)}
          </select>
        </label>
        <label className="text-xs text-brand-700">Base Price (₱)<input name="basePrice" type="number" min="0" required defaultValue={category?.basePrice} className="mt-1 w-full px-3 py-2 border border-brand-200 rounded-md bg-white text-sm" /></label>
        <label className="text-xs text-brand-700">Capacity (guests)<input name="capacity" type="number" min="1" required defaultValue={category?.capacity} className="mt-1 w-full px-3 py-2 border border-brand-200 rounded-md bg-white text-sm" /></label>
        <label className="text-xs text-brand-700">Quantity (rooms)<input name="quantity" type="number" min="1" required defaultValue={category?.quantity} className="mt-1 w-full px-3 py-2 border border-brand-200 rounded-md bg-white text-sm" /></label>
        <label className="text-xs text-brand-700 md:col-span-3">Amenities (comma separated)<input name="amenities" required defaultValue={category?.amenities} className="mt-1 w-full px-3 py-2 border border-brand-200 rounded-md bg-white text-sm" /></label>
        <div className="md:col-span-3">
          <div className="text-xs text-brand-700 mb-1">Room Image</div>
          <div className="flex items-center gap-3">
            {image ? (
              <img src={image} alt="preview" className="w-20 h-20 rounded object-cover border border-brand-200" />
            ) : (
              <div className="w-20 h-20 rounded bg-white border border-dashed border-brand-200 flex items-center justify-center text-brand-300 text-xs">No image</div>
            )}
            <div className="flex flex-col gap-2">
              <label className={`px-3 py-1.5 bg-white border border-brand-200 rounded-md text-xs cursor-pointer hover:bg-brand-100 inline-flex items-center gap-1 w-fit ${uploading ? "opacity-60 pointer-events-none" : ""}`}>
                <Plus className="w-3 h-3" /> {uploading ? "Uploading..." : (image ? "Replace Image" : "Upload Image")}
                <input type="file" accept="image/*" disabled={uploading} className="hidden" onChange={(e) => handleImage(e.target.files?.[0] || null)} />
              </label>
              {image && (
                <button type="button" onClick={() => setImage(undefined)} className="px-3 py-1.5 border border-red-200 text-red-600 rounded-md text-xs hover:bg-red-50 inline-flex items-center gap-1 w-fit">
                  <Trash2 className="w-3 h-3" /> Remove
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="flex justify-end gap-2 mt-3">
        <button type="button" onClick={onCancel} className="px-3 py-1.5 border border-brand-200 rounded-md text-xs hover:bg-white flex items-center gap-1"><X className="w-3 h-3" /> Cancel</button>
        <button type="submit" className="px-3 py-1.5 bg-brand-800 text-cream-50 rounded-md text-xs hover:bg-brand-900 flex items-center gap-1"><Check className="w-3 h-3" /> Save</button>
      </div>
    </form>
  );
}

// =================== EMPLOYEES ===================
function EmployeesTab() {
  const [employees, setEmployees] = useState<Employee[]>(seedEmployees);
  const [editing, setEditing] = useState<Employee | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [filterDept, setFilterDept] = useState("all");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    supabase.from("employees").select("*").order("name").then(({ data }) => { if (data) setEmployees(data as Employee[]); });
  }, []);

  const departments = ["all", ...Array.from(new Set(employees.map((e) => e.department)))];
  const filtered = filterDept === "all" ? employees : employees.filter((e) => e.department === filterDept);
  const allSelected = filtered.length > 0 && filtered.every((e) => selectedIds.includes(e.id));

  const save = async (data: Omit<Employee, "id"> & { id?: string }) => {
    if (data.id) {
      await supabase.from("employees").update(data).eq("id", data.id);
      setEmployees((es) => es.map((e) => e.id === data.id ? { ...e, ...data, id: data.id! } : e));
    } else {
      const id = `EMP-${String(employees.length + 1).padStart(3, "0")}`;
      const { error } = await supabase.from("employees").insert({ ...data, id });
      if (!error) setEmployees((es) => [...es, { ...data, id }]);
    }
    setEditing(null);
    setShowForm(false);
  };

  const toggleAll = () => {
    if (allSelected) setSelectedIds((c) => c.filter((id) => !filtered.find((f) => f.id === id)));
    else setSelectedIds(Array.from(new Set([...selectedIds, ...filtered.map((f) => f.id)])));
  };

  const removeSelected = async () => {
    await supabase.from("employees").delete().in("id", selectedIds);
    setEmployees((es) => es.filter((e) => !selectedIds.includes(e.id)));
    setSelectedIds([]);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<Users className="w-5 h-5" />} label="Total Employees" value={employees.length.toString()} />
        <StatCard icon={<Users className="w-5 h-5" />} label="Active" value={employees.filter((e) => e.status === "Active").length.toString()} />
        <StatCard icon={<Users className="w-5 h-5" />} label="On Leave" value={employees.filter((e) => e.status === "On Leave").length.toString()} />
        <StatCard icon={<Users className="w-5 h-5" />} label="Departments" value={(departments.length - 1).toString()} />
      </div>

      <div className="bg-white rounded-xl border border-brand-100 p-6">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <UserCog className="w-5 h-5 text-brand-600" />
            <div>
              <h3 className="font-serif text-xl text-brand-900">Employee Management</h3>
              <div className="text-xs text-brand-600">Manage staff profiles, departments, shifts, and status</div>
            </div>
          </div>
          <div className="flex gap-2 items-center">
            {selectedIds.length > 0 && (
              <button onClick={removeSelected} className="px-3 py-2 bg-red-600 text-white rounded-md text-xs hover:bg-red-700 flex items-center gap-1">
                <Trash2 className="w-3.5 h-3.5" /> Delete {selectedIds.length}
              </button>
            )}
            <select value={filterDept} onChange={(e) => setFilterDept(e.target.value)} className="px-3 py-2 text-xs border border-brand-200 rounded-md bg-white">
              {departments.map((d) => <option key={d} value={d}>{d === "all" ? "All Departments" : d}</option>)}
            </select>
            <button onClick={() => { setEditing(null); setShowForm(true); }} className="px-3 py-2 bg-brand-800 text-cream-50 rounded-md text-xs hover:bg-brand-900 flex items-center gap-1">
              <Plus className="w-3.5 h-3.5" /> Add Employee
            </button>
          </div>
        </div>

        {(showForm || editing) && (
          <EmployeeForm
            employee={editing}
            onSave={save}
            onCancel={() => { setEditing(null); setShowForm(false); }}
          />
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-brand-600 uppercase tracking-wider border-b border-brand-100">
                <th className="text-left pb-2 font-medium"><input type="checkbox" checked={allSelected} onChange={toggleAll} className="h-4 w-4 accent-brand-700" /></th>
                <th className="text-left pb-2 font-medium">ID</th>
                <th className="text-left pb-2 font-medium">Name</th>
                <th className="text-left pb-2 font-medium">Position</th>
                <th className="text-left pb-2 font-medium">Department</th>
                <th className="text-left pb-2 font-medium">Contact</th>
                <th className="text-left pb-2 font-medium">Shift</th>
                <th className="text-left pb-2 font-medium">Status</th>
                <th className="text-right pb-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-50">
              {filtered.map((emp) => (
                <tr key={emp.id} className="hover:bg-brand-50/40">
                  <td className="py-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(emp.id)}
                      onChange={() => setSelectedIds((c) => c.includes(emp.id) ? c.filter((id) => id !== emp.id) : [...c, emp.id])}
                      className="h-4 w-4 accent-brand-700"
                    />
                  </td>
                  <td className="py-3 font-mono text-xs text-brand-700">{emp.id}</td>
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-xs font-medium">
                        {emp.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                      </div>
                      <div className="font-medium text-brand-900">{emp.name}</div>
                    </div>
                  </td>
                  <td className="py-3 text-brand-700">{emp.position}</td>
                  <td className="py-3 text-brand-700 text-xs">{emp.department}</td>
                  <td className="py-3 text-brand-700 text-xs">
                    <div>{emp.email}</div>
                    <div className="text-brand-500">{emp.phone}</div>
                  </td>
                  <td className="py-3 text-brand-700 text-xs">{emp.shift}</td>
                  <td className="py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${emp.status === "Active" ? "bg-emerald-100 text-emerald-800" : emp.status === "On Leave" ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-700"}`}>
                      {emp.status}
                    </span>
                  </td>
                  <td className="py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => { setEditing(emp); setShowForm(false); }} className="p-1.5 rounded hover:bg-brand-100 text-brand-600"><Pencil className="w-3.5 h-3.5" /></button>
                      <button onClick={async () => { await supabase.from("employees").delete().eq("id", emp.id); setEmployees((es) => es.filter((e) => e.id !== emp.id)); }} className="p-1.5 rounded hover:bg-red-50 text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function EmployeeForm({ employee, onSave, onCancel }: { employee: Employee | null; onSave: (data: Omit<Employee, "id"> & { id?: string }) => void; onCancel: () => void }) {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    onSave({
      id: employee?.id,
      name: String(fd.get("name")),
      position: String(fd.get("position")),
      department: String(fd.get("department")),
      email: String(fd.get("email")),
      phone: String(fd.get("phone")),
      shift: String(fd.get("shift")),
      status: String(fd.get("status")) as Employee["status"],
    });
  };

  return (
    <form onSubmit={handleSubmit} className="mb-4 p-4 rounded-lg bg-brand-50 border border-brand-100">
      <div className="text-xs uppercase tracking-wider text-brand-600 mb-3">{employee ? "Update" : "Add New"} Employee</div>
      <div className="grid md:grid-cols-3 gap-3">
        <label className="text-xs text-brand-700">Full Name<input name="name" required defaultValue={employee?.name} className="mt-1 w-full px-3 py-2 border border-brand-200 rounded-md bg-white text-sm" /></label>
        <label className="text-xs text-brand-700">Position<input name="position" required defaultValue={employee?.position} className="mt-1 w-full px-3 py-2 border border-brand-200 rounded-md bg-white text-sm" /></label>
        <label className="text-xs text-brand-700">Department
          <select name="department" required defaultValue={employee?.department || "Front Office"} className="mt-1 w-full px-3 py-2 border border-brand-200 rounded-md bg-white text-sm">
            <option>Executive</option><option>Front Office</option><option>Housekeeping</option><option>F&B</option><option>Sales & Marketing</option><option>Maintenance</option><option>Spa & Wellness</option><option>Security</option>
          </select>
        </label>
        <label className="text-xs text-brand-700">Email<input name="email" type="email" required defaultValue={employee?.email} className="mt-1 w-full px-3 py-2 border border-brand-200 rounded-md bg-white text-sm" /></label>
        <label className="text-xs text-brand-700">Phone<input name="phone" required defaultValue={employee?.phone} className="mt-1 w-full px-3 py-2 border border-brand-200 rounded-md bg-white text-sm" /></label>
        <label className="text-xs text-brand-700">Shift
          <select name="shift" required defaultValue={employee?.shift || "Day (9-6)"} className="mt-1 w-full px-3 py-2 border border-brand-200 rounded-md bg-white text-sm">
            <option>Morning (6-2)</option><option>Afternoon (2-10)</option><option>Evening (2-10)</option><option>Night (10-6)</option><option>Day (9-6)</option><option>Day (9-9)</option>
          </select>
        </label>
        <label className="text-xs text-brand-700">Status
          <select name="status" required defaultValue={employee?.status || "Active"} className="mt-1 w-full px-3 py-2 border border-brand-200 rounded-md bg-white text-sm">
            <option>Active</option><option>On Leave</option><option>Inactive</option>
          </select>
        </label>
      </div>
      <div className="flex justify-end gap-2 mt-3">
        <button type="button" onClick={onCancel} className="px-3 py-1.5 border border-brand-200 rounded-md text-xs hover:bg-white flex items-center gap-1"><X className="w-3 h-3" /> Cancel</button>
        <button type="submit" className="px-3 py-1.5 bg-brand-800 text-cream-50 rounded-md text-xs hover:bg-brand-900 flex items-center gap-1"><Check className="w-3 h-3" /> Save</button>
      </div>
    </form>
  );
}

// =================== HOUSEKEEPING ===================
function HousekeepingTab() {
  const [tasks, setTasks] = useState<HousekeepingTask[]>([]);
  const [editing, setEditing] = useState<HousekeepingTask | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    supabase.from("housekeeping_tasks").select("*").order("id").then(({ data }) => {
      if (data) setTasks(data.map((r: Record<string, unknown>) => ({
        id: r.id as string, roomNumber: r.room as string, assignedTo: r.assigned_to as string,
        taskType: r.task as string, priority: r.priority as HousekeepingTask["priority"],
        status: (r.status as string) as HousekeepingTask["status"], eta: r.eta as string,
      })));
    });
  }, []);

  const filtered = filterStatus === "all" ? tasks : tasks.filter((t) => t.status === filterStatus);
  const allSelected = filtered.length > 0 && filtered.every((t) => selectedIds.includes(t.id));

  const save = async (data: Omit<HousekeepingTask, "id"> & { id?: string }) => {
    const row = { room: data.roomNumber, assigned_to: data.assignedTo, task: data.taskType, priority: data.priority, status: data.status, eta: data.eta };
    if (data.id) {
      await supabase.from("housekeeping_tasks").update(row as never).eq("id", data.id);
      setTasks((ts) => ts.map((t) => t.id === data.id ? { ...t, ...data, id: data.id! } : t));
    } else {
      const id = `HK-${String(tasks.length + 1).padStart(3, "0")}`;
      const { error } = await supabase.from("housekeeping_tasks").insert({ id, ...row } as never);
      if (!error) setTasks((ts) => [...ts, { ...data, id }]);
    }
    setEditing(null);
    setShowForm(false);
  };

  const toggleAll = () => {
    if (allSelected) setSelectedIds((c) => c.filter((id) => !filtered.find((f) => f.id === id)));
    else setSelectedIds(Array.from(new Set([...selectedIds, ...filtered.map((f) => f.id)])));
  };

  const removeSelected = async () => {
    await supabase.from("housekeeping_tasks").delete().in("id", selectedIds);
    setTasks((ts) => ts.filter((t) => !selectedIds.includes(t.id)));
    setSelectedIds([]);
  };

  const updateStatus = (id: string, status: HousekeepingTask["status"]) => {
    setTasks((ts) => ts.map((t) => t.id === id ? { ...t, status } : t));
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<ClipboardList className="w-5 h-5" />} label="Total Tasks" value={tasks.length.toString()} />
        <StatCard icon={<ClipboardList className="w-5 h-5" />} label="Pending" value={tasks.filter((t) => t.status === "Pending").length.toString()} />
        <StatCard icon={<ClipboardList className="w-5 h-5" />} label="In Progress" value={tasks.filter((t) => t.status === "In Progress").length.toString()} />
        <StatCard icon={<ClipboardList className="w-5 h-5" />} label="Completed" value={tasks.filter((t) => t.status === "Completed").length.toString()} />
      </div>

      <div className="bg-white rounded-xl border border-brand-100 p-6">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-brand-600" />
            <div>
              <h3 className="font-serif text-xl text-brand-900">Housekeeping Management</h3>
              <div className="text-xs text-brand-600">Assign cleaning tasks, track priorities and completion</div>
            </div>
          </div>
          <div className="flex gap-2 items-center">
            {selectedIds.length > 0 && (
              <button onClick={removeSelected} className="px-3 py-2 bg-red-600 text-white rounded-md text-xs hover:bg-red-700 flex items-center gap-1">
                <Trash2 className="w-3.5 h-3.5" /> Delete {selectedIds.length}
              </button>
            )}
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="px-3 py-2 text-xs border border-brand-200 rounded-md bg-white">
              <option value="all">All Status</option>
              <option>Pending</option>
              <option>In Progress</option>
              <option>Completed</option>
            </select>
            <button onClick={() => { setEditing(null); setShowForm(true); }} className="px-3 py-2 bg-brand-800 text-cream-50 rounded-md text-xs hover:bg-brand-900 flex items-center gap-1">
              <Plus className="w-3.5 h-3.5" /> Assign Task
            </button>
          </div>
        </div>

        {(showForm || editing) && (
          <TaskForm
            task={editing}
            employees={seedEmployees.filter((e) => e.department === "Housekeeping")}
            onSave={save}
            onCancel={() => { setEditing(null); setShowForm(false); }}
          />
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-brand-600 uppercase tracking-wider border-b border-brand-100">
                <th className="text-left pb-2 font-medium"><input type="checkbox" checked={allSelected} onChange={toggleAll} className="h-4 w-4 accent-brand-700" /></th>
                <th className="text-left pb-2 font-medium">ID</th>
                <th className="text-left pb-2 font-medium">Room</th>
                <th className="text-left pb-2 font-medium">Task</th>
                <th className="text-left pb-2 font-medium">Assigned To</th>
                <th className="text-left pb-2 font-medium">Priority</th>
                <th className="text-left pb-2 font-medium">ETA</th>
                <th className="text-left pb-2 font-medium">Status</th>
                <th className="text-right pb-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-50">
              {filtered.map((task) => (
                <tr key={task.id} className="hover:bg-brand-50/40">
                  <td className="py-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(task.id)}
                      onChange={() => setSelectedIds((c) => c.includes(task.id) ? c.filter((id) => id !== task.id) : [...c, task.id])}
                      className="h-4 w-4 accent-brand-700"
                    />
                  </td>
                  <td className="py-3 font-mono text-xs text-brand-700">{task.id}</td>
                  <td className="py-3 font-medium text-brand-900">Room {task.roomNumber}</td>
                  <td className="py-3 text-brand-700">{task.taskType}</td>
                  <td className="py-3 text-brand-700 text-xs">{task.assignedTo}</td>
                  <td className="py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${task.priority === "High" ? "bg-red-100 text-red-800" : task.priority === "Medium" ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-700"}`}>
                      {task.priority}
                    </span>
                  </td>
                  <td className="py-3 text-brand-700 text-xs">{task.eta}</td>
                  <td className="py-3">
                    <select
                      value={task.status}
                      onChange={(e) => updateStatus(task.id, e.target.value as HousekeepingTask["status"])}
                      className={`text-xs px-2 py-1 rounded-full border-0 cursor-pointer ${task.status === "Completed" ? "bg-emerald-100 text-emerald-800" : task.status === "In Progress" ? "bg-blue-100 text-blue-800" : "bg-amber-100 text-amber-800"}`}
                    >
                      <option>Pending</option><option>In Progress</option><option>Completed</option>
                    </select>
                  </td>
                  <td className="py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => { setEditing(task); setShowForm(false); }} className="p-1.5 rounded hover:bg-brand-100 text-brand-600"><Pencil className="w-3.5 h-3.5" /></button>
                      <button onClick={async () => { await supabase.from("housekeeping_tasks").delete().eq("id", task.id); setTasks((ts) => ts.filter((t) => t.id !== task.id)); }} className="p-1.5 rounded hover:bg-red-50 text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function TaskForm({ task, employees, onSave, onCancel }: { task: HousekeepingTask | null; employees: Employee[]; onSave: (data: Omit<HousekeepingTask, "id"> & { id?: string }) => void; onCancel: () => void }) {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    onSave({
      id: task?.id,
      roomNumber: String(fd.get("roomNumber")),
      assignedTo: String(fd.get("assignedTo")),
      taskType: String(fd.get("taskType")),
      priority: String(fd.get("priority")) as HousekeepingTask["priority"],
      status: String(fd.get("status")) as HousekeepingTask["status"],
      eta: String(fd.get("eta")),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="mb-4 p-4 rounded-lg bg-brand-50 border border-brand-100">
      <div className="text-xs uppercase tracking-wider text-brand-600 mb-3">{task ? "Update" : "Assign New"} Task</div>
      <div className="grid md:grid-cols-3 gap-3">
        <label className="text-xs text-brand-700">Room Number<input name="roomNumber" required defaultValue={task?.roomNumber} className="mt-1 w-full px-3 py-2 border border-brand-200 rounded-md bg-white text-sm" /></label>
        <label className="text-xs text-brand-700">Assigned To
          <select name="assignedTo" required defaultValue={task?.assignedTo} className="mt-1 w-full px-3 py-2 border border-brand-200 rounded-md bg-white text-sm">
            {employees.map((e) => <option key={e.id}>{e.name}</option>)}
          </select>
        </label>
        <label className="text-xs text-brand-700">Task Type
          <select name="taskType" required defaultValue={task?.taskType || "Standard Clean"} className="mt-1 w-full px-3 py-2 border border-brand-200 rounded-md bg-white text-sm">
            <option>Standard Clean</option><option>Deep Clean + Turndown</option><option>Check-out Clean</option><option>Linen Refresh</option><option>Mini-bar Restock</option><option>VIP Turndown</option><option>Maintenance Check</option>
          </select>
        </label>
        <label className="text-xs text-brand-700">Priority
          <select name="priority" required defaultValue={task?.priority || "Medium"} className="mt-1 w-full px-3 py-2 border border-brand-200 rounded-md bg-white text-sm">
            <option>Low</option><option>Medium</option><option>High</option>
          </select>
        </label>
        <label className="text-xs text-brand-700">ETA<input name="eta" required defaultValue={task?.eta || "3:00 PM"} className="mt-1 w-full px-3 py-2 border border-brand-200 rounded-md bg-white text-sm" /></label>
        <label className="text-xs text-brand-700">Status
          <select name="status" required defaultValue={task?.status || "Pending"} className="mt-1 w-full px-3 py-2 border border-brand-200 rounded-md bg-white text-sm">
            <option>Pending</option><option>In Progress</option><option>Completed</option>
          </select>
        </label>
      </div>
      <div className="flex justify-end gap-2 mt-3">
        <button type="button" onClick={onCancel} className="px-3 py-1.5 border border-brand-200 rounded-md text-xs hover:bg-white flex items-center gap-1"><X className="w-3 h-3" /> Cancel</button>
        <button type="submit" className="px-3 py-1.5 bg-brand-800 text-cream-50 rounded-md text-xs hover:bg-brand-900 flex items-center gap-1"><Check className="w-3 h-3" /> Save</button>
      </div>
    </form>
  );
}

// =================== INTEGRATIONS ===================
function IntegrationsTab() {
  return (
    <div className="bg-white rounded-xl border border-brand-100 p-6">
      <div className="flex items-center gap-3 mb-4">
        <Globe className="w-5 h-5 text-brand-600" />
        <h3 className="font-serif text-xl text-brand-900">Channel Integrations</h3>
      </div>
      <div className="grid md:grid-cols-2 gap-3">
        {[
          { n: "Booking.com", s: "Connected", c: "emerald" },
          { n: "Expedia Partner Central", s: "Connected", c: "emerald" },
          { n: "Agoda YCS", s: "Connected", c: "emerald" },
          { n: "Amadeus GDS", s: "Connected", c: "emerald" },
          { n: "Airbnb", s: "Not connected", c: "slate" },
          { n: "TripAdvisor Instant Booking", s: "Connected", c: "emerald" },
        ].map((i) => (
          <div key={i.n} className="flex items-center justify-between p-3 border border-brand-100 rounded-md">
            <div className="font-medium text-brand-900 text-sm">{i.n}</div>
            <span className={`text-xs px-2 py-0.5 rounded-full ${i.c === "emerald" ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-700"}`}>{i.s}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// =================== PAYMENTS ===================
function PaymentsTab() {
  return (
    <div className="bg-white rounded-xl border border-brand-100 p-6">
      <div className="flex items-center gap-3 mb-4">
        <CreditCard className="w-5 h-5 text-brand-600" />
        <h3 className="font-serif text-xl text-brand-900">Payments & Tax</h3>
      </div>
      <div className="grid md:grid-cols-2 gap-x-8 gap-y-3 text-sm">
        <Row label="Payment Gateway" value="Stripe" />
        <Row label="Default Deposit" value="50% of room charges" />
        <Row label="GST / VAT" value="7%" />
        <Row label="Service Charge" value="10%" />
        <Row label="Cancellation Policy" value="Free up to 48h, 1-night after" />
        <Row label="Accepted Currencies" value="USD, THB, EUR, GBP" />
      </div>
    </div>
  );
}

// =================== NOTIFICATIONS ===================
function NotificationsTab() {
  return (
    <div className="bg-white rounded-xl border border-brand-100 p-6">
      <div className="flex items-center gap-3 mb-4">
        <Bell className="w-5 h-5 text-brand-600" />
        <h3 className="font-serif text-xl text-brand-900">Notifications</h3>
      </div>
      <div className="space-y-3">
        {[
          { t: "New reservation alerts", d: "Instant notification on every booking", on: true },
          { t: "VIP arrival alerts", d: "Gold & Platinum guest check-in reminders", on: true },
          { t: "Housekeeping status changes", d: "Real-time room status sync", on: true },
          { t: "Rate parity warnings", d: "When OTA prices diverge from BAR", on: true },
          { t: "Daily manager report (email)", d: "Auto-sent at 06:00 AM", on: false },
        ].map((n) => (
          <div key={n.t} className="flex items-center justify-between p-3 border border-brand-100 rounded-md">
            <div>
              <div className="text-sm font-medium text-brand-900">{n.t}</div>
              <div className="text-xs text-brand-600">{n.d}</div>
            </div>
            <div className={`w-10 h-6 rounded-full relative cursor-pointer ${n.on ? "bg-brand-600" : "bg-slate-300"}`}>
              <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition ${n.on ? "left-4" : "left-0.5"}`} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// =================== BRANDING ===================
function BrandingTab() {
  return (
    <div className="bg-white rounded-xl border border-brand-100 p-6">
      <div className="flex items-center gap-3 mb-4">
        <Palette className="w-5 h-5 text-brand-600" />
        <h3 className="font-serif text-xl text-brand-900">Branding & Theme</h3>
      </div>
      <div className="space-y-4">
        <div>
          <div className="text-xs uppercase tracking-wider text-brand-600 mb-2">Primary Palette</div>
          <div className="flex gap-2">
            {["#1a3826", "#245435", "#5fa06e", "#bcdcbc", "#b8923f", "#d4af6a"].map((c) => (
              <div key={c} className="w-12 h-12 rounded-md border border-brand-100" style={{ background: c }} />
            ))}
          </div>
        </div>
        <div>
          <div className="text-xs uppercase tracking-wider text-brand-600 mb-2">Property Logo</div>
          <div className="border-2 border-dashed border-brand-200 rounded-md p-8 text-center text-xs text-brand-500">Drop logo here or click to upload</div>
        </div>
      </div>
    </div>
  );
}

// =================== SECURITY ===================
function SecurityTab() {
  return (
    <div className="bg-white rounded-xl border border-brand-100 p-6">
      <div className="flex items-center gap-3 mb-4">
        <Shield className="w-5 h-5 text-brand-600" />
        <h3 className="font-serif text-xl text-brand-900">Security & Compliance</h3>
      </div>
      <div className="grid md:grid-cols-3 gap-4 text-sm">
        <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-100">
          <div className="text-emerald-800 font-medium mb-1">PCI DSS Compliant</div>
          <div className="text-xs text-emerald-700">Payment card data encrypted at rest & in transit</div>
        </div>
        <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-100">
          <div className="text-emerald-800 font-medium mb-1">GDPR Ready</div>
          <div className="text-xs text-emerald-700">Guest data handling per EU regulations</div>
        </div>
        <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-100">
          <div className="text-emerald-800 font-medium mb-1">2FA Enabled</div>
          <div className="text-xs text-emerald-700">Two-factor authentication for all admin accounts</div>
        </div>
      </div>
    </div>
  );
}

// =================== SHARED ===================
function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-2 border-b border-brand-50 last:border-0">
      <span className="text-brand-600">{label}</span>
      <span className="font-medium text-brand-900 text-right">{value}</span>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="bg-white rounded-xl border border-brand-100 p-5">
      <div className="w-10 h-10 rounded-lg bg-brand-100 text-brand-700 flex items-center justify-center mb-3">{icon}</div>
      <div className="font-serif text-3xl text-brand-900">{value}</div>
      <div className="text-sm text-brand-700">{label}</div>
    </div>
  );
}

// =================== GUESTS ===================
const TIERS: Guest["loyaltyTier"][] = ["Bronze", "Silver", "Gold", "Platinum"];
const tierBadge = (t: Guest["loyaltyTier"]) => ({
  Bronze: "bg-orange-100 text-orange-800",
  Silver: "bg-slate-200 text-slate-800",
  Gold: "bg-amber-100 text-amber-800",
  Platinum: "bg-indigo-100 text-indigo-800",
}[t]);

function GuestsTab() {
  const { guests, addGuestProfile, updateGuestProfile2, deleteGuestProfile } = useApp();
  const { addToast } = useToast();
  const [editing, setEditing] = useState<Guest | null>(null);
  const [creating, setCreating] = useState(false);
  const [search, setSearch] = useState("");
  const [inviting, setInviting] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");

  const filtered = guests.filter((g) =>
    [g.name, g.email, g.phone, g.country].some((f) => f?.toLowerCase().includes(search.toLowerCase()))
  );

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this guest profile?")) return;
    const res = await deleteGuestProfile(id);
    addToast(res.ok ? "success" : "error", res.ok ? "Guest deleted" : "Delete failed", res.error);
  };

  const inviteUrl = typeof window !== "undefined" ? `${window.location.origin}/guest-login` : "/guest-login";
  const mailtoLink = `mailto:${encodeURIComponent(inviteEmail)}?subject=${encodeURIComponent("You're invited to join our guest portal")}&body=${encodeURIComponent(`Hi there,\n\nYou're invited to register for our resort guest portal. Click the link below to get started:\n\n${inviteUrl}\n\nWe look forward to welcoming you!`)}`;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard label="Total Guests" value={String(guests.length)} icon={<Users className="w-5 h-5" />} />
        <StatCard label="Platinum" value={String(guests.filter((g) => g.loyaltyTier === "Platinum").length)} icon={<Sparkles className="w-5 h-5" />} />
        <StatCard label="Gold" value={String(guests.filter((g) => g.loyaltyTier === "Gold").length)} icon={<Sparkles className="w-5 h-5" />} />
        <StatCard label="Total Points" value={guests.reduce((s, g) => s + g.points, 0).toLocaleString()} icon={<ClipboardList className="w-5 h-5" />} />
      </div>

      <div className="bg-white rounded-xl border border-brand-100 p-6">
        <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
          <div>
            <h2 className="font-serif text-2xl text-brand-900">Guest Management</h2>
            <p className="text-sm text-brand-700">Create, edit, and remove guest profiles in the CRM.</p>
          </div>
          <div className="flex items-center gap-2">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search guests..."
              className="px-3 py-2 text-sm border border-brand-200 rounded-md bg-cream-50 w-64"
            />
            <button onClick={() => setCreating(true)} className="px-4 py-2 bg-brand-800 text-cream-50 rounded-md text-sm hover:bg-brand-900 flex items-center gap-2">
              <Plus className="w-4 h-4" /> New Guest
            </button>
          </div>
        </div>

        {guests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-brand-50 flex items-center justify-center mb-4">
              <Users className="w-8 h-8 text-brand-300" />
            </div>
            <h3 className="font-serif text-xl text-brand-900 mb-2">No guest accounts yet</h3>
            <p className="text-sm text-brand-600 max-w-md mb-6">
              Guest profiles will appear here once they register through the guest portal or when you add them manually.
            </p>
            <div className="flex items-center gap-3 flex-wrap justify-center">
              <button onClick={() => setCreating(true)} className="px-4 py-2 bg-brand-800 text-cream-50 rounded-md text-sm hover:bg-brand-900 flex items-center gap-2">
                <Plus className="w-4 h-4" /> Add First Guest
              </button>
              <Link to="/guest-login" className="px-4 py-2 border border-brand-200 text-brand-700 rounded-md text-sm hover:bg-brand-50 flex items-center gap-2">
                <UserPlus className="w-4 h-4" /> Guest Registration
              </Link>
              <button onClick={() => setInviting(true)} className="px-4 py-2 border border-brand-200 text-brand-700 rounded-md text-sm hover:bg-brand-50 flex items-center gap-2">
                <Mail className="w-4 h-4" /> Send Invitation
              </button>
            </div>

            {inviting && (
              <div className="mt-6 w-full max-w-sm p-4 rounded-lg bg-brand-50 border border-brand-100 text-left">
                <div className="text-xs uppercase tracking-wider text-brand-600 mb-3">Email Invitation</div>
                <label className="text-xs text-brand-700 block mb-1">Recipient email</label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="guest@example.com"
                  className="w-full px-3 py-2 text-sm border border-brand-200 rounded-md bg-white mb-3"
                />
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      if (!inviteEmail.trim()) {
                        addToast("error", "Email required", "Please enter a recipient email address.");
                        return;
                      }
                      window.location.href = mailtoLink;
                      setInviting(false);
                      setInviteEmail("");
                    }}
                    className={`px-3 py-1.5 rounded-md text-xs flex items-center gap-1 cursor-pointer ${inviteEmail.trim() ? "bg-brand-800 text-cream-50 hover:bg-brand-900" : "bg-brand-200 text-brand-400 cursor-not-allowed"}`}
                  >
                    <Send className="w-3.5 h-3.5" /> Open in Email Client
                  </button>
                  <button onClick={() => { setInviting(false); setInviteEmail(""); }} className="px-3 py-1.5 border border-brand-200 rounded-md text-xs hover:bg-white text-brand-700">
                    Cancel
                  </button>
                </div>
                <p className="text-[10px] text-brand-500 mt-2">
                  This opens your default email client with a pre-filled invitation message.
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-brand-500 border-b border-brand-100">
                  <th className="py-3">Name</th>
                  <th className="py-3">Contact</th>
                  <th className="py-3">Country</th>
                  <th className="py-3">Tier</th>
                  <th className="py-3">Points</th>
                  <th className="py-3">Stays</th>
                  <th className="py-3">Total Spent</th>
                  <th className="py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr><td colSpan={8} className="py-8 text-center text-brand-500">No guests found.</td></tr>
                )}
                {filtered.map((g) => (
                  <tr key={g.id} className="border-b border-brand-50 hover:bg-cream-50/50">
                    <td className="py-3">
                      <div className="font-medium text-brand-900">{g.name}</div>
                      <div className="text-xs text-brand-500">{g.id}</div>
                    </td>
                    <td className="py-3 text-brand-700">
                      <div>{g.email}</div>
                      <div className="text-xs text-brand-500">{g.phone}</div>
                    </td>
                    <td className="py-3 text-brand-700">{g.country || "—"}</td>
                    <td className="py-3"><span className={`px-2 py-1 rounded text-xs ${tierBadge(g.loyaltyTier)}`}>{g.loyaltyTier}</span></td>
                    <td className="py-3 text-brand-700">{g.points.toLocaleString()}</td>
                    <td className="py-3 text-brand-700">{g.totalStays}</td>
                    <td className="py-3 text-brand-700">${g.totalSpent.toLocaleString()}</td>
                    <td className="py-3 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button onClick={() => setEditing(g)} className="p-2 hover:bg-brand-100 rounded text-brand-700" title="Edit"><Pencil className="w-4 h-4" /></button>
                        <button onClick={() => handleDelete(g.id)} className="p-2 hover:bg-red-50 rounded text-red-600" title="Delete"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {(creating || editing) && (
        <GuestForm
          guest={editing}
          onCancel={() => { setCreating(false); setEditing(null); }}
          onSave={async (g) => {
            const res = editing ? await updateGuestProfile2(editing.id, g) : await addGuestProfile(g as Guest);
            addToast(res.ok ? "success" : "error", res.ok ? (editing ? "Guest updated" : "Guest created") : "Save failed", res.error);
            if (res.ok) { setCreating(false); setEditing(null); }
          }}
        />
      )}
    </div>
  );
}

function GuestForm({ guest, onCancel, onSave }: { guest: Guest | null; onCancel: () => void; onSave: (g: Partial<Guest>) => void }) {
  const { user } = useApp();
  const { addToast } = useToast();
  const isAdmin = user?.role === "admin";
  const setPwd = async (opts: { data: { email: string; password: string } }) => {
    throw new Error("Admin password management requires a server component. Not available in this build.");
  };
  const [draft, setDraft] = useState<Partial<Guest>>(guest ?? {
    id: "", name: "", email: "", phone: "", country: "",
    loyaltyTier: "Bronze", points: 0, totalStays: 0, totalSpent: 0,
    preferences: [], lastStay: "",
  });
  const [prefs, setPrefs] = useState<string>((guest?.preferences ?? []).join(", "));
  const [newPassword, setNewPassword] = useState("");
  const [savingPwd, setSavingPwd] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.name?.trim()) return;
    onSave({
      ...draft,
      preferences: prefs.split(",").map((p) => p.trim()).filter(Boolean),
    });
  };

  const saveNewPassword = async () => {
    if (!guest?.email) {
      addToast("error", "Email required", "This guest has no email on file.");
      return;
    }
    if (newPassword.length < 8) {
      addToast("error", "Password too short", "Use at least 8 characters.");
      return;
    }
    setSavingPwd(true);
    try {
      await setPwd({ data: { email: guest.email, password: newPassword } });
      addToast("success", "Password updated", guest.email);
      setNewPassword("");
    } catch (e: any) {
      addToast("error", "Failed to update password", e?.message || String(e));
    } finally {
      setSavingPwd(false);
    }
  };


  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={onCancel}>
      <form onClick={(e) => e.stopPropagation()} onSubmit={submit} className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-brand-100 flex items-center justify-between">
          <h3 className="font-serif text-2xl text-brand-900">{guest ? "Edit Guest" : "New Guest"}</h3>
          <button type="button" onClick={onCancel} className="p-1 hover:bg-brand-100 rounded"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="text-xs text-brand-700 md:col-span-2">Full Name *
            <input required value={draft.name ?? ""} onChange={(e) => setDraft({ ...draft, name: e.target.value })} className="mt-1 w-full px-3 py-2 border border-brand-200 rounded-md bg-white text-sm" />
          </label>
          <label className="text-xs text-brand-700">Email
            <input type="email" value={draft.email ?? ""} onChange={(e) => setDraft({ ...draft, email: e.target.value })} className="mt-1 w-full px-3 py-2 border border-brand-200 rounded-md bg-white text-sm" />
          </label>
          <label className="text-xs text-brand-700">Phone
            <input value={draft.phone ?? ""} onChange={(e) => setDraft({ ...draft, phone: e.target.value })} className="mt-1 w-full px-3 py-2 border border-brand-200 rounded-md bg-white text-sm" />
          </label>
          <label className="text-xs text-brand-700">Country
            <input value={draft.country ?? ""} onChange={(e) => setDraft({ ...draft, country: e.target.value })} className="mt-1 w-full px-3 py-2 border border-brand-200 rounded-md bg-white text-sm" />
          </label>
          <label className="text-xs text-brand-700">Loyalty Tier
            <select value={draft.loyaltyTier} onChange={(e) => setDraft({ ...draft, loyaltyTier: e.target.value as Guest["loyaltyTier"] })} className="mt-1 w-full px-3 py-2 border border-brand-200 rounded-md bg-white text-sm">
              {TIERS.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </label>
          <label className="text-xs text-brand-700">Points
            <input type="number" min="0" value={draft.points ?? 0} onChange={(e) => setDraft({ ...draft, points: Number(e.target.value) })} className="mt-1 w-full px-3 py-2 border border-brand-200 rounded-md bg-white text-sm" />
          </label>
          <label className="text-xs text-brand-700">Total Stays
            <input type="number" min="0" value={draft.totalStays ?? 0} onChange={(e) => setDraft({ ...draft, totalStays: Number(e.target.value) })} className="mt-1 w-full px-3 py-2 border border-brand-200 rounded-md bg-white text-sm" />
          </label>
          <label className="text-xs text-brand-700">Total Spent ($)
            <input type="number" min="0" step="0.01" value={draft.totalSpent ?? 0} onChange={(e) => setDraft({ ...draft, totalSpent: Number(e.target.value) })} className="mt-1 w-full px-3 py-2 border border-brand-200 rounded-md bg-white text-sm" />
          </label>
          <label className="text-xs text-brand-700">Last Stay
            <input type="date" value={draft.lastStay ?? ""} onChange={(e) => setDraft({ ...draft, lastStay: e.target.value })} className="mt-1 w-full px-3 py-2 border border-brand-200 rounded-md bg-white text-sm" />
          </label>
          <label className="text-xs text-brand-700 md:col-span-2">Preferences (comma-separated)
            <input value={prefs} onChange={(e) => setPrefs(e.target.value)} placeholder="Ocean view, Vegetarian, Late checkout" className="mt-1 w-full px-3 py-2 border border-brand-200 rounded-md bg-white text-sm" />
          </label>
        </div>
        {guest && isAdmin && (
          <div className="px-6 pb-6">
            <div className="border border-brand-200 rounded-lg p-4 bg-cream-50/50">
              <div className="flex items-center gap-2 mb-2">
                <KeyRound className="w-4 h-4 text-brand-700" />
                <h4 className="text-sm font-medium text-brand-900">Reset login password</h4>
              </div>
              <p className="text-xs text-brand-600 mb-3">
                Sets a new password for the auth account matching <strong>{guest.email || "—"}</strong>. Minimum 8 characters.
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="New password"
                  autoComplete="new-password"
                  className="flex-1 px-3 py-2 border border-brand-200 rounded-md bg-white text-sm font-mono"
                />
                <button
                  type="button"
                  disabled={savingPwd || !guest.email}
                  onClick={saveNewPassword}
                  className="px-4 py-2 bg-brand-800 text-cream-50 rounded-md text-sm hover:bg-brand-900 disabled:opacity-60 flex items-center gap-1"
                >
                  <Save className="w-4 h-4" /> {savingPwd ? "Saving…" : "Set password"}
                </button>
              </div>
            </div>
          </div>
        )}
        <div className="p-6 border-t border-brand-100 flex justify-end gap-2">
          <button type="button" onClick={onCancel} className="px-4 py-2 text-sm border border-brand-200 rounded-md hover:bg-brand-50">Cancel</button>
          <button type="submit" className="px-4 py-2 bg-brand-800 text-cream-50 rounded-md text-sm hover:bg-brand-900 flex items-center gap-2"><Save className="w-4 h-4" /> {guest ? "Update" : "Create"}</button>
        </div>
      </form>
    </div>
  );
}

// =================== ROLES & ACCESS ===================
type AppRole = "admin" | "employee" | "guest";
interface UserRow {
  id: string;
  email: string;
  full_name: string;
  roles: AppRole[];
}

function RolesTab() {
  const { user } = useApp();
  const { addToast } = useToast();
  const isAdmin = user?.role === "admin";
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editEmail, setEditEmail] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [credSavingId, setCredSavingId] = useState<string | null>(null);
  const updateCreds = async (opts: { data: { userId: string; email?: string; password?: string } }) => {
    throw new Error("Admin credential management requires a server component. Not available in this build.");
  };

  function startEdit(u: UserRow) {
    setEditingId(u.id);
    setEditEmail(u.email);
    setEditPassword("");
  }
  function cancelEdit() {
    setEditingId(null);
    setEditEmail("");
    setEditPassword("");
  }
  async function saveCreds(u: UserRow) {
    const emailChanged = editEmail.trim() && editEmail.trim() !== u.email;
    const passwordChanged = editPassword.length > 0;
    if (!emailChanged && !passwordChanged) {
      addToast("info", "No changes", "Update email or password to save.");
      return;
    }
    if (passwordChanged && editPassword.length < 8) {
      addToast("error", "Password too short", "Use at least 8 characters.");
      return;
    }
    setCredSavingId(u.id);
    try {
      await updateCreds({
        data: {
          userId: u.id,
          ...(emailChanged ? { email: editEmail.trim() } : {}),
          ...(passwordChanged ? { password: editPassword } : {}),
        },
      });
      addToast("success", "Credentials updated", u.email);
      if (emailChanged) {
        setUsers((prev) => prev.map((x) => (x.id === u.id ? { ...x, email: editEmail.trim() } : x)));
      }
      cancelEdit();
    } catch (e: any) {
      addToast("error", "Failed to update credentials", e?.message || String(e));
    } finally {
      setCredSavingId(null);
    }
  }

  async function loadUsers() {
    setLoading(true);
    try {
      let pq = supabase.from("profiles").select("id, email, full_name").order("email", { ascending: true }).limit(50);
      if (query.trim()) {
        const q = `%${query.trim()}%`;
        pq = pq.or(`email.ilike.${q},full_name.ilike.${q}`);
      }
      const { data: profiles, error: pErr } = await pq;
      if (pErr) throw pErr;
      const ids = (profiles ?? []).map((p) => p.id);
      let rolesByUser: Record<string, AppRole[]> = {};
      if (ids.length) {
        const { data: roles, error: rErr } = await supabase
          .from("user_roles").select("user_id, role").in("user_id", ids);
        if (rErr) throw rErr;
        rolesByUser = (roles ?? []).reduce<Record<string, AppRole[]>>((acc, r: any) => {
          (acc[r.user_id] ||= []).push(r.role);
          return acc;
        }, {});
      }
      setUsers((profiles ?? []).map((p: any) => ({
        id: p.id, email: p.email, full_name: p.full_name || "",
        roles: rolesByUser[p.id] || [],
      })));
    } catch (e: any) {
      addToast("error", "Failed to load users", e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { if (isAdmin) loadUsers(); /* eslint-disable-next-line */ }, [isAdmin]);

  async function toggleRole(u: UserRow, role: AppRole, has: boolean) {
    if (u.id === user?.id && role === "admin" && has) {
      if (!confirm("Remove your own admin role? You may lose access immediately.")) return;
    }
    setSavingId(u.id);
    try {
      if (has) {
        const { error } = await supabase.from("user_roles").delete()
          .eq("user_id", u.id).eq("role", role);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("user_roles")
          .insert({ user_id: u.id, role } as any);
        if (error) throw error;
      }
      setUsers((prev) => prev.map((x) => x.id !== u.id ? x : {
        ...x,
        roles: has ? x.roles.filter((r) => r !== role) : [...x.roles, role],
      }));
      addToast("success", `${has ? "Removed" : "Granted"} ${role}`, u.email);
    } catch (e: any) {
      addToast("error", "Failed to update role", e.message);
    } finally {
      setSavingId(null);
    }
  }

  if (!isAdmin) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 flex items-center gap-3">
        <Shield className="w-5 h-5 text-amber-600" />
        <div className="text-sm text-amber-900">Only administrators can manage staff roles.</div>
      </div>
    );
  }

  const roleBadge = (role: AppRole) => {
    const map: Record<AppRole, string> = {
      admin: "bg-rose-100 text-rose-800 border-rose-200",
      employee: "bg-sky-100 text-sky-800 border-sky-200",
      guest: "bg-brand-100 text-brand-700 border-brand-200",
    };
    return `text-xs px-2 py-0.5 rounded-full border ${map[role]}`;
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-brand-100 p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h2 className="font-serif text-2xl text-brand-900 flex items-center gap-2">
              <KeyRound className="w-5 h-5" /> Roles & Access
            </h2>
            <p className="text-sm text-brand-700 mt-1">
              Grant <strong>employee</strong> to allow front-desk &amp; reservation work, or <strong>admin</strong> for full access.
              Guests use the guest portal only.
            </p>
          </div>
          <div className="flex gap-2">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-brand-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") loadUsers(); }}
                placeholder="Search email or name…"
                className="pl-9 pr-3 py-2 border border-brand-200 rounded-md text-sm w-72 bg-white"
              />
            </div>
            <button onClick={loadUsers} className="px-4 py-2 bg-brand-800 text-cream-50 rounded-md text-sm hover:bg-brand-900">
              {loading ? "Loading…" : "Search"}
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-brand-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-brand-50 text-brand-800">
            <tr>
              <th className="text-left px-4 py-3 font-medium">User</th>
              <th className="text-left px-4 py-3 font-medium">Current roles</th>
              <th className="text-left px-4 py-3 font-medium">Assign</th>
              <th className="text-left px-4 py-3 font-medium">Credentials</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-brand-500">
                {loading ? "Loading users…" : "No users match your search."}
              </td></tr>
            )}
            {users.map((u) => {
              const roleList: AppRole[] = ["admin", "employee", "guest"];
              const isEditing = editingId === u.id;
              return (
                <Fragment key={u.id}>
                <tr key={u.id} className="border-t border-brand-100 hover:bg-brand-50/40">
                  <td className="px-4 py-3">
                    <div className="font-medium text-brand-900">{u.full_name || "—"}</div>
                    <div className="text-xs text-brand-600">{u.email}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {u.roles.length === 0
                        ? <span className="text-xs text-brand-400">No roles</span>
                        : u.roles.map((r) => <span key={r} className={roleBadge(r)}>{r}</span>)}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      {roleList.map((r) => {
                        const has = u.roles.includes(r);
                        return (
                          <button
                            key={r}
                            disabled={savingId === u.id}
                            onClick={() => toggleRole(u, r, has)}
                            className={`text-xs px-3 py-1.5 rounded-md border transition flex items-center gap-1 ${
                              has
                                ? "bg-brand-800 text-cream-50 border-brand-800 hover:bg-brand-900"
                                : "bg-white text-brand-700 border-brand-200 hover:bg-brand-50"
                            }`}
                          >
                            {has ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3" />} {r}
                          </button>
                        );
                      })}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {!isEditing ? (
                      <button
                        onClick={() => startEdit(u)}
                        className="text-xs px-3 py-1.5 rounded-md border bg-white text-brand-700 border-brand-200 hover:bg-brand-50 flex items-center gap-1"
                      >
                        <Pencil className="w-3 h-3" /> Edit
                      </button>
                    ) : (
                      <button
                        onClick={cancelEdit}
                        className="text-xs px-3 py-1.5 rounded-md border bg-white text-brand-700 border-brand-200 hover:bg-brand-50 flex items-center gap-1"
                      >
                        <X className="w-3 h-3" /> Close
                      </button>
                    )}
                  </td>
                </tr>
                {isEditing && (
                  <tr key={u.id + "-edit"} className="border-t border-brand-100 bg-brand-50/30">
                    <td colSpan={4} className="px-4 py-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                        <label className="text-xs text-brand-700">
                          New email
                          <input
                            type="email"
                            value={editEmail}
                            onChange={(e) => setEditEmail(e.target.value)}
                            className="mt-1 w-full px-3 py-2 border border-brand-200 rounded-md text-sm bg-white"
                            placeholder="user@example.com"
                          />
                        </label>
                        <label className="text-xs text-brand-700">
                          New password
                          <input
                            type="text"
                            value={editPassword}
                            onChange={(e) => setEditPassword(e.target.value)}
                            className="mt-1 w-full px-3 py-2 border border-brand-200 rounded-md text-sm bg-white font-mono"
                            placeholder="Leave blank to keep current"
                            autoComplete="new-password"
                          />
                        </label>
                        <div className="flex gap-2">
                          <button
                            disabled={credSavingId === u.id}
                            onClick={() => saveCreds(u)}
                            className="px-4 py-2 bg-brand-800 text-cream-50 rounded-md text-sm hover:bg-brand-900 disabled:opacity-60 flex items-center gap-1"
                          >
                            <Save className="w-4 h-4" /> {credSavingId === u.id ? "Saving…" : "Save"}
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="px-4 py-2 bg-white text-brand-700 border border-brand-200 rounded-md text-sm hover:bg-brand-50"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                      <div className="text-xs text-brand-500 mt-2">
                        Password must be at least 8 characters. Email change is auto-confirmed.
                      </div>
                    </td>
                  </tr>
                )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="text-xs text-brand-500">
        Tip: have the user sign up first via the staff login page, then return here to grant them the <em>employee</em> role.
      </div>
    </div>
  );
}
