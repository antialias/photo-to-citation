"use client";
import { apiFetch } from "@/apiClient";
import { withBasePath } from "@/basePath";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { useTranslation } from "react-i18next";

export default function MultiCaseToolbar({
  caseIds,
  disabled = false,
  hasOwner = false,
  ownershipRequested = false,
}: {
  caseIds: string[];
  disabled?: boolean;
  hasOwner?: boolean;
  ownershipRequested?: boolean;
}) {
  const idsParam = caseIds.join(",");
  const first = caseIds[0];
  const { t } = useTranslation();
  return (
    <div className="bg-gray-100 dark:bg-gray-800 px-8 py-2 flex justify-end">
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
                await Promise.all(
                  caseIds.map((id) =>
                    apiFetch(`/api/cases/${id}/reanalyze`, {
                      method: "POST",
                    }),
                  ),
                );
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
              className="w-full text-left"
            >
              {t("archiveCase")}
            </button>
          </DropdownMenuItem>
          {disabled ? null : (
            <>
              <DropdownMenuItem asChild>
                <Link
                  href={`/cases/${first}/compose?ids=${idsParam}`}
                  className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  {t("draftEmail")}
                </Link>
              </DropdownMenuItem>
              {hasOwner ? null : ownershipRequested ? (
                <DropdownMenuItem asChild>
                  <Link
                    href={`/cases/${first}/ownership-request?ids=${idsParam}`}
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    {t("viewOwnershipRequest")}
                  </Link>
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem asChild>
                  <Link
                    href={`/cases/${first}/ownership?ids=${idsParam}`}
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    {t("requestOwnershipInfo")}
                  </Link>
                </DropdownMenuItem>
              )}
              {hasOwner ? (
                <DropdownMenuItem asChild>
                  <Link
                    href={`/cases/${first}/notify-owner?ids=${idsParam}`}
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700"
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
              className="w-full text-left"
            >
              {t("deleteCase")}
            </button>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
