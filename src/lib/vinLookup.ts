import { randomUUID } from "node:crypto";
import { JSDOM } from "jsdom";
import { type Case, updateCase } from "./caseStore";
import { runJob } from "./jobScheduler";

export interface VinSource {
  buildUrl: (plate: string, state: string) => string;
  method?: string;
  headers?: Record<string, string>;
  buildBody?: (plate: string, state: string) => unknown;
  selector?: string;
  parse?: (text: string) => string | null;
}

export function parseVinFromEdmunds(text: string): string | null {
  try {
    const data = JSON.parse(text) as { vins?: string[] };
    return data.vins?.[0] ?? null;
  } catch {
    return null;
  }
}

export const defaultVinSources: VinSource[] = [
  {
    buildUrl: () =>
      "https://www.edmunds.com/api/partner-offers/vins/search-by-plate",
    method: "POST",
    headers: {
      accept: "*/*",
      "content-type": "application/json",
      origin: "https://www.edmunds.com",
      referer: "https://www.edmunds.com/appraisal/",
    },
    buildBody: (plate, state) => ({
      plateNumber: plate,
      plateState: state,
      quotebackId: randomUUID(),
      createdDateUtc: new Date().toISOString(),
    }),
    parse: parseVinFromEdmunds,
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
      const init: RequestInit = { method: src.method ?? "GET" };
      if (src.headers) init.headers = src.headers;
      if (src.buildBody) {
        const body = src.buildBody(plate, state);
        init.body = typeof body === "string" ? body : JSON.stringify(body);
      }
      const res = await fetch(url, init);
      if (!res.ok) continue;
      const text = await res.text();
      const vin = src.parse
        ? src.parse(text)
        : parseVinFromHtml(text, src.selector);
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
