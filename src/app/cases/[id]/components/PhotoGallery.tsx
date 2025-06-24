"use client";
import AddImageMenu from "@/app/components/AddImageMenu";
import DebugWrapper from "@/app/components/DebugWrapper";
import ThumbnailImage from "@/components/thumbnail-image";
import { Progress } from "@/components/ui/progress";
import type { Case } from "@/lib/caseStore";
import { getThumbnailUrl } from "@/lib/clientThumbnails";
import { baseName } from "../utils";

export default function PhotoGallery({
  caseId,
  caseData,
  selectedPhoto,
  setSelectedPhoto,
  handleUpload,
  fileInputRef,
  hasCamera,
  removePhoto,
  readOnly,
  isPhotoReanalysis,
  reanalyzingPhoto,
  requestValue,
}: {
  caseId: string;
  caseData: Case;
  selectedPhoto: string | null;
  setSelectedPhoto: (photo: string) => void;
  handleUpload: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  fileInputRef: React.RefObject<HTMLInputElement> | null;
  hasCamera: boolean;
  removePhoto: (photo: string) => Promise<void>;
  readOnly: boolean;
  isPhotoReanalysis: boolean;
  reanalyzingPhoto: string | null;
  requestValue: number | undefined;
}) {
  const analysisImages = caseData.analysis?.images ?? {};
  const evidencePhotos = caseData.photos.filter(
    (p) => !analysisImages[baseName(p)]?.paperwork,
  );
  return (
    <div className="flex gap-2 flex-wrap">
      {evidencePhotos.map((p) => {
        const info = {
          url: p,
          takenAt: caseData.photoTimes[p] ?? null,
          gps: caseData.photoGps?.[p] ?? null,
          analysis: analysisImages[baseName(p)] ?? null,
        };
        return (
          <DebugWrapper key={p} data={info}>
            <div className="relative group">
              <button
                type="button"
                onClick={() => setSelectedPhoto(p)}
                className={
                  selectedPhoto === p
                    ? "ring-2 ring-blue-500"
                    : "ring-1 ring-transparent"
                }
              >
                <div className="relative w-20 aspect-[4/3]">
                  <ThumbnailImage
                    src={getThumbnailUrl(p, 128)}
                    alt="case photo"
                    width={80}
                    height={60}
                    imgClassName="object-contain"
                  />
                  {isPhotoReanalysis && reanalyzingPhoto === p ? (
                    <div className="absolute top-0 left-0 right-0">
                      <Progress
                        value={requestValue}
                        indeterminate={requestValue === undefined}
                      />
                    </div>
                  ) : null}
                </div>
                {(() => {
                  const t = caseData.photoTimes[p];
                  return t ? (
                    <span className="absolute bottom-1 left-1 bg-black/60 text-white text-xs rounded px-1">
                      {new Date(t).toLocaleDateString()}
                    </span>
                  ) : null;
                })()}
              </button>
              {readOnly ? null : (
                <button
                  type="button"
                  onClick={() => removePhoto(p)}
                  className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  ×
                </button>
              )}
            </div>
          </DebugWrapper>
        );
      })}
      {readOnly ? null : (
        <AddImageMenu
          caseId={caseId}
          hasCamera={hasCamera}
          fileInputRef={fileInputRef}
          onChange={handleUpload}
        />
      )}
    </div>
  );
}
