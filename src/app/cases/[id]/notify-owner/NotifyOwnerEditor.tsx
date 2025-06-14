"use client";
import type { EmailDraft } from "@/lib/caseReport";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

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
  const router = useRouter();
  const [subject, setSubject] = useState(initialDraft?.subject || "");
  const [body, setBody] = useState(initialDraft?.body || "");
  const [sending, setSending] = useState(false);
  const [methods, setMethods] = useState<string[]>(availableMethods);

  useEffect(() => {
    if (initialDraft) {
      setSubject(initialDraft.subject);
      setBody(initialDraft.body);
    }
  }, [initialDraft]);

  async function sendNotification() {
    setSending(true);
    try {
      const res = await fetch(`/api/cases/${caseId}/notify-owner`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, body, attachments, methods }),
      });
      if (res.ok) {
        alert("Notification sent");
        const data = (await res.json()) as {
          sentEmails?: { sentAt: string }[];
        };
        const sent = data.sentEmails?.at(-1)?.sentAt;
        if (sent) {
          router.push(`/cases/${caseId}/thread/${encodeURIComponent(sent)}`);
        } else {
          router.push(`/cases/${caseId}`);
        }
      } else {
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
      <h1 className="text-xl font-semibold">Owner Notification</h1>
      <p>The photos shown below will be attached automatically.</p>
      <div className="flex flex-col gap-2">
        {contactInfo.email && (
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
          </label>
        )}
        {contactInfo.phone && (
          <>
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
            </label>
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
            </label>
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
            </label>
          </>
        )}
        {contactInfo.address && (
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
          </label>
        )}
        {violationAddress && (
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={methods.includes("snailMailLocation")}
              onChange={(e) => {
                if (e.target.checked) {
                  setMethods([...methods, "snailMailLocation"]);
                } else {
                  setMethods(methods.filter((m) => m !== "snailMailLocation"));
                }
              }}
            />
            <span>Mail to address of violation: {violationAddress}</span>
          </label>
        )}
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
      <button
        type="button"
        onClick={sendNotification}
        disabled={sending}
        className="bg-blue-500 text-white px-2 py-1 rounded disabled:opacity-50"
      >
        {sending ? "Sending..." : "Send Notification"}
      </button>
    </div>
  );
}
