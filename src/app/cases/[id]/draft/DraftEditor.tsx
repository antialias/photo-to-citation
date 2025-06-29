"use client";
import { apiFetch } from "@/apiClient";
import { useSession } from "@/app/useSession";
import ThumbnailImage from "@/components/thumbnail-image";
import type { EmailDraft } from "@/lib/caseReport";
import type { Case } from "@/lib/caseStore";
import { getThumbnailUrl } from "@/lib/clientThumbnails";
import { getLocalizedText } from "@/lib/localizedText";
import type { ReportModule } from "@/lib/reportModules";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNotify } from "../../../components/NotificationProvider";

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
  const { i18n } = useTranslation();
  const [subject, setSubject] = useState(
    initialDraft
      ? getLocalizedText(initialDraft.subject, i18n.language).text
      : "",
  );
  const [body, setBody] = useState(
    initialDraft ? getLocalizedText(initialDraft.body, i18n.language).text : "",
  );
  const [sending, setSending] = useState(false);
  const [snailMail, setSnailMail] = useState(false);
  const [snailMailDisabled, setSnailMailDisabled] = useState(false);
  const [results, setResults] = useState<
    Record<string, { status: string; error?: string }>
  >({});
  const [threadUrl, setThreadUrl] = useState<string | null>(null);
  const router = useRouter();
  const { data: session } = useSession();
  const { t } = useTranslation();
  const isAdmin =
    session?.user?.role === "admin" || session?.user?.role === "superadmin";
  const notify = useNotify();

  useEffect(() => {
    if (initialDraft) {
      setSubject(getLocalizedText(initialDraft.subject, i18n.language).text);
      setBody(getLocalizedText(initialDraft.body, i18n.language).text);
    }
  }, [initialDraft, i18n.language]);

  async function sendEmail() {
    setSending(true);
    const pending: Record<string, { status: string; error?: string }> = {
      email: { status: "sending" },
    };
    if (snailMail) pending.snailMail = { status: "sending" };
    setResults(pending);
    try {
      const res = await apiFetch(`/api/cases/${caseId}/${action}`, {
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
          notify(t("notificationSent"));
        } else if (r.email && r.email.status === "success") {
          if (url) setThreadUrl(url);
          notify(t("emailSentWithErrors"));
        } else {
          notify(t("failedToSendNotification"));
        }
      } else {
        setResults({ email: { status: "error", error: res.statusText } });
        notify(t("failedToSendNotification"));
      }
    } finally {
      setSending(false);
    }
  }

  if (!initialDraft) {
    return <div className="p-8">{t("draftingEmail")}</div>;
  }

  return (
    <div className="p-8 flex flex-col gap-4">
      <h1 className="text-xl font-semibold">{t("emailDraft")}</h1>
      <p>
        {t("toLabel")}{" "}
        {to || `${module.authorityName} (${module.authorityEmail})`} - the
        photos shown below will be attached automatically.
      </p>
      <label className="flex flex-col">
        {t("subjectLabel")}
        <input
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="border p-1"
        />
      </label>
      <label className="flex flex-col">
        {t("bodyLabel")}
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={10}
          className="border p-1"
        />
      </label>
      <div className="flex gap-2 flex-wrap">
        {attachments.map((p) => (
          <ThumbnailImage
            key={p}
            src={getThumbnailUrl(p, 128)}
            alt="email attachment"
            width={120}
            height={90}
            imgClassName="object-contain"
          />
        ))}
      </div>
      {module.authorityAddress &&
        (snailMailDisabled ? (
          <div className="flex items-center gap-2">
            <span className="text-green-700">{t("sent")}</span>
            <span>
              {t("sendViaSnailMail", { address: module.authorityAddress })}
            </span>
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
            <span>
              {t("sendViaSnailMail", { address: module.authorityAddress })}
            </span>
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
        disabled={!isAdmin || sending}
        data-testid="send-button"
        className="bg-blue-500 text-white px-2 py-1 rounded disabled:opacity-50"
      >
        {sending ? t("sending") : t("send")}
      </button>
      {threadUrl && (
        <a
          href={threadUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-500 underline mt-2 text-sm"
        >
          {t("viewThread")}
        </a>
      )}
    </div>
  );
}
