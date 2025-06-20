import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

let dataDir: string;

beforeEach(async () => {
  dataDir = fs.mkdtempSync(path.join(os.tmpdir(), "mailprov-"));
  process.env.SNAIL_MAIL_PROVIDER_FILE = path.join(dataDir, "providers.json");
  process.env.CASE_STORE_FILE = path.join(dataDir, "cases.sqlite");
  vi.resetModules();
  const db = await import("@/lib/db");
  await db.migrationsReady;
  const { snailMailProviders } = await import("@/lib/snailMail");
  const statuses = Object.keys(snailMailProviders).map((id, idx) => ({
    id,
    active: idx === 0,
    failureCount: 0,
  }));
  fs.writeFileSync(
    process.env.SNAIL_MAIL_PROVIDER_FILE,
    JSON.stringify(statuses),
  );
});

afterEach(() => {
  fs.rmSync(dataDir, { recursive: true, force: true });
  vi.resetModules();
  process.env.SNAIL_MAIL_PROVIDER_FILE = undefined;
  process.env.CASE_STORE_FILE = undefined;
});

describe("snail mail provider store", () => {
  it("activates the selected provider", async () => {
    const store = await import("@/lib/snailMailProviders");
    store.setActiveSnailMailProvider("docsmit");
    const list = store.getSnailMailProviderStatuses();
    const active = list.find((p) => p.active);
    expect(active?.id).toBe("docsmit");
  });

  it("records failures", async () => {
    const store = await import("@/lib/snailMailProviders");
    store.recordProviderFailure("mock");
    const item = store
      .getSnailMailProviderStatuses()
      .find((p) => p.id === "mock");
    expect(item?.failureCount).toBe(1);
  });
});

describe("snail mail provider API authorization", () => {
  it("rejects listing without admin role", async () => {
    const mod = await import("@/app/api/snail-mail-providers/route");
    const res = await mod.GET(new Request("http://test"), {
      params: Promise.resolve({}) as Promise<Record<string, string>>,
      session: { user: { role: "user" } },
    });
    expect(res.status).toBe(403);
  });

  it("rejects update without admin role", async () => {
    const mod = await import("@/app/api/snail-mail-providers/[id]/route");
    const req = new Request("http://test", { method: "PUT" });
    const res = await mod.PUT(req, {
      params: Promise.resolve({ id: "mock" }) as Promise<{ id: string }>,
      session: { user: { role: "user" } },
    });
    expect(res.status).toBe(403);
  });
});
