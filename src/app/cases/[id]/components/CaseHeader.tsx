"use client";
import CaseToolbar from "@/app/components/CaseToolbar";
import { useSession } from "@/app/useSession";
import { getCaseOwnerContact, hasCaseViolation } from "@/lib/caseUtils";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { FaArrowLeft, FaShare } from "react-icons/fa";
import { useCaseContext } from "../CaseContext";
import useCaseActions from "../useCaseActions";
import useCaseProgress from "../useCaseProgress";

export default function CaseHeader({
  caseId,
  readOnly = false,
}: { caseId: string; readOnly?: boolean }) {
  const { caseData } = useCaseContext();
  const { copied, copyPublicUrl, reanalyzingPhoto } = useCaseActions();
  const { progress, isPhotoReanalysis } = useCaseProgress(reanalyzingPhoto);
  const { data: session } = useSession();
  const { t } = useTranslation();
  if (!caseData) return null;
  const isAdmin =
    session?.user?.role === "admin" || session?.user?.role === "superadmin";
  const ownerContact = getCaseOwnerContact(caseData);
  const violationIdentified =
    caseData.analysisStatus === "complete" && hasCaseViolation(caseData);
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Link
          href="/cases"
          aria-label={t("backToCases")}
          className="md:hidden text-xl p-2 text-blue-500 hover:text-blue-700"
        >
          <FaArrowLeft />
        </Link>
        <h1 className="text-xl font-semibold">
          {t("caseLabel", { id: caseData.id })}
        </h1>
        {caseData.public ? (
          <button
            type="button"
            onClick={copyPublicUrl}
            aria-label={t("copyPublicLink")}
            className="text-blue-500 hover:text-blue-700"
          >
            <FaShare />
          </button>
        ) : null}
        {copied ? (
          <span className="text-sm text-green-600">{t("copied")}</span>
        ) : null}
      </div>
      <CaseToolbar
        caseId={caseId}
        disabled={!violationIdentified}
        hasOwner={Boolean(ownerContact)}
        ownershipRequested={Boolean(
          caseData.ownershipRequests && caseData.ownershipRequests.length > 0,
        )}
        progress={isPhotoReanalysis ? null : progress}
        canDelete={isAdmin}
        closed={caseData.closed}
        archived={caseData.archived}
        violationOverride={Boolean(caseData.violationOverride)}
        readOnly={readOnly}
      />
    </div>
  );
}
