import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

let dataDir: string;

beforeEach(async () => {
  dataDir = fs.mkdtempSync(path.join(os.tmpdir(), "cases-"));
  process.env.CASE_STORE_FILE = path.join(dataDir, "cases.sqlite");
  vi.resetModules();
  const db = await import("../src/lib/db");
  await db.migrationsReady;
  const { orm } = await import("../src/lib/orm");
  const { casbinRules } = await import("../src/lib/schema");
  orm
    .insert(casbinRules)
    .values({ ptype: "p", v0: "superadmin", v1: "cases", v2: "delete" })
    .run();
});

afterEach(() => {
  fs.rmSync(dataDir, { recursive: true, force: true });
  vi.resetModules();
  process.env.CASE_STORE_FILE = undefined;
});

describe("casbin", () => {
  it("authorizes based on db rules", async () => {
    const { authorize } = await import("../src/lib/authz");
    expect(await authorize("superadmin", "cases", "delete")).toBe(true);
    expect(await authorize("user", "cases", "delete")).toBe(true);
  });
});
