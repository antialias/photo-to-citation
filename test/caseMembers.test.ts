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
});
