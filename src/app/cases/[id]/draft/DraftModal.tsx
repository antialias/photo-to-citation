"use client";
import { apiFetch } from "@/apiClient";
import type { EmailDraft } from "@/lib/caseReport";
import type { ReportModule } from "@/lib/reportModules";
import * as Dialog from "@radix-ui/react-dialog";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { css, cx } from "styled-system/css";
import { token } from "styled-system/tokens";
import { useNotify } from "../../../components/NotificationProvider";
import DraftEditor from "./DraftEditor";

interface DraftData {
  email: EmailDraft;
  attachments: string[];
  module: ReportModule;
}

export default function DraftModal({
  caseId,
  onClose,
  initialData,
}: {
  caseId: string;
  onClose: () => void;
  initialData?: DraftData | null;
}) {
  const [data, setData] = useState<DraftData | null>(initialData ?? null);
  const [fullScreen, setFullScreen] = useState(false);
  const notify = useNotify();
  const { i18n, t } = useTranslation();

  useEffect(() => {
    if (initialData) return;
    let canceled = false;
    apiFetch(`/api/cases/${caseId}/report?lang=${i18n.language}`)
      .then(async (res) => {
        if (res.ok) {
          return res.json();
        }
        const err = await res.json().catch(() => ({}));
        notify(err.error || t("failedDraftReport"));
        onClose();
        return null;
      })
      .then((d) => {
        if (d && !canceled) setData(d as DraftData);
      });
    return () => {
      canceled = true;
    };
  }, [caseId, initialData, onClose, notify, i18n.language, t]);

  useEffect(() => {
    if (initialData) setData(initialData);
  }, [initialData]);

  return (
    <Dialog.Root open onOpenChange={(o) => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-modal" />
        <Dialog.Content
          className={`fixed inset-0 flex p-4 z-modal ${fullScreen ? "items-stretch justify-stretch" : "items-center justify-center"}`}
        >
          <div
            className={cx(
              css({ bg: token("colors.surface"), rounded: "md", shadow: "md" }),
              `w-full ${fullScreen ? "h-full max-w-none" : "max-w-xl"}`,
            )}
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
              <div className="p-8">{t("draftingEmail")}</div>
            )}
            <div className="flex justify-between p-4">
              <button
                type="button"
                onClick={() => setFullScreen(!fullScreen)}
                className={cx(
                  css({
                    bg: token("colors.surface-subtle"),
                    rounded: "md",
                    px: "2",
                    py: "1",
                  }),
                )}
              >
                {fullScreen ? t("exitFullScreen") : t("fullScreen")}
              </button>
              <Dialog.Close asChild>
                <button
                  type="button"
                  className={cx(
                    css({
                      bg: token("colors.surface-subtle"),
                      rounded: "md",
                      px: "2",
                      py: "1",
                    }),
                  )}
                >
                  {t("close")}
                </button>
              </Dialog.Close>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
