"use client";
import type { EmailDraft } from "@/lib/caseReport";
import { useEffect, useState } from "react";
import NotifyOwnerEditor from "./NotifyOwnerEditor";

interface DraftData {
  email: EmailDraft;
  attachments: string[];
  contact: string;
}

export default function NotifyOwnerModal({
  caseId,
  onClose,
}: {
  caseId: string;
  onClose: () => void;
}) {
  const [data, setData] = useState<DraftData | null>(null);

  useEffect(() => {
    let canceled = false;
    fetch(`/api/cases/${caseId}/notify-owner`)
      .then((res) => res.json())
      .then((d) => {
        if (!canceled) setData(d as DraftData);
      });
    return () => {
      canceled = true;
    };
  }, [caseId]);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded shadow max-w-xl w-full">
        {data ? (
          <NotifyOwnerEditor
            caseId={caseId}
            initialDraft={data.email}
            attachments={data.attachments}
            contact={data.contact}
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
