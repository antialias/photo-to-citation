import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createApi } from "./api";
import { type TestServer, startServer } from "./startServer";

let server: TestServer;
let dataDir: string;
let api: (path: string, opts?: RequestInit) => Promise<Response>;

beforeAll(async () => {
  dataDir = fs.mkdtempSync(path.join(os.tmpdir(), "cases-"));
  server = await startServer(3013, {
    CASE_STORE_FILE: path.join(dataDir, "cases.sqlite"),
    NEXTAUTH_SECRET: "secret",
    NODE_ENV: "test",
    SMTP_FROM: "test@example.com",
  });
  api = createApi(server);
  await api("/");
}, 120000);

afterAll(async () => {
  await server.close();
  fs.rmSync(dataDir, { recursive: true, force: true });
}, 120000);

describe("sign in with empty db @smoke", () => {
  it("creates the first user and signs in", async () => {
    const csrf = await api("/api/auth/csrf").then((r) => r.json());
    const email = "first@example.com";
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
    expect(ver.url).toBeTruthy();
    await api(
      `${new URL(ver.url).pathname}?${new URL(ver.url).searchParams.toString()}`,
    );

    const session = await api("/api/auth/session").then((r) => r.json());
    expect(session?.user?.email).toBe(email);
    expect(session?.user?.role).toBe("superadmin");
  }, 30000);
});
