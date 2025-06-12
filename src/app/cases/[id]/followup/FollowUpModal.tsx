"use client";
import type { EmailDraft } from "@/lib/caseReport";
import type { ReportModule } from "@/lib/reportModules";
import { useEffect, useState } from "react";
import DraftEditor from "../draft/DraftEditor";

interface DraftData {
  email: EmailDraft;
  attachments: string[];
  module: ReportModule;
  to: string;
}

export default function FollowUpModal({
  caseId,
  replyTo,
  onClose,
}: {
  caseId: string;
  replyTo?: string;
  onClose: () => void;
}) {
  const [data, setData] = useState<DraftData | null>(null);

  useEffect(() => {
    let canceled = false;
    const url = `/api/cases/${caseId}/followup${replyTo ? `?replyTo=${encodeURIComponent(replyTo)}` : ""}`;
    fetch(url)
      .then((res) => res.json())
      .then((d) => {
        if (!canceled) setData(d as DraftData);
      });
    return () => {
      canceled = true;
    };
  }, [caseId, replyTo]);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded shadow max-w-xl w-full">
        {data ? (
          <DraftEditor
            caseId={caseId}
            initialDraft={data.email}
            attachments={data.attachments}
            module={data.module}
            action="followup"
            replyTo={replyTo}
            to={data.to}
          />
        ) : (
          <div className="p-8">Drafting email based on case information...</div>
        )}
        <div className="flex justify-end p-4">
          <button
            type="button"
            onClick={onClose}
            className="bg-gray-200 px-2 py-1 rounded"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
