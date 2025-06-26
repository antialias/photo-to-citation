import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { Worker } from "node:worker_threads";

let dataDir: string;
let mod: typeof import("@/app/api/system/jobs/route");
let jobScheduler: typeof import("@/lib/jobScheduler");
let orm: typeof import("@/lib/orm").orm;
let schema: typeof import("@/lib/schema");
let db: typeof import("@/lib/db");

beforeEach(async () => {
  dataDir = fs.mkdtempSync(path.join(os.tmpdir(), "cases-"));
  process.env.CASE_STORE_FILE = path.join(dataDir, "cases.sqlite");
  vi.resetModules();
  db = await import("@/lib/db");
  await db.migrationsReady;
  ({ orm } = await import("@/lib/orm"));
  schema = await import("@/lib/schema");
  orm
    .insert(schema.casbinRules)
    .values({ ptype: "p", v0: "superadmin", v1: "superadmin", v2: "read" })
    .run();
  mod = await import("@/app/api/system/jobs/route");
  jobScheduler = await import("@/lib/jobScheduler");
  jobScheduler.activeJobs.clear();
});

afterEach(() => {
  db.closeDb();
  jobScheduler.activeJobs.clear();
  vi.resetModules();
  fs.rmSync(dataDir, { recursive: true, force: true });
  process.env.CASE_STORE_FILE = undefined;
});

describe("system jobs API", () => {
  it("rejects non-superadmin", async () => {
    const res = await mod.GET(new Request("http://test"), {
      params: Promise.resolve({}),
      session: { user: { role: "admin" } },
    });
    expect(res.status).toBe(403);
  });

  it("lists, audits and filters jobs", async () => {
    jobScheduler.activeJobs.set(1, {
      type: "a",
      worker: { threadId: 1 } as Worker,
      startedAt: 1,
    });
    jobScheduler.activeJobs.set(2, {
      type: "b",
      worker: { threadId: -1 } as Worker,
      startedAt: 2,
    });
    const res = await mod.GET(new Request("http://test?type=a"), {
      params: Promise.resolve({}),
      session: { user: { role: "superadmin" } },
    });
    expect(res.status).toBe(200);
    const { jobs, auditedAt, updatedAt } = await res.json();
    expect(jobs).toEqual([{ id: 1, type: "a", startedAt: 1 }]);
    expect(auditedAt).toBeGreaterThan(0);
    expect(updatedAt).toBeGreaterThanOrEqual(auditedAt);
  });
});
