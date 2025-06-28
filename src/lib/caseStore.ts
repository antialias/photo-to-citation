import crypto from "node:crypto";
import path from "node:path";
import { eq, sql } from "drizzle-orm";
import { caseEvents } from "./caseEvents";
import { addCaseMember, isCaseMember } from "./caseMembers";
import { db } from "./db";
import { orm } from "./orm";
import { casePhotoAnalysis, casePhotos } from "./schema";
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
  public: boolean;
  sessionId?: string | null;
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
  closed?: boolean;
  note?: string | null;
  photoNotes?: Record<string, string | null>;
  archived?: boolean;
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

function rowToCase(row: {
  id: string;
  data: string;
  public: number;
  session_id?: string | null;
}): Case {
  const base = JSON.parse(row.data) as Omit<
    Case,
    "photos" | "photoTimes" | "photoGps"
  >;
  if (!("updatedAt" in base)) {
    (base as Partial<Case>).updatedAt = (base as Partial<Case>).createdAt;
  }
  if (!("closed" in base)) {
    (base as Partial<Case>).closed = false;
  }
  if (!("archived" in base)) {
    (base as Partial<Case>).archived = false;
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
  const notes: Record<string, string | null> = base.photoNotes || {};
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
    if (!(p.url in notes)) notes[p.url] = null;
  }
  const analysisRows = orm
    .select()
    .from(casePhotoAnalysis)
    .where(eq(casePhotoAnalysis.caseId, row.id))
    .all();
  if (analysisRows.length > 0) {
    const images: Record<string, ViolationReport["images"][string]> = {};
    for (const a of analysisRows) {
      images[path.basename(a.url)] = {
        representationScore: a.representationScore,
        ...(a.highlights !== null && {
          highlights: (() => {
            try {
              return JSON.parse(a.highlights);
            } catch {
              return { en: a.highlights };
            }
          })(),
        }),
        ...(a.violation !== null && { violation: Boolean(a.violation) }),
        ...(a.paperwork !== null && { paperwork: Boolean(a.paperwork) }),
        ...(a.paperworkText !== null && { paperworkText: a.paperworkText }),
        ...(a.paperworkInfo !== null && {
          paperworkInfo: JSON.parse(a.paperworkInfo),
        }),
      };
    }
    if (!base.analysis)
      base.analysis = { vehicle: {}, images } as ViolationReport;
    else base.analysis.images = images;
  }
  return {
    ...base,
    photos: list,
    photoTimes: times,
    photoGps: gps,
    photoNotes: notes,
    public: Boolean(row.public),
    sessionId: row.session_id ?? (base as Partial<Case>).sessionId ?? null,
  } as Case;
}

function saveCase(c: Case) {
  const { photos, photoTimes, photoGps, photoNotes, ...rest } = c;
  const images = rest.analysis?.images ?? {};
  if (photoNotes) {
    (rest as Partial<Case>).photoNotes = photoNotes;
  }
  if (rest.analysis && "images" in rest.analysis) {
    (rest.analysis as Partial<ViolationReport>).images = undefined;
  }
  const stmt = db.prepare(
    [
      "INSERT INTO cases (id, data, public, session_id)",
      "VALUES (?, ?, ?, ?)",
      "ON CONFLICT(id) DO UPDATE SET",
      "  data = excluded.data,",
      "  public = excluded.public,",
      "  session_id = excluded.session_id",
    ].join(" "),
  );
  const tx = db.transaction(() => {
    stmt.run(c.id, JSON.stringify(rest), c.public ? 1 : 0, c.sessionId ?? null);
    orm.delete(casePhotos).where(eq(casePhotos.caseId, c.id)).run();
    orm
      .delete(casePhotoAnalysis)
      .where(eq(casePhotoAnalysis.caseId, c.id))
      .run();
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
    for (const [name, info] of Object.entries(images)) {
      const url = photos.find((p) => path.basename(p) === name);
      if (!url) continue;
      orm
        .insert(casePhotoAnalysis)
        .values({
          caseId: c.id,
          url,
          representationScore: info.representationScore,
          highlights:
            info.highlights === undefined || info.highlights === null
              ? null
              : JSON.stringify(info.highlights),
          violation:
            info.violation === undefined || info.violation === null
              ? null
              : info.violation
                ? 1
                : 0,
          paperwork:
            info.paperwork === undefined || info.paperwork === null
              ? null
              : info.paperwork
                ? 1
                : 0,
          paperworkText: info.paperworkText ?? null,
          paperworkInfo: info.paperworkInfo
            ? JSON.stringify(info.paperworkInfo)
            : null,
        })
        .run();
    }
  });
  tx();
}

function getCaseRow(id: string): Case | undefined {
  const row = db
    .prepare("SELECT id, data, public, session_id FROM cases WHERE id = ?")
    .get(id) as
    | { id: string; data: string; public: number; session_id: string | null }
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
  const rows = db
    .prepare("SELECT id, data, public, session_id FROM cases")
    .all() as Array<{
    id: string;
    data: string;
    public: number;
    session_id: string | null;
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
  ownerId?: string | null,
  isPublic = false,
  sessionId?: string | null,
): Case {
  const newCase: Case = {
    id: id ?? crypto.randomUUID(),
    photos: [photo],
    photoTimes: { [photo]: takenAt ?? null },
    photoGps: { [photo]: gps },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    gps,
    public: isPublic,
    sessionId: sessionId ?? null,
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
    note: null,
    photoNotes: { [photo]: null },
    sentEmails: [],
    ownershipRequests: [],
    threadImages: [],
    closed: false,
    archived: false,
  };
  saveCase(newCase);
  if (ownerId) {
    addCaseMember(newCase.id, ownerId, "owner");
  }
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
  const final = getCase(id);
  if (final) {
    caseEvents.emit("update", final);
  }
  return final;
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
  if (!current.photoNotes) current.photoNotes = {};
  current.photoNotes[photo] = null;
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
  if (current.photoNotes) delete current.photoNotes[photo];
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
  caseEvents.emit("update", after);
  return after;
}

export function setCaseVinOverride(
  id: string,
  vin: string | null,
): Case | undefined {
  return updateCase(id, { vinOverride: vin });
}

export function setCaseNote(id: string, note: string | null): Case | undefined {
  return updateCase(id, { note });
}

export function setPhotoNote(
  id: string,
  photo: string,
  note: string | null,
): Case | undefined {
  const current = getCaseRow(id);
  if (!current) return undefined;
  if (!current.photos.includes(photo)) return undefined;
  if (!current.photoNotes) current.photoNotes = {};
  current.photoNotes[photo] = note;
  current.updatedAt = new Date().toISOString();
  saveCase(current);
  caseEvents.emit("update", current);
  return current;
}

export function setCaseTranslation(
  id: string,
  path: string,
  lang: string,
  text: string,
): Case | undefined {
  const current = getCaseRow(id);
  if (!current) return undefined;
  const parts: string[] = [];
  let buf = "";
  let inBracket = false;
  for (const ch of path) {
    if (ch === "[" && !inBracket) {
      if (buf) {
        parts.push(buf);
        buf = "";
      }
      inBracket = true;
    } else if (ch === "]" && inBracket) {
      parts.push(buf);
      buf = "";
      inBracket = false;
    } else if (ch === "." && !inBracket) {
      if (buf) {
        parts.push(buf);
        buf = "";
      }
    } else {
      buf += ch;
    }
  }
  if (buf) parts.push(buf);
  let obj: unknown = current;
  for (let i = 0; i < parts.length - 1; i++) {
    if (typeof obj !== "object" || obj === null) return undefined;
    obj = (obj as Record<string, unknown>)[parts[i]];
  }
  if (typeof obj !== "object" || obj === null) return undefined;
  const key = parts[parts.length - 1];
  const target = obj as Record<string, unknown>;
  const value = target[key];
  if (typeof value === "string") {
    target[key] = { en: value, [lang]: text };
  } else if (typeof value === "object" && value !== null) {
    target[key] = { ...(value as Record<string, string>), [lang]: text };
  } else {
    return undefined;
  }
  current.updatedAt = new Date().toISOString();
  saveCase(current);
  caseEvents.emit("update", current);
  return current;
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

export function setCasePublic(id: string, isPublic: boolean): Case | undefined {
  return updateCase(id, { public: isPublic });
}

export function setCaseClosed(id: string, closed: boolean): Case | undefined {
  return updateCase(id, { closed });
}

export function setCaseArchived(
  id: string,
  archived: boolean,
): Case | undefined {
  return updateCase(id, { archived });
}

export function setCaseSessionId(
  id: string,
  sessionId: string | null,
): Case | undefined {
  return updateCase(id, { sessionId });
}

export function deleteCase(id: string): boolean {
  const current = getCaseRow(id);
  if (!current) return false;
  db.prepare("DELETE FROM cases WHERE id = ?").run(id);
  orm.delete(casePhotos).where(eq(casePhotos.caseId, id)).run();
  orm.delete(casePhotoAnalysis).where(eq(casePhotoAnalysis.caseId, id)).run();
  caseEvents.emit("update", { id: current.id, deleted: true });
  return true;
}

export function getCasesBySession(sessionId: string): Case[] {
  const rows = db
    .prepare(
      "SELECT id, data, public, session_id FROM cases WHERE session_id = ?",
    )
    .all(sessionId) as Array<{
    id: string;
    data: string;
    public: number;
    session_id: string | null;
  }>;
  return rows.map(rowToCase).map(applyOverrides);
}

export function claimCasesForSession(
  userId: string,
  sessionId: string,
): Case[] {
  const cases = getCasesBySession(sessionId);
  const claimed: Case[] = [];
  for (const c of cases) {
    const updated = updateCase(c.id, { sessionId: null });
    if (updated) {
      if (!isCaseMember(c.id, userId)) {
        addCaseMember(c.id, userId, "owner");
      }
      claimed.push(updated);
    }
  }
  return claimed;
}

export function deleteAnonymousCasesOlderThan(cutoff: Date): number {
  const rows = db
    .prepare("SELECT id, data FROM cases WHERE session_id IS NOT NULL")
    .all() as Array<{ id: string; data: string }>;
  let deleted = 0;
  for (const row of rows) {
    const data = JSON.parse(row.data) as { createdAt?: string };
    if (!data.createdAt) continue;
    if (new Date(data.createdAt).getTime() < cutoff.getTime()) {
      if (deleteCase(row.id)) deleted++;
    }
  }
  return deleted;
}

export function findCaseIdForFile(filename: string): string | undefined {
  const photoRow = orm
    .select({ caseId: casePhotos.caseId })
    .from(casePhotos)
    .where(eq(casePhotos.url, filename))
    .get() as { caseId: string } | undefined;
  if (photoRow) return photoRow.caseId;
  const rows = db.prepare("SELECT id, data FROM cases").all() as Array<{
    id: string;
    data: string;
  }>;
  for (const r of rows) {
    try {
      const data = JSON.parse(r.data) as {
        threadImages?: Array<{ url: string }>;
      };
      if (data.threadImages?.some((img) => img.url === filename)) {
        return r.id;
      }
    } catch {}
  }
  return undefined;
}
