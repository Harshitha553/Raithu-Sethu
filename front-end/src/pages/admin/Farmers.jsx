import { useEffect, useState } from "react";
import { Search, Sprout, ShieldCheck, ShieldAlert, Edit2, Trash2 } from "lucide-react";
import { adminApi } from "../../api/admin";
import { useToast } from "../../context/ToastContext";
import { SkeletonTable } from "../../components/ui/Skeleton";
import EmptyState from "../../components/ui/EmptyState";
import { format, parseISO } from "date-fns";

export default function FarmersList() {
  const [farmers, setFarmers] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const toast = useToast();

  const load = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getFarmers();
      setFarmers(res.data || []);
    } catch { toast.error("Failed to load farmers"); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (!search) setFiltered(farmers);
    else {
      const s = search.toLowerCase();
      setFiltered(farmers.filter(f => f.name.toLowerCase().includes(s) || f.email.toLowerCase().includes(s) || (f.location && f.location.toLowerCase().includes(s))));
    }
  }, [farmers, search]);

  const toggleStatus = async (id, currentVerified) => {
    try {
      if (currentVerified) await adminApi.suspendUser(id);
      else await adminApi.verifyUser(id);
      toast.success(`Farmer ${currentVerified ? "suspended" : "verified"}`);
      load();
    } catch { toast.error("Failed to update status"); }
  };

  return (
    <div className="page-enter space-y-6">
      <div className="page-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">Farmers Directory</h1>
          <p className="page-subtitle">Manage all registered farmers on the platform</p>
        </div>
      </div>

      <div className="card p-4">
        <div className="relative max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, email, or location..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input-field pl-9"
          />
        </div>
      </div>

      {loading ? (
        <SkeletonTable rows={8} />
      ) : filtered.length === 0 ? (
        <div className="card">
          <EmptyState type="search" title="No farmers found" description="Try adjusting your search terms." />
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="table-wrapper">
            <table className="w-full text-sm">
              <thead className="table-header">
                <tr className="text-xs text-slate-500 uppercase tracking-wider">
                  <th className="text-left px-5 py-3 font-semibold">Farmer</th>
                  <th className="text-left px-4 py-3 font-semibold">Contact</th>
                  <th className="text-left px-4 py-3 font-semibold">Location</th>
                  <th className="text-left px-4 py-3 font-semibold">Joined</th>
                  <th className="text-left px-4 py-3 font-semibold">Status</th>
                  <th className="text-left px-4 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map(farmer => (
                  <tr key={farmer.id} className="table-row">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center text-green-600 font-bold text-xs">
                          {farmer.name.charAt(0)}
                        </div>
                        <p className="font-semibold text-slate-800">{farmer.name}</p>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-slate-700">{farmer.email}</p>
                      <p className="text-xs text-slate-500">{farmer.phone}</p>
                    </td>
                    <td className="px-4 py-4 text-slate-600">{farmer.location || "—"}</td>
                    <td className="px-4 py-4 text-slate-500 text-xs">
                      {farmer.created_at ? format(parseISO(farmer.created_at), "dd MMM yyyy") : "—"}
                    </td>
                    <td className="px-4 py-4">
                      {farmer.is_verified ? (
                        <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs font-semibold">
                          <ShieldCheck size={12} /> Verified
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full text-xs font-semibold">
                          <ShieldAlert size={12} /> Pending
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <button
                        onClick={() => toggleStatus(farmer.id, farmer.is_verified)}
                        className={`text-xs font-semibold hover:underline ${farmer.is_verified ? "text-red-500 hover:text-red-600" : "text-green-600 hover:text-green-700"}`}
                      >
                        {farmer.is_verified ? "Suspend" : "Verify Now"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
