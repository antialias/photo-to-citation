import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { getRepresentativePhoto } from "@/lib/caseUtils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

let dataDir: string;
let caseStore: typeof import("@/lib/caseStore");
let members: typeof import("@/lib/caseMembers");
let orm: typeof import("@/lib/orm").orm;
let schema: typeof import("@/lib/schema");

beforeEach(async () => {
  dataDir = fs.mkdtempSync(path.join(os.tmpdir(), "cases-"));
  process.env.CASE_STORE_FILE = path.join(dataDir, "cases.sqlite");
  vi.resetModules();
  const dbModule = await import("@/lib/db");
  caseStore = await import("@/lib/caseStore");
  members = await import("@/lib/caseMembers");
  ({ orm } = await import("@/lib/orm"));
  schema = await import("@/lib/schema");
  orm.insert(schema.users).values({ id: "u1" }).run();
  await dbModule.migrationsReady;
});

afterEach(() => {
  fs.rmSync(dataDir, { recursive: true, force: true });
  vi.resetModules();
  process.env.CASE_STORE_FILE = undefined;
});

describe("caseStore", () => {
  it("creates and retrieves a case", () => {
    const { createCase, getCase, getCases, updateCase, addCasePhoto } =
      caseStore;
    const c = createCase(
      "/foo.jpg",
      { lat: 10, lon: 20 },
      undefined,
      "2020-01-01T00:00:00.000Z",
    );
    expect(c.photos).toEqual(["/foo.jpg"]);
    expect(c.gps).toEqual({ lat: 10, lon: 20 });
    expect(c.photoGps?.["/foo.jpg"]).toEqual({ lat: 10, lon: 20 });
    expect(c.streetAddress).toBeNull();
    expect(c.intersection).toBeNull();
    expect(getCase(c.id)).toEqual(c);
    expect(getCases()).toHaveLength(1);
    addCasePhoto(c.id, "/bar.jpg", "2020-01-02T00:00:00.000Z", {
      lat: 11,
      lon: 21,
    });
    const updated = updateCase(c.id, {
      analysis: {
        violationType: "foo",
        details: { en: "bar" },
        vehicle: {},
        images: {
          "foo.jpg": { representationScore: 0.6, violation: true },
          "bar.jpg": { representationScore: 0.5, violation: true },
        },
      },
    });
    expect(updated?.photos).toEqual(["/foo.jpg", "/bar.jpg"]);
    expect(updated?.analysis?.violationType).toBe("foo");
  });

  it("allows providing a custom id", () => {
    const { createCase, getCase } = caseStore;
    const c = createCase(
      "/bar.jpg",
      null,
      "custom-id",
      "2020-01-03T00:00:00.000Z",
    );
    expect(c.id).toBe("custom-id");
    expect(getCase("custom-id")).toEqual(c);
    expect(c.photos).toEqual(["/bar.jpg"]);
  });

  it("applies analysis overrides", () => {
    const { createCase, setCaseAnalysisOverrides, getCase } = caseStore;
    const c = createCase(
      "/baz.jpg",
      null,
      undefined,
      "2020-01-04T00:00:00.000Z",
    );
    setCaseAnalysisOverrides(c.id, { vehicle: { model: "Tesla" } });
    const updated = getCase(c.id);
    expect(updated?.analysis?.vehicle?.model).toBe("Tesla");
    setCaseAnalysisOverrides(c.id, null);
    const cleared = getCase(c.id);
    expect(cleared?.analysis?.vehicle?.model).toBeUndefined();
  });

  it("computes the representative photo", () => {
    const { createCase, addCasePhoto, getCase } = caseStore;
    const c = createCase("/b.jpg", null, undefined, "2020-01-05T00:00:00.000Z");
    addCasePhoto(c.id, "/a.jpg", "2020-01-06T00:00:00.000Z", {
      lat: 12,
      lon: 22,
    });
    const updated = getCase(c.id);
    expect(updated).toBeDefined();
    const rep = getRepresentativePhoto(updated as NonNullable<typeof updated>);
    expect(rep).toBe("/a.jpg");
  });

  it("removes a photo and marks analysis pending", () => {
    const { createCase, addCasePhoto, removeCasePhoto, getCase } = caseStore;
    const c = createCase(
      "/foo.jpg",
      null,
      undefined,
      "2020-01-07T00:00:00.000Z",
    );
    addCasePhoto(c.id, "/bar.jpg", "2020-01-08T00:00:00.000Z", {
      lat: 13,
      lon: 23,
    });
    const updated = removeCasePhoto(c.id, "/foo.jpg");
    expect(updated?.photos).toEqual(["/bar.jpg"]);
    expect(updated?.analysisStatus).toBe("pending");
    const stored = getCase(c.id);
    expect(stored?.photos).toEqual(["/bar.jpg"]);
    expect(stored?.photoGps?.["/foo.jpg"]).toBeUndefined();
  });

  it("deletes a case", () => {
    const { createCase, deleteCase, getCase, getCases } = caseStore;
    const c = createCase(
      "/foo.jpg",
      null,
      undefined,
      "2020-01-09T00:00:00.000Z",
    );
    const ok = deleteCase(c.id);
    expect(ok).toBe(true);
    expect(getCase(c.id)).toBeUndefined();
    expect(getCases()).toHaveLength(0);
  });

  it("adds owner membership when provided", () => {
    const { createCase } = caseStore;
    const c = createCase("/own.jpg", null, undefined, null, "u1");
    expect(members.isCaseMember(c.id, "u1", "owner")).toBe(true);
  });

  it("toggles public flag", () => {
    const { createCase, setCasePublic, getCase } = caseStore;
    const c = createCase("/pub.jpg", null);
    expect(c.public).toBe(false);
    const updated = setCasePublic(c.id, true);
    expect(updated?.public).toBe(true);
    const stored = getCase(c.id);
    expect(stored?.public).toBe(true);
  });

  it("toggles closed flag", () => {
    const { createCase, setCaseClosed, getCase } = caseStore;
    const c = createCase("/close.jpg", null);
    expect(c.closed).toBe(false);
    const updated = setCaseClosed(c.id, true);
    expect(updated?.closed).toBe(true);
    const stored = getCase(c.id);
    expect(stored?.closed).toBe(true);
  });

  it("sets case note", () => {
    const { createCase, setCaseNote, getCase } = caseStore;
    const c = createCase("/note.jpg", null);
    const updated = setCaseNote(c.id, "hello");
    expect(updated?.note).toBe("hello");
    const stored = getCase(c.id);
    expect(stored?.note).toBe("hello");
  });

  it("sets photo note", () => {
    const { createCase, setPhotoNote, getCase } = caseStore;
    const c = createCase("/p.jpg", null);
    const updated = setPhotoNote(c.id, "/p.jpg", "foo");
    expect(updated?.photoNotes?.["/p.jpg"]).toBe("foo");
    const stored = getCase(c.id);
    expect(stored?.photoNotes?.["/p.jpg"]).toBe("foo");
  });

  it("parses localized image highlights", () => {
    const { createCase, updateCase, getCase } = caseStore;
    const c = createCase("/a.jpg", null);
    updateCase(c.id, {
      analysis: {
        violationType: "parking",
        details: { en: "desc" },
        vehicle: {},
        images: {
          "a.jpg": {
            representationScore: 0.9,
            highlights: { en: "caption" },
          },
        },
      },
    });
    const stored = getCase(c.id);
    expect(stored?.analysis?.images["a.jpg"].highlights).toEqual({
      en: "caption",
    });
  });

  it("handles session-based cases", () => {
    const { createCase, getCasesBySession, claimCasesForSession, getCase } =
      caseStore;
    const c1 = createCase("/s1.jpg", null, undefined, null, null, false, "s1");
    const c2 = createCase("/s2.jpg", null, undefined, null, null, false, "s1");
    const list = getCasesBySession("s1");
    expect(list.map((c) => c.id).sort()).toEqual([c1.id, c2.id].sort());
    claimCasesForSession("u1", "s1");
    const claimed1 = getCase(c1.id);
    expect(claimed1?.sessionId).toBeNull();
    expect(members.isCaseMember(c1.id, "u1", "owner")).toBe(true);
  });

  it("deletes anonymous cases older than cutoff", () => {
    const { createCase, deleteAnonymousCasesOlderThan, getCase } = caseStore;
    const oldDate = new Date(
      Date.now() - 10 * 24 * 60 * 60 * 1000,
    ).toISOString();
    const recentDate = new Date().toISOString();
    const oldCase = createCase(
      "/old.jpg",
      null,
      undefined,
      undefined,
      null,
      false,
      "s1",
    );
    caseStore.updateCase(oldCase.id, { createdAt: oldDate });
    const recentCase = createCase(
      "/recent.jpg",
      null,
      undefined,
      undefined,
      null,
      false,
      "s2",
    );
    caseStore.updateCase(recentCase.id, { createdAt: recentDate });
    const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const count = deleteAnonymousCasesOlderThan(cutoff);
    expect(count).toBe(1);
    expect(getCase(oldCase.id)).toBeUndefined();
    expect(getCase(recentCase.id)).toBeDefined();
  });
});
