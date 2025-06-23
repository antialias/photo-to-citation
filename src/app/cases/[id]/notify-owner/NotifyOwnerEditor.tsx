"use client";
import { apiFetch } from "@/apiClient";
import ThumbnailImage from "@/components/thumbnail-image";
import type { EmailDraft } from "@/lib/caseReport";
import type { Case } from "@/lib/caseStore";
import { getThumbnailUrl } from "@/lib/clientThumbnails";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useNotify } from "../../../components/NotificationProvider";

export default function NotifyOwnerEditor({
  initialDraft,
  attachments,
  contactInfo,
  violationAddress,
  availableMethods,
  caseId,
}: {
  initialDraft?: EmailDraft;
  attachments: string[];
  contactInfo: {
    email?: string;
    phone?: string;
    address?: string;
  };
  violationAddress?: string;
  availableMethods: string[];
  caseId: string;
}) {
  const [subject, setSubject] = useState(initialDraft?.subject || "");
  const [body, setBody] = useState(initialDraft?.body || "");
  const [sending, setSending] = useState(false);
  const [results, setResults] = useState<
    Record<string, { status: string; error?: string }>
  >({});
  const [methods, setMethods] = useState<string[]>(availableMethods);
  const [disabledMethods, setDisabledMethods] = useState<string[]>([]);
  const [threadUrl, setThreadUrl] = useState<string | null>(null);
  const router = useRouter();
  const notify = useNotify();

  useEffect(() => {
    if (initialDraft) {
      setSubject(initialDraft.subject);
      setBody(initialDraft.body);
    }
  }, [initialDraft]);

  async function sendNotification() {
    setSending(true);
    setResults(
      Object.fromEntries(methods.map((m) => [m, { status: "sending" }])),
    );
    try {
      const res = await apiFetch(`/api/cases/${caseId}/notify-owner`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, body, attachments, methods }),
      });
      if (res.ok) {
        const data = (await res.json()) as {
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
        const successes = Object.entries(r)
          .filter(([, v]) => v.status === "success")
          .map(([k]) => k);
        if (successes.length > 0) {
          setMethods((prev) => prev.filter((m) => !successes.includes(m)));
          setDisabledMethods((prev) => [
            ...prev,
            ...successes.filter((m) => !prev.includes(m)),
          ]);
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
          notify("Notification sent");
        } else if (r.email && r.email.status === "success") {
          if (url) setThreadUrl(url);
          notify("Some notifications failed");
        } else {
          notify("Some notifications failed");
        }
      } else {
        setResults({
          ...Object.fromEntries(
            methods.map((m) => [m, { status: "error", error: res.statusText }]),
          ),
        });
        notify("Failed to send notification");
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
      <h1 className="text-xl font-semibold">Owner Notification</h1>
      <p>The photos shown below will be attached automatically.</p>
      <div className="flex flex-col gap-2">
        {contactInfo.email &&
          (disabledMethods.includes("email") ? (
            <div className="flex items-center gap-2">
              <span className="text-green-700">Sent</span>
              <span>Email: {contactInfo.email}</span>
              {results.email?.status === "error" && (
                <span className="text-red-600 text-sm">
                  {results.email.error}
                </span>
              )}
            </div>
          ) : (
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={methods.includes("email")}
                onChange={(e) => {
                  if (e.target.checked) {
                    setMethods([...methods, "email"]);
                  } else {
                    setMethods(methods.filter((m) => m !== "email"));
                  }
                }}
              />
              <span>Email: {contactInfo.email}</span>
              {results.email?.status === "error" && (
                <span className="text-red-600 text-sm">
                  {results.email.error}
                </span>
              )}
            </label>
          ))}
        {contactInfo.phone && (
          <>
            {disabledMethods.includes("sms") ? (
              <div className="flex items-center gap-2">
                <span className="text-green-700">Sent</span>
                <span>SMS: {contactInfo.phone}</span>
                {results.sms?.status === "error" && (
                  <span className="text-red-600 text-sm">
                    {results.sms.error}
                  </span>
                )}
              </div>
            ) : (
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={methods.includes("sms")}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setMethods([...methods, "sms"]);
                    } else {
                      setMethods(methods.filter((m) => m !== "sms"));
                    }
                  }}
                />
                <span>SMS: {contactInfo.phone}</span>
                {results.sms?.status === "error" && (
                  <span className="text-red-600 text-sm">
                    {results.sms.error}
                  </span>
                )}
              </label>
            )}
            {disabledMethods.includes("whatsapp") ? (
              <div className="flex items-center gap-2">
                <span className="text-green-700">Sent</span>
                <span>WhatsApp: {contactInfo.phone}</span>
                {results.whatsapp?.status === "error" && (
                  <span className="text-red-600 text-sm">
                    {results.whatsapp.error}
                  </span>
                )}
              </div>
            ) : (
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={methods.includes("whatsapp")}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setMethods([...methods, "whatsapp"]);
                    } else {
                      setMethods(methods.filter((m) => m !== "whatsapp"));
                    }
                  }}
                />
                <span>WhatsApp: {contactInfo.phone}</span>
                {results.whatsapp?.status === "error" && (
                  <span className="text-red-600 text-sm">
                    {results.whatsapp.error}
                  </span>
                )}
              </label>
            )}
            {disabledMethods.includes("robocall") ? (
              <div className="flex items-center gap-2">
                <span className="text-green-700">Sent</span>
                <span>Robocall: {contactInfo.phone}</span>
                {results.robocall?.status === "error" && (
                  <span className="text-red-600 text-sm">
                    {results.robocall.error}
                  </span>
                )}
              </div>
            ) : (
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={methods.includes("robocall")}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setMethods([...methods, "robocall"]);
                    } else {
                      setMethods(methods.filter((m) => m !== "robocall"));
                    }
                  }}
                />
                <span>Robocall: {contactInfo.phone}</span>
                {results.robocall?.status === "error" && (
                  <span className="text-red-600 text-sm">
                    {results.robocall.error}
                  </span>
                )}
              </label>
            )}
          </>
        )}
        {contactInfo.address &&
          (disabledMethods.includes("snailMail") ? (
            <div className="flex items-center gap-2">
              <span className="text-green-700">Sent</span>
              <span>Snail Mail: {contactInfo.address}</span>
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
                checked={methods.includes("snailMail")}
                onChange={(e) => {
                  if (e.target.checked) {
                    setMethods([...methods, "snailMail"]);
                  } else {
                    setMethods(methods.filter((m) => m !== "snailMail"));
                  }
                }}
              />
              <span>Snail Mail: {contactInfo.address}</span>
              {results.snailMail?.status === "error" && (
                <span className="text-red-600 text-sm">
                  {results.snailMail.error}
                </span>
              )}
            </label>
          ))}
        {violationAddress &&
          (disabledMethods.includes("snailMailLocation") ? (
            <div className="flex items-center gap-2">
              <span className="text-green-700">Sent</span>
              <span>Mail to address of violation: {violationAddress}</span>
              {results.snailMailLocation?.status === "error" && (
                <span className="text-red-600 text-sm">
                  {results.snailMailLocation.error}
                </span>
              )}
            </div>
          ) : (
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={methods.includes("snailMailLocation")}
                onChange={(e) => {
                  if (e.target.checked) {
                    setMethods([...methods, "snailMailLocation"]);
                  } else {
                    setMethods(
                      methods.filter((m) => m !== "snailMailLocation"),
                    );
                  }
                }}
              />
              <span>Mail to address of violation: {violationAddress}</span>
              {results.snailMailLocation?.status === "error" && (
                <span className="text-red-600 text-sm">
                  {results.snailMailLocation.error}
                </span>
              )}
            </label>
          ))}
      </div>
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
          <ThumbnailImage
            key={p}
            src={getThumbnailUrl(p, 128)}
            alt="email attachment"
            width={120}
            height={90}
            className="object-contain"
          />
        ))}
      </div>
      <button
        type="button"
        onClick={sendNotification}
        disabled={sending}
        className="bg-blue-500 text-white px-2 py-1 rounded disabled:opacity-50"
      >
        {sending ? "Sending..." : "Send Notification"}
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
