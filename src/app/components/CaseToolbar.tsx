"use client";
import { apiFetch } from "@/apiClient";
import { withBasePath } from "@/basePath";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import { caseActions, getCaseActionStatus } from "@/lib/caseActions";
import type { LlmProgress } from "@/lib/openai";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { useCaseContext } from "../cases/[id]/CaseContext";

export default function CaseToolbar({
  caseId,
  disabled = false,
  progress,
  canDelete = false,
  closed = false,
  archived = false,
  violationOverride = false,
  readOnly = false,
}: {
  caseId: string;
  disabled?: boolean;
  progress?: LlmProgress | null;
  canDelete?: boolean;
  closed?: boolean;
  archived?: boolean;
  violationOverride?: boolean;
  readOnly?: boolean;
}) {
  const { t } = useTranslation();
  const { caseData } = useCaseContext();
  const statuses = caseData ? getCaseActionStatus(caseData) : [];
  const canRequestOwnership = statuses.some(
    (s) => s.id === "ownership" && s.applicable,
  );
  const canNotifyOwner = statuses.some(
    (s) => s.id === "notify-owner" && s.applicable,
  );
  const canViewOwnership = statuses.some(
    (s) => s.id === "view-ownership-request" && s.applicable,
  );
  const viewOwnershipUrl = caseData
    ? caseActions
        .find((a) => a.id === "view-ownership-request")
        ?.href(caseId, caseData)
    : null;
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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="cursor-pointer select-none bg-gray-300 dark:bg-gray-700 px-2 py-1 rounded"
                aria-label={t("caseActionsMenu")}
              >
                {t("actions")}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="mt-1">
              <DropdownMenuItem asChild>
                <button
                  type="button"
                  onClick={async () => {
                    await apiFetch(`/api/cases/${caseId}/reanalyze`, {
                      method: "POST",
                    });
                    window.location.reload();
                  }}
                  className="w-full text-left"
                >
                  {t("rerunAnalysis")}
                </button>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
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
                  className="w-full text-left"
                >
                  {archived ? t("unarchiveCase") : t("archiveCase")}
                </button>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <button
                  type="button"
                  onClick={async () => {
                    if (!violationOverride) {
                      const reason = prompt(t("forceViolationReason"));
                      if (reason !== null) {
                        await apiFetch(
                          `/api/cases/${caseId}/violation-override`,
                          {
                            method: "PUT",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ violation: true, reason }),
                          },
                        );
                        window.location.reload();
                      }
                    } else {
                      await apiFetch(
                        `/api/cases/${caseId}/violation-override`,
                        {
                          method: "DELETE",
                        },
                      );
                      window.location.reload();
                    }
                  }}
                  className="w-full text-left"
                >
                  {violationOverride
                    ? t("clearViolationOverride")
                    : t("forceViolation")}
                </button>
              </DropdownMenuItem>
              {disabled ? null : (
                <>
                  {progress ? (
                    <DropdownMenuItem asChild>
                      <button
                        type="button"
                        onClick={async () => {
                          await apiFetch(
                            `/api/cases/${caseId}/cancel-analysis`,
                            {
                              method: "POST",
                            },
                          );
                          window.location.reload();
                        }}
                        className="w-full text-left"
                      >
                        {t("cancelAnalysis")}
                      </button>
                    </DropdownMenuItem>
                  ) : null}
                  <DropdownMenuItem asChild>
                    <Link
                      href={`/cases/${caseId}/compose`}
                      className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      {t("draftEmail")}
                    </Link>
                  </DropdownMenuItem>
                  {canRequestOwnership ? (
                    <DropdownMenuItem asChild>
                      <Link
                        href={`/cases/${caseId}/ownership`}
                        className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        {t("requestOwnershipInfo")}
                      </Link>
                    </DropdownMenuItem>
                  ) : null}
                  {canViewOwnership ? (
                    <DropdownMenuItem asChild>
                      <Link
                        href={viewOwnershipUrl ?? "#"}
                        className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        {t("viewOwnershipRequest")}
                      </Link>
                    </DropdownMenuItem>
                  ) : null}
                  {canNotifyOwner ? (
                    <DropdownMenuItem asChild>
                      <Link
                        href={`/cases/${caseId}/notify-owner`}
                        className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        {t("notifyRegisteredOwner")}
                      </Link>
                    </DropdownMenuItem>
                  ) : null}
                  <DropdownMenuItem asChild>
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
                      className="w-full text-left"
                    >
                      {closed ? t("reopenCase") : t("closeCase")}
                    </button>
                  </DropdownMenuItem>
                </>
              )}
              {canDelete ? (
                <DropdownMenuItem asChild>
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
                    className="w-full text-left"
                  >
                    {t("deleteCase")}
                  </button>
                </DropdownMenuItem>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </div>
  );
}
