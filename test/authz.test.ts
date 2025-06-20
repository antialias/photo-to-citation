import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

let dataDir: string;

beforeEach(async () => {
  dataDir = fs.mkdtempSync(path.join(os.tmpdir(), "cases-"));
  process.env.CASE_STORE_FILE = path.join(dataDir, "cases.sqlite");
  vi.resetModules();
  const db = await import("@/lib/db");
  await db.migrationsReady;
  const { orm } = await import("@/lib/orm");
  const { casbinRules, users } = await import("@/lib/schema");
  orm
    .insert(casbinRules)
    .values({ ptype: "p", v0: "superadmin", v1: "cases", v2: "delete" })
    .run();
  orm
    .insert(casbinRules)
    .values({ ptype: "p", v0: "user", v1: "cases", v2: "read" })
    .run();
  orm.insert(users).values({ id: "u1" }).run();
  orm.insert(users).values({ id: "u2" }).run();
});

afterEach(() => {
  fs.rmSync(dataDir, { recursive: true, force: true });
  vi.resetModules();
  process.env.CASE_STORE_FILE = undefined;
});

describe("casbin", () => {
  it("authorizes based on db rules", async () => {
    const { authorize } = await import("@/lib/authz");
    expect(await authorize("superadmin", "cases", "delete")).toBe(true);
    expect(await authorize("user", "cases", "delete")).toBe(false);
  });

  it("checks case membership", async () => {
    const { authorize } = await import("@/lib/authz");
    const caseStore = await import("@/lib/caseStore");
    const c = caseStore.createCase("/x.jpg", null, undefined, null, "u1");
    expect(
      await authorize("user", "cases", "read", { caseId: c.id, userId: "u1" }),
    ).toBe(true);
    expect(
      await authorize("user", "cases", "read", { caseId: c.id, userId: "u2" }),
    ).toBe(false);
  });
});
