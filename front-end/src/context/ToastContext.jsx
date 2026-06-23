import { createContext, useCallback, useContext, useRef, useState } from "react";
import { CheckCircle2, XCircle, Info, X, AlertTriangle } from "lucide-react";

const ToastContext = createContext(null);

const TOAST_STYLES = {
  success: {
    icon: CheckCircle2,
    iconClass: "text-green-500",
    borderClass: "border-l-green-500",
    bgClass: "bg-white",
  },
  error: {
    icon: XCircle,
    iconClass: "text-red-500",
    borderClass: "border-l-red-500",
    bgClass: "bg-white",
  },
  info: {
    icon: Info,
    iconClass: "text-blue-500",
    borderClass: "border-l-blue-500",
    bgClass: "bg-white",
  },
  warning: {
    icon: AlertTriangle,
    iconClass: "text-amber-500",
    borderClass: "border-l-amber-500",
    bgClass: "bg-white",
  },
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (message, type = "info") => {
      const id = ++idRef.current;
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(() => dismiss(id), 4500);
    },
    [dismiss]
  );

  const toast = {
    success: (msg) => push(msg, "success"),
    error: (msg) => push(msg, "error"),
    info: (msg) => push(msg, "info"),
    warning: (msg) => push(msg, "warning"),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="pointer-events-none fixed bottom-5 right-5 z-[200] flex flex-col gap-3 max-w-sm w-full">
        {toasts.map((t) => {
          const style = TOAST_STYLES[t.type] || TOAST_STYLES.info;
          const Icon = style.icon;
          return (
            <div
              key={t.id}
              role="status"
              aria-live="polite"
              className={`pointer-events-auto flex items-start gap-3 rounded-xl border border-slate-200 border-l-4 ${style.borderClass} ${style.bgClass} px-4 py-3 shadow-lg`}
              style={{ animation: "toast-in 0.3s cubic-bezier(0.16, 1, 0.3, 1) both" }}
            >
              <Icon size={18} className={`mt-0.5 shrink-0 ${style.iconClass}`} />
              <p className="flex-1 text-sm leading-snug text-slate-700 font-medium">{t.message}</p>
              <button
                onClick={() => dismiss(t.id)}
                className="shrink-0 text-slate-400 hover:text-slate-600 transition-colors mt-0.5"
                aria-label="Dismiss"
              >
                <X size={15} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
