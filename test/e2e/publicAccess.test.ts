import fs from "node:fs";
import os from "node:os";
import path from "node:path";
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
  server = await startServer(3021, {
    NEXTAUTH_SECRET: "secret",
    NODE_ENV: "test",
    SMTP_FROM: "test@example.com",
    CASE_STORE_FILE: path.join(tmpDir, "cases.sqlite"),
  });
  api = createApi(server);
  ({ signIn, signOut } = createAuthHelpers(api, server));
}, 120000);

afterAll(async () => {
  await server.close();
}, 120000);

describe("anonymous access", () => {
  it("allows access to public case", async () => {
    await signIn("user@example.com");
    const id = await createCase();
    expect(
      (
        await api(`/api/cases/${id}/public`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ public: true }),
        })
      ).status,
    ).toBe(200);
    await signOut();

    const res = await api(`/api/public/cases/${id}`);
    expect(res.status).toBe(200);
  }, 30000);

  it("rejects private case and stream", async () => {
    await signIn("user@example.com");
    const id = await createCase();
    await signOut();

    const caseRes = await api(`/api/cases/${id}`);
    expect(caseRes.status).toBe(403);

    const streamRes = await api("/api/cases/stream");
    expect(streamRes.status).toBe(403);
  }, 30000);

  it("rejects non-member on private case", async () => {
    await signIn("user@example.com");
    const id = await createCase();
    await signOut();
    await signIn("other@example.com");

    const res = await api(`/api/cases/${id}`);
    expect(res.status).toBe(403);
  }, 30000);
});
