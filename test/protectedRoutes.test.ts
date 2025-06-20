import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import type { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

let dataDir: string;

beforeEach(async () => {
  dataDir = fs.mkdtempSync(path.join(os.tmpdir(), "cases-"));
  process.env.CASE_STORE_FILE = path.join(dataDir, "cases.sqlite");
  vi.resetModules();
  const db = await import("@/lib/db");
  await db.migrationsReady;
});

afterEach(() => {
  fs.rmSync(dataDir, { recursive: true, force: true });
  vi.resetModules();
  process.env.CASE_STORE_FILE = undefined;
});

describe("protected routes", () => {
  it("returns 403 when unauthorized", async () => {
    const store = await import("@/lib/caseStore");
    const c = store.createCase("/a.jpg", null);
    const mod = await import("@/app/api/cases/[id]/route");
    const res = await mod.GET(new Request("http://test"), {
      params: Promise.resolve({ id: c.id }),
      session: { user: { role: "anonymous" } },
    });
    expect(res.status).toBe(403);
  });

  it("protects upload", async () => {
    const mod = await import("@/app/api/upload/route");
    const file = new File([Buffer.from("a")], "a.jpg", { type: "image/jpeg" });
    const form = new FormData();
    form.append("photo", file);
    const req = new Request("http://test", { method: "POST", body: form });
    const res = await mod.POST(req as unknown as NextRequest, {
      params: Promise.resolve({}),
      session: { user: { role: "anonymous" } },
    });
    expect(res.status).toBe(403);
  });
});
