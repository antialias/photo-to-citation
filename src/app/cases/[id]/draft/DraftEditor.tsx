"use client";
import type { EmailDraft } from "@/lib/caseReport";
import type { ReportModule } from "@/lib/reportModules";
import Image from "next/image";
import { useState } from "react";

export default function DraftEditor({
  initialDraft,
  attachments,
  module,
  caseId,
}: {
  initialDraft: EmailDraft;
  attachments: string[];
  module: ReportModule;
  caseId: string;
}) {
  const [subject, setSubject] = useState(initialDraft.subject);
  const [body, setBody] = useState(initialDraft.body);

  async function sendEmail() {
    const mailto = `mailto:${module.authorityEmail}?subject=${encodeURIComponent(
      subject,
    )}&body=${encodeURIComponent(body)}`;
    await fetch(`/api/cases/${caseId}/report`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject, body, attachments }),
    });
    window.location.href = mailto;
  }

  return (
    <div className="p-8 flex flex-col gap-4">
      <h1 className="text-xl font-semibold">Email Draft</h1>
      <p>
        To: {module.authorityName} ({module.authorityEmail}) - attach the photos
        shown below before sending.
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
          <Image key={p} src={p} alt="" width={120} height={90} />
        ))}
      </div>
      <button
        type="button"
        onClick={sendEmail}
        className="bg-blue-500 text-white px-2 py-1 rounded"
      >
        Send Email
      </button>
    </div>
  );
}
