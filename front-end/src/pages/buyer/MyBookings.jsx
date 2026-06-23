import { useEffect, useState } from "react";
import { Package, MapPin, CreditCard, Calendar, Truck, CheckCircle2 } from "lucide-react";
import { bookingsApi } from "../../api/resources";
import { useToast } from "../../context/ToastContext";
import { useLanguage } from "../../context/LanguageContext";
import { translateCropName } from "../../utils/cropTranslations";
import { StatusBadge } from "../../components/ui/Badge";
import { SkeletonTable } from "../../components/ui/Skeleton";
import EmptyState from "../../components/ui/EmptyState";
import { format, parseISO } from "date-fns";

export default function BuyerBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const { t, lang } = useLanguage();
  const toast = useToast();

  const load = async () => {
    setLoading(true);
    try {
      const res = await bookingsApi.getAll();
      setBookings(res.data || []);
    } catch { toast.error(t('error.generic')); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const filtered = filter === "all" ? bookings : bookings.filter(b => b.status === filter);

  const tabs = [
    { key: "all", label: t('farmer.requests.all') },
    { key: "confirmed", label: t('farmer.bookings.confirmed') },
    { key: "completed", label: t('farmer.bookings.completed') },
  ];

  return (
    <div className="page-enter space-y-6">
      <div className="page-header">
        <h1 className="page-title">{t('buyer.bookings.title')}</h1>
        <p className="page-subtitle">{t('buyer.bookings.title')}</p>
      </div>

      <div className="flex gap-1 bg-slate-100 rounded-xl p-1 w-fit">
        {tabs.map(({ key, label }) => (
          <button key={key} onClick={() => setFilter(key)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${filter === key ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <SkeletonTable rows={5} />
      ) : filtered.length === 0 ? (
        <div className="card">
          <EmptyState
            type="requests"
            title={filter !== "all" ? `No ${filter} ${t('buyer.bookings.title')}` : t('buyer.bookings.noBookings')}
            description={t('buyer.requests.noRequestsDesc')}
          />
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="w-full text-sm">
            <thead className="table-header">
              <tr className="text-xs text-slate-500 uppercase tracking-wider">
                <th className="text-left px-5 py-3 font-semibold">{t('crop.name')} & {t('role.farmer')}</th>
                <th className="text-left px-4 py-3 font-semibold">{t('crop.quantity')}</th>
                <th className="text-left px-4 py-3 font-semibold">{t('crop.price')}</th>
                <th className="text-left px-4 py-3 font-semibold">{t('crop.price')}</th>
                <th className="text-left px-4 py-3 font-semibold">{t('crop.location')}</th>
                <th className="text-left px-4 py-3 font-semibold">{t('crop.harvestDate')}</th>
                <th className="text-left px-4 py-3 font-semibold">{t('common.status')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map((booking, i) => (
                <tr key={booking.id} className="table-row animate-fade-in" style={{ animationDelay: `${i * 40}ms` }}>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
                        <Package size={15} className="text-blue-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800">{translateCropName(booking.crops?.name || "", lang) || t('crop.name')}</p>
                        <p className="text-xs text-slate-500">From: {t('role.farmer')} #{booking.crops?.farmer_id || t('common.noData')}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-slate-700 font-medium">{booking.quantity} {booking.crops?.unit || t('crop.unit')}</td>
                  <td className="px-4 py-4 font-bold text-slate-900">₹{booking.total_price?.toLocaleString()}</td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-1.5 text-slate-600 text-xs uppercase font-semibold">
                      <CreditCard size={13} className="text-slate-400" />
                      {booking.payment_method}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-slate-600 text-xs max-w-48">
                    <div className="flex items-start gap-1.5">
                      <MapPin size={13} className="text-slate-400 mt-0.5 flex-shrink-0" />
                      <span className="line-clamp-2" title={booking.delivery_address}>{booking.delivery_address}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-slate-500 text-xs">
                    {booking.created_at ? format(parseISO(booking.created_at), "dd MMM yyyy") : "—"}
                  </td>
                  <td className="px-4 py-4">
                    {booking.status === "completed" ? (
                      <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 text-xs font-semibold px-2.5 py-1 rounded-full">
                        <CheckCircle2 size={12} /> {t('farmer.bookings.completed')}
                      </span>
                    ) : (
                      <StatusBadge status={booking.status} />
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
