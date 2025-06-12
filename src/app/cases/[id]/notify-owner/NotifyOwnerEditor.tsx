"use client";
import type { EmailDraft } from "@/lib/caseReport";
import Image from "next/image";
import { useEffect, useState } from "react";

export default function NotifyOwnerEditor({
  initialDraft,
  attachments,
  contact,
  caseId,
}: {
  initialDraft?: EmailDraft;
  attachments: string[];
  contact: string;
  caseId: string;
}) {
  const [subject, setSubject] = useState(initialDraft?.subject || "");
  const [body, setBody] = useState(initialDraft?.body || "");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (initialDraft) {
      setSubject(initialDraft.subject);
      setBody(initialDraft.body);
    }
  }, [initialDraft]);

  async function sendEmail() {
    setSending(true);
    try {
      const res = await fetch(`/api/cases/${caseId}/notify-owner`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, body, attachments }),
      });
      if (res.ok) {
        alert("Email sent");
      } else {
        alert("Failed to send email");
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
      <p>
        To: {contact} - the photos shown below will be attached automatically.
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
      <button
        type="button"
        onClick={sendEmail}
        disabled={sending}
        className="bg-blue-500 text-white px-2 py-1 rounded disabled:opacity-50"
      >
        {sending ? "Sending..." : "Send Email"}
      </button>
    </div>
  );
}
