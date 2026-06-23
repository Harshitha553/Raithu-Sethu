import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Edit2, Trash2, Calendar, MapPin, DollarSign, Package, MessageCircle, User, CheckCircle } from "lucide-react";
import { buyerApi } from "../../api/buyer";
import { chatApi } from "../../api/resources";
import { useToast } from "../../context/ToastContext";
import { useLanguage } from "../../context/LanguageContext";
import { translateCropName } from "../../utils/cropTranslations";
import Modal, { ConfirmModal } from "../../components/ui/Modal";
import { CategoryBadge, StatusBadge } from "../../components/ui/Badge";
import Spinner from "../../components/ui/Spinner";
import { SkeletonCard } from "../../components/ui/Skeleton";
import EmptyState from "../../components/ui/EmptyState";
import { format, parseISO } from "date-fns";

const CATEGORIES = ["Vegetables", "Fruits", "Grains", "Dairy", "Spices", "Pulses", "Others"];

const EMPTY_FORM = {
  crop_name: "", category: "Vegetables", quantity: "", unit: "kg",
  max_price: "", location: "", required_by: "", description: ""
};

export default function BuyerRequirements() {
  const navigate = useNavigate();
  const [requirements, setRequirements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editReq, setEditReq] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [viewResponses, setViewResponses] = useState(null);
  const [responses, setResponses] = useState([]);
  const [responsesLoading, setResponsesLoading] = useState(false);
  const [acceptingId, setAcceptingId] = useState(null);
  const { t, lang } = useLanguage();
  const toast = useToast();

  const load = async () => {
    setLoading(true);
    try {
      const res = await buyerApi.getMyRequirements();
      setRequirements(res.data || []);
    } catch { toast.error(t('error.generic')); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => { setEditReq(null); setForm(EMPTY_FORM); setModalOpen(true); };
  const openEdit = (req) => {
    setEditReq(req);
    setForm({
      crop_name: req.crop_name, category: req.category, quantity: req.quantity,
      unit: req.unit, max_price: req.max_price, location: req.location || "",
      required_by: req.required_by ? req.required_by.slice(0, 10) : "",
      description: req.description || ""
    });
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        quantity: Number(form.quantity),
        max_price: Number(form.max_price),
        required_by: form.required_by || null,
      };
      if (editReq) {
        await buyerApi.updateRequirement(editReq.id, payload);
        toast.success(t('buyer.requirements.saveSuccess'));
      } else {
        await buyerApi.createRequirement(payload);
        toast.success(t('buyer.requirements.saveSuccess'));
      }
      setModalOpen(false);
      load();
    } catch (err) { toast.error(err?.response?.data?.detail || t('buyer.requirements.saveFailed')); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await buyerApi.deleteRequirement(deleteTarget.id);
      toast.success(t('buyer.requirements.saveSuccess'));
      setDeleteTarget(null);
      load();
    } catch { toast.error(t('error.generic')); }
  };

  const handleViewResponses = async (req) => {
    setViewResponses(req);
    setResponsesLoading(true);
    try {
      const res = await buyerApi.getRequirementResponses();
      const filtered = (res.data || []).filter(r => r.requirement_id === req.id);
      setResponses(filtered);
    } catch { toast.error(t('error.generic')); setResponses([]); }
    finally { setResponsesLoading(false); }
  };

  const handleAcceptResponse = async (responseId) => {
    setAcceptingId(responseId);
    try {
      await buyerApi.acceptRequirementResponse(responseId);
      toast.success(t('success.generic'));
      setViewResponses(null);
      setResponses([]);
      load();
    } catch (err) { toast.error(err?.response?.data?.detail || t('error.generic')); }
    finally { setAcceptingId(null); }
  };

  const handleChatWithFarmer = async (farmerId) => {
    try {
      const res = await chatApi.createConversation(farmerId);
      navigate("/chat", { state: { conversationId: res.data?.id } });
    } catch { toast.error(t('error.generic')); }
  };

  return (
    <div className="page-enter space-y-6">
      <div className="page-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">{t('buyer.requirements.title')}</h1>
          <p className="page-subtitle">{t('buyer.requirements.title')}</p>
        </div>
        <button onClick={openAdd} className="btn btn-primary">
          <Plus size={16} /> {t('buyer.requirements.create')}
        </button>
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1,2,3].map(i => <SkeletonCard key={i} />)}
        </div>
      ) : requirements.length === 0 ? (
        <div className="card">
          <EmptyState
            type="requests"
            title={t('buyer.requirements.noRequirements')}
            description={t('buyer.requirements.requirementsDesc')}
            action={openAdd}
            actionLabel={t('buyer.requirements.create')}
          />
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {requirements.map((req, i) => (
            <div key={req.id} className="card p-5 animate-fade-in" style={{ animationDelay: `${i * 60}ms` }}>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-bold text-slate-900 text-lg">{translateCropName(req.crop_name, lang)}</h3>
                  <div className="flex gap-2 mt-1.5">
                    <CategoryBadge category={req.category} />
                    <StatusBadge status={req.status} />
                  </div>
                </div>
              </div>

              <div className="space-y-2 mb-5">
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Package size={14} className="text-slate-400" />
                  <span><strong>{req.quantity} {req.unit}</strong> {t('common.required')}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <DollarSign size={14} className="text-slate-400" />
                  <span>{t('buyer.requirements.targetPrice')}: <strong className="text-green-700">₹{req.max_price}/{req.unit}</strong></span>
                </div>
                {req.location && (
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <MapPin size={14} className="text-slate-400" />
                    <span className="truncate">{req.location}</span>
                  </div>
                )}
                {req.required_by && (
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Calendar size={14} className="text-slate-400" />
                    <span>{t('buyer.requirements.deadline')}: {format(parseISO(req.required_by), "dd MMM yyyy")}</span>
                  </div>
                )}
              </div>

              {req.description && (
                <p className="text-xs text-slate-500 bg-slate-50 rounded-lg p-2.5 mb-5 line-clamp-3">{req.description}</p>
              )}

              <div className="flex gap-2 pt-4 border-t border-slate-100">
                <button onClick={() => handleViewResponses(req)} className="btn btn-secondary flex-1 btn-sm">
                  <MessageCircle size={13} /> {t('buyer.requirements.viewResponses')}
                </button>
                <button onClick={() => openEdit(req)} className="btn btn-secondary btn-icon btn-sm">
                  <Edit2 size={13} />
                </button>
                <button onClick={() => setDeleteTarget(req)} className="btn btn-danger btn-icon btn-sm">
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={modalOpen} onClose={() => setModalOpen(false)}
        title={editReq ? t('buyer.requirements.edit') : t('buyer.requirements.create')}
        subtitle={t('buyer.requirements.title')}
        size="md"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">{t('buyer.requirements.cropName')} <span className="text-red-500">*</span></label>
              <input type="text" value={form.crop_name} onChange={e => setForm(f => ({ ...f, crop_name: e.target.value }))} placeholder={t('crop.name')} className="input-field" required />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">{t('crop.category')}</label>
              <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className="input-field">
                {CATEGORIES.map(c => <option key={c} value={c}>{t('crop.category.' + c.toLowerCase())}</option>)}
              </select>
            </div>
          </div>
          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">{t('crop.quantity')} <span className="text-red-500">*</span></label>
              <input type="number" min="1" value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))} className="input-field" required />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">{t('crop.unit')}</label>
              <select value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))} className="input-field">
                <option value="kg">{t('crop.unit.kg')}</option><option value="ton">{t('crop.unit.ton')}</option><option value="quintal">{t('crop.unit.quintal')}</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">{t('buyer.requirements.targetPrice')} <span className="text-red-500">*</span></label>
              <input type="number" min="0.1" step="0.1" value={form.max_price} onChange={e => setForm(f => ({ ...f, max_price: e.target.value }))} className="input-field" required />
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">{t('crop.location')}</label>
              <input type="text" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder={t('crop.location')} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">{t('buyer.requirements.deadline')}</label>
              <input type="date" value={form.required_by} onChange={e => setForm(f => ({ ...f, required_by: e.target.value }))} className="input-field" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">{t('crop.description')}</label>
            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} placeholder={t('crop.description')} className="input-field resize-none" />
          </div>
          <div className="flex gap-3 pt-2 justify-end border-t border-slate-100">
            <button type="button" onClick={() => setModalOpen(false)} className="btn btn-secondary">{t('common.cancel')}</button>
            <button type="submit" disabled={saving} className="btn btn-primary">{saving ? t('common.saving') : t('buyer.requirements.create')}</button>
          </div>
        </form>
      </Modal>

      {/* View Responses Modal */}
      <Modal
        open={!!viewResponses}
        onClose={() => { setViewResponses(null); setResponses([]); }}
        title={t('buyer.requirements.viewResponses')}
        subtitle={viewResponses ? translateCropName(viewResponses.crop_name, lang) : ""}
        size="md"
      >
        {responsesLoading ? (
          <div className="flex justify-center p-8"><Spinner /></div>
        ) : responses.length === 0 ? (
          <div className="text-center p-8 text-slate-500 text-sm">{t('buyer.requirements.noResponses')}</div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {responses.map(r => (
              <div key={r.id} className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                    <User size={14} className="text-green-600" />
                  </div>
                  <span className="font-semibold text-sm text-slate-800">{r.farmer?.name || "Farmer"}</span>
                </div>
                <div className="text-sm text-slate-600 space-y-1">
                  <p>{t('buyer.requirements.offeredPrice')}: <strong className="text-green-700">₹{r.offered_price}</strong></p>
                  {r.message && <p className="text-xs text-slate-500 bg-white rounded-lg p-2 mt-1">{r.message}</p>}
                </div>
                <p className="text-xs text-slate-400 mt-2">
                  {r.created_at ? format(parseISO(r.created_at), "dd MMM yyyy, HH:mm") : ""}
                </p>
                <div className="flex gap-2 mt-3 pt-3 border-t border-slate-100">
                  <button
                    onClick={() => handleAcceptResponse(r.id)}
                    disabled={acceptingId === r.id}
                    className="btn btn-primary btn-sm flex-1"
                  >
                    {acceptingId === r.id ? t('common.loading') : <><CheckCircle size={13} /> Accept</>}
                  </button>
                  <button
                    onClick={() => handleChatWithFarmer(r.farmer_id)}
                    className="btn btn-secondary btn-sm"
                    title={t('chat.title')}
                  >
                    <MessageCircle size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="flex justify-end pt-4 border-t border-slate-100 mt-4">
          <button onClick={() => { setViewResponses(null); setResponses([]); }} className="btn btn-secondary">{t('common.close')}</button>
        </div>
      </Modal>

      <ConfirmModal
        open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete}
        title={t('common.delete')} description={t('buyer.requirements.deleteConfirm')}
        confirmLabel={t('common.delete')} confirmVariant="danger"
      />
    </div>
  );
}
