import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { getByRole } from "@testing-library/dom";
import { JSDOM } from "jsdom";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createApi } from "./api";
import { createAuthHelpers } from "./authHelpers";
import { type TestServer, startServer } from "./startServer";

let server: TestServer;
let tmpDir: string;
let api: (path: string, opts?: RequestInit) => Promise<Response>;
let signIn: (email: string) => Promise<Response>;

beforeAll(async () => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "e2e-"));
  const env = {
    CASE_STORE_FILE: path.join(tmpDir, "cases.sqlite"),
    NEXTAUTH_SECRET: "secret",
  };
  server = await startServer(3006, env);
  api = createApi(server);
  ({ signIn } = createAuthHelpers(api, server));
  await signIn("user@example.com");
}, 120000);

afterAll(async () => {
  await server.close();
  fs.rmSync(tmpDir, { recursive: true, force: true });
}, 120000);

describe("thread page", () => {
  async function createCase(): Promise<string> {
    const file = new File([Buffer.from("a")], "a.jpg", { type: "image/jpeg" });
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
  }, 30000);
});
