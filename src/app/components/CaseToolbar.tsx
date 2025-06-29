"use client";
import { apiFetch } from "@/apiClient";
import useCloseOnOutsideClick from "@/app/useCloseOnOutsideClick";
import { withBasePath } from "@/basePath";
import { Progress } from "@/components/ui/progress";
import type { LlmProgress } from "@/lib/openai";
import Link from "next/link";
import { useRef } from "react";
import { useTranslation } from "react-i18next";

export default function CaseToolbar({
  caseId,
  disabled = false,
  hasOwner = false,
  progress,
  canDelete = false,
  closed = false,
  archived = false,
  readOnly = false,
}: {
  caseId: string;
  disabled?: boolean;
  hasOwner?: boolean;
  progress?: LlmProgress | null;
  canDelete?: boolean;
  closed?: boolean;
  archived?: boolean;
  readOnly?: boolean;
}) {
  const { t } = useTranslation();
  const reqText = progress
    ? progress.stage === "upload"
      ? progress.index > 0
        ? t("uploadingProgress", {
            index: progress.index,
            total: progress.total,
            percent: Math.floor((progress.index / progress.total) * 100),
            count: progress.total,
          })
        : t("uploadingPhotos")
      : progress.stage === "retry"
        ? t("analysisRestarting", { attempt: progress.attempt })
        : progress.done
          ? t("processingResults")
          : t("analyzingTokens", {
              received: progress.received,
              total: progress.total,
            })
    : null;
  const progressText = progress
    ? `${progress.steps ? `Step ${progress.step} of ${progress.steps}: ` : ""}${reqText}`
    : null;

  const requestValue = progress
    ? progress.stage === "upload"
      ? progress.index > 0
        ? (progress.index / progress.total) * 100
        : undefined
      : progress.stage === "stream"
        ? Math.min((progress.received / progress.total) * 100, 100)
        : undefined
    : undefined;
  const overallValue =
    progress?.steps !== undefined && progress.step !== undefined
      ? ((progress.step - 1 + (requestValue ?? 0) / 100) / progress.steps) * 100
      : undefined;
  const detailsRef = useRef<HTMLDetailsElement>(null);
  useCloseOnOutsideClick(detailsRef);
  return (
    <div className="bg-gray-100 dark:bg-gray-800 px-8 py-2 flex flex-col gap-2 flex-1">
      {progress ? (
        <div className="flex flex-col gap-1">
          <Progress
            value={overallValue}
            indeterminate={overallValue === undefined}
          />
          <Progress
            value={requestValue}
            indeterminate={requestValue === undefined}
          />
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {progressText}
          </p>
        </div>
      ) : null}
      {readOnly ? null : (
        <div className="flex justify-end">
          <details
            ref={detailsRef}
            className="relative"
            onToggle={() => {
              if (detailsRef.current?.open) {
                detailsRef.current
                  .querySelector<HTMLElement>("button, a")
                  ?.focus();
              }
            }}
          >
            <summary
              className="cursor-pointer select-none bg-gray-300 dark:bg-gray-700 px-2 py-1 rounded"
              aria-label={t("caseActionsMenu")}
            >
              {t("actions")}
            </summary>
            <div
              className="absolute right-0 mt-1 bg-white dark:bg-gray-900 border rounded shadow"
              role="menu"
            >
              <button
                type="button"
                onClick={async () => {
                  await apiFetch(`/api/cases/${caseId}/reanalyze`, {
                    method: "POST",
                  });
                  window.location.reload();
                }}
                className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 w-full text-left"
              >
                {t("rerunAnalysis")}
              </button>
              <button
                type="button"
                onClick={async () => {
                  await apiFetch(`/api/cases/${caseId}/archived`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ archived: !archived }),
                  });
                  window.location.reload();
                }}
                data-testid="archive-case-button"
                className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 w-full text-left"
              >
                {archived ? t("unarchiveCase") : t("archiveCase")}
              </button>
              {disabled ? null : (
                <>
                  {progress ? (
                    <button
                      type="button"
                      onClick={async () => {
                        await apiFetch(`/api/cases/${caseId}/cancel-analysis`, {
                          method: "POST",
                        });
                        window.location.reload();
                      }}
                      className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 w-full text-left"
                    >
                      {t("cancelAnalysis")}
                    </button>
                  ) : null}
                  <Link
                    href={`/cases/${caseId}/compose`}
                    className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    {t("draftEmail")}
                  </Link>
                  {hasOwner ? null : (
                    <Link
                      href={`/cases/${caseId}/ownership`}
                      className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      {t("requestOwnershipInfo")}
                    </Link>
                  )}
                  {hasOwner ? (
                    <Link
                      href={`/cases/${caseId}/notify-owner`}
                      className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      {t("notifyRegisteredOwner")}
                    </Link>
                  ) : null}
                  <button
                    type="button"
                    onClick={async () => {
                      await apiFetch(`/api/cases/${caseId}/closed`, {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ closed: !closed }),
                      });
                      window.location.reload();
                    }}
                    data-testid="close-case-button"
                    className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 w-full text-left"
                  >
                    {closed ? t("reopenCase") : t("closeCase")}
                  </button>
                </>
              )}
              {canDelete ? (
                <button
                  type="button"
                  onClick={async () => {
                    const code = Math.random().toString(36).slice(2, 6);
                    const input = prompt(t("confirmDelete", { code }));
                    if (input === code) {
                      await apiFetch(`/api/cases/${caseId}`, {
                        method: "DELETE",
                      });
                      window.location.href = withBasePath("/cases");
                    }
                  }}
                  data-testid="delete-case-button"
                  className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 w-full text-left"
                >
                  {t("deleteCase")}
                </button>
              ) : null}
            </div>
          </details>
        </div>
      )}
    </div>
  );
}
