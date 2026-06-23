const VARIANTS = {
  primary:
    "bg-paddy-800 text-cream hover:bg-paddy-700 active:bg-paddy-900 disabled:bg-paddy-200",
  gold:
    "bg-gold-400 text-ink hover:bg-gold-300 active:bg-gold-500 disabled:bg-gold-100 disabled:text-ink-soft/50",
  outline:
    "border-2 border-paddy-800 text-paddy-800 hover:bg-paddy-50 active:bg-paddy-100 disabled:border-paddy-200 disabled:text-paddy-300",
  ghost:
    "text-paddy-800 hover:bg-paddy-50 active:bg-paddy-100 disabled:text-paddy-300",
  danger:
    "bg-terracotta-400 text-cream hover:bg-terracotta-500 active:bg-terracotta-600 disabled:bg-terracotta-100",
};

const SIZES = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2.5 text-[0.95rem]",
  lg: "px-6 py-3.5 text-base",
};

export default function Button({
  variant = "primary",
  size = "md",
  className = "",
  loading = false,
  children,
  disabled,
  ...rest
}) {
  return (
    <button
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-semibold tracking-[-0.01em] transition-colors duration-150 disabled:cursor-not-allowed ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...rest}
    >
      {loading && (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      )}
      {children}
    </button>
  );
}
