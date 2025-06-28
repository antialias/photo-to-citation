import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

let dataDir: string;
let uploadDir: string;
let route: typeof import("@/app/uploads/[...path]/route");
let store: typeof import("@/lib/caseStore");
let configMod: typeof import("@/lib/config");
let orm: typeof import("@/lib/orm").orm;
let schema: typeof import("@/lib/schema");
let origUploadDir: string;

beforeEach(async () => {
  dataDir = fs.mkdtempSync(path.join(os.tmpdir(), "cases-"));
  uploadDir = fs.mkdtempSync(path.join(os.tmpdir(), "uploads-"));
  process.env.CASE_STORE_FILE = path.join(dataDir, "cases.sqlite");
  vi.resetModules();
  const db = await import("@/lib/db");
  await db.migrationsReady;
  ({ orm } = await import("@/lib/orm"));
  schema = await import("@/lib/schema");
  orm
    .insert(schema.casbinRules)
    .values({ ptype: "p", v0: "user", v1: "cases", v2: "read" })
    .run();
  orm
    .insert(schema.users)
    .values([{ id: "u1" }, { id: "u2" }])
    .run();
  store = await import("@/lib/caseStore");
  configMod = await import("@/lib/config");
  origUploadDir = configMod.config.UPLOAD_DIR;
  configMod.config.UPLOAD_DIR = uploadDir;
  fs.mkdirSync(uploadDir, { recursive: true });
  route = await import("@/app/uploads/[...path]/route");
});

afterEach(() => {
  fs.rmSync(dataDir, { recursive: true, force: true });
  fs.rmSync(uploadDir, { recursive: true, force: true });
  vi.resetModules();
  process.env.CASE_STORE_FILE = undefined;
  if (configMod) configMod.config.UPLOAD_DIR = origUploadDir;
});

describe("uploads route authorization", () => {
  it("rejects access by non-member", async () => {
    const c = store.createCase("a.jpg", null, undefined, null, "u1");
    fs.writeFileSync(path.join(uploadDir, "a.jpg"), "a");
    const res = await route.GET(new Request("http://test"), {
      params: Promise.resolve({ path: ["a.jpg"] }),
      session: { user: { id: "u2", role: "user" } },
    });
    expect(res.status).toBe(403);
  });

  it("allows access via anonymous session", async () => {
    const c = store.createCase("b.jpg");
    store.setCaseSessionId(c.id, "sess");
    fs.writeFileSync(path.join(uploadDir, "b.jpg"), "b");
    const req = new Request("http://test");
    req.headers.set("cookie", "anon_session_id=sess");
    const res = await route.GET(req, {
      params: Promise.resolve({ path: ["b.jpg"] }),
    });
    expect(res.status).toBe(200);
  });
});
