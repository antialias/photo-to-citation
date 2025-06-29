"use client";
import type { CaseChatReply } from "@/lib/caseChat";
import { useRef } from "react";
import useViewportHeight from "../../useViewportHeight";
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
  const containerRef = useRef<HTMLDivElement>(null);
  useViewportHeight(containerRef, open && !expanded);
  return (
    <div
      className={`${
        expanded
          ? "relative h-full"
          : open
            ? "fixed inset-0 sm:bottom-4 sm:right-4 sm:inset-auto z-40"
            : "fixed bottom-4 right-4 z-40"
      } text-sm`}
    >
      {open ? (
        <div
          ref={containerRef}
          className={`bg-white dark:bg-gray-900 shadow-lg rounded flex flex-col ${
            expanded ? "w-full h-full" : "w-screen sm:w-80 sm:h-96"
          }`}
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
