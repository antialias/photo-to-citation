import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { type TestServer, startServer } from "./startServer";

let server: TestServer;
let tmpDir: string;

beforeAll(async () => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "e2e-"));
  const env = {
    CASE_STORE_FILE: path.join(tmpDir, "cases.sqlite"),
    NEXTAUTH_SECRET: "secret",
  };
  server = await startServer(3006, env);
}, 120000);

afterAll(async () => {
  await server.close();
  fs.rmSync(tmpDir, { recursive: true, force: true });
}, 120000);

describe("thread page", () => {
  async function createCase(): Promise<string> {
    const file = new File([Buffer.from("a")], "a.jpg", { type: "image/jpeg" });
    const form = new FormData();
    form.append("photo", file);
    const res = await fetch(`${server.url}/api/upload`, {
      method: "POST",
      body: form,
    });
    expect(res.status).toBe(200);
    const data = (await res.json()) as { caseId: string };
    return data.caseId;
  }

  it("serves existing thread pages", async () => {
    await fetch(`${server.url}/`);
    const id = await createCase();
    const res = await fetch(`${server.url}/cases/${id}/thread/start`);
    expect(res.status).toBe(200);
    const text = await res.text();
    expect(text).toContain("Thread");
  }, 30000);
});
