import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createApi } from "./api";

interface TestServer {
  url: string;
}

let server: TestServer;
let tmpDir: string;
let api: (path: string, opts?: RequestInit) => Promise<Response>;

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

beforeAll(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "e2e-auth-"));
  server = global.__E2E_SERVER__ as TestServer;
  api = createApi(server);
});

afterAll(async () => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
}, 120000);

describe("fresh database", () => {
  it("grants superadmin to first user", async () => {
    await signIn("first@example.com");
    const session = await api("/api/auth/session").then((r) => r.json());
    expect(session?.user?.email).toBe("first@example.com");
    expect(session?.user?.role).toBe("superadmin");
  }, 30000);
});
