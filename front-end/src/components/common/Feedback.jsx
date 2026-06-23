export function Badge({ tone = "paddy", children, className = "" }) {
  const TONES = {
    paddy: "bg-paddy-100 text-paddy-800",
    gold: "bg-gold-100 text-gold-700",
    terracotta: "bg-terracotta-100 text-terracotta-600",
    river: "bg-river-100 text-river-600",
    neutral: "bg-ink/5 text-ink-soft",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${TONES[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

export function Spinner({ className = "h-6 w-6" }) {
  return (
    <span
      className={`inline-block animate-spin rounded-full border-2 border-paddy-200 border-t-paddy-700 ${className}`}
    />
  );
}

export function EmptyState({ icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-paddy-200 bg-paddy-50/40 px-6 py-14 text-center">
      {icon && <div className="mb-3 text-paddy-400">{icon}</div>}
      <h3 className="font-display text-lg font-semibold text-ink">{title}</h3>
      {description && (
        <p className="mt-1.5 max-w-sm text-sm text-ink-soft">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function PageLoader() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <Spinner className="h-8 w-8" />
    </div>
  );
}
