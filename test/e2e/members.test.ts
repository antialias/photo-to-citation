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
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "e2e-"));
  server = await startServer(3012, {
    NEXTAUTH_SECRET: "secret",
    NODE_ENV: "test",
    SMTP_FROM: "test@example.com",
    CASE_STORE_FILE: path.join(tmpDir, "cases.sqlite"),
  });
  api = createApi(server);
});

afterAll(async () => {
  await server.close();
});

describe("case members e2e", () => {
  it.skip("invites and removes collaborators", async () => {
    await signIn("admin@example.com");
    await signOut();
    await signIn("owner@example.com");
    const id = await createCase();

    let members = await api(`/api/cases/${id}/members`).then(
      (r) => r.json() as Promise<{ userId: string; role: string }[]>,
    );
    expect(members).toHaveLength(1);

    const invite = await api(`/api/cases/${id}/invite`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: "collab" }),
    });
    expect(invite.status).toBe(200);

    members = await api(`/api/cases/${id}/members`).then(
      (r) => r.json() as Promise<{ userId: string; role: string }[]>,
    );
    expect(members.some((m) => m.userId === "collab")).toBe(true);

    const del = await api(`/api/cases/${id}/members/collab`, {
      method: "DELETE",
    });
    expect(del.status).toBe(200);

    members = await api(`/api/cases/${id}/members`).then(
      (r) => r.json() as Promise<{ userId: string; role: string }[]>,
    );
    expect(members.some((m) => m.userId === "collab")).toBe(false);
  });
});
