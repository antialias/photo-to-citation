import fs from "node:fs";
import path from "node:path";

import type { ViolationReport } from "./openai";

export interface Case {
  id: string;
  photos: string[];
  createdAt: string;
  gps?: {
    lat: number;
    lon: number;
  } | null;
  streetAddress?: string | null;
  intersection?: string | null;
  analysis?: ViolationReport | null;
  analysisOverrides?: Partial<ViolationReport> | null;
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
  if (!caseData.analysisOverrides) {
    return caseData;
  }
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
  return { ...caseData, analysis: layered };
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
): Case {
  const cases = loadCases();
  const newCase: Case = {
    id: id ?? Date.now().toString(),
    photos: [photo],
    createdAt: new Date().toISOString(),
    gps,
    streetAddress: null,
    intersection: null,
    analysis: null,
    analysisOverrides: null,
  };
  cases.push(newCase);
  saveCases(cases);
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
  return cases[idx];
}

export function addCasePhoto(id: string, photo: string): Case | undefined {
  const cases = loadCases();
  const idx = cases.findIndex((c) => c.id === id);
  if (idx === -1) return undefined;
  cases[idx].photos.push(photo);
  saveCases(cases);
  return cases[idx];
}

export function setCaseAnalysisOverrides(
  id: string,
  overrides: Partial<ViolationReport> | null,
): Case | undefined {
  return updateCase(id, { analysisOverrides: overrides });
}
