import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

let authz: typeof import("@/lib/authz");
let caseStore: typeof import("@/lib/caseStore");
let orm: typeof import("@/lib/orm").orm;
let schema: typeof import("@/lib/schema");
let dataDir: string;

beforeEach(async () => {
  process.env.VITEST = "1";
  process.env.TEST_APIS = undefined as unknown as string;
  dataDir = fs.mkdtempSync(path.join(os.tmpdir(), "cases-"));
  process.env.CASE_STORE_FILE = path.join(dataDir, "cases.sqlite");
  vi.resetModules();
  const db = await import("@/lib/db");
  await db.migrationsReady();
  ({ orm } = await import("@/lib/orm"));
  schema = await import("@/lib/schema");
  caseStore = await import("@/lib/caseStore");
  orm
    .insert(schema.casbinRules)
    .values([
      { ptype: "p", v0: "admin", v1: "cases", v2: "read" },
      { ptype: "p", v0: "user", v1: "cases", v2: "read" },
    ])
    .run();
  orm
    .insert(schema.users)
    .values([{ id: "u1" }, { id: "u2" }])
    .run();
  authz = await import("@/lib/authz");
});

afterEach(() => {
  fs.rmSync(dataDir, { recursive: true, force: true });
  vi.resetModules();
  process.env.CASE_STORE_FILE = undefined;
  process.env.VITEST = undefined as unknown as string;
});

describe("withAuthorization", () => {
  it("calls handler when authorized", async () => {
    const handler = vi.fn(async () => new Response("ok"));
    const wrapped = authz.withAuthorization({ obj: "cases" }, handler);
    const ctx: {
      params: Promise<Record<string, string>>;
      session: { user: { role: string } };
    } = {
      params: Promise.resolve({}),
      session: { user: { role: "admin" } },
    };
    const res = await wrapped(new Request("http://test"), ctx);

    expect(handler).toHaveBeenCalledOnce();
    expect((await res.text()).trim()).toBe("ok");
  });

  it("returns 403 when unauthorized", async () => {
    const handler = vi.fn();
    const wrapped = authz.withAuthorization({ obj: "cases" }, handler);
    const ctx: {
      params: Promise<Record<string, string>>;
      session: { user: { role: string } };
    } = {
      params: Promise.resolve({}),
      session: { user: { role: "guest" } },
    };
    const res = await wrapped(new Request("http://test"), ctx);

    expect(res.status).toBe(403);
    expect(handler).not.toHaveBeenCalled();
  });
});

describe("withCaseAuthorization", () => {
  it("passes case and user to authorize", async () => {
    const c = caseStore.createCase("/a.jpg", null, undefined, null, "u1");
    const handler = vi.fn(async () => new Response("done"));
    const wrapped = authz.withCaseAuthorization({ obj: "cases" }, handler);
    const ctx: {
      params: Promise<{ id: string } & Record<string, string>>;
      session: { user: { id: string; role: string } };
    } = {
      params: Promise.resolve({ id: c.id }),
      session: { user: { id: "u1", role: "user" } },
    };
    const res = await wrapped(new Request("http://test"), ctx);

    expect(res.status).toBe(200);
    expect(handler).toHaveBeenCalledOnce();
  });

  it("returns 403 when case access denied", async () => {
    const c = caseStore.createCase("/b.jpg", null, undefined, null, "u1");
    const handler = vi.fn();
    const wrapped = authz.withCaseAuthorization({ obj: "cases" }, handler);
    const ctx: {
      params: Promise<{ id: string } & Record<string, string>>;
      session: { user: { id: string; role: string } };
    } = {
      params: Promise.resolve({ id: c.id }),
      session: { user: { id: "u2", role: "user" } },
    };
    const res = await wrapped(new Request("http://test"), ctx);

    expect(res.status).toBe(403);
    expect(handler).not.toHaveBeenCalled();
  });
});
