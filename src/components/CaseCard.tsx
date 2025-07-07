import MapPreview from "@/app/components/MapPreview";
import type { Case } from "@/lib/caseStore";
import {
  getCasePlateNumber,
  getCasePlateState,
  getOfficialCaseGps,
  getRepresentativePhoto,
} from "@/lib/caseUtils";
import { useTranslation } from "react-i18next";
import { css } from "styled-system/css";
import { token } from "styled-system/tokens";

export interface CaseCardProps {
  caseData: Case;
  className?: string;
}

export default function CaseCard({ caseData, className }: CaseCardProps) {
  const { t } = useTranslation();
  const photo = getRepresentativePhoto(caseData);
  const location = getOfficialCaseGps(caseData);
  const plateNumber = getCasePlateNumber(caseData);
  const plateState = getCasePlateState(caseData);
  const status = caseData.archived
    ? t("archived")
    : caseData.closed
      ? t("closed")
      : t("open");
  const styles = {
    container: css({
      display: "grid",
      gridTemplateColumns: "auto auto 1fr",
      alignItems: "center",
      gap: "2",
    }),
    imageWrapper: css({
      position: "relative",
      width: token("sizes.16"),
      height: token("sizes.12"),
      flexShrink: 0,
    }),
    photo: css({ objectFit: "cover", width: "100%", height: "100%" }),
    badge: css({
      position: "absolute",
      bottom: "1",
      right: "1",
      backgroundColor: "rgba(0,0,0,0.75)",
      color: "white",
      fontSize: "xs",
      borderRadius: token("radii.sm"),
      px: "1",
    }),
    map: css({
      width: token("sizes.16"),
      aspectRatio: token("aspectRatios.landscape"),
    }),
    details: css({
      display: "flex",
      flexDirection: "column",
      fontSize: "xs",
      gap: "0.5",
      overflow: "hidden",
    }),
    label: css({
      fontWeight: "semibold",
      fontSize: "sm",
      textOverflow: "ellipsis",
      overflow: "hidden",
      whiteSpace: "nowrap",
    }),
    meta: css({
      color: {
        base: token("colors.gray.500"),
        _dark: token("colors.gray.400"),
      },
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
    }),
    status: css({
      color: {
        base: token("colors.gray.500"),
        _dark: token("colors.gray.400"),
      },
    }),
    updating: css({ color: token("colors.gray.400") }),
  };

  return (
    <div className={`${styles.container} ${className ?? ""}`}>
      {photo ? (
        <div className={styles.imageWrapper}>
          <img
            src={`/uploads/${photo}`}
            alt={t("casePreview")}
            width={64}
            height={48}
            className={styles.photo}
            loading="lazy"
          />
          {caseData.photos.length > 1 ? (
            <span className={styles.badge}>{caseData.photos.length}</span>
          ) : null}
        </div>
      ) : null}
      {location ? (
        <MapPreview
          lat={location.lat}
          lon={location.lon}
          width={96}
          height={72}
          className={styles.map}
        />
      ) : null}
      <div className={styles.details}>
        <span className={styles.label}>
          {t("caseLabel", { id: caseData.id })}
        </span>
        {caseData.analysis?.violationType ? (
          <span className={css({ truncate: true })}>
            {caseData.analysis.violationType}
          </span>
        ) : null}
        {plateNumber || plateState ? (
          <span className={`${styles.meta} ${css({ truncate: true })}`}>
            {plateState ? `${plateState} ` : ""}
            {plateNumber}
          </span>
        ) : null}
        <span className={styles.status}>{status}</span>
        {caseData.analysisStatus === "pending" ? (
          <span className={styles.updating}>{t("updatingAnalysis")}</span>
        ) : null}
      </div>
    </div>
  );
}
