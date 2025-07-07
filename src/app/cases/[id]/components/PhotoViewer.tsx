"use client";
import EditableText from "@/app/components/EditableText";
import ImageHighlights from "@/app/components/ImageHighlights";
import ZoomableImage from "@/app/components/ZoomableImage";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import type { Case } from "@/lib/caseStore";
import type { LlmProgress } from "@/lib/openai";

import { useTranslation } from "react-i18next";
import { css, cx } from "styled-system/css";
import { token } from "styled-system/tokens";

export default function PhotoViewer({
  caseData,
  selectedPhoto,
  progress,
  progressDescription,
  requestValue,
  isPhotoReanalysis,
  reanalyzingPhoto,
  analysisActive,
  readOnly,
  photoNote,
  updatePhotoNote,
  removePhoto,
  reanalyzePhoto,
  onTranslate,
}: {
  caseData: Case;
  selectedPhoto: string;
  progress: LlmProgress | null;
  progressDescription: string;
  requestValue: number | undefined;
  isPhotoReanalysis: boolean;
  reanalyzingPhoto: string | null;
  analysisActive: boolean;
  readOnly: boolean;
  photoNote: string;
  updatePhotoNote: (value: string) => Promise<void>;
  removePhoto: (photo: string) => Promise<void>;
  reanalyzePhoto: (photo: string) => Promise<void>;
  onTranslate: (path: string) => Promise<void>;
}) {
  const { t } = useTranslation();
  const time = caseData.photoTimes[selectedPhoto];
  return (
    <>
      <div className="relative w-full aspect-[3/2] md:max-w-2xl shrink-0">
        <ZoomableImage
          src={`/uploads/${selectedPhoto}`}
          alt={t("casePreview")}
        />
        {isPhotoReanalysis && reanalyzingPhoto === selectedPhoto ? (
          <div className="absolute top-0 left-0 right-0">
            <Progress
              value={requestValue}
              indeterminate={requestValue === undefined}
            />
          </div>
        ) : null}
        {readOnly ? null : (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="absolute top-1 right-1 text-white cursor-pointer select-none bg-black/40 rounded px-1 opacity-70"
                aria-label={t("photoActionsMenu")}
              >
                ⋮
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="mt-1">
              <DropdownMenuItem asChild>
                <button
                  type="button"
                  onClick={() => reanalyzePhoto(selectedPhoto)}
                  className="w-full text-left"
                  disabled={
                    caseData.analysisStatus === "pending" && analysisActive
                  }
                >
                  {t("reanalyzePhoto")}
                </button>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <button
                  type="button"
                  onClick={() => removePhoto(selectedPhoto)}
                  className="w-full text-left"
                >
                  {t("deleteImage")}
                </button>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        {caseData.analysis ? (
          <div className="group absolute bottom-0 left-0 right-0 bg-black/60 text-white p-2 text-sm max-h-20 overflow-hidden hover:max-h-none hover:overflow-visible active:max-h-none active:overflow-visible">
            <div className="space-y-1 line-clamp-4 group-hover:line-clamp-none active:line-clamp-none">
              <ImageHighlights
                analysis={caseData.analysis}
                photo={selectedPhoto}
                onTranslate={(path) => onTranslate(path)}
              />
              {progress ? <p>{progressDescription}</p> : null}
            </div>
          </div>
        ) : (
          <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white p-2 text-sm">
            {progressDescription}
          </div>
        )}
      </div>
      {time ? (
        <p
          className={cx("text-sm", css({ color: token("colors.text-muted") }))}
        >
          {t("taken", { time: new Date(time).toLocaleString() })}
        </p>
      ) : null}
      <p className={cx("text-sm", css({ color: token("colors.text-muted") }))}>
        <span className="font-semibold">{t("note")}</span>{" "}
        {readOnly ? (
          <span>{photoNote || ""}</span>
        ) : (
          <EditableText
            value={photoNote}
            onSubmit={updatePhotoNote}
            onClear={photoNote ? () => updatePhotoNote("") : undefined}
            placeholder={t("add")}
          />
        )}
      </p>
    </>
  );
}
