import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

let dataDir: string;
let orm: typeof import("@/lib/orm").orm;
let schema: typeof import("@/lib/schema");
let eq: typeof import("drizzle-orm").eq;

beforeEach(async () => {
  dataDir = fs.mkdtempSync(path.join(os.tmpdir(), "cases-"));
  process.env.CASE_STORE_FILE = path.join(dataDir, "cases.sqlite");
  vi.resetModules();
  const db = await import("@/lib/db");
  await db.migrationsReady;
  ({ orm } = await import("@/lib/orm"));
  schema = await import("@/lib/schema");
  ({ eq } = await import("drizzle-orm"));
  orm.insert(schema.users).values({ id: "u1" }).run();
  orm
    .insert(schema.casbinRules)
    .values({ ptype: "p", v0: "superadmin", v1: "admin", v2: "update" })
    .run();
});

afterEach(() => {
  fs.rmSync(dataDir, { recursive: true, force: true });
  vi.resetModules();
  process.env.CASE_STORE_FILE = undefined;
});

describe("change role route", () => {
  it("allows superadmins", async () => {
    const { PUT } = await import("../../api/users/[id]/role/route");
    const res = await PUT(
      new Request("http://test", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: "admin" }),
      }),
      {
        params: Promise.resolve({ id: "u1" }),
        session: { user: { role: "superadmin" } },
      },
    );
    expect(res.status).toBe(200);
    const row = orm
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, "u1"))
      .get();
    expect(row?.role).toBe("admin");
  });

  it("rejects non-superadmins", async () => {
    const { PUT } = await import("../../api/users/[id]/role/route");
    const res = await PUT(
      new Request("http://test", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: "admin" }),
      }),
      {
        params: Promise.resolve({ id: "u1" }),
        session: { user: { role: "admin" } },
      },
    );
    expect(res.status).toBe(403);
    const row = orm
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, "u1"))
      .get();
    expect(row?.role).toBe("user");
  });
});
