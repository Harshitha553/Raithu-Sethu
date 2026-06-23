// Badge — status and category indicators
const VARIANTS = {
  active:    "badge-active",
  pending:   "badge-pending",
  accepted:  "badge-accepted",
  rejected:  "badge-rejected",
  sold:      "badge-sold",
  completed: "badge-completed",
  confirmed: "badge-confirmed",
  expired:   "badge-expired",
  flash:     "badge-flash",
  // Generic
  green:  "bg-green-100 text-green-700 border border-green-200",
  blue:   "bg-blue-100 text-blue-700 border border-blue-200",
  amber:  "bg-amber-100 text-amber-700 border border-amber-200",
  red:    "bg-red-100 text-red-700 border border-red-200",
  slate:  "bg-slate-100 text-slate-600 border border-slate-200",
  purple: "bg-purple-100 text-purple-700 border border-purple-200",
};

export default function Badge({ variant = "slate", children, className = "", dot = false }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap ${VARIANTS[variant] || VARIANTS.slate} ${className}`}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${variant === "active" ? "bg-green-500" : variant === "pending" ? "bg-amber-500" : variant === "rejected" ? "bg-red-500" : "bg-slate-400"} animate-pulse`} />}
      {children}
    </span>
  );
}

export function StatusBadge({ status }) {
  const map = {
    active:    { variant: "active",    label: "Active" },
    pending:   { variant: "pending",   label: "Pending" },
    accepted:  { variant: "accepted",  label: "Accepted" },
    rejected:  { variant: "rejected",  label: "Rejected" },
    sold:      { variant: "sold",      label: "Sold" },
    completed: { variant: "completed", label: "Completed" },
    confirmed: { variant: "confirmed", label: "Confirmed" },
    expired:   { variant: "expired",   label: "Expired" },
  };
  const cfg = map[status] || { variant: "slate", label: status || "Unknown" };
  return <Badge variant={cfg.variant} dot>{cfg.label}</Badge>;
}

export function CategoryBadge({ category }) {
  const map = {
    vegetables: "cat-vegetables",
    fruits:     "cat-fruits",
    grains:     "cat-grains",
    dairy:      "cat-dairy",
    spices:     "cat-spices",
  };
  const cls = map[category?.toLowerCase()] || "cat-default";
  return (
    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${cls}`}>
      {category || "Other"}
    </span>
  );
}
