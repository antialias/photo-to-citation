"use client";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();
  return (
    <div className="flex items-center border-b p-2 gap-2">
      <span className="font-semibold flex-none">{t("caseChat")}</span>
      <select
        aria-label={t("chatHistory")}
        value={sessionId ?? ""}
        onChange={(e) => selectSession(e.target.value)}
        className="text-black dark:text-black text-xs flex-auto min-w-0 truncate"
      >
        <option value="new">{t("newChat")}</option>
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
        onClick={toggleExpanded}
        aria-label={expanded ? t("collapseChat") : t("expandChat")}
        className="text-xl leading-none flex-none"
      >
        {expanded ? <FaCompressArrowsAlt /> : <FaExpandArrowsAlt />}
      </button>
      <button
        type="button"
        onClick={handleClose}
        aria-label={t("closeChat")}
        className="text-xl leading-none flex-none"
      >
        ×
      </button>
    </div>
  );
}
