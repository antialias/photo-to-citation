import { beforeAll, describe, expect, it } from "vitest";
import { createApi } from "./api";

interface TestServer {
  url: string;
}

let server: TestServer;
let api: (path: string, opts?: RequestInit) => Promise<Response>;

beforeAll(() => {
  server = global.__E2E_SERVER__ as TestServer;
  api = createApi(server);
});

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
