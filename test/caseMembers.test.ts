import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

let dataDir: string;
let caseStore: typeof import("../src/lib/caseStore");
let members: typeof import("../src/lib/caseMembers");
let orm: typeof import("../src/lib/orm").orm;
let schema: typeof import("../src/lib/schema");

beforeEach(async () => {
  dataDir = fs.mkdtempSync(path.join(os.tmpdir(), "cases-"));
  process.env.CASE_STORE_FILE = path.join(dataDir, "cases.sqlite");
  vi.resetModules();
  const db = await import("../src/lib/db");
  await db.migrationsReady;
  ({ orm } = await import("../src/lib/orm"));
  schema = await import("../src/lib/schema");
  orm.insert(schema.users).values({ id: "u1" }).run();
  orm.insert(schema.users).values({ id: "u2" }).run();
  orm.insert(schema.users).values({ id: "u3", role: "admin" }).run();
  orm
    .insert(schema.casbinRules)
    .values({ ptype: "p", v0: "user", v1: "cases", v2: "read" })
    .run();
  caseStore = await import("../src/lib/caseStore");
  members = await import("../src/lib/caseMembers");
});

afterEach(() => {
  fs.rmSync(dataDir, { recursive: true, force: true });
  vi.resetModules();
  process.env.CASE_STORE_FILE = undefined;
});

describe("case members", () => {
  it("assigns owner on create", () => {
    const c = caseStore.createCase("/a.jpg", null, undefined, null, "u1");
    expect(members.isCaseMember(c.id, "u1", "owner")).toBe(true);
  });

  it("adds and removes collaborator", () => {
    const c = caseStore.createCase("/b.jpg", null, undefined, null, "u1");
    members.addCaseMember(c.id, "u2", "collaborator");
    let list = members.listCaseMembers(c.id);
    expect(list).toHaveLength(2);
    members.removeCaseMember(c.id, "u2");
    list = members.listCaseMembers(c.id);
    expect(list.some((m) => m.userId === "u2")).toBe(false);
  });

  it("stores public flag", () => {
    const c = caseStore.createCase(
      "/c.jpg",
      null,
      undefined,
      null,
      undefined,
      true,
    );
    const loaded = caseStore.getCase(c.id);
    expect(loaded?.public).toBe(true);
  });

  it("owner invites collaborator via API", async () => {
    const c = caseStore.createCase("/d.jpg", null, undefined, null, "u1");
    const { POST } = await import("../src/app/api/cases/[id]/invite/route");
    const res = await POST(
      new Request("http://test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: "u2" }),
      }),
      {
        params: Promise.resolve({ id: c.id }),
        session: { user: { id: "u1", role: "user" } },
      },
    );
    expect(res.status).toBe(200);
    const list = members.listCaseMembers(c.id);
    expect(list.some((m) => m.userId === "u2")).toBe(true);
  });

  it("rejects collaborator invite", async () => {
    const c = caseStore.createCase("/e.jpg", null, undefined, null, "u1");
    members.addCaseMember(c.id, "u2", "collaborator");
    const { POST } = await import("../src/app/api/cases/[id]/invite/route");
    const res = await POST(
      new Request("http://test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: "u3" }),
      }),
      {
        params: Promise.resolve({ id: c.id }),
        session: { user: { id: "u2", role: "user" } },
      },
    );
    expect(res.status).toBe(403);
  });

  it("admin can remove member", async () => {
    const c = caseStore.createCase("/f.jpg", null, undefined, null, "u1");
    members.addCaseMember(c.id, "u2", "collaborator");
    const { DELETE } = await import(
      "../src/app/api/cases/[id]/members/[uid]/route"
    );
    const res = await DELETE(new Request("http://test"), {
      params: Promise.resolve({ id: c.id, uid: "u2" }),
      session: { user: { id: "u3", role: "admin" } },
    });
    expect(res.status).toBe(200);
    const list = members.listCaseMembers(c.id);
    expect(list.some((m) => m.userId === "u2")).toBe(false);
  });

  it("non-owner cannot remove member", async () => {
    const c = caseStore.createCase("/g.jpg", null, undefined, null, "u1");
    members.addCaseMember(c.id, "u2", "collaborator");
    const { DELETE } = await import(
      "../src/app/api/cases/[id]/members/[uid]/route"
    );
    const res = await DELETE(new Request("http://test"), {
      params: Promise.resolve({ id: c.id, uid: "u2" }),
      session: { user: { id: "u2", role: "user" } },
    });
    expect(res.status).toBe(403);
  });
});
