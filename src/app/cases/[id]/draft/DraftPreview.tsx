"use client";
import { apiFetch } from "@/apiClient";
import ThumbnailImage from "@/components/thumbnail-image";
import Tooltip from "@/components/ui/tooltip";
import type { EmailDraft } from "@/lib/caseReport";
import { getThumbnailUrl } from "@/lib/clientThumbnails";
import { getLocalizedText } from "@/lib/localizedText";
import type { ReportModule } from "@/lib/reportModules";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNotify } from "../../../components/NotificationProvider";
import { ChatWidget, WidgetActions } from "../widgets";

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
  const { i18n, t } = useTranslation();

  function openCompose() {
    const url = `/cases/${caseId}/compose`;
    router.push(url);
    if (typeof history !== "undefined") {
      const st = history.state ?? {};
      history.replaceState({ ...st, draftData: data }, "", url);
    }
  }

  const subjectText = getLocalizedText(data.email.subject, i18n.language).text;
  const { text: bodyText } = getLocalizedText(data.email.body, i18n.language);

  async function send() {
    setSending(true);
    const res = await apiFetch(`/api/cases/${caseId}/report`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subject: subjectText,
        body: bodyText,
        attachments: data.attachments,
      }),
    });
    if (res.ok) {
      notify(t("emailSent"));
      onClose();
    } else {
      const err = await res.json().catch(() => ({}));
      notify(err.error || t("failedToSendEmail"));
    }
    setSending(false);
  }

  const previewBody =
    bodyText.length > 80 ? `${bodyText.slice(0, 77)}...` : bodyText;

  const tooltipContent = (
    <div className="bg-white text-black p-2 rounded shadow max-w-sm space-y-2">
      <div className="font-semibold text-sm">{subjectText}</div>
      <pre className="whitespace-pre-wrap text-xs">{bodyText}</pre>
      {data.attachments.length > 0 && (
        <div className="flex gap-1 flex-wrap">
          {data.attachments.map((p) => (
            <ThumbnailImage
              key={p}
              src={getThumbnailUrl(p, 128)}
              alt="attachment"
              width={96}
              height={72}
              imgClassName="object-contain"
            />
          ))}
        </div>
      )}
      <WidgetActions wrap>
        <button
          type="button"
          onClick={send}
          disabled={sending}
          className="bg-blue-800 text-white px-1 rounded text-xs disabled:opacity-50"
        >
          {sending ? t("sending") : t("send")}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="bg-gray-200 text-black px-1 rounded text-xs"
        >
          {t("close")}
        </button>
        <Link
          href={`/cases/${caseId}/compose`}
          className="bg-blue-600 text-white px-1 rounded text-xs"
        >
          {t("fullEditor")}
        </Link>
      </WidgetActions>
    </div>
  );

  return (
    <ChatWidget>
      <Tooltip label={tooltipContent} interactive>
        <button
          type="button"
          onClick={openCompose}
          className="text-left w-full"
        >
          <strong>{subjectText}</strong> {previewBody}
        </button>
      </Tooltip>
      <WidgetActions>
        <button
          type="button"
          onClick={send}
          disabled={sending}
          className="bg-blue-800 text-white px-1 rounded disabled:opacity-50"
        >
          {sending ? t("sending") : t("send")}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="bg-gray-200 text-black px-1 rounded"
        >
          {t("close")}
        </button>
      </WidgetActions>
    </ChatWidget>
  );
}
