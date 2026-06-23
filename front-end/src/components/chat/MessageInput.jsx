import { useState } from "react";
import { Send } from "lucide-react";

export default function MessageInput({ onSend, disabled }) {
  const [text, setText] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!text.trim() || disabled) return;
    onSend(text.trim());
    setText("");
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2 border-t border-paddy-100 bg-white px-4 py-3">
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Type a message..."
        disabled={disabled}
        className="flex-1 rounded-lg border border-paddy-200 bg-cream px-3.5 py-2 text-sm text-ink placeholder:text-ink-soft/40 focus:border-river-400 focus:outline-none focus:ring-2 focus:ring-river-100 disabled:opacity-50"
      />
      <button
        type="submit"
        disabled={!text.trim() || disabled}
        className="flex h-9 w-9 items-center justify-center rounded-lg bg-paddy-800 text-cream transition-colors hover:bg-paddy-700 disabled:bg-paddy-200"
        aria-label="Send"
      >
        <Send size={16} />
      </button>
    </form>
  );
}
