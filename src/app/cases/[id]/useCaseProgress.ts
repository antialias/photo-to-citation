"use client";
import useCaseAnalysisActive from "@/app/useCaseAnalysisActive";
import type { LlmProgress } from "@/lib/openai";
import { useCaseContext } from "./CaseContext";

export default function useCaseProgress(reanalyzingPhoto: string | null) {
  const { caseId, caseData } = useCaseContext();
  const analysisActive = useCaseAnalysisActive(
    caseId,
    caseData?.public ?? false,
  );

  const progress: LlmProgress | null =
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

  let progressDescription = "";
  if (progress) {
    const prefix = progress.steps
      ? `Step ${progress.step} of ${progress.steps}: `
      : "";
    if (progress.stage === "upload") {
      progressDescription =
        prefix +
        (progress.index > 0
          ? `Uploading ${progress.index} of ${progress.total} photos (${Math.floor((progress.index / progress.total) * 100)}%)`
          : "Uploading photos...");
    } else {
      progressDescription =
        prefix +
        (progress.done
          ? "Processing results..."
          : `Analyzing... ${progress.received} of ${progress.total} tokens`);
    }
  } else if (caseData?.analysisStatus === "pending") {
    progressDescription = "Analyzing photo...";
  } else if (caseData?.analysisStatus === "canceled") {
    progressDescription = "Analysis canceled.";
  } else {
    progressDescription = "Analysis failed.";
  }

  return {
    progress,
    progressDescription,
    requestValue,
    analysisActive,
    isPhotoReanalysis,
  };
}
