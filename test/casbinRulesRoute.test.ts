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
  const { casbinRules } = await import("@/lib/schema");
  orm
    .insert(casbinRules)
    .values([
      { ptype: "p", v0: "admin", v1: "admin", v2: "read" },
      { ptype: "p", v0: "superadmin", v1: "superadmin", v2: "update" },
    ])
    .run();
});

afterEach(() => {
  fs.rmSync(dataDir, { recursive: true, force: true });
  vi.resetModules();
  process.env.CASE_STORE_FILE = undefined;
});

describe("casbin rules API", () => {
  it("allows admins to read", async () => {
    const mod = await import("@/app/api/casbin-rules/route");
    const res = await mod.GET(new Request("http://test"), {
      params: Promise.resolve({}),
      session: { user: { role: "admin" } },
    });
    expect(res.status).toBe(200);
  });

  it("rejects regular users", async () => {
    const mod = await import("@/app/api/casbin-rules/route");
    const res = await mod.GET(new Request("http://test"), {
      params: Promise.resolve({}),
      session: { user: { role: "user" } },
    });
    expect(res.status).toBe(403);
  });

  it("allows only superadmin to update", async () => {
    const mod = await import("@/app/api/casbin-rules/route");
    const req = new Request("http://test", {
      method: "PUT",
      body: JSON.stringify([]),
    });
    const ok = await mod.PUT(req, {
      params: Promise.resolve({}),
      session: { user: { role: "superadmin" } },
    });
    expect(ok.status).toBe(200);
    const fail = await mod.PUT(req, {
      params: Promise.resolve({}),
      session: { user: { role: "admin" } },
    });
    expect(fail.status).toBe(403);
  });

  it("applies new policies immediately", async () => {
    const { authorize } = await import("@/lib/authz");
    const mod = await import("@/app/api/casbin-rules/route");
    expect(await authorize("admin", "admin", "update")).toBe(false);
    const req = new Request("http://test", {
      method: "PUT",
      body: JSON.stringify([
        { ptype: "p", v0: "admin", v1: "admin", v2: "read" },
        { ptype: "p", v0: "superadmin", v1: "superadmin", v2: "update" },
        { ptype: "p", v0: "admin", v1: "admin", v2: "update" },
      ]),
    });
    const res = await mod.PUT(req, {
      params: Promise.resolve({}),
      session: { user: { role: "superadmin" } },
    });
    expect(res.status).toBe(200);
    expect(await authorize("admin", "admin", "update")).toBe(true);
  });
});
