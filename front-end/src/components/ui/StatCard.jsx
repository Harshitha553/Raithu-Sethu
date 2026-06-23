import { TrendingUp, TrendingDown, Minus } from "lucide-react";

export default function StatCard({
  title,
  value,
  icon: Icon,
  iconBg = "bg-green-50",
  iconColor = "text-green-600",
  trend,
  trendLabel,
  prefix = "",
  suffix = "",
  delay = 0,
  onClick,
}) {
  const trendPositive = trend > 0;
  const trendNeutral = trend === 0 || trend == null;

  return (
    <div
      className={`stat-card ${onClick ? "card-interactive cursor-pointer" : ""}`}
      style={{ animationDelay: `${delay}ms` }}
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-4">
        <p className="text-sm font-medium text-slate-500 leading-tight">{title}</p>
        {Icon && (
          <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center flex-shrink-0`}>
            <Icon size={18} className={iconColor} />
          </div>
        )}
      </div>

      <p className="text-3xl font-bold text-slate-900 leading-none mb-3">
        {prefix}
        <span className="tabular-nums">{typeof value === "number" ? value.toLocaleString() : (value ?? "—")}</span>
        {suffix && <span className="text-lg font-semibold text-slate-500 ml-1">{suffix}</span>}
      </p>

      {trendLabel && (
        <div className="flex items-center gap-1.5 text-xs font-medium">
          {trendNeutral ? (
            <Minus size={12} className="text-slate-400" />
          ) : trendPositive ? (
            <TrendingUp size={12} className="text-green-500" />
          ) : (
            <TrendingDown size={12} className="text-red-500" />
          )}
          <span className={trendNeutral ? "text-slate-400" : trendPositive ? "text-green-600" : "text-red-600"}>
            {trend != null && !trendNeutral ? `${trendPositive ? "+" : ""}${trend}%` : ""} {trendLabel}
          </span>
        </div>
      )}
    </div>
  );
}

export function MiniStat({ label, value, prefix = "" }) {
  return (
    <div className="text-center p-3">
      <p className="text-2xl font-bold text-slate-900">{prefix}{typeof value === "number" ? value.toLocaleString() : value}</p>
      <p className="text-xs text-slate-500 mt-0.5">{label}</p>
    </div>
  );
}
