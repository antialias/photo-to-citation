"use client";
import { useCaseContext } from "./CaseContext";
export default function useCaseProgress() {
  const {
    progress,
    progressDescription,
    requestValue,
    analysisActive,
    isPhotoReanalysis,
  } = useCaseContext();
  return {
    progress,
    progressDescription,
    requestValue,
    analysisActive,
    isPhotoReanalysis,
  };
}
