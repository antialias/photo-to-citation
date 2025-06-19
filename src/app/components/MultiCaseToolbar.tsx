"use client";
import { apiFetch } from "@/apiClient";
import { withBasePath } from "@/basePath";
import Link from "next/link";
import { useRef } from "react";
import useCloseOnOutsideClick from "../useCloseOnOutsideClick";

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
  const detailsRef = useRef<HTMLDetailsElement>(null);
  useCloseOnOutsideClick(detailsRef);
  return (
    <div className="bg-gray-100 dark:bg-gray-800 px-8 py-2 flex justify-end">
      <details
        ref={detailsRef}
        className="relative"
        onToggle={() => {
          if (detailsRef.current?.open) {
            detailsRef.current.querySelector<HTMLElement>("button, a")?.focus();
          }
        }}
      >
        <summary
          className="cursor-pointer select-none bg-gray-300 dark:bg-gray-700 px-2 py-1 rounded"
          aria-label="Case actions menu"
        >
          Actions
        </summary>
        <div
          className="absolute right-0 mt-1 bg-white dark:bg-gray-900 border rounded shadow"
          role="menu"
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
            Re-run Analysis
          </button>
          {disabled ? null : (
            <>
              <Link
                href={`/cases/${first}/compose?ids=${idsParam}`}
                className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Draft Email to Authorities
              </Link>
              {hasOwner ? null : (
                <Link
                  href={`/cases/${first}/ownership?ids=${idsParam}`}
                  className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  Request Ownership Info
                </Link>
              )}
              {hasOwner ? (
                <Link
                  href={`/cases/${first}/notify-owner?ids=${idsParam}`}
                  className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  Notify Registered Owner
                </Link>
              ) : null}
            </>
          )}
          <button
            type="button"
            onClick={async () => {
              const code = Math.random().toString(36).slice(2, 6);
              const input = prompt(
                `Type '${code}' to confirm deleting these cases.`,
              );
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
            className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 w-full text-left"
          >
            Delete Cases
          </button>
        </div>
      </details>
    </div>
  );
}
