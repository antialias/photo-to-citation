import { JSDOM } from "jsdom";
import type { Case } from "./caseStore";
import { updateCase } from "./caseStore";
import { runJob } from "./jobScheduler";
import { log } from "./logger";
import {
  type VinSource,
  defaultVinSources,
  getVinSourceStatuses,
  recordVinSourceFailure,
  recordVinSourceSuccess,
} from "./vinSources";

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
): Promise<string | null> {
  const statuses = getVinSourceStatuses();
  const enabled = statuses
    .filter((s) => s.enabled)
    .sort((a, b) => a.failureCount - b.failureCount);
  const sources = enabled
    .map((s) => defaultVinSources.find((src) => src.id === s.id))
    .filter((s): s is VinSource => Boolean(s));
  for (const src of sources) {
    try {
      const url = src.buildUrl(plate, state);
      const init: RequestInit = { method: src.method ?? "GET" };
      if (src.headers) init.headers = src.headers;
      if (src.buildBody) {
        const body = src.buildBody(plate, state);
        init.body = typeof body === "string" ? body : JSON.stringify(body);
      }
      log("VIN lookup request", { url, options: init });
      const res = await fetch(url, init);
      const text = await res.text();
      log("VIN lookup response", { status: res.status, body: text });
      if (!res.ok) {
        recordVinSourceFailure(src.id);
        continue;
      }
      const vin = src.parse
        ? src.parse(text)
        : parseVinFromHtml(text, src.selector);
      if (vin) {
        recordVinSourceSuccess(src.id);
        return vin;
      }
      recordVinSourceFailure(src.id);
    } catch (err) {
      recordVinSourceFailure(src.id);
      console.error("VIN lookup failed", err);
    }
  }
  return null;
}

export async function fetchCaseVin(caseData: Case): Promise<void> {
  const plate = caseData.analysis?.vehicle?.licensePlateNumber;
  const state = caseData.analysis?.vehicle?.licensePlateState;
  if (!plate || !state) return;
  try {
    const vin = await lookupVin(plate, state);
    if (vin) {
      log("VIN fetch successful", vin);
      updateCase(caseData.id, { vin });
    } else {
      log("VIN fetch unsuccessful");
    }
  } catch (err) {
    console.error("Failed to fetch VIN", err);
  }
}

export function fetchCaseVinInBackground(caseData: Case): void {
  runJob("fetchCaseVin", caseData, { caseId: caseData.id });
}
