import { useState } from "react";
import { Link } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { Leaf, User, ArrowLeft, ArrowRight, Mail, Lock, Phone, Shield } from "lucide-react";

type Tab = "staff" | "guest-login" | "guest-register";

export default function MobileUnifiedLogin() {
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

  const shortName = property.name.split(",")[0] || "Aquawood";

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
    <div className="min-h-screen bg-cream-50">
      <header className="bg-brand-900 px-4 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <ArrowLeft className="w-5 h-5 text-cream-50" />
        </Link>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-gold-500 flex items-center justify-center text-white">
            <Leaf className="w-3.5 h-3.5" />
          </div>
          <span className="font-serif text-lg text-cream-50">
            {isGuest ? shortName : `${shortName} HSMS`}
          </span>
        </div>
        <div className="w-9" />
      </header>

      <div className="px-6 pt-8 pb-24">
        <div className="text-center mb-8">
          <div
            className={`w-16 h-16 rounded-full bg-gradient-to-br flex items-center justify-center text-white mx-auto mb-4 ${isGuest ? "from-gold-400 to-gold-600" : "from-brand-600 to-brand-800"}`}
          >
            {isGuest ? <User className="w-7 h-7" /> : <Shield className="w-7 h-7" />}
          </div>
          <h1 className="font-serif text-3xl text-brand-900 mb-2">
            {tab === "staff"
              ? "Staff Login"
              : tab === "guest-login"
                ? "Welcome Back"
                : "Create Account"}
          </h1>
          <p className="text-sm text-brand-600">
            {tab === "staff"
              ? "Sign in to access the operations console."
              : tab === "guest-login"
                ? "Sign in to manage your bookings and earn rewards."
                : "Start earning loyalty points with your first stay."}
          </p>
        </div>

        {/* Role tabs */}
        <div className="flex bg-brand-100 rounded-xl p-1 mb-6">
          <button
            onClick={() => {
              setTab("staff");
              setError("");
            }}
            className={`flex-1 py-3 rounded-lg text-sm font-medium transition ${tab === "staff" ? "bg-brand-800 text-cream-50 shadow" : "text-brand-700"}`}
          >
            Staff
          </button>
          <button
            onClick={() => {
              setTab("guest-login");
              setError("");
            }}
            className={`flex-1 py-3 rounded-lg text-sm font-medium transition ${tab.startsWith("guest") ? "bg-brand-800 text-cream-50 shadow" : "text-brand-700"}`}
          >
            Guest
          </button>
        </div>

        {/* Guest sub-tabs */}
        {isGuest && (
          <div className="flex bg-brand-100 rounded-xl p-1 mb-6">
            <button
              onClick={() => {
                setTab("guest-login");
                setError("");
              }}
              className={`flex-1 py-2.5 rounded-lg text-xs font-medium transition ${tab === "guest-login" ? "bg-brand-800 text-cream-50 shadow" : "text-brand-700"}`}
            >
              Sign In
            </button>
            <button
              onClick={() => {
                setTab("guest-register");
                setError("");
              }}
              className={`flex-1 py-2.5 rounded-lg text-xs font-medium transition ${tab === "guest-register" ? "bg-brand-800 text-cream-50 shadow" : "text-brand-700"}`}
            >
              Register
            </button>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Staff form */}
        {tab === "staff" && (
          <form action="/dashboard" onSubmit={handleStaffLogin} autoComplete="on" className="space-y-4">
            <div>
              <label className="text-xs uppercase tracking-wider text-brand-700 font-medium block mb-1">
                Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-brand-400" />
                <input
                  type="email"
                  required
                  name="email"
                  autoComplete="username"
                  value={staffEmail}
                  onChange={(e) => setStaffEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3.5 border border-brand-200 rounded-xl focus:outline-none focus:border-brand-500 bg-white text-base"
                />
              </div>
            </div>
            <div>
              <label className="text-xs uppercase tracking-wider text-brand-700 font-medium block mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-brand-400" />
                <input
                  type="password"
                  required
                  name="password"
                  autoComplete="current-password"
                  value={staffPass}
                  onChange={(e) => setStaffPass(e.target.value)}
                  className="w-full pl-10 pr-4 py-3.5 border border-brand-200 rounded-xl focus:outline-none focus:border-brand-500 bg-white text-base"
                />
              </div>
            </div>
            <button
              type="submit"
              className="w-full py-4 bg-brand-800 text-cream-50 rounded-xl font-medium text-base"
            >
              Sign In
            </button>
          </form>
        )}

        {/* Guest login form */}
        {tab === "guest-login" && (
          <form action="/account" onSubmit={handleGuestLogin} autoComplete="on" className="space-y-4">
            <div>
              <label className="text-xs uppercase tracking-wider text-brand-700 font-medium block mb-1">
                Email
              </label>
              <input
                type="email"
                required
                name="email"
                autoComplete="username"
                value={guestEmail}
                onChange={(e) => setGuestEmail(e.target.value)}
                className="w-full px-4 py-3.5 border border-brand-200 rounded-xl focus:outline-none focus:border-brand-500 bg-white text-base"
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-wider text-brand-700 font-medium block mb-1">
                Password
              </label>
              <input
                type="password"
                required
                name="password"
                autoComplete="current-password"
                value={guestPass}
                onChange={(e) => setGuestPass(e.target.value)}
                className="w-full px-4 py-3.5 border border-brand-200 rounded-xl focus:outline-none focus:border-brand-500 bg-white text-base"
              />
            </div>
            <button className="w-full py-4 bg-brand-800 text-cream-50 rounded-xl font-medium text-base flex items-center justify-center gap-2">
              Sign In <ArrowRight className="w-4 h-4" />
            </button>
            <div className="text-center text-xs text-brand-500 mt-4">
              Demo:{" "}
              <span className="font-mono bg-brand-100 px-1.5 py-0.5 rounded">
                maria@example.com / demo
              </span>
            </div>
          </form>
        )}

        {/* Guest registration form */}
        {tab === "guest-register" && (
          <form action="/account" onSubmit={handleRegister} autoComplete="on" className="space-y-4">
            <div>
              <label className="text-xs uppercase tracking-wider text-brand-700 font-medium block mb-1">
                Full Name
              </label>
              <input
                required
                name="name"
                autoComplete="name"
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
                className="w-full px-4 py-3.5 border border-brand-200 rounded-xl focus:outline-none focus:border-brand-500 bg-white text-base"
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-wider text-brand-700 font-medium block mb-1">
                Email
              </label>
              <input
                type="email"
                required
                name="email"
                autoComplete="email"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                className="w-full px-4 py-3.5 border border-brand-200 rounded-xl focus:outline-none focus:border-brand-500 bg-white text-base"
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-wider text-brand-700 font-medium block mb-1">
                Mobile Number
              </label>
              <input
                type="tel"
                required
                name="phone"
                autoComplete="tel"
                value={regPhone}
                onChange={(e) => setRegPhone(e.target.value)}
                placeholder="+63 9XX XXX XXXX"
                className="w-full px-4 py-3.5 border border-brand-200 rounded-xl focus:outline-none focus:border-brand-500 bg-white text-base"
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-wider text-brand-700 font-medium block mb-1">
                Password
              </label>
              <input
                type="password"
                required
                minLength={4}
                name="password"
                autoComplete="new-password"
                value={regPass}
                onChange={(e) => setRegPass(e.target.value)}
                className="w-full px-4 py-3.5 border border-brand-200 rounded-xl focus:outline-none focus:border-brand-500 bg-white text-base"
              />
            </div>
            <button className="w-full py-4 bg-brand-800 text-cream-50 rounded-xl font-medium text-base flex items-center justify-center gap-2">
              Create Account <ArrowRight className="w-4 h-4" />
            </button>
            <p className="text-xs text-brand-600 text-center">
              You'll receive 200 welcome loyalty points.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
