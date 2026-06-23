import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff, Sprout, ShoppingBag, User, Phone, MapPin, Building2, Ruler, ArrowRight, CheckCircle2 } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { useLanguage } from "../../context/LanguageContext";

const CATEGORIES = ["Vegetables", "Fruits", "Grains", "Dairy", "Spices", "Pulses", "Others"];

export default function Register() {
  const [role, setRole] = useState("farmer");
  const [form, setForm] = useState({
    name: "", email: "", password: "", phone: "",
    location: "", farm_size: "", company_name: "",
  });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);

  const { t } = useLanguage();
  const { register } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const validateStep1 = () => {
    if (!form.name.trim()) { toast.error("Full name is required"); return false; }
    if (!form.email.trim()) { toast.error("Email is required"); return false; }
    if (!form.password || form.password.length < 6) { toast.error("Password must be at least 6 characters"); return false; }
    return true;
  };

  const handleNext = (e) => {
    e.preventDefault();
    if (validateStep1()) setStep(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.phone.trim()) { toast.error("Phone number is required"); return; }
    if (role === "farmer" && !form.location.trim()) { toast.error("Location is required"); return; }

    setLoading(true);
    try {
      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        phone: form.phone.trim(),
        ...(role === "farmer" && {
          location: form.location.trim(),
          farm_size: form.farm_size ? parseFloat(form.farm_size) : null,
        }),
        ...(role === "buyer" && {
          company_name: form.company_name.trim() || null,
        }),
      };
      const user = await register(role, payload);
      toast.success(t('auth.registerSuccess'));
      navigate(role === "farmer" ? "/farmer/dashboard" : "/buyer/marketplace", { replace: true });
    } catch (err) {
      toast.error(err?.response?.data?.detail || t('error.generic'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-5/12 xl:w-1/2 flex-col justify-between p-10 relative overflow-hidden"
        style={{ background: "linear-gradient(145deg, #0f172a 0%, #1a3a2a 40%, #14532d 70%, #052e16 100%)" }}>
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: "radial-gradient(circle at 25px 25px, rgba(255,255,255,0.2) 2px, transparent 0)", backgroundSize: "50px 50px" }} />

        {/* Steps indicator */}
        <div className="absolute top-1/2 right-8 -translate-y-1/2 space-y-6">
          {[["Create Account", "Basic info & password"], ["Complete Profile", "Role-specific details"]].map(([t, s], i) => (
            <div key={i} className={`flex items-start gap-3 transition-opacity ${step === i + 1 ? "opacity-100" : "opacity-40"}`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${step > i ? "bg-green-500" : step === i + 1 ? "border-2 border-green-500 bg-transparent" : "border border-slate-600 bg-transparent"}`}>
                {step > i + 1 ? <CheckCircle2 size={14} className="text-white" /> : <span className="text-xs text-white font-bold">{i+1}</span>}
              </div>
              <div>
                <p className="text-white text-sm font-semibold">{t}</p>
                <p className="text-slate-500 text-xs">{s}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="relative z-10 flex items-center gap-3">
          <img src="/logo.jpeg" alt="Raithu Sethu" className="w-10 h-10 rounded-xl object-cover shadow-lg" />
          <span className="text-white font-bold text-xl tracking-tight">RaithuSethu</span>
        </div>
        <div className="relative z-10">
          <h1 className="text-4xl font-bold text-white leading-tight mb-4">
            Join <span className="gradient-text">12,000+</span><br />farmers & buyers
          </h1>
          <p className="text-slate-400 text-base leading-relaxed max-w-sm">
            Start trading directly. No middlemen, fair prices, real-time matching.
          </p>
        </div>
        <p className="relative z-10 text-slate-600 text-xs">© 2026 RaithuSethu. All rights reserved.</p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center px-4 py-12 bg-white">
        <div className="w-full max-w-md animate-fade-in">
          <div className="lg:hidden flex items-center gap-2.5 mb-8">
            <img src="/logo.jpeg" alt="Raithu Sethu" className="w-9 h-9 rounded-xl object-cover" />
            <span className="font-bold text-xl text-slate-800">RaithuSethu</span>
          </div>

          {/* Progress */}
          <div className="flex items-center gap-3 mb-8">
            <div className="flex-1 h-1.5 rounded-full bg-slate-200 overflow-hidden">
              <div className="h-full bg-green-500 rounded-full transition-all duration-500" style={{ width: step === 1 ? "50%" : "100%" }} />
            </div>
            <span className="text-xs text-slate-500 font-medium">Step {step}/2</span>
          </div>

          {step === 1 ? (
            <>
              <h2 className="text-2xl font-bold text-slate-900 mb-1">{t('auth.register')}</h2>
              <p className="text-slate-500 text-sm mb-6">{t('auth.register')}</p>

              {/* Role Selector */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                {[["farmer", Sprout, t('role.farmer'), "Sell your crops"], ["buyer", ShoppingBag, t('role.buyer'), "Source produce"]].map(([r, Icon, label, sub]) => (
                  <button key={r} type="button" onClick={() => setRole(r)}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${role === r ? "border-green-500 bg-green-50" : "border-slate-200 hover:border-slate-300"}`}>
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${role === r ? "bg-green-500" : "bg-slate-100"}`}>
                      <Icon size={16} className={role === r ? "text-white" : "text-slate-500"} />
                    </div>
                    <p className={`text-sm font-semibold ${role === r ? "text-green-700" : "text-slate-700"}`}>{label}</p>
                    <p className={`text-xs mt-0.5 ${role === r ? "text-green-600" : "text-slate-500"}`}>{sub}</p>
                  </button>
                ))}
              </div>

              <form onSubmit={handleNext} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">{t('auth.name')} <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input type="text" value={form.name} onChange={set("name")} placeholder={t('auth.name')} className="input-field pl-9" required />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">{t('auth.email')} <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input type="email" value={form.email} onChange={set("email")} placeholder={t('auth.email')} className="input-field pl-9" required />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">{t('auth.password')} <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input type={showPw ? "text" : "password"} value={form.password} onChange={set("password")} placeholder={t('auth.password')} className="input-field pl-9 pr-10" required minLength={6} />
                    <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                      {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>
                <button type="submit" className="btn btn-primary w-full btn-lg mt-2">
                  {t('common.submit')} <ArrowRight size={16} />
                </button>
              </form>
            </>
          ) : (
            <>
              <h2 className="text-2xl font-bold text-slate-900 mb-1">{t('auth.register')}</h2>
              <p className="text-slate-500 text-sm mb-6">{role === "farmer" ? t('role.farmer') : t('role.buyer')}</p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">{t('auth.phone')} <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input type="tel" value={form.phone} onChange={set("phone")} placeholder={t('auth.phone')} className="input-field pl-9" required />
                  </div>
                </div>
                {role === "farmer" ? (
                  <>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">{t('crop.location')} <span className="text-red-500">*</span></label>
                      <div className="relative">
                        <MapPin size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input type="text" value={form.location} onChange={set("location")} placeholder="e.g. Guntur, Andhra Pradesh" className="input-field pl-9" required />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">Farm Size (acres) <span className="text-slate-400 font-normal text-xs">{t('common.optional')}</span></label>
                      <div className="relative">
                        <Ruler size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input type="number" min="0" step="0.1" value={form.farm_size} onChange={set("farm_size")} placeholder="e.g. 5.5" className="input-field pl-9" />
                      </div>
                    </div>
                  </>
                ) : (
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Company Name <span className="text-slate-400 font-normal text-xs">{t('common.optional')}</span></label>
                    <div className="relative">
                      <Building2 size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input type="text" value={form.company_name} onChange={set("company_name")} placeholder="Your company or business" className="input-field pl-9" />
                    </div>
                  </div>
                )}
                <div className="flex gap-3 mt-2">
                  <button type="button" onClick={() => setStep(1)} className="btn btn-secondary flex-1">{t('common.back')}</button>
                  <button type="submit" disabled={loading} className="btn btn-primary flex-1">
                    {loading ? t('common.saving') : t('auth.register')}
                  </button>
                </div>
              </form>
            </>
          )}

          <p className="text-center text-sm text-slate-500 mt-6">
            {t('auth.alreadyAccount')}{" "}
            <Link to="/login" className="text-green-600 font-semibold hover:text-green-700">{t('auth.login')}</Link>
          </p>
        </div>
      </div>
    </div>
  );
}