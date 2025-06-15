import { eq, sql } from "drizzle-orm";
import { caseEvents } from "./caseEvents";
import { db } from "./db";
import { orm } from "./orm";
import { casePhotos } from "./schema";
import { fetchCaseVinInBackground } from "./vinLookup";

import type { ViolationReport } from "./openai";

export interface Case {
  id: string;
  photos: string[];
  photoTimes: Record<string, string | null>;
  photoGps?: Record<string, { lat: number; lon: number } | null>;
  /** @zod.date */
  createdAt: string;
  /** @zod.date */
  updatedAt: string;
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
  const base = JSON.parse(row.data) as Omit<
    Case,
    "photos" | "photoTimes" | "photoGps"
  >;
  if (!("updatedAt" in base)) {
    (base as Partial<Case>).updatedAt = (base as Partial<Case>).createdAt;
  }
  const photos = orm
    .select()
    .from(casePhotos)
    .where(eq(casePhotos.caseId, row.id))
    .orderBy(sql`rowid`)
    .all();
  const list: string[] = [];
  const times: Record<string, string | null> = {};
  const gps: Record<string, { lat: number; lon: number } | null> = {};
  for (const p of photos) {
    list.push(p.url);
    times[p.url] = p.takenAt ?? null;
    gps[p.url] =
      p.gpsLat !== null &&
      p.gpsLat !== undefined &&
      p.gpsLon !== null &&
      p.gpsLon !== undefined
        ? { lat: p.gpsLat, lon: p.gpsLon }
        : null;
  }
  return {
    ...base,
    photos: list,
    photoTimes: times,
    photoGps: gps,
  } as Case;
}

function saveCase(c: Case) {
  const { photos, photoTimes, photoGps, ...rest } = c;
  const stmt = db.prepare(
    "INSERT OR REPLACE INTO cases (id, data) VALUES (?, ?)",
  );
  stmt.run(c.id, JSON.stringify(rest));
  orm.delete(casePhotos).where(eq(casePhotos.caseId, c.id)).run();
  for (const url of photos) {
    orm
      .insert(casePhotos)
      .values({
        caseId: c.id,
        url,
        takenAt: photoTimes[url] ?? null,
        gpsLat: photoGps?.[url]?.lat ?? null,
        gpsLon: photoGps?.[url]?.lon ?? null,
      })
      .run();
  }
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
  return rows
    .map(rowToCase)
    .map(applyOverrides)
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
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
    updatedAt: new Date().toISOString(),
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
  const updated = {
    ...current,
    ...updates,
    updatedAt: new Date().toISOString(),
  };
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
  current.updatedAt = new Date().toISOString();
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
  current.updatedAt = new Date().toISOString();
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
  current.updatedAt = new Date().toISOString();
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
  current.updatedAt = new Date().toISOString();
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
  current.updatedAt = new Date().toISOString();
  saveCase(current);
  caseEvents.emit("update", current);
  return current;
}

export function deleteCase(id: string): boolean {
  const current = getCaseRow(id);
  if (!current) return false;
  db.prepare("DELETE FROM cases WHERE id = ?").run(id);
  orm.delete(casePhotos).where(eq(casePhotos.caseId, id)).run();
  caseEvents.emit("update", { id: current.id, deleted: true });
  return true;
}
