import { useEffect, useState, useCallback } from "react";
import { Zap, Plus, Edit2, Clock, Percent, AlertTriangle } from "lucide-react";
import { farmerApi } from "../../api/farmer";
import { flashSalesApi } from "../../api/resources";
import { useToast } from "../../context/ToastContext";
import { useLanguage } from "../../context/LanguageContext";
import { translateCropName } from "../../utils/cropTranslations";
import Modal from "../../components/ui/Modal";
import { SkeletonCard } from "../../components/ui/Skeleton";
import EmptyState from "../../components/ui/EmptyState";
import { format, parseISO, differenceInSeconds, isPast } from "date-fns";

function Countdown({ endTime }) {
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    const update = () => {
      const end = parseISO(endTime);
      setRemaining(Math.max(0, differenceInSeconds(end, new Date())));
    };
    update();
    const t = setInterval(update, 1000);
    return () => clearInterval(t);
  }, [endTime]);

  const { t } = useLanguage();
  if (remaining === 0) return <span className="text-red-500 text-xs font-semibold">{t('crop.status.expired')}</span>;

  const h = Math.floor(remaining / 3600);
  const m = Math.floor((remaining % 3600) / 60);
  const s = remaining % 60;

  return (
    <div className="flex gap-1.5">
      {[[h, "h"], [m, "m"], [s, "s"]].map(([v, l]) => (
        <div key={l} className="timer-unit" style={{ minWidth: 38, padding: "4px 8px" }}>
          <span className="timer-number text-base">{String(v).padStart(2, "0")}</span>
          <span className="timer-label">{l}</span>
        </div>
      ))}
    </div>
  );
}

export default function FlashSales() {
  const [crops, setCrops] = useState([]);
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editSale, setEditSale] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ crop_id: "", discount_percentage: "", start_time: "", end_time: "", is_active: true });
  const toast = useToast();
  const { t, lang } = useLanguage();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [cropsRes, salesRes] = await Promise.all([
        farmerApi.getMyCrops(),
        flashSalesApi.getAll(false),
      ]);
      const activeCrops = (cropsRes.data || []).filter(c => c.status === "active");
      setCrops(activeCrops);
      setSales(salesRes.data || []);
    } catch { toast.error(t('error.generic')); }
    finally { setLoading(false); }
  }, [toast]);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setEditSale(null);
    const now = new Date();
    const start = new Date(now.getTime() + 5 * 60000);
    const end = new Date(now.getTime() + 25 * 60 * 60000);
    setForm({
      crop_id: crops[0]?.id || "",
      discount_percentage: "",
      start_time: start.toISOString().slice(0, 16),
      end_time: end.toISOString().slice(0, 16),
      is_active: true,
    });
    setModalOpen(true);
  };

  const openEdit = (sale) => {
    setEditSale(sale);
    setForm({
      crop_id: sale.crop_id,
      discount_percentage: sale.discount_percentage,
      start_time: parseISO(sale.start_time).toISOString().slice(0, 16),
      end_time: parseISO(sale.end_time).toISOString().slice(0, 16),
      is_active: sale.is_active,
    });
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.crop_id) { toast.error(t('farmer.requirements.selectCrop')); return; }
    const disc = Number(form.discount_percentage);
    if (!disc || disc <= 0 || disc > 99) { toast.error(t('error.generic')); return; }
    if (!form.start_time || !form.end_time) { toast.error(t('error.generic')); return; }
    const startDate = new Date(form.start_time);
    const endDate = new Date(form.end_time);
    if (endDate <= startDate) { toast.error("Flash Sale end date must be after start date"); return; }
    if (form.crop_id) {
      const saleCrop = crops.find(c => c.id === form.crop_id) || editSale?.crops;
      if (saleCrop?.harvest_date && startDate < new Date(saleCrop.harvest_date)) {
        toast.error("Flash Sale start date must be on or after the crop harvest date"); return;
      }
    }

    setSaving(true);
    try {
      const payload = {
        ...(!editSale ? { crop_id: form.crop_id } : {}),
        discount_percentage: disc,
        start_time: new Date(form.start_time).toISOString(),
        end_time: new Date(form.end_time).toISOString(),
        ...(editSale ? { is_active: form.is_active } : {}),
      };
      if (editSale) {
        await flashSalesApi.update(editSale.id, payload);
        toast.success(t('success.generic'));
      } else {
        await flashSalesApi.create(payload);
        toast.success(t('success.generic'));
      }
      setModalOpen(false);
      load();
    } catch (err) { toast.error(err?.response?.data?.detail || t('error.generic')); }
    finally { setSaving(false); }
  };

  const mySales = sales.filter(s => crops.some(c => c.id === s.crop_id) || s.crops?.farmer_id);

  return (
    <div className="page-enter space-y-6">
      <div className="page-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">{t('farmer.flashSales.title')}</h1>
          <p className="page-subtitle">Create time-limited discounted offers to boost sales quickly</p>
        </div>
        <button onClick={openCreate} disabled={crops.length === 0} className="btn btn-amber">
          <Plus size={16} /> {t('farmer.flashSales.create')}
        </button>
      </div>

      {crops.length === 0 && !loading && (
        <div className="card p-4 flex items-center gap-3 bg-amber-50 border border-amber-200">
          <AlertTriangle size={18} className="text-amber-600 flex-shrink-0" />
          <p className="text-sm text-amber-800">You need at least one <strong>active crop</strong> to create a flash sale.</p>
        </div>
      )}

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1,2,3].map(i => <SkeletonCard key={i} />)}
        </div>
      ) : sales.length === 0 ? (
        <div className="card">
          <EmptyState
            type="crops"
            title={t('farmer.flashSales.noSales')}
            description="Create your first flash sale to notify buyers of limited-time discounts on your crops."
            action={crops.length > 0 ? openCreate : undefined}
            actionLabel={t('farmer.flashSales.create')}
            icon={Zap}
          />
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {sales.map((sale, i) => {
            const crop = sale.crops;
            const isActive = sale.is_active && !isPast(parseISO(sale.end_time));
            const originalPrice = crop?.price_per_unit || 0;
            const discounted = originalPrice - (originalPrice * sale.discount_percentage / 100);
            return (
              <div key={sale.id} className={`card overflow-hidden animate-fade-in ${isActive ? "border-amber-200" : "opacity-75"}`} style={{ animationDelay: `${i * 60}ms` }}>
                {/* Header gradient */}
                <div className={`h-2 ${isActive ? "bg-gradient-to-r from-amber-400 to-red-500" : "bg-slate-300"}`} />
                <div className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-bold text-slate-900">{crop ? translateCropName(crop.name, lang) : t('crop.name')}</h3>
                      <p className="text-xs text-slate-500">{crop?.location || ""}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {isActive ? (
                        <span className="badge-flash text-xs px-2.5 py-1 rounded-full flex items-center gap-1">
                          <Zap size={11} /> {t('crop.status.active')}
                        </span>
                      ) : (
                        <span className="badge-sold text-xs px-2.5 py-1 rounded-full">{t('crop.status.expired')}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 mb-4">
                    <div className="bg-amber-50 rounded-xl px-4 py-2 text-center">
                      <p className="text-3xl font-bold text-amber-600">{sale.discount_percentage}%</p>
                      <p className="text-xs text-amber-700">OFF</p>
                    </div>
                    <div>
                      <p className="text-slate-400 line-through text-sm">₹{originalPrice}/{crop?.unit || "unit"}</p>
                      <p className="text-green-700 font-bold text-xl">₹{discounted.toFixed(2)}/{crop?.unit || "unit"}</p>
                    </div>
                  </div>

                  {isActive && (
                    <div className="mb-4">
                      <p className="text-xs text-slate-500 mb-2 flex items-center gap-1"><Clock size={11} /> Ends in:</p>
                      <Countdown endTime={sale.end_time} />
                    </div>
                  )}

                  <div className="text-xs text-slate-500 space-y-1 mb-4">
                    <p>{t('crop.harvestDate')}: {format(parseISO(sale.start_time), "dd MMM, HH:mm")}</p>
                    <p>{t('crop.expiryDate')}: {format(parseISO(sale.end_time), "dd MMM, HH:mm")}</p>
                    {crop?.quantity && <p>{t('crop.quantity')}: {crop.quantity} {crop.unit}</p>}
                  </div>

                  <button onClick={() => openEdit(sale)} className="btn btn-secondary w-full btn-sm">
                    <Edit2 size={13} /> {t('farmer.flashSales.edit')}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editSale ? t('farmer.flashSales.edit') : t('farmer.flashSales.create')}
        subtitle="Set discount and time window"
        size="md"
      >
        <form onSubmit={handleSave} className="space-y-4">
          {!editSale && (
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">{t('farmer.requirements.selectCrop')} <span className="text-red-500">*</span></label>
              <select value={form.crop_id} onChange={e => setForm(f => ({ ...f, crop_id: e.target.value }))} className="input-field" required>
                <option value="">— {t('farmer.requirements.selectCrop')} —</option>
                {crops.map(c => <option key={c.id} value={c.id}>{translateCropName(c.name, lang)} ({c.quantity} {c.unit} @ ₹{c.price_per_unit})</option>)}
              </select>
            </div>
          )}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Discount Percentage <span className="text-red-500">*</span></label>
            <div className="relative">
              <Percent size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="number" min="1" max="99" value={form.discount_percentage} onChange={e => setForm(f => ({ ...f, discount_percentage: e.target.value }))} placeholder={t('common.typeHere')} className="input-field pl-9" required />
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">{t('crop.harvestDate')} <span className="text-red-500">*</span></label>
              <input type="datetime-local" value={form.start_time} onChange={e => setForm(f => ({ ...f, start_time: e.target.value }))} className="input-field" required />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">{t('crop.expiryDate')} <span className="text-red-500">*</span></label>
              <input type="datetime-local" value={form.end_time} onChange={e => setForm(f => ({ ...f, end_time: e.target.value }))} className="input-field" required />
            </div>
          </div>
          {editSale && (
            <div className="flex items-center gap-3">
              <input type="checkbox" id="is_active" checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} className="w-4 h-4 accent-green-600" />
              <label htmlFor="is_active" className="text-sm font-medium text-slate-700">{t('crop.status.active')}</label>
            </div>
          )}
          <div className="flex gap-3 pt-2 justify-end border-t border-slate-100">
            <button type="button" onClick={() => setModalOpen(false)} className="btn btn-secondary">{t('common.cancel')}</button>
            <button type="submit" disabled={saving} className="btn btn-amber">
              {saving ? t('common.saving') : editSale ? t('farmer.flashSales.edit') : <><Zap size={14} /> {t('farmer.flashSales.create')}</>}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
