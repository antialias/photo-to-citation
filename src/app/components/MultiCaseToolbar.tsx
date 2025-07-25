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
import { radii } from "@/styleTokens";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { css } from "styled-system/css";
import { token } from "styled-system/tokens";

export default function MultiCaseToolbar({
  caseIds,
  disabled = false,
  hasOwner = false,
}: {
  caseIds: string[];
  disabled?: boolean;
  hasOwner?: boolean;
}) {
  const idsParam = caseIds.join(",");
  const first = caseIds[0];
  const { t } = useTranslation();
  const styles = {
    container: css({
      bg: token("colors.surface-subtle"),
      px: "8",
      py: "2",
      display: "flex",
      justifyContent: "flex-end",
    }),
    trigger: css({
      cursor: "pointer",
      userSelect: "none",
      bg: { base: "gray.300", _dark: "gray.700" },
      px: "2",
      py: "1",
      borderRadius: radii.default,
    }),
    menu: css({ mt: "1" }),
  };

  return (
    <div className={styles.container}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className={styles.trigger}
            aria-label={t("caseActionsMenu")}
          >
            {t("actions")}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className={styles.menu}>
          <DropdownMenuItem asChild>
            <button
              type="button"
              onClick={async () => {
                await Promise.all(
                  caseIds.map((id) =>
                    apiFetch(`/api/cases/${id}/reanalyze`, {
                      method: "POST",
                    }),
                  ),
                );
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
                await Promise.all(
                  caseIds.map((id) =>
                    apiFetch(`/api/cases/${id}/archived`, {
                      method: "PUT",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ archived: true }),
                    }),
                  ),
                );
                window.location.reload();
              }}
              className={menuItem()}
            >
              {t("archiveCase")}
            </button>
          </DropdownMenuItem>
          {disabled ? null : (
            <>
              <DropdownMenuItem asChild>
                <Link
                  href={`/cases/${first}/compose?ids=${idsParam}`}
                  className={menuItem()}
                >
                  {t("draftEmail")}
                </Link>
              </DropdownMenuItem>
              {hasOwner ? null : (
                <DropdownMenuItem asChild>
                  <Link
                    href={`/cases/${first}/ownership?ids=${idsParam}`}
                    className={menuItem()}
                  >
                    {t("requestOwnershipInfo")}
                  </Link>
                </DropdownMenuItem>
              )}
              {hasOwner ? (
                <DropdownMenuItem asChild>
                  <Link
                    href={`/cases/${first}/notify-owner?ids=${idsParam}`}
                    className={menuItem()}
                  >
                    {t("notifyRegisteredOwner")}
                  </Link>
                </DropdownMenuItem>
              ) : null}
            </>
          )}
          <DropdownMenuItem asChild>
            <button
              type="button"
              onClick={async () => {
                const code = Math.random().toString(36).slice(2, 6);
                const input = prompt(t("confirmDelete", { code }));
                if (input === code) {
                  await Promise.all(
                    caseIds.map((id) =>
                      apiFetch(`/api/cases/${id}`, {
                        method: "DELETE",
                      }),
                    ),
                  );
                  window.location.href = withBasePath("/cases");
                }
              }}
              data-testid="delete-cases-button"
              className={menuItem()}
            >
              {t("deleteCase")}
            </button>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
