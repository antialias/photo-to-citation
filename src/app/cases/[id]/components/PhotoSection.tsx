"use client";
import CaseJobList from "@/app/components/CaseJobList";
import type { Case } from "@/lib/caseStore";
import type { LlmProgress } from "@/lib/openai";
import PhotoGallery from "./PhotoGallery";
import PhotoViewer from "./PhotoViewer";

export default function PhotoSection({
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
  progress,
  progressDescription,
  analysisActive,
  photoNote,
  updatePhotoNote,
  reanalyzePhoto,
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
  progress: LlmProgress | null;
  progressDescription: string;
  analysisActive: boolean;
  photoNote: string;
  updatePhotoNote: (value: string) => Promise<void>;
  reanalyzePhoto: (
    photo: string,
    detailsEl?: HTMLDetailsElement | null,
  ) => Promise<void>;
}) {
  return (
    <>
      <CaseJobList caseId={caseId} isPublic={caseData.public} />
      {selectedPhoto ? (
        <PhotoViewer
          caseData={caseData}
          selectedPhoto={selectedPhoto}
          progress={progress}
          progressDescription={progressDescription}
          requestValue={requestValue}
          isPhotoReanalysis={isPhotoReanalysis}
          reanalyzingPhoto={reanalyzingPhoto}
          analysisActive={analysisActive}
          readOnly={readOnly}
          photoNote={photoNote}
          updatePhotoNote={updatePhotoNote}
          removePhoto={removePhoto}
          reanalyzePhoto={reanalyzePhoto}
        />
      ) : null}
      <PhotoGallery
        caseId={caseId}
        caseData={caseData}
        selectedPhoto={selectedPhoto}
        setSelectedPhoto={setSelectedPhoto}
        handleUpload={handleUpload}
        fileInputRef={fileInputRef}
        hasCamera={hasCamera}
        removePhoto={removePhoto}
        readOnly={readOnly}
        isPhotoReanalysis={isPhotoReanalysis}
        reanalyzingPhoto={reanalyzingPhoto}
        requestValue={requestValue}
      />
    </>
  );
}
