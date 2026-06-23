import { useState } from "react";
import { Link } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { Leaf, Menu, X, MapPin, Phone, Mail, ArrowRight, Star, ChevronDown, Utensils, Waves, CalendarDays } from "lucide-react";

export default function PublicSiteMobile() {
  const { property } = useApp();
  const [menuOpen, setMenuOpen] = useState(false);
  const [, setSection] = useState<"hero" | "about" | "rooms" | "dining" | "events" | "pool" | "contact">("hero");

  const shortName = property.name.split(",")[0] || "Aquawood";

  return (
    <div className="min-h-screen bg-cream-50 pb-20">
      {/* TOP BAR */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-brand-900/95 backdrop-blur-md">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            {property.logo ? (
              <img src={property.logo} alt={shortName} className="w-8 h-8 rounded-full object-cover" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gold-500 flex items-center justify-center text-white"><Leaf className="w-4 h-4" /></div>
            )}
            <span className="font-serif text-lg text-cream-50">{shortName}</span>
          </div>
          <button onClick={() => setMenuOpen(!menuOpen)} className="w-10 h-10 rounded-full bg-brand-800 flex items-center justify-center">
            {menuOpen ? <X className="w-5 h-5 text-cream-50" /> : <Menu className="w-5 h-5 text-cream-50" />}
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="border-t border-brand-800 px-4 py-4 space-y-1 bg-brand-900">
            {[
              { label: "Rooms", s: "rooms" as const },
              { label: "Restaurant", s: "dining" as const },
              { label: "Events", s: "events" as const },
              { label: "Pool & Garden", s: "pool" as const },
              { label: "Contact", s: "contact" as const },
            ].map((item) => (
              <button
                key={item.s}
                onClick={() => { setSection(item.s); setMenuOpen(false); document.getElementById(item.s)?.scrollIntoView({ behavior: "smooth" }); }}
                className="w-full text-left px-4 py-3 rounded-lg text-cream-50 hover:bg-brand-800 transition"
              >
                {item.label}
              </button>
            ))}

          </div>
        )}
      </header>

      {/* HERO */}
      <section className="relative h-screen min-h-[600px] pt-14">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-800 via-brand-900 to-brand-950" />
        <div className="absolute inset-0 opacity-30" style={{ backgroundImage: "url(https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=800&q=80)", backgroundSize: "cover", backgroundPosition: "center" }} />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-950 via-brand-950/50 to-transparent" />
        <div className="relative z-10 h-full flex flex-col justify-end px-6 pb-16 text-cream-50">
          <div className="text-xs text-gold-400 uppercase tracking-[0.3em] mb-3">📍 {property.city}, {property.country}</div>
          <h1 className="font-serif text-4xl font-light leading-tight mb-4">{property.tagline}</h1>
          <p className="text-cream-100/80 text-sm leading-relaxed mb-8 max-w-md">{property.description.slice(0, 150)}...</p>
          <div className="flex gap-3">
            <Link to="/guest-login" className="flex-1 bg-gold-500 text-white rounded-full py-3.5 text-sm font-medium flex items-center justify-center gap-2">
              Book Now <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 animate-bounce text-cream-50/60">
          <ChevronDown className="w-6 h-6" />
        </div>
      </section>

      {/* STATS BAR */}
      <section className="bg-brand-900 text-cream-50 py-8 px-6">
        <div className="grid grid-cols-3 gap-4 text-center">
          {[
            { n: property.totalRooms, l: "Rooms" },
            { n: property.gardenArea.split(" ")[0], l: "Hectares" },
            { n: "3.5★", l: "Rating" },
          ].map((s) => (
            <div key={s.l}>
              <div className="font-serif text-2xl">{s.n}</div>
              <div className="text-[10px] uppercase tracking-wider text-cream-100/60">{s.l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ABOUT */}
      <section id="about" className="py-12 px-6">
        <div className="text-gold-500 text-xs uppercase tracking-[0.3em] mb-3">Welcome</div>
        <h2 className="font-serif text-3xl text-brand-900 mb-4">Your getaway in the heart of Quezon</h2>
        <p className="text-brand-700 text-sm leading-relaxed mb-6">{property.description}</p>
        <div className="rounded-xl overflow-hidden">
          <img src="/images/aquawood-pool.jpg" alt="Pool" className="w-full aspect-[4/3] object-cover" />
        </div>
      </section>

      {/* ROOMS */}
      <section id="rooms" className="py-12 px-6 bg-brand-900 text-cream-50">
        <div className="text-gold-400 text-xs uppercase tracking-[0.3em] mb-3">Accommodations</div>
        <h2 className="font-serif text-3xl mb-6">Rooms & Suites</h2>
        <div className="space-y-4">
          {[
            { name: "Standard Room", price: "₱2,800", desc: "Cozy room for couples", img: "/images/aquawood-room.jpg" },
            { name: "Deluxe Garden", price: "₱4,500", desc: "Garden view with balcony", img: "/images/aquawood-garden.jpg" },
            { name: "Family Villa", price: "₱6,800", desc: "Spacious with kitchenette", img: "/images/aquawood-pool.jpg" },
            { name: "Lagoon Suite", price: "₱7,800", desc: "Pool view & bathtub", img: "/images/aquawood-pool.jpg" },
          ].map((r) => (
            <div key={r.name} className="rounded-xl overflow-hidden bg-brand-800 border border-brand-700">
              <img src={r.img} alt={r.name} className="w-full aspect-[16/9] object-cover" />
              <div className="p-4">
                <div className="flex items-baseline justify-between mb-1">
                  <h3 className="font-serif text-xl">{r.name}</h3>
                  <span className="text-gold-400 font-serif">{r.price}<span className="text-xs text-cream-100/60">/night</span></span>
                </div>
                <p className="text-cream-100/70 text-sm">{r.desc}</p>
              </div>
            </div>
          ))}
        </div>
        <Link to="/guest-login" className="mt-6 block text-center px-6 py-3 bg-gold-500 text-white rounded-full text-sm font-medium">Check Availability</Link>
      </section>

      {/* DINING */}
      <section id="dining" className="py-12 px-6">
        <div className="text-gold-500 text-xs uppercase tracking-[0.3em] mb-3 flex items-center gap-2"><Utensils className="w-4 h-4" /> The Restaurant</div>
        <h2 className="font-serif text-3xl text-brand-900 mb-6">Authentic Filipino Cuisine</h2>
        <div className="space-y-4">
          {[
            { name: "Aquawood Restaurant", desc: "Indoor & al fresco dining with Filipino specialties", img: "/images/aquawood-restaurant.jpg" },
            { name: "Events & Catering", desc: "Birthday, weddings, debuts & corporate parties", img: "/images/aquawood-event.jpg" },
            { name: "Poolside Service", desc: "Cool drinks, grilled favorites & merienda", img: "/images/aquawood-pool.jpg" },
          ].map((d) => (
            <div key={d.name} className="rounded-xl overflow-hidden border border-brand-100 bg-white">
              <img src={d.img} alt={d.name} className="w-full aspect-[4/3] object-cover" />
              <div className="p-4">
                <h3 className="font-serif text-lg text-brand-900">{d.name}</h3>
                <p className="text-brand-700 text-sm mt-1">{d.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* EVENTS */}
      <section id="events" className="py-12 px-6 bg-brand-50">
        <div className="text-gold-500 text-xs uppercase tracking-[0.3em] mb-3 flex items-center gap-2"><CalendarDays className="w-4 h-4" /> Events</div>
        <h2 className="font-serif text-3xl text-brand-900 mb-4">Celebrate the moments that matter</h2>
        <p className="text-brand-700 text-sm leading-relaxed mb-6">From intimate birthday parties to garden weddings and corporate team-buildings, our event spaces handle everything.</p>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white p-4 rounded-xl border border-brand-100">
            <div className="font-serif text-2xl text-brand-900">20-300</div>
            <div className="text-xs text-brand-600">Guests Capacity</div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-brand-100">
            <div className="font-serif text-2xl text-brand-900">5</div>
            <div className="text-xs text-brand-600">Event Venues</div>
          </div>
        </div>
        <Link to="/guest-login" className="mt-4 block text-center px-6 py-3 bg-brand-800 text-cream-50 rounded-full text-sm font-medium">Request Proposal</Link>
      </section>

      {/* POOL */}
      <section id="pool" className="py-12 px-6">
        <div className="text-gold-500 text-xs uppercase tracking-[0.3em] mb-3 flex items-center gap-2"><Waves className="w-4 h-4" /> Pool & Garden</div>
        <h2 className="font-serif text-3xl text-brand-900 mb-4">Splash, relax, recharge</h2>
        <div className="rounded-xl overflow-hidden mb-4">
          <img src="/images/aquawood-pool.jpg" alt="Pool" className="w-full aspect-[4/3] object-cover" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          {["Swimming Pool", "Tropical Gardens", "Cabanas", "Day Tour"].map((f) => (
            <div key={f} className="bg-white p-3 rounded-lg border border-brand-100 text-sm text-brand-800 text-center">{f}</div>
          ))}
        </div>
      </section>

      {/* CONTACT + MAP */}
      <section id="contact" className="py-12 px-6 bg-brand-50">
        <h2 className="font-serif text-3xl text-brand-900 mb-6">Find Us</h2>

        {/* Google Map */}
        <div className="rounded-xl overflow-hidden border border-brand-200 mb-6">
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3870.6!2d121.4378!3d13.9293!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTPCsDU1JzQ1LjgiTiAxMjHCsDI2JzE2LjMiRQ!5e0!3m2!1sen!2sph!4v1700000000000!5m2!1sen!2sph"
            width="100%" height="250" style={{ border: 0 }} allowFullScreen loading="lazy" title="Aquawood Location"
          />
        </div>

        <div className="space-y-4">
          <div className="flex items-start gap-3 bg-white p-4 rounded-xl border border-brand-100">
            <MapPin className="w-5 h-5 text-brand-700 mt-0.5 flex-shrink-0" />
            <div>
              <div className="font-medium text-brand-900">Address</div>
              <div className="text-sm text-brand-700">{property.address}<br />{property.city}<br />{property.country} {property.currency === "PHP (₱)" ? "4323" : ""}</div>
            </div>
          </div>
          <a href={`tel:${property.phone}`} className="flex items-center gap-3 bg-white p-4 rounded-xl border border-brand-100 block">
            <Phone className="w-5 h-5 text-brand-700 flex-shrink-0" />
            <div>
              <div className="font-medium text-brand-900">Call Us</div>
              <div className="text-sm text-brand-700">{property.phone}</div>
            </div>
          </a>
          <a href={`mailto:${property.email}`} className="flex items-center gap-3 bg-white p-4 rounded-xl border border-brand-100 block">
            <Mail className="w-5 h-5 text-brand-700 flex-shrink-0" />
            <div>
              <div className="font-medium text-brand-900">Email Us</div>
              <div className="text-sm text-brand-700">{property.email}</div>
            </div>
          </a>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-brand-900 text-cream-100/60 py-10 px-6 pb-24">
        <div className="flex items-center gap-2 mb-4">
          {property.logo ? (
            <img src={property.logo} alt={shortName} className="w-8 h-8 rounded-full object-cover" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gold-500 flex items-center justify-center text-white"><Leaf className="w-4 h-4" /></div>
          )}
          <span className="font-serif text-lg text-cream-50">{shortName}</span>
        </div>
        <p className="text-sm mb-6">{property.description}</p>
        <div className="text-xs">© {new Date().getFullYear()} {property.name}</div>
        <div className="mt-4 flex items-center gap-1 text-xs">
          <Star className="w-3 h-3 text-gold-400" /> 1,000+ reviews on Facebook
        </div>
      </footer>
    </div>
  );
}
