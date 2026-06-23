import { Link } from "react-router-dom";
import { MapPin, Package, IndianRupee, Clock } from "lucide-react";
import { formatCurrency, formatRelativeTime } from "../../utils/format";
import { Badge } from "../common/Feedback";

export default function CropCard({ crop, farmerView = false }) {
  const statusColor =
    crop.status === "active" ? "paddy"
    : crop.status === "sold" ? "gold"
    : "neutral";

  return (
    <Link
      to={farmerView ? "#" : `/buyer/crop/${crop.id}`}
      className="group block rounded-xl border border-paddy-100 bg-white p-5 shadow-sm transition-all hover:shadow-md hover:border-paddy-200"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-display text-lg font-semibold text-ink truncate group-hover:text-paddy-700">
            {crop.name}
          </h3>
          {crop.category && (
            <p className="mt-0.5 text-xs font-medium text-ink-soft/60 uppercase tracking-wider">
              {crop.category}
            </p>
          )}
        </div>
        <Badge tone={statusColor}>
          {crop.status || "active"}
        </Badge>
      </div>

      <div className="mt-3 space-y-1.5">
        <div className="flex items-center gap-1.5 text-sm text-ink-soft">
          <IndianRupee size={14} />
          <span className="font-semibold text-ink">{formatCurrency(crop.price_per_unit)}</span>
          <span className="text-ink-soft/60">/ {crop.unit}</span>
        </div>
        <div className="flex items-center gap-1.5 text-sm text-ink-soft">
          <Package size={14} />
          <span>{crop.quantity} {crop.unit}</span>
        </div>
        {crop.location && (
          <div className="flex items-center gap-1.5 text-sm text-ink-soft">
            <MapPin size={14} />
            <span>{crop.location}</span>
          </div>
        )}
      </div>

      <div className="mt-3 flex items-center gap-1 text-xs text-ink-soft/60">
        <Clock size={12} />
        <span>{formatRelativeTime(crop.created_at)}</span>
      </div>
    </Link>
  );
}
