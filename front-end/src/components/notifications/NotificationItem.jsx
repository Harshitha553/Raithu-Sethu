import { formatRelativeTime } from "../../utils/format";
import { Badge } from "../common/Feedback";
import { Bell, ShoppingBag, Sprout, Calendar } from "lucide-react";

const TYPE_ICONS = {
  crop_request: ShoppingBag,
  booking: Calendar,
  flash_sale: Sprout,
  requirement_match: Sprout,
  system: Bell,
};

const TYPE_TONES = {
  crop_request: "terracotta",
  booking: "river",
  flash_sale: "gold",
  requirement_match: "paddy",
  system: "neutral",
};

export default function NotificationItem({ notification, onMarkRead }) {
  const Icon = TYPE_ICONS[notification.type] || Bell;
  const tone = TYPE_TONES[notification.type] || "neutral";

  return (
    <div
      className={`flex items-start gap-3 rounded-xl border px-4 py-3.5 transition-colors ${
        notification.is_read
          ? "border-paddy-100 bg-white"
          : "border-paddy-200 bg-paddy-50"
      }`}
    >
      <div className={`mt-0.5 rounded-lg p-2 ${
        notification.is_read ? "bg-paddy-100" : "bg-paddy-200"
      }`}>
        <Icon size={16} className="text-paddy-700" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-ink">{notification.title}</p>
          <Badge tone={tone}>{notification.type?.replace("_", " ")}</Badge>
        </div>
        <p className="mt-0.5 text-sm text-ink-soft">{notification.message}</p>
        <p className="mt-1 text-[11px] text-ink-soft/50">
          {formatRelativeTime(notification.created_at)}
        </p>
      </div>
      {!notification.is_read && (
        <button
          onClick={() => onMarkRead(notification.id)}
          className="shrink-0 rounded-lg px-2.5 py-1 text-xs font-semibold text-river-500 hover:bg-river-50"
        >
          Mark read
        </button>
      )}
    </div>
  );
}
