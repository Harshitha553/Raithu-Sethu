import { useState, useEffect } from "react";
import { adminApi } from "../../api/resources";
import { useToast } from "../../context/ToastContext";
import { extractErrorMessage } from "../../utils/format";
import { PageLoader, EmptyState, Spinner } from "../../components/common/Feedback";
import { Users, Check, X } from "lucide-react";

export default function ManageBuyers() {
  const toast = useToast();
  const [buyers, setBuyers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(null);

  const fetch = async () => {
    try {
      const res = await adminApi.getBuyers();
      setBuyers(res.data || []);
    } catch {
      toast.error("Failed to load buyers.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetch(); }, []);

  const handleVerify = async (userId) => {
    setVerifying(userId);
    try {
      await adminApi.verifyUser(userId);
      toast.success("Buyer verified!");
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
        <h1 className="font-display text-2xl font-semibold text-ink">Manage Buyers</h1>
        <p className="mt-1 text-sm text-ink-soft">Verify and manage buyer accounts</p>
      </div>

      {buyers.length === 0 ? (
        <EmptyState icon={<Users size={40} />} title="No buyers registered" />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-paddy-100">
          <table className="w-full text-sm">
            <thead className="bg-paddy-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-ink-soft">Name</th>
                <th className="px-4 py-3 text-left font-semibold text-ink-soft">Email</th>
                <th className="px-4 py-3 text-left font-semibold text-ink-soft">Company</th>
                <th className="px-4 py-3 text-center font-semibold text-ink-soft">Verified</th>
                <th className="px-4 py-3 text-center font-semibold text-ink-soft">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-paddy-100">
              {buyers.map((b) => (
                <tr key={b.id} className="hover:bg-paddy-50/50">
                  <td className="px-4 py-3 font-medium text-ink">{b.name}</td>
                  <td className="px-4 py-3 text-ink-soft">{b.email}</td>
                  <td className="px-4 py-3 text-ink-soft">{b.company_name || "—"}</td>
                  <td className="px-4 py-3 text-center">
                    {b.is_verified ? (
                      <span className="text-paddy-600"><Check size={16} className="inline" /> Verified</span>
                    ) : (
                      <span className="text-ink-soft/50"><X size={16} className="inline" /> Pending</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {!b.is_verified && (
                      <button
                        onClick={() => handleVerify(b.id)}
                        disabled={verifying === b.id}
                        className="inline-flex items-center gap-1 rounded-lg bg-paddy-800 px-3 py-1.5 text-xs font-semibold text-cream hover:bg-paddy-700 disabled:opacity-50"
                      >
                        {verifying === b.id ? <Spinner className="h-3 w-3" /> : <Check size={12} />}
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
