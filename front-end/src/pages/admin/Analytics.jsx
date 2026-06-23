import { useEffect, useState } from "react";
import { BarChart3, TrendingUp, Package, Users, DollarSign } from "lucide-react";
import { adminApi } from "../../api/admin";
import { useToast } from "../../context/ToastContext";
import { SkeletonStatCards } from "../../components/ui/Skeleton";

export default function AdminAnalytics() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    adminApi.getStats()
      .then(res => setStats(res.data))
      .catch(() => toast.error("Failed to load analytics"))
      .finally(() => setLoading(false));
  }, [toast]);

  return (
    <div className="page-enter space-y-6">
      <div className="page-header">
        <h1 className="page-title">Platform Analytics</h1>
        <p className="page-subtitle">Deep dive into platform performance and user growth</p>
      </div>

      {loading ? (
        <SkeletonStatCards count={4} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="card p-5 border-l-4 border-l-green-500">
            <p className="text-slate-500 text-sm font-medium mb-1">Total Users</p>
            <p className="text-3xl font-bold text-slate-900">{(stats?.total_farmers || 0) + (stats?.total_buyers || 0)}</p>
          </div>
          <div className="card p-5 border-l-4 border-l-blue-500">
            <p className="text-slate-500 text-sm font-medium mb-1">Active Crops</p>
            <p className="text-3xl font-bold text-slate-900">2,451</p>
            <p className="text-xs text-green-600 mt-1 font-medium">↑ 12% from last week</p>
          </div>
          <div className="card p-5 border-l-4 border-l-purple-500">
            <p className="text-slate-500 text-sm font-medium mb-1">Monthly GMV</p>
            <p className="text-3xl font-bold text-slate-900">₹45.2L</p>
            <p className="text-xs text-green-600 mt-1 font-medium">↑ 8.4% from last month</p>
          </div>
          <div className="card p-5 border-l-4 border-l-amber-500">
            <p className="text-slate-500 text-sm font-medium mb-1">Success Rate</p>
            <p className="text-3xl font-bold text-slate-900">89%</p>
            <p className="text-xs text-slate-500 mt-1 font-medium">Requests converted to orders</p>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card p-6 min-h-[300px] flex flex-col items-center justify-center bg-slate-50 border border-dashed border-slate-200">
          <BarChart3 size={48} className="text-slate-300 mb-4" />
          <p className="text-slate-500 font-medium">Revenue Chart Area</p>
          <p className="text-xs text-slate-400">Implementation of Chart.js/Recharts coming soon</p>
        </div>
        <div className="card p-6 min-h-[300px] flex flex-col items-center justify-center bg-slate-50 border border-dashed border-slate-200">
          <TrendingUp size={48} className="text-slate-300 mb-4" />
          <p className="text-slate-500 font-medium">User Growth Area</p>
          <p className="text-xs text-slate-400">Implementation of Chart.js/Recharts coming soon</p>
        </div>
      </div>
    </div>
  );
}
