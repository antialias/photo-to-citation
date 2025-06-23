import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { getByTestId } from "@testing-library/dom";
import { JSDOM } from "jsdom";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createApi } from "./api";
import { createAuthHelpers } from "./authHelpers";
import { type TestServer, startServer } from "./startServer";

let server: TestServer;
let api: (path: string, opts?: RequestInit) => Promise<Response>;
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
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "e2e-"));
  server = await startServer(3023, {
    NEXTAUTH_SECRET: "secret",
    NODE_ENV: "test",
    SMTP_FROM: "test@example.com",
    CASE_STORE_FILE: path.join(tmpDir, "cases.sqlite"),
  });
  api = createApi(server);
  ({ signIn, signOut } = createAuthHelpers(api, server));
});

afterAll(async () => {
  await server.close();
});

describe("share button", () => {
  it("shows share button for public case", async () => {
    await signIn("user@example.com");
    const id = await createCase();
    await api(`/api/cases/${id}/public`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ public: true }),
    });
    await signOut();

    const html = await api(`/cases/${id}`).then((r) => r.text());
    const dom = new JSDOM(html);
    const btn = getByTestId(dom.window.document, "share-case-button");
    expect(btn).toBeTruthy();
  });
});
