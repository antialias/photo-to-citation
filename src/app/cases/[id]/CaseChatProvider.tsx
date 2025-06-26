"use client";
import { apiFetch } from "@/apiClient";
import ThumbnailImage from "@/components/thumbnail-image";
import { caseActions } from "@/lib/caseActions";
import type { CaseChatAction, CaseChatReply } from "@/lib/caseChat";
import type { EmailDraft } from "@/lib/caseReport";
import { getThumbnailUrl } from "@/lib/clientThumbnails";
import type { ReportModule } from "@/lib/reportModules";
import { useRouter } from "next/navigation";
import {
  type ReactElement,
  type ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useNotify } from "../../components/NotificationProvider";

export interface Message {
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

export interface ChatResponse {
  reply: CaseChatReply;
  system?: string;
  available?: string[];
  unavailable?: string[];
}

interface ChatState {
  open: boolean;
  expanded: boolean;
  session?: ChatSession;
}

export interface CaseChatContextValue {
  open: boolean;
  expanded: boolean;
  messages: Message[];
  history: ChatSession[];
  input: string;
  loading: boolean;
  draftLoading: boolean;
  cameraOpen: boolean;
  chatError: string | null;
  photoMap: Record<string, string>;
  sessionId: string | null;
  sessionCreatedAt: string;
  sessionSummary: string;
  systemPrompt: string;
  availableActions: string[];
  unavailableActions: string[];
  showJump: boolean;
  scrollRef: React.RefObject<HTMLDivElement | null>;
  inputRef: React.RefObject<HTMLInputElement | null>;
  handleOpen: () => void;
  handleClose: () => void;
  toggleExpanded: () => void;
  send: () => Promise<void>;
  scrollToBottom: () => void;
  renderActions: (actions: CaseChatAction[]) => ReactElement;
  renderContent: (m: Message) => ReactElement;
  expandedState: boolean;
  setInput: (val: string) => void;
  openDraft: () => Promise<void>;
  draftData: {
    email: EmailDraft;
    attachments: string[];
    module: ReportModule;
  } | null;
  setDraftData: (
    val: {
      email: EmailDraft;
      attachments: string[];
      module: ReportModule;
    } | null,
  ) => void;
  setCameraOpen: (v: boolean) => void;
  selectSession: (id: string | "new") => void;
}

const CaseChatContext = createContext<CaseChatContextValue | null>(null);

export function useCaseChat() {
  const ctx = useContext(CaseChatContext);
  if (!ctx) throw new Error("CaseChatContext missing");
  return ctx;
}

export function CaseChatProvider({
  caseId,
  onChat,
  expanded: controlledExpanded,
  onExpandChange,
  children,
}: {
  caseId: string;
  onChat?: (
    messages: Message[],
  ) => Promise<
    CaseChatReply | { reply: string; system?: string } | ChatResponse | string
  >;
  expanded?: boolean;
  onExpandChange?: (value: boolean) => void;
  children: ReactNode;
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
  const [availableActions, setAvailableActions] = useState<string[]>([]);
  const [unavailableActions, setUnavailableActions] = useState<string[]>([]);
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
  const [chatError, setChatError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [open]);

  const storageKey = `case-chat-${caseId}`;
  const stateKey = `case-chat-state-${caseId}`;

  const loadHistory = useCallback(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return [];
      return JSON.parse(raw) as ChatSession[];
    } catch {
      return [];
    }
  }, [storageKey]);

  const saveHistory = useCallback(
    (list: ChatSession[]) => {
      localStorage.setItem(storageKey, JSON.stringify(list));
    },
    [storageKey],
  );

  const loadState = useCallback((): ChatState | null => {
    try {
      const raw = localStorage.getItem(stateKey);
      if (!raw) return null;
      return JSON.parse(raw) as ChatState;
    } catch {
      return null;
    }
  }, [stateKey]);

  const saveState = useCallback(
    (state: ChatState) => {
      localStorage.setItem(stateKey, JSON.stringify(state));
    },
    [stateKey],
  );

  useEffect(() => {
    setHistory(loadHistory());
  }, [loadHistory]);

  const loadPhotos = useCallback(async () => {
    const res = await apiFetch(`/api/cases/${caseId}`);
    if (!res.ok) return;
    const data = (await res.json()) as { photos?: string[] };
    const map: Record<string, string> = {};
    for (const url of data.photos ?? []) {
      const parts = url.split(/[\\/]/);
      map[parts[parts.length - 1]] = url;
    }
    setPhotoMap(map);
  }, [caseId]);

  useEffect(() => {
    void loadPhotos();
  }, [loadPhotos]);

  useEffect(() => {
    const state = loadState();
    if (!state) return;
    if (state.open) setOpen(true);
    if (controlledExpanded === undefined && state.expanded)
      setExpandedState(state.expanded);
    if (state.session) {
      setMessages(state.session.messages);
      setSessionId(state.session.id);
      setSessionCreatedAt(state.session.createdAt);
      setSessionSummary(state.session.summary);
    }
  }, [controlledExpanded, loadState]);

  function startNew() {
    setMessages([]);
    setSessionId(crypto.randomUUID());
    setSessionCreatedAt(new Date().toISOString());
    setSessionSummary("");
    setSystemPrompt("");
    setAvailableActions([]);
    setUnavailableActions([]);
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
          if (result.startsWith("[action:") && result.endsWith("]")) {
            reply = {
              response: "",
              actions: [{ id: result.slice(8, -1) }],
              noop: false,
            };
          } else if (result === "[noop]") {
            reply = { response: "", actions: [], noop: true };
          } else {
            reply = { response: result, actions: [], noop: false };
          }
        } else if ("response" in result) {
          reply = result as CaseChatReply;
        } else if ("reply" in result) {
          const r = result as ChatResponse;
          reply = r.reply;
          if (r.system) setSystemPrompt(r.system);
          if (r.available) setAvailableActions(r.available);
          if (r.unavailable) setUnavailableActions(r.unavailable);
        } else {
          reply = result;
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
            available?: string[];
            unavailable?: string[];
          };
          reply = data.reply;
          setSystemPrompt(data.system);
          setAvailableActions(data.available ?? []);
          setUnavailableActions(data.unavailable ?? []);
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

  const saveCurrentSession = useCallback(() => {
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
      const list = [...history.filter((h) => h.id !== sessionId), session];
      setHistory(list);
      saveHistory(list);
    }
  }, [
    messages,
    sessionId,
    sessionCreatedAt,
    sessionSummary,
    history,
    saveHistory,
  ]);

  function selectSession(val: string | "new") {
    saveCurrentSession();
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
    saveCurrentSession();
    localStorage.removeItem(stateKey);
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
          if (result.startsWith("[action:") && result.endsWith("]")) {
            reply = {
              response: "",
              actions: [{ id: result.slice(8, -1) }],
              noop: false,
            };
          } else if (result === "[noop]") {
            reply = { response: "", actions: [], noop: true };
          } else {
            reply = { response: result, actions: [], noop: false };
          }
        } else if ("response" in result) {
          reply = result as CaseChatReply;
        } else if ("reply" in result) {
          const r = result as ChatResponse;
          reply = r.reply;
          if (r.system) setSystemPrompt(r.system);
          if (r.available) setAvailableActions(r.available);
          if (r.unavailable) setUnavailableActions(r.unavailable);
        } else {
          reply = result;
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
            available?: string[];
            unavailable?: string[];
          };
          reply = data.reply;
          setSystemPrompt(data.system);
          setAvailableActions(data.available ?? []);
          setUnavailableActions(data.unavailable ?? []);
          setChatError(null);
        } else {
          const err = await res.json().catch(() => ({}));
          if (res.status === 503) {
            setChatError(
              err.error || "Case Chat server is unavailable. Please try again.",
            );
          } else {
            setChatError(
              err.error ||
                "Case Chat response was invalid. Please try again later.",
            );
          }
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
    } catch {
      if (!controller.signal.aborted) {
        setChatError(
          "Case Chat server is unreachable. Please try again later.",
        );
      }
    }
    if (!controller.signal.aborted) {
      setLoading(false);
    }
  }

  function scrollToBottom() {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      setShowJump(false);
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

  // biome-ignore lint/correctness/useExhaustiveDependencies: update on open, messages, or size changes
  useEffect(() => {
    if (!scrollRef.current) return;
    const current = scrollRef.current;
    function update() {
      const canScroll = current.scrollHeight > current.clientHeight + 1;
      const atBottom =
        current.scrollTop + current.clientHeight >= current.scrollHeight - 1;
      setShowJump(canScroll && !atBottom);
    }
    update();
    current.addEventListener("scroll", update);
    window.addEventListener("resize", update);
    const observer = new ResizeObserver(update);
    observer.observe(current);
    return () => {
      current.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      observer.disconnect();
    };
  }, [open, messages, expanded]);

  useEffect(() => {
    if (open && inputRef.current) inputRef.current.focus();
  }, [open]);

  useEffect(() => {
    const handler = () => saveCurrentSession();
    window.addEventListener("beforeunload", handler);
    return () => {
      window.removeEventListener("beforeunload", handler);
      saveCurrentSession();
    };
  }, [saveCurrentSession]);

  useEffect(() => {
    if (open) saveCurrentSession();
  }, [open, saveCurrentSession]);

  useEffect(() => {
    const state: ChatState = {
      open,
      expanded,
      session:
        sessionId && sessionCreatedAt
          ? {
              id: sessionId,
              createdAt: sessionCreatedAt,
              summary: sessionSummary,
              messages,
            }
          : undefined,
    };
    saveState(state);
  }, [
    open,
    expanded,
    messages,
    sessionId,
    sessionCreatedAt,
    sessionSummary,
    saveState,
  ]);

  return (
    <CaseChatContext.Provider
      value={{
        open,
        expanded,
        expandedState,
        messages,
        history,
        input,
        loading,
        draftLoading,
        cameraOpen,
        chatError,
        photoMap,
        sessionId,
        sessionCreatedAt,
        sessionSummary,
        systemPrompt,
        availableActions,
        unavailableActions,
        showJump,
        scrollRef,
        inputRef,
        handleOpen,
        handleClose,
        toggleExpanded,
        send,
        scrollToBottom,
        renderActions,
        renderContent,
        setInput,
        openDraft,
        draftData,
        setDraftData,
        setCameraOpen,
        selectSession,
      }}
    >
      {children}
    </CaseChatContext.Provider>
  );
}
