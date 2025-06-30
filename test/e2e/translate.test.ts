import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { createApi } from "./api";
import { type OpenAIStub, startOpenAIStub } from "./openaiStub";
import { createPhoto } from "./photo";
import { poll } from "./poll";
import { type TestServer, startServer } from "./startServer";

let server: TestServer;
let api: (path: string, opts?: RequestInit) => Promise<Response>;
let stub: OpenAIStub;
let tmpDir: string;

vi.setConfig({ testTimeout: 60000 });

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
  expect(res.status).toBe(200);
  const data = (await res.json()) as { caseId: string };
  return data.caseId;
}

beforeAll(async () => {
  stub = await startOpenAIStub([
    {
      violationType: "parking",
      details: { en: "hello" },
      vehicle: {},
      images: {},
    },
    "hola",
  ]);
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "e2e-translate-"));
  server = await startServer(3032, {
    NEXTAUTH_SECRET: "secret",
    OPENAI_BASE_URL: stub.url,
    CASE_STORE_FILE: path.join(tmpDir, "cases.sqlite"),
  });
  api = createApi(server);
  await signIn("user@example.com");
});

afterAll(async () => {
  await server.close();
  await stub.close();
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe("translate api @smoke", () => {
  it("translates analysis details", async () => {
    const id = await createCase();
    const res = await poll(
      () => api(`/api/cases/${id}`),
      async (r) => {
        if (r.status !== 200) return false;
        const j = await r.clone().json();
        return j.analysis !== null;
      },
      40,
    );
    const base = (await res.json()) as { analysis?: { details?: unknown } };
    expect(base.analysis).toBeTruthy();
    const tr = await api(`/api/cases/${id}/translate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: "analysis.details", lang: "es" }),
    });
    expect(tr.status).toBe(200);
    const updated = (await tr.json()) as {
      analysis: { details: Record<string, string> };
    };
    expect(updated.analysis.details.es).toBe("hola");
    expect(stub.requests.length).toBeGreaterThan(1);
  });

  it("allows anonymous translation on public cases", async () => {
    const id = await createCase();
    const res = await poll(
      () => api(`/api/cases/${id}`),
      async (r) => {
        if (r.status !== 200) return false;
        const j = await r.clone().json();
        return j.analysis !== null;
      },
      40,
    );
    const base = (await res.json()) as { analysis?: { details?: unknown } };
    expect(base.analysis).toBeTruthy();
    const pub = await api(`/api/cases/${id}/public`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ public: true }),
    });
    expect(pub.status).toBe(200);
    await signOut();
    const tr = await api(`/api/cases/${id}/translate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: "analysis.details", lang: "fr" }),
    });
    expect(tr.status).toBe(200);
    const updated = (await tr.json()) as {
      analysis: { details: Record<string, string> };
    };
    expect(updated.analysis.details.fr).toBeTruthy();
    const direct = await api(`/api/cases/${id}`);
    expect(direct.status).toBe(200);
  });
});
