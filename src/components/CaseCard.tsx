"use client";
import MapPreview from "@/app/components/MapPreview";
import type { Case } from "@/lib/caseStore";
import {
  getCasePlateNumber,
  getCasePlateState,
  getOfficialCaseGps,
  getRepresentativePhoto,
} from "@/lib/caseUtils";
import Link from "next/link";
import { useTranslation } from "react-i18next";

export default function CaseCard({
  caseData,
  href,
  onClick,
}: {
  caseData: Case;
  href: string;
  onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
}) {
  const { t } = useTranslation();
  const photo = getRepresentativePhoto(caseData);
  const gps = getOfficialCaseGps(caseData);
  const plate = getCasePlateNumber(caseData);
  const state = getCasePlateState(caseData);

  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex items-start gap-2 p-2 border rounded shadow-sm bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 w-full"
    >
      {photo ? (
        <div className="relative flex-shrink-0 w-20 h-16 overflow-hidden rounded">
          <img
            src={`/uploads/${photo}`}
            alt={t("casePreview")}
            className="object-cover w-full h-full"
            width={80}
            height={60}
            loading="lazy"
          />
          {caseData.photos.length > 1 ? (
            <span className="absolute bottom-1 right-1 bg-black/60 text-white text-xs rounded px-1">
              {caseData.photos.length}
            </span>
          ) : null}
        </div>
      ) : null}
      {gps ? (
        <MapPreview
          lat={gps.lat}
          lon={gps.lon}
          width={80}
          height={60}
          className="flex-shrink-0 w-20 h-16 rounded"
        />
      ) : null}
      <div className="flex flex-col min-w-0 gap-0.5 text-xs">
        <span className="font-semibold text-sm truncate">
          {t("caseLabel", { id: caseData.id })}
        </span>
        {caseData.analysis?.violationType ? (
          <span className="truncate">
            {t("violationLabel", { type: caseData.analysis.violationType })}
          </span>
        ) : null}
        {plate || state ? (
          <span className="truncate">
            {t("plate")} {state ? `${state} ` : ""}
            {plate}
          </span>
        ) : null}
        <span className="text-gray-600 dark:text-gray-400 truncate">
          {new Date(caseData.createdAt).toLocaleDateString()}
        </span>
      </div>
    </Link>
  );
}
