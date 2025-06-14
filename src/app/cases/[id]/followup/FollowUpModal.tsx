"use client";
import type { EmailDraft } from "@/lib/caseReport";
import type { ReportModule } from "@/lib/reportModules";
import * as Dialog from "@radix-ui/react-dialog";
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
  withOwnerInfo,
  onClose,
}: {
  caseId: string;
  replyTo?: string;
  withOwnerInfo?: boolean;
  onClose: () => void;
}) {
  const [data, setData] = useState<DraftData | null>(null);

  useEffect(() => {
    let canceled = false;
    const params = [] as string[];
    if (replyTo) params.push(`replyTo=${encodeURIComponent(replyTo)}`);
    if (withOwnerInfo) params.push("owner=1");
    const query = params.length > 0 ? `?${params.join("&")}` : "";
    const url = `/api/cases/${caseId}/followup${query}`;
    fetch(url)
      .then((res) => res.json())
      .then((d) => {
        if (!canceled) setData(d as DraftData);
      });
    return () => {
      canceled = true;
    };
  }, [caseId, replyTo, withOwnerInfo]);

  return (
    <Dialog.Root open onOpenChange={(o) => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
        <Dialog.Content className="fixed inset-0 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-900 rounded shadow max-w-xl w-full">
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
              <div className="p-8">
                Drafting email based on case information...
              </div>
            )}
            <div className="flex justify-end p-4">
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
