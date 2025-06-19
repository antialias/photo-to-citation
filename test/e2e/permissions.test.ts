import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { type OpenAIStub, startOpenAIStub } from "./openaiStub";
import { type TestServer, startServer } from "./startServer";

let server: TestServer;
let stub: OpenAIStub;
let cookie = "";
const cookieJar: Record<string, string> = {};

async function api(path: string, opts: RequestInit = {}) {
  const res = await fetch(`${server.url}${path}`, {
    ...opts,
    headers: { ...(opts.headers || {}), cookie },
    redirect: "manual",
  });
  const sets = res.headers.getSetCookie();
  if (sets.length > 0) {
    for (const c of sets) {
      const [nameValue] = c.split(";");
      const [name, ...rest] = nameValue.split("=");
      const value = rest.join("=");
      if (
        name.includes("session-token") ||
        name.includes("csrf-token") ||
        name.includes("callback-url")
      ) {
        if (value) cookieJar[name] = value;
        else delete cookieJar[name];
      }
    }
    cookie = Object.entries(cookieJar)
      .map(([k, v]) => `${k}=${v}`)
      .join("; ");
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

async function signOut() {
  const csrf = await api("/api/auth/csrf").then((r) => r.json());
  await api("/api/auth/signout", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      csrfToken: csrf.csrfToken,
      callbackUrl: server.url,
    }),
  });
}

async function createCase(): Promise<string> {
  const { createCase } = await import("@/lib/caseStore");
  const c = createCase("/uploads/test.jpg");
  return c.id;
}

beforeAll(async () => {
  stub = await startOpenAIStub({ subject: "s", body: "b" });
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "e2e-"));
  process.env.CASE_STORE_FILE = path.join(tmpDir, "cases.json");
  server = await startServer(3011, {
    NEXTAUTH_SECRET: "secret",
    NODE_ENV: "test",
    SMTP_FROM: "test@example.com",
    CASE_STORE_FILE: process.env.CASE_STORE_FILE || "",
    OPENAI_BASE_URL: stub.url,
  });
  const { orm } = await import("@/lib/orm");
  const { casbinRules } = await import("@/lib/schema");
  orm
    .insert(casbinRules)
    .values({ ptype: "p", v0: "user", v1: "cases", v2: "read" })
    .run();
}, 120000);

afterAll(async () => {
  await server.close();
  await stub.close();
}, 120000);

describe("permissions", () => {
  it("hides admin actions for regular users", async () => {
    await signIn("admin@example.com");
    await signOut();
    await signIn("user@example.com");

    const id = await createCase();
    const draft = await api(`/cases/${id}/draft`).then((r) => r.text());
    expect(draft).toMatch(/disabled/);
  }, 30000);

  it.skip("shows admin actions for admins", async () => {
    cookie = "";
    for (const k of Object.keys(cookieJar)) delete cookieJar[k];
    await signIn("admin@example.com");
    const id = await createCase();
    const draft = await api(`/cases/${id}/draft`).then((r) => r.text());
    expect(draft).not.toMatch(/disabled/);
  }, 30000);
});
