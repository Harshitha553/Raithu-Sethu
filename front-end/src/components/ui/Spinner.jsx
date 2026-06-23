// Spinner — smooth animated loader
export default function Spinner({ size = "md", className = "" }) {
  const sizes = { sm: "w-4 h-4 border-2", md: "w-8 h-8 border-3", lg: "w-12 h-12 border-4" };
  return (
    <div
      className={`${sizes[size] || sizes.md} border-slate-200 border-t-green-500 rounded-full ${className}`}
      style={{ animation: "spin 0.7s linear infinite" }}
      role="status"
      aria-label="Loading"
    />
  );
}

export function PageSpinner() {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4 animate-fade-in">
      <div className="w-12 h-12 border-4 border-slate-200 border-t-green-500 rounded-full"
        style={{ animation: "spin 0.7s linear infinite" }} />
      <p className="text-slate-500 text-sm">Loading...</p>
    </div>
  );
}

export function InlineSpinner({ className = "" }) {
  return (
    <span
      className={`inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full ${className}`}
      style={{ animation: "spin 0.7s linear infinite" }}
    />
  );
}
