import { useEffect, useCallback, useMemo } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Sprout, ShoppingBag, FileText, ClipboardList,
  BookOpen, Zap, MessageCircle, Bell, LogOut,
  Users, BarChart3, Store, X,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";
import { useNotifications } from "../../context/NotificationContext";
import LanguageSwitcher from "../LanguageSwitcher";

function RolePill({ role }) {
  const { t } = useLanguage();
  const cfg = {
    farmer: { label: t("role.farmer"), cls: "bg-green-500/20 text-green-300 border-green-500/30" },
    buyer:  { label: t("role.buyer"),  cls: "bg-blue-500/20 text-blue-300 border-blue-500/30" },
    admin:  { label: t("role.admin"),  cls: "bg-amber-500/20 text-amber-300 border-amber-500/30" },
  };
  const c = cfg[role] || cfg.buyer;
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${c.cls}`}>
      {c.label}
    </span>
  );
}

export default function Sidebar({ mobileOpen, setMobileOpen }) {
  const { user, role, logout } = useAuth();
  const { t } = useLanguage();
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = useCallback(() => {
    logout();
    navigate("/login");
  }, [logout, navigate]);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname, setMobileOpen]);

  const NAV_FARMER = useMemo(() => [
    { to: "/farmer/dashboard",    icon: LayoutDashboard, label: t("nav.dashboard") },
    { to: "/farmer/crops",        icon: Sprout,          label: t("nav.myCrops") },
    { to: "/farmer/requests",     icon: ShoppingBag,     label: t("nav.purchaseRequests") },
    { to: "/farmer/requirements", icon: ClipboardList,   label: t("nav.buyerNeeds") },
    { to: "/farmer/bookings",     icon: BookOpen,        label: t("nav.myBookings") },
    { to: "/farmer/flash-sales",  icon: Zap,             label: t("nav.flashSales") },
  ], [t]);

  const NAV_BUYER = useMemo(() => [
    { to: "/buyer/marketplace",   icon: Store,           label: t("nav.marketplace") },
    { to: "/buyer/requests",      icon: FileText,        label: t("nav.myRequests") },
    { to: "/buyer/requirements",  icon: ClipboardList,   label: t("nav.myRequirements") },
    { to: "/buyer/bookings",      icon: BookOpen,        label: t("nav.myBookings") },
  ], [t]);

  const NAV_ADMIN = useMemo(() => [
    { to: "/admin",               icon: LayoutDashboard, label: t("nav.dashboard") },
    { to: "/admin/farmers",       icon: Sprout,          label: t("nav.farmers") },
    { to: "/admin/buyers",        icon: Users,           label: t("nav.buyers") },
    { to: "/admin/analytics",     icon: BarChart3,       label: t("nav.analytics") },
  ], [t]);

  const NAV_SHARED = useMemo(() => [
    { to: "/chat",                icon: MessageCircle,   label: t("nav.messages") },
    { to: "/notifications",       icon: Bell,            label: t("nav.notifications") },
  ], [t]);

  const navLinks = role === "farmer" ? NAV_FARMER : role === "admin" ? NAV_ADMIN : NAV_BUYER;

  const renderSidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 py-5 border-b border-white/8">
        <img src="/logo.jpeg" alt="Raithu Sethu" className="w-9 h-9 rounded-xl object-cover shadow-lg shadow-green-900/40 flex-shrink-0" />
        <div>
          <span className="text-white font-bold text-lg leading-none tracking-tight">RaithuSethu</span>
          <p className="text-slate-400 text-xs mt-0.5">Farm-to-Market</p>
        </div>
      </div>

      {/* User Info */}
      <div className="px-3 py-4 border-b border-white/8">
        <div className="flex items-center gap-3 px-2 py-2.5 rounded-xl bg-white/5">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-green-400 to-teal-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
            {user?.name?.charAt(0)?.toUpperCase() || "U"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-semibold truncate">{user?.name || "User"}</p>
            <div className="mt-0.5">
              <RolePill role={role} />
            </div>
          </div>
        </div>
      </div>

      {/* Main Nav */}
      <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
        <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider px-3 py-2">
          {role === "admin" ? t("nav.administration") : t("nav.mainMenu")}
        </p>
        {navLinks.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to.endsWith("/dashboard") || to === "/admin"}
            className={({ isActive }) =>
              `sidebar-link ${isActive ? "active" : ""}`
            }
          >
            <Icon size={17} />
            <span className="flex-1">{label}</span>
            {to === "/notifications" && unreadCount > 0 && (
              <span className="ml-auto bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </NavLink>
        ))}

        {role !== "admin" && (
          <>
            <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider px-3 py-2 mt-3">
              {t("nav.tools")}
            </p>
            {NAV_SHARED.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `sidebar-link ${isActive ? "active" : ""}`
                }
              >
                <Icon size={17} />
                <span className="flex-1">{label}</span>
                {to === "/notifications" && unreadCount > 0 && (
                  <span className="ml-auto bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </NavLink>
            ))}
          </>
        )}
      </nav>

      {/* Bottom actions */}
      <div className="px-3 py-3 border-t border-white/8 space-y-0.5">
        {role === "admin" && (
          <NavLink to="/admin/analytics" className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}>
            <BarChart3 size={17} />
            <span>{t("nav.analytics")}</span>
          </NavLink>
        )}
        <LanguageSwitcher variant="sidebar" />
        <button
          onClick={handleLogout}
          className="sidebar-link w-full text-left hover:bg-red-500/10 hover:text-red-400 transition-colors"
        >
          <LogOut size={17} />
          <span>{t("nav.signOut")}</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-60 bg-slate-900 border-r border-white/6 flex-shrink-0 h-screen sticky top-0">
        {renderSidebarContent()}
      </aside>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative z-10 w-64 bg-slate-900 h-full flex flex-col animate-slide-in-left">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X size={20} />
            </button>
            {renderSidebarContent()}
          </aside>
        </div>
      )}
    </>
  );
}