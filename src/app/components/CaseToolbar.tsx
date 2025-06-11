"use client";
import Link from "next/link";

export default function CaseToolbar({ caseId }: { caseId: string }) {
  return (
    <div className="bg-gray-100 px-8 py-2 flex justify-end">
      <details className="relative">
        <summary className="cursor-pointer select-none bg-gray-300 px-2 py-1 rounded">
          Actions
        </summary>
        <div className="absolute right-0 mt-1 bg-white border rounded shadow">
          <Link
            href={`/cases/${caseId}/draft`}
            className="block px-4 py-2 hover:bg-gray-100"
          >
            Draft Email to Authorities
          </Link>
        </div>
      </details>
    </div>
  );
}
