import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { createApi } from "./api";
import { createAuthHelpers } from "./authHelpers";
import { type OpenAIStub, startOpenAIStub } from "./openaiStub";
import { createPhoto } from "./photo";
import { type TestServer, startServer } from "./startServer";

let server: TestServer;
let api: (path: string, opts?: RequestInit) => Promise<Response>;
let stub: OpenAIStub;

vi.setConfig({ testTimeout: 60000 });

async function createCase(): Promise<string> {
  const file = createPhoto("a");
  const form = new FormData();
  form.append("photo", file);
  const res = await api("/api/upload", { method: "POST", body: form });
  const data = (await res.json()) as { caseId: string };
  return data.caseId;
}

let setUserRoleAndLogIn: (opts: {
  email: string;
  role: string;
  promoted_by: string;
}) => Promise<void>;
let signIn: (email: string) => Promise<Response>;
let signOut: () => Promise<void>;
beforeAll(async () => {
  stub = await startOpenAIStub({
    violationType: "parking",
    details: "car parked illegally",
    vehicle: {},
    images: {},
  });
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "e2e-admin-"));
  const case_store_file = path.join(tmpDir, "cases.sqlite");
  server = await startServer(3021, {
    NEXTAUTH_SECRET: "secret",
    NODE_ENV: "test",
    SMTP_FROM: "test@example.com",
    CASE_STORE_FILE: case_store_file,
    SUPER_ADMIN_EMAIL: "super@example.com",
    OPENAI_BASE_URL: stub.url,
  });
  api = createApi(server);
  ({ setUserRoleAndLogIn, signIn, signOut } = createAuthHelpers(api, server));
  await signIn("super@example.com");
  await signOut();
});

afterAll(async () => {
  await server.close();
  await stub.close();
});

describe("admin actions", () => {
  it("promotes and demotes users", async () => {
    await signIn("admin@example.com");
    await setUserRoleAndLogIn({
      email: "admin@example.com",
      role: "admin",
      promoted_by: "super@example.com",
    });
    const invite = await api("/api/users/invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "user1@example.com" }),
    });
    expect(invite.status).toBe(200);
    const invited = (await invite.json()) as {
      id: string;
      role: string;
      email: string;
    };
    expect(invited.role).toBe("user");
    expect(invited.email).toBe("user1@example.com");

    let list = (await api("/api/users").then((r) => r.json())) as Array<{
      id: string;
      role: string;
    }>;
    let found = list.find((u) => u.id === invited.id);
    expect(found?.role).toBe("user");

    const signInResponse = await signIn("super@example.com");
    expect(signInResponse.status).toBe(302);
    const promote = await api(`/api/users/${invited.id}/role`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: "admin" }),
    });
    expect(promote.status).toBe(200);
    list = (await api("/api/users").then((r) => r.json())) as Array<{
      id: string;
      role: string;
    }>;
    found = list.find((u) => u.id === invited.id);
    expect(found?.role).toBe("admin");

    const demote = await api(`/api/users/${invited.id}/role`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: "user" }),
    });
    expect(demote.status).toBe(200);
    list = (await api("/api/users").then((r) => r.json())) as Array<{
      id: string;
      role: string;
    }>;
    found = list.find((u) => u.id === invited.id);
    expect(found?.role).toBe("user");
  });

  it("edits casbin rules", async () => {
    await signIn("super@example.com");
    const rules = (await api("/api/casbin-rules").then((r) =>
      r.json(),
    )) as Array<import("@/lib/adminStore").CasbinRule>;
    rules.push({ ptype: "p", v0: "user", v1: "cases", v2: "extra" });
    const res = await api("/api/casbin-rules", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(rules),
    });
    expect(res.status).toBe(200);
    const updated = (await res.json()) as Array<{ v2?: string }>;
    expect(updated.some((r) => r.v2 === "extra")).toBe(true);
  });

  it("requires admin role to modify a case", async () => {
    await signIn("owner1@example.com");
    const id = await createCase();
    await signOut();
    await signIn("other@example.com");
    const denied = await api(`/api/cases/${id}/vin`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ vin: "1" }),
    });
    expect(denied.status).toBe(403);
    await signOut();
    signIn("admin@example.com");
    await setUserRoleAndLogIn({
      role: "admin",
      email: "admin@example.com",
      promoted_by: "super@example.com",
    });
    const ok = await api(`/api/cases/${id}/vin`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ vin: "1" }),
    });
    expect(ok.status).toBe(200);
  });
});
