import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createApi } from "./api";
import { type TestServer, startServer } from "./startServer";
import { createAuthHelpers } from "./authHelpers";

let server: TestServer;
let tmpDir: string;
let api: (path: string, opts?: RequestInit) => Promise<Response>;
let signIn: (email: string) => Promise<Response>;
let signOut: () => Promise<void>;

beforeAll(async () => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "e2e-auth-"));
  server = await startServer(3022, {
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
  fs.rmSync(tmpDir, { recursive: true, force: true });
}, 120000);

describe("fresh database @smoke", () => {
  it("grants superadmin to first user", async () => {
    await signIn("first@example.com");
    const session = await api("/api/auth/session").then((r) => r.json());
    expect(session?.user?.email).toBe("first@example.com");
    expect(session?.user?.role).toBe("superadmin");
  }, 30000);
});
