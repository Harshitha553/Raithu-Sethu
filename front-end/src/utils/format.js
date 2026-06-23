// Backend file routes (e.g. crop images, voice messages) return paths like
// "/uploads/crops/xyz.jpg". In local dev these resolve fine via the Vite
// proxy, but once the frontend and backend are deployed to different
// domains (Vercel + Render), a bare "/uploads/..." path resolves against
// the frontend's own origin and 404s. This prefixes such paths with the
// backend's origin when VITE_API_URL is set, and leaves absolute URLs
// (e.g. https://...) and local dev paths untouched.
export function resolveMediaUrl(path) {
  if (!path) return path;
  if (/^https?:\/\//i.test(path)) return path;
  const base = import.meta.env.VITE_API_URL || "";
  return path.startsWith("/") ? `${base}${path}` : `${base}/${path}`;
}

export function formatCurrency(value) {
  const n = Number(value);
  if (Number.isNaN(n)) return "₹0";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: n % 1 === 0 ? 0 : 2,
  }).format(n);
}

export function formatDate(value, opts = {}) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    ...opts,
  });
}

export function formatDateTime(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatRelativeTime(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  const diffSec = Math.round((d.getTime() - Date.now()) / 1000);
  const abs = Math.abs(diffSec);

  const units = [
    ["year", 31536000],
    ["month", 2592000],
    ["day", 86400],
    ["hour", 3600],
    ["minute", 60],
  ];

  for (const [unit, secs] of units) {
    if (abs >= secs) {
      const val = Math.round(diffSec / secs);
      return new Intl.RelativeTimeFormat("en", { numeric: "auto" }).format(val, unit);
    }
  }
  return "just now";
}

export function extractErrorMessage(error, fallback = "Something went wrong. Please try again.") {
  const detail = error?.response?.data?.detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail) && detail[0]?.msg) return detail[0].msg;
  if (error?.message === "Network Error") return "Can't reach the server. Check your connection.";
  return fallback;
}

export function initials(name = "") {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
}

export const CROP_CATEGORIES = [
  "Grains & Cereals",
  "Pulses & Lentils",
  "Vegetables",
  "Fruits",
  "Spices",
  "Oilseeds",
  "Flowers",
  "Other",
];

export const CROP_UNITS = ["kg", "quintal", "tonne", "dozen", "bag"];