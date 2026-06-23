import { InlineSpinner } from "./Spinner";

// Main Button component
export default function Button({
  children,
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  icon: Icon,
  iconRight,
  className = "",
  type = "button",
  onClick,
  ...props
}) {
  const variantCls = {
    primary:   "btn-primary",
    secondary: "btn-secondary",
    danger:    "btn-danger",
    amber:     "btn-amber",
    ghost:     "btn-ghost",
  }[variant] || "btn-primary";

  const sizeCls = {
    xs: "btn-sm text-xs px-2.5 py-1",
    sm: "btn-sm",
    md: "",
    lg: "btn-lg",
    xl: "btn-xl",
    icon: "btn-icon",
  }[size] || "";

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`btn ${variantCls} ${sizeCls} ${className}`}
      {...props}
    >
      {loading ? (
        <>
          <InlineSpinner />
          <span>Loading...</span>
        </>
      ) : (
        <>
          {Icon && !iconRight && <Icon size={size === "sm" || size === "xs" ? 14 : 16} />}
          {children}
          {Icon && iconRight && <Icon size={size === "sm" || size === "xs" ? 14 : 16} />}
        </>
      )}
    </button>
  );
}

export function IconButton({ icon: Icon, label, onClick, className = "", size = "md", variant = "ghost" }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      className={`btn btn-icon ${variant === "ghost" ? "btn-ghost" : `btn-${variant}`} ${size === "sm" ? "w-7 h-7" : "w-9 h-9"} ${className}`}
    >
      <Icon size={size === "sm" ? 14 : 16} />
    </button>
  );
}
