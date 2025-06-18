import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

let dataDir: string;
let caseStore: typeof import("../src/lib/caseStore");

beforeEach(async () => {
  dataDir = fs.mkdtempSync(path.join(os.tmpdir(), "cases-"));
  process.env.CASE_STORE_FILE = path.join(dataDir, "cases.sqlite");
  vi.resetModules();
  const db = await import("../src/lib/db");
  await db.migrationsReady;
  caseStore = await import("../src/lib/caseStore");
  const { orm } = await import("../src/lib/orm");
  const { users } = await import("../src/lib/schema");
  orm
    .insert(users)
    .values([{ id: "u1" }, { id: "u2" }])
    .run();
});

afterEach(() => {
  fs.rmSync(dataDir, { recursive: true, force: true });
  vi.resetModules();
  process.env.CASE_STORE_FILE = undefined;
});

describe("case authorization", () => {
  it("rejects deletion by non-member", async () => {
    const c = caseStore.createCase("/a.jpg", null, undefined, null, "u1");
    const { DELETE } = await import("../src/app/api/cases/[id]/route");
    const res = await DELETE(new Request("http://test", { method: "DELETE" }), {
      params: Promise.resolve({ id: c.id }),
      session: { user: { id: "u2", role: "user" } },
    });
    expect(res.status).toBe(403);
  });

  it("rejects update by non-member", async () => {
    const c = caseStore.createCase("/b.jpg", null, undefined, null, "u1");
    const { PUT } = await import("../src/app/api/cases/[id]/vin/route");
    const req = new Request("http://test", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ vin: "1" }),
    });
    const res = await PUT(req, {
      params: Promise.resolve({ id: c.id }),
      session: { user: { id: "u2", role: "user" } },
    });
    expect(res.status).toBe(403);
  });

  it("rejects public toggle by non-member", async () => {
    const c = caseStore.createCase("/c.jpg", null, undefined, null, "u1");
    const { PUT } = await import("../src/app/api/cases/[id]/public/route");
    const req = new Request("http://test", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ public: true }),
    });
    const res = await PUT(req, {
      params: Promise.resolve({ id: c.id }),
      session: { user: { id: "u2", role: "user" } },
    });
    expect(res.status).toBe(403);
  });

  it("rejects private case read by anonymous user", async () => {
    const c = caseStore.createCase("/d.jpg", null, undefined, null, "u1");
    const { GET } = await import("../src/app/api/cases/[id]/route");
    const res = await GET(new Request("http://test"), {
      params: Promise.resolve({ id: c.id }),
    });
    expect(res.status).toBe(403);
  });

  it("allows superadmin to toggle visibility", async () => {
    const c = caseStore.createCase("/d.jpg", null, undefined, null, "u1");
    const { PUT } = await import("../src/app/api/cases/[id]/public/route");
    const req = new Request("http://test", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ public: true }),
    });
    const res = await PUT(req, {
      params: Promise.resolve({ id: c.id }),
      session: { user: { id: "s1", role: "superadmin" } },
    });
    expect(res.status).toBe(200);
  });
});
