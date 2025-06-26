"use client";
import CaseJobList from "@/app/components/CaseJobList";
import { useEffect, useState } from "react";
import { useCaseContext } from "../CaseContext";
import useCaseActions from "../useCaseActions";
import useCaseProgress from "../useCaseProgress";
import PhotoGallery from "./PhotoGallery";
import PhotoViewer from "./PhotoViewer";

export default function PhotoSection({
  caseId,
  readOnly = false,
}: { caseId: string; readOnly?: boolean }) {
  const { caseData, selectedPhoto, setSelectedPhoto, fileInputRef } =
    useCaseContext();
  if (!caseData) return null;
  const {
    handleUpload,
    removePhoto,
    reanalyzePhoto,
    reanalyzingPhoto,
    updatePhotoNote,
  } = useCaseActions();
  const {
    progress,
    progressDescription,
    requestValue,
    analysisActive,
    isPhotoReanalysis,
  } = useCaseProgress(reanalyzingPhoto);
  const [hasCamera, setHasCamera] = useState(false);
  useEffect(() => {
    if (
      "mediaDevices" in navigator &&
      typeof navigator.mediaDevices.getUserMedia === "function" &&
      (location.protocol === "https:" || location.hostname === "localhost")
    ) {
      setHasCamera(true);
    }
  }, []);
  const photoNote = selectedPhoto
    ? caseData.photoNotes?.[selectedPhoto] || ""
    : "";
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
          updatePhotoNote={(v) => updatePhotoNote(selectedPhoto, v)}
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
