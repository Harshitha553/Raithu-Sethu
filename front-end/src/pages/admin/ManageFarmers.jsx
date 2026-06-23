import { useState, useEffect } from "react";
import { adminApi } from "../../api/resources";
import { useToast } from "../../context/ToastContext";
import { extractErrorMessage } from "../../utils/format";
import { PageLoader, EmptyState, Badge, Spinner } from "../../components/common/Feedback";
import { Users, Check, X } from "lucide-react";

export default function ManageFarmers() {
  const toast = useToast();
  const [farmers, setFarmers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(null);

  const fetch = async () => {
    try {
      const res = await adminApi.getFarmers();
      setFarmers(res.data || []);
    } catch {
      toast.error("Failed to load farmers.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetch(); }, []);

  const handleVerify = async (userId) => {
    setVerifying(userId);
    try {
      await adminApi.verifyUser(userId);
      toast.success("User verified!");
      fetch();
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setVerifying(null);
    }
  };

  if (loading) return <PageLoader />;

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-semibold text-ink">Manage Farmers</h1>
        <p className="mt-1 text-sm text-ink-soft">Verify and manage farmer accounts</p>
      </div>

      {farmers.length === 0 ? (
        <EmptyState icon={<Users size={40} />} title="No farmers registered" />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-paddy-100">
          <table className="w-full text-sm">
            <thead className="bg-paddy-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-ink-soft">Name</th>
                <th className="px-4 py-3 text-left font-semibold text-ink-soft">Email</th>
                <th className="px-4 py-3 text-left font-semibold text-ink-soft">Location</th>
                <th className="px-4 py-3 text-center font-semibold text-ink-soft">Verified</th>
                <th className="px-4 py-3 text-center font-semibold text-ink-soft">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-paddy-100">
              {farmers.map((f) => (
                <tr key={f.id} className="hover:bg-paddy-50/50">
                  <td className="px-4 py-3 font-medium text-ink">{f.name}</td>
                  <td className="px-4 py-3 text-ink-soft">{f.email}</td>
                  <td className="px-4 py-3 text-ink-soft">{f.location || "—"}</td>
                  <td className="px-4 py-3 text-center">
                    {f.is_verified ? (
                      <span className="text-paddy-600"><Check size={16} className="inline" /> Verified</span>
                    ) : (
                      <span className="text-ink-soft/50"><X size={16} className="inline" /> Pending</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {!f.is_verified && (
                      <button
                        onClick={() => handleVerify(f.id)}
                        disabled={verifying === f.id}
                        className="inline-flex items-center gap-1 rounded-lg bg-paddy-800 px-3 py-1.5 text-xs font-semibold text-cream hover:bg-paddy-700 disabled:opacity-50"
                      >
                        {verifying === f.id ? <Spinner className="h-3 w-3" /> : <Check size={12} />}
                        Verify
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
