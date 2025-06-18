import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { type TestServer, startServer } from "./startServer";

let server: TestServer;
let tmpDir: string;
let cookie = "";

async function api(path: string, opts: RequestInit = {}) {
  const res = await fetch(`${server.url}${path}`, {
    ...opts,
    headers: { ...(opts.headers || {}), cookie },
    redirect: "manual",
  });
  const set =
    res.headers.getSetCookie?.() ??
    (res.headers.has("set-cookie")
      ? [res.headers.get("set-cookie") as string]
      : []);
  if (set.length > 0) {
    cookie = set.map((c) => c.split(";")[0]).join("; ");
  }
  return res;
}

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
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "e2e-auth-"));
  server = await startServer(3022, {
    NEXTAUTH_SECRET: "secret",
    NODE_ENV: "test",
    SMTP_FROM: "test@example.com",
    CASE_STORE_FILE: path.join(tmpDir, "cases.sqlite"),
  });
}, 120000);

afterAll(async () => {
  await server.close();
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
