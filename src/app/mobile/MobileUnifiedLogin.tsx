import { useState } from "react";
import { Link } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { Leaf, ArrowLeft, ArrowRight, Mail, Lock, Phone, User } from "lucide-react";

type Mode = "login" | "register";

export default function MobileUnifiedLogin() {
  const { login, loginGuest, registerGuest, property } = useApp();
  const [mode, setMode] = useState<Mode>("login");
  const [error, setError] = useState("");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regPass, setRegPass] = useState("");

  const shortName = property.name.split(",")[0] || "Aquawood";

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
    <div className="min-h-screen bg-cream-50">
      <header className="bg-brand-900 px-4 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <ArrowLeft className="w-5 h-5 text-cream-50" />
        </Link>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-gold-500 flex items-center justify-center text-white">
            <Leaf className="w-3.5 h-3.5" />
          </div>
          <span className="font-serif text-lg text-cream-50">{shortName}</span>
        </div>
        <div className="w-9" />
      </header>

      <div className="px-6 pt-8 pb-24">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-brand-600 to-brand-800 flex items-center justify-center text-white mx-auto mb-4">
            <User className="w-7 h-7" />
          </div>
          <h1 className="font-serif text-3xl text-brand-900 mb-2">
            {mode === "login" ? "Sign in" : "Create account"}
          </h1>
          <p className="text-sm text-brand-600">
            {mode === "login"
              ? "Staff and guests use the same sign-in."
              : "Get 200 welcome loyalty points when you join."}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
            {error}
          </div>
        )}

        {mode === "login" ? (
          <form action="/" onSubmit={handleLogin} autoComplete="on" className="space-y-4">
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
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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
            <p className="text-center text-sm text-brand-600 pt-4">
              Don't have an account?{" "}
              <button
                onClick={() => { setMode("register"); setError(""); }}
                className="text-gold-600 hover:text-gold-700 font-medium underline"
              >
                Create one
              </button>
            </p>
          </form>
        ) : (
          <form action="/" onSubmit={handleRegister} autoComplete="on" className="space-y-4">
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
            <p className="text-center text-sm text-brand-600 pt-4">
              Already have an account?{" "}
              <button
                onClick={() => { setMode("login"); setError(""); }}
                className="text-gold-600 hover:text-gold-700 font-medium underline"
              >
                Sign in
              </button>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
