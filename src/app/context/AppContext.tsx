import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Room, Reservation, Guest, Event, RoomStatus } from "../data/mockData";
import { supabase } from "@/integrations/supabase/client";

// ---------- Supabase row mappers (snake_case <-> camelCase) ----------
type RoomRow = {
  id: string; number: string; floor: number; type: string; base_rate: number;
  status: RoomStatus; beds: string | null; capacity: number; amenities: unknown; image: string | null;
};
const roomFromRow = (r: RoomRow): Room => ({
  id: r.id, number: r.number, floor: r.floor, type: r.type as Room["type"],
  baseRate: Number(r.base_rate), status: r.status, beds: r.beds ?? "",
  capacity: r.capacity, amenities: Array.isArray(r.amenities) ? (r.amenities as string[]) : [],
  image: r.image ?? "",
});

type ReservationRow = {
  id: string; guest_name: string; guest_id: string | null; room_id: string | null;
  check_in: string; check_out: string; rate_code: string | null; total_amount: number;
  deposit: number; status: Reservation["status"]; source: string | null;
  adults: number; children: number; notes: string | null;
};
const reservationFromRow = (r: ReservationRow): Reservation => ({
  id: r.id, guestName: r.guest_name, guestId: r.guest_id ?? "", roomId: r.room_id ?? "",
  checkIn: r.check_in, checkOut: r.check_out, rateCode: r.rate_code ?? "",
  totalAmount: Number(r.total_amount), deposit: Number(r.deposit), status: r.status,
  source: (r.source ?? "Website") as Reservation["source"],
  adults: r.adults, children: r.children, notes: r.notes ?? undefined,
});
const reservationToRow = (r: Partial<Reservation>) => {
  const row: Record<string, unknown> = {};
  if (r.id !== undefined) row.id = r.id;
  if (r.guestName !== undefined) row.guest_name = r.guestName;
  if (r.guestId !== undefined) row.guest_id = r.guestId || null;
  if (r.roomId !== undefined) row.room_id = r.roomId || null;
  if (r.checkIn !== undefined) row.check_in = r.checkIn;
  if (r.checkOut !== undefined) row.check_out = r.checkOut;
  if (r.rateCode !== undefined) row.rate_code = r.rateCode;
  if (r.totalAmount !== undefined) row.total_amount = r.totalAmount;
  if (r.deposit !== undefined) row.deposit = r.deposit;
  if (r.status !== undefined) row.status = r.status;
  if (r.source !== undefined) row.source = r.source;
  if (r.adults !== undefined) row.adults = r.adults;
  if (r.children !== undefined) row.children = r.children;
  if (r.notes !== undefined) row.notes = r.notes ?? null;
  return row;
};

// guest_requests
type GuestRequestRow = {
  id: string; guest_user_id: string; booking_id: string | null;
  type: string; title: string; details: string | null;
  priority: "Normal" | "Urgent"; status: "Pending" | "Acknowledged" | "In Progress" | "Resolved";
  room_number: string | null; assigned_room: string | null;
  created_at: string; resolved_at: string | null;
};
const requestFromRow = (r: GuestRequestRow): GuestRequest => ({
  id: r.id, guestUserId: r.guest_user_id, bookingId: r.booking_id ?? undefined,
  type: r.type as GuestRequest["type"], title: r.title, details: r.details ?? "",
  priority: r.priority, status: r.status,
  roomNumber: r.room_number ?? "", assignedRoom: r.assigned_room ?? undefined,
  createdAt: new Date(r.created_at).toLocaleString(),
  resolvedAt: r.resolved_at ? new Date(r.resolved_at).toLocaleString() : undefined,
});

// emergency_alerts
type EmergencyRow = {
  id: string; guest_user_id: string | null; guest_name: string | null;
  room_number: string | null; message: string | null;
  acknowledged: boolean; created_at: string;
};
const emergencyFromRow = (r: EmergencyRow): EmergencyAlert => ({
  id: r.id, guestUserId: r.guest_user_id ?? "", guestName: r.guest_name ?? "Guest",
  roomNumber: r.room_number ?? "—", message: r.message ?? "",
  acknowledged: r.acknowledged, createdAt: new Date(r.created_at).toLocaleString(),
});

// guest_bookings
type GuestBookingRow = {
  id: string; guest_user_id: string; room_type: string; room_number: string | null;
  check_in: string; check_out: string; adults: number; children: number; nights: number;
  room_rate: number; addons: unknown; subtotal: number; tax: number; total: number;
  status: string; payment_status: string; special_requests: string | null; created_at: string;
};
const guestBookingFromRow = (r: GuestBookingRow): GuestBooking => ({
  id: r.id, guestUserId: r.guest_user_id, roomType: r.room_type,
  roomNumber: r.room_number ?? undefined,
  checkIn: r.check_in, checkOut: r.check_out, adults: r.adults, children: r.children,
  nights: r.nights, roomRate: Number(r.room_rate),
  addons: (r.addons as BookingAddon[]) ?? [],
  subtotal: Number(r.subtotal), tax: Number(r.tax), total: Number(r.total),
  status: r.status as GuestBooking["status"],
  paymentStatus: r.payment_status as GuestBooking["paymentStatus"],
  specialRequests: r.special_requests ?? "",
  createdAt: new Date(r.created_at).toLocaleString(),
});

// crm_guests
type CrmGuestRow = {
  id: string; name: string; email: string | null; phone: string | null; country: string | null;
  loyalty_tier: Guest["loyaltyTier"]; points: number; total_stays: number; total_spent: number;
  preferences: unknown; last_stay: string | null;
};
const guestFromRow = (r: CrmGuestRow): Guest => ({
  id: r.id, name: r.name, email: r.email ?? "", phone: r.phone ?? "", country: r.country ?? "",
  loyaltyTier: r.loyalty_tier, points: r.points, totalStays: r.total_stays,
  totalSpent: Number(r.total_spent),
  preferences: Array.isArray(r.preferences) ? (r.preferences as string[]) : [],
  lastStay: r.last_stay ?? "",
});
const guestToRow = (g: Partial<Guest>) => {
  const row: Record<string, unknown> = {};
  if (g.id !== undefined) row.id = g.id;
  if (g.name !== undefined) row.name = g.name;
  if (g.email !== undefined) row.email = g.email || null;
  if (g.phone !== undefined) row.phone = g.phone || null;
  if (g.country !== undefined) row.country = g.country || null;
  if (g.loyaltyTier !== undefined) row.loyalty_tier = g.loyaltyTier;
  if (g.points !== undefined) row.points = g.points;
  if (g.totalStays !== undefined) row.total_stays = g.totalStays;
  if (g.totalSpent !== undefined) row.total_spent = g.totalSpent;
  if (g.preferences !== undefined) row.preferences = g.preferences;
  if (g.lastStay !== undefined) row.last_stay = g.lastStay || null;
  return row;
};

export type Department = "Executive" | "Front Office" | "Housekeeping" | "F&B" | "Sales & Marketing" | "Maintenance" | "Accounting";

interface User {
  id: string;
  name: string;
  email: string;
  role: "admin" | "employee";
  position?: string;
  department?: Department;
}

// Initial admin bootstrap. On first sign-in with the matching password the
// account is auto-created in Supabase Auth with the admin role so auth.uid()
// is valid. All other staff accounts must be created via the Settings page.
const ADMIN_BOOTSTRAP_EMAIL = "admin@aquawood.com";
const ADMIN_BOOTSTRAP_PASSWORD = "Aquawood2026!";
const STAFF_INFO: Record<string, { name: string; role: "admin" | "employee"; position?: string; department?: Department }> = {
  [ADMIN_BOOTSTRAP_EMAIL]: { name: "Administrator", role: "admin", department: "Executive" },
};

// ============ GUEST / ONLINE USER ============
export interface GuestUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  password: string;
  avatar?: string | null;
  loyaltyTier: "Bronze" | "Silver" | "Gold" | "Platinum";
  points: number;
  joinedAt: string;
}

// ============ GUEST BOOKING (online) ============
export type AddonId = "breakfast" | "airport-pickup" | "early-checkin" | "late-checkout" | "spa" | "tour" | "extra-bed" | "decoration";
export interface BookingAddon { id: AddonId; name: string; price: number; quantity: number }

export interface GuestBooking {
  id: string;
  guestUserId: string;
  roomType: string;
  roomNumber?: string;
  checkIn: string;
  checkOut: string;
  adults: number;
  children: number;
  nights: number;
  roomRate: number; // PHP per night
  addons: BookingAddon[];
  subtotal: number;
  tax: number;
  total: number;
  status: "Pending" | "Confirmed" | "Checked-in" | "Checked-out" | "Cancelled";
  paymentStatus: "Unpaid" | "Partial" | "Paid";
  specialRequests: string;
  createdAt: string;
}

// ============ FOOD ORDER (guest portal) ============
export interface GuestFoodOrder {
  id: string;
  guestUserId: string;
  bookingId?: string;
  items: { name: string; price: number; qty: number }[];
  total: number;
  deliverTo: string; // room number or table
  status: "Placed" | "Preparing" | "On the way" | "Delivered" | "Cancelled";
  notes: string;
  createdAt: string;
}

// ============ GUEST REQUESTS & BUZZ ============
export type RequestType = "Housekeeping" | "Maintenance" | "Concierge" | "Amenities" | "Buzz Reception" | "Room Change";
export type RequestPriority = "Normal" | "Urgent";
export type RequestStatus = "Pending" | "Acknowledged" | "In Progress" | "Resolved";

export interface GuestRequest {
  id: string;
  guestUserId: string;
  bookingId?: string;
  type: RequestType;
  title: string;
  details: string;
  priority: RequestPriority;
  status: RequestStatus;
  roomNumber: string;
  createdAt: string;
  resolvedAt?: string;
  assignedRoom?: string; // for Room Change approval
}

// ============ EMERGENCY ============
export interface EmergencyAlert {
  id: string;
  guestUserId: string;
  guestName: string;
  roomNumber: string;
  message: string;
  createdAt: string;
  acknowledged: boolean;
}

// ============ PROPERTY ============
export interface PropertyProfile {
  name: string;
  tagline: string;
  type: string;
  starRating: string;
  totalRooms: string;
  totalFloors: string;
  totalEmployees: string;
  address: string;
  city: string;
  country: string;
  timezone: string;
  currency: string;
  established: string;
  gardenArea: string;
  phone: string;
  email: string;
  website: string;
  description: string;
  logo: string | null;
  favicon: string | null;
}

const defaultProfile: PropertyProfile = {
  name: "Aquawood Garden Resort, Hotel & Restaurant",
  tagline: "Where Garden Serenity Meets Filipino Hospitality",
  type: "Garden Resort, Hotel & Restaurant",
  starRating: "3.5-Star",
  totalRooms: "28",
  totalFloors: "4",
  totalEmployees: "60+",
  address: "BRGY. Malabanban Norte, Pan-Philippine (Maharlika) Hwy",
  city: "Candelaria, Quezon",
  country: "Philippines",
  timezone: "GMT+8 (Philippines)",
  currency: "PHP (₱)",
  established: "2018",
  gardenArea: "3 hectares",
  phone: "0967 267 3603",
  email: "aquawoodgarden@gmail.com",
  website: "facebook.com/aquawoodsgardenhotel",
  description: "A garden retreat in the heart of Candelaria, Quezon — offering refined accommodations, authentic Filipino cuisine, event venues and warm hospitality just off the Maharlika Highway.",
  logo: null,
  favicon: null,
};

// ============ SEED DATA (intentionally empty for production) ============
const seedGuestUsers: GuestUser[] = [];
const seedGuestBookings: GuestBooking[] = [];
const seedFoodOrders: GuestFoodOrder[] = [];
const seedRequests: GuestRequest[] = [];

// ============ CONTEXT ============
interface Ctx {
  user: User | null;
  guestUser: GuestUser | null;
  hydrating: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  loginGuest: (email: string, password: string) => boolean;
  registerGuest: (data: { name: string; email: string; phone: string; password: string }) => { ok: boolean; error?: string };
  updateGuestProfile: (patch: Partial<GuestUser>) => void;
  logout: () => void;
  logoutGuest: () => void;
  rooms: Room[];
  reservations: Reservation[];
  guests: Guest[];
  events: Event[];
  property: PropertyProfile;
  updateProperty: (patch: Partial<PropertyProfile>) => void;
  setRoomStatus: (roomId: string, status: RoomStatus) => void;
  addRoom: (r: Omit<Room, "id"> & { id?: string }) => Promise<{ ok: boolean; error?: string }>;
  updateRoom: (roomId: string, patch: Partial<Room>) => Promise<{ ok: boolean; error?: string }>;
  deleteRoom: (roomId: string) => Promise<{ ok: boolean; error?: string }>;
  checkIn: (reservationId: string) => void;
  checkOut: (reservationId: string) => void;
  addReservation: (r: Reservation) => Promise<{ ok: boolean; error?: string }>;
  updateReservation: (reservationId: string, patch: Partial<Reservation>) => void;
  deleteReservation: (reservationId: string) => void;
  deleteReservations: (reservationIds: string[]) => void;
  addEvent: (e: Event) => void;
  // Guest portal data
  guestBookings: GuestBooking[];
  addGuestBooking: (b: GuestBooking) => Promise<boolean>;
  updateGuestBooking: (id: string, patch: Partial<GuestBooking>) => void;
  cancelGuestBooking: (id: string) => void;
  guestFoodOrders: GuestFoodOrder[];
  addGuestFoodOrder: (o: GuestFoodOrder) => void;
  guestRequests: GuestRequest[];
  addGuestRequest: (r: GuestRequest) => void;
  updateRequestStatus: (id: string, status: RequestStatus) => void;
  assignRoomToRequest: (id: string, roomId: string) => void;
  emergencyAlerts: EmergencyAlert[];
  addEmergency: (alert: EmergencyAlert) => void;
  acknowledgeEmergency: (id: string) => void;
  addGuestProfile: (g: Guest) => Promise<{ ok: boolean; error?: string }>;
  updateGuestProfile2: (id: string, patch: Partial<Guest>) => Promise<{ ok: boolean; error?: string }>;
  deleteGuestProfile: (id: string) => Promise<{ ok: boolean; error?: string }>;
}

const AppContext = createContext<Ctx | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [guestUser, setGuestUser] = useState<GuestUser | null>(null);
  const [hydrating, setHydrating] = useState(true);
  const [guestUsersList, setGuestUsersList] = useState<GuestUser[]>(seedGuestUsers);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [property, setProperty] = useState<PropertyProfile>(defaultProfile);
  const [guestBookings, setGuestBookings] = useState<GuestBooking[]>(seedGuestBookings);
  const [guestFoodOrders, setGuestFoodOrders] = useState<GuestFoodOrder[]>(seedFoodOrders);
  const [guestRequests, setGuestRequests] = useState<GuestRequest[]>(seedRequests);
  const [emergencyAlerts, setEmergencyAlerts] = useState<EmergencyAlert[]>([]);

  useEffect(() => {
    (async () => {
      // Load guest users from Supabase
      const { data: guestRows } = await supabase.from("guest_users").select("*");
      if (guestRows && guestRows.length > 0) {
        setGuestUsersList(guestRows.map((r: Record<string, unknown>) => ({
          id: r.id as string, name: r.name as string, email: r.email as string,
          phone: (r.phone as string) ?? "", password: r.password as string,
          loyaltyTier: (r.loyalty_tier as GuestUser["loyaltyTier"]) ?? "Bronze",
          points: (r.points as number) ?? 0, joinedAt: (r.joined_at as string) ?? "",
          avatar: r.avatar_url as string | null ?? null,
        })));
      }
      // Load property profile from Supabase
      const { data: propData } = await supabase.from("property_profile").select("data").eq("id", 1).maybeSingle();
      if (propData?.data) setProperty({ ...defaultProfile, ...(propData.data as Partial<PropertyProfile>) });
    })();
  }, []);

  // Hydrate staff & guest users from the Supabase auth session.
  useEffect(() => {
    const loadUser = async (authUser: { id: string; email?: string | null; user_metadata?: { role?: string } } | null) => {
      setUser(null);
      setGuestUser(null);
      if (!authUser) return;
      const metaRole = authUser.user_metadata?.role;
      if (metaRole === "guest") {
        const { data } = await supabase.from("guest_users").select("*").eq("email", (authUser.email ?? "").toLowerCase()).maybeSingle();
        if (data) {
          const r = data as Record<string, unknown>;
          setGuestUser({
            id: r.id as string, name: r.name as string, email: r.email as string,
            phone: (r.phone as string) ?? "", password: r.password as string,
            loyaltyTier: (r.loyalty_tier as GuestUser["loyaltyTier"]) ?? "Bronze",
            points: (r.points as number) ?? 0, joinedAt: (r.joined_at as string) ?? "",
            avatar: r.avatar_url as string | null ?? null,
          });
        }
        return;
      }
      const email = (authUser.email ?? "").toLowerCase();
      const [{ data: roleRow }, { data: profile }] = await Promise.all([
        supabase.from("user_roles").select("role").eq("user_id", authUser.id).maybeSingle(),
        supabase.from("profiles").select("full_name, position, department").eq("id", authUser.id).maybeSingle(),
      ]);
      const dbRole = roleRow?.role;
      const info = STAFF_INFO[email];
      const role: "admin" | "employee" | null =
        dbRole === "admin" || dbRole === "employee" ? dbRole : info?.role ?? null;
      if (!role) {
        // Not staff — try guest fallback (auth session may lack "guest" metadata)
        const { data: gData } = await supabase.from("guest_users").select("*").eq("email", email).maybeSingle();
        if (gData) {
          const r = gData as Record<string, unknown>;
          setGuestUser({
            id: r.id as string, name: r.name as string, email: r.email as string,
            phone: (r.phone as string) ?? "", password: r.password as string,
            loyaltyTier: (r.loyalty_tier as GuestUser["loyaltyTier"]) ?? "Bronze",
            points: (r.points as number) ?? 0, joinedAt: (r.joined_at as string) ?? "",
            avatar: r.avatar_url as string | null ?? null,
          });
        }
        return;
      }
      setUser({
        id: authUser.id, email,
        name: profile?.full_name || info?.name || email,
        role, position: profile?.position || info?.position,
        department: (profile?.department as Department | undefined) || info?.department,
      });
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setTimeout(() => { loadUser(session?.user ?? null); }, 0);
    });
    supabase.auth.getSession().then(({ data }) => {
      return loadUser(data.session?.user ?? null);
    }).finally(() => { setHydrating(false); });
    return () => { subscription.unsubscribe(); };
  }, []);

  // Load rooms & reservations from Supabase + subscribe to realtime changes
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [{ data: roomRows }, { data: resRows }] = await Promise.all([
        supabase.from("rooms").select("*").order("number"),
        supabase.from("reservations").select("*").order("check_in"),
      ]);
      if (cancelled) return;
      if (roomRows) setRooms(roomRows.map((r) => roomFromRow(r as RoomRow)));
      if (resRows) setReservations(resRows.map((r) => reservationFromRow(r as ReservationRow)));
    })();

    const channel = supabase
      .channel("rooms-reservations")
      .on("postgres_changes", { event: "*", schema: "public", table: "rooms" }, (payload) => {
        if (payload.eventType === "DELETE") {
          setRooms((rs) => rs.filter((r) => r.id !== (payload.old as RoomRow).id));
        } else {
          const row = roomFromRow(payload.new as RoomRow);
          setRooms((rs) => {
            const i = rs.findIndex((r) => r.id === row.id);
            return i >= 0 ? rs.map((r, idx) => idx === i ? row : r) : [...rs, row];
          });
        }
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "reservations" }, (payload) => {
        if (payload.eventType === "DELETE") {
          setReservations((rs) => rs.filter((r) => r.id !== (payload.old as ReservationRow).id));
        } else {
          const row = reservationFromRow(payload.new as ReservationRow);
          setReservations((rs) => {
            const i = rs.findIndex((r) => r.id === row.id);
            return i >= 0 ? rs.map((r, idx) => idx === i ? row : r) : [row, ...rs];
          });
        }
      })
      .subscribe();

    return () => { cancelled = true; supabase.removeChannel(channel); };
    // Re-run when staff user becomes available so RLS-gated rows load after login
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // Load guest_requests & emergency_alerts from Supabase + subscribe to realtime
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [{ data: reqRows }, { data: emRows }] = await Promise.all([
        supabase.from("guest_requests").select("*").order("created_at", { ascending: false }),
        supabase.from("emergency_alerts").select("*").order("created_at", { ascending: false }),
      ]);
      if (cancelled) return;
      if (reqRows) setGuestRequests(reqRows.map((r) => requestFromRow(r as GuestRequestRow)));
      if (emRows) setEmergencyAlerts(emRows.map((r) => emergencyFromRow(r as EmergencyRow)));
    })();

    const channel = supabase
      .channel("requests-emergencies")
      .on("postgres_changes", { event: "*", schema: "public", table: "guest_requests" }, (payload) => {
        if (payload.eventType === "DELETE") {
          setGuestRequests((rs) => rs.filter((r) => r.id !== (payload.old as GuestRequestRow).id));
        } else {
          const row = requestFromRow(payload.new as GuestRequestRow);
          setGuestRequests((rs) => {
            const i = rs.findIndex((r) => r.id === row.id);
            return i >= 0 ? rs.map((r, idx) => idx === i ? row : r) : [row, ...rs];
          });
        }
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "emergency_alerts" }, (payload) => {
        if (payload.eventType === "DELETE") {
          setEmergencyAlerts((a) => a.filter((e) => e.id !== (payload.old as EmergencyRow).id));
        } else {
          const row = emergencyFromRow(payload.new as EmergencyRow);
          setEmergencyAlerts((a) => {
            const i = a.findIndex((e) => e.id === row.id);
            return i >= 0 ? a.map((e, idx) => idx === i ? row : e) : [row, ...a];
          });
        }
      })
      .subscribe();

    return () => { cancelled = true; supabase.removeChannel(channel); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  useEffect(() => {
    if (property.favicon) {
      let link = document.querySelector("link[rel='icon']") as HTMLLinkElement | null;
      if (!link) {
        link = document.createElement("link");
        link.rel = "icon";
        document.head.appendChild(link);
      }
      link.href = property.favicon;
    }
    document.title = `${property.name} — Hospitality Sales Management`;
  }, [property.favicon, property.name]);

  // Load guest bookings when guest user is authenticated
  useEffect(() => {
    if (!guestUser) { setGuestBookings([]); return; }
    let cancelled = false;
    let channel: ReturnType<typeof supabase.channel> | null = null;
    (async () => {
      let authUserId: string | null = null;
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser) {
        authUserId = authUser.id;
      } else {
        const { data: sessionData } = await supabase.auth.getSession();
        authUserId = sessionData?.session?.user?.id ?? null;
      }
      if (!authUserId || cancelled) return;
      const { data } = await supabase
        .from("guest_bookings")
        .select("*")
        .eq("guest_user_id", authUserId)
        .order("created_at", { ascending: false });
      if (cancelled) return;
      if (data) setGuestBookings(data.map((r) => guestBookingFromRow(r as GuestBookingRow)));

      channel = supabase
        .channel("guest-bookings")
        .on("postgres_changes", { event: "*", schema: "public", table: "guest_bookings" }, (payload) => {
          if (payload.eventType === "DELETE") {
            setGuestBookings((bs) => bs.filter((b) => b.id !== (payload.old as GuestBookingRow).id));
          } else {
            const row = guestBookingFromRow(payload.new as GuestBookingRow);
            setGuestBookings((bs) => {
              const i = bs.findIndex((b) => b.id === row.id);
              return i >= 0 ? bs.map((b, idx) => idx === i ? row : b) : [row, ...bs];
            });
          }
        })
        .subscribe();
    })();

    return () => { cancelled = true; if (channel) supabase.removeChannel(channel); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [guestUser?.id]);

  const login = async (email: string, password: string): Promise<boolean> => {
    const normalized = email.trim().toLowerCase();
    const attempt = await supabase.auth.signInWithPassword({ email: normalized, password });
    if (!attempt.error) return true;

    // Bootstrap demo staff accounts on first sign-in: create the auth user with
    // the right role in metadata so the handle_new_user trigger seeds profile + role.
    const info = STAFF_INFO[normalized];
    if (!info || password !== ADMIN_BOOTSTRAP_PASSWORD) return false;

    const signup = await supabase.auth.signUp({
      email: normalized,
      password,
      options: { data: { full_name: info.name, role: info.role } },
    });
    if (signup.error && !/already registered|already exists/i.test(signup.error.message)) return false;

    const retry = await supabase.auth.signInWithPassword({ email: normalized, password });
    return !retry.error;
  };

  const loginGuest = async (email: string, password: string) => {
    const normalized = email.trim().toLowerCase();
    const { error } = await supabase.auth.signInWithPassword({ email: normalized, password });
    if (error) { console.error("[loginGuest] signInWithPassword error:", error); return false; }
    const { data } = await supabase.from("guest_users").select("*").eq("email", normalized).maybeSingle();
    if (data) {
      const r = data as Record<string, unknown>;
      setGuestUser({
        id: r.id as string, name: r.name as string, email: r.email as string,
        phone: (r.phone as string) ?? "", password: r.password as string,
        loyaltyTier: (r.loyalty_tier as GuestUser["loyaltyTier"]) ?? "Bronze",
        points: (r.points as number) ?? 0, joinedAt: (r.joined_at as string) ?? "",
        avatar: r.avatar_url as string | null ?? null,
      });
    }
    return true;
  };

  const registerGuest = async (data: { name: string; email: string; phone: string; password: string }) => {
    if (guestUsersList.some((g) => g.email.toLowerCase() === data.email.toLowerCase())) {
      return { ok: false, error: "An account with this email already exists." };
    }
    const id = `GU-${crypto.randomUUID().slice(0, 8)}`;
    const signup = await supabase.auth.signUp({
      email: data.email.trim().toLowerCase(),
      password: data.password,
      options: { data: { role: "guest", guest_id: id } },
    });
    if (signup.error) return { ok: false, error: signup.error.message };
    // Insert into guest_users table
    const { error: insertError } = await supabase.from("guest_users").insert({
      id, name: data.name, email: data.email.trim().toLowerCase(), phone: data.phone, password: data.password,
      loyalty_tier: "Bronze", points: 200, joined_at: new Date().toISOString().slice(0, 10),
    });
    if (insertError) console.error("[guest_users.insert]", insertError);
    // Set guest user immediately
    const newGuest: GuestUser = {
      id, name: data.name, email: data.email.trim().toLowerCase(), phone: data.phone, password: data.password,
      loyaltyTier: "Bronze", points: 200, joinedAt: new Date().toISOString().slice(0, 10),
    };
    setGuestUser(newGuest);
    setGuestUsersList((prev) => [...prev, newGuest]);
    return { ok: true };
  };

  const updateGuestProfile = async (patch: Partial<GuestUser>) => {
    if (!guestUser) return;
    const updated = { ...guestUser, ...patch };
    setGuestUser(updated);
    setGuestUsersList((prev) => prev.map((g) => g.id === updated.id ? updated : g));
    await supabase.from("guest_users").update({
      name: patch.name, email: patch.email, phone: patch.phone,
      password: patch.password, avatar_url: patch.avatar,
      loyalty_tier: patch.loyaltyTier, points: patch.points,
    }).eq("id", guestUser.id);
  };

  const logout = () => {
    void supabase.auth.signOut();
    setUser(null);
  };

  const logoutGuest = () => {
    void supabase.auth.signOut();
    setGuestUser(null);
  };

  const updateProperty = async (patch: Partial<PropertyProfile>) => {
    setProperty((p) => {
      const next = { ...p, ...patch };
      void supabase.from("property_profile").upsert({ id: 1, data: next as never }, { onConflict: "id" });
      return next;
    });
  };

  const setRoomStatus = async (roomId: string, status: RoomStatus) => {
    setRooms((rs) => rs.map((r) => r.id === roomId ? { ...r, status } : r)); // optimistic
    const { error } = await supabase.from("rooms").update({ status }).eq("id", roomId);
    if (error) console.error("[rooms.update]", error);
  };

  const addRoom = async (r: Omit<Room, "id"> & { id?: string }) => {
    const id = r.id || `R-${Date.now().toString().slice(-6)}`;
    const row = {
      id, number: r.number, floor: r.floor, type: r.type, base_rate: r.baseRate,
      status: r.status, beds: r.beds || null, capacity: r.capacity,
      amenities: r.amenities as unknown as never, image: r.image || null,
    };
    const { error } = await supabase.from("rooms").insert(row as never);
    if (error) { console.error("[rooms.insert]", error); return { ok: false, error: error.message }; }
    return { ok: true };
  };

  const updateRoom = async (roomId: string, patch: Partial<Room>) => {
    const row: Record<string, unknown> = {};
    if (patch.number !== undefined) row.number = patch.number;
    if (patch.floor !== undefined) row.floor = patch.floor;
    if (patch.type !== undefined) row.type = patch.type;
    if (patch.baseRate !== undefined) row.base_rate = patch.baseRate;
    if (patch.status !== undefined) row.status = patch.status;
    if (patch.beds !== undefined) row.beds = patch.beds || null;
    if (patch.capacity !== undefined) row.capacity = patch.capacity;
    if (patch.amenities !== undefined) row.amenities = patch.amenities as unknown;
    if (patch.image !== undefined) row.image = patch.image || null;
    setRooms((rs) => rs.map((x) => x.id === roomId ? { ...x, ...patch } : x));
    const { error } = await supabase.from("rooms").update(row as never).eq("id", roomId);
    if (error) { console.error("[rooms.update]", error); return { ok: false, error: error.message }; }
    return { ok: true };
  };

  const deleteRoom = async (roomId: string) => {
    setRooms((rs) => rs.filter((r) => r.id !== roomId));
    const { error } = await supabase.from("rooms").delete().eq("id", roomId);
    if (error) { console.error("[rooms.delete]", error); return { ok: false, error: error.message }; }
    return { ok: true };
  };

  const checkIn = async (reservationId: string) => {
    const res = reservations.find((r) => r.id === reservationId);
    if (!res) return;
    setReservations((rs) => rs.map((r) => r.id === reservationId ? { ...r, status: "checked-in" } : r));
    const { error } = await supabase.from("reservations").update({ status: "checked-in" }).eq("id", reservationId);
    if (error) console.error("[reservations.checkIn]", error);
    if (res.roomId) await setRoomStatus(res.roomId, "occupied");
  };

  const checkOut = async (reservationId: string) => {
    const res = reservations.find((r) => r.id === reservationId);
    if (!res) return;
    setReservations((rs) => rs.map((r) => r.id === reservationId ? { ...r, status: "checked-out" } : r));
    const { error } = await supabase.from("reservations").update({ status: "checked-out" }).eq("id", reservationId);
    if (error) console.error("[reservations.checkOut]", error);
    if (res.roomId) await setRoomStatus(res.roomId, "dirty");
  };

  const addReservation = async (r: Reservation): Promise<{ ok: boolean; error?: string }> => {
    // Block overlapping active reservations for the same room
    const activeStatuses = ["confirmed", "checked-in"];
    const overlap = reservations.find(
      (x) =>
        x.id !== r.id &&
        x.roomId === r.roomId &&
        activeStatuses.includes(x.status) &&
        r.checkIn < x.checkOut &&
        r.checkOut > x.checkIn
    );
    if (overlap) {
      return { ok: false, error: `Room ${overlap.roomId} is already reserved from ${overlap.checkIn} to ${overlap.checkOut} (${overlap.guestName}).` };
    }

    // Optimistic insert so the UI updates immediately; realtime will de-dup.
    setReservations((rs) => (rs.some((x) => x.id === r.id) ? rs : [r, ...rs]));
    const { data, error } = await supabase
      .from("reservations")
      .insert(reservationToRow(r) as never)
      .select()
      .single();

    if (error) {
      // Roll back the optimistic row so a failed insert doesn't appear persisted.
      setReservations((rs) => rs.filter((x) => x.id !== r.id));
      console.error("[reservations.insert]", error);
      const msg = error.message;
      if (/permission denied|is_staff|has_role|row-level security|policy/i.test(msg)) {
        return {
          ok: false,
          error: "You don't have permission to create reservations. Only admin or staff accounts are allowed. Please log in with a staff account or contact your administrator.",
        };
      }
      return { ok: false, error: msg };
    }

    // Reconcile with the row the database actually stored.
    const saved = reservationFromRow(data as ReservationRow);
    setReservations((rs) => {
      const i = rs.findIndex((x) => x.id === saved.id);
      return i >= 0 ? rs.map((x, idx) => (idx === i ? saved : x)) : [saved, ...rs];
    });
    return { ok: true };
  };
  const updateReservation = async (reservationId: string, patch: Partial<Reservation>) => {
    const existing = reservations.find((r) => r.id === reservationId);
    if (!existing) return;
    const merged: Reservation = { ...existing, ...patch };
    // Block overlapping active reservations for the same room
    const activeStatuses = ["confirmed", "checked-in"];
    const overlap = reservations.find(
      (x) =>
        x.id !== reservationId &&
        x.roomId === merged.roomId &&
        activeStatuses.includes(x.status) &&
        merged.checkIn < x.checkOut &&
        merged.checkOut > x.checkIn
    );
    if (overlap) {
      console.error("[reservations.update] overlap", overlap);
      return;
    }
    setReservations((rs) => rs.map((r) => r.id === reservationId ? { ...r, ...patch } : r));
    const { error } = await supabase.from("reservations").update(reservationToRow(patch) as never).eq("id", reservationId);
    if (error) console.error("[reservations.update]", error);

    // Auto-sync room status when reservation status changes
    if (patch.status && patch.status !== existing.status && merged.roomId) {
      const nextRoomStatus: RoomStatus | null =
        patch.status === "checked-in" ? "occupied" :
        patch.status === "checked-out" ? "dirty" :
        patch.status === "cancelled" ? "available" :
        patch.status === "confirmed" ? "reserved" : null;
      if (nextRoomStatus) await setRoomStatus(merged.roomId, nextRoomStatus);
    }
  };
  const deleteReservation = async (reservationId: string) => {
    setReservations((rs) => rs.filter((r) => r.id !== reservationId));
    const { error } = await supabase.from("reservations").delete().eq("id", reservationId);
    if (error) console.error("[reservations.delete]", error);
  };
  const deleteReservations = async (reservationIds: string[]) => {
    setReservations((rs) => rs.filter((r) => !reservationIds.includes(r.id)));
    const { error } = await supabase.from("reservations").delete().in("id", reservationIds);
    if (error) console.error("[reservations.deleteMany]", error);
  };
  const addEvent = (e: Event) => setEvents((es) => [e, ...es]);

  // Guest portal actions
  const addGuestBooking = async (b: GuestBooking): Promise<boolean> => {
    setGuestBookings((bs) => [b, ...bs.filter((x) => x.id !== b.id)]);
    let authUserId: string | null = null;
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (authUser) {
      authUserId = authUser.id;
    } else {
      const { data: sessionData } = await supabase.auth.getSession();
      authUserId = sessionData?.session?.user?.id ?? null;
    }
    if (!authUserId) {
      console.warn("[addGuestBooking] no auth session — booking kept local only");
      return false;
    }
    const { error } = await supabase.from("guest_bookings").insert({
      id: b.id,
      guest_user_id: authUserId,
      room_type: b.roomType,
      room_number: b.roomNumber ?? null,
      check_in: b.checkIn,
      check_out: b.checkOut,
      adults: b.adults,
      children: b.children,
      nights: b.nights,
      room_rate: b.roomRate,
      addons: b.addons as unknown as never,
      subtotal: b.subtotal,
      tax: b.tax,
      total: b.total,
      status: b.status,
      payment_status: b.paymentStatus,
      special_requests: b.specialRequests || null,
    });
    if (error) {
      console.error("[guest_bookings.insert] code=%s message=%s details=%s hint=%s", error.code, error.message, error.details, error.hint);
      return false;
    }
    // The DB trigger mirrors this into public.reservations so Front Desk sees it.
    return true;
  };
  const updateGuestBooking = (id: string, patch: Partial<GuestBooking>) => {
    setGuestBookings((bs) => bs.map((b) => b.id === id ? { ...b, ...patch } : b));
  };
  const cancelGuestBooking = (id: string) => {
    setGuestBookings((bs) => bs.map((b) => b.id === id ? { ...b, status: "Cancelled" } : b));
  };
  const addGuestFoodOrder = async (o: GuestFoodOrder) => {
    setGuestFoodOrders((os) => [o, ...os]);
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) return;
    const { error } = await supabase.from("guest_food_orders").insert({
      id: o.id,
      guest_user_id: authUser.id,
      booking_id: o.bookingId ?? null,
      items: o.items as never,
      total: o.total,
      deliver_to: o.deliverTo || null,
      status: o.status,
      notes: o.notes || null,
    });
    if (error) console.error("[guest_food_orders.insert]", error);
  };

  const addGuestRequest = async (r: GuestRequest) => {
    // Optimistic local insert so guest UI is immediate
    setGuestRequests((rs) => [r, ...rs.filter((x) => x.id !== r.id)]);
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) return; // guest demo accounts aren't real auth users; keep local
    const { error } = await supabase.from("guest_requests").insert({
      id: r.id,
      guest_user_id: authUser.id,
      booking_id: r.bookingId ?? null,
      type: r.type,
      title: r.title,
      details: r.details || null,
      priority: r.priority,
      status: r.status,
      room_number: r.roomNumber || null,
    });
    if (error) console.error("[guest_requests.insert]", error);
  };
  const updateRequestStatus = async (id: string, status: RequestStatus) => {
    setGuestRequests((rs) => rs.map((r) => r.id === id ? { ...r, status, resolvedAt: status === "Resolved" ? new Date().toLocaleString() : r.resolvedAt } : r));
    const patch = status === "Resolved"
      ? { status, resolved_at: new Date().toISOString() }
      : { status };
    const { error } = await supabase.from("guest_requests").update(patch).eq("id", id);
    if (error) console.error("[guest_requests.update]", error);
  };
  const assignRoomToRequest = async (id: string, roomId: string) => {
    const target = rooms.find((r) => r.id === roomId);
    const label = target ? `Room ${target.number}` : roomId;
    setGuestRequests((rs) => rs.map((r) => r.id === id ? { ...r, assignedRoom: label, status: "Acknowledged" } : r));
    const { error } = await supabase.from("guest_requests")
      .update({ assigned_room: label, status: "Acknowledged" }).eq("id", id);
    if (error) console.error("[guest_requests.assign]", error);
  };
  const addEmergency = async (alert: EmergencyAlert) => {
    setEmergencyAlerts((a) => [alert, ...a.filter((x) => x.id !== alert.id)]);
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) return;
    const { error } = await supabase.from("emergency_alerts").insert({
      id: alert.id,
      guest_user_id: authUser.id,
      guest_name: alert.guestName,
      room_number: alert.roomNumber,
      message: alert.message,
      acknowledged: false,
    });
    if (error) console.error("[emergency_alerts.insert]", error);
  };
  const acknowledgeEmergency = async (id: string) => {
    setEmergencyAlerts((a) => a.map((e) => e.id === id ? { ...e, acknowledged: true } : e));
    const { error } = await supabase.from("emergency_alerts").update({ acknowledged: true }).eq("id", id);
    if (error) console.error("[emergency_alerts.ack]", error);
  };

  // ============ CRM GUESTS ============
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase.from("crm_guests").select("*").order("name");
      if (cancelled) return;
      if (error) { console.error("[crm_guests.load]", error); return; }
      if (data) setGuests(data.map((r) => guestFromRow(r as CrmGuestRow)));
    })();
    const channel = supabase
      .channel("crm-guests")
      .on("postgres_changes", { event: "*", schema: "public", table: "crm_guests" }, (payload) => {
        if (payload.eventType === "DELETE") {
          setGuests((gs) => gs.filter((g) => g.id !== (payload.old as CrmGuestRow).id));
        } else {
          const row = guestFromRow(payload.new as CrmGuestRow);
          setGuests((gs) => {
            const i = gs.findIndex((g) => g.id === row.id);
            return i >= 0 ? gs.map((g, idx) => idx === i ? row : g) : [...gs, row];
          });
        }
      })
      .subscribe();
    return () => { cancelled = true; supabase.removeChannel(channel); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const addGuestProfile = async (g: Guest) => {
    const id = g.id || `G-${Date.now()}`;
    const row = guestToRow({ ...g, id }) as never;
    const { error } = await supabase.from("crm_guests").insert(row);
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  };
  const updateGuestProfile2 = async (id: string, patch: Partial<Guest>) => {
    const row = guestToRow(patch) as never;
    const { error } = await supabase.from("crm_guests").update(row).eq("id", id);
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  };
  const deleteGuestProfile = async (id: string) => {
    const { error } = await supabase.from("crm_guests").delete().eq("id", id);
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  };

  return (
    <AppContext.Provider value={{
      user, guestUser, hydrating,
      login, loginGuest, registerGuest, updateGuestProfile, logout, logoutGuest,
      rooms, reservations, guests, events,
      property, updateProperty,
      setRoomStatus, addRoom, updateRoom, deleteRoom, checkIn, checkOut, addReservation, updateReservation, deleteReservation, deleteReservations, addEvent,
      guestBookings, addGuestBooking, updateGuestBooking, cancelGuestBooking,
      guestFoodOrders, addGuestFoodOrder,
      guestRequests, addGuestRequest, updateRequestStatus, assignRoomToRequest,
      emergencyAlerts, addEmergency, acknowledgeEmergency,
      addGuestProfile, updateGuestProfile2, deleteGuestProfile,
    }}>

      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside AppProvider");
  return ctx;
}
