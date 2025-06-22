import { describe, expect, it, vi } from "vitest";
import { createAuthHelpers } from "./e2e/authHelpers";

function makeApi() {
  const calls: Array<{ path: string; opts: RequestInit | undefined }> = [];
  const api = vi.fn(async (path: string, opts?: RequestInit) => {
    calls.push({ path, opts });
    if (path === "/api/auth/csrf") {
      return new Response(JSON.stringify({ csrfToken: "tok" }));
    }
    if (path === "/api/test/verification-url") {
      return new Response(JSON.stringify({ url: "http://x/verify" }));
    }
    if (path === "/api/users") {
      return new Response(
        JSON.stringify([{ id: "u1", email: "user@example.com" }]),
      );
    }
    return new Response(null);
  });
  return { api, calls };
}

describe("setUserRoleAndLogIn", () => {
  it("updates role and logs in as target user", async () => {
    const { api, calls } = makeApi();
    const { setUserRoleAndLogIn } = createAuthHelpers(api, { url: "http://x" });
    await setUserRoleAndLogIn({
      email: "user@example.com",
      role: "admin",
      promoted_by: "super@example.com",
    });
    const paths = calls.map((c) => c.path);
    expect(paths).toContain("/api/users");
    expect(paths).toContain("/api/users/u1/role");
    const updateCall = calls.find((c) => c.path === "/api/users/u1/role");
    expect(updateCall?.opts?.method).toBe("PUT");
  });
});
