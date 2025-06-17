"use client";
import { apiFetch } from "@/apiClient";
import { withBasePath } from "@/basePath";
import { Progress } from "@/components/ui/progress";
import type { LlmProgress } from "@/lib/openai";
import Link from "next/link";
import { useRef } from "react";
import useCloseOnOutsideClick from "../useCloseOnOutsideClick";

export default function CaseToolbar({
  caseId,
  disabled = false,
  hasOwner = false,
  progress,
  canDelete = false,
}: {
  caseId: string;
  disabled?: boolean;
  hasOwner?: boolean;
  progress?: LlmProgress | null;
  canDelete?: boolean;
}) {
  const reqText = progress
    ? progress.stage === "upload"
      ? progress.index > 0
        ? `Uploading ${progress.index} of ${progress.total} photos (${Math.floor(
            (progress.index / progress.total) * 100,
          )}%)`
        : "Uploading photos..."
      : progress.done
        ? "Processing results..."
        : `Analyzing... ${progress.received} of ${progress.total} tokens`
    : null;
  const progressText = progress
    ? `${progress.steps ? `Step ${progress.step} of ${progress.steps}: ` : ""}${reqText}`
    : null;

  const requestValue = progress
    ? progress.stage === "upload"
      ? progress.index > 0
        ? (progress.index / progress.total) * 100
        : undefined
      : Math.min((progress.received / progress.total) * 100, 100)
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
      <div className="flex justify-end">
        <details ref={detailsRef} className="relative">
          <summary className="cursor-pointer select-none bg-gray-300 dark:bg-gray-700 px-2 py-1 rounded">
            Actions
          </summary>
          <div className="absolute right-0 mt-1 bg-white dark:bg-gray-900 border rounded shadow">
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
              Re-run Analysis
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
                    Cancel Analysis
                  </button>
                ) : null}
                <Link
                  href={`/cases/${caseId}/compose`}
                  className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  Draft Email to Authorities
                </Link>
                {hasOwner ? null : (
                  <Link
                    href={`/cases/${caseId}/ownership`}
                    className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    Request Ownership Info
                  </Link>
                )}
                {hasOwner ? (
                  <Link
                    href={`/cases/${caseId}/notify-owner`}
                    className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    Notify Registered Owner
                  </Link>
                ) : null}
              </>
            )}
            {canDelete ? (
              <button
                type="button"
                onClick={async () => {
                  const code = Math.random().toString(36).slice(2, 6);
                  const input = prompt(
                    `Type '${code}' to confirm deleting this case.`,
                  );
                  if (input === code) {
                    await apiFetch(`/api/cases/${caseId}`, {
                      method: "DELETE",
                    });
                    window.location.href = withBasePath("/cases");
                  }
                }}
                className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 w-full text-left"
              >
                Delete Case
              </button>
            ) : null}
          </div>
        </details>
      </div>
    </div>
  );
}
