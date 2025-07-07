"use client";
import { apiFetch } from "@/apiClient";
import DraftEditor from "@/app/cases/[id]/draft/DraftEditor";
import type { EmailDraft } from "@/lib/caseReport";
import type { ReportModule } from "@/lib/reportModules";
import * as Dialog from "@radix-ui/react-dialog";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { css, cx } from "styled-system/css";
import { token } from "styled-system/tokens";

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
  const { i18n, t } = useTranslation();

  useEffect(() => {
    let canceled = false;
    const base = `/api/cases/${caseId}/followup${replyTo ? `?replyTo=${encodeURIComponent(replyTo)}` : ""}`;
    const url = base.includes("?")
      ? `${base}&lang=${i18n.language}`
      : `${base}?lang=${i18n.language}`;
    apiFetch(url)
      .then((res) => res.json())
      .then((d) => {
        if (!canceled) setData(d as DraftData);
      });
    return () => {
      canceled = true;
    };
  }, [caseId, replyTo, i18n.language]);

  return (
    <Dialog.Root open onOpenChange={(o) => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-modal" />
        <Dialog.Content className="fixed inset-0 flex items-center justify-center p-4 z-modal">
          <div
            className={cx(
              css({ bg: token("colors.surface"), rounded: "md", shadow: "md" }),
              "max-w-xl w-full",
            )}
          >
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
              <div className="p-8">{t("draftingEmail")}</div>
            )}
            <div className="flex justify-end p-4">
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
