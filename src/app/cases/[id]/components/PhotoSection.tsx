"use client";
import CaseJobList from "@/app/components/CaseJobList";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import useCaseTranslate from "../../../useCaseTranslate";
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
  const { i18n } = useTranslation();
  const translate = useCaseTranslate(caseId);
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
  if (!caseData) return null;
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
          onTranslate={(path) => translate(path, i18n.language)}
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
