import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createApi } from "./api";
import { type TestServer, startServer } from "./startServer";

let server: TestServer;
let api: (path: string, opts?: RequestInit) => Promise<Response>;

async function signIn(email: string) {
  const csrf = await api("/api/auth/csrf").then((r) => r.json());
  await api("/api/auth/signin/email", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      csrfToken: csrf.csrfToken,
      email,
      callbackUrl: server.url,
    }),
  });
  const ver = await api("/api/test/verification-url").then((r) => r.json());
  await api(
    `${new URL(ver.url).pathname}?${new URL(ver.url).searchParams.toString()}`,
  );
}

async function signOut() {
  const csrf = await api("/api/auth/csrf").then((r) => r.json());
  await api("/api/auth/signout", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      csrfToken: csrf.csrfToken,
      callbackUrl: server.url,
    }),
  });
}

async function createCase(): Promise<string> {
  const file = new File([Buffer.from("a")], "a.jpg", { type: "image/jpeg" });
  const form = new FormData();
  form.append("photo", file);
  const res = await api("/api/upload", { method: "POST", body: form });
  const data = (await res.json()) as { caseId: string };
  return data.caseId;
}

beforeAll(async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "e2e-admin-"));
  server = await startServer(3021, {
    NEXTAUTH_SECRET: "secret",
    NODE_ENV: "test",
    SMTP_FROM: "test@example.com",
    CASE_STORE_FILE: path.join(tmpDir, "cases.sqlite"),
    SUPER_ADMIN_EMAIL: "super@example.com",
  });
  api = createApi(server);
}, 120000);

afterAll(async () => {
  await server.close();
}, 120000);

describe("admin actions", () => {
  it("promotes and demotes users", async () => {
    await signIn("super@example.com");
    await signOut();
    await signIn("super@example.com");
    const invite = await api("/api/users/invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "user1@example.com" }),
    });
    expect(invite.status).toBe(200);
    const invited = (await invite.json()) as { id: string; role: string };
    expect(invited.role).toBe("user");

    let list = (await api("/api/users").then((r) => r.json())) as Array<{
      id: string;
      role: string;
    }>;
    let found = list.find((u) => u.id === invited.id);
    expect(found?.role).toBe("user");

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
  }, 30000);

  it("edits casbin rules", async () => {
    await signIn("super2@example.com");
    await signOut();
    await signIn("super2@example.com");
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
  }, 30000);

  it("only allows owner to modify a case", async () => {
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
    await signIn("owner1@example.com");
    const ok = await api(`/api/cases/${id}/vin`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ vin: "1" }),
    });
    expect(ok.status).toBe(200);
  }, 30000);
});
