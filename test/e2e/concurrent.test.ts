import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { type OpenAIStub, startOpenAIStub } from "./openaiStub";
import { type TestServer, startServer } from "./startServer";

let server: TestServer;
let stub: OpenAIStub;
let tmpDir: string;

beforeAll(async () => {
  stub = await startOpenAIStub({
    violationType: "parking",
    images: {},
    vehicle: {},
    details: "",
  });
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "e2e-"));
  const env = {
    CASE_STORE_FILE: path.join(tmpDir, "cases.json"),
    VIN_SOURCE_FILE: path.join(tmpDir, "vinSources.json"),
    OPENAI_BASE_URL: stub.url,
  };
  fs.writeFileSync(env.VIN_SOURCE_FILE, "[]");
  server = await startServer(3006, env);
}, 120000);

afterAll(async () => {
  await server.close();
  await stub.close();
  fs.rmSync(tmpDir, { recursive: true, force: true });
}, 120000);

describe("concurrent analysis", () => {
  async function createCase(name: string): Promise<string> {
    const file = new File([Buffer.from(name)], `${name}.jpg`, {
      type: "image/jpeg",
    });
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

  async function waitForCase(id: string): Promise<Response> {
    for (let i = 0; i < 20; i++) {
      const res = await fetch(`${server.url}/api/cases/${id}`);
      const js = await res.json().catch(() => null);
      if (res.status === 200 && js?.analysisStatus === "complete") return res;
      await new Promise((r) => setTimeout(r, 500));
    }
    return fetch(`${server.url}/api/cases/${id}`);
  }

  it("handles parallel analysis", async () => {
    const [id1, id2] = await Promise.all([createCase("a"), createCase("b")]);
    const [res1, res2] = await Promise.all([
      waitForCase(id1),
      waitForCase(id2),
    ]);
    expect(res1.status).toBe(200);
    expect(res2.status).toBe(200);
    const c1 = await res1.json();
    const c2 = await res2.json();
    expect(c1.id).toBe(id1);
    expect(c2.id).toBe(id2);
    expect(c1.analysisStatus).toBe("complete");
    expect(c2.analysisStatus).toBe("complete");
  }, 30000);
});
