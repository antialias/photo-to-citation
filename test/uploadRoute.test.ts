import { EventEmitter } from "node:events";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import type { Worker } from "node:worker_threads";
import { config } from "@/lib/config";
import {
  type MockInstance,
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
vi.mock("next/headers", () => ({ cookies: () => ({ get: vi.fn() }) }));

let dataDir: string;
let tmpDir: string;
let mod: typeof import("@/app/api/upload/route");
let caseStore: typeof import("@/lib/caseStore");
let caseAnalysis: typeof import("@/lib/caseAnalysis");
let cancelSpy: MockInstance | undefined;

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

beforeEach(async () => {
  dataDir = fs.mkdtempSync(path.join(os.tmpdir(), "cases-"));
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "uploads-"));
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
  caseStore = await import("@/lib/caseStore");
  caseAnalysis = await import("@/lib/caseAnalysis");
  cancelSpy = vi.spyOn(caseAnalysis, "cancelCaseAnalysis");
  fs.mkdirSync(config.UPLOAD_DIR, {
    recursive: true,
  });
  mod = await import("@/app/api/upload/route");
});

afterEach(() => {
  fs.rmSync(dataDir, { recursive: true, force: true });
  fs.rmSync(tmpDir, { recursive: true, force: true });
  fs.rmSync(config.UPLOAD_DIR, {
    recursive: true,
    force: true,
  });
  vi.resetModules();
  process.env.CASE_STORE_FILE = undefined;
  cancelSpy?.mockRestore();
});

describe("upload route", () => {
  it("cancels active analysis when uploading additional photo", async () => {
    const c = caseStore.createCase("/a.jpg");
    caseAnalysis.analyzeCaseInBackground(c);
    expect(runJobMock).toHaveBeenCalledTimes(1);

    const fakeReq = {
      method: "POST",
      formData: async () => ({
        get(name: string) {
          if (name === "photo") {
            return {
              arrayBuffer: async () => Buffer.from("b"),
              name: "b.jpg",
              type: "image/jpeg",
            } as unknown as File;
          }
          if (name === "caseId") return c.id;
          return null;
        },
      }),
    } as unknown as Request;
    const res = await mod.POST(fakeReq, {
      params: Promise.resolve({}),
      session: { user: { role: "user" } },
    });
    worker.emit("exit");
    worker.emit("exit");
    expect(res.status).toBe(200);
    expect(cancelSpy).toHaveBeenCalledWith(c.id);
    expect(terminateMock).toHaveBeenCalledTimes(1);
    expect(runJobMock).toHaveBeenCalledTimes(2);
    const updated = caseStore.getCase(c.id);
    expect(updated?.photos.length).toBe(2);
  });
});
