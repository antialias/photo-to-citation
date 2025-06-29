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
let signIn: (email: string) => Promise<Response>;
let signOut: () => Promise<void>;
let tmpDir: string;

beforeAll(async () => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "e2e-credits-"));
  server = await startServer(3055, {
    ...smokeEnv,
    CASE_STORE_FILE: path.join(tmpDir, "cases.sqlite"),
    SUPER_ADMIN_EMAIL: "super@example.com",
  });
  api = createApi(server);
  ({ signIn, signOut } = createAuthHelpers(api, server));
  await signIn("super@example.com");
});

afterAll(async () => {
  await server.close();
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe("credits API", () => {
  it("updates exchange rate and adds credits", async () => {
    const setRate = await api("/api/credits/exchange-rate", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ usdPerCredit: 0.5 }),
    });
    expect(setRate.status).toBe(200);
    const rate = (await setRate.json()) as { usdPerCredit: number };
    expect(rate.usdPerCredit).toBe(0.5);

    const startBalance = await api("/api/credits/balance").then((r) =>
      r.json(),
    );
    expect(startBalance.balance).toBe(0);

    const add = await api("/api/credits/add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ usd: 1 }),
    });
    expect(add.status).toBe(200);
    const afterAdd = (await add.json()) as { balance: number };
    expect(afterAdd.balance).toBe(2);

    const finalBalance = await api("/api/credits/balance").then((r) =>
      r.json(),
    );
    expect(finalBalance.balance).toBe(2);
    const getRate = await api("/api/credits/exchange-rate").then((r) =>
      r.json(),
    );
    expect(getRate.usdPerCredit).toBe(0.5);
  });

  it("rejects exchange rate update for regular users", async () => {
    await signOut();
    await signIn("user@example.com");
    const res = await api("/api/credits/exchange-rate", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ usdPerCredit: 1 }),
    });
    expect(res.status).toBe(403);
  });
});
