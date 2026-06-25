import { useState } from "react";
import { useApp } from "../context/AppContext";
import { Leaf, Lock, Mail, ArrowLeft, User, Phone, ArrowRight } from "lucide-react";

type Mode = "login" | "register";

export default function UnifiedLogin() {
  const { login, loginGuest, registerGuest, property } = useApp();
  const [mode, setMode] = useState<Mode>("login");
  const [error, setError] = useState("");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regPass, setRegPass] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (await login(email, password)) {
      window.location.replace("/dashboard");
      return;
    }

    if (await loginGuest(email, password)) {
      const redirect = sessionStorage.getItem("loginRedirect") || "/account";
      sessionStorage.removeItem("loginRedirect");
      window.location.replace(redirect);
      return;
    }

    setError("Invalid email or password.");
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

  return (
    <div className="min-h-screen grid md:grid-cols-2">
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
                Guest & Staff Portal
              </div>
            </div>
          </div>
          <h1 className="font-serif text-5xl mb-6 leading-tight">
            Welcome to {property.name.split(",")[0] || "Aquawood"}
          </h1>
          <p className="text-cream-100/80 mb-8 leading-relaxed">
            Sign in to manage bookings, access the operations console, or create a guest account.
          </p>
          <div className="space-y-3 text-sm text-cream-100/70">
            {[
              "Book rooms & order room service",
              "Track bookings & loyalty rewards",
              "Front desk & revenue management",
              "Multi-channel distribution sync",
            ].map((f) => (
              <div key={f} className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-gold-400 rounded-full" /> {f}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center p-8 bg-cream-50">
        <div className="w-full max-w-md">
          <a
            href="/"
            className="inline-flex items-center gap-2 text-sm text-brand-700 hover:text-brand-900 mb-8"
          >
            <ArrowLeft className="w-4 h-4" /> Back to resort website
          </a>

          {mode === "login" ? (
            <>
              <h2 className="font-serif text-4xl text-brand-900 mb-2">Sign in</h2>
              <p className="text-brand-700 mb-6">
                Staff and guests use the same sign-in.
              </p>
              <form action="/" onSubmit={handleLogin} autoComplete="on" className="space-y-4">
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
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
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
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
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
              <p className="text-center text-sm text-brand-600 mt-6">
                Don't have an account?{" "}
                <button
                  onClick={() => { setMode("register"); setError(""); }}
                  className="text-gold-600 hover:text-gold-700 font-medium underline"
                >
                  Create one
                </button>
              </p>
            </>
          ) : (
            <>
              <h2 className="font-serif text-4xl text-brand-900 mb-2">Create account</h2>
              <p className="text-brand-700 mb-6">
                Get 200 welcome loyalty points when you join.
              </p>
              <form action="/" onSubmit={handleRegister} autoComplete="on" className="space-y-4">
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
              <p className="text-center text-sm text-brand-600 mt-6">
                Already have an account?{" "}
                <button
                  onClick={() => { setMode("login"); setError(""); }}
                  className="text-gold-600 hover:text-gold-700 font-medium underline"
                >
                  Sign in
                </button>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
