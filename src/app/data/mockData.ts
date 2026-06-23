// Type definitions for Aquawood Garden Resort HSMS
// NOTE: All seed/mock data has been removed. Live data is loaded from Supabase.

export type RoomStatus = "available" | "occupied" | "dirty" | "maintenance" | "reserved";
export type RoomType = "Deluxe Garden" | "Lagoon Suite" | "Family Villa" | "Presidential Suite" | "Standard";

export interface Room {
  id: string;
  number: string;
  floor: number;
  type: RoomType;
  baseRate: number;
  status: RoomStatus;
  beds: string;
  capacity: number;
  amenities: string[];
  image: string;
}

export interface Reservation {
  id: string;
  guestName: string;
  guestId: string;
  roomId: string;
  checkIn: string;
  checkOut: string;
  rateCode: string;
  totalAmount: number;
  deposit: number;
  status: "confirmed" | "checked-in" | "checked-out" | "cancelled" | "no-show";
  source: "Website" | "Booking.com" | "Expedia" | "Walk-in" | "Phone" | "Travel Agent";
  adults: number;
  children: number;
  notes?: string;
}

export interface Guest {
  id: string;
  name: string;
  email: string;
  phone: string;
  country: string;
  loyaltyTier: "Bronze" | "Silver" | "Gold" | "Platinum";
  points: number;
  totalStays: number;
  totalSpent: number;
  preferences: string[];
  lastStay: string;
}

export interface Event {
  id: string;
  title: string;
  client: string;
  type: "Wedding" | "Conference" | "Banquet" | "Corporate Meeting";
  venue: string;
  date: string;
  guests: number;
  budget: number;
  status: "Proposal" | "Confirmed" | "In Progress" | "Completed";
  catering: string;
  avRequirements: string[];
}

export interface Channel {
  id: string;
  name: string;
  logo: string;
  syncStatus: "live" | "delayed" | "offline";
  bookings30d: number;
  revenue30d: number;
  commissionRate: number;
}

export interface RateCode {
  id: string;
  name: string;
  discount: number;
  description: string;
  active: boolean;
}

// Placeholder image URLs (used as defaults for new rooms before staff upload one).
export const images = {
  hero: "https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=1920&q=80",
  suite1: "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=1200&q=80",
  suite2: "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80",
  villa: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1200&q=80",
  presidential: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80",
  restaurant: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80",
  garden: "https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=1200&q=80",
};

// Empty arrays — preserved as exports so legacy imports don't break.
export const rooms: Room[] = [];
export const guests: Guest[] = [];
export const reservations: Reservation[] = [];
export const events: Event[] = [];
export const channels: Channel[] = [];
export const rateCodes: RateCode[] = [];
export const dailyMetrics: { date: string; occupancy: number; adr: number; revpar: number; revenue: number; bookings: number }[] = [];
export const housekeepingTasks: { id: string; room: string; priority: string; assignedTo: string; task: string; eta: string }[] = [];
export const users: { id: string; name: string; email: string; role: string; password: string; position?: string }[] = [];
