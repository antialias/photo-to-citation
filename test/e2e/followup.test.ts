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
  stub = await startOpenAIStub({ subject: "s", body: "b" });
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "e2e-"));
  process.env.CASE_STORE_FILE = path.join(tmpDir, "cases.json");
  process.env.OPENAI_BASE_URL = stub.url;
  server = await startServer();
}, 30000);

afterAll(async () => {
  await server.close();
  await stub.close();
  fs.rmSync(tmpDir, { recursive: true, force: true });
  process.env.CASE_STORE_FILE = undefined;
  process.env.OPENAI_BASE_URL = undefined;
}, 30000);

describe("follow up", () => {
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

  it("passes prior emails to openai", async () => {
    const id = await createCase();
    const caseFile = path.join(tmpDir, "cases.json");
    const list = JSON.parse(fs.readFileSync(caseFile, "utf8")) as Array<
      Record<string, unknown>
    >;
    const c = list.find((n) => n.id === id);
    c.sentEmails = [
      {
        subject: "orig",
        body: "first message",
        attachments: [],
        sentAt: new Date().toISOString(),
      },
    ];
    fs.writeFileSync(caseFile, JSON.stringify(list, null, 2));

    const res = await fetch(`${server.url}/api/cases/${id}/followup`);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.email.subject).toBe("s");
    expect(stub.requests[0].body.messages[1].content).toContain(
      "first message",
    );
  }, 30000);
});
