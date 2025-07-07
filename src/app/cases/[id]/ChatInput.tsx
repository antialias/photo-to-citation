"use client";
import { useTranslation } from "react-i18next";
import { css, cx } from "styled-system/css";
import { token } from "styled-system/tokens";
import { useCaseChat } from "./CaseChatProvider";

export default function ChatInput() {
  const { input, setInput, send, loading, showJump, scrollToBottom, inputRef } =
    useCaseChat();
  const { t } = useTranslation();
  return (
    <div
      className="border-t p-2 flex flex-col gap-2"
      style={{ paddingBottom: "calc(env(safe-area-inset-bottom,0) + 0.5rem)" }}
    >
      {showJump ? (
        <button
          type="button"
          onClick={scrollToBottom}
          className="self-start text-blue-600 underline text-xs"
        >
          {t("jumpToLatest")}
        </button>
      ) : null}
      <div className="flex gap-2">
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
          className={cx(
            "flex-1 border rounded px-1 text-base",
            css({ bg: token("colors.surface-subtle") }),
          )}
          placeholder={t("askQuestion")}
        />
        <button
          type="button"
          onClick={send}
          disabled={loading}
          className="bg-blue-600 text-white px-2 rounded disabled:opacity-50"
        >
          {t("send")}
        </button>
      </div>
    </div>
  );
}
