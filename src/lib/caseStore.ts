import crypto from "node:crypto";
import { caseEvents } from "./caseEvents";
import { db } from "./db";
import { fetchCaseVinInBackground } from "./vinLookup";

import type { ViolationReport } from "./openai";

export interface Case {
  id: string;
  photos: string[];
  photoTimes: Record<string, string | null>;
  photoGps?: Record<string, { lat: number; lon: number } | null>;
  /** @zod.date */
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
  /** @zod.enum(["pending", "complete", "failed", "canceled"]) */
  analysisStatus: "pending" | "complete" | "failed" | "canceled";
  analysisStatusCode?: number | null;
  /** @zod.enum(["truncated", "parse", "schema"]).nullable() */
  analysisError?: "truncated" | "parse" | "schema" | "images" | null;
  analysisProgress?: import("./openai").LlmProgress | null;
  sentEmails?: SentEmail[];
  ownershipRequests?: OwnershipRequest[];
  threadImages?: ThreadImage[];
}

export interface SentEmail {
  /** @zod.email */
  to: string;
  subject: string;
  body: string;
  attachments: string[];
  /** @zod.date */
  sentAt: string;
  /** @zod.email */
  replyTo?: string | null;
}

export interface OwnershipRequest {
  moduleId: string;
  /** @zod.date */
  requestedAt: string;
  checkNumber?: string | null;
}

export interface ThreadImage {
  id: string;
  threadParent?: string | null;
  url: string;
  /** @zod.date */
  uploadedAt: string;
  ocrText?: string | null;
  ocrInfo?: import("./openai").PaperworkInfo | null;
}

function rowToCase(row: { id: string; data: string }): Case {
  return JSON.parse(row.data) as Case;
}

function saveCase(c: Case) {
  const stmt = db.prepare(
    "INSERT OR REPLACE INTO cases (id, data) VALUES (?, ?)",
  );
  stmt.run(c.id, JSON.stringify(c));
}

function getCaseRow(id: string): Case | undefined {
  const row = db.prepare("SELECT id, data FROM cases WHERE id = ?").get(id) as
    | { id: string; data: string }
    | undefined;
  return row ? rowToCase(row) : undefined;
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
  const rows = db.prepare("SELECT id, data FROM cases").all() as Array<{
    id: string;
    data: string;
  }>;
  return rows.map(rowToCase).map(applyOverrides);
}

export function getCase(id: string): Case | undefined {
  const c = getCaseRow(id);
  return c ? applyOverrides(c) : undefined;
}

export function createCase(
  photo: string,
  gps: Case["gps"] = null,
  id?: string,
  takenAt?: string | null,
): Case {
  const newCase: Case = {
    id: id ?? Date.now().toString(),
    photos: [photo],
    photoTimes: { [photo]: takenAt ?? null },
    photoGps: { [photo]: gps },
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
    analysisError: null,
    analysisProgress: null,
    sentEmails: [],
    ownershipRequests: [],
    threadImages: [],
  };
  saveCase(newCase);
  caseEvents.emit("update", newCase);
  return newCase;
}

export function updateCase(
  id: string,
  updates: Partial<Case>,
): Case | undefined {
  const current = getCaseRow(id);
  if (!current) return undefined;
  const updated = { ...current, ...updates };
  saveCase(updated);
  caseEvents.emit("update", updated);
  return updated;
}

export function addCasePhoto(
  id: string,
  photo: string,
  takenAt?: string | null,
  gps: Case["gps"] = null,
): Case | undefined {
  const current = getCaseRow(id);
  if (!current) return undefined;
  current.photos.push(photo);
  current.photoTimes[photo] = takenAt ?? null;
  if (!current.photoGps) current.photoGps = {};
  current.photoGps[photo] = gps;
  current.analysisStatus = "pending";
  saveCase(current);
  caseEvents.emit("update", current);
  return current;
}

export function removeCasePhoto(id: string, photo: string): Case | undefined {
  const current = getCaseRow(id);
  if (!current) return undefined;
  const idx = current.photos.indexOf(photo);
  if (idx === -1) return undefined;
  current.photos.splice(idx, 1);
  delete current.photoTimes[photo];
  if (current.photoGps) delete current.photoGps[photo];
  current.analysisStatus = "pending";
  saveCase(current);
  caseEvents.emit("update", current);
  return current;
}

export function setCaseAnalysisOverrides(
  id: string,
  overrides: Partial<ViolationReport> | null,
): Case | undefined {
  const before = getCaseRow(id);
  if (!before) return undefined;
  const updated = { ...before, analysisOverrides: overrides };
  saveCase(updated);
  const after = applyOverrides(updated);
  if (after) {
    const beforePlate = before.analysis?.vehicle?.licensePlateNumber ?? null;
    const beforeState = before.analysis?.vehicle?.licensePlateState ?? null;
    const afterPlate = after.analysis?.vehicle?.licensePlateNumber ?? null;
    const afterState = after.analysis?.vehicle?.licensePlateState ?? null;
    if (
      afterPlate &&
      afterState &&
      (afterPlate !== beforePlate || afterState !== beforeState)
    ) {
      fetchCaseVinInBackground(after as Case);
    }
  }
  caseEvents.emit("update", updated);
  return updated;
}

export function setCaseVinOverride(
  id: string,
  vin: string | null,
): Case | undefined {
  return updateCase(id, { vinOverride: vin });
}

export function addCaseEmail(id: string, email: SentEmail): Case | undefined {
  const current = getCaseRow(id);
  if (!current) return undefined;
  const list = current.sentEmails ?? [];
  current.sentEmails = [...list, email];
  saveCase(current);
  caseEvents.emit("update", current);
  return current;
}

export function addCaseThreadImage(
  id: string,
  image: ThreadImage,
): Case | undefined {
  const current = getCaseRow(id);
  if (!current) return undefined;
  const list = current.threadImages ?? [];
  current.threadImages = [...list, image];
  saveCase(current);
  caseEvents.emit("update", current);
  return current;
}

export function addOwnershipRequest(
  id: string,
  request: OwnershipRequest,
): Case | undefined {
  const current = getCaseRow(id);
  if (!current) return undefined;
  const list = current.ownershipRequests ?? [];
  current.ownershipRequests = [...list, request];
  saveCase(current);
  caseEvents.emit("update", current);
  return current;
}

export function deleteCase(id: string): boolean {
  const current = getCaseRow(id);
  if (!current) return false;
  db.prepare("DELETE FROM cases WHERE id = ?").run(id);
  caseEvents.emit("update", { id: current.id, deleted: true });
  return true;
}
