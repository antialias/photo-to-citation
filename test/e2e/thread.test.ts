import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { getByRole } from "@testing-library/dom";
import { JSDOM } from "jsdom";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createApi } from "./api";
import { createPhoto } from "./photo";
import { type OpenAIStub, startOpenAIStub } from "./openaiStub";
import { type TestServer, startServer } from "./startServer";

let server: TestServer;
let tmpDir: string;
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

beforeAll(async () => {
  stub = await startOpenAIStub({
    violationType: "parking",
    details: "car parked illegally",
    vehicle: {},
    images: {},
  });
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "e2e-"));
  const env = {
    CASE_STORE_FILE: path.join(tmpDir, "cases.sqlite"),
    NEXTAUTH_SECRET: "secret",
    OPENAI_BASE_URL: stub.url,
  };
  server = await startServer(3006, env);
  api = createApi(server);
  await signIn("user@example.com");
});

afterAll(async () => {
  await server.close();
  await stub.close();
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe("thread page", () => {
  async function createCase(): Promise<string> {
    const file = createPhoto("a");
    const form = new FormData();
    form.append("photo", file);
    const res = await api("/api/upload", { method: "POST", body: form });
    expect(res.status).toBe(200);
    const data = (await res.json()) as { caseId: string };
    return data.caseId;
  }

  it("serves existing thread pages", async () => {
    await api("/");
    const id = await createCase();
    const res = await api(`/cases/${id}/thread/start`);
    expect(res.status).toBe(200);
    const html = await res.text();
    const dom = new JSDOM(html);
    const heading = getByRole(dom.window.document, "heading", {
      name: /thread/i,
    });
    expect(heading).toBeTruthy();
  });
});
