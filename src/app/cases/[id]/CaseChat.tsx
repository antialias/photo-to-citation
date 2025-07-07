"use client";
import type { CaseChatReply } from "@/lib/caseChat";
import { css, cx } from "styled-system/css";
import { token } from "styled-system/tokens";
import useVisualViewportHeight from "../../hooks/useVisualViewportHeight";
import {
  CaseChatProvider,
  type ChatResponse,
  type Message,
  useCaseChat,
} from "./CaseChatProvider";
import ChatHeader from "./ChatHeader";
import ChatInput from "./ChatInput";
import ChatMessages from "./ChatMessages";

export default function CaseChat(props: {
  caseId: string;
  onChat?: (
    messages: Message[],
  ) => Promise<
    CaseChatReply | { reply: string; system?: string } | ChatResponse | string
  >;
  expanded?: boolean;
  onExpandChange?: (value: boolean) => void;
}) {
  const { caseId } = props;
  return (
    <CaseChatProvider {...props}>
      <CaseChatInner caseId={caseId} />
    </CaseChatProvider>
  );
}

function CaseChatInner({ caseId }: { caseId: string }) {
  const { open, expanded, handleOpen } = useCaseChat();
  useVisualViewportHeight(open);
  return (
    <div
      className={`${
        expanded
          ? "relative h-full"
          : open
            ? "fixed inset-0 sm:bottom-4 sm:right-4 sm:inset-auto z-chat sm:[--case-chat-offset:1rem]"
            : "fixed bottom-4 right-4 z-chat"
      } text-sm`}
    >
      {open ? (
        <div
          className={cx(
            css({ bg: token("colors.surface"), shadow: "md", rounded: "md" }),
            `flex flex-col${expanded ? " w-full h-full" : " w-screen sm:w-80 sm:max-h-[400px]"}`,
          )}
          style={
            expanded
              ? undefined
              : {
                  height:
                    "calc(var(--visual-viewport-height) - var(--case-chat-offset,0px))",
                  marginTop: "var(--case-chat-offset,0px)",
                }
          }
        >
          <ChatHeader />
          <ChatMessages caseId={caseId} />
          <ChatInput />
        </div>
      ) : (
        <button
          type="button"
          onClick={handleOpen}
          className="bg-blue-600 text-white px-3 py-1 rounded shadow"
        >
          Chat
        </button>
      )}
    </div>
  );
}
