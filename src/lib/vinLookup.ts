import { type Case, updateCase } from "./caseStore";
import { runJob } from "./jobScheduler";

export function parseVinFromHtml(html: string): string | null {
  const match = html.toUpperCase().match(/\b[A-HJ-NPR-Z0-9]{17}\b/);
  return match ? match[0] : null;
}

export async function lookupVin(
  plate: string,
  state: string,
): Promise<string | null> {
  const url = `https://www.carfax.com/vehicle/${encodeURIComponent(
    state,
  )}/${encodeURIComponent(plate)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`VIN lookup failed: ${res.status}`);
  const html = await res.text();
  return parseVinFromHtml(html);
}

export async function fetchCaseVin(caseData: Case): Promise<void> {
  const plate = caseData.analysis?.vehicle?.licensePlateNumber;
  const state = caseData.analysis?.vehicle?.licensePlateState;
  if (!plate || !state) return;
  try {
    const vin = await lookupVin(plate, state);
    if (vin) updateCase(caseData.id, { vin });
  } catch (err) {
    console.error("Failed to fetch VIN", err);
  }
}

export function fetchCaseVinInBackground(caseData: Case): void {
  runJob("fetchCaseVin", caseData);
}
