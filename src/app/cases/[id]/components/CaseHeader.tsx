"use client";
import CaseToolbar from "@/app/components/CaseToolbar";
import { getCaseOwnerContact } from "@/lib/caseUtils";
import Link from "next/link";
import { FaShare } from "react-icons/fa";
import { useCaseContext } from "../context/CaseContext";

export default function CaseHeader({
  caseId,
  readOnly = false,
}: { caseId: string; readOnly?: boolean }) {
  const { caseData, analysisActive, isAdmin, copyPublicUrl, copied } =
    useCaseContext();
  const ownerContact = caseData ? getCaseOwnerContact(caseData) : null;
  const violationIdentified = Boolean(
    caseData &&
      caseData.analysisStatus === "complete" &&
      caseData.analysis &&
      caseData.analysis.vehicle,
  );
  const progress =
    caseData?.analysisStatus === "pending" && caseData.analysisProgress
      ? caseData.analysisProgress
      : null;
  const isPhotoReanalysis = Boolean(
    caseData && caseData.analysisStatus === "pending" && analysisActive,
  );
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
