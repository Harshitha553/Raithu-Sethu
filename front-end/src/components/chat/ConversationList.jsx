import { MessageCircle } from "lucide-react";
import { initials, formatRelativeTime } from "../../utils/format";

export default function ConversationList({ conversations, activeId, onSelect, currentUserId }) {
  if (!conversations?.length) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <MessageCircle size={32} className="text-paddy-300" />
        <p className="mt-2 text-sm text-ink-soft">No conversations yet</p>
      </div>
    );
  }

  const otherParticipant = (conv) => {
    const otherId =
      conv.participant_one_id === currentUserId
        ? conv.participant_two_id
        : conv.participant_one_id;
    return {
      id: otherId,
      name: otherId === conv.participant_one_id ? conv.participant_one_name : conv.participant_two_name,
    };
  };

  return (
    <div className="divide-y divide-paddy-100">
      {conversations.map((conv) => {
        const other = otherParticipant(conv);
        const isActive = conv.id === activeId;
        return (
          <button
            key={conv.id}
            onClick={() => onSelect(conv)}
            className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors ${
              isActive ? "bg-paddy-50" : "hover:bg-paddy-50/50"
            }`}
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-paddy-200 text-xs font-bold text-paddy-800">
              {initials(other.name)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-ink truncate">{other.name || "Unknown"}</p>
              {conv.last_message && (
                <p className="mt-0.5 truncate text-xs text-ink-soft">{conv.last_message}</p>
              )}
            </div>
            {conv.updated_at && (
              <span className="shrink-0 text-[10px] text-ink-soft/60">
                {formatRelativeTime(conv.updated_at)}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
