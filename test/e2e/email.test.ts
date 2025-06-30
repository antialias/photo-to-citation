import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { createApi } from "./api";
import { type OpenAIStub, startOpenAIStub } from "./openaiStub";
import { createPhoto } from "./photo";
import { type TestServer, startServer } from "./startServer";

let server: TestServer;
let api: (path: string, opts?: RequestInit) => Promise<Response>;
let tmpDir: string;
let stub: OpenAIStub;

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

beforeAll(async () => {
  stub = await startOpenAIStub({
    violationType: "parking",
    details: "car parked illegally",
    vehicle: {},
    images: {},
  });
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "e2e-email-"));
  server = await startServer(3016, {
    NEXTAUTH_SECRET: "secret",
    NODE_ENV: "test",
    SMTP_FROM: "test@example.com",
    CASE_STORE_FILE: path.join(tmpDir, "cases.sqlite"),
    EMAIL_FILE: path.join(tmpDir, "emails.json"),
    MOCK_EMAIL_TO: "",
    OPENAI_BASE_URL: stub.url,
  });
  api = createApi(server);
  await signIn("user@example.com");
});

afterAll(async () => {
  await server.close();
  await stub.close();
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe("email sending @smoke", () => {
  async function createCase(): Promise<string> {
    const file = createPhoto("a");
    const form = new FormData();
    form.append("photo", file);
    const res = await api("/api/upload", { method: "POST", body: form });
    const data = (await res.json()) as { caseId: string };
    return data.caseId;
  }

  it("stores emails instead of sending", async () => {
    const id = await createCase();
    const res = await api(`/api/cases/${id}/report`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject: "s", body: "b", attachments: [] }),
    });
    expect(res.status).toBe(200);
    const emails = JSON.parse(
      fs.readFileSync(path.join(tmpDir, "emails.json"), "utf8"),
    );
    expect(emails).toHaveLength(1);
    expect(emails[0].to).toBe("police@oak-park.us");
  });
});
