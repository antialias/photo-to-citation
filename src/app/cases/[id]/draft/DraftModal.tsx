"use client";
import type { EmailDraft } from "@/lib/caseReport";
import type { ReportModule } from "@/lib/reportModules";
import { useEffect, useState } from "react";
import DraftEditor from "./DraftEditor";

interface DraftData {
  email: EmailDraft;
  attachments: string[];
  module: ReportModule;
}

export default function DraftModal({
  caseId,
  onClose,
}: {
  caseId: string;
  onClose: () => void;
}) {
  const [data, setData] = useState<DraftData | null>(null);
  const [fullScreen, setFullScreen] = useState(false);

  useEffect(() => {
    let canceled = false;
    fetch(`/api/cases/${caseId}/report`)
      .then((res) => res.json())
      .then((d) => {
        if (!canceled) setData(d as DraftData);
      });
    return () => {
      canceled = true;
    };
  }, [caseId]);

  return (
    <div
      className={`fixed inset-0 bg-black/50 flex p-4 z-50 ${fullScreen ? "items-stretch justify-stretch" : "items-center justify-center"}`}
    >
      <div
        className={`bg-white rounded shadow w-full ${fullScreen ? "h-full max-w-none" : "max-w-xl"}`}
      >
        {data ? (
          <DraftEditor
            caseId={caseId}
            initialDraft={data.email}
            attachments={data.attachments}
            module={data.module}
            action="report"
          />
        ) : (
          <div className="p-8">Drafting email based on case information...</div>
        )}
        <div className="flex justify-between p-4">
          <button
            type="button"
            onClick={() => setFullScreen(!fullScreen)}
            className="bg-gray-200 px-2 py-1 rounded"
          >
            {fullScreen ? "Exit Full Screen" : "Full Screen"}
          </button>
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
