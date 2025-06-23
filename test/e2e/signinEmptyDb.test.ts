import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createApi } from "./api";

declare const server: import("./startServer").TestServer;
let dataDir: string;
let api: (path: string, opts?: RequestInit) => Promise<Response>;

beforeAll(() => {
  dataDir = fs.mkdtempSync(path.join(os.tmpdir(), "cases-"));
  api = createApi(server);
});

afterAll(() => {
  fs.rmSync(dataDir, { recursive: true, force: true });
});

describe("sign in with empty db @smoke", () => {
  it("creates the first user and signs in", async () => {
    const csrf = await api("/api/auth/csrf").then((r) => r.json());
    const email = "first@example.com";
    expect(
      (
        await api("/api/auth/signin/email", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            csrfToken: csrf.csrfToken,
            email,
            callbackUrl: server.url,
          }),
        })
      ).status,
    ).toBe(302);

    const ver = await api("/api/test/verification-url").then((r) => r.json());
    expect(ver.url).toBeTruthy();
    await api(
      `${new URL(ver.url).pathname}?${new URL(ver.url).searchParams.toString()}`,
    );

    const session = await api("/api/auth/session").then((r) => r.json());
    expect(session?.user?.email).toBe(email);
    expect(session?.user?.role).toBe("superadmin");
  });
});
