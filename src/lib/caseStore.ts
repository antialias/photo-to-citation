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
}

const dataFile = process.env.CASE_STORE_FILE
  ? path.resolve(process.env.CASE_STORE_FILE)
  : path.join(process.cwd(), "data", "cases.json");

function loadCases(): Case[] {
  if (!fs.existsSync(dataFile)) {
    return [];
  }
  try {
    return JSON.parse(fs.readFileSync(dataFile, "utf8")) as Case[];
  } catch {
    return [];
  }
}

function saveCases(cases: Case[]) {
  fs.mkdirSync(path.dirname(dataFile), { recursive: true });
  fs.writeFileSync(dataFile, JSON.stringify(cases, null, 2));
}

export function getCases(): Case[] {
  return loadCases();
}

export function getCase(id: string): Case | undefined {
  return loadCases().find((c) => c.id === id);
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
