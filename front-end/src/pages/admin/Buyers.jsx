import { useEffect, useState } from "react";
import { Search, ShoppingBag, ShieldCheck, ShieldAlert } from "lucide-react";
import { adminApi } from "../../api/admin";
import { useToast } from "../../context/ToastContext";
import { SkeletonTable } from "../../components/ui/Skeleton";
import EmptyState from "../../components/ui/EmptyState";
import { format, parseISO } from "date-fns";

export default function BuyersList() {
  const [buyers, setBuyers] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const toast = useToast();

  const load = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getBuyers();
      setBuyers(res.data || []);
    } catch { toast.error("Failed to load buyers"); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (!search) setFiltered(buyers);
    else {
      const s = search.toLowerCase();
      setFiltered(buyers.filter(b => b.name.toLowerCase().includes(s) || b.email.toLowerCase().includes(s) || (b.company_name && b.company_name.toLowerCase().includes(s))));
    }
  }, [buyers, search]);

  const toggleStatus = async (id, currentVerified) => {
    try {
      if (currentVerified) await adminApi.suspendUser(id);
      else await adminApi.verifyUser(id);
      toast.success(`Buyer ${currentVerified ? "suspended" : "verified"}`);
      load();
    } catch { toast.error("Failed to update status"); }
  };

  return (
    <div className="page-enter space-y-6">
      <div className="page-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">Buyers Directory</h1>
          <p className="page-subtitle">Manage all registered buyers on the platform</p>
        </div>
      </div>

      <div className="card p-4">
        <div className="relative max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, email, or company..."
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
          <EmptyState type="search" title="No buyers found" description="Try adjusting your search terms." />
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="table-wrapper">
            <table className="w-full text-sm">
              <thead className="table-header">
                <tr className="text-xs text-slate-500 uppercase tracking-wider">
                  <th className="text-left px-5 py-3 font-semibold">Buyer</th>
                  <th className="text-left px-4 py-3 font-semibold">Contact</th>
                  <th className="text-left px-4 py-3 font-semibold">Company</th>
                  <th className="text-left px-4 py-3 font-semibold">Joined</th>
                  <th className="text-left px-4 py-3 font-semibold">Status</th>
                  <th className="text-left px-4 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map(buyer => (
                  <tr key={buyer.id} className="table-row">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-xs">
                          {buyer.name.charAt(0)}
                        </div>
                        <p className="font-semibold text-slate-800">{buyer.name}</p>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-slate-700">{buyer.email}</p>
                      <p className="text-xs text-slate-500">{buyer.phone}</p>
                    </td>
                    <td className="px-4 py-4 text-slate-600 font-medium">{buyer.company_name || "—"}</td>
                    <td className="px-4 py-4 text-slate-500 text-xs">
                      {buyer.created_at ? format(parseISO(buyer.created_at), "dd MMM yyyy") : "—"}
                    </td>
                    <td className="px-4 py-4">
                      {buyer.is_verified ? (
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
                        onClick={() => toggleStatus(buyer.id, buyer.is_verified)}
                        className={`text-xs font-semibold hover:underline ${buyer.is_verified ? "text-red-500 hover:text-red-600" : "text-green-600 hover:text-green-700"}`}
                      >
                        {buyer.is_verified ? "Suspend" : "Verify Now"}
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
