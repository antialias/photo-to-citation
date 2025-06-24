"use client";
import CaseToolbar from "@/app/components/CaseToolbar";
import type { Case } from "@/lib/caseStore";
import type { LlmProgress } from "@/lib/openai";
import Link from "next/link";
import { FaShare } from "react-icons/fa";

export default function CaseHeader({
  caseId,
  caseData,
  ownerContact,
  isAdmin,
  readOnly = false,
  violationIdentified,
  progress,
  isPhotoReanalysis,
  copyPublicUrl,
  copied,
}: {
  caseId: string;
  caseData: Case;
  ownerContact?: string | null;
  isAdmin: boolean;
  readOnly?: boolean;
  violationIdentified: boolean;
  progress: LlmProgress | null;
  isPhotoReanalysis: boolean;
  copyPublicUrl: () => Promise<void>;
  copied: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Link href="/cases" className="text-blue-500 underline md:hidden">
          Back to Cases
        </Link>
        <h1 className="text-xl font-semibold">Case {caseData.id}</h1>
        {caseData.public ? (
          <button
            type="button"
            onClick={copyPublicUrl}
            aria-label="Copy public link"
            className="text-blue-500 hover:text-blue-700"
          >
            <FaShare />
          </button>
        ) : null}
        {copied ? (
          <span className="text-sm text-green-600">Copied!</span>
        ) : null}
      </div>
      <CaseToolbar
        caseId={caseId}
        disabled={!violationIdentified}
        hasOwner={Boolean(ownerContact)}
        progress={isPhotoReanalysis ? null : progress}
        canDelete={isAdmin}
        closed={caseData.closed}
        archived={caseData.archived}
        readOnly={readOnly}
      />
    </div>
  );
}
