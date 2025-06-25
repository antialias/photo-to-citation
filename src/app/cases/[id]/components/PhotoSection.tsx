"use client";
import CaseJobList from "@/app/components/CaseJobList";
import { useCaseContext } from "../CaseContext";
import PhotoGallery from "./PhotoGallery";
import PhotoViewer from "./PhotoViewer";

export default function PhotoSection({
  caseId,
  readOnly,
}: { caseId: string; readOnly: boolean }) {
  const {
    caseData,
    selectedPhoto,
    setSelectedPhoto,
    handleUpload,
    fileInputRef,
    hasCamera,
    removePhoto,
    isPhotoReanalysis,
    reanalyzingPhoto,
    requestValue,
    progress,
    progressDescription,
    analysisActive,
    photoNote,
    updatePhotoNote,
    reanalyzePhoto,
  } = useCaseContext();
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
