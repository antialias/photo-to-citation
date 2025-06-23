import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { Worker } from "node:worker_threads";

let dataDir: string;
let mod: typeof import("@/app/api/cases/[id]/jobs/route");
let pubMod: typeof import("@/app/api/public/cases/[id]/jobs/route");
let jobScheduler: typeof import("@/lib/jobScheduler");
let caseStore: typeof import("@/lib/caseStore");

beforeEach(async () => {
  dataDir = fs.mkdtempSync(path.join(os.tmpdir(), "cases-"));
  process.env.CASE_STORE_FILE = path.join(dataDir, "cases.sqlite");
  vi.resetModules();
  const db = await import("@/lib/db");
  await db.migrationsReady;
  caseStore = await import("@/lib/caseStore");
  jobScheduler = await import("@/lib/jobScheduler");
  jobScheduler.activeJobs.clear();
  mod = await import("@/app/api/cases/[id]/jobs/route");
  pubMod = await import("@/app/api/public/cases/[id]/jobs/route");
});

afterEach(() => {
  jobScheduler.activeJobs.clear();
  fs.rmSync(dataDir, { recursive: true, force: true });
  vi.resetModules();
  process.env.CASE_STORE_FILE = undefined;
});

describe("case jobs API", () => {
  it("rejects unauthorized user", async () => {
    const c = caseStore.createCase("/a.jpg");
    const res = await mod.GET(new Request("http://test"), {
      params: Promise.resolve({ id: c.id }),
      session: { user: { id: "u1", role: "user" } },
    });
    expect(res.status).toBe(403);
  });

  it("returns jobs for public case", async () => {
    const c = caseStore.createCase("/b.jpg", null, undefined, null, null, true);
    jobScheduler.activeJobs.set(1, {
      type: "analyzeCase",
      worker: { threadId: 1 } as Worker,
      startedAt: 1,
      caseId: c.id,
    });
    const res = await pubMod.GET(new Request("http://test"), {
      params: Promise.resolve({ id: c.id }),
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.jobs).toEqual([
      {
        id: 1,
        type: "analyzeCase",
        startedAt: 1,
        caseId: c.id,
        state: "running",
      },
    ]);
  });
});
