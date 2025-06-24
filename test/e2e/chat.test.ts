import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createApi } from "./api";
import { type OpenAIStub, startOpenAIStub } from "./openaiStub";
import { createPhoto } from "./photo";
import { type TestServer, startServer } from "./startServer";

let server: TestServer;
let api: (path: string, opts?: RequestInit) => Promise<Response>;
let stub: OpenAIStub;
let tmpDir: string;

beforeAll(async () => {
  stub = await startOpenAIStub({ response: "hello", actions: [] });
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "e2e-chat-"));
  server = await startServer(3012, {
    NEXTAUTH_SECRET: "secret",
    OPENAI_BASE_URL: stub.url,
    CASE_STORE_FILE: path.join(tmpDir, "cases.sqlite"),
  });
  api = createApi(server);
});

afterAll(async () => {
  await server.close();
  await stub.close();
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe("chat api", () => {
  async function createCase(): Promise<string> {
    const file = createPhoto("a");
    const form = new FormData();
    form.append("photo", file);
    const res = await api("/api/upload", { method: "POST", body: form });
    expect(res.status).toBe(200);
    const data = (await res.json()) as { caseId: string };
    return data.caseId;
  }

  it("returns an LLM reply", async () => {
    const id = await createCase();
    const res = await api(`/api/cases/${id}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: [{ role: "user", content: "Hi" }] }),
    });
    expect(res.status).toBe(200);
    const data = (await res.json()) as { reply: { response: string } };
    expect(data.reply.response).toBe("hello");
    expect(stub.requests.length).toBeGreaterThan(0);
  });
});
