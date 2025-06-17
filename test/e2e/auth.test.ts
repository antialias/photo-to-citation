import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { type TestServer, startServer } from "./startServer";

let server: TestServer;
let cookie = "";

async function api(path: string, opts: RequestInit = {}) {
  const res = await fetch(`${server.url}${path}`, {
    ...opts,
    headers: { ...(opts.headers || {}), cookie },
    redirect: "manual",
  });
  const set = res.headers.get("set-cookie");
  if (set) cookie = set.split(";")[0];
  return res;
}

beforeAll(async () => {
  server = await startServer(3010, {
    NEXTAUTH_SECRET: "secret",
    NODE_ENV: "test",
    SMTP_FROM: "test@example.com",
  });
}, 120000);

afterAll(async () => {
  await server.close();
}, 120000);

describe("auth flow", () => {
  it("logs in and out", async () => {
    const csrf = await api("/api/auth/csrf").then((r) => r.json());
    const email = "user@example.com";
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

    const csrf2 = await api("/api/auth/csrf").then((r) => r.json());
    await api("/api/auth/signout", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        csrfToken: csrf2.csrfToken,
        callbackUrl: server.url,
      }),
    });
    const sessionAfter = await api("/api/auth/session").then((r) => r.json());
    expect(sessionAfter).toBeNull();
  }, 30000);
});
