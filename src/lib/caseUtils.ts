import type { Case } from "./caseStore";
import type { ViolationReport } from "./openai";

export function getRepresentativePhoto(caseData: Pick<Case, "photos">): string {
  return [...caseData.photos].sort()[0];
}

export function hasViolation(report?: ViolationReport | null): boolean {
  if (!report) return false;
  if (report.images) {
    const all = Object.values(report.images);
    const hasTrue = all.some((i) => i.violation === true);
    const hasFalse = all.some((i) => i.violation === false);
    if (hasTrue || hasFalse) return hasTrue;
  }
  return Boolean(report.violationType?.trim());
}
