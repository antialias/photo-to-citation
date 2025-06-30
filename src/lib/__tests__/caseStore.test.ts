import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

let store: typeof import("../caseStore");
let tmpDir: string;

beforeEach(async () => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "case-store-"));
  process.env.CASE_STORE_FILE = path.join(tmpDir, "cases.sqlite");
  vi.resetModules();
  const db = await import("../db");
  await db.migrationsReady();
  store = await import("../caseStore");
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
  vi.resetModules();
  process.env.CASE_STORE_FILE = undefined;
});

describe("caseStore", () => {
  it("persists image context", () => {
    const c = store.createCase("/a.jpg");
    store.updateCase(c.id, {
      analysis: {
        violationType: "test",
        details: { en: "" },
        vehicle: {},
        images: {
          "a.jpg": { representationScore: 1, context: { en: "hello" } },
        },
      },
      analysisStatus: "complete",
    });
    const loaded = store.getCase(c.id);
    expect(loaded?.analysis?.images?.["a.jpg"].context).toEqual({
      en: "hello",
    });
  });
});
