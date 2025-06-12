import path from "node:path";
import type { Case } from "./caseStore";
import type { ViolationReport } from "./openai";

export function getRepresentativePhoto(
  caseData: Pick<Case, "photos" | "analysis">,
): string {
  if (caseData.analysis?.images) {
    const entries = Object.entries(caseData.analysis.images).sort(
      (a, b) => b[1].representationScore - a[1].representationScore,
    );
    const best = entries[0];
    if (best) {
      const name = best[0];
      const file = caseData.photos.find((p) => path.basename(p) === name);
      if (file) return file;
    }
  }
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

export function getCaseVin(caseData: Case): string | null {
  if (caseData.vin) return caseData.vin;
  const imgs = caseData.analysis?.images
    ? Object.values(caseData.analysis.images)
    : [];
  for (const info of imgs) {
    const vin = info.paperworkInfo?.vehicle?.vin;
    if (vin) return vin;
  }
  return null;
}

export function getCasePlateNumber(caseData: Case): string | null {
  const direct = caseData.analysis?.vehicle?.licensePlateNumber;
  if (direct) return direct;
  const imgs = caseData.analysis?.images
    ? Object.values(caseData.analysis.images)
    : [];
  for (const info of imgs) {
    const plate = info.paperworkInfo?.vehicle?.licensePlateNumber;
    if (plate) return plate;
  }
  return null;
}

export function getCasePlateState(caseData: Case): string | null {
  const direct = caseData.analysis?.vehicle?.licensePlateState;
  if (direct) return direct;
  const imgs = caseData.analysis?.images
    ? Object.values(caseData.analysis.images)
    : [];
  for (const info of imgs) {
    const state = info.paperworkInfo?.vehicle?.licensePlateState;
    if (state) return state;
  }
  return null;
}

export function getCaseOwnerContact(caseData: Case): string | null {
  const imgs = caseData.analysis?.images
    ? Object.values(caseData.analysis.images)
    : [];
  for (const info of imgs) {
    const contact = info.paperworkInfo?.contact;
    if (contact) return contact;
  }
  return null;
}
