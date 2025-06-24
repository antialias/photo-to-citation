"use client";
import { apiFetch } from "@/apiClient";
import type { EmailDraft } from "@/lib/caseReport";
import type { ReportModule } from "@/lib/reportModules";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useNotify } from "../../../components/NotificationProvider";

interface DraftData {
  email: EmailDraft;
  attachments: string[];
  module: ReportModule;
}

export default function DraftPreview({
  caseId,
  data,
  onClose,
}: {
  caseId: string;
  data: DraftData;
  onClose: () => void;
}) {
  const router = useRouter();
  const notify = useNotify();
  const [sending, setSending] = useState(false);

  function openCompose() {
    const url = `/cases/${caseId}/compose`;
    router.push(url).then(() => {
      if (typeof history !== "undefined") {
        const st = history.state ?? {};
        history.replaceState({ ...st, draftData: data }, "", url);
      }
    });
  }

  async function send() {
    setSending(true);
    const res = await apiFetch(`/api/cases/${caseId}/report`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subject: data.email.subject,
        body: data.email.body,
        attachments: data.attachments,
      }),
    });
    if (res.ok) {
      notify("Email sent");
      onClose();
    } else {
      const err = await res.json().catch(() => ({}));
      notify(err.error || "Failed to send email");
    }
    setSending(false);
  }

  const previewBody =
    data.email.body.length > 80
      ? `${data.email.body.slice(0, 77)}...`
      : data.email.body;

  return (
    <div className="bg-blue-600 text-white px-2 py-1 rounded mx-1 text-xs space-y-1">
      <button type="button" onClick={openCompose} className="text-left w-full">
        <strong>{data.email.subject}</strong> {previewBody}
      </button>
      <div className="flex gap-1">
        <button
          type="button"
          onClick={send}
          disabled={sending}
          className="bg-blue-800 text-white px-1 rounded disabled:opacity-50"
        >
          {sending ? "Sending..." : "Send"}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="bg-gray-200 text-black px-1 rounded"
        >
          Close
        </button>
      </div>
    </div>
  );
}
