import type { Case } from "./caseStore";
import type { ViolationReport } from "./openai";

export function getRepresentativePhoto(caseData: Pick<Case, "photos">): string {
  return [...caseData.photos].sort()[0];
}

export function hasViolation(
  report?: Pick<ViolationReport, "violationType"> | null,
): boolean {
  if (!report) return false;
  const normalized = (report.violationType || "").trim().toLowerCase();
  if (!normalized) return false;
  const negatives = [
    "none",
    "n/a",
    "na",
    "no violation",
    "no violation detected",
    "no apparent violation",
    "not a violation",
    "unknown",
  ];
  return !negatives.some(
    (n) => normalized === n || normalized.startsWith(`${n} `),
  );
}
