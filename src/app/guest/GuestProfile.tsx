import { useRef, useState } from "react";
import { useApp } from "../context/AppContext";
import { useToast } from "../components/ToastProvider";
import { supabase } from "@/integrations/supabase/client";
import { User, Mail, Phone, Award, Save, Upload, Check, Lock, Calendar, TrendingUp } from "lucide-react";

export default function GuestProfile() {
  const { guestUser, updateGuestProfile, guestBookings, guestFoodOrders } = useApp();
  const [draft, setDraft] = useState(guestUser);
  const [saved, setSaved] = useState(false);
  const [pwOpen, setPwOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const { addToast } = useToast();

  if (!guestUser || !draft) return null;

  const isDirty = JSON.stringify(draft) !== JSON.stringify(guestUser);

  const handleSave = () => {
    updateGuestProfile(draft);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
    addToast("success", "Profile updated", "Your changes have been saved successfully.");
  };

  const handleAvatar = (file: File | null) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const url = e.target?.result as string;
      setDraft({ ...draft, avatar: url });
    };
    reader.readAsDataURL(file);
  };

  const myBookings = guestBookings.filter((b) => b.guestUserId === guestUser.id);
  const myFood = guestFoodOrders.filter((o) => o.guestUserId === guestUser.id);
  const totalSpent = myBookings.filter((b) => b.status === "Checked-out" || b.status === "Checked-in").reduce((s, b) => s + b.total, 0)
    + myFood.reduce((s, o) => s + o.total, 0);

  return (
    <div className="space-y-6">
      <div>
        <div className="text-xs uppercase tracking-[0.25em] text-gold-500 font-medium mb-1">Profile</div>
        <h1 className="font-serif text-3xl md:text-4xl text-brand-900">My Profile</h1>
        <p className="text-brand-700 mt-1">Manage your personal information, password, and preferences.</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* LEFT */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-brand-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-serif text-xl text-brand-900">Personal Information</h3>
              {saved && <span className="text-xs px-3 py-1.5 bg-emerald-100 text-emerald-800 rounded-full flex items-center gap-1"><Check className="w-3.5 h-3.5" /> Saved</span>}
            </div>

            {/* AVATAR */}
            <div className="flex items-center gap-4 mb-6 pb-6 border-b border-brand-100">
              <div className="w-20 h-20 rounded-full overflow-hidden bg-gradient-to-br from-gold-400 to-gold-600 text-white flex items-center justify-center font-medium text-2xl flex-shrink-0">
                {draft.avatar ? (
                  <img src={draft.avatar} alt={draft.name} className="w-full h-full object-cover" />
                ) : (
                  draft.name.split(" ").map((n) => n[0]).join("").slice(0, 2)
                )}
              </div>
              <div>
                <input ref={fileRef} type="file" accept="image/*" onChange={(e) => handleAvatar(e.target.files?.[0] || null)} className="hidden" />
                <button onClick={() => fileRef.current?.click()} className="px-3 py-2 bg-brand-800 text-cream-50 rounded-md text-xs hover:bg-brand-900 flex items-center gap-1">
                  <Upload className="w-3.5 h-3.5" /> Upload Photo
                </button>
                {draft.avatar && <button onClick={() => setDraft({ ...draft, avatar: null })} className="block text-xs text-red-600 hover:text-red-700 mt-2">Remove photo</button>}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <Field icon={<User className="w-4 h-4" />} label="Full Name">
                <input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} className="w-full pl-10 pr-4 py-2.5 border border-brand-200 rounded-md focus:outline-none focus:border-brand-500" />
              </Field>
              <Field icon={<Mail className="w-4 h-4" />} label="Email">
                <input type="email" value={draft.email} onChange={(e) => setDraft({ ...draft, email: e.target.value })} className="w-full pl-10 pr-4 py-2.5 border border-brand-200 rounded-md focus:outline-none focus:border-brand-500" />
              </Field>
              <Field icon={<Phone className="w-4 h-4" />} label="Mobile Number">
                <input type="tel" value={draft.phone} onChange={(e) => setDraft({ ...draft, phone: e.target.value })} className="w-full pl-10 pr-4 py-2.5 border border-brand-200 rounded-md focus:outline-none focus:border-brand-500" />
              </Field>
              <Field icon={<Calendar className="w-4 h-4" />} label="Member Since">
                <input value={draft.joinedAt} disabled className="w-full pl-10 pr-4 py-2.5 border border-brand-200 rounded-md bg-brand-50 text-brand-500" />
              </Field>
            </div>

            <div className="flex justify-end gap-2 mt-6 pt-6 border-t border-brand-100">
              {isDirty && <button onClick={() => setDraft(guestUser)} className="px-4 py-2 border border-brand-200 rounded-md text-sm hover:bg-brand-50">Discard</button>}
              <button onClick={handleSave} disabled={!isDirty} className="px-4 py-2 bg-brand-800 text-cream-50 rounded-md text-sm hover:bg-brand-900 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1">
                <Save className="w-3.5 h-3.5" /> Save Changes
              </button>
            </div>
          </div>

          {/* PASSWORD */}
          <div className="bg-white rounded-xl border border-brand-100 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-serif text-xl text-brand-900 flex items-center gap-2"><Lock className="w-5 h-5 text-brand-600" /> Password & Security</h3>
                <p className="text-xs text-brand-600 mt-1">Update your password regularly to keep your account secure.</p>
              </div>
              <button onClick={() => setPwOpen(!pwOpen)} className="px-3 py-2 border border-brand-200 rounded-md text-xs hover:bg-brand-50">{pwOpen ? "Cancel" : "Change Password"}</button>
            </div>
            {pwOpen && (
              <form onSubmit={async (e) => { e.preventDefault(); const fd = new FormData(e.currentTarget); const cpw = fd.get("current") as string; const npw = fd.get("new") as string; const cfm = fd.get("confirm") as string; if (npw !== cfm) { addToast("error", "Passwords don't match", "New and confirm password must match."); return; } const { error } = await supabase.auth.updateUser({ password: npw }); if (error) { addToast("error", "Failed", error.message); } else { addToast("success", "Password updated", "Your password has been changed."); setPwOpen(false); } }} className="mt-4 space-y-3 pt-4 border-t border-brand-100">
                <input type="password" name="current" placeholder="Current password" required className="w-full px-3 py-2 border border-brand-200 rounded-md" />
                <input type="password" name="new" placeholder="New password" required className="w-full px-3 py-2 border border-brand-200 rounded-md" />
                <input type="password" name="confirm" placeholder="Confirm new password" required className="w-full px-3 py-2 border border-brand-200 rounded-md" />
                <div className="flex justify-end">
                  <button className="px-4 py-2 bg-brand-800 text-cream-50 rounded-md text-sm hover:bg-brand-900">Update Password</button>
                </div>
              </form>
            )}
          </div>

          {/* PREFERENCES */}
          <div className="bg-white rounded-xl border border-brand-100 p-6">
            <h3 className="font-serif text-xl text-brand-900 mb-4">Preferences</h3>
            <div className="space-y-3">
              {[
                { t: "Booking confirmation emails", d: "Get instant email when you book", on: true },
                { t: "Promotional offers", d: "Special discounts & seasonal packages", on: true },
                { t: "Pre-arrival reminders", d: "24h before check-in with details", on: true },
                { t: "Post-stay surveys", d: "Tell us about your experience", on: false },
                { t: "Loyalty point updates", d: "When you earn or redeem points", on: true },
              ].map((p) => (
                <div key={p.t} className="flex items-center justify-between p-3 border border-brand-100 rounded-md">
                  <div>
                    <div className="text-sm font-medium text-brand-900">{p.t}</div>
                    <div className="text-xs text-brand-600">{p.d}</div>
                  </div>
                  <div className={`w-10 h-6 rounded-full relative cursor-pointer ${p.on ? "bg-brand-600" : "bg-slate-300"}`}>
                    <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition ${p.on ? "left-4" : "left-0.5"}`} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT - LOYALTY & STATS */}
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-gold-400 to-gold-600 text-white rounded-xl p-6">
            <div className="flex items-center gap-2 mb-2"><Award className="w-5 h-5" /><span className="text-xs uppercase tracking-wider">Loyalty Status</span></div>
            <div className="font-serif text-4xl mb-1">{guestUser.loyaltyTier}</div>
            <div className="text-sm text-white/80">{guestUser.points.toLocaleString()} Points</div>
            <div className="mt-4 pt-4 border-t border-white/20 text-xs text-white/80">
              <div className="font-medium text-white">Member benefits:</div>
              <ul className="mt-2 space-y-1">
                <li>• Free room upgrade (when available)</li>
                <li>• 10% off restaurant orders</li>
                <li>• Late check-out priority</li>
                <li>• Welcome amenity on arrival</li>
              </ul>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-brand-100 p-6">
            <h3 className="font-serif text-lg text-brand-900 mb-4 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-brand-600" /> Your Activity</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between p-2 bg-brand-50 rounded">
                <span className="text-brand-700">Total Bookings</span>
                <span className="font-medium text-brand-900">{myBookings.length}</span>
              </div>
              <div className="flex justify-between p-2 bg-brand-50 rounded">
                <span className="text-brand-700">Completed Stays</span>
                <span className="font-medium text-brand-900">{myBookings.filter((b) => b.status === "Checked-out").length}</span>
              </div>
              <div className="flex justify-between p-2 bg-brand-50 rounded">
                <span className="text-brand-700">Food Orders</span>
                <span className="font-medium text-brand-900">{myFood.length}</span>
              </div>
              <div className="flex justify-between p-2 bg-brand-50 rounded">
                <span className="text-brand-700">Total Spent</span>
                <span className="font-medium text-brand-900">₱{totalSpent.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs uppercase tracking-wider text-brand-700 font-medium">{label}</label>
      <div className="relative mt-1">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-400">{icon}</span>
        {children}
      </div>
    </div>
  );
}
