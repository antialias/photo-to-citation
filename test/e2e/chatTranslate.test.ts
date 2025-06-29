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
  stub = await startOpenAIStub([
    { violationType: "parking", details: {}, vehicle: {}, images: {} },
    { response: { en: "hello" }, actions: [], noop: false, lang: "en" },
    "hola",
  ]);
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "e2e-chat-translate-"));
  server = await startServer(3042, {
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

describe("chat translate api", () => {
  async function createCase(): Promise<string> {
    const file = createPhoto("a");
    const form = new FormData();
    form.append("photo", file);
    const res = await api("/api/upload", { method: "POST", body: form });
    expect(res.status).toBe(200);
    const data = (await res.json()) as { caseId: string };
    return data.caseId;
  }

  it("translates a chat message", async () => {
    const id = await createCase();
    const res = await api(`/api/cases/${id}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [{ role: "user", content: "Hi" }],
        lang: "en",
      }),
    });
    expect(res.status).toBe(200);
    const data = (await res.json()) as {
      reply: { response: Record<string, string> };
    };
    const text = data.reply.response.en;
    const tr = await api(`/api/cases/${id}/chat/translate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, lang: "es" }),
    });
    expect(tr.status).toBe(200);
    const t = (await tr.json()) as { translation: string };
    expect(t.translation).toBe("hola");
    expect(stub.requests.length).toBeGreaterThan(1);
  });
});
