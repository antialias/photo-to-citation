"use client";
import { apiFetch } from "@/apiClient";
import ThumbnailImage from "@/components/thumbnail-image";
import Tooltip from "@/components/ui/tooltip";
import type { EmailDraft } from "@/lib/caseReport";
import { getThumbnailUrl } from "@/lib/clientThumbnails";
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

  const tooltipContent = (
    <div className="bg-white text-black p-2 rounded shadow space-y-2 max-w-sm">
      <div>
        <strong>{data.email.subject}</strong>
        <pre className="whitespace-pre-wrap text-xs mt-1">
          {data.email.body}
        </pre>
      </div>
      {data.attachments.length > 0 && (
        <div className="flex gap-1 flex-wrap">
          {data.attachments.map((p) => (
            <ThumbnailImage
              key={p}
              src={getThumbnailUrl(p, 64)}
              alt="attachment"
              width={64}
              height={48}
              imgClassName="object-contain"
            />
          ))}
        </div>
      )}
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
          Dismiss
        </button>
        <button type="button" onClick={openCompose} className="underline">
          Open Draft
        </button>
      </div>
    </div>
  );

  return (
    <div className="bg-blue-600 text-white px-2 py-1 rounded mx-1 text-xs">
      <Tooltip label={tooltipContent} placement="top">
        <span className="cursor-pointer">
          <strong>{data.email.subject}</strong> {previewBody}
        </span>
      </Tooltip>
    </div>
  );
}
