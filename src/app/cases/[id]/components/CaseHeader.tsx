"use client";
import CaseToolbar from "@/app/components/CaseToolbar";
import { useSession } from "@/app/useSession";
import { getCaseActionStatus } from "@/lib/caseActions";
import {
  getCaseOwnerContact,
  getLatestOwnershipRequestLink,
  hasCaseViolation,
} from "@/lib/caseUtils";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { FaArrowLeft, FaShare } from "react-icons/fa";
import { css } from "styled-system/css";
import { token } from "styled-system/tokens";
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
  const statuses = getCaseActionStatus(caseData);
  const viewRequestStatus = statuses.find(
    (s) => s.id === "view-ownership-request",
  );
  const ownershipRequested = Boolean(viewRequestStatus?.applicable);
  const ownershipRequestLink = ownershipRequested
    ? getLatestOwnershipRequestLink(caseData)
    : null;
  const styles = {
    wrapper: css({
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
    }),
    left: css({ display: "flex", alignItems: "center", gap: "2" }),
    backLink: css({
      display: { md: "none" },
      fontSize: "xl",
      p: "2",
      color: "blue.500",
      _hover: { color: "blue.700" },
    }),
    heading: css({ fontSize: "xl", fontWeight: "semibold" }),
    shareButton: css({ color: "blue.500", _hover: { color: "blue.700" } }),
    copied: css({ fontSize: "sm", color: "green.600" }),
  };
  return (
    <div className={styles.wrapper}>
      <div className={styles.left}>
        <Link
          href="/cases"
          aria-label={t("backToCases")}
          className={styles.backLink}
        >
          <FaArrowLeft />
        </Link>
        <h1 className={styles.heading}>
          {t("caseLabel", { id: caseData.id })}
        </h1>
        {caseData.public ? (
          <button
            type="button"
            onClick={copyPublicUrl}
            aria-label={t("copyPublicLink")}
            className={styles.shareButton}
          >
            <FaShare />
          </button>
        ) : null}
        {copied ? <span className={styles.copied}>{t("copied")}</span> : null}
      </div>
      <CaseToolbar
        caseId={caseId}
        disabled={!violationIdentified}
        hasOwner={Boolean(ownerContact)}
        ownershipRequested={ownershipRequested}
        ownershipRequestLink={ownershipRequestLink}
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
