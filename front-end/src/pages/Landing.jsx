import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight, Sprout, ShoppingBag, Zap, MessageCircle,
  TrendingUp, Shield, Star, CheckCircle2, Users, Package, BarChart3,
  ChevronRight, Play, Globe2, Clock, Award,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";

const STATS = [
  { label: "Active Farmers", value: "12,458+", icon: Sprout, color: "text-green-600", bg: "bg-green-50" },
  { label: "Registered Buyers", value: "8,756+", icon: ShoppingBag, color: "text-blue-600", bg: "bg-blue-50" },
  { label: "Orders Completed", value: "24,560+", icon: Package, color: "text-purple-600", bg: "bg-purple-50" },
  { label: "Food Saved (Tons)", value: "1,245", icon: Award, color: "text-amber-600", bg: "bg-amber-50" },
];

const FEATURES = [
  {
    icon: Globe2, title: "Live Marketplace",
    desc: "Browse thousands of fresh produce listings with real-time availability, verified quality, and direct farmer contacts.",
    color: "bg-green-50", iconColor: "text-green-600",
  },
  {
    icon: Zap, title: "Flash Sales",
    desc: "Farmers post limited-time discounted offers. Buyers get notified instantly and can book at slashed prices.",
    color: "bg-amber-50", iconColor: "text-amber-600",
  },
  {
    icon: TrendingUp, title: "Smart Matching",
    desc: "AI-powered requirement matching connects buyer needs with the best available farmer crop listings automatically.",
    color: "bg-blue-50", iconColor: "text-blue-600",
  },
  {
    icon: MessageCircle, title: "Real-time Chat",
    desc: "Negotiate directly with farmers or buyers via secure in-app messaging. No phone numbers needed.",
    color: "bg-purple-50", iconColor: "text-purple-600",
  },
  {
    icon: Shield, title: "Verified Profiles",
    desc: "Admin-verified farmer and buyer accounts ensure trust and quality on every transaction.",
    color: "bg-teal-50", iconColor: "text-teal-600",
  },
  {
    icon: BarChart3, title: "Price Intelligence",
    desc: "Access real-time pricing trends and demand data to make better buying and selling decisions.",
    color: "bg-rose-50", iconColor: "text-rose-600",
  },
];

const STEPS_FARMER = [
  { n: "01", title: "Register & Verify", desc: "Create your farmer account and get verified by our team in 24 hours." },
  { n: "02", title: "List Your Crops", desc: "Add your crop details, photos, pricing, and available quantity." },
  { n: "03", title: "Get Orders", desc: "Receive purchase requests, accept them, and chat directly with buyers." },
];

const STEPS_BUYER = [
  { n: "01", title: "Sign Up Free", desc: "Create your buyer account in under 2 minutes — no charges to browse." },
  { n: "02", title: "Discover & Filter", desc: "Search the marketplace by crop, location, category, or price range." },
  { n: "03", title: "Book & Receive", desc: "Book crops directly, pay farmers, and coordinate delivery seamlessly." },
];

export default function Landing() {
  const { isAuthenticated, role } = useAuth();
  const { t, lang } = useLanguage();
  const navigate = useNavigate();

  const getDashboard = () => {
    if (role === "farmer") return "/farmer/dashboard";
    if (role === "admin") return "/admin";
    return "/buyer/marketplace";
  };

  return (
    <div className="min-h-screen bg-white">
      {/* ── Navbar ──────────────────────────────────── */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
          <Link to="/home" className="flex items-center gap-2.5">
            <img src="/logo.jpeg" alt="Raithu Sethu" className="w-9 h-9 rounded-xl object-cover shadow-md" />
            <span className="font-bold text-xl text-slate-800 tracking-tight">RaithuSethu</span>
          </Link>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <Link to="/buyer/marketplace" className="hover:text-green-600 transition-colors">{t('nav.marketplace')}</Link>
            <a href="#features" className="hover:text-green-600 transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-green-600 transition-colors">How it works</a>
          </div>
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <button onClick={() => navigate(getDashboard())} className="btn btn-primary btn-sm">
                {t('nav.dashboard')} <ArrowRight size={14} />
              </button>
            ) : (
              <>
                <Link to="/login" className="btn btn-secondary btn-sm hidden sm:inline-flex">{t('auth.login')}</Link>
                <Link to="/register" className="btn btn-primary btn-sm">{t('landing.getStarted')}</Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ── Hero Section ─────────────────────────────── */}
      <section className="relative overflow-hidden"
        style={{ background: "linear-gradient(150deg, #0f172a 0%, #1a3a2a 35%, #14532d 65%, #0f172a 100%)" }}>
        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-8"
          style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)", backgroundSize: "60px 60px" }} />
        {/* Glow orbs */}
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-green-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-20 right-1/4 w-80 h-80 bg-teal-400/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 md:px-8 pt-20 pb-24">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left */}
            <div className="animate-fade-in">
              <div className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-full px-4 py-1.5 mb-6">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <span className="text-green-400 text-sm font-semibold">Live marketplace • 12,000+ farmers</span>
              </div>
              <h1 className="text-5xl md:text-6xl font-bold text-white leading-tight mb-6">
                {t('landing.title')}<br />
              </h1>
              <p className="text-slate-400 text-lg leading-relaxed mb-8 max-w-lg">
                {t('landing.subtitle')}
              </p>
              <div className="flex flex-wrap gap-4">
                <Link to="/register" className="btn btn-primary btn-xl">
                  {t('landing.getStarted')} <ArrowRight size={18} />
                </Link>
                <Link to="/buyer/marketplace" className="btn btn-lg bg-white/10 text-white border border-white/20 hover:bg-white/15">
                  {t('nav.marketplace')}
                </Link>
              </div>
              <div className="flex items-center gap-4 mt-8 pt-8 border-t border-white/10">
                <div className="flex -space-x-2">
                  {["R","P","S","K","M"].map((l, i) => (
                    <div key={i} className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-teal-600 flex items-center justify-center text-white text-xs font-bold border-2 border-slate-900">
                      {l}
                    </div>
                  ))}
                </div>
                <div>
                  <div className="flex gap-0.5">
                    {[1,2,3,4,5].map(s => <Star key={s} size={12} className="text-amber-400 fill-amber-400" />)}
                  </div>
                  <p className="text-slate-400 text-xs mt-0.5">Trusted by 20,000+ users</p>
                </div>
              </div>
            </div>

            {/* Right — Dashboard preview card */}
            <div className="relative animate-fade-in delay-200">
              <div className="landing-hero-card p-6 rounded-2xl">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <p className="text-slate-400 text-xs">Good Morning,</p>
                    <p className="text-white font-bold text-lg">Ramesh Kumar 👋</p>
                  </div>
                  <div className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-xs font-semibold">Verified Farmer</div>
                </div>
                <div className="grid grid-cols-2 gap-3 mb-5">
                  {[["Active Crops","24","↑7%"], ["Pending Requests","18","↑4.8%"], ["Revenue (₹)","45,230","↑19%"], ["Bookings","41","↑3%"]].map(([l,v,t]) => (
                    <div key={l} className="bg-white/5 rounded-xl p-3">
                      <p className="text-slate-400 text-xs mb-1">{l}</p>
                      <p className="text-white font-bold text-xl">{v}</p>
                      <p className="text-green-400 text-xs">{t} this week</p>
                    </div>
                  ))}
                </div>
                <div className="bg-white/5 rounded-xl p-3">
                  <p className="text-slate-400 text-xs mb-3">Recent Listings</p>
                  {[["Tomatoes","500kg","₹25/kg","Active"],["Onions","300kg","₹18/kg","Flash Sale"]].map(([n,q,p,s]) => (
                    <div key={n} className="flex items-center justify-between py-1.5 border-b border-white/5 last:border-0">
                      <div>
                        <p className="text-white text-sm font-semibold">{n}</p>
                        <p className="text-slate-500 text-xs">{q} • {p}</p>
                      </div>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${s === "Flash Sale" ? "badge-flash" : "badge-active"}`}>{s}</span>
                    </div>
                  ))}
                </div>
              </div>
              {/* Floating elements */}
              <div className="absolute -top-4 -right-4 glass-dark rounded-xl p-3 animate-float">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 bg-amber-500 rounded-lg flex items-center justify-center">
                    <Zap size={13} className="text-white" />
                  </div>
                  <div>
                    <p className="text-white text-xs font-bold">Flash Sale</p>
                    <p className="text-amber-400 text-xs">30% off • 2h left</p>
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-4 -left-4 glass-dark rounded-xl p-3 animate-float" style={{ animationDelay: "1s" }}>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-green-400" />
                  <p className="text-white text-xs font-medium">New order received!</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats Bar ─────────────────────────────────── */}
      <section className="py-12 bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {STATS.map(({ label, value, icon: Icon, color, bg }, i) => (
              <div key={label} className="flex items-center gap-4 animate-fade-in" style={{ animationDelay: `${i * 100}ms` }}>
                <div className={`w-12 h-12 rounded-2xl ${bg} flex items-center justify-center flex-shrink-0`}>
                  <Icon size={22} className={color} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{value}</p>
                  <p className="text-sm text-slate-500">{label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ──────────────────────────────────── */}
      <section id="features" className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="text-center mb-14 animate-fade-in">
            <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 text-sm font-semibold px-4 py-1.5 rounded-full mb-4">
              <CheckCircle2 size={14} /> Why RaithuSethu
            </div>
            <h2 className="text-4xl font-bold text-slate-900 mb-4">Everything you need to trade smarter</h2>
            <p className="text-slate-500 text-lg max-w-2xl mx-auto">Built for Indian agriculture — features designed to maximize profit, reduce waste, and build direct trust.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map(({ icon: Icon, title, desc, color, iconColor }, i) => (
              <div key={title} className="card p-6 card-interactive animate-fade-in" style={{ animationDelay: `${i * 80}ms` }}>
                <div className={`w-12 h-12 ${color} rounded-2xl flex items-center justify-center mb-4`}>
                  <Icon size={22} className={iconColor} />
                </div>
                <h3 className="font-bold text-slate-900 text-lg mb-2">{title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ──────────────────────────────── */}
      <section id="how-it-works" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="text-center mb-14">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">How it works</h2>
            <p className="text-slate-500 text-lg">Simple steps to get started — whether you're a farmer or a buyer.</p>
          </div>
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Farmer */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-green-500 flex items-center justify-center">
                  <Sprout size={18} className="text-white" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">For Farmers</h3>
              </div>
              {STEPS_FARMER.map(({ n, title, desc }, i) => (
                <div key={n} className="flex gap-4 animate-slide-in-left" style={{ animationDelay: `${i * 100}ms` }}>
                  <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center text-green-600 font-bold text-sm flex-shrink-0">{n}</div>
                  <div>
                    <h4 className="font-bold text-slate-800 mb-1">{title}</h4>
                    <p className="text-slate-500 text-sm leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
              <Link to="/register" className="btn btn-primary mt-2">
                {t('auth.register')} <ArrowRight size={16} />
              </Link>
            </div>
            {/* Buyer */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center">
                  <ShoppingBag size={18} className="text-white" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">For Buyers</h3>
              </div>
              {STEPS_BUYER.map(({ n, title, desc }, i) => (
                <div key={n} className="flex gap-4 animate-slide-in-right" style={{ animationDelay: `${i * 100}ms` }}>
                  <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-sm flex-shrink-0">{n}</div>
                  <div>
                    <h4 className="font-bold text-slate-800 mb-1">{title}</h4>
                    <p className="text-slate-500 text-sm leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
              <Link to="/buyer/marketplace" className="btn bg-blue-600 text-white hover:bg-blue-700 mt-2 inline-flex items-center gap-2">
                {t('nav.marketplace')} <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────── */}
      <section className="py-20 relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #0f172a 0%, #14532d 50%, #0f172a 100%)" }}>
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: "radial-gradient(circle at 25px 25px, rgba(255,255,255,0.2) 2px, transparent 0)", backgroundSize: "50px 50px" }} />
        <div className="relative max-w-3xl mx-auto px-4 text-center animate-fade-in">
          <h2 className="text-4xl font-bold text-white mb-4">{t('landing.title')}</h2>
          <p className="text-slate-400 text-lg mb-8">{t('landing.subtitle')}</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register" className="btn btn-primary btn-xl">
              {t('landing.getStarted')} <ArrowRight size={18} />
            </Link>
            <Link to="/buyer/marketplace" className="btn btn-xl bg-white/10 text-white border border-white/20 hover:bg-white/15">
              {t('nav.marketplace')}
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────── */}
      <footer className="bg-slate-900 py-10">
        <div className="max-w-7xl mx-auto px-4 md:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <img src="/logo.jpeg" alt="Raithu Sethu" className="w-8 h-8 rounded-lg object-cover" />
            <span className="text-white font-bold">RaithuSethu</span>
          </div>
          <p className="text-slate-500 text-sm">© 2026 RaithuSethu. Reducing food waste, increasing farmer prosperity.</p>
          <div className="flex items-center gap-4 text-sm text-slate-500">
            <Link to="/login" className="hover:text-white transition-colors">{t('auth.login')}</Link>
            <Link to="/register" className="hover:text-white transition-colors">{t('auth.register')}</Link>
            <Link to="/buyer/marketplace" className="hover:text-white transition-colors">{t('nav.marketplace')}</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}