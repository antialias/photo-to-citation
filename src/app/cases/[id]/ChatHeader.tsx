"use client";
import useIsMobile from "@/lib/useIsMobile";
import { FaCompressArrowsAlt, FaExpandArrowsAlt } from "react-icons/fa";
import { useCaseChat } from "./CaseChatProvider";

export default function ChatHeader() {
  const {
    expanded,
    toggleExpanded,
    handleClose,
    history,
    sessionId,
    sessionCreatedAt,
    sessionSummary,
    selectSession,
  } = useCaseChat();
  const isMobile = useIsMobile();
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
      {!isMobile && (
        <button
          type="button"
          onClick={toggleExpanded}
          aria-label={expanded ? "Collapse chat" : "Expand chat"}
          className="text-xl leading-none flex-none"
        >
          {expanded ? <FaCompressArrowsAlt /> : <FaExpandArrowsAlt />}
        </button>
      )}
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
