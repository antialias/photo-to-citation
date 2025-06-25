"use client";
import { useCaseContext } from "../context/CaseContext";
import PhotoGallery from "./PhotoGallery";
import PhotoViewer from "./PhotoViewer";

export default function PhotoSection({
  readOnly = false,
}: { readOnly?: boolean }) {
  const {
    caseId,
    caseData,
    selectedPhoto,
    setSelectedPhoto,
    handleUpload,
    fileInputRef,
    hasCamera,
    removePhoto,
    reanalyzePhoto,
    reanalyzingPhoto,
    photoNote,
    updatePhotoNote,
    analysisActive,
  } = useCaseContext();

  if (!caseData) return null;

  const progress =
    caseData?.analysisStatus === "pending" && caseData.analysisProgress
      ? caseData.analysisProgress
      : null;
  const isPhotoReanalysis = Boolean(
    reanalyzingPhoto && caseData?.analysisStatus === "pending",
  );
  const requestValue = progress
    ? progress.stage === "upload"
      ? progress.index > 0
        ? (progress.index / progress.total) * 100
        : undefined
      : Math.min((progress.received / progress.total) * 100, 100)
    : undefined;
  const progressDescription = progress
    ? `${progress.steps ? `Step ${progress.step} of ${progress.steps}: ` : ""}${
        progress.stage === "upload"
          ? progress.index > 0
            ? `Uploading ${progress.index} of ${progress.total} photos (${Math.floor(
                (progress.index / progress.total) * 100,
              )}%)`
            : "Uploading photos..."
          : progress.done
            ? "Processing results..."
            : `Analyzing... ${progress.received} of ${progress.total} tokens`
      }`
    : caseData?.analysisStatus === "pending"
      ? "Analyzing photo..."
      : "";

  return (
    <>
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
