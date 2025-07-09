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
      className={cx(
        css({ fontSize: "sm" }),
        expanded
          ? css({ position: "relative", h: "full" })
          : open
            ? cx(
                "z-chat",
                css({
                  position: "fixed",
                  inset: 0,
                  sm: { bottom: "4", right: "4", inset: "auto" },
                }),
              )
            : cx("z-chat", css({ position: "fixed", bottom: "4", right: "4" })),
      )}
      style={
        open && !expanded
          ? ({ "--case-chat-offset": "1rem" } as React.CSSProperties)
          : undefined
      }
    >
      {open ? (
        <div
          className={css({
            bg: token("colors.surface"),
            shadow: "md",
            rounded: "md",
            display: "flex",
            flexDirection: "column",
            w: expanded ? "full" : "100vw",
            h: expanded ? "full" : undefined,
            sm: expanded
              ? { w: "full", h: "full" }
              : { w: "80", maxH: "400px" },
          })}
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
          className={css({
            bg: "blue.600",
            color: "white",
            px: "3",
            py: "1",
            borderRadius: "md",
            shadow: "md",
          })}
        >
          Chat
        </button>
      )}
    </div>
  );
}
