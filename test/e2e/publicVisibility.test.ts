import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { getByTestId } from "@testing-library/dom";
import { JSDOM } from "jsdom";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createApi } from "./api";
import { type OpenAIStub, startOpenAIStub } from "./openaiStub";
import { createPhoto } from "./photo";
import { smokeEnv, smokePort } from "./smokeServer";
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

beforeAll(async () => {
  stub = await startOpenAIStub({
    violationType: "parking",
    details: "car parked illegally",
    vehicle: {},
    images: {},
  });
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "e2e-"));
  server = await startServer(smokePort, {
    ...smokeEnv,
    CASE_STORE_FILE: path.join(tmpDir, "cases.sqlite"),
    OPENAI_BASE_URL: stub.url,
  });
  api = createApi(server);
});

afterAll(async () => {
  await server.close();
  await stub.close();
});

describe("case visibility @smoke", () => {
  it("shows toggle for admins", async () => {
    await signIn("admin@example.com");
    const file = createPhoto("a");
    const form = new FormData();
    form.append("photo", file);
    const upload = await api("/api/upload", { method: "POST", body: form });
    const { caseId } = (await upload.json()) as { caseId: string };

    const page = await api(`/cases/${caseId}`).then((r) => r.text());
    const dom = new JSDOM(page);
    const toggle = getByTestId(dom.window.document, "toggle-public-button");
    expect(toggle).toBeTruthy();
  });

  it("hides chat button on public page", async () => {
    await signIn("user@example.com");
    const file = createPhoto("a");
    const form = new FormData();
    form.append("photo", file);
    const upload = await api("/api/upload", { method: "POST", body: form });
    const { caseId } = (await upload.json()) as { caseId: string };
    await api(`/api/cases/${caseId}/public`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ public: true }),
    });

    const page = await api(`/public/cases/${caseId}`).then((r) => r.text());
    const dom = new JSDOM(page);
    const chatButton = Array.from(
      dom.window.document.querySelectorAll("button"),
    ).find((b) => b.textContent?.trim() === "Chat");
    expect(chatButton).toBeUndefined();
  });
});
