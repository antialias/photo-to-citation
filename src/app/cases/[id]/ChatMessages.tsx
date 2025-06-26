"use client";
import DebugWrapper from "@/app/components/DebugWrapper";
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
  return (
    <DebugWrapper
      data={{
        system: systemPrompt,
        available: availableActions,
        unavailable: unavailableActions,
      }}
      className="flex flex-col flex-1 min-h-0"
    >
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-2 space-y-2">
        {messages.map((m) => (
          <div
            key={m.id}
            className={
              m.role === "user"
                ? "flex flex-col items-end"
                : "flex flex-col items-start"
            }
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
          <div className="text-left" key="typing">
            <span
              className={`${styles.bubble} ${styles.assistant} ${styles.typing}`}
            />
          </div>
        )}
        {draftLoading && (
          <div className="text-left" key="draft-loading">
            <span className="text-sm">
              Drafting email based on case information...
            </span>
          </div>
        )}
        {chatError && (
          <div className="text-left" key="chat-error">
            <span className={`${styles.bubble} ${styles.error}`}>
              {chatError}
            </span>
          </div>
        )}
      </div>
    </DebugWrapper>
  );
}
