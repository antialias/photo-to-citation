"use client";
import type { LlmProgress } from "@/lib/openai";
import Link from "next/link";

export default function CaseToolbar({
  caseId,
  disabled = false,
  hasOwner = false,
  progress,
}: {
  caseId: string;
  disabled?: boolean;
  hasOwner?: boolean;
  progress?: LlmProgress | null;
}) {
  const progressText = progress
    ? progress.stage === "upload"
      ? `Uploading ${progress.index} of ${progress.total} photos (${Math.floor(
          (progress.index / progress.total) * 100,
        )}%)...`
      : progress.done
        ? "Processing results..."
        : `Analyzing... received ${progress.received} chars`
    : null;
  return (
    <div className="bg-gray-100 dark:bg-gray-800 px-8 py-2 flex flex-col gap-2">
      {progress ? (
        <div className="flex flex-col gap-1">
          <progress
            value={progress.stage === "upload" ? progress.index : undefined}
            max={progress.stage === "upload" ? progress.total : undefined}
            className="w-full"
          />
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {progressText}
          </p>
        </div>
      ) : null}
      <div className="flex justify-end">
        <details className="relative">
          <summary className="cursor-pointer select-none bg-gray-300 dark:bg-gray-700 px-2 py-1 rounded">
            Actions
          </summary>
          <div className="absolute right-0 mt-1 bg-white dark:bg-gray-900 border rounded shadow">
            {disabled ? null : (
              <>
                <button
                  type="button"
                  onClick={async () => {
                    await fetch(`/api/cases/${caseId}/reanalyze`, {
                      method: "POST",
                    });
                    window.location.reload();
                  }}
                  className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 w-full text-left"
                >
                  Re-run Analysis
                </button>
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
                <Link
                  href={`/cases/${caseId}/notify-owner`}
                  className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  Notify Registered Owner
                </Link>
              </>
            )}
            <button
              type="button"
              onClick={async () => {
                const code = Math.random().toString(36).slice(2, 6);
                const input = prompt(
                  `Type '${code}' to confirm deleting this case.`,
                );
                if (input === code) {
                  await fetch(`/api/cases/${caseId}`, { method: "DELETE" });
                  window.location.href = "/cases";
                }
              }}
              className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 w-full text-left"
            >
              Delete Case
            </button>
          </div>
        </details>
      </div>
    </div>
  );
}
