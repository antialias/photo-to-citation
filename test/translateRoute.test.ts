import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

let dataDir: string;
let caseStore: typeof import("@/lib/caseStore");
let route: typeof import("@/app/api/cases/[id]/translate/route");

beforeEach(async () => {
  dataDir = fs.mkdtempSync(path.join(os.tmpdir(), "cases-"));
  process.env.CASE_STORE_FILE = path.join(dataDir, "cases.sqlite");
  vi.resetModules();
  const db = await import("@/lib/db");
  await db.migrationsReady;
  caseStore = await import("@/lib/caseStore");
  route = await import("@/app/api/cases/[id]/translate/route");
});

afterEach(() => {
  fs.rmSync(dataDir, { recursive: true, force: true });
  process.env.CASE_STORE_FILE = undefined;
  vi.resetModules();
});

describe("translation helpers", () => {
  it("gets value when key contains dots", () => {
    const c = caseStore.createCase("/a.jpg");
    c.analysis = {
      violationType: "v",
      details: { en: "d" },
      vehicle: {},
      images: { "a.jpg": { representationScore: 1, highlights: { en: "h" } } },
    };
    const val = route.getValueByPath(c, "analysis.images.a.jpg.highlights");
    expect(val).toEqual({ en: "h" });
  });
});
