"use client";
import { apiFetch } from "@/apiClient";
import DebugWrapper from "@/app/components/DebugWrapper";
import ThumbnailImage from "@/components/thumbnail-image";
import { caseActions } from "@/lib/caseActions";
import { buildCaseChatPrompt } from "@/lib/caseChatPrompt";
import type { EmailDraft } from "@/lib/caseReport";
import { getThumbnailUrl } from "@/lib/clientThumbnails";
import type { ReportModule } from "@/lib/reportModules";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { FaCompressArrowsAlt, FaExpandArrowsAlt } from "react-icons/fa";
import { useNotify } from "../../components/NotificationProvider";
import styles from "./CaseChat.module.css";
import DraftPreview from "./draft/DraftPreview";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface ChatSession {
  id: string;
  createdAt: string;
  summary: string;
  messages: Message[];
}

export default function CaseChat({
  caseId,
  onChat,
  expanded: controlledExpanded,
  onExpandChange,
}: {
  caseId: string;
  onChat?: (messages: Message[]) => Promise<string>;
  expanded?: boolean;
  onExpandChange?: (value: boolean) => void;
}) {
  const [open, setOpen] = useState(false);
  const [expandedState, setExpandedState] = useState(false);
  const expanded = controlledExpanded ?? expandedState;
  const [messages, setMessages] = useState<Message[]>([]);
  const [history, setHistory] = useState<ChatSession[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionCreatedAt, setSessionCreatedAt] = useState<string>("");
  const [sessionSummary, setSessionSummary] = useState<string>("");
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [inputFocused, setInputFocused] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const [photoMap, setPhotoMap] = useState<Record<string, string>>({});
  const [draftData, setDraftData] = useState<{
    email: EmailDraft;
    attachments: string[];
    module: ReportModule;
  } | null>(null);
  const [draftLoading, setDraftLoading] = useState(false);
  const [systemPrompt, setSystemPrompt] = useState("");
  const notify = useNotify();

  const storageKey = `case-chat-${caseId}`;

  function loadHistory() {
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return [];
      return JSON.parse(raw) as ChatSession[];
    } catch {
      return [];
    }
  }

  function saveHistory(list: ChatSession[]) {
    localStorage.setItem(storageKey, JSON.stringify(list));
  }

  // biome-ignore lint/correctness/useExhaustiveDependencies: storageKey is stable
  useEffect(() => {
    setHistory(loadHistory());
  }, [storageKey]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: caseId is stable
  useEffect(() => {
    void loadPhotos();
  }, [caseId]);

  function startNew() {
    setMessages([]);
    setSessionId(crypto.randomUUID());
    setSessionCreatedAt(new Date().toISOString());
    setSessionSummary("");
  }

  function baseName(filePath: string): string {
    const parts = filePath.split(/[\\/]/);
    return parts[parts.length - 1];
  }

  async function loadPhotos() {
    const res = await apiFetch(`/api/cases/${caseId}`);
    if (!res.ok) return;
    const data = (await res.json()) as import("@/lib/caseStore").Case;
    const map: Record<string, string> = {};
    for (const url of data.photos ?? []) {
      map[baseName(url)] = url;
    }
    setPhotoMap(map);
    setSystemPrompt(buildCaseChatPrompt(data));
  }

  async function openDraft() {
    setDraftLoading(true);
    setDraftData(null);
    const res = await apiFetch(`/api/cases/${caseId}/report`);
    if (res.ok) {
      const data = (await res.json()) as {
        email: EmailDraft;
        attachments: string[];
        module: ReportModule;
      };
      setDraftData(data);
    } else {
      const err = await res.json().catch(() => ({}));
      notify(err.error || "Failed to draft report");
    }
    setDraftLoading(false);
  }

  async function seed() {
    setLoading(true);
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      let reply = "";
      if (onChat) {
        reply = await onChat([]);
      } else {
        const res = await apiFetch(`/api/cases/${caseId}/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: [] }),
          signal: controller.signal,
        });
        if (res.ok) {
          const data = (await res.json()) as { reply: string };
          reply = data.reply;
        }
      }
      if (!controller.signal.aborted && reply && reply !== "[noop]") {
        setMessages([
          { id: crypto.randomUUID(), role: "assistant", content: reply },
        ]);
      }
    } catch {}
    if (!controller.signal.aborted) {
      setLoading(false);
    }
  }

  function handleOpen() {
    startNew();
    setOpen(true);
    if (controlledExpanded === undefined) {
      setExpandedState(false);
    } else {
      onExpandChange?.(false);
    }
    void seed();
  }

  function handleClose() {
    setOpen(false);
    setDraftData(null);
    setDraftLoading(false);
    if (controlledExpanded === undefined) {
      setExpandedState(false);
    } else {
      onExpandChange?.(false);
    }
    if (messages.length > 0 && sessionId) {
      const firstUser = messages.find((m) => m.role === "user");
      const summary =
        sessionSummary || (firstUser ? firstUser.content.slice(0, 30) : "");
      const session: ChatSession = {
        id: sessionId,
        createdAt: sessionCreatedAt,
        summary,
        messages,
      };
      const list = [...history, session];
      setHistory(list);
      saveHistory(list);
    }
  }

  function toggleExpanded() {
    const next = !expanded;
    if (controlledExpanded === undefined) {
      setExpandedState(next);
    }
    onExpandChange?.(next);
  }
  const router = useRouter();

  async function handleEdit(field: string, value: string) {
    switch (field) {
      case "vin":
        await apiFetch(`/api/cases/${caseId}/vin`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ vin: value }),
        });
        router.refresh();
        break;
      case "plate":
        await apiFetch(`/api/cases/${caseId}/override`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            vehicle: { licensePlateNumber: value },
          }),
        });
        router.refresh();
        break;
      case "state":
        await apiFetch(`/api/cases/${caseId}/override`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            vehicle: { licensePlateState: value },
          }),
        });
        router.refresh();
        break;
      case "note":
        {
          const res = await apiFetch(`/api/cases/${caseId}`);
          const data = res.ok
            ? ((await res.json()) as { note?: string | null })
            : { note: null };
          const note = data.note ? `${data.note}\n${value}` : value;
          await apiFetch(`/api/cases/${caseId}/note`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ note }),
          });
          router.refresh();
        }
        break;
      default:
        break;
    }
  }

  async function handlePhotoNote(name: string, value: string) {
    const url = photoMap[name];
    if (!url) return;
    const res = await apiFetch(`/api/cases/${caseId}`);
    const data = res.ok
      ? ((await res.json()) as { photoNotes?: Record<string, string | null> })
      : { photoNotes: undefined };
    const current = data.photoNotes?.[url] ?? null;
    const note = current ? `${current}\n${value}` : value;
    await apiFetch(`/api/cases/${caseId}/photo-note`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ photo: url, note }),
    });
    router.refresh();
  }

  function renderContent(text: string) {
    const parts = text.split(
      /(\[action:[^\]]+\]|\[edit:[^\]]+\]|\[photo-note:[^\]]+\])/g,
    );
    return parts.map((p, idx) => {
      const actionMatch = p.match(/^\[action:([^\]]+)\]$/);
      if (actionMatch) {
        const act = caseActions.find((a) => a.id === actionMatch[1]);
        if (act) {
          return (
            <button
              key={`${act.id}-${idx}`}
              type="button"
              onClick={() => {
                if (act.id === "compose") {
                  void openDraft();
                } else {
                  router.push(act.href(caseId));
                }
              }}
              className="bg-blue-600 text-white px-2 py-1 rounded mx-1"
            >
              {act.label}
            </button>
          );
        }
      }
      const editMatch = p.match(/^\[edit:([^=]+)=([^\]]+)\]$/);
      if (editMatch) {
        const field = editMatch[1];
        const value = editMatch[2];
        const labelMap: Record<string, string> = {
          vin: `Set VIN to "${value}"`,
          plate: `Set Plate to "${value}"`,
          state: `Set State to "${value}"`,
          note: `Add Note: "${value}"`,
        };
        const label = labelMap[field] ?? `Apply ${field}`;
        return (
          <button
            key={`edit-${field}-${value}`}
            type="button"
            onClick={() => void handleEdit(field, value)}
            className="bg-green-700 text-white px-2 py-1 rounded mx-1"
          >
            {label}
          </button>
        );
      }
      const photoMatch = p.match(/^\[photo-note:([^=]+)=([^\]]+)\]$/);
      if (photoMatch) {
        const name = photoMatch[1];
        const value = photoMatch[2];
        const url = photoMap[name];
        if (url) {
          return (
            <button
              key={`photo-${name}-${value}`}
              type="button"
              onClick={() => void handlePhotoNote(name, value)}
              className="bg-green-700 text-white px-1 py-1 rounded mx-1 flex items-center gap-1"
            >
              <ThumbnailImage
                src={getThumbnailUrl(url, 64)}
                alt={name}
                width={32}
                height={24}
              />
              <span>{`Add "${value}"`}</span>
            </button>
          );
        }
      }
      return <span key={`text-${idx}-${p}`}>{p}</span>;
    });
  }

  async function request(list: Message[]) {
    setLoading(true);
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      let reply = "";
      if (onChat) {
        reply = await onChat(list);
      } else {
        const res = await apiFetch(`/api/cases/${caseId}/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: list }),
          signal: controller.signal,
        });
        if (res.ok) {
          const data = (await res.json()) as { reply: string };
          reply = data.reply;
        }
      }
      if (!controller.signal.aborted && reply) {
        if (reply !== "[noop]") {
          setMessages([
            ...list,
            { id: crypto.randomUUID(), role: "assistant", content: reply },
          ]);
        } else {
          setMessages(list);
        }
      }
    } catch {}
    if (!controller.signal.aborted) {
      setLoading(false);
    }
  }

  function scrollToBottom() {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }

  async function send() {
    const text = input.trim();
    if (!text) return;
    const list = [
      ...messages,
      { id: crypto.randomUUID(), role: "user" as const, content: text },
    ];
    if (messages.length === 0) {
      setSessionSummary(text.slice(0, 30));
    }
    setMessages(list);
    setInput("");
    await request(list);
  }

  // biome-ignore lint/correctness/useExhaustiveDependencies: scroll when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (open && inputRef.current) inputRef.current.focus();
  }, [open]);

  return (
    <div
      className={`${
        expanded ? "relative h-full" : "fixed bottom-4 right-4 z-40"
      } text-sm`}
    >
      {open ? (
        <div
          className={`bg-white dark:bg-gray-900 shadow-lg rounded flex flex-col ${
            expanded ? "w-full h-full" : "w-80 h-96"
          }`}
        >
          <div className="flex items-center border-b p-2 gap-2">
            <span className="font-semibold flex-none">Case Chat</span>
            <select
              aria-label="Chat history"
              value={sessionId ?? ""}
              onChange={(e) => {
                const val = e.target.value;
                if (val === "new") {
                  startNew();
                } else {
                  const found = history.find((h) => h.id === val);
                  if (found) {
                    setMessages(found.messages);
                    setSessionId(found.id);
                    setSessionCreatedAt(found.createdAt);
                    setSessionSummary(found.summary);
                  }
                }
              }}
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
            <button
              type="button"
              onClick={toggleExpanded}
              aria-label={expanded ? "Collapse chat" : "Expand chat"}
              className="text-xl leading-none flex-none"
            >
              {expanded ? <FaCompressArrowsAlt /> : <FaExpandArrowsAlt />}
            </button>
            <button
              type="button"
              onClick={handleClose}
              aria-label="Close chat"
              className="text-xl leading-none flex-none"
            >
              ×
            </button>
          </div>
          <DebugWrapper data={{ systemPrompt }}>
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-2 space-y-2"
            >
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={m.role === "user" ? "text-right" : "text-left"}
                >
                  <span
                    className={`${styles.bubble} ${
                      m.role === "user" ? styles.user : styles.assistant
                    }`}
                  >
                    {renderContent(m.content)}
                  </span>
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
              {draftData && (
                <div className="text-left" key="draft-preview">
                  <DraftPreview
                    caseId={caseId}
                    data={draftData}
                    onClose={() => setDraftData(null)}
                  />
                </div>
              )}
            </div>
          </DebugWrapper>
          <div className="border-t p-2 flex flex-col gap-2">
            {inputFocused ? (
              <button
                type="button"
                onClick={scrollToBottom}
                className="self-start text-blue-600 underline text-xs"
              >
                Jump to latest
              </button>
            ) : null}
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onFocus={() => setInputFocused(true)}
                onBlur={() => setInputFocused(false)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void send();
                  }
                }}
                className="flex-1 border rounded px-1 dark:bg-gray-800"
                placeholder="Ask a question..."
              />
              <button
                type="button"
                onClick={send}
                disabled={loading}
                className="bg-blue-600 text-white px-2 rounded disabled:opacity-50"
              >
                Send
              </button>
            </div>
          </div>
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
