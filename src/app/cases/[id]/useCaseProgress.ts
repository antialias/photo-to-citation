"use client";
import type { LlmProgress } from "@/lib/openai";
import { useTranslation } from "react-i18next";
import { useCaseContext } from "./CaseContext";

export default function useCaseProgress(reanalyzingPhoto: string | null) {
  const { caseData, analysisActive } = useCaseContext();
  const { t } = useTranslation();

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
      ? `${t("stepPrefix", { step: progress.step, steps: progress.steps })} `
      : "";
    if (progress.stage === "upload") {
      progressDescription =
        prefix +
        (progress.index > 0
          ? t("uploadingProgress", {
              index: progress.index,
              total: progress.total,
              percent: Math.floor((progress.index / progress.total) * 100),
              count: progress.total,
            })
          : t("uploadingPhotos"));
    } else {
      progressDescription =
        prefix +
        (progress.done
          ? t("processingResults")
          : t("analyzingTokens", {
              received: progress.received,
              total: progress.total,
            }));
    }
  } else if (caseData?.analysisStatus === "pending") {
    progressDescription = t("analyzingPhoto");
  } else if (caseData?.analysisStatus === "canceled") {
    progressDescription = t("analysisCanceled");
  } else {
    progressDescription = t("analysisFailed");
  }

  return {
    progress,
    progressDescription,
    requestValue,
    analysisActive,
    isPhotoReanalysis,
  };
}
