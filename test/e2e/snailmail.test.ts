import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createApi } from "./api";
import { type OpenAIStub, startOpenAIStub } from "./openaiStub";
import { type TestServer, startServer } from "./startServer";

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

let server: TestServer;
let stub: OpenAIStub;
let tmpDir: string;

beforeAll(async () => {
  stub = await startOpenAIStub({
    violationType: "parking",
    details: "car parked illegally",
    vehicle: {},
    images: {},
  });
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "e2e-snail-"));
  const env: NodeJS.ProcessEnv & {
    CASE_STORE_FILE: string;
    VIN_SOURCE_FILE: string;
    OPENAI_BASE_URL: string;
    SNAIL_MAIL_PROVIDER_FILE: string;
    SNAIL_MAIL_FILE: string;
    SNAIL_MAIL_OUT_DIR: string;
    RETURN_ADDRESS: string;
    SNAIL_MAIL_PROVIDER: string;
    NODE_ENV: string;
    NEXTAUTH_SECRET: string;
  } = {
    CASE_STORE_FILE: path.join(tmpDir, "cases.sqlite"),
    VIN_SOURCE_FILE: path.join(tmpDir, "vinSources.json"),
    OPENAI_BASE_URL: stub.url,
    SNAIL_MAIL_PROVIDER_FILE: path.join(tmpDir, "providers.json"),
    SNAIL_MAIL_FILE: path.join(tmpDir, "snailMail.json"),
    SNAIL_MAIL_OUT_DIR: path.join(tmpDir, "out"),
    RETURN_ADDRESS: "Me\n1 A St\nTown, ST 12345",
    SNAIL_MAIL_PROVIDER: "file",
    NODE_ENV: "test",
    NEXTAUTH_SECRET: "secret",
  };
  fs.writeFileSync(
    env.VIN_SOURCE_FILE,
    JSON.stringify(
      [
        { id: "edmunds", enabled: false, failureCount: 0 },
        { id: "carfax", enabled: false, failureCount: 0 },
      ],
      null,
      2,
    ),
  );
  fs.writeFileSync(
    env.SNAIL_MAIL_PROVIDER_FILE,
    JSON.stringify(
      [
        { id: "file", active: true, failureCount: 0 },
        { id: "mock", active: false, failureCount: 0 },
      ],
      null,
      2,
    ),
  );
  server = await startServer(3008, env);
  api = createApi(server);
  await signIn("admin@example.com");
  await signOut();
  await signIn("user@example.com");
}, 120000);

afterAll(async () => {
  await server.close();
  await stub.close();
  fs.rmSync(tmpDir, { recursive: true, force: true });
}, 120000);

describe("snail mail providers", () => {
  async function createCase(): Promise<string> {
    const file = new File([Buffer.from("a")], "a.jpg", { type: "image/jpeg" });
    const form = new FormData();
    form.append("photo", file);
    const res = await api("/api/upload", {
      method: "POST",
      body: form,
    });
    expect(res.status).toBe(200);
    const data = (await res.json()) as { caseId: string };
    return data.caseId;
  }

  it("lists providers", async () => {
    const res = await api("/api/snail-mail-providers");
    expect(res.status).toBe(200);
    const list = (await res.json()) as Array<{ id: string; active: boolean }>;
    expect(Array.isArray(list)).toBe(true);
    expect(list.some((p) => p.id === "file")).toBe(true);
  }, 60000);

  it("activates a provider", async () => {
    const res = await api("/api/snail-mail-providers/mock", {
      method: "PUT",
    });
    expect(res.status).toBe(200);
    const list = (await res.json()) as Array<{ id: string; active: boolean }>;
    const active = list.find((p) => p.active);
    expect(active?.id).toBe("mock");
  }, 60000);

  it("returns 404 for unknown provider", async () => {
    const res = await api("/api/snail-mail-providers/none", {
      method: "PUT",
    });
    expect(res.status).toBe(404);
  }, 60000);

  it("sends snail mail followup", async () => {
    const id = await createCase();
    const res = await api(`/api/cases/${id}/followup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subject: "s",
        body: "b",
        attachments: [],
        snailMail: true,
      }),
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.results.snailMail.success).toBe(true);
    const stored = JSON.parse(
      fs.readFileSync(path.join(tmpDir, "snailMail.json"), "utf8"),
    );
    expect(stored).toHaveLength(1);
  }, 60000);
});
