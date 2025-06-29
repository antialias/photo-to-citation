import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createApi } from "./api";
import { createAuthHelpers } from "./authHelpers";
import { smokeEnv } from "./smokeServer";
import { type TestServer, startServer } from "./startServer";

let server: TestServer;
let api: (path: string, opts?: RequestInit) => Promise<Response>;
let tmpDir: string;
let signIn: (email: string) => Promise<Response>;
let signOut: () => Promise<void>;

beforeAll(async () => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "e2e-credits-"));
  fs.mkdirSync(path.join(process.cwd(), "data"), { recursive: true });
  fs.writeFileSync(
    path.join(process.cwd(), "data", "creditSettings.json"),
    JSON.stringify({ usdPerCredit: 1 }),
  );
  server = await startServer(3013, {
    ...smokeEnv,
    CASE_STORE_FILE: path.join(tmpDir, "cases.sqlite"),
  });
  api = createApi(server);
  ({ signIn, signOut } = createAuthHelpers(api, server));
  await signIn("first@example.com");
});

afterAll(async () => {
  await server.close();
  fs.rmSync(tmpDir, { recursive: true, force: true });
  fs.rmSync(path.join(process.cwd(), "data"), { recursive: true, force: true });
});

describe("credit system", () => {
  it("adds credits and updates exchange rate", async () => {
    let res = await api("/api/credits/balance");
    let data = await res.json();
    expect(data.balance).toBe(0);

    res = await api("/api/credits/add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ usd: 5 }),
    });
    expect(res.status).toBe(200);
    data = await res.json();
    expect(data.balance).toBe(5);

    res = await api("/api/credits/exchange-rate", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ usdPerCredit: 0.5 }),
    });
    expect(res.status).toBe(200);
    data = await res.json();
    expect(data.usdPerCredit).toBe(0.5);

    res = await api("/api/credits/exchange-rate");
    expect(res.status).toBe(200);
    data = await res.json();
    expect(data.usdPerCredit).toBe(0.5);
  });

  it("rejects non-superadmin exchange rate update", async () => {
    await signOut();
    await signIn("user@example.com");
    const res = await api("/api/credits/exchange-rate", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ usdPerCredit: 0.2 }),
    });
    expect(res.status).toBe(403);
  });
});
