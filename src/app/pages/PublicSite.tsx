import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useApp } from "../context/AppContext";
import { Leaf, Waves, Utensils, Star, MapPin, Phone, Mail, ArrowRight, Check, Users, CalendarDays, Sparkles, ChevronDown, Navigation } from "lucide-react";

// Resort images — imported so Vite inlines them into the single-file build
const heroImg = "/images/aquawood-hero.jpg";
const poolImg = "/images/aquawood-pool.jpg";
const gardenImg = "/images/aquawood-garden.jpg";
const roomImg = "/images/aquawood-room.jpg";
const restaurantImg = "/images/aquawood-restaurant.jpg";
const eventImg = "/images/aquawood-event.jpg";

const aq = {
  hero: heroImg,
  pool: poolImg,
  garden: gardenImg,
  room: roomImg,
  restaurant: restaurantImg,
  event: eventImg,
};

// Google Maps embed — exact location of Aquawood Garden Resort, Brgy. Malabanban Norte, Candelaria, Quezon
const MAP_EMBED = "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3870.6!2d121.4378!3d13.9293!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTPCsDU1JzQ1LjgiTiAxMjHCsDI2JzE2LjMiRQ!5e0!3m2!1sen!2sph!4v1700000000000!5m2!1sen!2sph";
const MAP_LINK = "https://www.google.com/maps/search/?api=1&query=Aquawood+Garden+Resort+Candelaria+Quezon&query_place_id=13.9293,121.4378";

export default function PublicSite() {
  const { property, rooms } = useApp();
  const [bookingOpen, setBookingOpen] = useState(false);
  const shortName = property.name.split(",")[0] || "Aquawood";
  const subName = property.name.split(",").slice(1).join(",").trim() || "Garden Resort";

  const featuredRooms = rooms.filter((r) => ["Lagoon Suite", "Presidential Suite", "Family Villa", "Deluxe Garden"].includes(r.type)).slice(0, 4);
  const uniqueTypes = Array.from(new Set(featuredRooms.map((r) => r.type)));

  return (
    <div className="min-h-screen bg-cream-50">
      {/* NAV */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-cream-50/85 backdrop-blur-md border-b border-brand-100">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            {property.logo ? (
              <img src={property.logo} alt={property.name} className="w-10 h-10 rounded-full object-cover bg-brand-50" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-600 to-brand-800 flex items-center justify-center text-cream-50">
                <Leaf className="w-5 h-5" />
              </div>
            )}
            <div className="leading-tight">
              <div className="font-serif text-xl text-brand-900">{shortName}</div>
              <div className="text-[10px] uppercase tracking-[0.2em] text-brand-600">{subName}</div>
            </div>
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm text-brand-800">
            <a href="#rooms" className="hover:text-brand-500 transition">Rooms</a>
            <a href="#dining" className="hover:text-brand-500 transition">Restaurant</a>
            <a href="#events" className="hover:text-brand-500 transition">Events</a>
            <a href="#pool" className="hover:text-brand-500 transition">Pool & Garden</a>
            <a href="#contact" className="hover:text-brand-500 transition">Contact</a>

            <Link to="/login" className="px-4 py-1.5 border border-brand-300 text-brand-700 rounded-full hover:bg-brand-50 transition text-xs">Login</Link>
            <button onClick={() => setBookingOpen(true)} className="px-5 py-2 bg-brand-800 text-cream-50 rounded-full hover:bg-brand-900 transition">Book Now</button>
          </nav>
        </div>
      </header>

      {/* HERO */}
      <section className="relative h-screen min-h-[700px]">
        <img src={aq.hero} alt={property.name} className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 hero-overlay" />
        <div className="relative z-10 h-full flex flex-col justify-center items-center text-center text-cream-50 px-6 pt-20">
          <div className="flex items-center gap-2 text-gold-400 uppercase tracking-[0.4em] text-xs mb-6 animate-fade-up">
            <Sparkles className="w-4 h-4" /> Candelaria, Quezon <Sparkles className="w-4 h-4" />
          </div>
          <h1 className="font-serif text-5xl md:text-7xl font-light leading-tight mb-6 animate-fade-up" style={{ animationDelay: "0.1s" }}>
            {property.tagline}
          </h1>
          <p className="max-w-2xl text-lg text-cream-100/90 mb-10 animate-fade-up" style={{ animationDelay: "0.2s" }}>
            A garden retreat just off the Maharlika Highway — refreshing pools, comfortable rooms, authentic Filipino cuisine, and beautiful venues for every celebration.
          </p>
          <div className="flex flex-wrap gap-4 justify-center animate-fade-up" style={{ animationDelay: "0.3s" }}>
            <button onClick={() => setBookingOpen(true)} className="px-8 py-3.5 bg-gold-500 text-white rounded-full hover:bg-gold-600 transition flex items-center gap-2 font-medium">
              Reserve Your Stay <ArrowRight className="w-4 h-4" />
            </button>
            <a href="#rooms" className="px-8 py-3.5 border border-cream-50/60 text-cream-50 rounded-full hover:bg-cream-50/10 transition">Explore the Resort</a>
          </div>
        </div>
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-cream-50 animate-bounce">
          <ChevronDown className="w-6 h-6" />
        </div>
      </section>

      {/* WELCOME */}
      <section className="py-24 px-6 bg-cream-50">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-16 items-center">
          <div>
            <div className="text-gold-500 uppercase tracking-[0.3em] text-xs mb-4">Welcome to {shortName}</div>
            <h2 className="font-serif text-5xl text-brand-900 mb-6 leading-tight">Your getaway in the heart of Quezon</h2>
            <p className="text-brand-800/80 leading-relaxed mb-4">
              Set within {property.gardenArea} of beautifully landscaped grounds in Barangay Malabanban Norte, Aquawood Garden Resort is a peaceful escape just minutes from the town center of Candelaria, Quezon. {property.description}
            </p>
            <p className="text-brand-800/80 leading-relaxed mb-8">
              Whether you're here for a family weekend, a wedding celebration, or a productive corporate retreat, our friendly team and {property.totalEmployees} staff members are ready to make your stay memorable.
            </p>
            <div className="grid grid-cols-3 gap-4">
              {[
                { n: property.totalRooms, l: "Comfortable Rooms" },
                { n: property.gardenArea.split(" ")[0], l: "Hectares of Garden" },
                { n: "3.5★", l: "Guest Rating" },
              ].map((s) => (
                <div key={s.l} className="border-l-2 border-gold-500 pl-4">
                  <div className="font-serif text-3xl text-brand-900">{s.n}</div>
                  <div className="text-xs text-brand-700 uppercase tracking-wider">{s.l}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="relative">
            <img src={aq.pool} alt="Aquawood pool" className="rounded-lg shadow-xl w-full aspect-[4/3] object-cover" />
            <img src={aq.garden} alt="Garden pathway" className="absolute -bottom-8 -left-8 w-48 h-48 rounded-lg shadow-xl border-4 border-cream-50 object-cover" />
          </div>
        </div>
      </section>

      {/* ROOMS */}
      <section id="rooms" className="py-24 px-6 bg-brand-900 text-cream-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="text-gold-400 uppercase tracking-[0.3em] text-xs mb-4">Accommodations</div>
            <h2 className="font-serif text-5xl mb-4">Rooms & Suites</h2>
            <p className="max-w-2xl mx-auto text-cream-100/70">Choose from {property.totalRooms} comfortable rooms — from cozy standard rooms perfect for couples, to spacious family villas with kitchenettes and garden views.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {uniqueTypes.map((type) => {
              const room = featuredRooms.find((r) => r.type === type)!;
              return (
                <div key={type} className="group cursor-pointer">
                  <div className="relative overflow-hidden rounded-lg aspect-[3/4] mb-4">
                    <img src={aq.room} alt={type} className="w-full h-full object-cover group-hover:scale-105 transition duration-700" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                    <div className="absolute bottom-4 left-4 right-4">
                      <div className="text-gold-400 text-xs uppercase tracking-wider mb-1">From ₱{(room.baseRate * 55).toLocaleString()}/night</div>
                      <div className="font-serif text-2xl">{type}</div>
                    </div>
                  </div>
                  <p className="text-cream-100/70 text-sm">{room.beds} · Up to {room.capacity} guests · {room.amenities.slice(0, 3).join(", ")}</p>
                </div>
              );
            })}
          </div>
          <div className="text-center mt-12">
            <button onClick={() => setBookingOpen(true)} className="px-8 py-3 bg-gold-500 text-white rounded-full hover:bg-gold-600 transition">Check Availability</button>
          </div>
        </div>
      </section>

      {/* DINING */}
      <section id="dining" className="py-24 px-6 bg-cream-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="text-gold-500 uppercase tracking-[0.3em] text-xs mb-4"><Utensils className="inline w-4 h-4 mr-2" />The Restaurant</div>
            <h2 className="font-serif text-5xl text-brand-900 mb-4">Authentic Filipino & International Cuisine</h2>
            <p className="max-w-2xl mx-auto text-brand-800/70">From hearty Filipino breakfasts to romantic dinner dates and large group banquets — our restaurant brings together fresh local ingredients with classic favorites.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { img: aq.restaurant, name: "Aquawood Restaurant", desc: "Indoor and al fresco dining with a wide menu of Filipino specialties, international dishes, and refreshing beverages. Open daily for breakfast, lunch & dinner.", price: "Casual Dining" },
              { img: aq.event, name: "Events & Catering", desc: "Birthday celebrations, weddings, debuts and corporate parties — our events team handles styling, catering and venue setup.", price: "By Reservation" },
              { img: aq.pool, name: "Poolside Service", desc: "Cool drinks, grilled favorites and Filipino merienda served right by the pool. The perfect way to relax after a swim.", price: "11 AM – 8 PM" },
            ].map((d) => (
              <div key={d.name} className="group">
                <div className="overflow-hidden rounded-lg aspect-[4/3] mb-4">
                  <img src={d.img} alt={d.name} className="w-full h-full object-cover group-hover:scale-105 transition duration-700" />
                </div>
                <div className="flex items-baseline justify-between mb-2">
                  <h3 className="font-serif text-2xl text-brand-900">{d.name}</h3>
                  <span className="text-gold-500 text-xs uppercase tracking-wider">{d.price}</span>
                </div>
                <p className="text-brand-800/70 text-sm leading-relaxed">{d.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* EVENTS */}
      <section id="events" className="py-24 px-6 bg-brand-50">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-16 items-center">
          <div>
            <div className="text-gold-500 uppercase tracking-[0.3em] text-xs mb-4">Events & Functions</div>
            <h2 className="font-serif text-5xl text-brand-900 mb-6 leading-tight">Celebrate the moments that matter</h2>
            <p className="text-brand-800/80 leading-relaxed mb-6">From intimate birthday parties and debuts to garden weddings and corporate team-buildings, our event spaces and dedicated team make sure every detail is taken care of. Tell us your vision — we'll bring it to life.</p>
            <ul className="space-y-3 mb-8">
              {["Capacity from 20 to 300 guests", "Indoor function halls & open-air garden venues", "Filipino & international catering menus", "Full styling, sound system & A/V available", "Discounted room blocks for guests"].map((f) => (
                <li key={f} className="flex items-center gap-3 text-brand-800"><Check className="w-5 h-5 text-gold-500 flex-shrink-0" /> {f}</li>
              ))}
            </ul>
            <button onClick={() => setBookingOpen(true)} className="px-8 py-3 bg-brand-800 text-cream-50 rounded-full hover:bg-brand-900 transition">Request Proposal</button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <img src={aq.event} alt="Wedding setup" className="rounded-lg w-full aspect-[3/4] object-cover" />
            <img src={aq.restaurant} alt="Function hall" className="rounded-lg w-full aspect-[3/4] object-cover mt-12" />
          </div>
        </div>
      </section>

      {/* POOL & GARDEN (replaces Spa) */}
      <section id="pool" className="py-24 px-6 bg-cream-50">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-16 items-center">
          <img src={aq.pool} alt="Aquawood pool" className="rounded-lg w-full aspect-square object-cover order-2 md:order-1" />
          <div className="order-1 md:order-2">
            <div className="text-gold-500 uppercase tracking-[0.3em] text-xs mb-4">Pool & Garden</div>
            <h2 className="font-serif text-5xl text-brand-900 mb-6 leading-tight">Splash, relax, recharge</h2>
            <p className="text-brand-800/80 leading-relaxed mb-6">Take a refreshing dip in our swimming pool, enjoy a leisurely walk through our manicured tropical gardens, or simply unwind in our shaded cabanas. The perfect escape from the everyday — open daily to in-house guests and day-tour visitors.</p>
            <div className="grid grid-cols-2 gap-4">
              {[
                { i: <Waves className="w-5 h-5" />, t: "Swimming Pool" },
                { i: <Leaf className="w-5 h-5" />, t: "Tropical Gardens" },
                { i: <Sparkles className="w-5 h-5" />, t: "Cabanas & Loungers" },
                { i: <Users className="w-5 h-5" />, t: "Day Tour Packages" },
              ].map((f) => (
                <div key={f.t} className="flex items-center gap-3 text-brand-800 text-sm">
                  <div className="w-9 h-9 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center">{f.i}</div>
                  {f.t}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="py-24 px-6 bg-brand-900 text-cream-50">
        <div className="max-w-5xl mx-auto text-center">
          <Star className="w-8 h-8 text-gold-400 mx-auto mb-6" />
          <h2 className="font-serif text-3xl md:text-4xl mb-12 leading-snug">
            "A peaceful place to stay in Candelaria — the pool was clean, the rooms were comfortable, and the staff were really friendly and accommodating. Great for family weekends and small celebrations."
          </h2>
          <div className="text-cream-100/70">— Verified Guest Review · TripAdvisor</div>
          <div className="flex justify-center gap-8 mt-12 flex-wrap">
            {["★★★½ TripAdvisor", "1,000+ Facebook Reviews", "Family-Friendly"].map((a) => (
              <div key={a} className="text-gold-400 text-sm uppercase tracking-wider">{a}</div>
            ))}
          </div>
        </div>
      </section>

      {/* CONTACT + GOOGLE MAP */}
      <section id="contact" className="py-24 px-6 bg-cream-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <div className="text-gold-500 uppercase tracking-[0.3em] text-xs mb-4">Visit Us</div>
            <h2 className="font-serif text-5xl text-brand-900 mb-3">Get in touch</h2>
            <p className="text-brand-800/70 max-w-2xl mx-auto">Reach out for room reservations, event inquiries or directions. Located along the Pan-Philippine (Maharlika) Highway in Brgy. Malabanban Norte, Candelaria.</p>
          </div>

          <div className="grid lg:grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg border border-brand-100 flex items-start gap-4">
              <div className="w-11 h-11 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center flex-shrink-0"><MapPin className="w-5 h-5" /></div>
              <div>
                <div className="font-medium text-brand-900">Address</div>
                <div className="text-brand-800/70 text-sm mt-1">Brgy. Malabanban Norte<br />Candelaria, Quezon 4323<br />Philippines</div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg border border-brand-100 flex items-start gap-4">
              <div className="w-11 h-11 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center flex-shrink-0"><Phone className="w-5 h-5" /></div>
              <div>
                <div className="font-medium text-brand-900">Phone</div>
                <div className="text-brand-800/70 text-sm mt-1"><a href={`tel:${property.phone}`} className="hover:text-brand-900">{property.phone}</a></div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg border border-brand-100 flex items-start gap-4">
              <div className="w-11 h-11 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center flex-shrink-0"><Mail className="w-5 h-5" /></div>
              <div>
                <div className="font-medium text-brand-900">Email</div>
                <div className="text-brand-800/70 text-sm mt-1"><a href={`mailto:${property.email}`} className="hover:text-brand-900 break-all">{property.email}</a></div>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* GOOGLE MAP */}
            <div className="bg-white rounded-lg border border-brand-100 overflow-hidden">
              <div className="aspect-[4/3] w-full bg-brand-50">
                <iframe
                  src={MAP_EMBED}
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Aquawood Garden Resort Location"
                />
              </div>
              <div className="p-4 flex items-center justify-between bg-brand-50">
                <div className="text-xs text-brand-700">
                  <div className="font-medium">Aquawood Garden Resort, Hotel & Restaurant</div>
                  <div>Pan-Philippine (Maharlika) Hwy, Candelaria, Quezon</div>
                </div>
                <a href={MAP_LINK} target="_blank" rel="noopener noreferrer" className="text-xs px-3 py-2 bg-brand-800 text-cream-50 rounded-md hover:bg-brand-900 flex items-center gap-1 flex-shrink-0">
                  <Navigation className="w-3 h-3" /> Directions
                </a>
              </div>
            </div>

            {/* CONTACT FORM */}
            <form className="bg-white p-8 rounded-lg border border-brand-100 space-y-4" onSubmit={(e) => { e.preventDefault(); alert("Salamat! Our team will respond within 24 hours."); }}>
              <div className="grid grid-cols-2 gap-4">
                <input required placeholder="First name" className="px-4 py-3 border border-brand-100 rounded-md focus:outline-none focus:border-brand-500" />
                <input required placeholder="Last name" className="px-4 py-3 border border-brand-100 rounded-md focus:outline-none focus:border-brand-500" />
              </div>
              <input required type="email" placeholder="Email address" className="w-full px-4 py-3 border border-brand-100 rounded-md focus:outline-none focus:border-brand-500" />
              <input required type="tel" placeholder="Mobile number" className="w-full px-4 py-3 border border-brand-100 rounded-md focus:outline-none focus:border-brand-500" />
              <select className="w-full px-4 py-3 border border-brand-100 rounded-md focus:outline-none focus:border-brand-500 bg-white">
                <option>I'm interested in...</option>
                <option>Room reservation</option>
                <option>Wedding / debut / birthday inquiry</option>
                <option>Corporate event / function</option>
                <option>Day-tour package</option>
                <option>General question</option>
              </select>
              <textarea rows={4} placeholder="Your message" className="w-full px-4 py-3 border border-brand-100 rounded-md focus:outline-none focus:border-brand-500 resize-none" />
              <button className="w-full px-6 py-3 bg-brand-800 text-cream-50 rounded-md hover:bg-brand-900 transition">Send Message</button>
            </form>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="text-cream-100/70 py-16 px-6" style={{ backgroundColor: "#0f2217" }}>
        <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-10">
          <div>
            <div className="flex items-center gap-2 mb-4">
              {property.logo ? (
                <img src={property.logo} alt={property.name} className="w-10 h-10 rounded-full object-cover bg-cream-50" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gold-500 flex items-center justify-center text-white"><Leaf className="w-5 h-5" /></div>
              )}
              <div>
                <div className="font-serif text-xl text-cream-50">{shortName}</div>
                <div className="text-[10px] uppercase tracking-[0.2em] text-gold-400">{subName}</div>
              </div>
            </div>
            <p className="text-sm leading-relaxed">{property.description}</p>
            <div className="text-xs mt-4 space-y-1">
              <div><MapPin className="inline w-3 h-3 mr-1" /> Brgy. Malabanban Norte, Candelaria, Quezon</div>
              <div><Phone className="inline w-3 h-3 mr-1" /> {property.phone}</div>
              <div><Mail className="inline w-3 h-3 mr-1" /> {property.email}</div>
            </div>
          </div>
          {[
            { h: "Stay", l: ["Rooms", "Day Tour", "Offers", "Loyalty"] },
            { h: "Experience", l: ["Restaurant", "Pool & Garden", "Events", "Catering"] },
            { h: "Info", l: ["About", "Directions", "Contact", "FAQ"] },
          ].map((col) => (
            <div key={col.h}>
              <div className="text-cream-50 font-medium mb-4">{col.h}</div>
              <ul className="space-y-2 text-sm">
                {col.l.map((i) => <li key={i}><a href="#" className="hover:text-gold-400 transition">{i}</a></li>)}
              </ul>
            </div>
          ))}
        </div>
        <div className="max-w-7xl mx-auto mt-12 pt-6 border-t border-brand-800 text-xs flex flex-wrap justify-between gap-2">
          <div>© {new Date().getFullYear()} {property.name}. All rights reserved.</div>
          <div>Privacy · Terms · Accessibility</div>
        </div>
      </footer>

      {/* BOOKING MODAL */}
      {bookingOpen && (
        <BookingModal onClose={() => setBookingOpen(false)} />
      )}
    </div>
  );
}

function BookingModal({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();
  const { rooms, guestUser, addGuestBooking } = useApp();
  const [step, setStep] = useState<"search" | "select" | "confirmed">("search");
  const [checkIn, setCheckIn] = useState(() => new Date().toISOString().slice(0, 10));
  const [checkOut, setCheckOut] = useState(() => new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10));
  const [guestCount, setGuestCount] = useState(2);
  const [selectedRoom, setSelectedRoom] = useState<typeof rooms[0] | null>(null);
  const [confirmationId, setConfirmationId] = useState("");

  const available = rooms.filter((r) => r.status === "available");
  const nights = Math.max(1, Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000));

  const handleBook = async (room: typeof rooms[0]) => {
    if (!guestUser) {
      // Not logged in → redirect to guest login
      onClose();
      navigate("/guest-login");
      return;
    }
    // Create a real booking
    const id = `AQW-${Date.now().toString().slice(-6)}`;
    const baseRatePHP = room.baseRate * 55;
    const total = baseRatePHP * nights;
    const tax = Math.round(total * 0.12);
    const booking = {
      id,
      guestUserId: guestUser.id,
      roomType: room.type,
      roomNumber: room.number,
      checkIn,
      checkOut,
      adults: guestCount,
      children: 0,
      nights,
      roomRate: baseRatePHP,
      addons: [],
      subtotal: total,
      tax,
      total: total + tax,
      status: "Pending" as const,
      paymentStatus: "Unpaid" as const,
      specialRequests: "",
      createdAt: new Date().toISOString(),
    };
    setSelectedRoom(room);
    setConfirmationId(id);
    await addGuestBooking(booking);
    setStep("confirmed");
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-up">
      <div className="bg-cream-50 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-cream-50 border-b border-brand-100 px-6 py-4 flex items-center justify-between">
          <div>
            <div className="text-xs uppercase tracking-wider text-gold-500">Reserve Your Stay</div>
            <h3 className="font-serif text-2xl text-brand-900">Aquawood Garden Resort</h3>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-full hover:bg-brand-100 flex items-center justify-center text-brand-800">×</button>
        </div>

        <div className="p-6">
          {step === "search" && (
            <>
              <div className="grid md:grid-cols-4 gap-4 mb-6">
                <div>
                  <label className="text-xs uppercase tracking-wider text-brand-700">Check-in</label>
                  <input type="date" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} className="w-full mt-1 px-3 py-2 border border-brand-200 rounded-md" />
                </div>
                <div>
                  <label className="text-xs uppercase tracking-wider text-brand-700">Check-out</label>
                  <input type="date" value={checkOut} onChange={(e) => setCheckOut(e.target.value)} className="w-full mt-1 px-3 py-2 border border-brand-200 rounded-md" />
                </div>
                <div>
                  <label className="text-xs uppercase tracking-wider text-brand-700">Guests</label>
                  <select value={guestCount} onChange={(e) => setGuestCount(+e.target.value)} className="w-full mt-1 px-3 py-2 border border-brand-200 rounded-md bg-white">
                    {[1,2,3,4,5,6].map((n) => <option key={n}>{n} {n === 1 ? "guest" : "guests"}</option>)}
                  </select>
                </div>
                <div className="flex items-end">
                  <button onClick={() => setStep("select")} className="w-full px-4 py-2.5 bg-brand-800 text-cream-50 rounded-md hover:bg-brand-900 transition flex items-center justify-center gap-2">Search <ArrowRight className="w-4 h-4" /></button>
                </div>
              </div>
              <div className="text-center py-12 text-brand-700">
                <CalendarDays className="w-10 h-10 mx-auto mb-3 text-gold-500" />
                <p>Select dates and guests to view availability.</p>
              </div>
            </>
          )}

          {step === "select" && (
            <>
              <div className="text-sm text-brand-700 mb-4">Showing {available.length} available rooms · {checkIn} → {checkOut} · {nights} night{nights > 1 ? "s" : ""}</div>
              <div className="space-y-4">
                {available.length === 0 ? (
                  <div className="text-center py-12 text-brand-700">No availability for selected dates. Please try different dates.</div>
                ) : available.slice(0, 6).map((r) => {
                  const baseRatePHP = r.baseRate * 55;
                  const total = baseRatePHP * nights;
                  return (
                    <div key={r.id} className="flex gap-4 p-4 border border-brand-100 rounded-lg hover:border-brand-400 transition">
                      <img src={r.image || aq.room} alt={r.type} className="w-32 h-32 rounded-md object-cover flex-shrink-0" />
                      <div className="flex-1">
                        <div className="font-serif text-xl text-brand-900">{r.type}</div>
                        <div className="text-sm text-brand-700 mb-2">{r.beds} · Up to {r.capacity} guests · Room {r.number}</div>
                        <div className="flex flex-wrap gap-1 mb-2">
                          {r.amenities.slice(0, 4).map((a) => <span key={a} className="text-xs px-2 py-0.5 bg-brand-50 text-brand-700 rounded-full">{a}</span>)}
                        </div>
                        <div className="flex items-end justify-between">
                          <div>
                            <div className="text-2xl font-serif text-brand-900">₱{total.toLocaleString()}</div>
                            <div className="text-xs text-brand-700">₱{baseRatePHP.toLocaleString()}/night × {nights} nights</div>
                          </div>
                          <button onClick={() => handleBook(r)} className="px-5 py-2 bg-gold-500 text-white rounded-full hover:bg-gold-600 transition">
                            {guestUser ? "Book Now" : "Sign in to Book"}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              {!guestUser && (
                <div className="mt-6 p-4 bg-brand-50 rounded-lg text-center">
                  <p className="text-sm text-brand-700 mb-2">Already have an account?</p>
                  <button onClick={() => { onClose(); navigate("/guest-login"); }} className="px-5 py-2 bg-brand-800 text-cream-50 rounded-full hover:bg-brand-900 transition text-sm">
                    Sign In to Book Faster
                  </button>
                </div>
              )}
            </>
          )}

          {step === "confirmed" && selectedRoom && (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-brand-500 text-white flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8" />
              </div>
              <h3 className="font-serif text-3xl text-brand-900 mb-2">Reservation Confirmed!</h3>
              <p className="text-brand-700 mb-6">Confirmation #{confirmationId}</p>
              <div className="max-w-md mx-auto bg-white rounded-lg p-6 text-left space-y-2 border border-brand-100">
                <div className="flex justify-between"><span className="text-brand-700">Room</span><span className="font-medium">{selectedRoom.type} · {selectedRoom.number}</span></div>
                <div className="flex justify-between"><span className="text-brand-700">Check-in</span><span>{checkIn}</span></div>
                <div className="flex justify-between"><span className="text-brand-700">Check-out</span><span>{checkOut}</span></div>
                <div className="flex justify-between"><span className="text-brand-700">Guests</span><span>{guestCount}</span></div>
                <div className="flex justify-between pt-2 border-t border-brand-100"><span className="font-medium">Total</span><span className="font-serif text-xl text-brand-900">₱{((selectedRoom.baseRate * 55) * nights).toLocaleString()}</span></div>
              </div>
              <p className="text-sm text-brand-700 mt-4">Your booking is saved. You can view and manage it in your account.</p>
              <div className="flex gap-3 justify-center mt-6">
                <button onClick={onClose} className="px-6 py-2.5 border border-brand-200 text-brand-700 rounded-full hover:bg-brand-50 transition">Close</button>
                <button onClick={() => { onClose(); navigate("/account"); }} className="px-6 py-2.5 bg-brand-800 text-cream-50 rounded-full hover:bg-brand-900 transition">
                  View My Bookings
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
