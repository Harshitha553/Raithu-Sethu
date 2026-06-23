import { formatDateTime } from "../../utils/format";

export default function ChatBubble({ message, isOwn }) {
  return (
    <div className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
          isOwn
            ? "bg-paddy-800 text-cream rounded-br-sm"
            : "bg-paddy-100 text-ink rounded-bl-sm"
        }`}
      >
        <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
        <p
          className={`mt-1 text-right text-[10px] ${
            isOwn ? "text-cream/60" : "text-ink-soft/50"
          }`}
        >
          {formatDateTime(message.created_at)}
        </p>
      </div>
    </div>
  );
}
