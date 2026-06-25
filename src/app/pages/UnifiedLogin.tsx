import { useState } from "react";
import { Link } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { Leaf, Lock, Mail, ArrowLeft, Shield, User, Phone, ArrowRight } from "lucide-react";

type Tab = "staff" | "guest-login" | "guest-register";

export default function UnifiedLogin() {
  const { login, loginGuest, registerGuest, property } = useApp();
  const [tab, setTab] = useState<Tab>("staff");
  const [error, setError] = useState("");

  // Staff fields
  const [staffEmail, setStaffEmail] = useState("");
  const [staffPass, setStaffPass] = useState("");

  // Guest login fields
  const [guestEmail, setGuestEmail] = useState("maria@example.com");
  const [guestPass, setGuestPass] = useState("demo");

  // Guest register fields
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regPass, setRegPass] = useState("");

  const handleStaffLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (await login(staffEmail, staffPass)) window.location.replace("/dashboard");
    else setError("Invalid email or password.");
  };

  const handleGuestLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (await loginGuest(guestEmail, guestPass)) {
      const redirect = sessionStorage.getItem("loginRedirect") || "/account";
      sessionStorage.removeItem("loginRedirect");
      window.location.replace(redirect);
    } else setError("Invalid email or password. Try maria@example.com / demo");
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const result = await registerGuest({
      name: regName,
      email: regEmail,
      phone: regPhone,
      password: regPass,
    });
    if (result.ok) {
      const redirect = sessionStorage.getItem("loginRedirect") || "/account";
      sessionStorage.removeItem("loginRedirect");
      window.location.replace(redirect);
    } else setError(result.error || "Registration failed");
  };

  const isGuest = tab.startsWith("guest");

  return (
    <div className="min-h-screen grid md:grid-cols-2">
      {/* LEFT — branding panel */}
      <div className="relative hidden md:flex items-center justify-center overflow-hidden bg-brand-900 text-cream-50 p-12">
        <div
          className="absolute inset-0 opacity-30 bg-cover bg-center"
          style={{
            backgroundImage:
              "url(https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1200&q=80)",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-brand-900/80 to-brand-900/95" />
        <div className="relative max-w-md">
          <div className="flex items-center gap-2 mb-8">
            {property.logo ? (
              <img
                src={property.logo}
                alt={property.name}
                className="w-10 h-10 rounded-full object-cover bg-cream-50"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gold-500 flex items-center justify-center text-white">
                <Leaf className="w-5 h-5" />
              </div>
            )}
            <div>
              <div className="font-serif text-2xl">{property.name.split(",")[0] || "Aquawood"}</div>
              <div className="text-[10px] uppercase tracking-[0.3em] text-gold-400">
                {isGuest ? "Guest Portal" : "HSMS Console"}
              </div>
            </div>
          </div>
          {isGuest ? (
            <>
              <h1 className="font-serif text-5xl mb-6 leading-tight">Your Aquawood account</h1>
              <p className="text-cream-100/80 mb-8 leading-relaxed">
                Manage bookings, order food to your room, request services, earn loyalty rewards,
                and check in faster with your own guest account.
              </p>
              <div className="space-y-3 text-sm text-cream-100/70">
                {[
                  "Book rooms & add extras online",
                  "Track bookings & view receipts",
                  "Order food directly to your room",
                  "Request housekeeping & maintenance",
                  "Earn loyalty points & member discounts",
                ].map((f) => (
                  <div key={f} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-gold-400 rounded-full" /> {f}
                  </div>
                ))}
              </div>
            </>
          ) : (
            <>
              <h1 className="font-serif text-5xl mb-6 leading-tight">
                Hospitality Sales Management System
              </h1>
              <p className="text-cream-100/80 mb-8 leading-relaxed">
                The unified command center for Aquawood Garden Resort — front desk, revenue
                management, channel distribution, MICE sales, CRM, and executive reporting in one
                platform.
              </p>
              <div className="space-y-3 text-sm text-cream-100/70">
                {[
                  "Real-time inventory & folio management",
                  "Dynamic pricing & revenue forecasting",
                  "Multi-channel distribution sync",
                  "Guest CRM & loyalty analytics",
                ].map((f) => (
                  <div key={f} className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-gold-400" /> {f}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* RIGHT — form panel */}
      <div className="flex items-center justify-center p-8 bg-cream-50">
        <div className="w-full max-w-md">
          <a
            href="/"
            className="inline-flex items-center gap-2 text-sm text-brand-700 hover:text-brand-900 mb-8"
          >
            <ArrowLeft className="w-4 h-4" /> Back to resort website
          </a>

          {/* Main tabs */}
          <div className="flex border-b border-brand-200 mb-8">
            <button
              onClick={() => {
                setTab("staff");
                setError("");
              }}
              className={`flex-1 pb-3 text-sm font-medium transition ${tab === "staff" ? "text-brand-900 border-b-2 border-gold-500" : "text-brand-500"}`}
            >
              Staff Console
            </button>
            <button
              onClick={() => {
                setTab("guest-login");
                setError("");
              }}
              className={`flex-1 pb-3 text-sm font-medium transition ${tab.startsWith("guest") ? "text-brand-900 border-b-2 border-gold-500" : "text-brand-500"}`}
            >
              Guest Portal
            </button>
          </div>

          {/* Guest sub-tabs */}
          {isGuest && (
            <div className="flex gap-4 mb-6">
              <button
                onClick={() => {
                  setTab("guest-login");
                  setError("");
                }}
                className={`text-sm font-medium transition ${tab === "guest-login" ? "text-gold-600" : "text-brand-500 hover:text-brand-700"}`}
              >
                Sign In
              </button>
              <button
                onClick={() => {
                  setTab("guest-register");
                  setError("");
                }}
                className={`text-sm font-medium transition ${tab === "guest-register" ? "text-gold-600" : "text-brand-500 hover:text-brand-700"}`}
              >
                Create Account
              </button>
            </div>
          )}

          {/* Staff login form */}
          {tab === "staff" && (
            <>
              <h2 className="font-serif text-4xl text-brand-900 mb-2">Welcome back</h2>
              <p className="text-brand-700 mb-6">Sign in to access the operations console.</p>
              <form action="/dashboard" onSubmit={handleStaffLogin} autoComplete="on" className="space-y-4">
                <div>
                  <label className="text-xs uppercase tracking-wider text-brand-700 font-medium">
                    Email
                  </label>
                  <div className="relative mt-1">
                    <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-brand-400" />
                    <input
                      type="email"
                      required
                      name="email"
                      autoComplete="username"
                      value={staffEmail}
                      onChange={(e) => setStaffEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-brand-200 rounded-md focus:outline-none focus:border-brand-500 bg-white"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs uppercase tracking-wider text-brand-700 font-medium">
                    Password
                  </label>
                  <div className="relative mt-1">
                    <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-brand-400" />
                    <input
                      type="password"
                      required
                      name="password"
                      autoComplete="current-password"
                      value={staffPass}
                      onChange={(e) => setStaffPass(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-brand-200 rounded-md focus:outline-none focus:border-brand-500 bg-white"
                    />
                  </div>
                </div>
                {error && (
                  <div className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded">{error}</div>
                )}
                <button
                  type="submit"
                  className="w-full py-3 bg-brand-800 text-cream-50 rounded-md hover:bg-brand-900 transition font-medium"
                >
                  Sign In
                </button>
              </form>
            </>
          )}

          {/* Guest login form */}
          {tab === "guest-login" && (
            <>
              <h2 className="font-serif text-3xl text-brand-900 mb-2">Welcome back</h2>
              <p className="text-brand-700 text-sm mb-6">Sign in to manage your bookings.</p>
              <form action="/account" onSubmit={handleGuestLogin} autoComplete="on" className="space-y-4">
                <div>
                  <label className="text-xs uppercase tracking-wider text-brand-700 font-medium">
                    Email
                  </label>
                  <div className="relative mt-1">
                    <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-brand-400" />
                    <input
                      type="email"
                      required
                      name="email"
                      autoComplete="username"
                      value={guestEmail}
                      onChange={(e) => setGuestEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-brand-200 rounded-md focus:outline-none focus:border-brand-500 bg-white"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs uppercase tracking-wider text-brand-700 font-medium">
                    Password
                  </label>
                  <div className="relative mt-1">
                    <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-brand-400" />
                    <input
                      type="password"
                      required
                      name="password"
                      autoComplete="current-password"
                      value={guestPass}
                      onChange={(e) => setGuestPass(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-brand-200 rounded-md focus:outline-none focus:border-brand-500 bg-white"
                    />
                  </div>
                </div>
                {error && (
                  <div className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded">{error}</div>
                )}
                <button className="w-full py-3 bg-brand-800 text-cream-50 rounded-md hover:bg-brand-900 transition font-medium flex items-center justify-center gap-2">
                  Sign In <ArrowRight className="w-4 h-4" />
                </button>
              </form>
              <div className="mt-6 pt-6 border-t border-brand-100 text-xs text-brand-600">
                <div className="mb-2 font-medium uppercase tracking-wider">Demo Account</div>
                <div className="font-mono bg-brand-50 rounded p-2">maria@example.com / demo</div>
              </div>
            </>
          )}

          {/* Guest registration form */}
          {tab === "guest-register" && (
            <>
              <h2 className="font-serif text-3xl text-brand-900 mb-2">Create your account</h2>
              <p className="text-brand-700 text-sm mb-6">
                Start earning loyalty points with your first stay.
              </p>
              <form action="/account" onSubmit={handleRegister} autoComplete="on" className="space-y-4">
                <div>
                  <label className="text-xs uppercase tracking-wider text-brand-700 font-medium">
                    Full Name
                  </label>
                  <div className="relative mt-1">
                    <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-brand-400" />
                    <input
                      required
                      name="name"
                      autoComplete="name"
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-brand-200 rounded-md focus:outline-none focus:border-brand-500 bg-white"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs uppercase tracking-wider text-brand-700 font-medium">
                    Email
                  </label>
                  <div className="relative mt-1">
                    <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-brand-400" />
                    <input
                      type="email"
                      required
                      name="email"
                      autoComplete="email"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-brand-200 rounded-md focus:outline-none focus:border-brand-500 bg-white"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs uppercase tracking-wider text-brand-700 font-medium">
                    Mobile Number
                  </label>
                  <div className="relative mt-1">
                    <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-brand-400" />
                    <input
                      type="tel"
                      required
                      name="phone"
                      autoComplete="tel"
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      placeholder="+63 9XX XXX XXXX"
                      className="w-full pl-10 pr-4 py-3 border border-brand-200 rounded-md focus:outline-none focus:border-brand-500 bg-white"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs uppercase tracking-wider text-brand-700 font-medium">
                    Password
                  </label>
                  <div className="relative mt-1">
                    <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-brand-400" />
                    <input
                      type="password"
                      required
                      minLength={4}
                      name="password"
                      autoComplete="new-password"
                      value={regPass}
                      onChange={(e) => setRegPass(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-brand-200 rounded-md focus:outline-none focus:border-brand-500 bg-white"
                    />
                  </div>
                </div>
                {error && (
                  <div className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded">{error}</div>
                )}
                <button className="w-full py-3 bg-brand-800 text-cream-50 rounded-md hover:bg-brand-900 transition font-medium flex items-center justify-center gap-2">
                  Create Account <ArrowRight className="w-4 h-4" />
                </button>
                <p className="text-xs text-brand-600 text-center">
                  By creating an account, you'll receive 200 welcome loyalty points.
                </p>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
