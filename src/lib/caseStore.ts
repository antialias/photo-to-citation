import fs from "node:fs";
import path from "node:path";
import { caseEvents } from "./caseEvents";
import { fetchCaseVinInBackground } from "./vinLookup";

import type { ViolationReport } from "./openai";

export interface Case {
  id: string;
  photos: string[];
  photoTimes: Record<string, string | null>;
  createdAt: string;
  gps?: {
    lat: number;
    lon: number;
  } | null;
  streetAddress?: string | null;
  intersection?: string | null;
  vin?: string | null;
  vinOverride?: string | null;
  analysis?: ViolationReport | null;
  analysisOverrides?: Partial<ViolationReport> | null;
  analysisStatus: "pending" | "complete";
  analysisStatusCode?: number | null;
  sentEmails?: SentEmail[];
  ownershipRequests?: OwnershipRequest[];
}

export interface SentEmail {
  subject: string;
  body: string;
  attachments: string[];
  sentAt: string;
}

export interface OwnershipRequest {
  moduleId: string;
  requestedAt: string;
  checkNumber?: string | null;
}

const dataFile = process.env.CASE_STORE_FILE
  ? path.resolve(process.env.CASE_STORE_FILE)
  : path.join(process.cwd(), "data", "cases.json");

function loadCases(): Case[] {
  if (!fs.existsSync(dataFile)) {
    return [];
  }
  try {
    const raw = JSON.parse(fs.readFileSync(dataFile, "utf8")) as Array<
      Case & { photo?: string }
    >;
    return raw.map((c) => ({
      ...c,
      photos: c.photos ?? (c.photo ? [c.photo] : []),
      photoTimes: c.photoTimes ?? {},
      analysisStatus: c.analysisStatus ?? (c.analysis ? "complete" : "pending"),
      sentEmails: c.sentEmails ?? [],
      ownershipRequests: c.ownershipRequests ?? [],
    }));
  } catch {
    return [];
  }
}

function saveCases(cases: Case[]) {
  fs.mkdirSync(path.dirname(dataFile), { recursive: true });
  fs.writeFileSync(dataFile, JSON.stringify(cases, null, 2));
}

function applyOverrides(caseData: Case): Case {
  let layeredCase = caseData;
  if (caseData.analysisOverrides) {
    const base = caseData.analysis ?? ({} as ViolationReport);
    const overrides = caseData.analysisOverrides;
    const layered: ViolationReport = {
      ...base,
      ...overrides,
      vehicle: {
        ...(base.vehicle ?? {}),
        ...(overrides.vehicle ?? {}),
      },
    };
    layeredCase = { ...layeredCase, analysis: layered };
  }
  if (layeredCase.vinOverride) {
    layeredCase = { ...layeredCase, vin: layeredCase.vinOverride };
  }
  return layeredCase;
}

export function getCases(): Case[] {
  return loadCases().map(applyOverrides);
}

export function getCase(id: string): Case | undefined {
  const c = loadCases().find((caseItem) => caseItem.id === id);
  return c ? applyOverrides(c) : undefined;
}

export function createCase(
  photo: string,
  gps: Case["gps"] = null,
  id?: string,
  takenAt?: string | null,
): Case {
  const cases = loadCases();
  const newCase: Case = {
    id: id ?? Date.now().toString(),
    photos: [photo],
    photoTimes: { [photo]: takenAt ?? null },
    createdAt: new Date().toISOString(),
    gps,
    streetAddress: null,
    intersection: null,
    vin: null,
    vinOverride: null,
    analysis: null,
    analysisOverrides: null,
    analysisStatus: "pending",
    analysisStatusCode: null,
    sentEmails: [],
    ownershipRequests: [],
  };
  cases.push(newCase);
  saveCases(cases);
  caseEvents.emit("update", newCase);
  return newCase;
}

export function updateCase(
  id: string,
  updates: Partial<Case>,
): Case | undefined {
  const cases = loadCases();
  const idx = cases.findIndex((c) => c.id === id);
  if (idx === -1) return undefined;
  cases[idx] = { ...cases[idx], ...updates };
  saveCases(cases);
  caseEvents.emit("update", cases[idx]);
  return cases[idx];
}

export function addCasePhoto(
  id: string,
  photo: string,
  takenAt?: string | null,
): Case | undefined {
  const cases = loadCases();
  const idx = cases.findIndex((c) => c.id === id);
  if (idx === -1) return undefined;
  cases[idx].photos.push(photo);
  cases[idx].photoTimes[photo] = takenAt ?? null;
  cases[idx].analysisStatus = "pending";
  saveCases(cases);
  caseEvents.emit("update", cases[idx]);
  return cases[idx];
}

export function removeCasePhoto(id: string, photo: string): Case | undefined {
  const cases = loadCases();
  const idx = cases.findIndex((c) => c.id === id);
  if (idx === -1) return undefined;
  const photoIdx = cases[idx].photos.indexOf(photo);
  if (photoIdx === -1) return undefined;
  cases[idx].photos.splice(photoIdx, 1);
  delete cases[idx].photoTimes[photo];
  cases[idx].analysisStatus = "pending";
  saveCases(cases);
  caseEvents.emit("update", cases[idx]);
  return cases[idx];
}

export function setCaseAnalysisOverrides(
  id: string,
  overrides: Partial<ViolationReport> | null,
): Case | undefined {
  const before = getCase(id);
  const updated = updateCase(id, { analysisOverrides: overrides });
  if (updated) {
    const after = getCase(id);
    const beforePlate = before?.analysis?.vehicle?.licensePlateNumber ?? null;
    const beforeState = before?.analysis?.vehicle?.licensePlateState ?? null;
    const afterPlate = after?.analysis?.vehicle?.licensePlateNumber ?? null;
    const afterState = after?.analysis?.vehicle?.licensePlateState ?? null;
    if (
      afterPlate &&
      afterState &&
      (afterPlate !== beforePlate || afterState !== beforeState)
    ) {
      fetchCaseVinInBackground(after as Case);
    }
  }
  return updated;
}

export function setCaseVinOverride(
  id: string,
  vin: string | null,
): Case | undefined {
  return updateCase(id, { vinOverride: vin });
}

export function addCaseEmail(id: string, email: SentEmail): Case | undefined {
  const cases = loadCases();
  const idx = cases.findIndex((c) => c.id === id);
  if (idx === -1) return undefined;
  const list = cases[idx].sentEmails ?? [];
  cases[idx].sentEmails = [...list, email];
  saveCases(cases);
  caseEvents.emit("update", cases[idx]);
  return cases[idx];
}

export function addOwnershipRequest(
  id: string,
  request: OwnershipRequest,
): Case | undefined {
  const cases = loadCases();
  const idx = cases.findIndex((c) => c.id === id);
  if (idx === -1) return undefined;
  const list = cases[idx].ownershipRequests ?? [];
  cases[idx].ownershipRequests = [...list, request];
  saveCases(cases);
  caseEvents.emit("update", cases[idx]);
  return cases[idx];
}
