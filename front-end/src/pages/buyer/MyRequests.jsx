import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Package, MessageCircle, Clock, CheckCircle2, XCircle, ChevronRight, MapPin, DollarSign } from "lucide-react";
import { buyerApi } from "../../api/buyer";
import { chatApi, bookingsApi } from "../../api/resources";
import { useToast } from "../../context/ToastContext";
import { useLanguage } from "../../context/LanguageContext";
import { translateCropName } from "../../utils/cropTranslations";
import Modal from "../../components/ui/Modal";
import { StatusBadge } from "../../components/ui/Badge";
import { SkeletonTable } from "../../components/ui/Skeleton";
import EmptyState from "../../components/ui/EmptyState";
import { format, parseISO } from "date-fns";

export default function MyRequests() {
  const [requests, setRequests] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  
  // Booking Modal
  const [bookModal, setBookModal] = useState(null);
  const [bookForm, setBookForm] = useState({ delivery_address: "", payment_method: "cash" });
  const [booking, setBooking] = useState(false);

  const { t, lang } = useLanguage();
  const toast = useToast();
  const navigate = useNavigate();

  const load = async () => {
    setLoading(true);
    try {
      const res = await buyerApi.getMyRequests();
      setRequests(res.data || []);
    } catch { toast.error(t('error.generic')); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    setFiltered(filter === "all" ? requests : requests.filter(r => r.status === filter));
  }, [requests, filter]);

  const handleChat = async (farmerId) => {
    try {
      const res = await chatApi.createConversation(farmerId);
      navigate("/chat", { state: { conversationId: res.data?.id } });
    } catch { toast.error(t('error.generic')); }
  };

  const openBook = (req) => {
    setBookModal(req);
    setBookForm({ delivery_address: "", payment_method: "cash" });
  };

  const handleBook = async (e) => {
    e.preventDefault();
    if (!bookForm.delivery_address.trim()) { toast.error(t('error.generic')); return; }
    setBooking(true);
    try {
      await bookingsApi.create({
        crop_id: bookModal.crop_id,
        quantity: bookModal.quantity,
        delivery_address: bookForm.delivery_address,
        delivery_date: new Date().toISOString(),
        payment_method: bookForm.payment_method,
      });
      toast.success(t('success.generic'));
      setBookModal(null);
      load(); // Reload to update status if backend changes it
      navigate("/buyer/bookings");
    } catch (err) { toast.error(err?.response?.data?.detail || t('error.generic')); }
    finally { setBooking(false); }
  };

  const tabs = [
    { key: "all", label: t('farmer.requests.all'), count: requests.length },
    { key: "pending", label: t('buyer.requests.pending'), count: requests.filter(r=>r.status==="pending").length },
    { key: "accepted", label: t('buyer.requests.accepted'), count: requests.filter(r=>r.status==="accepted").length },
    { key: "rejected", label: t('buyer.requests.rejected'), count: requests.filter(r=>r.status==="rejected").length },
  ];

  return (
    <div className="page-enter space-y-6">
      <div className="page-header">
        <h1 className="page-title">{t('buyer.requests.title')}</h1>
        <p className="page-subtitle">{t('buyer.requests.title')}</p>
      </div>

      {/* Summary cards */}
      {!loading && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {tabs.map(({ key, label, count }) => (
            <button key={key} onClick={() => setFilter(key)}
              className={`p-4 rounded-xl border-2 text-left transition-all ${filter === key ? "border-blue-500 bg-blue-50" : "border-slate-200 bg-white hover:border-slate-300"}`}>
              <p className={`text-2xl font-bold ${filter === key ? "text-blue-700" : "text-slate-800"}`}>{count}</p>
              <p className={`text-sm mt-0.5 ${filter === key ? "text-blue-600" : "text-slate-500"}`}>{label}</p>
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <SkeletonTable rows={5} />
      ) : filtered.length === 0 ? (
        <div className="card">
          <EmptyState
            type="requests"
            title={filter !== "all" ? `No ${filter} ${t('buyer.requests.title')}` : t('buyer.requests.noRequests')}
            description={t('buyer.requests.noRequestsDesc')}
            action={() => navigate("/buyer/marketplace")}
            actionLabel={t('nav.marketplace')}
          />
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="w-full text-sm">
            <thead className="table-header">
              <tr className="text-xs text-slate-500 uppercase tracking-wider">
                <th className="text-left px-5 py-3 font-semibold">{t('crop.name')}</th>
                <th className="text-left px-4 py-3 font-semibold">{t('role.farmer')}</th>
                <th className="text-left px-4 py-3 font-semibold">{t('crop.quantity')}</th>
                <th className="text-left px-4 py-3 font-semibold">{t('buyer.marketplace.proposedPrice')}</th>
                <th className="text-left px-4 py-3 font-semibold">{t('crop.harvestDate')}</th>
                <th className="text-left px-4 py-3 font-semibold">{t('common.status')}</th>
                <th className="text-left px-4 py-3 font-semibold">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map((req, i) => (
                <tr key={req.id} className="table-row animate-fade-in" style={{ animationDelay: `${i * 40}ms` }}>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center">
                        <Package size={14} className="text-green-600" />
                      </div>
                      <p className="font-semibold text-slate-800">{translateCropName(req.crop_name || req.crops?.name || "", lang) || t('crop.name')}</p>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-slate-700">{req.farmer_name || req["users!farmer_id"]?.name || t('role.farmer')}</td>
                  <td className="px-4 py-4 text-slate-700 font-medium">{req.quantity} {t('crop.unit')}</td>
                  <td className="px-4 py-4 font-semibold text-slate-900">
                    {req.proposed_price ? `₹${req.proposed_price}` : <span className="text-slate-400 font-normal text-xs">Standard</span>}
                  </td>
                  <td className="px-4 py-4 text-slate-500 text-xs">
                    {req.created_at ? format(parseISO(req.created_at), "dd MMM yy") : "—"}
                  </td>
                  <td className="px-4 py-4"><StatusBadge status={req.status} /></td>
                  <td className="px-4 py-4">
                    <div className="flex gap-2">
                      {req.status === "accepted" && (
                        <button onClick={() => openBook(req)} className="btn btn-primary btn-sm">
                          Book Now
                        </button>
                      )}
                      <button
                        onClick={() => handleChat(req.farmer_id || req["users!farmer_id"]?.id)}
                        className="btn btn-secondary btn-sm btn-icon"
                        title="Chat with farmer"
                      >
                        <MessageCircle size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Booking Modal */}
      <Modal
        open={!!bookModal}
        onClose={() => setBookModal(null)}
        title={t('buyer.bookings.title')}
        subtitle={bookModal?.crop_name || t('crop.name')}
        size="md"
      >
        {bookModal && (
          <form onSubmit={handleBook} className="space-y-4">
            <div className="bg-blue-50 rounded-xl p-4 mb-4 border border-blue-100">
              <h3 className="font-bold text-blue-900 mb-2">{t('farmer.bookings.title')}</h3>
              <div className="space-y-1 text-sm text-blue-800">
                <div className="flex justify-between"><p>{t('crop.name')}</p> <p className="font-semibold">{bookModal.crop_name || bookModal.crops?.name}</p></div>
                <div className="flex justify-between"><p>{t('crop.quantity')}</p> <p className="font-semibold">{bookModal.quantity} {t('crop.unit')}</p></div>
                {bookModal.proposed_price && (
                  <div className="flex justify-between"><p>{t('crop.pricePerUnit')}</p> <p className="font-semibold">₹{bookModal.proposed_price}</p></div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">{t('crop.location')} <span className="text-red-500">*</span></label>
              <div className="relative">
                <MapPin size={15} className="absolute left-3 top-3 text-slate-400" />
                <textarea
                  value={bookForm.delivery_address} onChange={e => setBookForm(f => ({ ...f, delivery_address: e.target.value }))}
                  rows={3} placeholder={t('crop.location')}
                  className="input-field pl-9 resize-none" required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Payment Method <span className="text-red-500">*</span></label>
              <select value={bookForm.payment_method} onChange={e => setBookForm(f => ({ ...f, payment_method: e.target.value }))} className="input-field">
                <option value="cash">Cash on Delivery</option>
                <option value="online">Online Payment</option>
              </select>
            </div>

            <div className="flex gap-3 pt-2 justify-end border-t border-slate-100">
              <button type="button" onClick={() => setBookModal(null)} className="btn btn-secondary">{t('common.cancel')}</button>
              <button type="submit" disabled={booking} className="btn btn-primary">
                {booking ? t('common.saving') : t('common.confirm')}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
