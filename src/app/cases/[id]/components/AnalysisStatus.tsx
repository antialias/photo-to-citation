"use client";
import AnalysisInfo from "@/app/components/AnalysisInfo";
import { useCaseContext } from "../context/CaseContext";

export default function AnalysisStatus({
  readOnly = false,
}: { readOnly?: boolean }) {
  const {
    caseData,
    updatePlateNumber,
    updatePlateState,
    clearPlateNumber,
    clearPlateState,
    retryAnalysis,
  } = useCaseContext();

  if (!caseData) return null;

  const progress =
    caseData.analysisStatus === "pending" && caseData.analysisProgress
      ? caseData.analysisProgress
      : null;
  const isPhotoReanalysis = false;
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
    : caseData.analysisStatus === "pending"
      ? "Analyzing photo..."
      : "";
  const failureReason = caseData.analysisError
    ? caseData.analysisError === "truncated"
      ? "Analysis failed because the AI response was cut off."
      : caseData.analysisError === "parse"
        ? "Analysis failed due to invalid JSON from the AI."
        : caseData.analysisError === "images"
          ? "Analysis failed because no images were provided or some photo files were missing."
          : "Analysis failed because the AI response did not match the expected format."
    : caseData.analysisStatusCode && caseData.analysisStatusCode >= 400
      ? "Analysis failed. Please try again later."
      : "Analysis failed.";

  if (caseData.analysis) {
    return (
      <AnalysisInfo
        analysis={caseData.analysis}
        onPlateChange={readOnly ? undefined : updatePlateNumber}
        onStateChange={readOnly ? undefined : updatePlateState}
        onClearPlate={readOnly ? undefined : clearPlateNumber}
        onClearState={readOnly ? undefined : clearPlateState}
      />
    );
  }

  if (caseData.analysisStatus === "canceled") {
    return <p className="text-sm text-red-600">Analysis canceled.</p>;
  }

  if (caseData.analysisStatus === "pending" && progress) {
    return (
      <p className="text-sm text-gray-500 dark:text-gray-400">
        {progressDescription}
      </p>
    );
  }

  return (
    <div className="text-sm text-red-600 flex flex-col gap-1">
      <p>{failureReason}</p>
      {readOnly ? null : (
        <button
          type="button"
          onClick={retryAnalysis}
          className="underline w-fit"
        >
          Retry
        </button>
      )}
    </div>
  );
}
