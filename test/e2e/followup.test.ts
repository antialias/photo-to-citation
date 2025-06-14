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
  stub = await startOpenAIStub([
    {
      violationType: "parking",
      details: "car parked illegally",
      vehicle: {},
      images: {},
    },
    { subject: "s", body: "b" },
  ]);
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "e2e-"));
  const env = {
    CASE_STORE_FILE: path.join(tmpDir, "cases.json"),
    VIN_SOURCE_FILE: path.join(tmpDir, "vinSources.json"),
    OPENAI_BASE_URL: stub.url,
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
  server = await startServer(3005, env);
}, 120000);

afterAll(async () => {
  await server.close();
  await stub.close();
  fs.rmSync(tmpDir, { recursive: true, force: true });
}, 120000);

describe("follow up", () => {
  async function createCase(): Promise<string> {
    const file = new File([Buffer.from("a")], "a.jpg", { type: "image/jpeg" });
    const form = new FormData();
    form.append("photo", file);
    for (let i = 0; i < 20; i++) {
      const res = await fetch(`${server.url}/api/upload`, {
        method: "POST",
        body: form,
      });
      if (res.status === 200) {
        const data = (await res.json()) as { caseId: string };
        return data.caseId;
      }
      await new Promise((r) => setTimeout(r, 500));
    }
    const final = await fetch(`${server.url}/api/upload`, {
      method: "POST",
      body: form,
    });
    const data = (await final.json()) as { caseId: string };
    return data.caseId;
  }

  async function fetchFollowup(id: string): Promise<Response> {
    for (let i = 0; i < 20; i++) {
      const res = await fetch(`${server.url}/api/cases/${id}/followup`);
      if (res.status === 200) return res;
      await new Promise((r) => setTimeout(r, 500));
    }
    return fetch(`${server.url}/api/cases/${id}/followup`);
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

    const res = await fetchFollowup(id);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.email.subject).toBe("s");
    const request = stub.requests.at(-1) as {
      body: { messages: Array<{ content: string }> };
    };
    expect(request.body.messages[1].content).toContain("first message");
  }, 30000);

  it("includes owner info when requested", async () => {
    const id = await createCase();
    const caseFile = path.join(tmpDir, "cases.json");
    const list = JSON.parse(fs.readFileSync(caseFile, "utf8")) as Array<
      Record<string, unknown>
    >;
    const c = list.find((n) => n.id === id) as Record<string, unknown>;
    c.sentEmails = [
      {
        to: "police@oak-park.us",
        subject: "orig",
        body: "first message",
        attachments: [],
        sentAt: new Date(Date.now() - 1000).toISOString(),
      },
    ];
    c.threadImages = [
      {
        id: "t1",
        url: "/up/t1.jpg",
        uploadedAt: new Date().toISOString(),
        ocrText: "owner info",
        ocrInfo: { contact: "Joe Smith" },
      },
    ];
    fs.writeFileSync(caseFile, JSON.stringify(list, null, 2));

    const res = await fetch(`${server.url}/api/cases/${id}/followup?owner=1`);
    expect(res.status).toBe(200);
    const request = stub.requests.at(-1) as {
      body: { messages: Array<{ content: string }> };
    };
    expect(request.body.messages.at(-1)?.content).toContain("Joe Smith");
  }, 30000);
});
