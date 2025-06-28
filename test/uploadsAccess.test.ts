import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

let dataDir: string;
let uploadDir: string;
let mod: typeof import("@/app/uploads/[...path]/route");
let store: typeof import("@/lib/caseStore");
let config: typeof import("@/lib/config").config;

beforeEach(async () => {
  dataDir = fs.mkdtempSync(path.join(os.tmpdir(), "cases-"));
  uploadDir = fs.mkdtempSync(path.join(os.tmpdir(), "uploads-"));
  process.env.CASE_STORE_FILE = path.join(dataDir, "cases.sqlite");
  vi.resetModules();
  const db = await import("@/lib/db");
  await db.migrationsReady;
  store = await import("@/lib/caseStore");
  const { orm } = await import("@/lib/orm");
  const { users } = await import("@/lib/schema");
  orm.insert(users).values({ id: "u1" }).run();
  ({ config } = await import("@/lib/config"));
  config.UPLOAD_DIR = uploadDir;
  fs.writeFileSync(path.join(uploadDir, "a.jpg"), "a");
  mod = await import("@/app/uploads/[...path]/route");
});

afterEach(() => {
  fs.rmSync(dataDir, { recursive: true, force: true });
  fs.rmSync(uploadDir, { recursive: true, force: true });
  vi.resetModules();
  process.env.CASE_STORE_FILE = undefined;
});

describe("uploads access", () => {
  it("denies private case photo to strangers", async () => {
    const c = store.createCase("a.jpg", null, undefined, null, "u1");
    const res = await mod.GET(new Request("http://test"), {
      params: Promise.resolve({ path: ["a.jpg"] }),
    });
    expect(res.status).toBe(403);
  });

  it("allows access when session matches", async () => {
    const c = store.createCase("a.jpg");
    store.setCaseSessionId(c.id, "sess");
    const req = new Request("http://test");
    req.headers.set("cookie", "anon_session_id=sess");
    const res = await mod.GET(req, {
      params: Promise.resolve({ path: ["a.jpg"] }),
    });
    expect(res.status).toBe(200);
  });

  it("allows member access", async () => {
    const c = store.createCase("a.jpg", null, undefined, null, "u1");
    const res = await mod.GET(new Request("http://test"), {
      params: Promise.resolve({ path: ["a.jpg"] }),
      session: { user: { id: "u1", role: "user" } },
    });
    expect(res.status).toBe(200);
  });

  it("allows access to public case photo", async () => {
    store.createCase("a.jpg", null, undefined, null, undefined, true);
    const res = await mod.GET(new Request("http://test"), {
      params: Promise.resolve({ path: ["a.jpg"] }),
    });
    expect(res.status).toBe(200);
  });
});
