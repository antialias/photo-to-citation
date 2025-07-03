"use client";
import { apiFetch } from "@/apiClient";
import { withBasePath } from "@/basePath";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import Link from "next/link";
import { useTranslation } from "react-i18next";

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
  return (
    <div className="bg-gray-100 dark:bg-gray-800 px-8 py-2 flex justify-end">
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <button
            type="button"
            className="cursor-pointer select-none bg-gray-300 dark:bg-gray-700 px-2 py-1 rounded"
            aria-label={t("caseActionsMenu")}
          >
            {t("actions")}
          </button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Content
          className="bg-white dark:bg-gray-900 border rounded shadow mt-1"
          align="end"
        >
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
            className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 w-full text-left"
          >
            {t("rerunAnalysis")}
          </button>
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
            className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 w-full text-left"
          >
            {t("archiveCase")}
          </button>
          {disabled ? null : (
            <>
              <Link
                href={`/cases/${first}/compose?ids=${idsParam}`}
                className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                {t("draftEmail")}
              </Link>
              {hasOwner ? null : (
                <Link
                  href={`/cases/${first}/ownership?ids=${idsParam}`}
                  className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  {t("requestOwnershipInfo")}
                </Link>
              )}
              {hasOwner ? (
                <Link
                  href={`/cases/${first}/notify-owner?ids=${idsParam}`}
                  className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  {t("notifyRegisteredOwner")}
                </Link>
              ) : null}
            </>
          )}
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
            className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 w-full text-left"
          >
            {t("deleteCase")}
          </button>
        </DropdownMenu.Content>
      </DropdownMenu.Root>
    </div>
  );
}
