"use client";
import CaseToolbar from "@/app/components/CaseToolbar";
import { useSession } from "@/app/useSession";
import { getCaseOwnerContact, hasViolation } from "@/lib/caseUtils";
import Link from "next/link";
import { FaShare } from "react-icons/fa";
import { useCaseContext } from "../CaseContext";
import useCaseActions from "../useCaseActions";
import useCaseProgress from "../useCaseProgress";

export default function CaseHeader({
  caseId,
  readOnly = false,
}: { caseId: string; readOnly?: boolean }) {
  const { caseData } = useCaseContext();
  if (!caseData) return null;
  const { copied, copyPublicUrl, reanalyzingPhoto } = useCaseActions();
  const { progress, isPhotoReanalysis } = useCaseProgress(reanalyzingPhoto);
  const { data: session } = useSession();
  const isAdmin =
    session?.user?.role === "admin" || session?.user?.role === "superadmin";
  const ownerContact = getCaseOwnerContact(caseData);
  const violationIdentified =
    caseData.analysisStatus === "complete" && hasViolation(caseData.analysis);
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
