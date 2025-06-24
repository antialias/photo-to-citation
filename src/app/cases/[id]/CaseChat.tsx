"use client";
import { apiFetch } from "@/apiClient";
import { caseActions } from "@/lib/caseActions";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export default function CaseChat({
  caseId,
  onChat,
}: {
  caseId: string;
  onChat?: (messages: Message[]) => Promise<string>;
}) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  function renderContent(text: string) {
    const parts = text.split(/(\[action:[^\]]+\])/g);
    return parts.map((p, idx) => {
      const match = p.match(/^\[action:([^\]]+)\]$/);
      if (match) {
        const act = caseActions.find((a) => a.id === match[1]);
        if (act) {
          return (
            <button
              key={`${act.id}-${idx}`}
              type="button"
              onClick={() => router.push(act.href(caseId))}
              className="bg-blue-600 text-white px-2 py-1 rounded mx-1"
            >
              {act.label}
            </button>
          );
        }
      }
      return <span key={`text-${idx}-${p}`}>{p}</span>;
    });
  }

  async function send() {
    const text = input.trim();
    if (!text) return;
    const list = [
      ...messages,
      { id: crypto.randomUUID(), role: "user", content: text },
    ];
    setMessages(list);
    setInput("");
    setLoading(true);
    try {
      let reply = "";
      if (onChat) {
        reply = await onChat(list);
      } else {
        const res = await apiFetch(`/api/cases/${caseId}/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: list }),
        });
        if (res.ok) {
          const data = (await res.json()) as { reply: string };
          reply = data.reply;
        }
      }
      if (reply) {
        setMessages([
          ...list,
          { id: crypto.randomUUID(), role: "assistant", content: reply },
        ]);
      }
    } finally {
      setLoading(false);
    }
  }

  // biome-ignore lint/correctness/useExhaustiveDependencies: scroll when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="fixed bottom-4 right-4 z-40 text-sm">
      {open ? (
        <div className="bg-white dark:bg-gray-900 shadow-lg rounded w-80 h-96 flex flex-col">
          <div className="flex justify-between items-center border-b p-2">
            <span className="font-semibold">Case Chat</span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close chat"
              className="text-xl leading-none"
            >
              ×
            </button>
          </div>
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-2 space-y-2">
            {messages.map((m) => (
              <div
                key={m.id}
                className={m.role === "user" ? "text-right" : "text-left"}
              >
                <span className="inline-block px-2 py-1 rounded bg-gray-200 dark:bg-gray-700">
                  {renderContent(m.content)}
                </span>
              </div>
            ))}
          </div>
          <div className="border-t p-2 flex gap-2">
            <input
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
          <div className="border-t p-2 flex gap-2 justify-end">
            {caseActions.map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => router.push(a.href(caseId))}
                className="bg-blue-600 text-white px-2 py-1 rounded"
              >
                {a.label}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="bg-blue-600 text-white px-3 py-1 rounded shadow"
        >
          Chat
        </button>
      )}
    </div>
  );
}
