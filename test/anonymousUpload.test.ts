// @vitest-environment node
import { EventEmitter } from "node:events";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import type { Worker } from "node:worker_threads";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("next/headers", () => ({ cookies: () => ({ get: vi.fn() }) }));

const terminateMock = vi.fn();
const worker = Object.assign(new EventEmitter(), {
  terminate: terminateMock,
}) as unknown as Worker;

const runJobMock = vi.fn(() => worker);
vi.mock("@/lib/jobScheduler", () => ({ runJob: runJobMock }));
vi.mock("@/lib/thumbnails", () => ({
  generateThumbnailsInBackground: vi.fn(),
}));
vi.mock("@/lib/exif", () => ({
  extractGps: () => null,
  extractTimestamp: () => null,
}));
vi.mock("@/lib/caseLocation", () => ({
  fetchCaseLocationInBackground: vi.fn(),
}));

let dataDir: string;
let upload: typeof import("@/app/api/upload/route");
let caseRoute: typeof import("@/app/api/cases/[id]/route");

beforeEach(async () => {
  dataDir = fs.mkdtempSync(path.join(os.tmpdir(), "cases-"));
  process.env.CASE_STORE_FILE = path.join(dataDir, "cases.sqlite");
  vi.resetModules();
  vi.doMock("next/headers", () => ({
    cookies: () => ({
      get: vi.fn(),
      set: vi.fn(),
      delete: vi.fn(),
      getAll: () => [],
      has: vi.fn(),
    }),
  }));
  const db = await import("@/lib/db");
  await db.migrationsReady;
  upload = await import("@/app/api/upload/route");
  caseRoute = await import("@/app/api/cases/[id]/route");
});

afterEach(() => {
  fs.rmSync(dataDir, { recursive: true, force: true });
  vi.resetModules();
  process.env.CASE_STORE_FILE = undefined;
});

describe("anonymous upload", () => {
  it("sets session cookie and returns case", async () => {
    const file = new File([Buffer.from("a")], "a.jpg", { type: "image/jpeg" });
    const form = new FormData();
    form.append("photo", file);
    const req = new Request("http://test", { method: "POST", body: form });
    const res = await upload.POST(req, { params: Promise.resolve({}) });
    await new Promise((r) => setImmediate(r));
    worker.emit("exit");
    expect(res.status).toBe(200);
    const setCookie = res.headers.get("set-cookie") ?? "";
    expect(setCookie).toMatch(/anon/);
    const { caseId } = await res.json();
    const getReq = new Request("http://test", {
      headers: { cookie: setCookie.split(";")[0] },
    });
    const caseRes = await caseRoute.GET(getReq, {
      params: Promise.resolve({ id: caseId }),
    });
    expect(caseRes.status).toBe(200);
    const data = await caseRes.json();
    expect(data.id).toBe(caseId);
  }, 15000);
});
