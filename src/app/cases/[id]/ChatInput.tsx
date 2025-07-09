"use client";
import { useTranslation } from "react-i18next";
import { css } from "styled-system/css";
import { token } from "styled-system/tokens";
import { useCaseChat } from "./CaseChatProvider";

export default function ChatInput() {
  const { input, setInput, send, loading, showJump, scrollToBottom, inputRef } =
    useCaseChat();
  const { t } = useTranslation();
  return (
    <div
      className={css({
        borderTopWidth: "1px",
        p: "2",
        display: "flex",
        flexDirection: "column",
        gap: "2",
      })}
      style={{ paddingBottom: "calc(env(safe-area-inset-bottom,0) + 0.5rem)" }}
    >
      {showJump ? (
        <button
          type="button"
          onClick={scrollToBottom}
          className={css({
            alignSelf: "flex-start",
            color: "blue.600",
            textDecoration: "underline",
            fontSize: "xs",
          })}
        >
          {t("jumpToLatest")}
        </button>
      ) : null}
      <div className={css({ display: "flex", gap: "2" })}>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void send();
            }
          }}
          className={css({
            flex: "1",
            borderWidth: "1px",
            borderRadius: "md",
            px: "1",
            fontSize: "base",
            bg: token("colors.surface-subtle"),
          })}
          placeholder={t("askQuestion")}
        />
        <button
          type="button"
          onClick={send}
          disabled={loading}
          className={css({
            bg: "blue.600",
            color: "white",
            px: "2",
            borderRadius: "md",
            _disabled: { opacity: 0.5 },
          })}
        >
          {t("send")}
        </button>
      </div>
    </div>
  );
}
