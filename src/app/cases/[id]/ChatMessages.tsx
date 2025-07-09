"use client";
import DebugWrapper from "@/app/components/DebugWrapper";
import { useTranslation } from "react-i18next";
import { css, cx } from "styled-system/css";
import styles from "./CaseChat.module.css";
import { useCaseChat } from "./CaseChatProvider";
import TakePhotoWidget from "./camera/TakePhotoWidget";
import DraftPreview from "./draft/DraftPreview";

export default function ChatMessages({ caseId }: { caseId: string }) {
  const {
    messages,
    loading,
    draftLoading,
    draftData,
    cameraOpen,
    chatError,
    renderActions,
    renderContent,
    scrollRef,
    setDraftData,
    setCameraOpen,
    draftAnchorId,
    setDraftAnchorId,
    cameraAnchorId,
    setCameraAnchorId,
    systemPrompt,
    availableActions,
    unavailableActions,
  } = useCaseChat();
  const { t } = useTranslation();
  return (
    <DebugWrapper
      data={{
        system: systemPrompt,
        available: availableActions,
        unavailable: unavailableActions,
      }}
      className={css({
        display: "flex",
        flexDirection: "column",
        flex: "1",
        minH: 0,
      })}
    >
      <div
        ref={scrollRef}
        data-testid="chat-scroll"
        className={css({
          flex: "1",
          overflowY: "auto",
          p: "2",
          display: "flex",
          flexDirection: "column",
          gap: "2",
        })}
      >
        {messages.map((m) => (
          <div
            key={m.id}
            className={css({
              display: "flex",
              flexDirection: "column",
              alignItems: m.role === "user" ? "flex-end" : "flex-start",
            })}
          >
            <span
              className={`${styles.bubble} ${m.role === "user" ? styles.user : styles.assistant}`}
            >
              {renderContent(m)}
            </span>
            {m.role === "assistant" &&
              m.actions &&
              m.actions.length > 0 &&
              renderActions(m.actions, m.id)}
            {draftData && draftAnchorId === m.id && (
              <DraftPreview
                caseId={caseId}
                data={draftData}
                onClose={() => {
                  setDraftData(null);
                  setDraftAnchorId(null);
                }}
              />
            )}
            {cameraOpen && cameraAnchorId === m.id && (
              <TakePhotoWidget
                caseId={caseId}
                onClose={() => {
                  setCameraOpen(false);
                  setCameraAnchorId(null);
                }}
              />
            )}
          </div>
        ))}
        {loading && (
          <div className={css({ textAlign: "left" })} key="typing">
            <span
              className={`${styles.bubble} ${styles.assistant} ${styles.typing}`}
            />
          </div>
        )}
        {draftLoading && (
          <div className={css({ textAlign: "left" })} key="draft-loading">
            <span className={css({ fontSize: "sm" })}>
              {t("draftingEmail")}
            </span>
          </div>
        )}
        {chatError && (
          <div className={css({ textAlign: "left" })} key="chat-error">
            <span className={`${styles.bubble} ${styles.error}`}>
              {chatError}
            </span>
          </div>
        )}
      </div>
    </DebugWrapper>
  );
}
