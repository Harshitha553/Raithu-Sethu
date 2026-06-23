import { CheckCircle2, CheckSquare } from "lucide-react";
import { useNotifications } from "../../context/NotificationContext";
import { useLanguage } from "../../context/LanguageContext";
import { format, parseISO, isToday, isYesterday } from "date-fns";
import EmptyState from "../../components/ui/EmptyState";
import { SkeletonCard } from "../../components/ui/Skeleton";

function formatNotifTime(iso) {
  if (!iso) return "";
  const d = parseISO(iso);
  if (isToday(d)) return "Today, " + format(d, "HH:mm");
  if (isYesterday(d)) return "Yesterday, " + format(d, "HH:mm");
  return format(d, "dd MMM yyyy, HH:mm");
}

export default function Notifications() {
  const { t } = useLanguage();
  const { notifications, loading, markRead, markAllRead, unreadCount } = useNotifications();

  return (
    <div className="page-enter max-w-4xl mx-auto space-y-6">
      <div className="page-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">{t('notifications.title')}</h1>
          <p className="page-subtitle">{t('notifications.title')}</p>
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllRead} className="btn btn-secondary btn-sm">
            <CheckSquare size={14} /> {t('notifications.markAllRead')}
          </button>
        )}
      </div>

      {loading && notifications.length === 0 ? (
        <div className="space-y-3">
          {[1,2,3,4].map(i => <div key={i} className="skeleton h-24 rounded-xl" />)}
        </div>
      ) : notifications.length === 0 ? (
        <div className="card">
          <EmptyState
            type="notifications"
            title={t('notifications.empty')}
            description={t('notifications.empty')}
          />
        </div>
      ) : (
        <div className="card overflow-hidden divide-y divide-slate-100">
          {notifications.map((notif, i) => (
            <div
              key={notif.id}
              className={`p-5 transition-colors animate-fade-in ${!notif.is_read ? 'bg-blue-50/30' : 'bg-white hover:bg-slate-50'}`}
              style={{ animationDelay: `${i * 40}ms` }}
            >
              <div className="flex gap-4">
                <div className="mt-1">
                  {!notif.is_read ? (
                    <div className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                  ) : (
                    <div className="w-2.5 h-2.5 bg-transparent border-2 border-slate-200 rounded-full" />
                  )}
                </div>
                <div className="flex-1">
                  <p className={`text-sm ${!notif.is_read ? 'font-semibold text-slate-900' : 'text-slate-700'}`}>
                    {notif.message}
                  </p>
                  <p className="text-xs text-slate-400 mt-1.5 flex items-center gap-2">
                    {formatNotifTime(notif.created_at)}
                    {!notif.is_read && (
                      <button
                        onClick={() => markRead(notif.id)}
                        className="text-blue-600 hover:text-blue-800 font-semibold transition-colors"
                      >
                        {t('notifications.markRead')}
                      </button>
                    )}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
