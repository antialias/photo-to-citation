import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { getByTestId } from "@testing-library/dom";
import { JSDOM } from "jsdom";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createApi } from "./api";
import { type OpenAIStub, startOpenAIStub } from "./openaiStub";
import { type TestServer, startServer } from "./startServer";
import { createAuthHelpers } from "./authHelpers";

let server: TestServer;
let api: (path: string, opts?: RequestInit) => Promise<Response>;
let stub: OpenAIStub;
let signIn: (email: string) => Promise<Response>;
let signOut: () => Promise<void>;

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
  ({ signIn, signOut } = createAuthHelpers(api, server));
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
    const caseDom = new JSDOM(casePage);
    const delButton = caseDom.window.document.querySelector(
      '[data-testid="delete-case-button"]',
    );
    expect(delButton).toBeNull();
    const draft = await api(`/cases/${id}/draft`).then((r) => r.text());
    const draftDom = new JSDOM(draft);
    const sendButton = getByTestId(draftDom.window.document, "send-button");
    expect(sendButton.hasAttribute("disabled")).toBe(true);
  }, 60000);

  it("shows admin actions for admins", async () => {
    await signOut();
    await signIn("admin@example.com");
    const id = await createCase();
    const casePage = await api(`/cases/${id}`).then((r) => r.text());
    const caseDom = new JSDOM(casePage);
    const delButton = getByTestId(
      caseDom.window.document,
      "delete-case-button",
    );
    expect(delButton).toBeTruthy();
    const draft = await api(`/cases/${id}/draft`).then((r) => r.text());
    const draftDom = new JSDOM(draft);
    const sendButton = getByTestId(draftDom.window.document, "send-button");
    expect(sendButton.hasAttribute("disabled")).toBe(false);
  }, 60000);
});
