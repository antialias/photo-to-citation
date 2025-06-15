"use client";
import type { EmailDraft } from "@/lib/caseReport";
import type { Case } from "@/lib/caseStore";
import type { ReportModule } from "@/lib/reportModules";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function DraftEditor({
  initialDraft,
  attachments,
  module,
  caseId,
  action = "report",
  replyTo,
  to,
}: {
  initialDraft?: EmailDraft;
  attachments: string[];
  module: ReportModule;
  caseId: string;
  action?: "report" | "followup";
  replyTo?: string;
  to?: string;
}) {
  const [subject, setSubject] = useState(initialDraft?.subject || "");
  const [body, setBody] = useState(initialDraft?.body || "");
  const [sending, setSending] = useState(false);
  const [snailMail, setSnailMail] = useState(false);
  const [snailMailDisabled, setSnailMailDisabled] = useState(false);
  const [results, setResults] = useState<
    Record<string, { status: string; error?: string }>
  >({});
  const [threadUrl, setThreadUrl] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (initialDraft) {
      setSubject(initialDraft.subject);
      setBody(initialDraft.body);
    }
  }, [initialDraft]);

  async function sendEmail() {
    setSending(true);
    const pending: Record<string, { status: string; error?: string }> = {
      email: { status: "sending" },
    };
    if (snailMail) pending.snailMail = { status: "sending" };
    setResults(pending);
    try {
      const res = await fetch(`/api/cases/${caseId}/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject,
          body,
          attachments,
          ...(replyTo ? { replyTo } : {}),
          ...(snailMail ? { snailMail: true } : {}),
        }),
      });
      if (res.ok) {
        const data = (await res.json()) as {
          sentEmails?: { sentAt: string }[];
          case: Case;
          results: Record<string, { success: boolean; error?: string }>;
        };
        const r: Record<string, { status: string; error?: string }> = {};
        for (const [k, v] of Object.entries(data.results)) {
          r[k] = v.success
            ? { status: "success" }
            : { status: "error", error: v.error };
        }
        setResults(r);
        if (r.snailMail?.status === "success") {
          setSnailMail(false);
          setSnailMailDisabled(true);
        }
        const newEmail = data.case.sentEmails?.at(-1);
        const url = newEmail
          ? `/cases/${caseId}/thread/${encodeURIComponent(newEmail.sentAt)}`
          : null;
        if (Object.values(r).every((x) => x.status === "success")) {
          if (url) {
            router.push(url);
            return;
          }
          alert("Notification sent");
        } else if (r.email && r.email.status === "success") {
          if (url) setThreadUrl(url);
          alert("Email sent with some errors");
        } else {
          alert("Failed to send notification");
        }
      } else {
        setResults({ email: { status: "error", error: res.statusText } });
        alert("Failed to send notification");
      }
    } finally {
      setSending(false);
    }
  }

  if (!initialDraft) {
    return (
      <div className="p-8">Drafting email based on case information...</div>
    );
  }

  return (
    <div className="p-8 flex flex-col gap-4">
      <h1 className="text-xl font-semibold">Email Draft</h1>
      <p>
        To: {to || `${module.authorityName} (${module.authorityEmail})`} - the
        photos shown below will be attached automatically.
      </p>
      <label className="flex flex-col">
        Subject
        <input
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="border p-1"
        />
      </label>
      <label className="flex flex-col">
        Body
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={10}
          className="border p-1"
        />
      </label>
      <div className="flex gap-2 flex-wrap">
        {attachments.map((p) => (
          <Image
            key={p}
            src={p}
            alt="email attachment"
            width={120}
            height={90}
            className="object-contain"
          />
        ))}
      </div>
      {module.authorityAddress &&
        (snailMailDisabled ? (
          <div className="flex items-center gap-2">
            <span className="text-green-700">Sent</span>
            <span>Send via snail mail to {module.authorityAddress}</span>
            {results.snailMail?.status === "error" && (
              <span className="text-red-600 text-sm">
                {results.snailMail.error}
              </span>
            )}
          </div>
        ) : (
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={snailMail}
              onChange={(e) => setSnailMail(e.target.checked)}
            />
            <span>Send via snail mail to {module.authorityAddress}</span>
            {results.snailMail?.status === "error" && (
              <span className="text-red-600 text-sm">
                {results.snailMail.error}
              </span>
            )}
          </label>
        ))}
      <button
        type="button"
        onClick={sendEmail}
        disabled={sending}
        className="bg-blue-500 text-white px-2 py-1 rounded disabled:opacity-50"
      >
        {sending ? "Sending..." : "Send"}
      </button>
      {threadUrl && (
        <a
          href={threadUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-500 underline mt-2 text-sm"
        >
          View Thread
        </a>
      )}
    </div>
  );
}
