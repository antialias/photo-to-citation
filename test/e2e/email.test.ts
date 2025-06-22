import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createApi } from "./api";
import { type TestServer, startServer } from "./startServer";
import { createAuthHelpers } from "./authHelpers";

let server: TestServer;
let api: (path: string, opts?: RequestInit) => Promise<Response>;
let tmpDir: string;
let signIn: (email: string) => Promise<Response>;
let signOut: () => Promise<void>;

beforeAll(async () => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "e2e-email-"));
  server = await startServer(3016, {
    NEXTAUTH_SECRET: "secret",
    NODE_ENV: "test",
    SMTP_FROM: "test@example.com",
    CASE_STORE_FILE: path.join(tmpDir, "cases.sqlite"),
    EMAIL_FILE: path.join(tmpDir, "emails.json"),
    MOCK_EMAIL_TO: "",
  });
  api = createApi(server);
  ({ signIn, signOut } = createAuthHelpers(api, server));
  await signIn("user@example.com");
}, 120000);

afterAll(async () => {
  await server.close();
  fs.rmSync(tmpDir, { recursive: true, force: true });
}, 120000);

describe("email sending", () => {
  async function createCase(): Promise<string> {
    const file = new File([Buffer.from("a")], "a.jpg", { type: "image/jpeg" });
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
  }, 60000);
});
