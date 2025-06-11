import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getRepresentativePhoto } from "../src/lib/caseUtils";

let dataDir: string;
let caseStore: typeof import("../src/lib/caseStore");

beforeEach(async () => {
  dataDir = fs.mkdtempSync(path.join(os.tmpdir(), "cases-"));
  process.env.CASE_STORE_FILE = path.join(dataDir, "cases.json");
  vi.resetModules();
  caseStore = await import("../src/lib/caseStore");
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
    expect(c.streetAddress).toBeNull();
    expect(c.intersection).toBeNull();
    expect(getCase(c.id)).toEqual(c);
    expect(getCases()).toHaveLength(1);
    addCasePhoto(c.id, "/bar.jpg", "2020-01-02T00:00:00.000Z");
    const updated = updateCase(c.id, {
      analysis: {
        violationType: "foo",
        details: "bar",
        vehicle: {},
        images: {
          "foo.jpg": { representationScore: 0.6 },
          "bar.jpg": { representationScore: 0.5 },
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
    addCasePhoto(c.id, "/a.jpg", "2020-01-06T00:00:00.000Z");
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
    addCasePhoto(c.id, "/bar.jpg", "2020-01-08T00:00:00.000Z");
    const updated = removeCasePhoto(c.id, "/foo.jpg");
    expect(updated?.photos).toEqual(["/bar.jpg"]);
    expect(updated?.analysisStatus).toBe("pending");
    const stored = getCase(c.id);
    expect(stored?.photos).toEqual(["/bar.jpg"]);
  });
});
