"use client";
import { apiFetch } from "@/apiClient";
import type { EmailDraft } from "@/lib/caseReport";
import * as Dialog from "@radix-ui/react-dialog";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNotify } from "../../../components/NotificationProvider";
import NotifyOwnerEditor from "./NotifyOwnerEditor";

interface DraftData {
  email: EmailDraft;
  attachments: string[];
  contactInfo: {
    email?: string;
    phone?: string;
    address?: string;
  };
  violationAddress?: string | null;
  availableMethods: string[];
}

export default function NotifyOwnerModal({
  caseId,
  onClose,
}: {
  caseId: string;
  onClose: () => void;
}) {
  const [data, setData] = useState<DraftData | null>(null);
  const notify = useNotify();
  const { i18n } = useTranslation();

  useEffect(() => {
    let canceled = false;
    const url = `/api/cases/${caseId}/notify-owner?lang=${i18n.language}`;
    apiFetch(url)
      .then(async (res) => {
        if (res.ok) {
          return res.json();
        }
        const err = await res.json().catch(() => ({}));
        notify(err.error || "Failed to draft notification");
        onClose();
        return null;
      })
      .then((d) => {
        if (d && !canceled) setData(d as DraftData);
      });
    return () => {
      canceled = true;
    };
  }, [caseId, onClose, notify, i18n.language]);

  return (
    <Dialog.Root open onOpenChange={(o) => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
        <Dialog.Content className="fixed inset-0 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-900 rounded shadow max-w-xl w-full">
            {data ? (
              <NotifyOwnerEditor
                caseId={caseId}
                initialDraft={data.email}
                attachments={data.attachments}
                contactInfo={data.contactInfo}
                violationAddress={data.violationAddress ?? undefined}
                availableMethods={data.availableMethods}
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
