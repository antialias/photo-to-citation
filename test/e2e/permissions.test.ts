import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createApi } from "./api";
import { type OpenAIStub, startOpenAIStub } from "./openaiStub";
import { type TestServer, startServer } from "./startServer";

let server: TestServer;
let api: (path: string, opts?: RequestInit) => Promise<Response>;
let stub: OpenAIStub;

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
  stub = await startOpenAIStub({ subject: "", body: "" });
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "e2e-"));
  server = await startServer(3011, {
    NEXTAUTH_SECRET: "secret",
    NODE_ENV: "test",
    SMTP_FROM: "test@example.com",
    CASE_STORE_FILE: path.join(tmpDir, "cases.sqlite"),
    OPENAI_BASE_URL: stub.url,
  });
  api = createApi(server);
  await signIn("admin@example.com");
  await signOut();
}, 120000);

afterAll(async () => {
  await server.close();
  await stub.close();
}, 120000);

describe("permissions", () => {
  it("hides admin actions for regular users", async () => {
    await signIn("admin@example.com");
    await signOut();
    await signIn("user@example.com");

    const id = await createCase();
    const casePage = await api(`/cases/${id}`).then((r) => r.text());
    expect(casePage).not.toContain('data-testid="delete-case-button"');
    const draft = await api(`/cases/${id}/draft`).then((r) => r.text());
    expect(draft).toMatch(
      /<button[^>]*(data-testid="send-button"[^>]*\sdisabled(?!:)|\sdisabled(?!:)\b[^>]*data-testid="send-button")[^>]*>/,
    );
  }, 60000);

  it("shows admin actions for admins", async () => {
    await signOut();
    await signIn("admin@example.com");
    const id = await createCase();
    const casePage = await api(`/cases/${id}`).then((r) => r.text());
    expect(casePage).toContain('data-testid="delete-case-button"');
    const draft = await api(`/cases/${id}/draft`).then((r) => r.text());
    expect(draft).not.toMatch(
      /<button[^>]*(data-testid="send-button"[^>]*\sdisabled(?!:)|\sdisabled(?!:)\b[^>]*data-testid="send-button")[^>]*>/,
    );
  }, 60000);
});
