"use client";
import AnalysisInfo from "@/app/components/AnalysisInfo";
import { useCaseContext } from "../CaseContext";
import useCaseActions from "../useCaseActions";
import useCaseProgress from "../useCaseProgress";

export default function AnalysisStatus({
  readOnly = false,
}: { readOnly?: boolean }) {
  const { caseData } = useCaseContext();
  const {
    updatePlateNumber,
    updatePlateState,
    clearPlateNumber,
    clearPlateState,
    retryAnalysis,
    reanalyzingPhoto,
  } = useCaseActions();
  const { progress, progressDescription } = useCaseProgress(reanalyzingPhoto);
  if (!caseData) return null;

  const plateNumberOverridden =
    caseData.analysisOverrides?.vehicle?.licensePlateNumber !== undefined;
  const plateStateOverridden =
    caseData.analysisOverrides?.vehicle?.licensePlateState !== undefined;

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
        onClearPlate={
          readOnly
            ? undefined
            : plateNumberOverridden
              ? clearPlateNumber
              : undefined
        }
        onClearState={
          readOnly
            ? undefined
            : plateStateOverridden
              ? clearPlateState
              : undefined
        }
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
      <details>
        <summary className="cursor-pointer underline">More info</summary>
        <p className="mt-1">
          Last attempt: {new Date(caseData.updatedAt).toLocaleString()}
        </p>
        <p className="mt-1">Possible causes:</p>
        <ul className="list-disc ml-4">
          <li>Missing photo files</li>
          <li>Invalid JSON response</li>
          <li>Server error</li>
        </ul>
      </details>
    </div>
  );
}
