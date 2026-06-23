import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff, Sprout, ShoppingBag, ArrowRight, CheckCircle2 } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { useLanguage } from "../../context/LanguageContext";

const ROLE_CONFIG = {
  farmer: {
    icon: Sprout,
    label: "Farmer",
    subtitle: "Manage and sell your crops",
    color: "bg-green-500",
    activeRing: "ring-2 ring-green-500",
    pill: "bg-green-100 text-green-700",
  },
  buyer: {
    icon: ShoppingBag,
    label: "Buyer",
    subtitle: "Source fresh produce",
    color: "bg-blue-500",
    activeRing: "ring-2 ring-blue-500",
    pill: "bg-blue-100 text-blue-700",
  },
};

export default function Login() {
  const [role, setRole] = useState("farmer");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const { t } = useLanguage();
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) { toast.error(t('error.generic')); return; }
    setLoading(true);
    try {
      const user = await login(role, { email, password });
      toast.success(t('auth.loginSuccess'));
      const redirect = from || (user.role === "farmer" ? "/farmer/dashboard" : user.role === "admin" ? "/admin" : "/buyer/marketplace");
      navigate(redirect, { replace: true });
    } catch (err) {
      toast.error(err?.response?.data?.detail || t('auth.invalidCredentials'));
    } finally {
      setLoading(false);
    }
  };

  const rc = ROLE_CONFIG[role];

  return (
    <div className="min-h-screen flex">
      {/* Left Panel — Visual */}
      <div className="hidden lg:flex lg:w-5/12 xl:w-1/2 flex-col justify-between p-10 relative overflow-hidden"
        style={{ background: "linear-gradient(145deg, #0f172a 0%, #1a3a2a 40%, #14532d 70%, #052e16 100%)" }}>
        {/* Pattern */}
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: "radial-gradient(circle at 25px 25px, rgba(255,255,255,0.2) 2px, transparent 0)", backgroundSize: "50px 50px" }} />
        
        {/* Floating Cards */}
        <div className="absolute top-32 right-8 glass-dark rounded-2xl p-4 animate-float" style={{ animationDelay: "0s" }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-green-500 rounded-xl flex items-center justify-center">
              <Sprout size={16} className="text-white" />
            </div>
            <div>
              <p className="text-white text-xs font-semibold">Fresh Tomatoes</p>
              <p className="text-green-400 text-xs">₹25/kg • Available Now</p>
            </div>
          </div>
        </div>
        <div className="absolute bottom-48 right-12 glass-dark rounded-2xl p-4 animate-float" style={{ animationDelay: "1.5s" }}>
          <div className="flex items-center gap-3">
            <CheckCircle2 size={18} className="text-green-400" />
            <div>
              <p className="text-white text-xs font-semibold">Order Confirmed</p>
              <p className="text-slate-400 text-xs">500 kg Potatoes</p>
            </div>
          </div>
        </div>

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <img src="/logo.jpeg" alt="Raithu Sethu" className="w-10 h-10 rounded-xl object-cover shadow-lg" />
          <span className="text-white font-bold text-xl tracking-tight">RaithuSethu</span>
        </div>

        {/* Hero text */}
        <div className="relative z-10">
          <h1 className="text-4xl font-bold text-white leading-tight mb-4">
            Bridge the gap between<br />
            <span className="gradient-text">Farm & Market</span>
          </h1>
          <p className="text-slate-400 text-base leading-relaxed max-w-sm">
            Real-time crop trading, smart matching, and direct connections between farmers and buyers. No middlemen.
          </p>
          <div className="flex items-center gap-6 mt-8">
            {[["12k+","Farmers"], ["8k+","Buyers"], ["24k+","Orders"]].map(([n, l]) => (
              <div key={l}>
                <p className="text-green-400 font-bold text-xl">{n}</p>
                <p className="text-slate-500 text-xs">{l}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="relative z-10 text-slate-600 text-xs">© 2026 RaithuSethu. All rights reserved.</p>
      </div>

      {/* Right Panel — Form */}
      <div className="flex-1 flex items-center justify-center px-4 py-12 bg-white">
        <div className="w-full max-w-md animate-fade-in">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2.5 mb-8">
            <img src="/logo.jpeg" alt="Raithu Sethu" className="w-9 h-9 rounded-xl object-cover" />
            <span className="font-bold text-xl text-slate-800">RaithuSethu</span>
          </div>

          <h2 className="text-2xl font-bold text-slate-900 mb-1">{t('auth.login')}</h2>
          <p className="text-slate-500 text-sm mb-8">{t('auth.login')}</p>

          {/* Role Selector */}
          <div className="grid grid-cols-2 gap-3 mb-8">
            {Object.entries(ROLE_CONFIG).map(([r, cfg]) => {
              const Icon = cfg.icon;
              const isActive = role === r;
              return (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={`relative p-4 rounded-xl border-2 transition-all text-left ${
                    isActive ? "border-green-500 bg-green-50" : "border-slate-200 hover:border-slate-300 bg-white"
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg ${isActive ? "bg-green-500" : "bg-slate-100"} flex items-center justify-center mb-2 transition-colors`}>
                    <Icon size={16} className={isActive ? "text-white" : "text-slate-500"} />
                  </div>
                  <p className={`text-sm font-semibold ${isActive ? "text-green-700" : "text-slate-700"}`}>{t('role.' + r)}</p>
                  <p className={`text-xs mt-0.5 ${isActive ? "text-green-600" : "text-slate-500"}`}>{cfg.subtitle}</p>
                  {isActive && <CheckCircle2 size={14} className="absolute top-3 right-3 text-green-500" />}
                </button>
              );
            })}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">{t('auth.email')}</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder={t('auth.email')}
                    className="input-field pl-9"
                    autoComplete="email"
                    required
                  />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-sm font-semibold text-slate-700">{t('auth.password')}</label>
                <Link to="/forgot-password" className="text-xs text-green-600 hover:text-green-700 font-medium">
                  {t('auth.forgotPassword')}
                </Link>
              </div>
              <div className="relative">
                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder={t('auth.password')}
                  className="input-field pl-9 pr-10"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full btn-lg mt-2"
            >
              {loading ? t('common.loading') : (
                <>
                  {t('auth.login')} <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-6">
            {t('auth.noAccount')}{" "}
            <Link to="/register" className="text-green-600 font-semibold hover:text-green-700">
              {t('auth.register')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}