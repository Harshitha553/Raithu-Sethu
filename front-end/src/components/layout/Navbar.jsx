import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useNotifications } from "../../context/NotificationContext";
import { Menu, X, Bell, LogOut, User, ShoppingBag, Sprout, MessageCircle, ChevronDown } from "lucide-react";

const FARMER_LINKS = [
  { to: "/farmer/dashboard", label: "Dashboard", icon: Sprout },
  { to: "/farmer/crops", label: "My Crops", icon: Sprout },
  { to: "/farmer/requests", label: "Requests", icon: ShoppingBag },
  { to: "/farmer/requirements", label: "Buyer Requirements", icon: User },
  { to: "/farmer/bookings", label: "Bookings", icon: ShoppingBag },
  { to: "/farmer/flash-sales", label: "Flash Sales", icon: Sprout },
];

const BUYER_LINKS = [
  { to: "/buyer/marketplace", label: "Marketplace", icon: ShoppingBag },
  { to: "/buyer/requests", label: "My Requests", icon: ShoppingBag },
  { to: "/buyer/requirements", label: "My Requirements", icon: User },
  { to: "/buyer/bookings", label: "Bookings", icon: ShoppingBag },
];

export default function Navbar() {
  const { isAuthenticated, user, role, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const links = role === "farmer" ? FARMER_LINKS : role === "buyer" ? BUYER_LINKS : [];

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  if (!isAuthenticated) {
    return (
      <nav className="sticky top-0 z-50 border-b border-paddy-100 bg-cream/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="font-display text-xl font-semibold text-paddy-800 tracking-tight">
            రైతు సేతు
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/login" className="text-sm font-semibold text-ink-soft hover:text-paddy-700">
              Login
            </Link>
            <Link
              to="/register"
              className="rounded-lg bg-paddy-800 px-4 py-2 text-sm font-semibold text-cream hover:bg-paddy-700"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="sticky top-0 z-50 border-b border-paddy-100 bg-cream/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-6">
          <button
            className="lg:hidden text-ink-soft"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
          <Link to={role === "farmer" ? "/farmer/dashboard" : "/buyer/marketplace"} className="font-display text-xl font-semibold text-paddy-800 tracking-tight">
            రైతు సేతు
          </Link>
          <div className="hidden lg:flex items-center gap-1">
            {links.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-ink-soft hover:bg-paddy-50 hover:text-paddy-800"
              >
                <link.icon size={16} />
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/chat"
            className="relative rounded-lg p-2 text-ink-soft hover:bg-paddy-50 hover:text-paddy-800"
            aria-label="Chat"
          >
            <MessageCircle size={20} />
          </Link>
          <Link
            to="/notifications"
            className="relative rounded-lg p-2 text-ink-soft hover:bg-paddy-50 hover:text-paddy-800"
            aria-label="Notifications"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-terracotta-400 px-1 text-[10px] font-bold text-white">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </Link>
          <div className="relative">
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center gap-2 rounded-lg p-2 text-ink-soft hover:bg-paddy-50 hover:text-paddy-800"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-paddy-200 text-xs font-bold text-paddy-800">
                {user?.name?.charAt(0)?.toUpperCase() || "U"}
              </div>
              <ChevronDown size={14} />
            </button>
            {profileOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setProfileOpen(false)} />
                <div className="absolute right-0 top-full z-20 mt-1 w-56 rounded-xl border border-paddy-100 bg-white py-2 shadow-lg shadow-ink/5">
                  <div className="border-b border-paddy-100 px-4 pb-2 mb-1">
                    <p className="text-sm font-semibold text-ink">{user?.name}</p>
                    <p className="text-xs text-ink-soft capitalize">{role}</p>
                  </div>
                  <Link
                    to="/chat"
                    className="flex items-center gap-2 px-4 py-2 text-sm text-ink-soft hover:bg-paddy-50"
                    onClick={() => setProfileOpen(false)}
                  >
                    <MessageCircle size={16} /> Chat
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 px-4 py-2 text-sm text-terracotta-500 hover:bg-paddy-50"
                  >
                    <LogOut size={16} /> Sign Out
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-paddy-100 bg-cream px-4 pb-4 pt-2 lg:hidden">
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-ink-soft hover:bg-paddy-50"
              onClick={() => setMobileOpen(false)}
            >
              <link.icon size={18} /> {link.label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}
