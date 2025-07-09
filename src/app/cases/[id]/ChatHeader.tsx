"use client";
import { useTranslation } from "react-i18next";
import { FaCompressArrowsAlt, FaExpandArrowsAlt } from "react-icons/fa";
import { css } from "styled-system/css";
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
    <div
      className={css({
        display: "flex",
        alignItems: "center",
        borderBottomWidth: "1px",
        p: "2",
        gap: "2",
      })}
    >
      <span className={css({ fontWeight: "semibold", flex: "none" })}>
        {t("caseChat")}
      </span>
      <select
        aria-label={t("chatHistory")}
        value={sessionId ?? ""}
        onChange={(e) => selectSession(e.target.value)}
        className={css({
          color: "black",
          fontSize: "xs",
          flex: "auto",
          minW: 0,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        })}
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
        className={css({
          fontSize: "xl",
          lineHeight: "none",
          flex: "none",
          display: { base: "none", sm: "block" },
        })}
      >
        {expanded ? <FaCompressArrowsAlt /> : <FaExpandArrowsAlt />}
      </button>
      <button
        type="button"
        onClick={handleClose}
        aria-label={t("closeChat")}
        className={css({ fontSize: "xl", lineHeight: "none", flex: "none" })}
      >
        ×
      </button>
    </div>
  );
}
