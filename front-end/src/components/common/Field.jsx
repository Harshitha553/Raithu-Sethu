export function Field({ label, error, hint, children, required }) {
  return (
    <label className="block">
      {label && (
        <span className="mb-1.5 block text-sm font-semibold text-ink-soft">
          {label}
          {required && <span className="text-terracotta-400"> *</span>}
        </span>
      )}
      {children}
      {hint && !error && <span className="mt-1 block text-xs text-ink-soft/70">{hint}</span>}
      {error && <span className="mt-1 block text-xs font-medium text-terracotta-500">{error}</span>}
    </label>
  );
}

export function Input({ className = "", error, ...rest }) {
  return (
    <input
      className={`w-full rounded-lg border bg-white px-3.5 py-2.5 text-[0.95rem] text-ink placeholder:text-ink-soft/40 transition-colors focus:border-river-400 focus:outline-none focus:ring-2 focus:ring-river-100 ${
        error ? "border-terracotta-400" : "border-paddy-200"
      } ${className}`}
      {...rest}
    />
  );
}

export function TextArea({ className = "", error, ...rest }) {
  return (
    <textarea
      className={`w-full rounded-lg border bg-white px-3.5 py-2.5 text-[0.95rem] text-ink placeholder:text-ink-soft/40 transition-colors focus:border-river-400 focus:outline-none focus:ring-2 focus:ring-river-100 ${
        error ? "border-terracotta-400" : "border-paddy-200"
      } ${className}`}
      {...rest}
    />
  );
}

export function Select({ className = "", error, children, ...rest }) {
  return (
    <select
      className={`w-full rounded-lg border bg-white px-3.5 py-2.5 text-[0.95rem] text-ink transition-colors focus:border-river-400 focus:outline-none focus:ring-2 focus:ring-river-100 ${
        error ? "border-terracotta-400" : "border-paddy-200"
      } ${className}`}
      {...rest}
    >
      {children}
    </select>
  );
}
