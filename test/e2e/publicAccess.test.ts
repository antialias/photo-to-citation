import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createApi } from "./api";
import { type OpenAIStub, startOpenAIStub } from "./openaiStub";
import { createPhoto } from "./photo";
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
  const file = createPhoto("a");
  const form = new FormData();
  form.append("photo", file);
  const res = await api("/api/upload", { method: "POST", body: form });
  const data = (await res.json()) as { caseId: string };
  return data.caseId;
}

beforeAll(async () => {
  stub = await startOpenAIStub({
    violationType: "parking",
    details: "car parked illegally",
    vehicle: {},
    images: {},
  });
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "e2e-"));
  server = await startServer(3021, {
    NEXTAUTH_SECRET: "secret",
    NODE_ENV: "test",
    SMTP_FROM: "test@example.com",
    CASE_STORE_FILE: path.join(tmpDir, "cases.sqlite"),
    OPENAI_BASE_URL: stub.url,
  });
  api = createApi(server);
});

afterAll(async () => {
  await server.close();
  await stub.close();
});

describe("anonymous access", () => {
  it("allows access to public case", async () => {
    await signIn("user@example.com");
    const id = await createCase();
    expect(
      (
        await api(`/api/cases/${id}/public`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ public: true }),
        })
      ).status,
    ).toBe(200);
    await signOut();

    const res = await api(`/api/public/cases/${id}`);
    expect(res.status).toBe(200);
  });

  it("allows logged in user to view photos on public case", async () => {
    await signIn("user@example.com");
    const id = await createCase();
    await api(`/api/cases/${id}/public`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ public: true }),
    });
    const caseData = (await api(`/api/cases/${id}`).then((r) => r.json())) as {
      photos: string[];
    };
    const photo = caseData.photos[0];
    const res = await api(`/uploads/${photo}`);
    expect(res.status).toBe(200);
  });

  it("rejects private case and stream", async () => {
    await signIn("user@example.com");
    const id = await createCase();
    await signOut();

    const caseRes = await api(`/api/cases/${id}`);
    expect(caseRes.status).toBe(403);

    const streamRes = await api("/api/cases/stream");
    expect(streamRes.status).toBe(403);
  });

  it("rejects non-member on private case", async () => {
    await signIn("user@example.com");
    const id = await createCase();
    await signOut();
    await signIn("other@example.com");

    const res = await api(`/api/cases/${id}`);
    expect(res.status).toBe(403);
  });
});
