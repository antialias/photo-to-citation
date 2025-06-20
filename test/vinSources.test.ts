import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

let dataDir: string;

beforeEach(async () => {
  dataDir = fs.mkdtempSync(path.join(os.tmpdir(), "sources-"));
  process.env.VIN_SOURCE_FILE = path.join(dataDir, "vinSources.json");
  process.env.CASE_STORE_FILE = path.join(dataDir, "cases.sqlite");
  vi.resetModules();
  const db = await import("@/lib/db");
  await db.migrationsReady;
  const { defaultVinSources } = await import("@/lib/vinSources");
  const statuses = defaultVinSources.map((s: { id: string }) => ({
    id: s.id,
    enabled: true,
    failureCount: 0,
  }));
  fs.writeFileSync(process.env.VIN_SOURCE_FILE, JSON.stringify(statuses));
});

afterEach(() => {
  fs.rmSync(dataDir, { recursive: true, force: true });
  vi.resetModules();
  process.env.VIN_SOURCE_FILE = undefined;
  process.env.CASE_STORE_FILE = undefined;
});

describe("vin source health", () => {
  it("disables after three failures", async () => {
    const store = await import("@/lib/vinSources");
    store.recordVinSourceFailure("edmunds");
    store.recordVinSourceFailure("edmunds");
    store.recordVinSourceFailure("edmunds");
    store.recordVinSourceFailure("edmunds");
    const list = store.getVinSourceStatuses();
    const item = list.find((s) => s.id === "edmunds");
    expect(item?.enabled).toBe(false);
  });
});

describe("vin source API authorization", () => {
  it("rejects listing without admin role", async () => {
    const mod = await import("@/app/api/vin-sources/route");
    const res = await mod.GET(new Request("http://test"), {
      params: Promise.resolve({}) as Promise<Record<string, string>>,
      session: { user: { role: "user" } },
    });
    expect(res.status).toBe(403);
  });

  it("rejects update without admin role", async () => {
    const mod = await import("@/app/api/vin-sources/[id]/route");
    const req = new Request("http://test", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled: false }),
    });
    const res = await mod.PUT(req, {
      params: Promise.resolve({ id: "edmunds" }) as Promise<{ id: string }>,
      session: { user: { role: "user" } },
    });
    expect(res.status).toBe(403);
  });
});
