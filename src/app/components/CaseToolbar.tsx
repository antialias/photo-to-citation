"use client";
import Link from "next/link";

export default function CaseToolbar({
  caseId,
  disabled = false,
}: {
  caseId: string;
  disabled?: boolean;
}) {
  if (disabled) {
    return (
      <div className="bg-gray-100 px-8 py-2 flex justify-end text-gray-500">
        No actions available
      </div>
    );
  }
  return (
    <div className="bg-gray-100 px-8 py-2 flex justify-end">
      <details className="relative">
        <summary className="cursor-pointer select-none bg-gray-300 px-2 py-1 rounded">
          Actions
        </summary>
        <div className="absolute right-0 mt-1 bg-white border rounded shadow">
          <Link
            href={`/cases/${caseId}/compose`}
            className="block px-4 py-2 hover:bg-gray-100"
          >
            Draft Email to Authorities
          </Link>
          <Link
            href={`/cases/${caseId}/followup`}
            className="block px-4 py-2 hover:bg-gray-100"
          >
            Follow Up with Authorities
          </Link>
          <Link
            href={`/cases/${caseId}/ownership`}
            className="block px-4 py-2 hover:bg-gray-100"
          >
            Request Ownership Info
          </Link>
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
            className="block px-4 py-2 hover:bg-gray-100 w-full text-left"
          >
            Delete Case
          </button>
        </div>
      </details>
    </div>
  );
}
