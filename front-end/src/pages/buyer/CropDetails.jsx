import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { buyerApi } from "../../api/buyer";
import { chatApi } from "../../api/resources";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { extractErrorMessage, formatCurrency, formatDateTime, formatRelativeTime } from "../../utils/format";
import Button from "../../components/common/Button";
import { PageLoader, Badge } from "../../components/common/Feedback";
import { Field, Input, TextArea } from "../../components/common/Field";
import { MapPin, Package, IndianRupee, Calendar, MessageCircle, ShoppingCart, ArrowLeft, User } from "lucide-react";

export default function CropDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const toast = useToast();
  const [crop, setCrop] = useState(null);
  const [loading, setLoading] = useState(true);
  const [requestForm, setRequestForm] = useState({ quantity: "", message: "", proposed_price: "" });
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await buyerApi.getCropDetails(id);
        setCrop(res.data);
      } catch {
        toast.error("Failed to load crop details.");
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id]);

  const handleRequest = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      navigate("/login?role=buyer");
      return;
    }
    setSubmitting(true);
    try {
      await buyerApi.requestCrop({
        crop_id: id,
        quantity: Number(requestForm.quantity),
        message: requestForm.message || undefined,
        proposed_price: requestForm.proposed_price ? Number(requestForm.proposed_price) : undefined,
      });
      toast.success("Purchase request sent to the farmer!");
      setShowForm(false);
      setRequestForm({ quantity: "", message: "", proposed_price: "" });
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleChat = async () => {
    if (!isAuthenticated) { navigate("/login?role=buyer"); return; }
    try {
      const res = await chatApi.createConversation(crop.farmer_id);
      navigate("/chat", { state: { conversation: res.data } });
    } catch {
      toast.error("Failed to start conversation.");
    }
  };

  if (loading) return <PageLoader />;
  if (!crop) return <p className="text-center text-ink-soft">Crop not found.</p>;

  return (
    <div className="max-w-3xl">
      <button
        onClick={() => navigate(-1)}
        className="mb-4 flex items-center gap-1.5 text-sm font-semibold text-ink-soft hover:text-paddy-700"
      >
        <ArrowLeft size={16} /> Back
      </button>

      <div className="rounded-2xl border border-paddy-100 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-semibold text-ink">{crop.name}</h1>
            {crop.category && (
              <p className="mt-0.5 text-xs font-medium text-ink-soft/60 uppercase tracking-wider">{crop.category}</p>
            )}
          </div>
          <Badge tone={crop.status === "active" ? "paddy" : "neutral"}>{crop.status}</Badge>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-lg bg-paddy-50 p-3 text-center">
            <IndianRupee size={18} className="mx-auto text-paddy-600" />
            <p className="mt-1 text-lg font-bold text-ink">{formatCurrency(crop.price_per_unit)}</p>
            <p className="text-xs text-ink-soft">per {crop.unit}</p>
          </div>
          <div className="rounded-lg bg-paddy-50 p-3 text-center">
            <Package size={18} className="mx-auto text-paddy-600" />
            <p className="mt-1 text-lg font-bold text-ink">{crop.quantity}</p>
            <p className="text-xs text-ink-soft">{crop.unit} available</p>
          </div>
          <div className="rounded-lg bg-paddy-50 p-3 text-center">
            <MapPin size={18} className="mx-auto text-paddy-600" />
            <p className="mt-1 text-lg font-bold text-ink truncate">{crop.location || "—"}</p>
            <p className="text-xs text-ink-soft">Location</p>
          </div>
          <div className="rounded-lg bg-paddy-50 p-3 text-center">
            <Calendar size={18} className="mx-auto text-paddy-600" />
            <p className="mt-1 text-lg font-bold text-ink text-sm">{crop.harvest_date ? formatDateTime(crop.harvest_date) : "—"}</p>
            <p className="text-xs text-ink-soft">Harvested</p>
          </div>
        </div>

        {crop.description && (
          <div className="mt-6">
            <h3 className="text-sm font-semibold text-ink-soft">Description</h3>
            <p className="mt-1 text-sm text-ink">{crop.description}</p>
          </div>
        )}

        <div className="mt-6 flex items-center gap-2 text-xs text-ink-soft/60">
          <User size={12} />
          <span>Listed by Farmer {formatRelativeTime(crop.created_at)}</span>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Button
            variant="primary"
            onClick={() => {
              if (!isAuthenticated) { navigate("/login?role=buyer"); return; }
              setShowForm(!showForm);
            }}
          >
            <ShoppingCart size={16} /> Request to Buy
          </Button>
          <Button variant="outline" onClick={handleChat}>
            <MessageCircle size={16} /> Chat with Farmer
          </Button>
        </div>

        {showForm && (
          <form onSubmit={handleRequest} className="mt-6 rounded-xl border border-paddy-100 bg-paddy-50 p-5">
            <h3 className="font-semibold text-ink mb-4">Send Purchase Request</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Quantity (kg)" required>
                  <Input
                    type="number"
                    min="0"
                    step="any"
                    value={requestForm.quantity}
                    onChange={(e) => setRequestForm({ ...requestForm, quantity: e.target.value })}
                    required
                  />
                </Field>
                <Field label="Proposed Price (₹)" hint="Optional">
                  <Input
                    type="number"
                    min="0"
                    step="any"
                    value={requestForm.proposed_price}
                    onChange={(e) => setRequestForm({ ...requestForm, proposed_price: e.target.value })}
                  />
                </Field>
              </div>
              <Field label="Message" hint="Optional note to the farmer">
                <TextArea
                  rows={2}
                  value={requestForm.message}
                  onChange={(e) => setRequestForm({ ...requestForm, message: e.target.value })}
                  placeholder="I'd like to purchase this crop..."
                />
              </Field>
              <div className="flex gap-3">
                <Button type="submit" variant="primary" loading={submitting}>
                  Send Request
                </Button>
                <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
