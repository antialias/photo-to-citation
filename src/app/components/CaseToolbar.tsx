"use client";
import { apiFetch } from "@/apiClient";
import { withBasePath } from "@/basePath";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { menuItem } from "@/components/ui/menuItem";
import { Progress } from "@/components/ui/progress";
import type { LlmProgress } from "@/lib/openai";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { css } from "styled-system/css";
import { token } from "styled-system/tokens";

export default function CaseToolbar({
  caseId,
  disabled = false,
  hasOwner = false,
  progress,
  canDelete = false,
  closed = false,
  archived = false,
  violationOverride = false,
  readOnly = false,
  ownershipRequested = false,
  ownershipRequestLink,
}: {
  caseId: string;
  disabled?: boolean;
  hasOwner?: boolean;
  progress?: LlmProgress | null;
  canDelete?: boolean;
  closed?: boolean;
  archived?: boolean;
  violationOverride?: boolean;
  readOnly?: boolean;
  ownershipRequested?: boolean;
  ownershipRequestLink?: string | null;
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
  const styles = {
    wrapper: css({
      bg: token("colors.surface-subtle"),
      px: "8",
      py: "2",
      display: "flex",
      flexDirection: "column",
      gap: "2",
      flex: 1,
    }),
    progressWrapper: css({
      display: "flex",
      flexDirection: "column",
      gap: "1",
    }),
    progressText: css({ fontSize: "sm", color: token("colors.text-muted") }),
    actionsRow: css({ display: "flex", justifyContent: "flex-end" }),
    actionButton: css({
      cursor: "pointer",
      userSelect: "none",
      bg: { base: "gray.300", _dark: "gray.700" },
      px: "2",
      py: "1",
      borderRadius: token("radii.md"),
    }),
    dropdownContent: css({ mt: "1" }),
  };
  return (
    <div className={styles.wrapper}>
      {progress ? (
        <div className={styles.progressWrapper}>
          <Progress
            value={overallValue}
            indeterminate={overallValue === undefined}
          />
          <Progress
            value={requestValue}
            indeterminate={requestValue === undefined}
          />
          <p className={styles.progressText}>{progressText}</p>
        </div>
      ) : null}
      {readOnly ? null : (
        <div className={styles.actionsRow}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className={styles.actionButton}
                aria-label={t("caseActionsMenu")}
              >
                {t("actions")}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className={styles.dropdownContent}>
              <DropdownMenuItem asChild>
                <button
                  type="button"
                  onClick={async () => {
                    await apiFetch(`/api/cases/${caseId}/reanalyze`, {
                      method: "POST",
                    });
                    window.location.reload();
                  }}
                  className={menuItem()}
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
                  className={menuItem()}
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
                  className={menuItem()}
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
                        className={menuItem()}
                      >
                        {t("cancelAnalysis")}
                      </button>
                    </DropdownMenuItem>
                  ) : null}
                  <DropdownMenuItem asChild>
                    <Link
                      href={`/cases/${caseId}/compose`}
                      className={menuItem()}
                    >
                      {t("draftEmail")}
                    </Link>
                  </DropdownMenuItem>
                  {hasOwner ? null : ownershipRequested ? (
                    <DropdownMenuItem asChild>
                      <Link
                        href={
                          ownershipRequestLink ??
                          `/cases/${caseId}/ownership-request`
                        }
                        className={menuItem()}
                      >
                        {t("viewOwnershipRequest")}
                      </Link>
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem asChild>
                      <Link
                        href={`/cases/${caseId}/ownership`}
                        className={menuItem()}
                      >
                        {t("requestOwnershipInfo")}
                      </Link>
                    </DropdownMenuItem>
                  )}
                  {hasOwner ? (
                    <DropdownMenuItem asChild>
                      <Link
                        href={`/cases/${caseId}/notify-owner`}
                        className={menuItem()}
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
                      className={menuItem()}
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
                    className={menuItem()}
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
