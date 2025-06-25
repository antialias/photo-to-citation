"use client";
import AnalysisInfo from "@/app/components/AnalysisInfo";
import type { Case } from "@/lib/caseStore";
import type { LlmProgress } from "@/lib/openai";

export default function AnalysisStatus({
  caseData,
  progress,
  readOnly,
  plateNumberOverridden,
  plateStateOverridden,
  updatePlateNumber,
  updatePlateState,
  clearPlateNumber,
  clearPlateState,
  retryAnalysis,
}: {
  caseData: Case;
  progress: LlmProgress | null;
  readOnly: boolean;
  plateNumberOverridden: boolean;
  plateStateOverridden: boolean;
  updatePlateNumber: (v: string) => Promise<void>;
  updatePlateState: (v: string) => Promise<void>;
  clearPlateNumber: () => Promise<void>;
  clearPlateState: () => Promise<void>;
  retryAnalysis: () => Promise<void>;
}) {
  const progressDescription = progress
    ? `${progress.steps ? `Step ${progress.step} of ${progress.steps}: ` : ""}${
        progress.stage === "upload"
          ? progress.index > 0
            ? `Uploading ${progress.index} of ${progress.total} photos (${Math.floor((progress.index / progress.total) * 100)}%)`
            : "Uploading photos..."
          : progress.done
            ? "Processing results..."
            : `Analyzing... ${progress.received} of ${progress.total} tokens`
      }`
    : caseData.analysisStatus === "pending"
      ? "Analyzing photo..."
      : caseData.analysisStatus === "canceled"
        ? "Analysis canceled."
        : "Analysis failed.";

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
