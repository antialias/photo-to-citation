import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { readJsonFile, writeJsonFile } from "./fileUtils";

export interface VinSource {
  id: string;
  label: string;
  buildUrl: (plate: string, state: string) => string;
  method?: string;
  headers?: Record<string, string>;
  buildBody?: (plate: string, state: string) => unknown;
  selector?: string;
  parse?: (text: string) => string | null;
}

export const defaultVinSources: VinSource[] = [
  {
    id: "edmunds",
    label: "Edmunds",
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
      quotebackId: crypto.randomUUID(),
      createdDateUtc: new Date().toISOString(),
    }),
    parse(text: string) {
      try {
        const data = JSON.parse(text) as { vins?: string[] };
        return data.vins?.[0] ?? null;
      } catch {
        return null;
      }
    },
  },
  {
    id: "carfax",
    label: "Carfax",
    buildUrl: (plate, state) =>
      `https://example.com/carfax?plate=${plate}&state=${state}`,
    selector: "#vin",
  },
];

export interface VinSourceStatus {
  id: string;
  enabled: boolean;
  failureCount: number;
}

const dataFile = process.env.VIN_SOURCE_FILE
  ? path.resolve(process.env.VIN_SOURCE_FILE)
  : path.join(process.cwd(), "data", "vinSources.json");

function loadStatuses(): VinSourceStatus[] {
  if (!fs.existsSync(dataFile)) {
    const defaults = defaultVinSources.map((s) => ({
      id: s.id,
      enabled: true,
      failureCount: 0,
    }));
    writeJsonFile(dataFile, defaults);
    return defaults;
  }
  return readJsonFile<VinSourceStatus[]>(dataFile, []);
}

function saveStatuses(statuses: VinSourceStatus[]): void {
  writeJsonFile(dataFile, statuses);
}

export function getVinSourceStatuses(): VinSourceStatus[] {
  return loadStatuses();
}

function updateStatus(
  id: string,
  cb: (s: VinSourceStatus) => VinSourceStatus,
): void {
  const statuses = loadStatuses();
  const idx = statuses.findIndex((s) => s.id === id);
  if (idx === -1) return;
  statuses[idx] = cb(statuses[idx]);
  saveStatuses(statuses);
}

export function setVinSourceEnabled(
  id: string,
  enabled: boolean,
): VinSourceStatus | undefined {
  let result: VinSourceStatus | undefined;
  updateStatus(id, (s) => {
    result = { ...s, enabled };
    return result as VinSourceStatus;
  });
  return result;
}

export function recordVinSourceSuccess(id: string): void {
  updateStatus(id, (s) => ({ ...s, failureCount: 0 }));
}

export function recordVinSourceFailure(id: string): void {
  updateStatus(id, (s) => {
    const failures = s.failureCount + 1;
    return {
      ...s,
      failureCount: failures,
      enabled: failures > 3 ? false : s.enabled,
    };
  });
}
