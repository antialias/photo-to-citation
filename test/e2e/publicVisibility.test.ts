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

beforeAll(async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "e2e-"));
  server = await startServer(3020, {
    NEXTAUTH_SECRET: "secret",
    NODE_ENV: "test",
    SMTP_FROM: "test@example.com",
    CASE_STORE_FILE: path.join(tmpDir, "cases.sqlite"),
  });
  api = createApi(server);
  ({ signIn } = createAuthHelpers(api, server));
}, 120000);

afterAll(async () => {
  await server.close();
}, 120000);

describe("case visibility @smoke", () => {
  it("shows toggle for admins", async () => {
    await signIn("admin@example.com");
    const file = new File([Buffer.from("a")], "a.jpg", { type: "image/jpeg" });
    const form = new FormData();
    form.append("photo", file);
    const upload = await api("/api/upload", { method: "POST", body: form });
    const { caseId } = (await upload.json()) as { caseId: string };

    const page = await api(`/cases/${caseId}`).then((r) => r.text());
    const dom = new JSDOM(page);
    const toggle = getByTestId(dom.window.document, "toggle-public-button");
    expect(toggle).toBeTruthy();
  }, 30000);
});
