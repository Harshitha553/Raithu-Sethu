import { Sprout, SearchX, AlertTriangle, PackageOpen, MessageSquare, Bell } from "lucide-react";

const ICONS = {
  crops: Sprout,
  search: SearchX,
  error: AlertTriangle,
  requests: PackageOpen,
  messages: MessageSquare,
  notifications: Bell,
  default: PackageOpen,
};

export default function EmptyState({
  type = "default",
  title = "Nothing here yet",
  description = "Get started by adding something new.",
  action,
  actionLabel,
  icon: CustomIcon,
}) {
  const Icon = CustomIcon || ICONS[type] || ICONS.default;

  const iconColors = {
    crops:         "bg-green-50 text-green-500",
    search:        "bg-slate-100 text-slate-400",
    error:         "bg-red-50 text-red-400",
    requests:      "bg-blue-50 text-blue-400",
    messages:      "bg-purple-50 text-purple-400",
    notifications: "bg-amber-50 text-amber-400",
    default:       "bg-slate-100 text-slate-400",
  };

  const iconCls = iconColors[type] || iconColors.default;

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center animate-fade-in">
      <div className={`w-16 h-16 rounded-2xl ${iconCls} flex items-center justify-center mb-5 shadow-sm`}>
        <Icon size={28} />
      </div>
      <h3 className="text-base font-bold text-slate-800 mb-2">{title}</h3>
      <p className="text-sm text-slate-500 max-w-xs leading-relaxed mb-6">{description}</p>
      {action && (
        <button onClick={action} className="btn btn-primary btn-sm">
          {actionLabel || "Get Started"}
        </button>
      )}
    </div>
  );
}
