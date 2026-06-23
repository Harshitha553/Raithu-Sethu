import { useEffect, useRef } from "react";
import ChatBubble from "./ChatBubble";
import MessageInput from "./MessageInput";
import { useAuth } from "../../context/AuthContext";
import { initials } from "../../utils/format";
import { ArrowLeft, MessageCircle } from "lucide-react";

export default function ChatWindow({
  conversation,
  messages,
  onSend,
  onBack,
  loading,
}) {
  const { user } = useAuth();
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (!conversation) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="text-center">
          <MessageCircle size={40} className="mx-auto text-paddy-300" />
          <p className="mt-3 text-sm text-ink-soft">Select a conversation to start chatting</p>
        </div>
      </div>
    );
  }

  const otherName =
    conversation.participant_one_id === user?.id
      ? conversation.participant_two_name
      : conversation.participant_one_name;

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex items-center gap-3 border-b border-paddy-100 px-4 py-3">
        {onBack && (
          <button onClick={onBack} className="lg:hidden text-ink-soft" aria-label="Back">
            <ArrowLeft size={20} />
          </button>
        )}
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-paddy-200 text-xs font-bold text-paddy-800">
          {initials(otherName)}
        </div>
        <p className="text-sm font-semibold text-ink truncate">{otherName || "Unknown"}</p>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4 scrollbar-thin">
        {loading ? (
          <p className="text-center text-sm text-ink-soft">Loading messages...</p>
        ) : messages?.length === 0 ? (
          <p className="text-center text-sm text-ink-soft">No messages yet. Say hello!</p>
        ) : (
          messages?.map((msg) => (
            <ChatBubble key={msg.id} message={msg} isOwn={msg.sender_id === user?.id} />
          ))
        )}
        <div ref={bottomRef} />
      </div>

      <MessageInput onSend={onSend} disabled={loading} />
    </div>
  );
}
