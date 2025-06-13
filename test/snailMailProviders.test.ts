import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

let dataDir: string;

beforeEach(async () => {
  dataDir = fs.mkdtempSync(path.join(os.tmpdir(), "mailprov-"));
  process.env.SNAIL_MAIL_PROVIDER_FILE = path.join(dataDir, "providers.json");
  const { snailMailProviders } = await import("../src/lib/snailMail");
  const statuses = Object.keys(snailMailProviders).map((id, idx) => ({
    id,
    active: idx === 0,
    failureCount: 0,
  }));
  fs.writeFileSync(process.env.SNAIL_MAIL_PROVIDER_FILE, JSON.stringify(statuses));
});

afterEach(() => {
  fs.rmSync(dataDir, { recursive: true, force: true });
  vi.resetModules();
  process.env.SNAIL_MAIL_PROVIDER_FILE = undefined;
});

describe("snail mail provider store", () => {
  it("activates the selected provider", async () => {
    const store = await import("../src/lib/snailMailProviders");
    store.setActiveSnailMailProvider("docsmit");
    const list = store.getSnailMailProviderStatuses();
    const active = list.find((p) => p.active);
    expect(active?.id).toBe("docsmit");
  });

  it("records failures", async () => {
    const store = await import("../src/lib/snailMailProviders");
    store.recordProviderFailure("mock");
    const item = store.getSnailMailProviderStatuses().find((p) => p.id === "mock");
    expect(item?.failureCount).toBe(1);
  });
});
