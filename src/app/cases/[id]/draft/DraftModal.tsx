"use client";
import { apiFetch } from "@/apiClient";
import type { EmailDraft } from "@/lib/caseReport";
import { useNotification } from "@/lib/notifications";
import type { ReportModule } from "@/lib/reportModules";
import * as Dialog from "@radix-ui/react-dialog";
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
  const notify = useNotification();

  useEffect(() => {
    let canceled = false;
    apiFetch(`/api/cases/${caseId}/report`)
      .then(async (res) => {
        if (res.ok) {
          return res.json();
        }
        const err = await res.json().catch(() => ({}));
        notify(err.error || "Failed to draft report");
        onClose();
        return null;
      })
      .then((d) => {
        if (d && !canceled) setData(d as DraftData);
      });
    return () => {
      canceled = true;
    };
  }, [caseId, onClose, notify]);

  return (
    <Dialog.Root open onOpenChange={(o) => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
        <Dialog.Content
          className={`fixed inset-0 flex p-4 z-50 ${fullScreen ? "items-stretch justify-stretch" : "items-center justify-center"}`}
        >
          <div
            className={`bg-white dark:bg-gray-900 rounded shadow w-full ${fullScreen ? "h-full max-w-none" : "max-w-xl"}`}
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
              <div className="p-8">
                Drafting email based on case information...
              </div>
            )}
            <div className="flex justify-between p-4">
              <button
                type="button"
                onClick={() => setFullScreen(!fullScreen)}
                className="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded"
              >
                {fullScreen ? "Exit Full Screen" : "Full Screen"}
              </button>
              <Dialog.Close asChild>
                <button
                  type="button"
                  className="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded"
                >
                  Close
                </button>
              </Dialog.Close>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
