import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

let dataDir: string;
let caseStore: typeof import("@/lib/caseStore");

beforeEach(async () => {
  dataDir = fs.mkdtempSync(path.join(os.tmpdir(), "cases-"));
  process.env.CASE_STORE_FILE = path.join(dataDir, "cases.sqlite");
  vi.resetModules();
  const db = await import("@/lib/db");
  await db.migrationsReady();
  caseStore = await import("@/lib/caseStore");
});

afterEach(() => {
  fs.rmSync(dataDir, { recursive: true, force: true });
  vi.resetModules();
  process.env.CASE_STORE_FILE = undefined;
});

describe("public cases API", () => {
  it("returns a public case", async () => {
    const c = caseStore.createCase(
      "/a.jpg",
      null,
      undefined,
      null,
      undefined,
      true,
    );
    const mod = await import("@/app/api/public/cases/[id]/route");
    const res = await mod.GET(new Request("http://test"), {
      params: Promise.resolve({ id: c.id }),
    });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.id).toBe(c.id);
  });

  it("rejects private cases", async () => {
    const c = caseStore.createCase("/b.jpg", null);
    const mod = await import("@/app/api/public/cases/[id]/route");
    const res = await mod.GET(new Request("http://test"), {
      params: Promise.resolve({ id: c.id }),
    });
    expect(res.status).toBe(403);
  });
});
