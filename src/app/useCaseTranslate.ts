"use client";
import { useCaseContext } from "./cases/[id]/CaseContext";

export default function useCaseTranslate() {
  const { translate } = useCaseContext();
  return translate;
}
