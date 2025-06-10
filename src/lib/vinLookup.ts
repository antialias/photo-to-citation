import { JSDOM } from "jsdom";
import { type Case, updateCase } from "./caseStore";
import { runJob } from "./jobScheduler";

export interface VinSource {
  buildUrl: (plate: string, state: string) => string;
  selector?: string;
}

export const defaultVinSources: VinSource[] = [
  {
    buildUrl: (plate, state) =>
      `https://www.edmunds.com/vehicle/${encodeURIComponent(state)}/${encodeURIComponent(plate)}`,
  },
];

export function parseVinFromHtml(
  html: string,
  selector?: string,
): string | null {
  let content = html;
  if (selector) {
    const dom = new JSDOM(html);
    const el = dom.window.document.querySelector(selector);
    content = el?.textContent ?? "";
  }
  const match = content.toUpperCase().match(/\b[A-HJ-NPR-Z0-9]{17}\b/);
  return match ? match[0] : null;
}

export async function lookupVin(
  plate: string,
  state: string,
  sources: VinSource[] = defaultVinSources,
): Promise<string | null> {
  for (const src of sources) {
    try {
      const url = src.buildUrl(plate, state);
      const res = await fetch(url);
      if (!res.ok) continue;
      const html = await res.text();
      const vin = parseVinFromHtml(html, src.selector);
      if (vin) return vin;
    } catch {
      /* ignore and try next source */
    }
  }
  return null;
}

export async function fetchCaseVin(
  caseData: Case,
  sources: VinSource[] = defaultVinSources,
): Promise<void> {
  const plate = caseData.analysis?.vehicle?.licensePlateNumber;
  const state = caseData.analysis?.vehicle?.licensePlateState;
  if (!plate || !state) return;
  try {
    const vin = await lookupVin(plate, state, sources);
    if (vin) updateCase(caseData.id, { vin });
  } catch (err) {
    console.error("Failed to fetch VIN", err);
  }
}

export function fetchCaseVinInBackground(caseData: Case): void {
  runJob("fetchCaseVin", caseData);
}
