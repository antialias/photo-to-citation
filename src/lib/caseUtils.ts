function basename(filePath: string): string {
  const parts = filePath.split(/[\\/]/);
  return parts[parts.length - 1];
}
import i18n from "../i18n.server";
import type { Case } from "./caseStore";
import type { ViolationReport } from "./openai";

export function getRepresentativePhoto(
  caseData: Pick<Case, "photos" | "analysis">,
): string | null {
  if (caseData.analysis?.images) {
    const entries = Object.entries(caseData.analysis.images).sort(
      (a, b) => b[1].representationScore - a[1].representationScore,
    );
    const best = entries[0];
    if (best) {
      const name = best[0];
      const file = caseData.photos.find((p) => basename(p) === name);
      if (file) return file;
    }
  }
  const sorted = [...caseData.photos].sort();
  return sorted.length > 0 ? sorted[0] : null;
}

export function getOfficialCaseGps(caseData: Case): Case["gps"] {
  if (caseData.analysis?.images && caseData.photoGps) {
    const entries = Object.entries(caseData.analysis.images).sort(
      (a, b) => b[1].representationScore - a[1].representationScore,
    );
    for (const [name] of entries) {
      const file = caseData.photos.find((p) => basename(p) === name);
      if (file) {
        const gps = caseData.photoGps[file];
        if (gps) return gps;
      }
    }
  }
  if (caseData.photoGps) {
    for (const p of caseData.photos) {
      const g = caseData.photoGps[p];
      if (g) return g;
    }
  }
  return caseData.gps ?? null;
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

export function hasCaseViolation(c: Case): boolean {
  if (c.violationOverride) return true;
  return hasViolation(c.analysis);
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

export function getCaseVehicleMake(caseData: Case): string | null {
  const direct = caseData.analysis?.vehicle?.make;
  if (direct) return direct;
  return null;
}

export function decodeVinYear(vin: string): string | null {
  if (vin.length < 10) return null;
  const codes = "ABCDEFGHJKLMNPRSTVWXY123456789";
  const idx = codes.indexOf(vin[9].toUpperCase());
  if (idx === -1) return null;
  let year = 1980 + idx;
  const current = new Date().getFullYear() + 1;
  while (year + 30 <= current) year += 30;
  return String(year);
}

export function getCaseVehicleYear(caseData: Case): string | null {
  if (caseData.vin) {
    const year = decodeVinYear(caseData.vin);
    if (year) return year;
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

export interface OwnerContactInfo {
  email?: string;
  phone?: string;
  address?: string;
}

function parseContactInfo(text: string): OwnerContactInfo {
  const emailMatch = text.match(
    /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/,
  );
  const phoneMatch = text.match(/\+?\d[\d\s().-]{7,}\d/);
  const lines = text.trim().split(/\n+/);
  let address: string | undefined;
  if (lines.length > 1) {
    address = text.trim();
  }
  return {
    email: emailMatch ? emailMatch[0] : undefined,
    phone: phoneMatch ? phoneMatch[0] : undefined,
    address,
  };
}

export function getCaseOwnerContactInfo(
  caseData: Case,
): OwnerContactInfo | null {
  const contact = getCaseOwnerContact(caseData);
  if (!contact) return null;
  return parseContactInfo(contact);
}

export function getBestViolationPhoto(
  caseData: Pick<Case, "photos" | "analysis">,
): { photo: string; caption?: string } | null {
  const imgs = caseData.analysis?.images ?? {};
  const entries = Object.entries(imgs)
    .filter(([, info]) => info.violation)
    .sort((a, b) => b[1].representationScore - a[1].representationScore);
  const best = entries[0];
  if (!best) return null;
  const [name, info] = best;
  const file = caseData.photos.find((p) => basename(p) === name);
  if (!file) return null;
  const caption =
    typeof info.highlights === "string"
      ? info.highlights
      : (info.highlights?.[i18n.language] ??
        info.highlights?.en ??
        Object.values(info.highlights ?? {})[0]);
  return { photo: file, caption };
}

export function getAnalysisSummary(report: ViolationReport): string {
  const detailText =
    typeof report.details === "string"
      ? report.details
      : (report.details[i18n.language] ??
        report.details.en ??
        Object.values(report.details)[0] ??
        "");
  const parts = [`Violation: ${report.violationType}`, detailText];
  if (report.location) parts.push(`Location: ${report.location}`);
  const plate: string[] = [];
  if (report.vehicle?.licensePlateState)
    plate.push(report.vehicle.licensePlateState);
  if (report.vehicle?.licensePlateNumber)
    plate.push(report.vehicle.licensePlateNumber);
  if (plate.length > 0) parts.push(`Plate: ${plate.join(" ")}`);
  return parts.filter(Boolean).join("\n");
}
