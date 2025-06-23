import { EventEmitter } from "node:events";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import type { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("next/headers", () => ({ cookies: () => ({ get: vi.fn() }) }));

import type { Worker } from "node:worker_threads";

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

  it.skip("allows anonymous upload", async () => {
    const mod = await import("@/app/api/upload/route");
    const file = {
      arrayBuffer: async () => Buffer.from("a"),
      name: "a.jpg",
      type: "image/jpeg",
    } as unknown as File;
    const req = {
      method: "POST",
      headers: new Headers(),
      formData: async () => ({
        get(name: string) {
          if (name === "photo") return file;
          return null;
        },
      }),
    } as unknown as Request;
    const res = await mod.POST(req, {
      params: Promise.resolve({}),
      session: { user: { role: "anonymous" } },
    });
    expect(res.status).toBe(200);
  });
});
