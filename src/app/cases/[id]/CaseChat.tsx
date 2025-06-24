"use client";
import { apiFetch } from "@/apiClient";
import DebugWrapper from "@/app/components/DebugWrapper";
import ThumbnailImage from "@/components/thumbnail-image";
import { caseActions } from "@/lib/caseActions";
import type { CaseChatAction, CaseChatReply } from "@/lib/caseChat";
import type { EmailDraft } from "@/lib/caseReport";
import { getThumbnailUrl } from "@/lib/clientThumbnails";
import type { ReportModule } from "@/lib/reportModules";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { FaCompressArrowsAlt, FaExpandArrowsAlt } from "react-icons/fa";
import { useNotify } from "../../components/NotificationProvider";
import styles from "./CaseChat.module.css";
import TakePhotoWidget from "./camera/TakePhotoWidget";
import DraftPreview from "./draft/DraftPreview";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  actions?: CaseChatAction[];
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
  onChat?: (
    messages: Message[],
  ) => Promise<CaseChatReply | { reply: string; system?: string }>;
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
  const [systemPrompt, setSystemPrompt] = useState<string>("");
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [showJump, setShowJump] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const [photoMap, setPhotoMap] = useState<Record<string, string>>({});
  const [draftData, setDraftData] = useState<{
    email: EmailDraft;
    attachments: string[];
    module: ReportModule;
  } | null>(null);
  const [draftLoading, setDraftLoading] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
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
    setSystemPrompt("");
  }

  function baseName(filePath: string): string {
    const parts = filePath.split(/[\\/]/);
    return parts[parts.length - 1];
  }

  async function loadPhotos() {
    const res = await apiFetch(`/api/cases/${caseId}`);
    if (!res.ok) return;
    const data = (await res.json()) as { photos?: string[] };
    const map: Record<string, string> = {};
    for (const url of data.photos ?? []) {
      map[baseName(url)] = url;
    }
    setPhotoMap(map);
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

  function openCamera() {
    setCameraOpen(true);
  }

  async function seed() {
    setLoading(true);
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      let reply: CaseChatReply | null = null;
      if (onChat) {
        const result = await onChat([]);
        if (typeof result === "string") {
          reply = result;
        } else {
          reply = result.reply;
          if (result.system) setSystemPrompt(result.system);
        }
      } else {
        const res = await apiFetch(`/api/cases/${caseId}/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: [] }),
          signal: controller.signal,
        });
        if (res.ok) {
          const data = (await res.json()) as {
            reply: CaseChatReply;
            system: string;
          };
          reply = data.reply;
          setSystemPrompt(data.system);
        }
      }
      if (!controller.signal.aborted && reply && !reply.noop) {
        setMessages([
          {
            id: crypto.randomUUID(),
            role: "assistant",
            content: reply.response,
            actions: reply.actions,
          },
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
    setCameraOpen(false);
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

  function renderActions(actions: CaseChatAction[]) {
    const buttons = actions.map((a, idx) => {
      if ("id" in a) {
        const act = caseActions.find((c) => c.id === a.id);
        if (act) {
          return (
            <button
              key={`${a.id}-${idx}`}
              type="button"
              onClick={() => {
                if (act.id === "compose") {
                  void openDraft();
                } else if (act.id === "take-photo") {
                  openCamera();
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
      } else if ("field" in a && "value" in a) {
        const labelMap: Record<string, string> = {
          vin: `Set VIN to "${a.value}"`,
          plate: `Set Plate to "${a.value}"`,
          state: `Set State to "${a.value}"`,
          note: `Add Note: "${a.value}"`,
        };
        const label = labelMap[a.field] ?? `Apply ${a.field}`;
        return (
          <button
            key={`edit-${a.field}-${a.value}`}
            type="button"
            onClick={() => void handleEdit(a.field, a.value)}
            className="bg-green-700 text-white px-2 py-1 rounded mx-1"
          >
            {label}
          </button>
        );
      } else if ("photo" in a && "note" in a) {
        const url = photoMap[a.photo];
        if (url) {
          return (
            <button
              key={`photo-${a.photo}-${a.note}`}
              type="button"
              onClick={() => void handlePhotoNote(a.photo, a.note)}
              className="bg-green-700 text-white px-1 py-1 rounded mx-1 flex items-center gap-1"
            >
              <ThumbnailImage
                src={getThumbnailUrl(url, 64)}
                alt={a.photo}
                width={32}
                height={24}
              />
              <span>{`Add "${a.note}"`}</span>
            </button>
          );
        }
      }
      return null;
    });
    return <div className="mt-1 flex flex-wrap gap-1">{buttons}</div>;
  }

  function renderContent(m: Message) {
    return <span>{m.content}</span>;
  }

  async function request(list: Message[]) {
    setLoading(true);
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      let reply: CaseChatReply | null = null;
      if (onChat) {
        const result = await onChat(list);
        if (typeof result === "string") {
          reply = result;
        } else {
          reply = result.reply;
          if (result.system) setSystemPrompt(result.system);
        }
      } else {
        const res = await apiFetch(`/api/cases/${caseId}/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: list }),
          signal: controller.signal,
        });
        if (res.ok) {
          const data = (await res.json()) as {
            reply: CaseChatReply;
            system: string;
          };
          reply = data.reply;
          setSystemPrompt(data.system);
        }
      }
      if (!controller.signal.aborted && reply) {
        if (!reply.noop) {
          setMessages([
            ...list,
            {
              id: crypto.randomUUID(),
              role: "assistant",
              content: reply.response,
              actions: reply.actions,
            },
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
      updateShowJump();
    }
  }

  const updateShowJump = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const threshold = 10;
    const atBottom =
      el.scrollHeight - el.scrollTop - el.clientHeight <= threshold;
    const canScroll = el.scrollHeight - el.clientHeight > threshold;
    setShowJump(canScroll && !atBottom);
  }, []);

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
      updateShowJump();
    }
  }, [messages, updateShowJump]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    updateShowJump();
    const handler = () => updateShowJump();
    el.addEventListener("scroll", handler);
    return () => {
      el.removeEventListener("scroll", handler);
    };
  }, [updateShowJump]);

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
                <DebugWrapper data={systemPrompt}>
                  <span
                    className={`${styles.bubble} ${
                      m.role === "user" ? styles.user : styles.assistant
                    }`}
                  >
                    {renderContent(m)}
                  </span>
                </DebugWrapper>
                {m.role === "assistant" &&
                  m.actions &&
                  m.actions.length > 0 &&
                  renderActions(m.actions)}
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
            {cameraOpen && (
              <div className="text-left" key="camera-widget">
                <TakePhotoWidget
                  caseId={caseId}
                  onClose={() => setCameraOpen(false)}
                />
              </div>
            )}
          </div>
          <div className="border-t p-2 flex flex-col gap-2">
            {showJump ? (
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
