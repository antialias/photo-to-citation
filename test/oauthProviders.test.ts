import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

let dataDir: string;

beforeEach(async () => {
  dataDir = fs.mkdtempSync(path.join(os.tmpdir(), "oauthprov-"));
  process.env.OAUTH_PROVIDER_FILE = path.join(dataDir, "providers.json");
  process.env.CASE_STORE_FILE = path.join(dataDir, "cases.sqlite");
  vi.resetModules();
  const db = await import("@/lib/db");
  await db.migrationsReady;
  const statuses = [
    { id: "google", enabled: true },
    { id: "facebook", enabled: true },
  ];
  fs.writeFileSync(process.env.OAUTH_PROVIDER_FILE, JSON.stringify(statuses));
});

afterEach(() => {
  fs.rmSync(dataDir, { recursive: true, force: true });
  vi.resetModules();
  process.env.OAUTH_PROVIDER_FILE = undefined;
  process.env.CASE_STORE_FILE = undefined;
});

describe("oauth provider store", () => {
  it("updates provider status", async () => {
    const store = await import("@/lib/oauthProviders");
    store.setOauthProviderEnabled("google", false);
    const list = store.getOauthProviderStatuses();
    const item = list.find((p) => p.id === "google");
    expect(item?.enabled).toBe(false);
  });
});

describe("oauth provider API authorization", () => {
  it("allows anonymous listing", async () => {
    const mod = await import("@/app/api/oauth-providers/route");
    const res = await mod.GET(new Request("http://test"), {
      params: Promise.resolve({}) as Promise<Record<string, string>>,
    });
    expect(res.status).toBe(200);
  });

  it("rejects update without superadmin role", async () => {
    const mod = await import("@/app/api/oauth-providers/[id]/route");
    const req = new Request("http://test", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled: false }),
    });
    const res = await mod.PUT(req, {
      params: Promise.resolve({ id: "google" }) as Promise<{ id: string }>,
      session: { user: { role: "admin" } },
    });
    expect(res.status).toBe(403);
  });

  it("allows listing with superadmin role", async () => {
    const mod = await import("@/app/api/oauth-providers/route");
    const res = await mod.GET(new Request("http://test"), {
      params: Promise.resolve({}) as Promise<Record<string, string>>,
      session: { user: { role: "superadmin" } },
    });
    expect(res.status).toBe(200);
  });
});
