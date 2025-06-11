import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

let dataDir: string;

beforeEach(async () => {
  dataDir = fs.mkdtempSync(path.join(os.tmpdir(), "sources-"));
  process.env.VIN_SOURCE_FILE = path.join(dataDir, "vinSources.json");
  const { defaultVinSources } = await import("../src/lib/vinSources");
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
});

describe("vin source health", () => {
  it("disables after three failures", async () => {
    const store = await import("../src/lib/vinSources");
    store.recordVinSourceFailure("edmunds");
    store.recordVinSourceFailure("edmunds");
    store.recordVinSourceFailure("edmunds");
    store.recordVinSourceFailure("edmunds");
    const list = store.getVinSourceStatuses();
    const item = list.find((s) => s.id === "edmunds");
    expect(item?.enabled).toBe(false);
  });
});
