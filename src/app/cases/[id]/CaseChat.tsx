"use client";
import { apiFetch } from "@/apiClient";
import ThumbnailImage from "@/components/thumbnail-image";
import { caseActions } from "@/lib/caseActions";
import type { CaseChatAction, CaseChatReply } from "@/lib/caseChat";
import { getThumbnailUrl } from "@/lib/clientThumbnails";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import styles from "./CaseChat.module.css";

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
}: {
  caseId: string;
  onChat?: (messages: Message[]) => Promise<CaseChatReply>;
}) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [history, setHistory] = useState<ChatSession[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionCreatedAt, setSessionCreatedAt] = useState<string>("");
  const [sessionSummary, setSessionSummary] = useState<string>("");
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const [photoMap, setPhotoMap] = useState<Record<string, string>>({});

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
    const data = (await res.json()) as { photos?: string[] };
    const map: Record<string, string> = {};
    for (const url of data.photos ?? []) {
      map[baseName(url)] = url;
    }
    setPhotoMap(map);
  }

  async function seed() {
    setLoading(true);
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      let reply: CaseChatReply | null = null;
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
          const data = (await res.json()) as { reply: CaseChatReply };
          reply = data.reply;
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
    void seed();
  }

  function handleClose() {
    setOpen(false);
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
              onClick={() => router.push(act.href(caseId))}
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
        reply = await onChat(list);
      } else {
        const res = await apiFetch(`/api/cases/${caseId}/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: list }),
          signal: controller.signal,
        });
        if (res.ok) {
          const data = (await res.json()) as { reply: CaseChatReply };
          reply = data.reply;
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
    <div className="fixed bottom-4 right-4 z-40 text-sm">
      {open ? (
        <div className="bg-white dark:bg-gray-900 shadow-lg rounded w-80 h-96 flex flex-col">
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
                <span
                  className={`${styles.bubble} ${
                    m.role === "user" ? styles.user : styles.assistant
                  }`}
                >
                  {renderContent(m)}
                </span>
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
          </div>
          <div className="border-t p-2 flex gap-2">
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
