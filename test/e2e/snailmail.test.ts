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
    details: "car parked illegally",
    vehicle: {},
    images: {},
  });
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "e2e-snail-"));
  const env: NodeJS.ProcessEnv & {
    CASE_STORE_FILE: string;
    VIN_SOURCE_FILE: string;
    OPENAI_BASE_URL: string;
    SNAIL_MAIL_PROVIDER_FILE: string;
    SNAIL_MAIL_FILE: string;
    SNAIL_MAIL_OUT_DIR: string;
    RETURN_ADDRESS: string;
    SNAIL_MAIL_PROVIDER: string;
    NODE_ENV: string;
  } = {
    CASE_STORE_FILE: path.join(tmpDir, "cases.json"),
    VIN_SOURCE_FILE: path.join(tmpDir, "vinSources.json"),
    OPENAI_BASE_URL: stub.url,
    SNAIL_MAIL_PROVIDER_FILE: path.join(tmpDir, "providers.json"),
    SNAIL_MAIL_FILE: path.join(tmpDir, "snailMail.json"),
    SNAIL_MAIL_OUT_DIR: path.join(tmpDir, "out"),
    RETURN_ADDRESS: "Me\n1 A St\nTown, ST 12345",
    SNAIL_MAIL_PROVIDER: "file",
    NODE_ENV: "test",
  };
  fs.writeFileSync(
    env.VIN_SOURCE_FILE,
    JSON.stringify(
      [
        { id: "edmunds", enabled: false, failureCount: 0 },
        { id: "carfax", enabled: false, failureCount: 0 },
      ],
      null,
      2,
    ),
  );
  fs.writeFileSync(
    env.SNAIL_MAIL_PROVIDER_FILE,
    JSON.stringify(
      [
        { id: "file", active: true, failureCount: 0 },
        { id: "mock", active: false, failureCount: 0 },
      ],
      null,
      2,
    ),
  );
  server = await startServer(3008, env);
}, 120000);

afterAll(async () => {
  await server.close();
  await stub.close();
  fs.rmSync(tmpDir, { recursive: true, force: true });
}, 120000);

describe("snail mail providers", () => {
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

  it("lists providers", async () => {
    const res = await fetch(`${server.url}/api/snail-mail-providers`);
    expect(res.status).toBe(200);
    const list = (await res.json()) as Array<{ id: string; active: boolean }>;
    expect(Array.isArray(list)).toBe(true);
    expect(list.some((p) => p.id === "file")).toBe(true);
  }, 30000);

  it("activates a provider", async () => {
    const res = await fetch(`${server.url}/api/snail-mail-providers/mock`, {
      method: "PUT",
    });
    expect(res.status).toBe(200);
    const list = (await res.json()) as Array<{ id: string; active: boolean }>;
    const active = list.find((p) => p.active);
    expect(active?.id).toBe("mock");
  }, 30000);

  it("returns 404 for unknown provider", async () => {
    const res = await fetch(`${server.url}/api/snail-mail-providers/none`, {
      method: "PUT",
    });
    expect(res.status).toBe(404);
  }, 30000);

  it("sends snail mail followup", async () => {
    const id = await createCase();
    const res = await fetch(`${server.url}/api/cases/${id}/followup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subject: "s",
        body: "b",
        attachments: [],
        snailMail: true,
      }),
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.results.snailMail.success).toBe(true);
    const stored = JSON.parse(
      fs.readFileSync(path.join(tmpDir, "snailMail.json"), "utf8"),
    );
    expect(stored).toHaveLength(1);
  }, 30000);
});
