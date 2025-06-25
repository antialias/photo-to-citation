"use client";
import EditableText from "@/app/components/EditableText";
import ImageHighlights from "@/app/components/ImageHighlights";
import useCloseOnOutsideClick from "@/app/useCloseOnOutsideClick";
import PinchZoom from "@/components/PinchZoom";
import { Progress } from "@/components/ui/progress";
import type { Case } from "@/lib/caseStore";
import type { LlmProgress } from "@/lib/openai";
import Image from "next/image";
import { useRef } from "react";

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
  reanalyzePhoto: (
    photo: string,
    detailsEl?: HTMLDetailsElement | null,
  ) => Promise<void>;
}) {
  const photoMenuRef = useRef<HTMLDetailsElement>(null);
  useCloseOnOutsideClick(photoMenuRef);
  const t = caseData.photoTimes[selectedPhoto];
  return (
    <>
      <div className="relative w-full aspect-[3/2] md:max-w-2xl shrink-0">
        <PinchZoom className="absolute inset-0">
          <Image
            src={selectedPhoto}
            alt="uploaded"
            fill
            className="object-contain"
            draggable={false}
          />
        </PinchZoom>
        {isPhotoReanalysis && reanalyzingPhoto === selectedPhoto ? (
          <div className="absolute top-0 left-0 right-0">
            <Progress
              value={requestValue}
              indeterminate={requestValue === undefined}
            />
          </div>
        ) : null}
        {readOnly ? null : (
          <details
            ref={photoMenuRef}
            className="absolute top-1 right-1 text-white"
            onToggle={() => {
              if (photoMenuRef.current?.open) {
                photoMenuRef.current
                  .querySelector<HTMLElement>("button, a")
                  ?.focus();
              }
            }}
          >
            <summary
              className="cursor-pointer select-none bg-black/40 rounded px-1 opacity-70"
              aria-label="Photo actions menu"
            >
              ⋮
            </summary>
            <div
              className="absolute right-0 mt-1 bg-white dark:bg-gray-900 border rounded shadow text-black dark:text-white"
              role="menu"
            >
              <button
                type="button"
                onClick={(e) =>
                  reanalyzePhoto(
                    selectedPhoto,
                    e.currentTarget.closest("details"),
                  )
                }
                className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 w-full text-left"
                disabled={
                  caseData.analysisStatus === "pending" && analysisActive
                }
              >
                Reanalyze Photo
              </button>
              <button
                type="button"
                onClick={() => removePhoto(selectedPhoto)}
                className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 w-full text-left"
              >
                Delete Image
              </button>
            </div>
          </details>
        )}
        {caseData.analysis ? (
          <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white p-2 space-y-1 text-sm">
            <ImageHighlights
              analysis={caseData.analysis}
              photo={selectedPhoto}
            />
            {progress ? <p>{progressDescription}</p> : null}
          </div>
        ) : (
          <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white p-2 text-sm">
            {progressDescription}
          </div>
        )}
      </div>
      {t ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Taken {new Date(t).toLocaleString()}
        </p>
      ) : null}
      <p className="text-sm text-gray-500 dark:text-gray-400">
        <span className="font-semibold">Note:</span>{" "}
        {readOnly ? (
          <span>{photoNote || ""}</span>
        ) : (
          <EditableText
            value={photoNote}
            onSubmit={updatePhotoNote}
            onClear={photoNote ? () => updatePhotoNote("") : undefined}
            placeholder="Add note"
          />
        )}
      </p>
    </>
  );
}
