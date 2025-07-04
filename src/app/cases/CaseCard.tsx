"use client";
import ThumbnailImage from "@/components/thumbnail-image";
import type { Case } from "@/lib/caseStore";
import {
  getCasePlateNumber,
  getCasePlateState,
  getOfficialCaseGps,
  getRepresentativePhoto,
} from "@/lib/caseUtils";
import { getThumbnailUrl } from "@/lib/clientThumbnails";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { FaMapMarkerAlt } from "react-icons/fa";

export default function CaseCard({
  caseData,
  href,
  selected,
  dropTarget,
  onClick,
  onDragEnter,
  onDragLeave,
}: {
  caseData: Case;
  href: string;
  selected: boolean;
  dropTarget: boolean;
  onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
  onDragEnter?: () => void;
  onDragLeave?: (e: React.DragEvent<HTMLLIElement>) => void;
}) {
  const { t } = useTranslation();
  const photo = getRepresentativePhoto(caseData);
  const plateNum = getCasePlateNumber(caseData);
  const plateState = getCasePlateState(caseData);
  const gps = getOfficialCaseGps(caseData);

  return (
    <li
      onDragEnter={onDragEnter}
      onDragLeave={onDragLeave}
      className={`border rounded-md p-2 h-[150px] overflow-hidden ${
        selected
          ? "bg-gray-100 dark:bg-gray-800 ring-2 ring-blue-500"
          : dropTarget
            ? "ring-2 ring-green-500"
            : "ring-1 ring-transparent"
      }`}
    >
      <Link
        href={href}
        onClick={onClick}
        className="flex gap-2 items-start w-full h-full"
      >
        <div className="relative w-24 aspect-[4/3] flex-shrink-0">
          {photo ? (
            <ThumbnailImage
              src={getThumbnailUrl(photo, 256)}
              alt={t("casePreview")}
              width={96}
              height={72}
              imgClassName="object-cover"
            />
          ) : null}
          {caseData.photos.length > 1 ? (
            <span className="absolute bottom-1 right-1 bg-black/60 text-white text-xs rounded px-1">
              {caseData.photos.length}
            </span>
          ) : null}
        </div>
        <div className="flex flex-col gap-1 text-sm overflow-hidden flex-1">
          <span className="font-semibold truncate">
            {t("caseLabel", { id: caseData.id })}
          </span>
          {caseData.analysis ? (
            <span className="truncate">{caseData.analysis.violationType}</span>
          ) : (
            <span className="text-gray-500 dark:text-gray-400">
              {t("analyzingPhoto")}
            </span>
          )}
          {plateNum || plateState ? (
            <span className="truncate">
              {plateState ? `${plateState} ` : ""}
              {plateNum}
            </span>
          ) : null}
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {new Date(caseData.createdAt).toLocaleDateString()}
          </span>
          {gps ? (
            <span className="inline-flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 truncate">
              <FaMapMarkerAlt className="w-3 h-3" />
              {gps.lat.toFixed(3)}, {gps.lon.toFixed(3)}
            </span>
          ) : null}
        </div>
      </Link>
    </li>
  );
}
