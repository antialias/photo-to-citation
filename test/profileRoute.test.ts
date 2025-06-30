import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

let dataDir: string;

beforeEach(async () => {
  dataDir = fs.mkdtempSync(path.join(os.tmpdir(), "cases-"));
  process.env.CASE_STORE_FILE = path.join(dataDir, "cases.sqlite");
  vi.resetModules();
  const db = await import("@/lib/db");
  await db.migrationsReady();
  const { orm } = await import("@/lib/orm");
  const { users } = await import("@/lib/schema");
  orm
    .insert(users)
    .values({ id: "u1", name: "Alice", email: "a@example.com" })
    .run();
});

afterEach(() => {
  fs.rmSync(dataDir, { recursive: true, force: true });
  vi.resetModules();
  process.env.CASE_STORE_FILE = undefined;
});

describe("profile API", () => {
  it("reads and updates profile", async () => {
    const mod = await import("@/app/api/profile/route");
    const getRes = await mod.GET(new Request("http://test"), {
      params: Promise.resolve({}),
      session: { user: { id: "u1" } },
    });
    const user = await getRes.json();
    expect(user.name).toBe("Alice");

    const req = new Request("http://test", {
      method: "PUT",
      body: JSON.stringify({ name: "Bob" }),
    });
    await mod.PUT(req, {
      params: Promise.resolve({}),
      session: { user: { id: "u1" } },
    });

    const { getUser } = await import("@/lib/userStore");
    const updated = getUser("u1");
    expect(updated?.name).toBe("Bob");
  });
});
