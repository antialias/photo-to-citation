import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

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
    const c = createCase("/foo.jpg", { lat: 10, lon: 20 });
    expect(c.photos).toEqual(["/foo.jpg"]);
    expect(c.gps).toEqual({ lat: 10, lon: 20 });
    expect(c.streetAddress).toBeNull();
    expect(c.intersection).toBeNull();
    expect(getCase(c.id)).toEqual(c);
    expect(getCases()).toHaveLength(1);
    addCasePhoto(c.id, "/bar.jpg");
    const updated = updateCase(c.id, {
      analysis: { violationType: "foo", details: "bar", vehicle: {} },
    });
    expect(updated?.photos).toEqual(["/foo.jpg", "/bar.jpg"]);
    expect(updated?.analysis?.violationType).toBe("foo");
  });

  it("allows providing a custom id", () => {
    const { createCase, getCase } = caseStore;
    const c = createCase("/bar.jpg", null, "custom-id");
    expect(c.id).toBe("custom-id");
    expect(getCase("custom-id")).toEqual(c);
    expect(c.photos).toEqual(["/bar.jpg"]);
  });

  it("applies analysis overrides", () => {
    const { createCase, setCaseAnalysisOverrides, getCase } = caseStore;
    const c = createCase("/baz.jpg");
    setCaseAnalysisOverrides(c.id, { vehicle: { model: "Tesla" } });
    const updated = getCase(c.id);
    expect(updated?.analysis?.vehicle?.model).toBe("Tesla");
    setCaseAnalysisOverrides(c.id, null);
    const cleared = getCase(c.id);
    expect(cleared?.analysis?.vehicle?.model).toBeUndefined();
  });

  it("computes the representative photo", () => {
    const { createCase, addCasePhoto, getCase, getRepresentativePhoto } =
      caseStore;
    const c = createCase("/b.jpg");
    addCasePhoto(c.id, "/a.jpg");
    const updated = getCase(c.id);
    expect(updated).toBeDefined();
    const rep = getRepresentativePhoto(updated as NonNullable<typeof updated>);
    expect(rep).toBe("/a.jpg");
  });
});
