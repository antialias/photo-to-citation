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
  await db.migrationsReady;
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
      body: JSON.stringify({
        name: "Bob",
        bio: "bio",
        address: "123 A St",
        cityStateZip: "City, ST 12345",
        daytimePhone: "555-0000",
        driverLicenseNumber: "D123",
        driverLicenseState: "IL",
      }),
    });
    await mod.PUT(req, {
      params: Promise.resolve({}),
      session: { user: { id: "u1" } },
    });

    const { getUser } = await import("@/lib/userStore");
    const updated = getUser("u1");
    expect(updated?.name).toBe("Bob");
    expect(updated?.bio).toBe("bio");
    expect(updated?.address).toBe("123 A St");
    expect(updated?.cityStateZip).toBe("City, ST 12345");
    expect(updated?.daytimePhone).toBe("555-0000");
    expect(updated?.driverLicenseNumber).toBe("D123");
    expect(updated?.driverLicenseState).toBe("IL");
  });

  it("defaults image to gravatar when blank", async () => {
    const { orm } = await import("@/lib/orm");
    const schema = await import("@/lib/schema");
    const { eq } = await import("drizzle-orm");
    orm
      .update(schema.users)
      .set({ image: "" })
      .where(eq(schema.users.id, "u1"))
      .run();

    const { getUser } = await import("@/lib/userStore");
    const user = getUser("u1");
    expect(user?.image).toMatch(/gravatar\.com/);
  });
});
