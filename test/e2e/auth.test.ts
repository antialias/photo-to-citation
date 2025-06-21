import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createApi } from "./api";
import { type TestServer, startServer } from "./startServer";

let server: TestServer;
let api: (path: string, opts?: RequestInit) => Promise<Response>;

beforeAll(async () => {
  server = await startServer(3010, {
    NEXTAUTH_SECRET: "secret",
    NODE_ENV: "test",
    SMTP_FROM: "test@example.com",
  });
  api = createApi(server);
}, 120000);

afterAll(async () => {
  await server.close();
}, 120000);

describe("auth flow", () => {
  it.skip("logs in and out", async () => {
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
    expect(session?.user?.role).toBe("superadmin");

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
    expect(sessionAfter).toEqual({});
  }, 30000);
});
