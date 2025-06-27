"use client";
import { useCaseChat } from "./CaseChatProvider";

export default function ChatHeader() {
  const {
    handleClose,
    history,
    sessionId,
    sessionCreatedAt,
    sessionSummary,
    selectSession,
  } = useCaseChat();
  return (
    <div className="flex items-center border-b p-2 gap-2">
      <span className="font-semibold flex-none">Case Chat</span>
      <select
        aria-label="Chat history"
        value={sessionId ?? ""}
        onChange={(e) => selectSession(e.target.value)}
        className="text-black dark:text-black text-xs flex-auto min-w-0 truncate"
      >
        <option value="new">New Chat</option>
        {!history.some((h) => h.id === sessionId) && sessionId && (
          <option value={sessionId}>
            {new Date(sessionCreatedAt).toLocaleString()}
            {sessionSummary ? ` - ${sessionSummary}` : ""}
          </option>
        )}
        {history.map((h) => (
          <option key={h.id} value={h.id}>
            {new Date(h.createdAt).toLocaleString()} - {h.summary}
          </option>
        ))}
      </select>
      <button
        type="button"
        onClick={handleClose}
        aria-label="Close chat"
        className="text-xl leading-none flex-none"
      >
        ×
      </button>
    </div>
  );
}
