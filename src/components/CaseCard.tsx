import MapPreview from "@/app/components/MapPreview";
import type { Case } from "@/lib/caseStore";
import {
  getCasePlateNumber,
  getCasePlateState,
  getOfficialCaseGps,
  getRepresentativePhoto,
} from "@/lib/caseUtils";
import { useTranslation } from "react-i18next";

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
  return (
    <div
      className={`grid grid-cols-[auto_auto_1fr] items-center gap-2 ${className ?? ""}`}
    >
      {photo ? (
        <div className="relative w-16 h-12 shrink-0">
          <img
            src={`/uploads/${photo}`}
            alt={t("casePreview")}
            width={64}
            height={48}
            className="object-cover w-full h-full"
            loading="lazy"
          />
          {caseData.photos.length > 1 ? (
            <span className="absolute bottom-1 right-1 bg-black/75 text-white text-xs rounded px-1">
              {caseData.photos.length}
            </span>
          ) : null}
        </div>
      ) : null}
      {location ? (
        <MapPreview
          lat={location.lat}
          lon={location.lon}
          width={96}
          height={72}
          className="w-16 aspect-[4/3]"
        />
      ) : null}
      <div className="flex flex-col text-xs gap-0.5 overflow-hidden">
        <span className="font-semibold text-sm truncate">
          {t("caseLabel", { id: caseData.id })}
        </span>
        {caseData.analysis?.violationType ? (
          <span className="truncate">{caseData.analysis.violationType}</span>
        ) : null}
        {plateNumber || plateState ? (
          <span className="text-gray-500 dark:text-gray-400 truncate">
            {plateState ? `${plateState} ` : ""}
            {plateNumber}
          </span>
        ) : null}
        <span className="text-gray-500 dark:text-gray-400">{status}</span>
        {caseData.analysisStatus === "pending" ? (
          <span className="text-gray-400">{t("updatingAnalysis")}</span>
        ) : null}
      </div>
    </div>
  );
}
